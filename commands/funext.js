const EIGHTBALL = [
  'Yes, definitely.', 'It is certain.', 'Without a doubt.', 'Ask again later.',
  'Cannot predict now.', 'Don\'t count on it.', 'My reply is no.', 'Very doubtful.',
];
const RIDDLES = [
  { q: 'What has keys but no locks, space but no room?', a: 'A keyboard' },
  { q: 'What gets wetter as it dries?', a: 'A towel' },
  { q: 'What has a face and two hands but no arms or legs?', a: 'A clock' },
  { q: 'The more you take, the more you leave behind. What am I?', a: 'Footsteps' },
];

async function sendAnimal(sock, msg, jid, url, path) {
  try {
    const data = await fetch(url).then((r) => r.json());
    const imgUrl = path.split('.').reduce((o, k) => o?.[k], data);
    await sock.sendMessage(jid, { image: { url: imgUrl } }, { quoted: msg });
  } catch (err) {
    await sock.sendMessage(jid, { text: `Couldn't fetch image: ${err.message}` }, { quoted: msg });
  }
}

module.exports = [
  {
    cmd: 'joke',
    run: async (sock, msg, jid) => {
      try {
        const data = await fetch('https://official-joke-api.appspot.com/random_joke').then((r) => r.json());
        await sock.sendMessage(jid, { text: `😂 ${data.setup}\n${data.punchline}` }, { quoted: msg });
      } catch (err) {
        await sock.sendMessage(jid, { text: `Couldn't fetch a joke: ${err.message}` }, { quoted: msg });
      }
    },
  },
  {
    cmd: 'advice',
    run: async (sock, msg, jid) => {
      try {
        const data = await fetch('https://api.adviceslip.com/advice').then((r) => r.json());
        await sock.sendMessage(jid, { text: `💡 ${data.slip.advice}` }, { quoted: msg });
      } catch (err) {
        await sock.sendMessage(jid, { text: `Couldn't fetch advice: ${err.message}` }, { quoted: msg });
      }
    },
  },
  {
    cmd: '8ball',
    run: async (sock, msg, jid, args) => {
      if (!args.length) return sock.sendMessage(jid, { text: 'Usage: .8ball <question>' }, { quoted: msg });
      await sock.sendMessage(jid, { text: `🎱 ${EIGHTBALL[Math.floor(Math.random() * EIGHTBALL.length)]}` }, { quoted: msg });
    },
  },
  {
    cmd: 'riddle',
    run: async (sock, msg, jid) => {
      const r = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
      await sock.sendMessage(jid, { text: `🧩 ${r.q}\n\n||Answer: ${r.a}||`.replace('||', '\n_') }, { quoted: msg });
    },
  },
  { cmd: 'cat', run: (sock, msg, jid) => sendAnimal(sock, msg, jid, 'https://api.thecatapi.com/v1/images/search', '0.url') },
  { cmd: 'dog', run: (sock, msg, jid) => sendAnimal(sock, msg, jid, 'https://dog.ceo/api/breeds/image/random', 'message') },
  { cmd: 'fox', run: (sock, msg, jid) => sendAnimal(sock, msg, jid, 'https://randomfox.ca/floof/', 'image') },
  { cmd: 'duck', run: (sock, msg, jid) => sendAnimal(sock, msg, jid, 'https://random-d.uk/api/v2/random', 'url') },
  {
    cmd: 'slap',
    run: async (sock, msg, jid) => sendAnimal(sock, msg, jid, 'https://api.waifu.pics/sfw/slap', 'url'),
  },
  {
    cmd: 'wanted',
    run: async (sock, msg, jid) => {
      const sharp = require('sharp');
      const { downloadMediaMessage } = require('@whiskeysockets/baileys');
      const ctx = msg.message?.extendedTextMessage?.contextInfo;
      const quoted = ctx?.quotedMessage;
      const target = quoted ? { message: quoted, key: msg.key } : msg;
      if (!target.message?.imageMessage) {
        return sock.sendMessage(jid, { text: 'Reply to an image with .wanted to make a poster from it.' }, { quoted: msg });
      }
      const buffer = await downloadMediaMessage(target, 'buffer', {});
      const photo = await sharp(buffer).resize(500, 500, { fit: 'cover' }).toBuffer();
      const W = 600, H = 800;
      const frame = `
        <svg width="${W}" height="${H}">
          <rect width="${W}" height="${H}" fill="#E8D5A8"/>
          <rect x="15" y="15" width="${W - 30}" height="${H - 30}" fill="none" stroke="#3a2c17" stroke-width="6"/>
          <text x="50%" y="90" font-family="serif" font-weight="bold" font-size="64" fill="#3a2c17" text-anchor="middle">WANTED</text>
          <text x="50%" y="140" font-family="serif" font-size="22" fill="#3a2c17" text-anchor="middle">DEAD OR ALIVE</text>
          <text x="50%" y="700" font-family="serif" font-weight="bold" font-size="40" fill="#3a2c17" text-anchor="middle">REWARD</text>
        </svg>`;
      const out = await sharp(Buffer.from(frame))
        .composite([{ input: photo, top: 170, left: (W - 500) / 2 }])
        .png()
        .toBuffer();
      await sock.sendMessage(jid, { image: out }, { quoted: msg });
    },
  },
];
