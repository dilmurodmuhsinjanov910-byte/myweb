const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
const v4Path = path.join(rootDir, 'personal_brand_v4.html');

let html = fs.readFileSync(indexPath, 'utf8');
const originalLength = html.length;
const eol = html.includes('\r\n') ? '\r\n' : '\n';

console.log('Detected EOL:', JSON.stringify(eol));

// 1. CSS Overrides for Project 3 and Mobile/Tablet
const targetCssRegex = /\/\*\s*Keep Bottom Dock and Watermark anchored beautifully\s*\*\/[\s\S]*?#project-03\s+\.solar-telemetry-panel\s*\{[\s\S]*?\}/;
if (!targetCssRegex.test(html)) {
  console.error('Target CSS regex failed to match!');
  process.exit(1);
}

const replacementCss = [
  '    /* S-Tier Multi-Device Spatial Layout System */',
  '    @media (min-width: 769px) {',
  '      #project-03 .solar-planet-dock {',
  '        bottom: 22px !important;',
  '        z-index: 25 !important;',
  '      }',
  '      #project-03 .solar-watermark {',
  '        bottom: 66px !important;',
  '        z-index: 20 !important;',
  '      }',
  '      #project-03 .solar-top-bar {',
  '        top: 18px !important;',
  '        left: 24px !important;',
  '        right: 24px !important;',
  '        z-index: 25 !important;',
  '      }',
  '      #project-03 .solar-telemetry-panel {',
  '        top: 68px !important;',
  '        right: 24px !important;',
  '        z-index: 20 !important;',
  '      }',
  '    }',
  '',
  '    /* Mobile & Tablet Specific Optimizations (375px - 768px) */',
  '    @media (max-width: 768px) {',
  '      #project-03 .solar-planet-dock {',
  '        bottom: 12px !important;',
  '        padding: 4px 8px !important;',
  '        max-width: calc(100% - 16px) !important;',
  '        z-index: 25 !important;',
  '      }',
  '      #project-03 .solar-watermark {',
  '        display: none !important;',
  '      }',
  '      #project-03 .solar-top-bar {',
  '        top: 10px !important;',
  '        left: 10px !important;',
  '        right: 10px !important;',
  '        z-index: 25 !important;',
  '      }',
  '      #project-03 .solar-telemetry-panel {',
  '        top: auto !important;',
  '        bottom: 62px !important;',
  '        left: 10px !important;',
  '        right: 10px !important;',
  '        width: calc(100% - 20px) !important;',
  '        max-width: calc(100% - 20px) !important;',
  '        max-height: 180px !important;',
  '        overflow-y: auto !important;',
  '        z-index: 20 !important;',
  '      }',
  '      .dock-planet-moons {',
  '        display: none !important;',
  '      }',
  '      .dock-planet-name {',
  '        font-size: 8.5px !important;',
  '      }',
  '      .solar-dock-item {',
  '        padding: 3px 8px !important;',
  '      }',
  '      .solar-badge {',
  '        display: none !important;',
  '      }',
  '      .solar-brand-mark {',
  '        padding: 4px 8px !important;',
  '      }',
  '      .solar-logo {',
  '        font-size: 9.5px !important;',
  '      }',
  '      .solar-speed-btn {',
  '        padding: 3px 6px !important;',
  '        font-size: 8px !important;',
  '      }',
  '    }',
  '',
  '    @media (max-width: 520px) {',
  '      #solar-overview-btn span,',
  '      #solar-fs-btn span,',
  '      #solar-audio-btn span {',
  '        display: none !important;',
  '      }',
  '      .solar-action-btn {',
  '        padding: 5px 8px !important;',
  '      }',
  '      .solar-speed-controls {',
  '        padding: 2px !important;',
  '        gap: 1px !important;',
  '      }',
  '    }',
  '',
  '    /* Non-blocking luxury watermark for Project 1 & 2 on tablet & mobile */',
  '    @media (max-width: 1024px) {',
  '      #project-01 .project-content,',
  '      #project-02 .project-content {',
  '        position: absolute !important;',
  '        top: 14px !important;',
  '        left: 16px !important;',
  '        z-index: 25 !important;',
  '        width: auto !important;',
  '        max-width: 260px !important;',
  '        padding: 0 !important;',
  '        pointer-events: none !important;',
  '      }',
  '      #project-01 .project-content .project-number,',
  '      #project-02 .project-content .project-number {',
  '        font-size: 7px !important;',
  '        letter-spacing: 0.16em !important;',
  '        margin-bottom: 2px !important;',
  '      }',
  '      #project-01 .project-content .project-title,',
  '      #project-02 .project-content .project-title {',
  '        font-size: 18px !important;',
  '        line-height: 1.05 !important;',
  '        margin-bottom: 0 !important;',
  '      }',
  '      #project-01 .project-content .project-meta,',
  '      #project-02 .project-content .project-meta,',
  '      #project-01 .project-content .impact,',
  '      #project-02 .project-content .impact {',
  '        display: none !important;',
  '      }',
  '      #project-01 .project-app-container,',
  '      #project-02 .project-app-container {',
  '        position: absolute !important;',
  '        inset: 10px !important;',
  '        width: calc(100% - 20px) !important;',
  '        height: calc(100% - 20px) !important;',
  '        margin: 0 !important;',
  '        transform: none !important;',
  '        border-radius: 12px !important;',
  '      }',
  '      #project-01 .project-visual,',
  '      #project-02 .project-visual {',
  '        inset: 0 !important;',
  '      }',
  '      .portal-header {',
  '        padding: 0 10px !important;',
  '        height: 40px !important;',
  '      }',
  '      .portal-nav-tabs {',
  '        overflow-x: auto !important;',
  '        scrollbar-width: none !important;',
  '        -webkit-overflow-scrolling: touch !important;',
  '        gap: 8px !important;',
  '        flex: 1 !important;',
  '        margin: 0 6px !important;',
  '      }',
  '      .portal-nav-tabs::-webkit-scrollbar {',
  '        display: none !important;',
  '      }',
  '      .portal-tab {',
  '        white-space: nowrap !important;',
  '        flex-shrink: 0 !important;',
  '        font-size: 7.5px !important;',
  '        padding: 2px 4px !important;',
  '      }',
  '      .portal-cue {',
  '        bottom: 12px !important;',
  '        padding: 4px 10px !important;',
  '      }',
  '      .portal-cue-text {',
  '        font-size: 6.5px !important;',
  '      }',
  '      .portal-gate-wrap {',
  '        width: min(250px, 64%) !important;',
  '        aspect-ratio: 1/1 !important;',
  '        max-height: 72% !important;',
  '        margin-top: 6px !important;',
  '      }',
  '      .portal-footer {',
  '        padding: 0 10px !important;',
  '        height: 40px !important;',
  '      }',
  '      .portal-arrow-btn {',
  '        width: 24px !important;',
  '        height: 24px !important;',
  '      }',
  '      .portal-pills {',
  '        gap: 4px !important;',
  '        overflow-x: auto !important;',
  '        scrollbar-width: none !important;',
  '      }',
  '      .portal-pills::-webkit-scrollbar {',
  '        display: none !important;',
  '      }',
  '      .portal-pill {',
  '        font-size: 7px !important;',
  '        padding: 2px 6px !important;',
  '      }',
  '      .portal-hint {',
  '        display: none !important;',
  '      }',
  '    }',
  '',
  '    @media (max-width: 480px) {',
  '      .hero-name {',
  '        font-size: clamp(38px, 12.5vw, 54px) !important;',
  '        width: 100% !important;',
  '        letter-spacing: -0.03em !important;',
  '      }',
  '      .portal-title {',
  '        display: none !important;',
  '      }',
  '      .portal-status {',
  '        display: none !important;',
  '      }',
  '      #portal-sound-text {',
  '        display: none !important;',
  '      }',
  '      .portal-sound-btn {',
  '        padding: 3px 6px !important;',
  '      }',
  '      .portal-overlay-left {',
  '        display: none !important;',
  '      }',
  '      .snk-logo-sub {',
  '        display: none !important;',
  '      }',
  '      .snk-icon-btn span {',
  '        display: none !important;',
  '      }',
  '      .snk-icon-btn {',
  '        padding: 3px 6px !important;',
  '      }',
  '      .contact-heading {',
  '        font-size: clamp(40px, 12vw, 60px) !important;',
  '      }',
  '    }'
].join(eol);

html = html.replace(targetCssRegex, replacementCss);
console.log('✓ Applied responsive CSS overrides');

// 2. Project 1: Touchstart listener for instant touch response
const touchMoveRegex = /viewport\.addEventListener\("touchmove"[\s\S]*?\{ passive: true \}\);/;
const touchMoveMatch = html.match(touchMoveRegex);
if (touchMoveMatch) {
  const touchStartBlock = [
    'viewport.addEventListener("touchstart", (e) => {',
    '          if (e.touches && e.touches[0]) {',
    '            const rect = viewport.getBoundingClientRect();',
    '            const nx = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1;',
    '            const ny = ((e.touches[0].clientY - rect.top) / rect.height) * 2 - 1;',
    '            mouse.targetX = Math.max(-1, Math.min(1, nx * 0.75));',
    '            mouse.targetY = Math.max(-1, Math.min(1, ny * 0.75));',
    '',
    '            if (threadsCanvas) {',
    '              const tRect = threadsCanvas.getBoundingClientRect();',
    '              const tx = e.touches[0].clientX;',
    '              const ty = e.touches[0].clientY;',
    '              if (tx >= tRect.left && tx <= tRect.right && ty >= tRect.top && ty <= tRect.bottom) {',
    '                threadMouse.x = (tx - tRect.left) * (threadsCanvas.width / tRect.width);',
    '                threadMouse.y = (ty - tRect.top) * (threadsCanvas.height / tRect.height);',
    '                threadMouse.active = true;',
    '              }',
    '            }',
    '          }',
    '        }, { passive: true });',
    '        ' + touchMoveMatch[0]
  ].join(eol);

  html = html.replace(touchMoveRegex, touchStartBlock);
  console.log('✓ Added touchstart listener to Project 1');
} else {
  console.error('Could not find touchmove listener in Project 1');
}

// 3. Project 2: IntersectionObserver in initSneakerApp
const snkAppStartRegex = /function\s+initSneakerApp\(\)\s*\{\s*const\s+sneakerApp\s*=\s*document\.getElementById\("sneaker-app"\);\s*if\s*\(!sneakerApp\)\s*return;/;
if (!snkAppStartRegex.test(html)) {
  console.error('Could not match initSneakerApp start!');
  process.exit(1);
}

const snkObsBlock = [
  'function initSneakerApp() {',
  '      const sneakerApp = document.getElementById("sneaker-app");',
  '      if (!sneakerApp) return;',
  '',
  '      // Visibility Guard for Project 2: Halts RAF particles when offscreen',
  '      let isSneakerVisible = true;',
  '      if (window.IntersectionObserver) {',
  '        const snkObs = new IntersectionObserver(([entry]) => {',
  '          isSneakerVisible = entry.isIntersecting;',
  '        }, { threshold: 0.04 });',
  '        snkObs.observe(sneakerApp);',
  '      }'
].join(eol);

html = html.replace(snkAppStartRegex, snkObsBlock);
console.log('✓ Added IntersectionObserver to Project 2');

// 4. Project 2: Batched renderSnkParticles without software shadowBlur
const snkRenderRegex = /function\s+renderSnkParticles\(\)\s*\{[\s\S]*?requestAnimationFrame\(renderSnkParticles\);\s*\}\s*requestAnimationFrame\(renderSnkParticles\);/;
if (!snkRenderRegex.test(html)) {
  console.error('Could not match renderSnkParticles!');
  process.exit(1);
}

const optimizedSnkRender = [
  'function renderSnkParticles() {',
  '        requestAnimationFrame(renderSnkParticles);',
  '        if (!isSneakerVisible) return;',
  '        if (!snkParticlesCanvas || !snkParticlesCtx) return;',
  '        const w = snkCanvasW;',
  '        const h = snkCanvasH;',
  '        snkParticlesCtx.clearRect(0, 0, w, h);',
  '',
  '        // Batched motes without software shadowBlur (instant 60 FPS)',
  '        snkParticlesCtx.fillStyle = "rgba(223, 183, 108, 0.45)";',
  '        snkParticlesCtx.beginPath();',
  '        snkMotes.forEach(m => {',
  '          m.y += m.speedY;',
  '          m.x += m.speedX;',
  '          if (m.y < 0) { m.y = h; m.x = Math.random() * w; }',
  '          if (m.x < 0) m.x = w;',
  '          if (m.x > w) m.x = 0;',
  '          snkParticlesCtx.moveTo(m.x + m.r, m.y);',
  '          snkParticlesCtx.arc(m.x, m.y, m.r, 0, Math.PI * 2);',
  '        });',
  '        snkParticlesCtx.fill();',
  '',
  '        // Update specular spot lerp',
  '        snkSpot.x += (snkSpot.targetX - snkSpot.x) * 0.15;',
  '        snkSpot.y += (snkSpot.targetY - snkSpot.y) * 0.15;',
  '        if (snkLightSpot) {',
  '          snkLightSpot.style.left = `${snkSpot.x.toFixed(1)}px`;',
  '          snkLightSpot.style.top = `${snkSpot.y.toFixed(1)}px`;',
  '        }',
  '      }',
  '      requestAnimationFrame(renderSnkParticles);'
].join(eol);

html = html.replace(snkRenderRegex, optimizedSnkRender);
console.log('✓ Optimized renderSnkParticles in Project 2');

// 5. Project 3: Mobile Collapsed Default
const p3CollapseRegex = /(solarInfoOpenBtn\.addEventListener\("click",\s*\(\)\s*=>\s*\{[\s\S]*?playCelestialHarmonic\(440,\s*"sine",\s*0\.4,\s*0\.05\);\s*\}\);)/;
if (!p3CollapseRegex.test(html)) {
  console.error('Could not match p3CollapseRegex!');
  process.exit(1);
}

const p3CollapseAddition = [
  '$1',
  '',
  '        // Automatically start collapsed on mobile viewports (< 768px) so 3D space is open',
  '        if (window.innerWidth < 768) {',
  '          solarInfoPanel.classList.add("is-collapsed");',
  '          solarInfoOpenBtn.classList.add("is-active");',
  '        }'
].join(eol);

html = html.replace(p3CollapseRegex, p3CollapseAddition);
console.log('✓ Configured Project 3 Mobile Collapsed Default');

// Write index.html and personal_brand_v4.html
fs.writeFileSync(indexPath, html, 'utf8');
fs.writeFileSync(v4Path, html, 'utf8');

const hashIndex = crypto.createHash('sha256').update(fs.readFileSync(indexPath)).digest('hex');
const hashV4 = crypto.createHash('sha256').update(fs.readFileSync(v4Path)).digest('hex');

console.log('====================================================');
console.log('Original size: ', originalLength, 'bytes');
console.log('New size:      ', html.length, 'bytes');
console.log('Index SHA256:  ', hashIndex);
console.log('V4 SHA256:     ', hashV4);
console.log('Parity:        ', hashIndex === hashV4 ? '100% MATCH ✓' : 'MISMATCH ✗');
console.log('====================================================');
