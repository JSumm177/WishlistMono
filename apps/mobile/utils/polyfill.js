// Polyfill for TextEncoder and TextDecoder in React Native Hermes engine

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = class TextEncoder {
    constructor(encoding = "utf-8") {
      this.encoding = encoding;
    }
    encode(string) {
      const length = string.length;
      const bytes = new Uint8Array(length * 3); // Over-allocate
      let byteIndex = 0;
      for (let i = 0; i < length; i++) {
        let codePoint = string.codePointAt(i);
        if (codePoint > 0xffff) {
          i++; // Surrogate pair
        }
        if (codePoint < 0x80) {
          bytes[byteIndex++] = codePoint;
        } else if (codePoint < 0x800) {
          bytes[byteIndex++] = 0xc0 | (codePoint >> 6);
          bytes[byteIndex++] = 0x80 | (codePoint & 0x3f);
        } else if (codePoint < 0x10000) {
          bytes[byteIndex++] = 0xe0 | (codePoint >> 12);
          bytes[byteIndex++] = 0x80 | ((codePoint >> 6) & 0x3f);
          bytes[byteIndex++] = 0x80 | (codePoint & 0x3f);
        } else {
          bytes[byteIndex++] = 0xf0 | (codePoint >> 18);
          bytes[byteIndex++] = 0x80 | ((codePoint >> 12) & 0x3f);
          bytes[byteIndex++] = 0x80 | ((codePoint >> 6) & 0x3f);
          bytes[byteIndex++] = 0x80 | (codePoint & 0x3f);
        }
      }
      return bytes.subarray(0, byteIndex);
    }
  };
}

if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = class TextDecoder {
    constructor(encoding = "utf-8") {
      this.encoding = encoding;
    }
    decode(bytes) {
      if (!bytes) return "";
      let string = "";
      let i = 0;
      while (i < bytes.length) {
        const byte = bytes[i++];
        if (byte < 0x80) {
          string += String.fromCodePoint(byte);
        } else if (byte < 0xe0) {
          const byte2 = bytes[i++];
          string += String.fromCodePoint(((byte & 0x1f) << 6) | (byte2 & 0x3f));
        } else if (byte < 0xf0) {
          const byte2 = bytes[i++];
          const byte3 = bytes[i++];
          string += String.fromCodePoint(
            ((byte & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f)
          );
        } else {
          const byte2 = bytes[i++];
          const byte3 = bytes[i++];
          const byte4 = bytes[i++];
          string += String.fromCodePoint(
            ((byte & 0x07) << 18) |
              ((byte2 & 0x3f) << 12) |
              ((byte3 & 0x3f) << 6) |
              (byte4 & 0x3f)
          );
        }
      }
      return string;
    }
  };
}
