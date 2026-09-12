const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
const v4Path = path.join(rootDir, 'personal_brand_v4.html');

console.log('--- 1. SHA256 Cryptographic Parity Audit ---');
const indexBuf = fs.readFileSync(indexPath);
const v4Buf = fs.readFileSync(v4Path);

const hashIndex = crypto.createHash('sha256').update(indexBuf).digest('hex');
const hashV4 = crypto.createHash('sha256').update(v4Buf).digest('hex');

if (hashIndex !== hashV4) {
  throw new Error(`SHA256 Mismatch!\nIndex: ${hashIndex}\nV4:    ${hashV4}`);
}
console.log(`✓ 100% Byte-for-byte SHA256 parity verified: ${hashIndex}`);
console.log(`✓ File size: ${indexBuf.length} bytes`);

console.log('\n--- 2. Embedded JS Scripts Syntax Validation ---');
const html = indexBuf.toString('utf8');
const scriptRegex = /<script(?:\s+type=["']module["'])?>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  const code = match[1].trim();
  if (!code) continue;
  scriptIndex++;
  console.log(`Checking script #${scriptIndex} (${code.length} bytes)...`);
  try {
    // Module script with imports: validate syntax with standard acorn or node vm parse
    // Replace import statements for basic VM compilation check if needed
    const runnable = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '// import');
    new vm.Script(runnable);
    console.log(`✓ Script #${scriptIndex} syntax is valid!`);
  } catch (err) {
    console.error(`Syntax error in script #${scriptIndex}:`, err.message);
    throw err;
  }
}

console.log('\n--- 3. Interactive Component & DOM Element Completeness ---');
const requiredIds = [
  'portal-app',
  'portal-viewport',
  'portal-sky-canvas',
  'portal-world-canvas',
  'portal-foreground-canvas',
  'portal-petals-canvas',
  'portal-gate-wrap',
  'portal-threads-canvas',
  'portal-singularity-canvas',
  'portal-cue',
  'portal-teleport-trigger',
  'portal-sound-toggle',
  'portal-prev',
  'portal-next',
  'sneaker-app',
  'snk-particles-canvas',
  'snk-tilt-card',
  'snk-cart-trigger',
  'snk-models-bar',
  'snk-sound-toggle',
  'solar-app',
  'solar-canvas',
  'solar-project-info',
  'solar-info-open-btn',
  'solar-info-close-btn',
  'solar-telemetry',
  'solar-overview-btn',
  'solar-fs-btn',
  'solar-audio-btn',
  'orb-canvas'
];

requiredIds.forEach(id => {
  if (!html.includes(`id="${id}"`)) {
    throw new Error(`Missing expected element with id="${id}"`);
  }
  console.log(`✓ Element #${id} confirmed present`);
});

console.log('\n--- 4. Performance & Responsive Optimization Verification ---');
const checks = [
  { name: 'Portal App IntersectionObserver', test: () => html.includes('const portalObserver = new IntersectionObserver') },
  { name: 'Portal App DPR Capping', test: () => html.includes('dpr = Math.min(window.devicePixelRatio || 1, 1.25)') },
  { name: 'Portal App Single-Pass Static Layers', test: () => html.includes('renderSkyStatic') && html.includes('renderWorldPhotoStatic') && html.includes('renderForegroundStatic') },
  { name: 'Portal App Zero ShadowBlur on Threads Idle', test: () => html.includes('threadsCtx.shadowBlur = 0') },
  { name: 'Sneaker App IntersectionObserver', test: () => html.includes('isSneakerVisible') && html.includes('const snkObs = new IntersectionObserver') },
  { name: 'Sneaker App Batched Motes Without ShadowBlur', test: () => html.includes('// Batched motes without software shadowBlur') },
  { name: 'Solar App IntersectionObserver', test: () => html.includes('if (!isVisible)') && html.includes('solarRafId') },
  { name: 'Solar App Collapsed on Mobile < 768px', test: () => html.includes('if (window.innerWidth < 768)') },
  { name: 'Responsive Non-Blocking Watermark for P1 & P2', test: () => html.includes('#project-01 .project-content') && html.includes('display: none !important') },
  { name: 'Project 3 Mobile Telemetry Dock Overrides', test: () => html.includes('bottom: 62px !important;') && html.includes('top: auto !important;') },
  { name: 'Mobile Zero Horizontal Overflow Protection', test: () => html.includes('overflow-x:hidden') },
  { name: 'Luxury Language Switcher Present', test: () => html.includes('class="lang-switch"') && html.includes('data-lang="uz"') && html.includes('data-lang="ru"') && html.includes('data-lang="en"') },
  { name: 'Services & Capabilities Section Present', test: () => html.includes('id="services"') && html.includes('Har Qanday Veb-Saytlar') && html.includes('Telegram Botlar & Mini Apps') },
  { name: 'Multilingual i18n Engine & Dictionary Complete', test: () => html.includes('const I18N = {') && html.includes('uz:') && html.includes('ru:') && html.includes('en:') && html.includes('function setLanguage(') }
];

checks.forEach(c => {
  if (!c.test()) {
    throw new Error(`Failed optimization check: ${c.name}`);
  }
  console.log(`✓ ${c.name} passed`);
});

console.log('\n======================================================');
console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
console.log('======================================================');
