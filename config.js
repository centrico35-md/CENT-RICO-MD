module.exports = {
  // Identity
  BOT_NAME: 'CENTRICO-MD',
  OWNER_NAME: 'YOUNGEST BILLIONAIRE',

  // Owner's WhatsApp number, digits only, country code first, no + / leading 0
  OWNER_NUMBER: '2349135481300',

  // Accepted command prefixes — a message can start with either
  PREFIXES: ['.', '/'],

  // Shown at the top of the menu
  BOT_TAGLINE: 'Multi-device WhatsApp assistant',

  // Official channel link shown in the menu
  CHANNEL_LINK: 'https://whatsapp.com/channel/0029VbDZOdmFSAszRGXvKf2j',

  // HTTP port for the pairing site + API
  PORT: process.env.PORT || 3000,

  // Required to request a pairing code from the website — treat this like a
  // password. Change it to your own value, or better, set it as an
  // environment variable named PAIRING_SECRET in Render's dashboard instead
  // of hardcoding it here.
  PAIRING_SECRET: process.env.PAIRING_SECRET || 'change-this-secret-now',
};
