const { toFancy } = require('../lib/fancy');

const QUOTES = [
  'The best way to predict the future is to create it.',
  'Discipline is choosing between what you want now and what you want most.',
  'Small steps every day beat big leaps once in a while.',
  'You do not find time, you make it.',
  'Consistency turns effort into skill.',
];

const FACTS = [
  'Honey never spoils — edible jars have been found in 3,000-year-old tombs.',
  'Bananas are berries, but strawberries are not.',
  'Octopuses have three hearts.',
  'A day on Venus is longer than a year on Venus.',
  'Sharks existed before trees did.',
];

// Only digits, spaces, and the operators + - * / ( ) . are allowed through.
function safeMath(expression) {
  if (!/^[\d\s+\-*/().]+$/.test(expression)) throw new Error('Only numbers and + - * / ( ) are allowed.');
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${expression});`)();
}

module.exports = [
  {
    cmd: 'say',
    run: async (sock, msg, jid, args) => {
      const text = args.join(' ');
      if (!text) return sock.sendMessage(jid, { text: 'Usage: .say <text>' }, { quoted: msg });
      await sock.sendMessage(jid, { text }, { quoted: msg });
    },
  },
  {
    cmd: 'tts',
    run: async (sock, msg, jid) => {
      await sock.sendMessage(
        jid,
        { text: 'Text-to-speech needs a TTS API key plugged into commands/fun.js — not wired up in this build.' },
        { quoted: msg }
      );
    },
  },
  {
    cmd: 'quote',
    run: async (sock, msg, jid) => {
      await sock.sendMessage(jid, { text: `💬 ${QUOTES[Math.floor(Math.random() * QUOTES.length)]}` }, { quoted: msg });
    },
  },
  {
    cmd: 'roll',
    run: async (sock, msg, jid) => {
      await sock.sendMessage(jid, { text: `🎲 You rolled a ${1 + Math.floor(Math.random() * 6)}.` }, { quoted: msg });
    },
  },
  {
    cmd: 'flip',
    run: async (sock, msg, jid) => {
      await sock.sendMessage(jid, { text: `🪙 ${Math.random() < 0.5 ? 'Heads' : 'Tails'}!` }, { quoted: msg });
    },
  },
  {
    cmd: 'fact',
    run: async (sock, msg, jid) => {
      await sock.sendMessage(jid, { text: `🧠 ${FACTS[Math.floor(Math.random() * FACTS.length)]}` }, { quoted: msg });
    },
  },
  {
    cmd: 'math',
    run: async (sock, msg, jid, args) => {
      const expr = args.join(' ');
      if (!expr) return sock.sendMessage(jid, { text: 'Usage: .math <expression>' }, { quoted: msg });
      try {
        const result = safeMath(expr);
        await sock.sendMessage(jid, { text: `🧮 ${expr} = ${result}` }, { quoted: msg });
      } catch (err) {
        await sock.sendMessage(jid, { text: `Couldn't evaluate that: ${err.message}` }, { quoted: msg });
      }
    },
  },
  {
    cmd: 'fancy',
    run: async (sock, msg, jid, args) => {
      const text = args.join(' ');
      if (!text) return sock.sendMessage(jid, { text: 'Usage: .fancy <text>' }, { quoted: msg });
      await sock.sendMessage(jid, { text: toFancy(text) }, { quoted: msg });
    },
  },
];
