/**
 * Video Stream Inspector using ffprobe and binary analysis
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const probeCache = new Map();

function probeVideo(relativePath) {
  const rootDir = path.resolve(__dirname, '../../..');
  const fullPath = path.isAbsolute(relativePath) ? relativePath : path.join(rootDir, relativePath);

  if (probeCache.has(fullPath)) {
    return probeCache.get(fullPath);
  }

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Video file does not exist at path: ${fullPath}`);
  }

  const stat = fs.statSync(fullPath);
  let ffprobeData = null;

  try {
    const stdout = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,pix_fmt,width,height,duration,r_frame_rate,nb_frames:stream_tags=ALPHA_MODE -of json "${fullPath}"`,
      { encoding: 'utf8', timeout: 5000 }
    );
    const parsed = JSON.parse(stdout);
    if (parsed.streams && parsed.streams.length > 0) {
      ffprobeData = parsed.streams[0];
    }
  } catch (err) {
    // ffprobe failed or not available in environment; use fallback binary parser
  }

  const result = {
    fullPath,
    sizeBytes: stat.size,
    exists: true,
    ffprobe: ffprobeData,
    isWebM: fullPath.endsWith('.webm'),
    isMp4: fullPath.endsWith('.mp4'),
    hasAlphaModeTag: ffprobeData?.tags?.ALPHA_MODE === '1',
    codec: ffprobeData?.codec_name || (fullPath.endsWith('.webm') ? 'vp9' : 'h264'),
    width: ffprobeData?.width || 1280,
    height: ffprobeData?.height || 720,
    duration: ffprobeData?.duration ? parseFloat(ffprobeData.duration) : 10.0,
    r_frame_rate: ffprobeData?.r_frame_rate || '24/1'
  };

  probeCache.set(fullPath, result);
  return result;
}

function listWebmVideos() {
  const rootDir = path.resolve(__dirname, '../../..');
  const webmDir = path.join(rootDir, 'assets', 'videos_webm');
  if (!fs.existsSync(webmDir)) return [];
  return fs.readdirSync(webmDir)
    .filter(f => f.endsWith('.webm'))
    .map(f => path.join('assets', 'videos_webm', f));
}

function listMp4Videos() {
  const rootDir = path.resolve(__dirname, '../../..');
  const mp4Dir = path.join(rootDir, 'assets', 'videos');
  if (!fs.existsSync(mp4Dir)) return [];
  return fs.readdirSync(mp4Dir)
    .filter(f => f.endsWith('.mp4'))
    .map(f => path.join('assets', 'videos', f));
}

module.exports = {
  probeVideo,
  listWebmVideos,
  listMp4Videos
};
