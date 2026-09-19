const config = require('../config');
const store = require('./store');
const { toFancy } = require('./fancy');

function box(title, lines) {
  const top = `╭━━━📂 *${title}* ━━━╮`;
  const body = lines.map((l) => `│ ⚡ ${l}`).join('\n');
  const bottom = `╰${'━'.repeat(Math.max(title.length + 8, 20))}╯`;
  return `${top}\n${body}\n${bottom}`;
}

function buildMenu(sock) {
  const s = store.get();
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour12: true });
  const date = now.toLocaleDateString('en-GB'); // dd/mm/yyyy
  const number = sock?.user?.id ? `+${sock.user.id.split(':')[0]}` : `+${config.OWNER_NUMBER}`;
  const prefixDisplay = config.PREFIXES.join(' ');

  const header =
    `╭━━━━━━━⚡ *${config.BOT_NAME}* ⚡━━━━━━━╮\n` +
    `┃ 👑 *Owner:* ${config.OWNER_NAME}\n` +
    `┃ 👤 *User:* ${toFancy(config.OWNER_NAME)}\n` +
    `┃ 📞 *Number:* ${number}\n` +
    `┃ 🌐 *Mode:* ${s.mode.toUpperCase()}\n` +
    `┃ 👁️ *AntiViewOnce:* ${s.antiViewOnce ? 'ON' : 'OFF'}\n` +
    `┃ 🕒 *Time:* ${time}\n` +
    `┃ 📅 *Date:* ${date}\n` +
    `┃ ⚙️ *Prefix:* [ ${prefixDisplay} ]\n` +
    `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
    `📢 *OFFICIAL CHANNEL:*\n${config.CHANNEL_LINK}`;

  const sections = [
    box('BOT MODES & CONTROL', [
      '.mode <public|self>',
      '.antiviewonce (display toggle only — see README)',
      '.pair <number>',
      '.channel',
      '.verify',
    ]),
    box('GROUP MANAGEMENT', [
      '.kick @user',
      '.add 234...',
      '.promote @user',
      '.demote @user',
      '.mute',
      '.unmute',
      '.lock',
      '.unlock',
      '.tagall',
      '.hidetag <text>',
      '.admins',
      '.setgname <name>',
      '.setgdesc <desc>',
      '.grouplink',
      '.resetlink',
    ]),
    box('OWNER MENU', [
      '.restart',
      '.shutdown',
      '.broadcast <text>',
      '.addowner @user',
      '.delowner @user',
      '.banuser @user',
      '.unbanuser @user',
      '.block @user',
      '.unblock @user',
      '.clearsession',
    ]),
    box('MEDIA & CONVERTERS', ['.sticker (reply to image)', '.toimg (reply to sticker)']),
    box('FUN & UTILITIES', [
      '.say <text>',
      '.tts <text>',
      '.quote',
      '.roll',
      '.flip',
      '.fact',
      '.math <expression>',
      '.fancy <text>',
    ]),
    box('SYSTEM & SECURITY', ['.uptime', '.sysinfo', '.ping', '.anticall <block|decline|off>', '.owner']),
    box('BANK & VIRTUAL CURRENCY', ['/setaza <amount>', '/aza']),
  ];

  const footer = `\n  *POWERED BY ${config.BOT_NAME}*`;

  return `${header}\n\n${sections.join('\n\n')}\n${footer}`;
}

module.exports = { buildMenu };
