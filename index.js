// Terminal-only runner: pairs via a prompt in the console.
// For the website pairing flow, run `npm run web` instead (server.js).
const readline = require('readline');
const config = require('./config');
const { startSocket } = require('./lib/bot');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function main() {
  const sock = await startSocket();

  if (!sock.authState.creds.registered) {
    const phone = await ask('Enter your WhatsApp number with country code (no +, no spaces): ');
    const code = await sock.requestPairingCode(phone.trim());
    console.log(`\nYour pairing code: ${code}\n`);
    console.log('WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number instead.\n');
  }

  sock.ev.on('connection.update', ({ connection }) => {
    if (connection === 'open') console.log(`${config.BOT_NAME} is connected and online.`);
  });
}

main();
