/**
 * Lightweight, zero-dependency QR Code Matrix & SVG Generator.
 * Implements standard QR Code Model 2 with Reed-Solomon error correction (Level L).
 */

const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  GF256_EXP[i] = x;
  GF256_EXP[i + 255] = x;
  GF256_LOG[x] = i;
  x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
}

function gmult(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF256_EXP[(GF256_LOG[a] + GF256_LOG[b]) % 255];
}

function rsGenPoly(n) {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      next[j] ^= gmult(g[j], GF256_EXP[i]);
      next[j + 1] ^= g[j];
    }
    g = next;
  }
  return g;
}

function rsCompute(data, nEC) {
  const gen = rsGenPoly(nEC);
  const res = new Uint8Array(nEC);
  for (let b of data) {
    const factor = b ^ res[0];
    for (let j = 0; j < nEC - 1; j++) {
      res[j] = res[j + 1] ^ gmult(gen[j + 1], factor);
    }
    res[nEC - 1] = gmult(gen[nEC], factor);
  }
  return res;
}

const QR_VERSIONS = [
  null,
  { v: 1, total: 26, ec: 7, data: 19, align: [] },
  { v: 2, total: 44, ec: 10, data: 34, align: [6, 18] },
  { v: 3, total: 70, ec: 15, data: 55, align: [6, 22] },
  { v: 4, total: 100, ec: 20, data: 80, align: [6, 26] },
  { v: 5, total: 134, ec: 26, data: 108, align: [6, 30] }
];

export function generateQRMatrix(text) {
  const utf8 = new TextEncoder().encode(text || "");
  const len = utf8.length;
  
  let ver = QR_VERSIONS.find(v => v && (v.data - 2) >= len);
  if (!ver) ver = QR_VERSIONS[5];

  const dataCap = ver.data;
  const bitstream = [];

  function pushBits(val, numBits) {
    for (let i = numBits - 1; i >= 0; i--) {
      bitstream.push((val >> i) & 1);
    }
  }

  // Byte mode indicator: 0100
  pushBits(4, 4);
  pushBits(Math.min(len, dataCap - 2), 8);
  for (let i = 0; i < Math.min(len, dataCap - 2); i++) {
    pushBits(utf8[i], 8);
  }
  const remBits = (dataCap * 8) - bitstream.length;
  pushBits(0, Math.min(4, remBits));
  while (bitstream.length % 8 !== 0) {
    bitstream.push(0);
  }
  const padBytes = [0xec, 0x11];
  let pIdx = 0;
  while (bitstream.length < dataCap * 8) {
    pushBits(padBytes[pIdx % 2], 8);
    pIdx++;
  }

  const dataWords = new Uint8Array(dataCap);
  for (let i = 0; i < dataCap; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bitstream[i * 8 + j];
    }
    dataWords[i] = b;
  }

  const ecWords = rsCompute(dataWords, ver.ec);
  const allCodewords = new Uint8Array(dataCap + ver.ec);
  allCodewords.set(dataWords, 0);
  allCodewords.set(ecWords, dataCap);

  const size = (ver.v - 1) * 4 + 21;
  const matrix = Array.from({ length: size }, () => new Array(size).fill(null));
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));

  function setFinder(startR, startC) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBlack = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        matrix[startR + r][startC + c] = isBlack ? 1 : 0;
        reserved[startR + r][startC + c] = true;
      }
    }
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = startR + r;
        const cc = startC + c;
        if (rr >= 0 && rr < size && cc >= 0 && cc < size && !reserved[rr][cc]) {
          matrix[rr][cc] = 0;
          reserved[rr][cc] = true;
        }
      }
    }
  }

  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    if (!reserved[6][i]) {
      matrix[6][i] = (i % 2 === 0) ? 1 : 0;
      reserved[6][i] = true;
    }
    if (!reserved[i][6]) {
      matrix[i][6] = (i % 2 === 0) ? 1 : 0;
      reserved[i][6] = true;
    }
  }

  if (ver.align.length === 2) {
    const ar = ver.align[1];
    const ac = ver.align[1];
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isB = (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0));
        matrix[ar + r][ac + c] = isB ? 1 : 0;
        reserved[ar + r][ac + c] = true;
      }
    }
  }

  matrix[size - 8][8] = 1;
  reserved[size - 8][8] = true;

  for (let i = 0; i < 9; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  let bitIdx = 0;
  const totalDataBits = allCodewords.length * 8;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--;
    for (let vert = 0; vert < size; vert++) {
      for (let c = 0; c < 2; c++) {
        const col = right - c;
        const row = ((right + 1) & 2) === 0 ? size - 1 - vert : vert;
        if (!reserved[row][col]) {
          let bit = 0;
          if (bitIdx < totalDataBits) {
            const byte = allCodewords[Math.floor(bitIdx / 8)];
            bit = (byte >> (7 - (bitIdx % 8))) & 1;
            bitIdx++;
          }
          if ((row + col) % 2 === 0) {
            bit ^= 1;
          }
          matrix[row][col] = bit;
        }
      }
    }
  }

  const formatBits = 0x77c4;
  for (let i = 0; i < 15; i++) {
    const bit = (formatBits >> (14 - i)) & 1;
    if (i < 6) matrix[8][i] = bit;
    else if (i < 8) matrix[8][i + 1] = bit;
    else if (i === 8) matrix[7][8] = bit;
    else matrix[14 - i][8] = bit;

    if (i < 8) matrix[size - 1 - i][8] = bit;
    else matrix[8][size - 15 + i] = bit;
  }

  return matrix;
}

export function generateQRCodeSVG(text, size = 180, fgColor = "#09090b", bgColor = "#ffffff") {
  const matrix = generateQRMatrix(text);
  const n = matrix.length;
  const margin = 2;
  const viewBoxSize = n + margin * 2;

  let rects = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c] === 1) {
        rects += `<rect x="${c + margin}" y="${r + margin}" width="1" height="1" fill="${fgColor}"/>`;
      }
    }
  }

  return `<svg viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="rounded-xl shadow-xs border border-zinc-200/80 bg-white">
    <rect width="${viewBoxSize}" height="${viewBoxSize}" fill="${bgColor}"/>
    ${rects}
  </svg>`;
}
