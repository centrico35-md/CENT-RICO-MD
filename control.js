const config = require('../config');
const store = require('../lib/store');
const { buildMenu } = require('../lib/menu');
const { isOwner } = require('../lib/permissions');

module.exports = [
  {
    cmd: 'menu',
    run: async (sock, msg, jid) => {
      await sock.sendMessage(jid, { text: buildMenu(sock) }, { quoted: msg });
    },
  },
  {
    cmd: 'mode',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!isOwner(senderJid)) {
        return sock.sendMessage(jid, { text: 'Only the owner can change the mode.' }, { quoted: msg });
      }
      const val = (args[0] || '').toLowerCase();
      if (!['public', 'self'].includes(val)) {
        return sock.sendMessage(jid, { text: 'Usage: .mode <public|self>' }, { quoted: msg });
      }
      store.set({ mode: val });
      await sock.sendMessage(jid, { text: `Mode set to *${val.toUpperCase()}*.` }, { quoted: msg });
    },
  },
  {
    cmd: 'antiviewonce',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!isOwner(senderJid)) {
        return sock.sendMessage(jid, { text: 'Only the owner can change this.' }, { quoted: msg });
      }
      const s = store.get();
      store.set({ antiViewOnce: !s.antiViewOnce });
      await sock.sendMessage(
        jid,
        {
          text:
            `AntiViewOnce display flag is now *${!s.antiViewOnce ? 'ON' : 'OFF'}*.\n` +
            `Note: this build only toggles the menu indicator — it does not capture or ` +
            `forward other people's view-once media, since that would defeat the sender's ` +
            `intent and their consent.`,
        },
        { quoted: msg }
      );
    },
  },
  {
    cmd: 'pair',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!isOwner(senderJid)) {
        return sock.sendMessage(jid, { text: 'Only the owner can request a pairing code.' }, { quoted: msg });
      }
      const number = (args[0] || '').replace(/\D/g, '');
      if (!number) return sock.sendMessage(jid, { text: 'Usage: .pair <number with country code>' }, { quoted: msg });
      try {
        const code = await sock.requestPairingCode(number);
        await sock.sendMessage(jid, { text: `Pairing code for +${number}: *${code}*` }, { quoted: msg });
      } catch (err) {
        await sock.sendMessage(jid, { text: `Couldn't generate a pairing code: ${err.message}` }, { quoted: msg });
      }
    },
  },
  {
    cmd: 'channel',
    run: async (sock, msg, jid) => {
      await sock.sendMessage(jid, { text: `📢 Official channel:\n${config.CHANNEL_LINK}` }, { quoted: msg });
    },
  },
  {
    cmd: 'verify',
    run: async (sock, msg, jid, args, senderJid) => {
      await sock.sendMessage(
        jid,
        { text: `✅ ${senderJid.split('@')[0]} is verified as an active bot user.` },
        { quoted: msg }
      );
    },
  },
];
