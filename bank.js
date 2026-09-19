const store = require('../lib/store');

// Simple in-bot virtual currency ("aza") — not connected to any real
// payment rail, bank account, or cryptocurrency. It's just a number
// stored per user for games/fun leaderboard use.
module.exports = [
  {
    cmd: 'setaza',
    run: async (sock, msg, jid, args, senderJid) => {
      const amount = Number(args[0]);
      if (!Number.isFinite(amount) || amount < 0) {
        return sock.sendMessage(jid, { text: 'Usage: /setaza <amount>' }, { quoted: msg });
      }
      store.setAza(senderJid, amount);
      await sock.sendMessage(jid, { text: `💰 Your aza balance is now *${amount}*.` }, { quoted: msg });
    },
  },
  {
    cmd: 'aza',
    run: async (sock, msg, jid, args, senderJid) => {
      await sock.sendMessage(jid, { text: `💰 Your aza balance: *${store.azaOf(senderJid)}*` }, { quoted: msg });
    },
  },
];
