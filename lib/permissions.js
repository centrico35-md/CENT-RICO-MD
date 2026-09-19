const config = require('../config');
const store = require('./store');

function normalizedOwnerJid() {
  return `${config.OWNER_NUMBER}@s.whatsapp.net`;
}

function isOwner(senderJid) {
  const s = store.get();
  return senderJid === normalizedOwnerJid() || s.extraOwners.includes(senderJid);
}

function isBanned(senderJid) {
  return store.get().banned.includes(senderJid);
}

async function isGroupAdmin(sock, jid, senderJid) {
  if (!jid.endsWith('@g.us')) return false;
  const metadata = await sock.groupMetadata(jid);
  const participant = metadata.participants.find((p) => p.id === senderJid);
  return participant?.admin === 'admin' || participant?.admin === 'superadmin';
}

module.exports = { isOwner, isBanned, isGroupAdmin, normalizedOwnerJid };
