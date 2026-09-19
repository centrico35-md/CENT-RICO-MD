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
  {
    cmd: 'balcheck',
    run: async (sock, msg, jid, args, senderJid) => {
      await sock.sendMessage(jid, { text: `💰 Balance: *${store.azaOf(senderJid)}* aza` }, { quoted: msg });
    },
  },
  {
    cmd: 'banklist',
    run: async (sock, msg, jid) => {
      const s = store.get();
      const entries = Object.entries(s.aza).sort((a, b) => b[1] - a[1]).slice(0, 10);
      const text = entries.length
        ? entries.map(([j, amt], i) => `${i + 1}. @${j.split('@')[0]} — ${amt}`).join('\n')
        : 'No balances yet.';
      await sock.sendMessage(jid, { text: `🏦 *Top balances*\n${text}`, mentions: entries.map((e) => e[0]) }, { quoted: msg });
    },
  },
  {
    cmd: 'transfer',
    run: async (sock, msg, jid, args, senderJid) => {
      const amount = Number(args[0]);
      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const target = mentioned || (args[1] ? `${args[1].replace(/\D/g, '')}@s.whatsapp.net` : null);
      if (!Number.isFinite(amount) || amount <= 0 || !target) {
        return sock.sendMessage(jid, { text: 'Usage: .transfer <amount> <@user or number>' }, { quoted: msg });
      }
      const senderBal = store.azaOf(senderJid);
      if (senderBal < amount) return sock.sendMessage(jid, { text: 'Insufficient balance.' }, { quoted: msg });
      store.setAza(senderJid, senderBal - amount);
      store.setAza(target, store.azaOf(target) + amount);
      await sock.sendMessage(
        jid,
        { text: `✅ Transferred ${amount} aza to @${target.split('@')[0]}.`, mentions: [target] },
        { quoted: msg }
      );
    },
  },
];
