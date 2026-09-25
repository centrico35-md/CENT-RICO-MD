const { isGroupAdmin } = require('../lib/permissions');
const store = require('../lib/store');

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

function setGroupFlag(jid, key, val) {
  const s = store.get();
  const groups = { ...(s.groups || {}) };
  groups[jid] = { ...(groups[jid] || {}), [key]: val };
  store.set({ groups });
}

function toggleCommand(cmd, flagKey, label) {
  return {
    cmd,
    run: async (sock, msg, jid, args, senderJid) => {
      if (!(await requireGroupAdmin(sock, msg, jid, senderJid))) return;
      const val = (args[0] || '').toLowerCase();
      if (!['on', 'off'].includes(val)) return sock.sendMessage(jid, { text: `Usage: .${cmd} <on|off>` }, { quoted: msg });
      setGroupFlag(jid, flagKey, val === 'on');
      await sock.sendMessage(jid, { text: `${label} is now *${val.toUpperCase()}*.` }, { quoted: msg });
    },
  };
}

module.exports = [
  toggleCommand('antisticker', 'antisticker', 'Anti-sticker'),
  toggleCommand('antivoice', 'antivoice', 'Anti-voice-note'),
  toggleCommand('antifile', 'antifile', 'Anti-file'),
  toggleCommand('antiphoto', 'antiphoto', 'Anti-photo'),
  toggleCommand('antivideo', 'antivideo', 'Anti-video'),
  toggleCommand('antigif', 'antigif', 'Anti-GIF'),
  toggleCommand('antipoll', 'antipoll', 'Anti-poll'),
  toggleCommand('antiforwarded', 'antiforwarded', 'Anti-forwarded'),
  toggleCommand('antilocation', 'antilocation', 'Anti-location'),
  toggleCommand('anticontact', 'anticontact', 'Anti-contact-card'),
  toggleCommand('antitag', 'antitag', 'Anti-mass-tag'),
  toggleCommand('antiemoji', 'antiemoji', 'Anti-emoji-spam'),
  toggleCommand('antibeg', 'antibeg', 'Anti-begging'),
  toggleCommand('antidelete', 'antideleteDisplay', 'Deleted-message notice'),
];
