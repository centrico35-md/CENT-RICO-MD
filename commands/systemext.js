const os = require('os');
const fs = require('fs');
const path = require('path');
const { isOwner } = require('../lib/permissions');

module.exports = [
  {
    cmd: 'cpu',
    run: async (sock, msg, jid) => {
      const load = os.loadavg();
      await sock.sendMessage(jid, { text: `🧮 Load avg (1/5/15m): ${load.map((n) => n.toFixed(2)).join(' / ')}\nCores: ${os.cpus().length}` }, { quoted: msg });
    },
  },
  {
    cmd: 'ram',
    run: async (sock, msg, jid) => {
      const free = (os.freemem() / 1024 / 1024).toFixed(0);
      const total = (os.totalmem() / 1024 / 1024).toFixed(0);
      await sock.sendMessage(jid, { text: `💾 RAM: ${total - free} MB used / ${total} MB total` }, { quoted: msg });
    },
  },
  {
    cmd: 'storage',
    run: async (sock, msg, jid) => {
      await sock.sendMessage(jid, { text: 'Disk stats need a platform-specific check (df on Linux) — not wired up by default in this build.' }, { quoted: msg });
    },
  },
  {
    cmd: 'pinglatency',
    run: async (sock, msg, jid) => {
      const start = Date.now();
      const sent = await sock.sendMessage(jid, { text: 'Measuring…' }, { quoted: msg });
      await sock.sendMessage(jid, { text: `🏓 ${Date.now() - start}ms`, edit: sent.key });
    },
  },
  {
    cmd: 'cleartmp',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!isOwner(senderJid)) return sock.sendMessage(jid, { text: 'Owner-only command.' }, { quoted: msg });
      const tmp = os.tmpdir();
      let count = 0;
      for (const f of fs.readdirSync(tmp)) {
        if (f.startsWith('in-') || f.startsWith('out-')) {
          try { fs.unlinkSync(path.join(tmp, f)); count++; } catch {}
        }
      }
      await sock.sendMessage(jid, { text: `Cleared ${count} temp file(s).` }, { quoted: msg });
    },
  },
  {
    cmd: 'updatebot',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!isOwner(senderJid)) return sock.sendMessage(jid, { text: 'Owner-only command.' }, { quoted: msg });
      await sock.sendMessage(
        jid,
        { text: 'Auto-update needs the host to run `git pull && npm install` and restart the process — not wired up automatically, since that depends on your deploy setup (Render redeploys from GitHub pushes automatically instead).' },
        { quoted: msg }
      );
    },
  },
];
