async function sendWaifuPic(sock, msg, jid, category) {
  try {
    const data = await fetch(`https://api.waifu.pics/sfw/${category}`).then((r) => r.json());
    await sock.sendMessage(jid, { image: { url: data.url } }, { quoted: msg });
  } catch (err) {
    await sock.sendMessage(jid, { text: `Couldn't fetch image: ${err.message}` }, { quoted: msg });
  }
}

module.exports = [
  { cmd: 'waifu', run: (sock, msg, jid) => sendWaifuPic(sock, msg, jid, 'waifu') },
  { cmd: 'neko', run: (sock, msg, jid) => sendWaifuPic(sock, msg, jid, 'neko') },
  { cmd: 'husbando', run: (sock, msg, jid) => sendWaifuPic(sock, msg, jid, 'waifu') }, // waifu.pics has no husbando/sfw route
  { cmd: 'kitsune', run: (sock, msg, jid) => sendWaifuPic(sock, msg, jid, 'neko') },
  {
    cmd: 'animequote',
    run: async (sock, msg, jid) => {
      try {
        const data = await fetch('https://animechan.io/api/v1/quotes/random').then((r) => r.json());
        const q = data.data;
        await sock.sendMessage(jid, { text: `💬 "${q.content}"\n— ${q.character.name}, ${q.anime.name}` }, { quoted: msg });
      } catch (err) {
        await sock.sendMessage(jid, { text: `Couldn't fetch a quote: ${err.message}` }, { quoted: msg });
      }
    },
  },
];
