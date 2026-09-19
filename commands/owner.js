const store = require('../lib/store');
const { isOwner } = require('../lib/permissions');

function requireOwner(sock, msg, jid, senderJid) {
  if (!isOwner(senderJid)) {
    sock.sendMessage(jid, { text: 'Owner-only command.' }, { quoted: msg });
    return false;
  }
  return true;
}

function targetJid(msg, args) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (mentioned?.length) return mentioned[0];
  const digits = (args[0] || '').replace(/\D/g, '');
  return digits ? `${digits}@s.whatsapp.net` : null;
}

module.exports = [
  {
    cmd: 'restart',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!requireOwner(sock, msg, jid, senderJid)) return;
      await sock.sendMessage(jid, { text: 'Restarting…' }, { quoted: msg });
      process.exit(0); // rely on a process manager (pm2/systemd) to restart it
    },
  },
  {
    cmd: 'shutdown',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!requireOwner(sock, msg, jid, senderJid)) return;
      await sock.sendMessage(jid, { text: 'Shutting down.' }, { quoted: msg });
      process.exit(0);
    },
  },
  {
    cmd: 'broadcast',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!requireOwner(sock, msg, jid, senderJid)) return;
      const text = args.join(' ');
      if (!text) return sock.sendMessage(jid, { text: 'Usage: .broadcast <text>' }, { quoted: msg });
      const chats = await sock.groupFetchAllParticipating();
      const jids = Object.keys(chats);
      for (const gid of jids) {
        await sock.sendMessage(gid, { text: `📢 *Broadcast*\n\n${text}` });
      }
      await sock.sendMessage(jid, { text: `Broadcast sent to ${jids.length} group(s).` }, { quoted: msg });
    },
  },
  {
    cmd: 'addowner',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!requireOwner(sock, msg, jid, senderJid)) return;
      const target = targetJid(msg, args);
      if (!target) return sock.sendMessage(jid, { text: 'Tag or give a number to add as owner.' }, { quoted: msg });
      const s = store.get();
      store.set({ extraOwners: [...new Set([...s.extraOwners, target])] });
      await sock.sendMessage(jid, { text: `@${target.split('@')[0]} added as an owner.`, mentions: [target] }, { quoted: msg });
    },
  },
  {
    cmd: 'delowner',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!requireOwner(sock, msg, jid, senderJid)) return;
      const target = targetJid(msg, args);
      if (!target) return sock.sendMessage(jid, { text: 'Tag or give a number to remove.' }, { quoted: msg });
      const s = store.get();
      store.set({ extraOwners: s.extraOwners.filter((o) => o !== target) });
      await sock.sendMessage(jid, { text: `@${target.split('@')[0]} removed as an owner.`, mentions: [target] }, { quoted: msg });
    },
  },
  {
    cmd: 'banuser',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!requireOwner(sock, msg, jid, senderJid)) return;
      const target = targetJid(msg, args);
      if (!target) return sock.sendMessage(jid, { text: 'Tag or give a number to ban.' }, { quoted: msg });
      const s = store.get();
      store.set({ banned: [...new Set([...s.banned, target])] });
      await sock.sendMessage(jid, { text: `@${target.split('@')[0]} banned from using the bot.`, mentions: [target] }, { quoted: msg });
    },
  },
  {
    cmd: 'unbanuser',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!requireOwner(sock, msg, jid, senderJid)) return;
      const target = targetJid(msg, args);
      if (!target) return sock.sendMessage(jid, { text: 'Tag or give a number to unban.' }, { quoted: msg });
      const s = store.get();
      store.set({ banned: s.banned.filter((b) => b !== target) });
      await sock.sendMessage(jid, { text: `@${target.split('@')[0]} unbanned.`, mentions: [target] }, { quoted: msg });
    },
  },
  {
    cmd: 'block',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!requireOwner(sock, msg, jid, senderJid)) return;
      const target = targetJid(msg, args);
      if (!target) return sock.sendMessage(jid, { text: 'Tag or give a number to block.' }, { quoted: msg });
      await sock.updateBlockStatus(target, 'block');
      await sock.sendMessage(jid, { text: `Blocked @${target.split('@')[0]}.`, mentions: [target] }, { quoted: msg });
    },
  },
  {
    cmd: 'unblock',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!requireOwner(sock, msg, jid, senderJid)) return;
      const target = targetJid(msg, args);
      if (!target) return sock.sendMessage(jid, { text: 'Tag or give a number to unblock.' }, { quoted: msg });
      await sock.updateBlockStatus(target, 'unblock');
      await sock.sendMessage(jid, { text: `Unblocked @${target.split('@')[0]}.`, mentions: [target] }, { quoted: msg });
    },
  },
  {
    cmd: 'clearsession',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!requireOwner(sock, msg, jid, senderJid)) return;
      await sock.sendMessage(
        jid,
        { text: 'To fully clear the session, stop the bot and delete the ./auth folder, then restart and re-pair.' },
        { quoted: msg }
      );
    },
  },
];
