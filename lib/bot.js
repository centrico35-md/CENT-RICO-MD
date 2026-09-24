const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const config = require('../config');
const store = require('./store');
const { isOwner, isBanned, isGroupAdmin } = require('./permissions');
const { state } = require('./connectionState');
const { trivia } = require('./games');

function setGroupPatch(jid, patch) {
  const s = store.get();
  const groups = { ...(s.groups || {}) };
  groups[jid] = { ...(groups[jid] || {}), ...patch };
  store.set({ groups });
}

const logger = pino({ level: 'silent' });

// Load every command group in ../commands. Each file exports either a
// single { cmd, run } handler or an array of them.
function loadCommands() {
  const map = new Map();
  const dir = path.join(__dirname, '..', 'commands');
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.js')) continue;
    const exported = require(path.join(dir, file));
    const handlers = Array.isArray(exported) ? exported : [exported];
    for (const h of handlers) map.set(h.cmd, h);
  }
  return map;
}

const commands = loadCommands();
state.commandCount = commands.size;

function extractText(msg) {
  const m = msg.message;
  if (!m) return '';
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    ''
  );
}

function matchPrefix(text) {
  for (const p of config.PREFIXES) {
    if (text.startsWith(p)) return p;
  }
  return null;
}

async function startSocket({ onPairingCode } = {}) {
  state.status = 'connecting';
  const { state: authState, saveCreds } = await useMultiFileAuthState(
    path.join(__dirname, '..', 'auth')
  );
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: authState,
    logger,
    printQRInTerminal: false,
  });
  state.sock = sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    console.log('[connection.update]', connection || (qr ? 'qr-issued' : 'update'));
    if (qr) {
      state.qr = qr;
      state.status = 'awaiting_pairing';
    }
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      console.log('[connection.update] closed, statusCode=', statusCode, 'loggedOut=', loggedOut);
      state.status = 'disconnected';
      if (!loggedOut) startSocket({ onPairingCode });
    } else if (connection === 'open') {
      console.log('[connection.update] OPEN — bot is connected as', sock.user?.id);
      state.status = 'connected';
      state.qr = null;
    }
  });

  // Welcome/goodbye messages for group join/leave events
  sock.ev.on('group-participants.update', async (update) => {
    const s = store.get();
    const g = s.groups?.[update.id];
    if (!g) return;
    for (const participant of update.participants) {
      const mention = `@${participant.split('@')[0]}`;
      if (update.action === 'add' && g.welcomeOn) {
        const text = (g.welcomeText || 'Welcome {user}!').replace('{user}', mention);
        await sock.sendMessage(update.id, { text, mentions: [participant] });
      }
      if (update.action === 'remove' && g.goodbyeText) {
        const text = g.goodbyeText.replace('{user}', mention);
        await sock.sendMessage(update.id, { text, mentions: [participant] });
      }
    }
  });

  // Auto-decline/block incoming calls per the .anticall setting
  sock.ev.on('call', async (calls) => {
    const mode = store.get().anticall;
    if (!mode || mode === 'off') return;
    for (const c of calls) {
      if (c.status !== 'offer') continue;
      try {
        await sock.rejectCall(c.id, c.from);
        if (mode === 'block') await sock.updateBlockStatus(c.from, 'block');
      } catch {
        /* ignore */
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message) return;

    const jid = msg.key.remoteJid;
    const senderJid = msg.key.participant || jid;
    const text = extractText(msg).trim();
    console.log('[message]', 'from', senderJid, 'in', jid, 'fromMe=', msg.key.fromMe, 'text=', JSON.stringify(text));

    // Trivia answer check — plain text, no prefix needed.
    const activeTrivia = trivia.get(jid);
    if (activeTrivia && text && text.toLowerCase().trim() === activeTrivia.answer) {
      trivia.delete(jid);
      await sock.sendMessage(jid, { text: `✅ Correct! The answer was "${activeTrivia.answer}".` });
    }

    // Group badword filter + link filter + keyword auto-reactions + content-type filters.
    // Runs on every group message except the bot/owner's own, not just commands.
    if (jid.endsWith('@g.us') && !msg.key.fromMe) {
      const s = store.get();
      const g = s.groups?.[jid];
      if (g) {
        const lower = (text || '').toLowerCase();
        const senderIsAdmin = await isGroupAdmin(sock, jid, senderJid);
        const del = async () => {
          try { await sock.sendMessage(jid, { delete: msg.key }); } catch { /* bot may not be admin */ }
        };

        if (g.antilink && text && /(chat\.whatsapp\.com|https?:\/\/)/i.test(text) && !senderIsAdmin) await del();

        if (g.badwords?.some((w) => lower.includes(w)) && !senderIsAdmin) {
          await del();
          const strikesObj = { ...(g.strikes || {}) };
          strikesObj[senderJid] = (strikesObj[senderJid] || 0) + 1;
          setGroupPatch(jid, { strikes: strikesObj });
          if (strikesObj[senderJid] >= 3) {
            try {
              await sock.groupParticipantsUpdate(jid, [senderJid], 'remove');
              await sock.sendMessage(jid, { text: `@${senderJid.split('@')[0]} removed after repeated rule violations.`, mentions: [senderJid] });
            } catch { /* bot may not be admin */ }
          }
        }

        if (!senderIsAdmin) {
          const m = msg.message || {};
          if (g.antisticker && m.stickerMessage) await del();
          if (g.antivoice && m.audioMessage?.ptt) await del();
          if (g.antifile && m.documentMessage) await del();
          if (g.antiphoto && m.imageMessage) await del();
          if (g.antivideo && m.videoMessage && !m.videoMessage.gifPlayback) await del();
          if (g.antigif && m.videoMessage?.gifPlayback) await del();
          if (g.antipoll && m.pollCreationMessage) await del();
          if (g.antiforwarded && msg.message?.extendedTextMessage?.contextInfo?.isForwarded) await del();
          if (g.antilocation && (m.locationMessage || m.liveLocationMessage)) await del();
          if (g.anticontact && (m.contactMessage || m.contactsArrayMessage)) await del();
          if (g.antitag) {
            const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (mentions.length > 5) await del();
          }
          if (g.antiemoji && text && /^[\p{Emoji}\s]+$/u.test(text) && text.trim().length > 0) await del();
          if (g.antibeg && text && /(send me money|gift me|please\s+(gift|donate)|need\s+money\s+urgent)/i.test(text)) await del();
        }

        if (g.reacts) {
          for (const [keyword, emoji] of Object.entries(g.reacts)) {
            if (lower.includes(keyword)) {
              await sock.sendMessage(jid, { react: { text: emoji, key: msg.key } });
              break;
            }
          }
        }
      }
    }

    const prefix = matchPrefix(text);
    if (!prefix) return;
    if (isBanned(senderJid) && !isOwner(senderJid)) return;

    const [rawCmd, ...args] = text.slice(prefix.length).split(/\s+/);
    const handler = commands.get(rawCmd.toLowerCase());
    console.log('[command]', rawCmd, handler ? 'FOUND' : 'NOT FOUND');
    if (!handler) return;

    try {
      await handler.run(sock, msg, jid, args, senderJid);
    } catch (err) {
      console.error(`Command "${rawCmd}" failed:`, err);
      await sock.sendMessage(
        jid,
        { text: `⚠️ Something went wrong running ${prefix}${rawCmd}.` },
        { quoted: msg }
      );
    }
  });

  return sock;
}

// Called by the web server once a visitor submits a phone number.
async function requestPairingCode(phone) {
  if (!state.sock) throw new Error('Bot socket is not initialised yet.');
  const digits = phone.replace(/\D/g, '');
  if (!digits) throw new Error('Enter a valid number with country code.');
  return state.sock.requestPairingCode(digits);
}

module.exports = { startSocket, requestPairingCode, commands };
module.exports.getStatus = require('./connectionState').getStatus;
