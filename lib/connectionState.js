// Shared connection state, kept in its own module so commands/session.js
// and lib/bot.js can both read it without a circular require.
const state = {
  sock: null,
  status: 'disconnected', // disconnected | connecting | awaiting_pairing | connected
  qr: null,
};

function getStatus() {
  return { status: state.status, connectedNumber: state.sock?.user?.id?.split(':')[0] || null };
}

module.exports = { state, getStatus };
