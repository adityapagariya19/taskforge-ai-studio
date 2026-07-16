/**
 * A genuine ZIP file encoder — STORED (uncompressed) entries with correct
 * CRC-32 checksums and valid local file header / central directory
 * structure per the ZIP spec. No dependency, no fake bytes: any unzip tool
 * (Finder, 7-Zip, `unzip`) opens the result correctly. This exists so demo
 * mode's "download AI-generated code" button produces a real file, exactly
 * matching what the real backend's java.util.zip-based endpoint returns —
 * per the product requirement that guest mode never fakes functionality.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date): { time: number; date: number } {
  const time = ((date.getHours() & 0x1f) << 11) | ((date.getMinutes() & 0x3f) << 5) | ((date.getSeconds() >> 1) & 0x1f);
  const dosDate = (((date.getFullYear() - 1980) & 0x7f) << 9) | (((date.getMonth() + 1) & 0xf) << 5) | (date.getDate() & 0x1f);
  return { time, date: dosDate };
}

function writeUint32LE(arr: number[], value: number) {
  arr.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}
function writeUint16LE(arr: number[], value: number) {
  arr.push(value & 0xff, (value >>> 8) & 0xff);
}

export interface ZipEntryInput { filename: string; content: string }

export function buildZip(entries: ZipEntryInput[]): Blob {
  const encoder = new TextEncoder();
  const { time, date } = dosDateTime(new Date());

  const localParts: Uint8Array[] = [];
  const centralParts: number[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.filename);
    const contentBytes = encoder.encode(entry.content);
    const crc = crc32(contentBytes);

    const local: number[] = [];
    writeUint32LE(local, 0x04034b50); // local file header signature
    writeUint16LE(local, 20);         // version needed
    writeUint16LE(local, 0);          // flags
    writeUint16LE(local, 0);          // method = STORED
    writeUint16LE(local, time);
    writeUint16LE(local, date);
    writeUint32LE(local, crc);
    writeUint32LE(local, contentBytes.length); // compressed size
    writeUint32LE(local, contentBytes.length); // uncompressed size
    writeUint16LE(local, nameBytes.length);
    writeUint16LE(local, 0); // extra field length

    const localHeader = new Uint8Array(local);
    const localEntry = new Uint8Array(localHeader.length + nameBytes.length + contentBytes.length);
    localEntry.set(localHeader, 0);
    localEntry.set(nameBytes, localHeader.length);
    localEntry.set(contentBytes, localHeader.length + nameBytes.length);
    localParts.push(localEntry);

    writeUint32LE(centralParts, 0x02014b50); // central directory signature
    writeUint16LE(centralParts, 20);         // version made by
    writeUint16LE(centralParts, 20);         // version needed
    writeUint16LE(centralParts, 0);
    writeUint16LE(centralParts, 0);
    writeUint16LE(centralParts, time);
    writeUint16LE(centralParts, date);
    writeUint32LE(centralParts, crc);
    writeUint32LE(centralParts, contentBytes.length);
    writeUint32LE(centralParts, contentBytes.length);
    writeUint16LE(centralParts, nameBytes.length);
    writeUint16LE(centralParts, 0); // extra length
    writeUint16LE(centralParts, 0); // comment length
    writeUint16LE(centralParts, 0); // disk number
    writeUint16LE(centralParts, 0); // internal attrs
    writeUint32LE(centralParts, 0); // external attrs
    writeUint32LE(centralParts, offset); // relative offset of local header
    for (const b of nameBytes) centralParts.push(b);

    offset += localEntry.length;
  }

  const centralDirStart = offset;
  const centralDirBytes = new Uint8Array(centralParts);

  const end: number[] = [];
  writeUint32LE(end, 0x06054b50); // end of central directory signature
  writeUint16LE(end, 0);          // disk number
  writeUint16LE(end, 0);          // disk with central dir
  writeUint16LE(end, entries.length); // entries on this disk
  writeUint16LE(end, entries.length); // total entries
  writeUint32LE(end, centralDirBytes.length); // size of central dir
  writeUint32LE(end, centralDirStart);        // offset of central dir
  writeUint16LE(end, 0); // comment length

  const totalSize = offset + centralDirBytes.length + end.length;
  const output = new Uint8Array(totalSize);
  let pos = 0;
  for (const part of localParts) { output.set(part, pos); pos += part.length; }
  output.set(centralDirBytes, pos); pos += centralDirBytes.length;
  output.set(new Uint8Array(end), pos);

  return new Blob([output], { type: 'application/zip' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
