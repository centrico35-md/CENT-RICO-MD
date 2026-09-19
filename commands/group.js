const { isGroupAdmin } = require('../lib/permissions');

function mentionedJid(msg, args) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (mentioned?.length) return mentioned[0];
  const digits = (args[0] || '').replace(/\D/g, '');
  return digits ? `${digits}@s.whatsapp.net` : null;
}

async function requireGroupAdmin(sock, msg, jid, senderJid) {
  if (!jid.endsWith('@g.us')) {
    await sock.sendMessage(jid, { text: 'This command only works inside a group.' }, { quoted: msg });
    return false;
  }
  if (!(await isGroupAdmin(sock, jid, senderJid))) {
    await sock.sendMessage(jid, { text: 'Only group admins can use this command.' }, { quoted: msg });
    return false;
  }
  return true;
}

module.exports = [
  {
    cmd: 'kick',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const target = mentionedJid(msg, args);
      if (!target) return sock.sendMessage(jid, { text: 'Tag or give a number to kick.' }, { quoted: msg });
      await sock.groupParticipantsUpdate(jid, [target], 'remove');
    },
  },
  {
    cmd: 'add',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const digits = (args[0] || '').replace(/\D/g, '');
      if (!digits) return sock.sendMessage(jid, { text: 'Usage: .add 234...' }, { quoted: msg });
      await sock.groupParticipantsUpdate(jid, [`${digits}@s.whatsapp.net`], 'add');
    },
  },
  {
    cmd: 'promote',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const target = mentionedJid(msg, args);
      if (!target) return sock.sendMessage(jid, { text: 'Tag a member to promote.' }, { quoted: msg });
      await sock.groupParticipantsUpdate(jid, [target], 'promote');
    },
  },
  {
    cmd: 'demote',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const target = mentionedJid(msg, args);
      if (!target) return sock.sendMessage(jid, { text: 'Tag a member to demote.' }, { quoted: msg });
      await sock.groupParticipantsUpdate(jid, [target], 'demote');
    },
  },
  {
    cmd: 'mute',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      await sock.groupSettingUpdate(jid, 'announcement');
      await sock.sendMessage(jid, { text: 'Group muted — only admins can send messages.' }, { quoted: msg });
    },
  },
  {
    cmd: 'unmute',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      await sock.groupSettingUpdate(jid, 'not_announcement');
      await sock.sendMessage(jid, { text: 'Group unmuted — everyone can send messages.' }, { quoted: msg });
    },
  },
  {
    cmd: 'lock',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      await sock.groupSettingUpdate(jid, 'locked');
      await sock.sendMessage(jid, { text: 'Group info locked — only admins can edit it.' }, { quoted: msg });
    },
  },
  {
    cmd: 'unlock',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      await sock.groupSettingUpdate(jid, 'unlocked');
      await sock.sendMessage(jid, { text: 'Group info unlocked.' }, { quoted: msg });
    },
  },
  {
    cmd: 'tagall',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const metadata = await sock.groupMetadata(jid);
      const participants = metadata.participants.map((p) => p.id);
      const text = `📢 *Attention everyone*\n\n${participants.map((id) => `@${id.split('@')[0]}`).join('\n')}`;
      await sock.sendMessage(jid, { text, mentions: participants }, { quoted: msg });
    },
  },
  {
    cmd: 'hidetag',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const metadata = await sock.groupMetadata(jid);
      const participants = metadata.participants.map((p) => p.id);
      const text = args.join(' ') || '\u200b';
      await sock.sendMessage(jid, { text, mentions: participants }, { quoted: msg });
    },
  },
  {
    cmd: 'admins',
    run: async (sock, msg, jid) => {
      if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: 'Groups only.' }, { quoted: msg });
      const metadata = await sock.groupMetadata(jid);
      const admins = metadata.participants.filter((p) => p.admin);
      const text = `👑 *Admins*\n\n${admins.map((a) => `@${a.id.split('@')[0]}`).join('\n')}`;
      await sock.sendMessage(jid, { text, mentions: admins.map((a) => a.id) }, { quoted: msg });
    },
  },
  {
    cmd: 'setgname',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const name = args.join(' ');
      if (!name) return sock.sendMessage(jid, { text: 'Usage: .setgname <name>' }, { quoted: msg });
      await sock.groupUpdateSubject(jid, name);
    },
  },
  {
    cmd: 'setgdesc',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const desc = args.join(' ');
      if (!desc) return sock.sendMessage(jid, { text: 'Usage: .setgdesc <description>' }, { quoted: msg });
      await sock.groupUpdateDescription(jid, desc);
    },
  },
  {
    cmd: 'grouplink',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const code = await sock.groupInviteCode(jid);
      await sock.sendMessage(jid, { text: `https://chat.whatsapp.com/${code}` }, { quoted: msg });
    },
  },
  {
    cmd: 'resetlink',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const code = await sock.groupRevokeInvite(jid);
      await sock.sendMessage(jid, { text: `New link: https://chat.whatsapp.com/${code}` }, { quoted: msg });
    },
  },
];
