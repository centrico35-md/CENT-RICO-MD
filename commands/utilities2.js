const crypto = require('crypto');
const dns = require('dns').promises;
const store = require('../lib/store');

const afkUsers = new Map(); // in-memory: jid -> reason

function safeMath(expression) {
  if (!/^[\d\s+\-*/().]+$/.test(expression)) throw new Error('Only numbers and + - * / ( ) are allowed.');
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${expression});`)();
}

const MORSE = {
  a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..',
  j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.',
  s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...',
  8: '---..', 9: '----.', ' ': '/',
};

module.exports = [
  {
    cmd: 'qr',
    run: async (sock, msg, jid, args) => {
      await sock.sendMessage(
        jid,
        { text: 'QR image generation needs the "qrcode" package, which is left out of this build for install stability — see README to add it back.' },
        { quoted: msg }
      );
    },
  },
  {
    cmd: 'poll',
    run: async (sock, msg, jid, args) => {
      const parts = args.join(' ').split('|').map((s) => s.trim()).filter(Boolean);
      if (parts.length < 3) return sock.sendMessage(jid, { text: 'Usage: .poll Question | Option1 | Option2 | ...' }, { quoted: msg });
      const [name, ...options] = parts;
      await sock.sendMessage(jid, { poll: { name, values: options, selectableCount: 1 } }, { quoted: msg });
    },
  },
  {
    cmd: 'password',
    run: async (sock, msg, jid, args) => {
      const length = Math.min(Math.max(parseInt(args[0], 10) || 16, 4), 64);
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
      const pwd = Array.from(crypto.randomFillSync(new Uint8Array(length)))
        .map((b) => chars[b % chars.length])
        .join('');
      await sock.sendMessage(jid, { text: `🔑 ${pwd}` }, { quoted: msg });
    },
  },
  {
    cmd: 'base64',
    run: async (sock, msg, jid, args) => {
      const [mode, ...rest] = args;
      const text = rest.join(' ');
      if (!['encode', 'decode'].includes(mode) || !text) {
        return sock.sendMessage(jid, { text: 'Usage: .base64 <encode|decode> <text>' }, { quoted: msg });
      }
      const result = mode === 'encode'
        ? Buffer.from(text, 'utf8').toString('base64')
        : Buffer.from(text, 'base64').toString('utf8');
      await sock.sendMessage(jid, { text: result }, { quoted: msg });
    },
  },
  {
    cmd: 'uuid',
    run: async (sock, msg, jid) => {
      await sock.sendMessage(jid, { text: crypto.randomUUID() }, { quoted: msg });
    },
  },
  {
    cmd: 'hash',
    run: async (sock, msg, jid, args) => {
      const text = args.join(' ');
      if (!text) return sock.sendMessage(jid, { text: 'Usage: .hash <text>' }, { quoted: msg });
      const md5 = crypto.createHash('md5').update(text).digest('hex');
      const sha256 = crypto.createHash('sha256').update(text).digest('hex');
      await sock.sendMessage(jid, { text: `MD5: ${md5}\nSHA-256: ${sha256}` }, { quoted: msg });
    },
  },
  {
    cmd: 'morse',
    run: async (sock, msg, jid, args) => {
      const text = args.join(' ').toLowerCase();
      if (!text) return sock.sendMessage(jid, { text: 'Usage: .morse <text>' }, { quoted: msg });
      const out = [...text].map((c) => MORSE[c] ?? c).join(' ');
      await sock.sendMessage(jid, { text: out }, { quoted: msg });
    },
  },
  {
    cmd: 'binary',
    run: async (sock, msg, jid, args) => {
      const text = args.join(' ');
      if (!text) return sock.sendMessage(jid, { text: 'Usage: .binary <text>' }, { quoted: msg });
      const out = [...text].map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
      await sock.sendMessage(jid, { text: out }, { quoted: msg });
    },
  },
  {
    cmd: 'dns',
    run: async (sock, msg, jid, args) => {
      const domain = args[0];
      if (!domain) return sock.sendMessage(jid, { text: 'Usage: .dns <domain>' }, { quoted: msg });
      try {
        const addresses = await dns.resolve4(domain);
        await sock.sendMessage(jid, { text: `${domain} → ${addresses.join(', ')}` }, { quoted: msg });
      } catch (err) {
        await sock.sendMessage(jid, { text: `Lookup failed: ${err.message}` }, { quoted: msg });
      }
    },
  },
  {
    cmd: 'weather',
    run: async (sock, msg, jid, args) => {
      const city = args.join(' ');
      if (!city) return sock.sendMessage(jid, { text: 'Usage: .weather <city>' }, { quoted: msg });
      try {
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`).then((r) => r.json());
        const place = geo.results?.[0];
        if (!place) return sock.sendMessage(jid, { text: 'City not found.' }, { quoted: msg });
        const wx = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current_weather=true`).then((r) => r.json());
        const c = wx.current_weather;
        await sock.sendMessage(
          jid,
          { text: `🌤️ ${place.name}, ${place.country}\nTemp: ${c.temperature}°C\nWind: ${c.windspeed} km/h` },
          { quoted: msg }
        );
      } catch (err) {
        await sock.sendMessage(jid, { text: `Couldn't fetch weather: ${err.message}` }, { quoted: msg });
      }
    },
  },
  {
    cmd: 'crypto',
    run: async (sock, msg, jid, args) => {
      const coin = (args[0] || 'bitcoin').toLowerCase();
      try {
        const data = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`).then((r) => r.json());
        const price = data[coin]?.usd;
        await sock.sendMessage(jid, { text: price ? `💰 ${coin}: $${price}` : `Couldn't find "${coin}".` }, { quoted: msg });
      } catch (err) {
        await sock.sendMessage(jid, { text: `Lookup failed: ${err.message}` }, { quoted: msg });
      }
    },
  },
  {
    cmd: 'convert',
    run: async (sock, msg, jid, args) => {
      const [amt, from, to] = args;
      const amount = Number(amt);
      if (!Number.isFinite(amount) || !from || !to) {
        return sock.sendMessage(jid, { text: 'Usage: .convert <amount> <from> <to>' }, { quoted: msg });
      }
      try {
        const data = await fetch(`https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`).then((r) => r.json());
        const rate = data.rates?.[to.toUpperCase()];
        if (!rate) return sock.sendMessage(jid, { text: 'Unknown currency code.' }, { quoted: msg });
        await sock.sendMessage(jid, { text: `${amount} ${from.toUpperCase()} = ${(amount * rate).toFixed(2)} ${to.toUpperCase()}` }, { quoted: msg });
      } catch (err) {
        await sock.sendMessage(jid, { text: `Conversion failed: ${err.message}` }, { quoted: msg });
      }
    },
  },
  {
    cmd: 'define',
    run: async (sock, msg, jid, args) => {
      const word = args.join(' ');
      if (!word) return sock.sendMessage(jid, { text: 'Usage: .define <word>' }, { quoted: msg });
      try {
        const data = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`).then((r) => r.json());
        const def = data[0]?.meanings?.[0]?.definitions?.[0]?.definition;
        await sock.sendMessage(jid, { text: def ? `📖 *${word}*: ${def}` : 'No definition found.' }, { quoted: msg });
      } catch {
        await sock.sendMessage(jid, { text: 'No definition found.' }, { quoted: msg });
      }
    },
  },
  {
    cmd: 'short',
    run: async (sock, msg, jid, args) => {
      const url = args[0];
      if (!url) return sock.sendMessage(jid, { text: 'Usage: .short <url>' }, { quoted: msg });
      try {
        const short = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`).then((r) => r.text());
        await sock.sendMessage(jid, { text: short }, { quoted: msg });
      } catch (err) {
        await sock.sendMessage(jid, { text: `Couldn't shorten: ${err.message}` }, { quoted: msg });
      }
    },
  },
  {
    cmd: 'ipinfo',
    run: async (sock, msg, jid, args) => {
      const ip = args[0];
      if (!ip) return sock.sendMessage(jid, { text: 'Usage: .ipinfo <ip>' }, { quoted: msg });
      try {
        const data = await fetch(`https://ipapi.co/${ip}/json/`).then((r) => r.json());
        await sock.sendMessage(jid, { text: `📍 ${data.city || '?'}, ${data.country_name || '?'}\nISP: ${data.org || '?'}` }, { quoted: msg });
      } catch (err) {
        await sock.sendMessage(jid, { text: `Lookup failed: ${err.message}` }, { quoted: msg });
      }
    },
  },
  {
    cmd: 'afk',
    run: async (sock, msg, jid, args, senderJid) => {
      const reason = args.join(' ') || 'AFK';
      afkUsers.set(senderJid, reason);
      await sock.sendMessage(jid, { text: `You're now marked AFK: ${reason}` }, { quoted: msg });
    },
  },
  {
    cmd: 'math',
    run: async (sock, msg, jid, args) => {
      const expr = args.join(' ');
      if (!expr) return sock.sendMessage(jid, { text: 'Usage: .math <expression>' }, { quoted: msg });
      try {
        await sock.sendMessage(jid, { text: `🧮 ${expr} = ${safeMath(expr)}` }, { quoted: msg });
      } catch (err) {
        await sock.sendMessage(jid, { text: `Couldn't evaluate: ${err.message}` }, { quoted: msg });
      }
    },
  },
  {
    cmd: 'remind',
    run: async (sock, msg, jid, args, senderJid) => {
      const minutes = Number(args[0]);
      const text = args.slice(1).join(' ');
      if (!Number.isFinite(minutes) || minutes <= 0 || !text) {
        return sock.sendMessage(jid, { text: 'Usage: .remind <minutes> <message>' }, { quoted: msg });
      }
      await sock.sendMessage(jid, { text: `⏰ Reminder set for ${minutes} minute(s).` }, { quoted: msg });
      setTimeout(() => {
        sock.sendMessage(jid, { text: `⏰ Reminder: ${text}`, mentions: [senderJid] }).catch(() => {});
      }, minutes * 60 * 1000);
    },
  },
  {
    cmd: 'lyrics',
    run: async (sock, msg, jid, args) => {
      const song = args.join(' ');
      if (!song) return sock.sendMessage(jid, { text: 'Usage: .lyrics <song>' }, { quoted: msg });
      await sock.sendMessage(
        jid,
        { text: `🔎 Search "${song} lyrics" on Genius: https://genius.com/search?q=${encodeURIComponent(song)}` },
        { quoted: msg }
      );
    },
  },
  {
    cmd: 'gitstalk',
    run: async (sock, msg, jid, args) => {
      const user = args[0];
      if (!user) return sock.sendMessage(jid, { text: 'Usage: .gitstalk <github-username>' }, { quoted: msg });
      try {
        const data = await fetch(`https://api.github.com/users/${user}`).then((r) => r.json());
        if (data.message === 'Not Found') return sock.sendMessage(jid, { text: 'User not found.' }, { quoted: msg });
        await sock.sendMessage(
          jid,
          { text: `👤 ${data.login}\nName: ${data.name || '—'}\nRepos: ${data.public_repos}\nFollowers: ${data.followers}\n${data.html_url}` },
          { quoted: msg }
        );
      } catch (err) {
        await sock.sendMessage(jid, { text: `Lookup failed: ${err.message}` }, { quoted: msg });
      }
    },
  },
];

module.exports.afkUsers = afkUsers;
