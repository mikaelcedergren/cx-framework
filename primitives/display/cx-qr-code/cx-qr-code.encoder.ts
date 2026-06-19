export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface CxQrCodeSvg {
  readonly svg: string;
  readonly moduleCount: number;
  readonly version: number;
}

type Matrix = boolean[][];

const MIN_VERSION = 1;
const MAX_VERSION = 40;
const BYTE_MODE = 0b0100;
const PAD_CODEWORDS = [0xec, 0x11] as const;
const FORMAT_BITS: Record<QrErrorCorrection, number> = { L: 1, M: 0, Q: 3, H: 2 };
const QUIET_ZONE_MODULES = 4;

// QR's capacity tables are part of the ISO spec. Keeping them local avoids a runtime
// dependency while still letting the component render real, scannable QR codes.
const ECC_CODEWORDS_PER_BLOCK: Record<QrErrorCorrection, readonly number[]> = {
  L: [
    -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  M: [
    -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  ],
  Q: [
    -1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  H: [
    -1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
};

const ERROR_CORRECTION_BLOCKS: Record<QrErrorCorrection, readonly number[]> = {
  L: [
    -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19,
    19, 20, 21, 22, 24, 25,
  ],
  M: [
    -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31,
    33, 35, 37, 38, 40, 43, 45, 47, 49,
  ],
  Q: [
    -1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43,
    45, 48, 51, 53, 56, 59, 62, 65, 68,
  ],
  H: [
    -1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48,
    51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
  ],
};

export function renderCxQrCodeSvg(data: string, errorCorrection: QrErrorCorrection, pixelSize = 192): CxQrCodeSvg {
  const bytes = Array.from(new TextEncoder().encode(data));
  const version = pickVersion(bytes.length, errorCorrection);
  const dataCodewords = encodeDataCodewords(bytes, version, errorCorrection);
  const codewords = addErrorCorrectionAndInterleave(dataCodewords, version, errorCorrection);
  const { modules, functionModules } = drawBaseMatrix(version);

  drawCodewords(modules, functionModules, codewords);
  const maskedModules = applyBestMask(modules, functionModules, version, errorCorrection);

  return {
    svg: toSvg(maskedModules, pixelSize),
    moduleCount: maskedModules.length,
    version,
  };
}

function pickVersion(byteLength: number, errorCorrection: QrErrorCorrection): number {
  for (let version = MIN_VERSION; version <= MAX_VERSION; version += 1) {
    const characterCountBits = version <= 9 ? 8 : 16;
    const characterCountFits = byteLength < 1 << characterCountBits;
    const requiredBits = 4 + characterCountBits + byteLength * 8;
    const capacityBits = getNumDataCodewords(version, errorCorrection) * 8;

    if (characterCountFits && requiredBits <= capacityBits) {
      return version;
    }
  }

  throw new Error(`Payload too long for QR code at error-correction ${errorCorrection}.`);
}

function encodeDataCodewords(bytes: readonly number[], version: number, errorCorrection: QrErrorCorrection): number[] {
  const capacityBits = getNumDataCodewords(version, errorCorrection) * 8;
  const characterCountBits = version <= 9 ? 8 : 16;
  const bits = new BitBuffer();

  // The component intentionally supports byte mode only. It covers URLs,
  // otpauth payloads, and ordinary text without adding mode-switching complexity.
  bits.append(BYTE_MODE, 4);
  bits.append(bytes.length, characterCountBits);
  for (const value of bytes) {
    bits.append(value, 8);
  }

  bits.append(0, Math.min(4, capacityBits - bits.length));
  bits.append(0, (8 - (bits.length % 8)) % 8);

  const codewords = bits.toCodewords();
  for (let i = 0; codewords.length < capacityBits / 8; i += 1) {
    codewords.push(PAD_CODEWORDS[i % PAD_CODEWORDS.length]);
  }

  return codewords;
}

function addErrorCorrectionAndInterleave(
  dataCodewords: readonly number[],
  version: number,
  errorCorrection: QrErrorCorrection,
): number[] {
  const blockCount = ERROR_CORRECTION_BLOCKS[errorCorrection][version];
  const eccLength = ECC_CODEWORDS_PER_BLOCK[errorCorrection][version];
  const rawCodewordCount = getNumRawDataModules(version) / 8;
  const shortBlockCount = blockCount - (rawCodewordCount % blockCount);
  const shortBlockLength = Math.floor(rawCodewordCount / blockCount);
  const generator = reedSolomonGenerator(eccLength);
  const blocks: number[][] = [];
  let dataIndex = 0;

  // QR interleaves uneven blocks. Short blocks get a temporary zero byte so all
  // arrays share one length, then that temporary byte is skipped during output.
  for (let i = 0; i < blockCount; i += 1) {
    const dataLength = shortBlockLength - eccLength + (i < shortBlockCount ? 0 : 1);
    const blockData = dataCodewords.slice(dataIndex, dataIndex + dataLength);
    dataIndex += dataLength;
    const ecc = reedSolomonRemainder(blockData, generator);
    if (i < shortBlockCount) {
      blockData.push(0);
    }
    blocks.push(blockData.concat(ecc));
  }

  const result: number[] = [];
  for (let i = 0; i < blocks[0].length; i += 1) {
    blocks.forEach((block, blockIndex) => {
      if (i !== shortBlockLength - eccLength || blockIndex >= shortBlockCount) {
        result.push(block[i]);
      }
    });
  }

  return result;
}

function drawBaseMatrix(version: number): { modules: Matrix; functionModules: Matrix } {
  const size = version * 4 + 17;
  const modules = createMatrix(size);
  const functionModules = createMatrix(size);

  drawFinderPattern(modules, functionModules, 3, 3);
  drawFinderPattern(modules, functionModules, size - 4, 3);
  drawFinderPattern(modules, functionModules, 3, size - 4);
  drawAlignmentPatterns(modules, functionModules, version);
  drawTimingPatterns(modules, functionModules);
  drawFormatBits(modules, functionModules, version, 'M', 0);
  drawVersionBits(modules, functionModules, version);

  return { modules, functionModules };
}

function drawFinderPattern(modules: Matrix, functionModules: Matrix, centerX: number, centerY: number): void {
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x < 0 || y < 0 || y >= modules.length || x >= modules.length) {
        continue;
      }
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      setFunctionModule(modules, functionModules, x, y, distance !== 2 && distance !== 4);
    }
  }
}

function drawAlignmentPatterns(modules: Matrix, functionModules: Matrix, version: number): void {
  const positions = getAlignmentPatternPositions(version);
  const last = positions.length - 1;

  positions.forEach((x, xIndex) => {
    positions.forEach((y, yIndex) => {
      const overlapsFinder =
        (xIndex === 0 && yIndex === 0) || (xIndex === 0 && yIndex === last) || (xIndex === last && yIndex === 0);
      if (!overlapsFinder) {
        drawAlignmentPattern(modules, functionModules, x, y);
      }
    });
  });
}

function drawAlignmentPattern(modules: Matrix, functionModules: Matrix, centerX: number, centerY: number): void {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      setFunctionModule(modules, functionModules, centerX + dx, centerY + dy, distance !== 1);
    }
  }
}

function drawTimingPatterns(modules: Matrix, functionModules: Matrix): void {
  for (let i = 0; i < modules.length; i += 1) {
    if (!functionModules[6][i]) {
      setFunctionModule(modules, functionModules, i, 6, i % 2 === 0);
    }
    if (!functionModules[i][6]) {
      setFunctionModule(modules, functionModules, 6, i, i % 2 === 0);
    }
  }
}

function drawFormatBits(
  modules: Matrix,
  functionModules: Matrix,
  version: number,
  errorCorrection: QrErrorCorrection,
  mask: number,
): void {
  const size = version * 4 + 17;
  const data = (FORMAT_BITS[errorCorrection] << 3) | mask;
  let remainder = data;

  // BCH remainder for the 15-bit format string, then the QR-required mask.
  for (let i = 0; i < 10; i += 1) {
    remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) * 0x537);
  }
  const bits = ((data << 10) | remainder) ^ 0x5412;
  const bit = (i: number): boolean => ((bits >>> i) & 1) !== 0;

  for (let i = 0; i <= 5; i += 1) {
    setFunctionModule(modules, functionModules, 8, i, bit(i));
  }
  setFunctionModule(modules, functionModules, 8, 7, bit(6));
  setFunctionModule(modules, functionModules, 8, 8, bit(7));
  setFunctionModule(modules, functionModules, 7, 8, bit(8));
  for (let i = 9; i < 15; i += 1) {
    setFunctionModule(modules, functionModules, 14 - i, 8, bit(i));
  }

  for (let i = 0; i < 8; i += 1) {
    setFunctionModule(modules, functionModules, size - 1 - i, 8, bit(i));
  }
  for (let i = 8; i < 15; i += 1) {
    setFunctionModule(modules, functionModules, 8, size - 15 + i, bit(i));
  }

  setFunctionModule(modules, functionModules, 8, size - 8, true);
}

function drawVersionBits(modules: Matrix, functionModules: Matrix, version: number): void {
  if (version < 7) {
    return;
  }

  let remainder = version;
  for (let i = 0; i < 12; i += 1) {
    remainder = (remainder << 1) ^ (((remainder >>> 11) & 1) * 0x1f25);
  }
  const bits = (version << 12) | remainder;
  const size = modules.length;

  for (let i = 0; i < 18; i += 1) {
    const bit = ((bits >>> i) & 1) !== 0;
    const a = size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    setFunctionModule(modules, functionModules, a, b, bit);
    setFunctionModule(modules, functionModules, b, a, bit);
  }
}

function drawCodewords(modules: Matrix, functionModules: Matrix, codewords: readonly number[]): void {
  const bits = codewords.flatMap(codeword =>
    Array.from({ length: 8 }, (_, index) => ((codeword >>> (7 - index)) & 1) !== 0),
  );
  let bitIndex = 0;
  let upward = true;

  // Data travels upward/downward through paired columns, skipping the timing column.
  for (let right = modules.length - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right = 5;
    }
    for (let vertical = 0; vertical < modules.length; vertical += 1) {
      const y = upward ? modules.length - 1 - vertical : vertical;
      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset;
        if (!functionModules[y][x]) {
          modules[y][x] = bits[bitIndex] ?? false;
          bitIndex += 1;
        }
      }
    }
    upward = !upward;
  }
}

function applyBestMask(
  modules: Matrix,
  functionModules: Matrix,
  version: number,
  errorCorrection: QrErrorCorrection,
): Matrix {
  let bestModules = modules;
  let bestPenalty = Number.POSITIVE_INFINITY;

  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = cloneMatrix(modules);
    applyMask(candidate, functionModules, mask);
    drawFormatBits(candidate, cloneMatrix(functionModules), version, errorCorrection, mask);
    const penalty = getPenaltyScore(candidate);

    if (penalty < bestPenalty) {
      bestModules = candidate;
      bestPenalty = penalty;
    }
  }

  return bestModules;
}

function applyMask(modules: Matrix, functionModules: Matrix, mask: number): void {
  for (let y = 0; y < modules.length; y += 1) {
    for (let x = 0; x < modules.length; x += 1) {
      if (!functionModules[y][x] && maskBit(mask, x, y)) {
        modules[y][x] = !modules[y][x];
      }
    }
  }
}

function maskBit(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (x + y) % 3 === 0;
    case 4:
      return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

function getPenaltyScore(modules: Matrix): number {
  let penalty = 0;
  const size = modules.length;

  for (let y = 0; y < size; y += 1) {
    penalty += getLineRunPenalty(modules[y]);
    penalty += getFinderLikePenalty(modules[y]);
  }

  for (let x = 0; x < size; x += 1) {
    const column = modules.map(row => row[x]);
    penalty += getLineRunPenalty(column);
    penalty += getFinderLikePenalty(column);
  }

  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const color = modules[y][x];
      if (color === modules[y][x + 1] && color === modules[y + 1][x] && color === modules[y + 1][x + 1]) {
        penalty += 3;
      }
    }
  }

  const darkModules = modules.flat().filter(Boolean).length;
  penalty += Math.floor(Math.abs(darkModules * 20 - size * size * 10) / (size * size)) * 10;

  return penalty;
}

function getLineRunPenalty(line: readonly boolean[]): number {
  let penalty = 0;
  let runColor = line[0];
  let runLength = 1;

  for (let i = 1; i <= line.length; i += 1) {
    if (i < line.length && line[i] === runColor) {
      runLength += 1;
    } else {
      if (runLength >= 5) {
        penalty += 3 + (runLength - 5);
      }
      runColor = line[i];
      runLength = 1;
    }
  }

  return penalty;
}

function getFinderLikePenalty(line: readonly boolean[]): number {
  let penalty = 0;
  const patterns = [
    [true, false, true, true, true, false, true, false, false, false, false],
    [false, false, false, false, true, false, true, true, true, false, true],
  ];

  for (let i = 0; i <= line.length - 11; i += 1) {
    if (patterns.some(pattern => pattern.every((value, index) => line[i + index] === value))) {
      penalty += 40;
    }
  }

  return penalty;
}

function getAlignmentPatternPositions(version: number): number[] {
  if (version === 1) {
    return [];
  }

  const size = version * 4 + 17;
  const count = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const result = [6];

  for (let pos = size - 7; result.length < count; pos -= step) {
    result.splice(1, 0, pos);
  }

  return result;
}

function getNumDataCodewords(version: number, errorCorrection: QrErrorCorrection): number {
  const rawCodewordCount = getNumRawDataModules(version) / 8;
  return (
    rawCodewordCount -
    ECC_CODEWORDS_PER_BLOCK[errorCorrection][version] * ERROR_CORRECTION_BLOCKS[errorCorrection][version]
  );
}

function getNumRawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;

  if (version >= 2) {
    const alignmentCount = Math.floor(version / 7) + 2;
    result -= (25 * alignmentCount - 10) * alignmentCount - 55;
  }

  if (version >= 7) {
    result -= 36;
  }

  return result;
}

function reedSolomonGenerator(degree: number): number[] {
  const result = Array<number>(degree - 1).fill(0);
  result.push(1);
  let root = 1;

  // Generator polynomial over GF(2^8), using QR's primitive polynomial.
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < result.length; j += 1) {
      result[j] = reedSolomonMultiply(result[j], root);
      if (j + 1 < result.length) {
        result[j] ^= result[j + 1];
      }
    }
    root = reedSolomonMultiply(root, 0x02);
  }

  return result;
}

function reedSolomonRemainder(data: readonly number[], generator: readonly number[]): number[] {
  const result = Array<number>(generator.length).fill(0);

  data.forEach(value => {
    const factor = value ^ result.shift()!;
    result.push(0);
    generator.forEach((coefficient, index) => {
      result[index] ^= reedSolomonMultiply(coefficient, factor);
    });
  });

  return result;
}

function reedSolomonMultiply(x: number, y: number): number {
  let z = 0;

  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ (((z >>> 7) & 1) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }

  return z & 0xff;
}

function createMatrix(size: number): Matrix {
  return Array.from({ length: size }, () => Array<boolean>(size).fill(false));
}

function cloneMatrix(matrix: Matrix): Matrix {
  return matrix.map(row => [...row]);
}

function setFunctionModule(modules: Matrix, functionModules: Matrix, x: number, y: number, dark: boolean): void {
  modules[y][x] = dark;
  functionModules[y][x] = true;
}

function toSvg(modules: Matrix, pixelSize: number): string {
  const size = modules.length;
  const viewBoxSize = size + QUIET_ZONE_MODULES * 2;
  const svgSize = Math.max(1, Math.floor(pixelSize));
  const segments: string[] = [];

  // The SVG viewBox includes QR's required four-module quiet zone. This replaces
  // CSS padding so the scanner margin travels with the generated QR itself.
  modules.forEach((row, y) => {
    for (let x = 0; x < size; x += 1) {
      if (!row[x]) {
        continue;
      }
      const start = x;
      while (x < size && row[x]) {
        x += 1;
      }
      const pathX = start + QUIET_ZONE_MODULES;
      const pathY = y + QUIET_ZONE_MODULES;
      segments.push(`M${pathX} ${pathY}h${x - start}v1H${pathX}z`);
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" role="presentation" focusable="false" shape-rendering="crispEdges"><path fill="currentColor" d="${segments.join('')}"/></svg>`;
}

class BitBuffer {
  private readonly bits: boolean[] = [];

  public get length(): number {
    return this.bits.length;
  }

  public append(value: number, length: number): void {
    for (let i = length - 1; i >= 0; i -= 1) {
      this.bits.push(((value >>> i) & 1) !== 0);
    }
  }

  public toCodewords(): number[] {
    const result: number[] = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let value = 0;
      for (let j = 0; j < 8; j += 1) {
        value = (value << 1) | (this.bits[i + j] ? 1 : 0);
      }
      result.push(value);
    }
    return result;
  }
}
