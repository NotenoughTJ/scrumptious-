// A standards-compliant, uncompressed ZIP for the five small ASCII RFI files.
export function zipTexts(files: { name: string; content: string }[]) {
  const encoder = new TextEncoder(), chunks: Uint8Array[] = [], central: Uint8Array[] = [];
  let offset = 0, centralSize = 0;
  const crc32 = (bytes: Uint8Array) => {
    let crc = 0xffffffff;
    for (const b of bytes) { crc ^= b; for (let bit=0;bit<8;bit++) crc = (crc>>>1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    return (crc ^ 0xffffffff) >>> 0;
  };
  for (const f of files) {
    const name = encoder.encode(f.name), data = encoder.encode(f.content), crc = crc32(data);
    const local = new Uint8Array(30 + name.length), v = new DataView(local.buffer);
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);local.set(name,30);
    chunks.push(local,data);
    const c = new Uint8Array(46+name.length), cv = new DataView(c.buffer);
    cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);c.set(name,46);
    central.push(c);centralSize+=c.length;offset+=local.length+data.length;
  }
  const end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);
  return new Blob([...chunks,...central,end] as BlobPart[], {type:"application/zip"});
}
