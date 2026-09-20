const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

function quotedTarget(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  const quoted = ctx?.quotedMessage;
  if (!quoted) return null;
  return { message: quoted, key: { remoteJid: msg.key.remoteJid, id: ctx.stanzaId, participant: ctx.participant } };
}

async function getImageBuffer(sock, msg, jid) {
  const target = quotedTarget(msg) || msg;
  if (!target.message?.imageMessage) {
    await sock.sendMessage(jid, { text: 'Reply to an image with this command.' }, { quoted: msg });
    return null;
  }
  return downloadMediaMessage(target, 'buffer', {});
}

async function audioStub(sock, msg, jid, label) {
  await sock.sendMessage(
    jid,
    { text: `${label} needs ffmpeg on the server, which isn't installed in this build to keep deploys reliable. See README for how to add it back.` },
    { quoted: msg }
  );
}

const imageEffects = {
  blur: (img) => img.blur(12),
  grayscale: (img) => img.grayscale(),
  invert: (img) => img.negate(),
  flip: (img) => img.flip(),
  pixelate: (img) => img.resize(32, 32, { fit: 'inside' }).resize(512, 512, { kernel: 'nearest' }),
};

module.exports = [
  ...Object.entries(imageEffects).map(([cmd, apply]) => ({
    cmd,
    run: async (sock, msg, jid) => {
      const buffer = await getImageBuffer(sock, msg, jid);
      if (!buffer) return;
      const out = await apply(sharp(buffer)).png().toBuffer();
      await sock.sendMessage(jid, { image: out }, { quoted: msg });
    },
  })),
  {
    cmd: 'rotate',
    run: async (sock, msg, jid, args) => {
      const deg = Number(args[0]) || 90;
      const buffer = await getImageBuffer(sock, msg, jid);
      if (!buffer) return;
      const out = await sharp(buffer).rotate(deg).png().toBuffer();
      await sock.sendMessage(jid, { image: out }, { quoted: msg });
    },
  },
  {
    cmd: 'crop',
    run: async (sock, msg, jid, args) => {
      const ratio = args[0] || '1:1';
      const [w, h] = ratio.split(':').map(Number);
      const buffer = await getImageBuffer(sock, msg, jid);
      if (!buffer) return;
      const meta = await sharp(buffer).metadata();
      const targetRatio = w / h;
      let cw = meta.width, ch = Math.round(meta.width / targetRatio);
      if (ch > meta.height) { ch = meta.height; cw = Math.round(meta.height * targetRatio); }
      const out = await sharp(buffer)
        .extract({ left: Math.floor((meta.width - cw) / 2), top: Math.floor((meta.height - ch) / 2), width: cw, height: ch })
        .png()
        .toBuffer();
      await sock.sendMessage(jid, { image: out }, { quoted: msg });
    },
  },
  {
    cmd: 'resize',
    run: async (sock, msg, jid, args) => {
      const [w, h] = (args[0] || '512x512').split(/[xX]/).map(Number);
      const buffer = await getImageBuffer(sock, msg, jid);
      if (!buffer) return;
      const out = await sharp(buffer).resize(w || 512, h || 512).png().toBuffer();
      await sock.sendMessage(jid, { image: out }, { quoted: msg });
    },
  },
  {
    cmd: 'meme',
    run: async (sock, msg, jid, args) => {
      const [top = '', bottom = ''] = args.join(' ').split('|').map((s) => s.trim());
      const buffer = await getImageBuffer(sock, msg, jid);
      if (!buffer) return;
      const meta = await sharp(buffer).metadata();
      const svg = `
        <svg width="${meta.width}" height="${meta.height}">
          <style>
            .t { font: bold ${Math.round(meta.width / 12)}px sans-serif; fill: white; stroke: black; stroke-width: 3; paint-order: stroke; text-anchor: middle; }
          </style>
          <text x="50%" y="10%" class="t">${top}</text>
          <text x="50%" y="95%" class="t">${bottom}</text>
        </svg>`;
      const out = await sharp(buffer).composite([{ input: Buffer.from(svg) }]).png().toBuffer();
      await sock.sendMessage(jid, { image: out }, { quoted: msg });
    },
  },
  { cmd: 'tomp3', run: (sock, msg, jid) => audioStub(sock, msg, jid, '.tomp3') },
  { cmd: 'bass', run: (sock, msg, jid) => audioStub(sock, msg, jid, '.bass') },
  { cmd: 'slow', run: (sock, msg, jid) => audioStub(sock, msg, jid, '.slow') },
  { cmd: 'fast', run: (sock, msg, jid) => audioStub(sock, msg, jid, '.fast') },
  { cmd: 'nightcore', run: (sock, msg, jid) => audioStub(sock, msg, jid, '.nightcore') },
  {
    cmd: 'emojimix',
    run: async (sock, msg, jid, args) => {
      const [e1, e2] = args.join('').split('+');
      if (!e1 || !e2) return sock.sendMessage(jid, { text: 'Usage: .emojimix 😀+😭' }, { quoted: msg });
      try {
        const cp = (e) => [...e].map((c) => c.codePointAt(0).toString(16)).join('-');
        const url = `https://www.gstatic.com/android/keyboard/emojikitchen/20220110/u${cp(e1)}/u${cp(e1)}_u${cp(e2)}.png`;
        const res = await fetch(url);
        if (!res.ok) return sock.sendMessage(jid, { text: 'No mix found for that combo.' }, { quoted: msg });
        const buffer = Buffer.from(await res.arrayBuffer());
        await sock.sendMessage(jid, { image: buffer }, { quoted: msg });
      } catch (err) {
        await sock.sendMessage(jid, { text: `Couldn't mix: ${err.message}` }, { quoted: msg });
      }
    },
  },
];
