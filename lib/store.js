const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'store.json');

const DEFAULTS = {
  mode: 'public', // 'public' | 'self'
  antiViewOnce: false, // display-only toggle, see README
  extraOwners: [], // additional owner jids added via .addowner
  banned: [], // jids banned from using the bot
  blocked: [], // jids the owner has blocked
  aza: {}, // { jid: number } virtual currency balances
  groups: {}, // { groupJid: { antilink, antispam, badwords, reacts, welcomeOn, welcomeText, goodbyeText } }
  anticall: 'off',
};

function load() {
  if (!fs.existsSync(FILE)) {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(DEFAULTS, null, 2));
  }
  try {
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
  } catch {
    return { ...DEFAULTS };
  }
}

let state = load();

function save() {
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}

function get() {
  return state;
}

function set(patch) {
  state = { ...state, ...patch };
  save();
  return state;
}

function azaOf(jid) {
  return state.aza[jid] || 0;
}

function setAza(jid, amount) {
  state.aza[jid] = amount;
  save();
}

module.exports = { get, set, azaOf, setAza };
