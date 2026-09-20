const path = require('path');
const express = require('express');
const config = require('./config');
const { startSocket, requestPairingCode, getStatus } = require('./lib/bot');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/pair', async (req, res) => {
  try {
    const { phone, secret } = req.body;
    if (secret !== config.PAIRING_SECRET) {
      return res.status(401).json({ error: 'Wrong pairing password.' });
    }
    if (!phone) return res.status(400).json({ error: 'Phone number is required.' });
    const code = await requestPairingCode(phone);
    res.json({ code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/status', (req, res) => {
  res.json(getStatus());
});

async function main() {
  await startSocket();
  app.listen(config.PORT, () => {
    console.log(`${config.BOT_NAME} site running at http://localhost:${config.PORT}`);
  });
}

main();
