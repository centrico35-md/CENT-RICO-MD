const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

function quotedTarget(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  const quoted = ctx?.quotedMessage;
  if (!quoted) return null;
  return { message: quoted, key: { remoteJid: msg.key.remoteJid, id: ctx.stanzaId, participant: ctx.participant } };
}

module.exports = [
  {
    cmd: 'sticker',
    run: async (sock, msg, jid) => {
      const target = quotedTarget(msg) || msg;
      const hasImage = target.message?.imageMessage;
      const hasVideo = target.message?.videoMessage;
      if (!hasImage && !hasVideo) {
        return sock.sendMessage(jid, { text: 'Reply to an image or short video with .sticker.' }, { quoted: msg });
      }
      const buffer = await downloadMediaMessage(target, 'buffer', {});
      const webp = await sharp(buffer)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp()
        .toBuffer();
      await sock.sendMessage(jid, { sticker: webp }, { quoted: msg });
    },
  },
  {
    cmd: 'toimg',
    run: async (sock, msg, jid) => {
      const target = quotedTarget(msg) || msg;
      if (!target.message?.stickerMessage) {
        return sock.sendMessage(jid, { text: 'Reply to a sticker with .toimg.' }, { quoted: msg });
      }
      const buffer = await downloadMediaMessage(target, 'buffer', {});
      const png = await sharp(buffer).png().toBuffer();
      await sock.sendMessage(jid, { image: png }, { quoted: msg });
    },
  },
];
