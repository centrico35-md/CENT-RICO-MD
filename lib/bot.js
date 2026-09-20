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
const { isOwner, isBanned } = require('./permissions');
const { state } = require('./connectionState');

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
    if (qr) {
      state.qr = qr;
      state.status = 'awaiting_pairing';
    }
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      state.status = 'disconnected';
      if (!loggedOut) startSocket({ onPairingCode });
    } else if (connection === 'open') {
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

    // Group badword filter + link filter + keyword auto-reactions.
    // Runs on every group message except the bot/owner's own, not just commands.
    if (jid.endsWith('@g.us') && text && !msg.key.fromMe) {
      const s = store.get();
      const g = s.groups?.[jid];
      if (g) {
        const lower = text.toLowerCase();
        if (g.antilink && /(chat\.whatsapp\.com|https?:\/\/)/i.test(text) && !(await isOwner(senderJid))) {
          try {
            await sock.sendMessage(jid, { delete: msg.key });
          } catch {
            /* bot may not be admin; ignore */
          }
        }
        if (g.badwords?.some((w) => lower.includes(w))) {
          try {
            await sock.sendMessage(jid, { delete: msg.key });
          } catch {
            /* ignore */
          }
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
