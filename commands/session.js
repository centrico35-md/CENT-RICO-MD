const { isOwner } = require('../lib/permissions');
const { getStatus } = require('../lib/connectionState');

module.exports = [
  {
    cmd: 'session',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!isOwner(senderJid)) return sock.sendMessage(jid, { text: 'Owner-only command.' }, { quoted: msg });
      const s = getStatus();
      await sock.sendMessage(
        jid,
        { text: `📶 Session status: *${s.status}*\nLinked number: ${s.connectedNumber ? '+' + s.connectedNumber : 'none'}` },
        { quoted: msg }
      );
    },
  },
  {
    cmd: 'authstatus',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!isOwner(senderJid)) return sock.sendMessage(jid, { text: 'Owner-only command.' }, { quoted: msg });
      const s = getStatus();
      await sock.sendMessage(jid, { text: `🔐 Auth: ${s.status === 'connected' ? 'valid & connected' : s.status}` }, { quoted: msg });
    },
  },
  {
    cmd: 'reconnect',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!isOwner(senderJid)) return sock.sendMessage(jid, { text: 'Owner-only command.' }, { quoted: msg });
      await sock.sendMessage(jid, { text: 'Reconnecting — the bot will drop and re-establish the connection.' }, { quoted: msg });
      sock.end(new Error('manual reconnect'));
    },
  },
  {
    cmd: 'disconnect',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!isOwner(senderJid)) return sock.sendMessage(jid, { text: 'Owner-only command.' }, { quoted: msg });
      await sock.sendMessage(jid, { text: 'Disconnecting this session.' }, { quoted: msg });
      await sock.logout();
    },
  },
  {
    cmd: 'connect',
    run: async (sock, msg, jid) => {
      const s = getStatus();
      await sock.sendMessage(
        jid,
        { text: s.status === 'connected' ? 'Already connected.' : `Status: ${s.status}. Pair again from the website if disconnected.` },
        { quoted: msg }
      );
    },
  },
];
