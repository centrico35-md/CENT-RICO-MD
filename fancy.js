// Converts plain text to Mathematical Bold unicode (𝐀𝐁𝐂 / 𝐚𝐛𝐜 / 𝟏𝟐𝟑)
function toFancy(text) {
  const upperBase = 0x1d400; // Mathematical Bold Capital A
  const lowerBase = 0x1d41a; // Mathematical Bold Small a
  const digitBase = 0x1d7ce; // Mathematical Bold Digit 0

  return [...text]
    .map((ch) => {
      const code = ch.codePointAt(0);
      if (code >= 65 && code <= 90) return String.fromCodePoint(upperBase + (code - 65));
      if (code >= 97 && code <= 122) return String.fromCodePoint(lowerBase + (code - 97));
      if (code >= 48 && code <= 57) return String.fromCodePoint(digitBase + (code - 48));
      return ch;
    })
    .join('');
}

module.exports = { toFancy };
