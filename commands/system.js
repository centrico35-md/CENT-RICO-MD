const os = require('os');
const config = require('../config');
const store = require('../lib/store');
const { isOwner } = require('../lib/permissions');
const { formatUptime } = require('../lib/uptime');

module.exports = [
  {
    cmd: 'uptime',
    run: async (sock, msg, jid) => {
      await sock.sendMessage(jid, { text: `⏱️ Uptime: ${formatUptime(process.uptime())}` }, { quoted: msg });
    },
  },
  {
    cmd: 'sysinfo',
    run: async (sock, msg, jid) => {
      const text =
        `🖥️ *System Info*\n` +
        `Platform: ${os.platform()} ${os.release()}\n` +
        `CPU cores: ${os.cpus().length}\n` +
        `Free memory: ${(os.freemem() / 1024 / 1024).toFixed(0)} MB\n` +
        `Node: ${process.version}`;
      await sock.sendMessage(jid, { text }, { quoted: msg });
    },
  },
  {
    cmd: 'ping',
    run: async (sock, msg, jid) => {
      const start = Date.now();
      const sent = await sock.sendMessage(jid, { text: 'Pinging…' }, { quoted: msg });
      const ms = Date.now() - start;
      await sock.sendMessage(jid, { text: `🏓 Pong! ${ms}ms`, edit: sent.key });
    },
  },
  {
    cmd: 'anticall',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!isOwner(senderJid)) return sock.sendMessage(jid, { text: 'Owner-only command.' }, { quoted: msg });
      const val = (args[0] || '').toLowerCase();
      if (!['block', 'decline', 'off'].includes(val)) {
        return sock.sendMessage(jid, { text: 'Usage: .anticall <block|decline|off>' }, { quoted: msg });
      }
      store.set({ anticall: val });
      await sock.sendMessage(jid, { text: `Anticall set to *${val}*.` }, { quoted: msg });
    },
  },
  {
    cmd: 'owner',
    run: async (sock, msg, jid) => {
      await sock.sendMessage(
        jid,
        {
          contacts: {
            displayName: config.OWNER_NAME,
            contacts: [
              {
                vcard:
                  `BEGIN:VCARD\nVERSION:3.0\nFN:${config.OWNER_NAME}\n` +
                  `TEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER}:+${config.OWNER_NUMBER}\nEND:VCARD`,
              },
            ],
          },
        },
        { quoted: msg }
      );
    },
  },
];
