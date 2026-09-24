const config = require('../config');
const store = require('./store');
const { toFancy } = require('./fancy');

function box(title, lines) {
  const top = `╭━━━📂 *${title}* ━━━╮`;
  const body = lines.map((l) => `│ ⚡ ${l}`).join('\n');
  const bottom = `╰${'━'.repeat(Math.max(title.length + 8, 20))}╯`;
  return `${top}\n${body}\n${bottom}`;
}

function buildMenu(sock, senderName) {
  const s = store.get();
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour12: true });
  const date = now.toLocaleDateString('en-GB');
  const number = sock?.user?.id ? `+${sock.user.id.split(':')[0]}` : `+${config.OWNER_NUMBER}`;
  const prefixDisplay = config.PREFIXES.join(' ');

  const header =
    `╭━━━━━━━⚡ *${config.BOT_NAME}* ⚡━━━━━━━╮\n` +
    `┃ 👑 *Owner:* ${config.OWNER_NAME}\n` +
    `┃ 👤 *User:* ${toFancy(senderName || 'there')}\n` +
    `┃ 📞 *Number:* ${number}\n` +
    `┃ 🌐 *Mode:* ${s.mode.toUpperCase()}\n` +
    `┃ 👁️ *AntiViewOnce:* ${s.antiViewOnce ? 'ON' : 'OFF'}\n` +
    `┃ 🕒 *Time:* ${time}\n` +
    `┃ 📅 *Date:* ${date}\n` +
    `┃ ⚙️ *Prefix:* [ ${prefixDisplay} ]\n` +
    `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
    `📢 *OFFICIAL CHANNEL:*\n${config.CHANNEL_LINK}`;

  const sections = [
    box('PAIR & CONTROL', [
      '.pair', '.mode', '.antiviewonce', '.channel', '.verify',
      '.connect', '.disconnect', '.reconnect', '.session', '.authstatus', '.setpp',
    ]),
    box('GROUP MENU', [
      '.creategc', '.gstatus', '.antilink', '.antispamgrp',
      '.addbadword', '.delbadword', '.listbadwords',
      '.addreact', '.delreact', '.listreacts',
      '.kick', '.add', '.promote', '.demote',
      '.mute', '.unmute', '.lock', '.unlock', '.open', '.close',
      '.tagall', '.hidetag', '.admins', '.ginfo',
      '.setgname', '.setgdesc', '.setppgc',
      '.grouplink', '.resetlink', '.acceptinvite',
      '.welcome', '.setwelcome', '.setgoodbye',
    ]),
    box('ANTI SETTINGS', [
      '.antisticker', '.antivoice', '.antifile', '.antiphoto', '.antivideo',
      '.antigif', '.antipoll', '.antiforwarded', '.antilocation', '.anticontact',
      '.antitag', '.antiemoji', '.antibeg', '.antidelete',
    ]),
    box('OWNER MENU', [
      '.restart', '.shutdown', '.broadcast', '.addowner', '.delowner',
      '.banuser', '.unbanuser', '.block', '.unblock', '.clearsession',
    ]),
    box('MEDIA & CONVERTERS', [
      '.sticker', '.toimg', '.tomp3', '.bass', '.slow', '.fast', '.nightcore',
      '.blur', '.grayscale', '.invert', '.flip', '.pixelate',
      '.rotate', '.crop', '.resize', '.meme', '.emojimix',
    ]),
    box('DOWNLOADER', ['.tiktok', '.ytmp3', '.ig', '.fb', '.spotify', '.soundcloud']),
    box('UTILITIES MENU', [
      '.qr', '.poll', '.password', '.base64', '.uuid', '.hash', '.morse',
      '.binary', '.dns', '.weather', '.crypto', '.convert', '.define',
      '.short', '.ipinfo', '.afk', '.math', '.remind', '.lyrics', '.gitstalk',
    ]),
    box('ANIME MENU', ['.waifu', '.neko', '.husbando', '.kitsune', '.animequote']),
    box('GAMES & MINIGAMES', ['.ttt', '.trivia', '.rps', '.coinflip', '.slot', '.balance']),
    box('FUN & RANDOM', [
      '.say', '.tts', '.quote', '.roll', '.flip', '.fact', '.fancy',
      '.joke', '.advice', '.8ball', '.riddle', '.cat', '.dog', '.fox', '.duck', '.slap', '.wanted',
    ]),
    box('MORE UTILITY', ['.reverse', '.wordcount', '.color', '.bmi', '.base64encode', '.base64decode']),
    box('SYSTEM & SECURITY', [
      '.uptime', '.sysinfo', '.cpu', '.ram', '.ping', '.pinglatency',
      '.anticall', '.owner', '.cleartmp', '.updatebot',
    ]),
    box('BANK MENU', ['/setaza', '/aza', '/balcheck', '/banklist', '/transfer']),
  ];

  const footer = `\n  *POWERED BY ${config.BOT_NAME}*`;

  return `${header}\n\n${sections.join('\n\n')}\n${footer}`;
}

module.exports = { buildMenu };
