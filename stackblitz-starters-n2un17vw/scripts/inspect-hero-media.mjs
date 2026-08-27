process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const CDN = "https://cdn.voskopulence.com";
const MP4 = `${CDN}/hero_web_v3.mp4`;
const MASTER = `${CDN}/hero_hls/master.m3u8`;

const typeAt = (buf, offset) => buf.toString("ascii", offset + 4, offset + 8);

function readBox(buf, offset) {
  if (offset + 8 > buf.length) return null;
  let size = buf.readUInt32BE(offset);
  const type = typeAt(buf, offset);
  let header = 8;
  if (size === 1) {
    if (offset + 16 > buf.length) return null;
    const big = buf.readBigUInt64BE(offset + 8);
    if (big > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    size = Number(big);
    header = 16;
  } else if (size === 0) {
    size = buf.length - offset;
  }
  if (size < header || offset + size > buf.length) return null;
  return { offset, size, type, header, payloadStart: offset + header, end: offset + size };
}

function childBoxes(buf, parent) {
  const out = [];
  let offset = parent.payloadStart;
  while (offset + 8 <= parent.end) {
    const box = readBox(buf, offset);
    if (!box || box.end > parent.end) break;
    out.push(box);
    offset = box.end;
  }
  return out;
}

function child(buf, parent, type) {
  return childBoxes(buf, parent).find((box) => box.type === type) || null;
}

function findMoov(buf) {
  let from = 0;
  const needle = Buffer.from("moov");
  while (true) {
    const idx = buf.indexOf(needle, from);
    if (idx < 4) return null;
    const start = idx - 4;
    let size = buf.readUInt32BE(start);
    let header = 8;
    if (size === 1 && start + 16 <= buf.length) {
      const big = buf.readBigUInt64BE(start + 8);
      if (big <= BigInt(Number.MAX_SAFE_INTEGER)) {
        size = Number(big);
        header = 16;
      }
    }
    if (size >= header && start + size <= buf.length) {
      return { offset: start, size, type: "moov", header, payloadStart: start + header, end: start + size };
    }
    from = idx + 4;
  }
}

function parseTrack(buf, trak) {
  const tkhd = child(buf, trak, "tkhd");
  const mdia = child(buf, trak, "mdia");
  if (!tkhd || !mdia) return null;

  const hdlr = child(buf, mdia, "hdlr");
  const mdhd = child(buf, mdia, "mdhd");
  const handler = hdlr && hdlr.payloadStart + 12 <= hdlr.end
    ? buf.toString("ascii", hdlr.payloadStart + 8, hdlr.payloadStart + 12)
    : "";

  const width = buf.readUInt32BE(tkhd.end - 8) / 65536;
  const height = buf.readUInt32BE(tkhd.end - 4) / 65536;

  let timescale = 0;
  let durationUnits = 0;
  if (mdhd) {
    const version = buf[mdhd.payloadStart];
    if (version === 1) {
      timescale = buf.readUInt32BE(mdhd.payloadStart + 20);
      const d = buf.readBigUInt64BE(mdhd.payloadStart + 24);
      durationUnits = Number(d);
    } else {
      timescale = buf.readUInt32BE(mdhd.payloadStart + 12);
      durationUnits = buf.readUInt32BE(mdhd.payloadStart + 16);
    }
  }
  const duration = timescale ? durationUnits / timescale : 0;

  let codec = "";
  let fps = null;
  const minf = child(buf, mdia, "minf");
  const stbl = minf && child(buf, minf, "stbl");
  if (stbl) {
    const stsd = child(buf, stbl, "stsd");
    if (stsd && stsd.payloadStart + 16 <= stsd.end) {
      codec = buf.toString("ascii", stsd.payloadStart + 12, stsd.payloadStart + 16);
    }
    const stts = child(buf, stbl, "stts");
    if (stts && timescale && stts.payloadStart + 8 <= stts.end) {
      const count = buf.readUInt32BE(stts.payloadStart + 4);
      let off = stts.payloadStart + 8;
      let samples = 0;
      let totalUnits = 0;
      for (let i = 0; i < count && off + 8 <= stts.end; i++, off += 8) {
        const sampleCount = buf.readUInt32BE(off);
        const sampleDelta = buf.readUInt32BE(off + 4);
        samples += sampleCount;
        totalUnits += sampleCount * sampleDelta;
      }
      if (samples && totalUnits) fps = samples / (totalUnits / timescale);
    }
  }

  return { handler, width, height, duration, codec, fps };
}

function inspectMoov(buf, moov, fileSize) {
  const tracks = childBoxes(buf, moov)
    .filter((box) => box.type === "trak")
    .map((trak) => parseTrack(buf, trak))
    .filter(Boolean);
  const video = tracks.find((t) => t.handler === "vide") || null;
  const duration = Math.max(...tracks.map((t) => t.duration || 0), 0);
  return {
    tracks,
    video,
    duration,
    approximateFileBitrate: duration ? Math.round((fileSize * 8) / duration) : null,
  };
}

async function getRange(url, start, end) {
  const res = await fetch(url, { headers: { Range: `bytes=${start}-${end}` } });
  if (!res.ok && res.status !== 206) throw new Error(`Range ${start}-${end}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function inspectMp4() {
  const head = await fetch(MP4, { method: "HEAD" });
  const fileSize = Number(head.headers.get("content-length") || 0);
  console.log("HERO_MP4_HEADERS", JSON.stringify({
    status: head.status,
    contentType: head.headers.get("content-type"),
    contentLength: fileSize,
    acceptRanges: head.headers.get("accept-ranges"),
    etag: head.headers.get("etag"),
  }));

  const chunkSize = 8 * 1024 * 1024;
  const first = await getRange(MP4, 0, Math.min(fileSize - 1, chunkSize - 1));
  let moov = findMoov(first);
  let source = "head";
  let buffer = first;

  if (!moov && fileSize > chunkSize) {
    const start = Math.max(0, fileSize - chunkSize);
    const last = await getRange(MP4, start, fileSize - 1);
    moov = findMoov(last);
    source = "tail";
    buffer = last;
  }

  if (!moov) {
    console.log("HERO_MP4_METADATA", JSON.stringify({ error: "moov box not found in first/last 8 MiB" }));
    return;
  }

  const result = inspectMoov(buffer, moov, fileSize);
  console.log("HERO_MP4_METADATA", JSON.stringify({ moovSource: source, ...result }));
}

function parseMaster(text) {
  const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const variants = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("#EXT-X-STREAM-INF:")) continue;
    const attrs = line.slice("#EXT-X-STREAM-INF:".length);
    const resolution = /RESOLUTION=(\d+)x(\d+)/.exec(attrs);
    const bandwidth = /BANDWIDTH=(\d+)/.exec(attrs);
    const avgBandwidth = /AVERAGE-BANDWIDTH=(\d+)/.exec(attrs);
    const codecs = /CODECS="([^"]+)"/.exec(attrs);
    const frameRate = /FRAME-RATE=([0-9.]+)/.exec(attrs);
    const uri = lines[i + 1] && !lines[i + 1].startsWith("#") ? lines[i + 1] : null;
    variants.push({
      width: resolution ? Number(resolution[1]) : null,
      height: resolution ? Number(resolution[2]) : null,
      bandwidth: bandwidth ? Number(bandwidth[1]) : null,
      averageBandwidth: avgBandwidth ? Number(avgBandwidth[1]) : null,
      codecs: codecs ? codecs[1] : null,
      frameRate: frameRate ? Number(frameRate[1]) : null,
      uri,
    });
  }
  return variants;
}

async function inspectHls() {
  const res = await fetch(MASTER, { cache: "no-store" });
  const text = await res.text();
  console.log("HERO_HLS_MASTER_STATUS", JSON.stringify({ status: res.status, contentType: res.headers.get("content-type") }));
  console.log("HERO_HLS_VARIANTS", JSON.stringify(parseMaster(text)));
  console.log("HERO_HLS_MASTER_RAW_START");
  console.log(text);
  console.log("HERO_HLS_MASTER_RAW_END");
}

await Promise.all([inspectMp4(), inspectHls()]);
