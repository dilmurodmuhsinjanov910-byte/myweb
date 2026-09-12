/**
 * Challenger 2 Adversarial Video Asset & File Integrity Verification Suite
 * 
 * Verifies:
 * 1. All 42 WebM files in assets/videos_webm/ have genuine VP9 alpha (ALPHA_MODE: 1, yuva420p / alpha channel).
 * 2. All 19 hardware catalog models and 6 sneaker models map to existing, valid video files with zero 404s.
 * 3. Byte-for-byte SHA256 parity between personal_brand_v4.html and index.html.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { extractHardwareCatalog, extractSneakersCatalog, getHtmlContent } = require('../e2e/helpers/dom_inspector.js');

const rootDir = path.resolve(__dirname, '../..');

function logResult(title, passed, detail = '') {
  const icon = passed ? '  ✓' : '  ✗ FAILED:';
  console.log(`${icon} ${title}${detail ? ' (' + detail + ')' : ''}`);
  if (!passed) {
    throw new Error(`Assertion failed: ${title} - ${detail}`);
  }
}

function verifyByteForByteParity() {
  console.log('\n--- 1. BYTE-FOR-BYTE SHA256 PARITY VERIFICATION ---');
  const v4Path = path.join(rootDir, 'personal_brand_v4.html');
  const indexPath = path.join(rootDir, 'index.html');

  if (!fs.existsSync(v4Path)) throw new Error('Missing personal_brand_v4.html');
  if (!fs.existsSync(indexPath)) throw new Error('Missing index.html');

  const v4Buf = fs.readFileSync(v4Path);
  const indexBuf = fs.readFileSync(indexPath);

  const hashV4 = crypto.createHash('sha256').update(v4Buf).digest('hex').toUpperCase();
  const hashIndex = crypto.createHash('sha256').update(indexBuf).digest('hex').toUpperCase();

  logResult('File size match', v4Buf.length === indexBuf.length, `${v4Buf.length} bytes`);
  logResult('SHA256 cryptographic match', hashV4 === hashIndex, `Hash: ${hashV4}`);
  logResult('Buffer exact equality', v4Buf.equals(indexBuf), 'Identical byte-for-byte');

  return { hash: hashV4, size: v4Buf.length };
}

function verifyWebmAlphaAssets() {
  console.log('\n--- 2. ALL 42 WEBM VP9 ALPHA ASSETS VERIFICATION ---');
  const webmDir = path.join(rootDir, 'assets/videos_webm');
  if (!fs.existsSync(webmDir)) throw new Error('Missing assets/videos_webm directory');

  const files = fs.readdirSync(webmDir).filter(f => f.endsWith('.webm'));
  logResult('WebM asset file count is exactly 42', files.length === 42, `Found ${files.length} files`);

  let alphaModeCount = 0;
  let vp9CodecCount = 0;
  let nonZeroSizeCount = 0;
  let verifiedAlphaPixelsCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fullPath = path.join(webmDir, file);
    const stat = fs.statSync(fullPath);

    if (stat.size > 0) nonZeroSizeCount++;

    // ffprobe video stream
    const ffprobeOut = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,pix_fmt:stream_tags=ALPHA_MODE -of json "${fullPath}"`,
      { encoding: 'utf8', timeout: 8000 }
    );
    const parsed = JSON.parse(ffprobeOut);
    const stream = parsed.streams && parsed.streams[0];

    if (!stream) {
      throw new Error(`No video stream found in ${file}`);
    }

    if (stream.codec_name === 'vp9') {
      vp9CodecCount++;
    } else {
      throw new Error(`File ${file} codec is ${stream.codec_name}, expected vp9`);
    }

    if (stream.tags && stream.tags.ALPHA_MODE === '1') {
      alphaModeCount++;
    } else {
      throw new Error(`File ${file} is missing ALPHA_MODE: 1 tag!`);
    }

    // Spot-check 5 files for real transparent pixel values (alpha < 255) using libvpx-vp9 decoder
    if (i % 8 === 0 || i === files.length - 1) {
      try {
        const rawPixels = execSync(
          `ffmpeg -v error -vcodec libvpx-vp9 -i "${fullPath}" -vframes 1 -f rawvideo -pix_fmt rgba -`,
          { maxBuffer: 16 * 1024 * 1024, timeout: 10000 }
        );
        let hasTransparentPixel = false;
        // Sample every 16th pixel alpha channel
        for (let p = 3; p < rawPixels.length; p += 64) {
          if (rawPixels[p] === 0) {
            hasTransparentPixel = true;
            break;
          }
        }
        if (hasTransparentPixel) {
          verifiedAlphaPixelsCount++;
        } else {
          console.warn(`Warning: File ${file} has ALPHA_MODE=1 but frame 1 has no alpha=0 pixels`);
        }
      } catch (err) {
        throw new Error(`ffmpeg raw decode failed for ${file}: ${err.message}`);
      }
    }
  }

  logResult('All 42 WebM files have non-zero file size', nonZeroSizeCount === 42, `${nonZeroSizeCount}/42`);
  logResult('All 42 WebM files are encoded with VP9 codec', vp9CodecCount === 42, `${vp9CodecCount}/42`);
  logResult('All 42 WebM files specify container ALPHA_MODE: 1', alphaModeCount === 42, `${alphaModeCount}/42`);
  logResult('Decoded frames confirm genuine transparent alpha channels', verifiedAlphaPixelsCount >= 6, `${verifiedAlphaPixelsCount} spot-checked`);

  return { total: files.length, vp9CodecCount, alphaModeCount };
}

function verifyModelMappingsAndZero404() {
  console.log('\n--- 3. HARDWARE & SNEAKER MODEL MAPPING & ZERO 404s ---');
  const htmlContent = getHtmlContent('personal_brand_v4.html');

  // Verify Hardware Catalog (19 models across 4 categories)
  const hwCat = extractHardwareCatalog(htmlContent);
  const categories = ['headphones', 'mice', 'speakers', 'keyboards'];

  let totalHwModels = 0;
  for (const cat of categories) {
    if (!hwCat[cat] || !Array.isArray(hwCat[cat])) {
      throw new Error(`Missing category ${cat} in HARDWARE_CATALOG`);
    }
    totalHwModels += hwCat[cat].length;
    for (const model of hwCat[cat]) {
      // Validate model schema
      if (!model.id || !model.name || !model.video || !model.videoMp4) {
        throw new Error(`Incomplete hardware model schema: ${JSON.stringify(model)}`);
      }

      // Validate video file existence
      const webmPath = path.join(rootDir, model.video);
      if (!fs.existsSync(webmPath)) {
        throw new Error(`404 NOT FOUND: Hardware WebM video missing for ${model.id}: ${model.video}`);
      }
      const statWebm = fs.statSync(webmPath);
      if (statWebm.size === 0) {
        throw new Error(`Empty file: ${model.video}`);
      }

      // Validate videoMp4 fallback file existence
      const mp4Path = path.join(rootDir, model.videoMp4);
      if (!fs.existsSync(mp4Path)) {
        throw new Error(`404 NOT FOUND: Hardware MP4 companion missing for ${model.id}: ${model.videoMp4}`);
      }

      // Validate thumb / image existence
      if (model.thumb) {
        const thumbPath = path.join(rootDir, model.thumb);
        if (!fs.existsSync(thumbPath)) {
          throw new Error(`404 NOT FOUND: Hardware thumb missing for ${model.id}: ${model.thumb}`);
        }
      }
      if (model.image) {
        const imgPath = path.join(rootDir, model.image);
        if (!fs.existsSync(imgPath)) {
          throw new Error(`404 NOT FOUND: Hardware image missing for ${model.id}: ${model.image}`);
        }
      }
    }
  }

  logResult('Hardware catalog contains exactly 19 models across 4 categories', totalHwModels === 19, `Total: ${totalHwModels} models (5 headphones, 5 mice, 5 speakers, 4 keyboards)`);
  logResult('All 19 hardware models map to existing WebM and MP4 video files with zero 404s', true, '19/19 mapped');

  // Verify Sneakers Catalog (6 flagship models)
  const snkCat = extractSneakersCatalog(htmlContent);
  if (!Array.isArray(snkCat) || snkCat.length !== 6) {
    throw new Error(`Sneakers catalog must contain exactly 6 models, found: ${snkCat ? snkCat.length : 0}`);
  }

  for (const snk of snkCat) {
    if (!snk.id || (!snk.model && !snk.name) || !snk.video || !snk.videoMp4) {
      throw new Error(`Incomplete sneaker model schema: ${JSON.stringify(snk)}`);
    }

    const webmPath = path.join(rootDir, snk.video);
    if (!fs.existsSync(webmPath)) {
      throw new Error(`404 NOT FOUND: Sneaker WebM video missing for ${snk.id}: ${snk.video}`);
    }
    const statWebm = fs.statSync(webmPath);
    if (statWebm.size === 0) {
      throw new Error(`Empty file: ${snk.video}`);
    }

    const mp4Path = path.join(rootDir, snk.videoMp4);
    if (!fs.existsSync(mp4Path)) {
      throw new Error(`404 NOT FOUND: Sneaker MP4 companion missing for ${snk.id}: ${snk.videoMp4}`);
    }
  }

  logResult('Sneakers catalog contains exactly 6 flagship models', snkCat.length === 6, '6/6 models');
  logResult('All 6 sneaker models map to existing WebM and MP4 video files with zero 404s', true, '6/6 mapped');

  return { totalHardware: totalHwModels, totalSneakers: snkCat.length };
}

function runAll() {
  console.log('================================================================');
  console.log('  CHALLENGER 2: VIDEO ASSETS, PARITY & 404 FORENSIC AUDIT');
  console.log('================================================================');
  const t0 = Date.now();

  const parity = verifyByteForByteParity();
  const webm = verifyWebmAlphaAssets();
  const models = verifyModelMappingsAndZero404();

  const duration = ((Date.now() - t0) / 1000).toFixed(2);
  console.log('\n================================================================');
  console.log(`  VERIFICATION PASSED in ${duration}s!`);
  console.log(`  • Byte Parity: 100% SHA256 MATCH (${parity.hash})`);
  console.log(`  • WebM Assets: 42/42 VP9 ALPHA_MODE=1 VERIFIED`);
  console.log(`  • Model Videos: 25/25 (19 HW + 6 Sneaker) 0 404s VERIFIED`);
  console.log('================================================================\n');
}

if (require.main === module) {
  runAll();
}

module.exports = {
  verifyByteForByteParity,
  verifyWebmAlphaAssets,
  verifyModelMappingsAndZero404
};
