# CENTRICO-MD

A WhatsApp multi-device bot built on [Baileys](https://github.com/WhiskeySockets/Baileys),
paired through a small website instead of the terminal.
Owner: **YOUNGEST BILLIONAIRE**

## Important: this needs a real server

The pairing page in `public/index.html` is only the front end. Baileys has to
keep an open, persistent connection to WhatsApp's servers, which a browser
tab can't do on its own — so `server.js` is a small Node/Express server that
runs the bot *and* serves the page in the same process. You need to run this
somewhere with a stable internet connection and Node 18+: a VPS, Railway,
Render, Fly.io, your own machine, etc. It cannot run as a static published
page or inside a sandboxed preview.

## What's in here

```
centrico-md/
├── server.js         # Express server: serves the site + /api/pair, /api/status
├── index.js           # optional: terminal-only pairing, no website
├── config.js           # bot name, owner, prefixes, port
├── public/index.html    # the pairing website
├── data/store.json       # mode, bans, extra owners, aza balances (auto-created)
├── lib/
│   ├── bot.js             # connects to WhatsApp, loads & routes commands
│   ├── menu.js             # builds the styled .menu output
│   ├── store.js             # tiny JSON-backed state store
│   ├── permissions.js        # owner / group-admin checks
│   ├── fancy.js                # unicode bold-text converter (.fancy)
│   └── uptime.js                 # uptime formatter
└── commands/
    ├── control.js   # menu, mode, pair, channel, verify
    ├── group.js      # kick, add, promote, demote, mute/unmute, lock/unlock,
    │                    tagall, hidetag, admins, setgname/desc, group links
    ├── owner.js        # restart, shutdown, broadcast, addowner/delowner,
    │                      banuser/unbanuser, block/unblock, clearsession
    ├── media.js          # sticker, toimg
    ├── fun.js              # say, tts (stub), quote, roll, flip, fact, math, fancy
    ├── system.js            # uptime, sysinfo, ping, anticall, owner
    └── bank.js               # /setaza, /aza (virtual currency, for fun — not real money)
```

## Setup

1. Install Node.js 18+.
2. `npm install`
3. Open `config.js` and set `OWNER_NUMBER` to your real WhatsApp number
   (digits only, country code first — e.g. `2348029793697`).
4. `npm run web`
5. Open `http://localhost:3000` (or your server's address) in a browser.
   Enter your WhatsApp number and tap **Get code** — this calls the real
   Baileys `requestPairingCode`, not a demo.
6. On your phone: **WhatsApp → Settings → Linked Devices → Link a Device →
   Link with phone number instead**, and enter the code within ~60 seconds.
7. The page polls `/api/status` and will show "Connected" once pairing
   succeeds. Message the bot's own number with `menu` to see the full menu.

Prefer the terminal instead of a website? `npm start` runs `index.js`, which
prompts for your number in the console the same way.

## Two things intentionally left out

- **`.hijack`** — not implemented. A "takeover & rebrand group" command is a
  tool for seizing a group the bot doesn't own, which isn't something I'll
  help build.
- **Auto `.antiviewonce`** — the menu still shows the `AntiViewOnce` flag and
  `.antiviewonce` toggles it, but nothing in the code captures or forwards
  other people's view-once media. Doing that silently defeats what the
  sender asked WhatsApp to do with their own content.

## Adding a command

Add to any file in `commands/` (or a new one) — a single object or an array:

```js
module.exports = {
  cmd: 'hello',
  run: async (sock, msg, jid, args, senderJid) => {
    await sock.sendMessage(jid, { text: 'Hey!' }, { quoted: msg });
  },
};
```

It's auto-loaded. Add a line to the right section in `lib/menu.js` so it
shows up in `.menu` too.

## Notes on the included commands

- `.mode`, `.addowner/.delowner`, `.banuser/.unbanuser`, `.block/.unblock`,
  `.anticall`, `.restart/.shutdown/.broadcast` are all owner-only.
- Group-management commands (`.kick`, `.promote`, `.lock`, etc.) require the
  sender to be an admin in that specific group — the bot doesn't grant
  itself admin rights, WhatsApp still requires the bot account itself to be
  a group admin for actions like kick/promote/mute to actually go through.
- `/setaza` and `/aza` are a simple per-user number stored in
  `data/store.json` for fun/games — there's no real payment or bank
  connection behind it.
- `.tts` and the download-from-link idea from earlier are left as stubs;
  wire in whichever TTS/media API you're licensed to use.
- `./auth` and `data/store.json` hold your live session and bot state —
  keep them private, they're already gitignored.
