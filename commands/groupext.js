const store = require('../lib/store');
const { isGroupAdmin } = require('../lib/permissions');

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

function groupState(jid) {
  const s = store.get();
  return s.groups?.[jid] || {};
}
function setGroupState(jid, patch) {
  const s = store.get();
  const groups = { ...(s.groups || {}) };
  groups[jid] = { ...(groups[jid] || {}), ...patch };
  store.set({ groups });
}

module.exports = [
  {
    cmd: 'createggc',
    run: async (sock, msg, jid, args, senderJid) => {
      const name = args.join(' ');
      if (!name) return sock.sendMessage(jid, { text: 'Usage: .creategc <name>' }, { quoted: msg });
      const group = await sock.groupCreate(name, [senderJid]);
      await sock.sendMessage(jid, { text: `Group created: ${group.subject}` }, { quoted: msg });
    },
  },
  {
    cmd: 'gstatus',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const text = args.join(' ');
      if (!text) return sock.sendMessage(jid, { text: 'Usage: .gstatus <text>' }, { quoted: msg });
      await sock.groupUpdateDescription(jid, text);
      await sock.sendMessage(jid, { text: 'Group status updated.' }, { quoted: msg });
    },
  },
  {
    cmd: 'antilink',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const val = (args[0] || '').toLowerCase();
      if (!['on', 'off'].includes(val)) return sock.sendMessage(jid, { text: 'Usage: .antilink <on|off>' }, { quoted: msg });
      setGroupState(jid, { antilink: val === 'on' });
      await sock.sendMessage(jid, { text: `Antilink is now *${val.toUpperCase()}*.` }, { quoted: msg });
    },
  },
  {
    cmd: 'antispamgrp',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const val = (args[0] || '').toLowerCase();
      if (!['on', 'off'].includes(val)) return sock.sendMessage(jid, { text: 'Usage: .antispamgrp <on|off>' }, { quoted: msg });
      setGroupState(jid, { antispam: val === 'on' });
      await sock.sendMessage(jid, { text: `Group anti-spam is now *${val.toUpperCase()}*.` }, { quoted: msg });
    },
  },
  {
    cmd: 'addbadword',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const word = (args[0] || '').toLowerCase();
      if (!word) return sock.sendMessage(jid, { text: 'Usage: .addbadword <word>' }, { quoted: msg });
      const g = groupState(jid);
      const list = [...new Set([...(g.badwords || []), word])];
      setGroupState(jid, { badwords: list });
      await sock.sendMessage(jid, { text: `Added "${word}" to the filter.` }, { quoted: msg });
    },
  },
  {
    cmd: 'delbadword',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const word = (args[0] || '').toLowerCase();
      const g = groupState(jid);
      setGroupState(jid, { badwords: (g.badwords || []).filter((w) => w !== word) });
      await sock.sendMessage(jid, { text: `Removed "${word}" from the filter.` }, { quoted: msg });
    },
  },
  {
    cmd: 'listbadwords',
    run: async (sock, msg, jid) => {
      const g = groupState(jid);
      const list = g.badwords || [];
      await sock.sendMessage(jid, { text: list.length ? `🚫 Filtered words:\n${list.join(', ')}` : 'No filtered words set.' }, { quoted: msg });
    },
  },
  {
    cmd: 'addreact',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const [keyword, emoji] = args;
      if (!keyword || !emoji) return sock.sendMessage(jid, { text: 'Usage: .addreact <keyword> <emoji>' }, { quoted: msg });
      const g = groupState(jid);
      setGroupState(jid, { reacts: { ...(g.reacts || {}), [keyword.toLowerCase()]: emoji } });
      await sock.sendMessage(jid, { text: `Will react ${emoji} to messages containing "${keyword}".` }, { quoted: msg });
    },
  },
  {
    cmd: 'delreact',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const keyword = (args[0] || '').toLowerCase();
      const g = groupState(jid);
      const reacts = { ...(g.reacts || {}) };
      delete reacts[keyword];
      setGroupState(jid, { reacts });
      await sock.sendMessage(jid, { text: `Removed auto-react for "${keyword}".` }, { quoted: msg });
    },
  },
  {
    cmd: 'listreacts',
    run: async (sock, msg, jid) => {
      const g = groupState(jid);
      const reacts = g.reacts || {};
      const lines = Object.entries(reacts).map(([k, v]) => `${k} → ${v}`);
      await sock.sendMessage(jid, { text: lines.length ? lines.join('\n') : 'No auto-reacts set.' }, { quoted: msg });
    },
  },
  {
    cmd: 'welcome',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const val = (args[0] || '').toLowerCase();
      if (!['on', 'off'].includes(val)) return sock.sendMessage(jid, { text: 'Usage: .welcome <on|off>' }, { quoted: msg });
      setGroupState(jid, { welcomeOn: val === 'on' });
      await sock.sendMessage(jid, { text: `Welcome messages are now *${val.toUpperCase()}*.` }, { quoted: msg });
    },
  },
  {
    cmd: 'setwelcome',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const text = args.join(' ');
      if (!text) return sock.sendMessage(jid, { text: 'Usage: .setwelcome <text>' }, { quoted: msg });
      setGroupState(jid, { welcomeText: text });
      await sock.sendMessage(jid, { text: 'Welcome message saved.' }, { quoted: msg });
    },
  },
  {
    cmd: 'setgoodbye',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const text = args.join(' ');
      if (!text) return sock.sendMessage(jid, { text: 'Usage: .setgoodbye <text>' }, { quoted: msg });
      setGroupState(jid, { goodbyeText: text });
      await sock.sendMessage(jid, { text: 'Goodbye message saved.' }, { quoted: msg });
    },
  },
  {
    cmd: 'ginfo',
    run: async (sock, msg, jid) => {
      if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: 'Groups only.' }, { quoted: msg });
      const meta = await sock.groupMetadata(jid);
      const text =
        `📋 *${meta.subject}*\n` +
        `Members: ${meta.participants.length}\n` +
        `Created: ${new Date(meta.creation * 1000).toLocaleDateString()}\n` +
        `Description: ${meta.desc || '—'}`;
      await sock.sendMessage(jid, { text }, { quoted: msg });
    },
  },
  {
    cmd: 'open',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      await sock.groupSettingUpdate(jid, 'not_announcement');
      await sock.sendMessage(jid, { text: 'Group opened — everyone can send messages.' }, { quoted: msg });
    },
  },
  {
    cmd: 'close',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      await sock.groupSettingUpdate(jid, 'announcement');
      await sock.sendMessage(jid, { text: 'Group closed — only admins can send messages.' }, { quoted: msg });
    },
  },
  {
    cmd: 'acceptinvite',
    run: async (sock, msg, jid, args, senderJid) => {
      const link = args[0] || '';
      const code = link.split('/').pop();
      if (!code) return sock.sendMessage(jid, { text: 'Usage: .acceptinvite <group invite link>' }, { quoted: msg });
      await sock.groupAcceptInvite(code);
      await sock.sendMessage(jid, { text: 'Joined the group.' }, { quoted: msg });
    },
  },
  {
    cmd: 'setppgc',
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const { downloadMediaMessage } = require('@whiskeysockets/baileys');
      const ctx = msg.message?.extendedTextMessage?.contextInfo;
      const quoted = ctx?.quotedMessage;
      const target = quoted ? { message: quoted, key: msg.key } : msg;
      if (!target.message?.imageMessage) return sock.sendMessage(jid, { text: 'Reply to an image with .setppgc.' }, { quoted: msg });
      const buffer = await downloadMediaMessage(target, 'buffer', {});
      await sock.updateProfilePicture(jid, buffer);
      await sock.sendMessage(jid, { text: 'Group picture updated.' }, { quoted: msg });
    },
  },
];
