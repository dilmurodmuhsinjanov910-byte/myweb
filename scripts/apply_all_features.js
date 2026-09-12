const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '..');
const srcFile = path.join(rootDir, 'personal_brand_v4.html');
const dstFile = path.join(rootDir, 'index.html');

let html = fs.readFileSync(srcFile, 'utf8');
const isCrlf = html.includes('\r\n');

function replaceExact(content, target, replacement) {
  const normContent = content.replace(/\r\n/g, '\n');
  const normTarget = target.replace(/\r\n/g, '\n');
  const normRepl = replacement.replace(/\r\n/g, '\n');

  if (!normContent.includes(normTarget)) {
    throw new Error('Target snippet not found:\n' + target.slice(0, 150) + '...');
  }
  const result = normContent.replace(normTarget, normRepl);
  return isCrlf ? result.replace(/\n/g, '\r\n') : result;
}

console.log('--- Step 1: Project 1 Sakura Petals & Stardust Particles ---');
// In initPortalApp, add petals canvas initialization and rendering
const targetPortalCanvases = `      const worldCanvas = document.getElementById("portal-world-canvas");
      const worldCtx = worldCanvas ? worldCanvas.getContext("2d") : null;
      const foregroundCanvas = document.getElementById("portal-foreground-canvas");
      const fgCtx = foregroundCanvas ? foregroundCanvas.getContext("2d") : null;`;

const replacementPortalCanvases = `      const worldCanvas = document.getElementById("portal-world-canvas");
      const worldCtx = worldCanvas ? worldCanvas.getContext("2d") : null;
      const foregroundCanvas = document.getElementById("portal-foreground-canvas");
      const fgCtx = foregroundCanvas ? foregroundCanvas.getContext("2d") : null;
      
      // Feature 4: Atmospheric Sakura Petals & Golden Stardust
      const petalsCanvas = document.getElementById("portal-petals-canvas");
      const petalsCtx = petalsCanvas ? petalsCanvas.getContext("2d") : null;
      const portalAtmosphere = {
        petals: Array.from({ length: 28 }, () => ({
          x: Math.random() * 1000,
          y: Math.random() * 700,
          size: 4 + Math.random() * 6,
          speedY: 0.6 + Math.random() * 0.9,
          speedX: -0.3 + Math.random() * 0.6,
          swayAmp: 1.2 + Math.random() * 1.8,
          swayFreq: 0.015 + Math.random() * 0.02,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: 0.01 + Math.random() * 0.02,
          alpha: 0.35 + Math.random() * 0.45
        })),
        stardust: Array.from({ length: 45 }, () => ({
          x: Math.random() * 1000,
          y: Math.random() * 700,
          radius: 0.6 + Math.random() * 1.4,
          speedY: -0.2 - Math.random() * 0.4,
          speedX: -0.2 + Math.random() * 0.4,
          pulseSpeed: 0.03 + Math.random() * 0.04,
          phase: Math.random() * Math.PI * 2,
          alpha: 0.25 + Math.random() * 0.55
        }))
      };

      function renderPortalAtmosphere(w, h, tick) {
        if (!petalsCtx || !petalsCanvas) return;
        petalsCtx.clearRect(0, 0, w, h);

        // Render Golden Stardust
        portalAtmosphere.stardust.forEach(star => {
          star.y += star.speedY;
          star.x += star.speedX;
          if (star.y < 0) star.y = h;
          if (star.x < 0) star.x = w;
          if (star.x > w) star.x = 0;
          const a = star.alpha * (0.6 + 0.4 * Math.sin(tick * star.pulseSpeed + star.phase));
          petalsCtx.save();
          petalsCtx.fillStyle = \`rgba(223, 183, 108, \${a.toFixed(3)})\`;
          petalsCtx.shadowColor = "rgba(223, 183, 108, 0.8)";
          petalsCtx.shadowBlur = 6;
          petalsCtx.beginPath();
          petalsCtx.arc(star.x % w, star.y % h, star.radius, 0, Math.PI * 2);
          petalsCtx.fill();
          petalsCtx.restore();
        });

        // Render Sakura Petals with Organic Bezier Curve & Dynamic Sway
        portalAtmosphere.petals.forEach(petal => {
          petal.y += petal.speedY;
          petal.x += petal.speedX + Math.sin(petal.y * petal.swayFreq + tick * 0.02) * petal.swayAmp;
          petal.rotation += petal.rotSpeed;
          if (petal.y > h + 20) { petal.y = -20; petal.x = Math.random() * w; }
          if (petal.x < -20) petal.x = w + 20;
          if (petal.x > w + 20) petal.x = -20;

          petalsCtx.save();
          petalsCtx.translate(petal.x, petal.y);
          petalsCtx.rotate(petal.rotation);
          petalsCtx.fillStyle = \`rgba(255, 192, 203, \${petal.alpha.toFixed(3)})\`;
          petalsCtx.shadowColor = "rgba(255, 182, 193, 0.5)";
          petalsCtx.shadowBlur = 4;
          petalsCtx.beginPath();
          petalsCtx.moveTo(0, -petal.size);
          petalsCtx.bezierCurveTo(petal.size * 0.8, -petal.size * 0.6, petal.size * 0.8, petal.size * 0.6, 0, petal.size);
          petalsCtx.bezierCurveTo(-petal.size * 0.8, petal.size * 0.6, -petal.size * 0.8, -petal.size * 0.6, 0, -petal.size);
          petalsCtx.fill();
          petalsCtx.restore();
        });
      }`;

html = replaceExact(html, targetPortalCanvases, replacementPortalCanvases);

// In resizeAllCanvases, add petalsCanvas sizing
const targetResizeCanvases = `        if (foregroundCanvas) {
          const rect = foregroundCanvas.getBoundingClientRect();
          foregroundCanvas.width = Math.max(rect.width * dpr, 400);
          foregroundCanvas.height = Math.max(rect.height * dpr, 300);
        }`;

const replacementResizeCanvases = `        if (foregroundCanvas) {
          const rect = foregroundCanvas.getBoundingClientRect();
          foregroundCanvas.width = Math.max(rect.width * dpr, 400);
          foregroundCanvas.height = Math.max(rect.height * dpr, 300);
        }
        if (petalsCanvas) {
          petalsCanvas.width = Math.max(rect.width * dpr, 400);
          petalsCanvas.height = Math.max(rect.height * dpr, 300);
        }`;

html = replaceExact(html, targetResizeCanvases, replacementResizeCanvases);

// In animLoop, add call to renderPortalAtmosphere
const targetAnimLoop = `        renderForeground(w, h, d, fgOffX, fgOffY);
        renderNeonCosmicPortal();
        updateHangingThreadsPhysics(cosmicTick);
        renderHangingThreads();`;

const replacementAnimLoop = `        renderForeground(w, h, d, fgOffX, fgOffY);
        renderNeonCosmicPortal();
        updateHangingThreadsPhysics(cosmicTick);
        renderHangingThreads();
        renderPortalAtmosphere(w, h, cosmicTick);`;

html = replaceExact(html, targetAnimLoop, replacementAnimLoop);
console.log('✓ Project 1 Sakura Petals & Stardust integrated');

console.log('--- Step 2: Project 2 Sneaker Atelier Enhancements ---');
// In initSneakerApp, add kinetic odometer utility, light spot, particle system, autospin, and enriched audio
const targetSnkAudio = `      function playCartChime() {
        if (!isAudioEnabled) return;
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
            g.gain.setValueAtTime(0, ctx.currentTime + i * 0.05);
            g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.05 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.05 + 0.35);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.05);
            osc.stop(ctx.currentTime + i * 0.05 + 0.4);
          });
        } catch (e) {}
      }`;

const replacementSnkAudio = `      function playCartChime() {
        if (!isAudioEnabled) return;
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
            g.gain.setValueAtTime(0, ctx.currentTime + i * 0.05);
            g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.05 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.05 + 0.35);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.05);
            osc.stop(ctx.currentTime + i * 0.05 + 0.4);
          });
        } catch (e) {}
      }

      // Feature 5: Enhanced Granular Haptic Synthesizer
      function playClothSwatchPluck(freq = 360) {
        if (!isAudioEnabled) return;
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const filt = ctx.createBiquadFilter();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.4, ctx.currentTime + 0.08);
          filt.type = "lowpass";
          filt.frequency.setValueAtTime(1400, ctx.currentTime);
          filt.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
          g.gain.setValueAtTime(0.08, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
          osc.connect(filt);
          filt.connect(g);
          g.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
        } catch (e) {}
      }

      function playDrawerGlide() {
        if (!isAudioEnabled) return;
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(220, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.15);
          g.gain.setValueAtTime(0.03, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.17);
        } catch (e) {}
      }

      // Feature 3: Kinetic Typography Odometer & Digit Roll
      function rollOdometer(element, targetNum, prefix = "", suffix = "", duration = 400) {
        if (!element) return;
        const currentText = (element.textContent || "").replace(/[^0-9.]/g, "");
        const startNum = parseFloat(currentText) || 0;
        if (startNum === targetNum) {
          element.textContent = \`\${prefix}\${targetNum.toLocaleString()}\${suffix}\`;
          return;
        }
        element.classList.add("odometer-rolling");
        const startTime = performance.now();
        function stepOdo(now) {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / duration);
          const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          const val = Math.round(startNum + (targetNum - startNum) * ease);
          element.textContent = \`\${prefix}\${val.toLocaleString()}\${suffix}\`;
          if (progress < 1) {
            requestAnimationFrame(stepOdo);
          } else {
            element.textContent = \`\${prefix}\${targetNum.toLocaleString()}\${suffix}\`;
            setTimeout(() => element.classList.remove("odometer-rolling"), 100);
          }
        }
        requestAnimationFrame(stepOdo);
      }`;

html = replaceExact(html, targetSnkAudio, replacementSnkAudio);

// In initSneakerApp, replace the tiltCard listener and add particles & autospin
const targetSnkTilt = `      // Smooth 3D Mouse Parallax Tilt
      if (tiltCard && renderBox) {
        tiltCard.addEventListener("mousemove", (e) => {
          const rect = tiltCard.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          const tiltX = (x * 12).toFixed(2);
          const tiltY = (-y * 12).toFixed(2);
          renderBox.style.transform = \`perspective(1000px) rotateX(\${tiltY}deg) rotateY(\${tiltX}deg) scale(1.02)\`;
        });

        tiltCard.addEventListener("mouseleave", () => {
          renderBox.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
        });
      }`;

const replacementSnkTilt = `      // Feature 2: Dynamic Specular Studio Lighting Flare (Sneakers)
      const snkLightSpot = document.getElementById("snk-light-spot");
      let snkSpot = { x: 160, y: 140, targetX: 160, targetY: 140 };

      // Feature 4: Atmospheric Champagne-Gold Dust Micro-Particles (Sneakers)
      const snkParticlesCanvas = document.getElementById("snk-particles-canvas");
      const snkParticlesCtx = snkParticlesCanvas ? snkParticlesCanvas.getContext("2d") : null;
      const snkMotes = Array.from({ length: 24 }, () => ({
        x: Math.random() * 320,
        y: Math.random() * 280,
        r: 0.8 + Math.random() * 1.5,
        speedY: -0.2 - Math.random() * 0.4,
        speedX: -0.15 + Math.random() * 0.3,
        alpha: 0.25 + Math.random() * 0.45
      }));

      function renderSnkParticles() {
        if (!snkParticlesCanvas || !snkParticlesCtx) return;
        const rect = snkParticlesCanvas.getBoundingClientRect();
        if (snkParticlesCanvas.width !== Math.round(rect.width) || snkParticlesCanvas.height !== Math.round(rect.height)) {
          snkParticlesCanvas.width = Math.max(Math.round(rect.width), 300);
          snkParticlesCanvas.height = Math.max(Math.round(rect.height), 240);
        }
        const w = snkParticlesCanvas.width;
        const h = snkParticlesCanvas.height;
        snkParticlesCtx.clearRect(0, 0, w, h);

        snkMotes.forEach(m => {
          m.y += m.speedY;
          m.x += m.speedX;
          if (m.y < 0) { m.y = h; m.x = Math.random() * w; }
          if (m.x < 0) m.x = w;
          if (m.x > w) m.x = 0;

          snkParticlesCtx.save();
          snkParticlesCtx.fillStyle = \`rgba(223, 183, 108, \${m.alpha.toFixed(3)})\`;
          snkParticlesCtx.shadowColor = "rgba(223, 183, 108, 0.6)";
          snkParticlesCtx.shadowBlur = 4;
          snkParticlesCtx.beginPath();
          snkParticlesCtx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          snkParticlesCtx.fill();
          snkParticlesCtx.restore();
        });

        // Update specular spot lerp
        snkSpot.x += (snkSpot.targetX - snkSpot.x) * 0.15;
        snkSpot.y += (snkSpot.targetY - snkSpot.y) * 0.15;
        if (snkLightSpot) {
          snkLightSpot.style.left = \`\${snkSpot.x.toFixed(1)}px\`;
          snkLightSpot.style.top = \`\${snkSpot.y.toFixed(1)}px\`;
        }

        requestAnimationFrame(renderSnkParticles);
      }
      requestAnimationFrame(renderSnkParticles);

      // Smooth 3D Mouse / Touch Parallax Tilt with Specular Spot Tracking
      if (tiltCard && renderBox) {
        const handleCardPointer = (e) => {
          const rect = tiltCard.getBoundingClientRect();
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          const x = (clientX - rect.left) / rect.width - 0.5;
          const y = (clientY - rect.top) / rect.height - 0.5;
          const tiltX = (x * 12).toFixed(2);
          const tiltY = (-y * 12).toFixed(2);
          renderBox.style.transform = \`perspective(1000px) rotateX(\${tiltY}deg) rotateY(\${tiltX}deg) scale(1.02)\`;

          snkSpot.targetX = clientX - rect.left;
          snkSpot.targetY = clientY - rect.top;
        };

        tiltCard.addEventListener("mousemove", handleCardPointer);
        tiltCard.addEventListener("touchmove", handleCardPointer, { passive: true });

        const resetCardPointer = () => {
          renderBox.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
        };
        tiltCard.addEventListener("mouseleave", resetCardPointer);
        tiltCard.addEventListener("touchend", resetCardPointer);
      }`;

html = replaceExact(html, targetSnkTilt, replacementSnkTilt);

// In updateSneakerView, support 90 and 180 angles and use rollOdometer on price
const targetSnkView = `        if (isAerialView || activeAngle === "top") {
          angleKey = "top";
          angleLabel = "TOP // AERIAL LACE";
        } else if (activeAngle === "270") {
          angleKey = "heel";
          angleLabel = "270° // HEEL ARCHIVE";
        } else if (activeAngle === "45") {
          angleKey = "threequarter";
          angleLabel = "45° // 3/4 FRONT";
        } else {
          angleKey = "profile";
          angleLabel = "0° // PROFILE";
        }`;

const replacementSnkView = `        if (isAerialView || activeAngle === "top") {
          angleKey = "top";
          angleLabel = "TOP // AERIAL LACE";
        } else if (activeAngle === "270") {
          angleKey = "heel";
          angleLabel = "270° // HEEL ARCHIVE";
        } else if (activeAngle === "180") {
          angleKey = "heel";
          angleLabel = "180° // REAR MONOGRAM";
        } else if (activeAngle === "90") {
          angleKey = "threequarter";
          angleLabel = "90° // MEDIAL ARCH";
        } else if (activeAngle === "45") {
          angleKey = "threequarter";
          angleLabel = "45° // 3/4 FRONT";
        } else {
          angleKey = "profile";
          angleLabel = "0° // PROFILE";
        }`;

html = replaceExact(html, targetSnkView, replacementSnkView);

// In updateSneakerView, update priceValEl with rollOdometer
const targetPriceVal = `if (priceValEl) priceValEl.textContent = \`\${sneaker.currency}\${sneaker.price.toLocaleString()}\`;`;
const replacementPriceVal = `if (priceValEl) rollOdometer(priceValEl, sneaker.price, sneaker.currency);`;
html = replaceExact(html, targetPriceVal, replacementPriceVal);

// Wire autospin button and drawer glide sound at end of initSneakerApp
const targetSnkInitEnd = `      // Initial Viewport Render
      updateSneakerView();
      updateCartUI();
    })();`;

const replacementSnkInitEnd = `      // Autospin 360° Toggle Control
      const autospinBtn = document.getElementById("snk-autospin-btn");
      const autospinText = document.getElementById("snk-autospin-text");
      let isAutoSpinning = false;
      let autoSpinInterval = null;
      const angleSequence = ["0", "45", "90", "180", "270", "top"];
      let seqIdx = 0;

      if (autospinBtn) {
        autospinBtn.addEventListener("click", () => {
          isAutoSpinning = !isAutoSpinning;
          autospinBtn.classList.toggle("active", isAutoSpinning);
          if (autospinText) autospinText.textContent = isAutoSpinning ? "SPINNING" : "SPIN 360°";
          playClothSwatchPluck(480);
          if (isAutoSpinning) {
            autoSpinInterval = setInterval(() => {
              seqIdx = (seqIdx + 1) % angleSequence.length;
              activeAngle = angleSequence[seqIdx];
              isAerialView = (activeAngle === "top");
              updateSneakerView();
            }, 1400);
          } else {
            clearInterval(autoSpinInterval);
          }
        });
      }

      // Drawer Open/Close Silky Audio Hook
      if (cartTrigger) {
        cartTrigger.addEventListener("click", () => {
          playDrawerGlide();
        });
      }

      // Initial Viewport Render
      updateSneakerView();
      updateCartUI();
    })();`;

html = replaceExact(html, targetSnkInitEnd, replacementSnkInitEnd);
console.log('✓ Project 2 Sneaker Atelier Enhancements integrated');

console.log('--- Step 3: Project 3 Hardware Showcase Enhancements ---');

// In initHardwareApp, implement:
// 1. Feature 1: Multi-Depth 3D Exploded X-Ray Parallax
// 2. Feature 2: Specular Lighting Flare
// 3. Feature 4: Atmospheric Micro-Particles
// 4. Feature 3: Kinetic Typography Odometer on price & weight
// 5. High-DPI canvas scaling on frCanvas & visCanvas
// 6. Granular audio synthesis
// 7. Rotation buttons & video play button hooks

const targetHwAudio = `      function playReservationChime() {
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
          [440, 554.37, 659.25, 880].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
            g.gain.setValueAtTime(0, ctx.currentTime + idx * 0.06);
            g.gain.linearRampToValueAtTime(0.07, ctx.currentTime + idx * 0.06 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.06 + 0.4);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.06);
            osc.stop(ctx.currentTime + idx * 0.06 + 0.45);
          });
        } catch (e) {}
      }`;

const replacementHwAudio = `      function playReservationChime() {
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
          [440, 554.37, 659.25, 880].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
            g.gain.setValueAtTime(0, ctx.currentTime + idx * 0.06);
            g.gain.linearRampToValueAtTime(0.07, ctx.currentTime + idx * 0.06 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.06 + 0.4);
            osc.connect(g);
            g.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.06);
            osc.stop(ctx.currentTime + idx * 0.06 + 0.45);
          });
        } catch (e) {}
      }

      // Feature 5: Granular Haptic Synthesizer (Hardware Studio)
      function playChamberResonance(freq = 160) {
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + 0.12);
          filter.type = "bandpass";
          filter.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);
          filter.Q.setValueAtTime(6.0, ctx.currentTime);
          g.gain.setValueAtTime(0.09, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
          osc.connect(filter);
          filter.connect(g);
          g.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        } catch (e) {}
      }

      function playSliderTick(depth) {
        const ctx = getAudioContext();
        if (!ctx) return;
        try {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const f = 700 + depth * 8; // 700Hz to 1500Hz depending on depth
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, ctx.currentTime);
          g.gain.setValueAtTime(0.02, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.02);
        } catch (e) {}
      }

      // Feature 3: Kinetic Typography Odometer (Hardware Studio)
      function rollHwOdometer(element, targetNum, prefix = "", suffix = "", duration = 400) {
        if (!element) return;
        const currentText = (element.textContent || "").replace(/[^0-9.]/g, "");
        const startNum = parseFloat(currentText) || 0;
        if (startNum === targetNum) {
          element.textContent = \`\${prefix}\${targetNum.toLocaleString()}\${suffix}\`;
          return;
        }
        element.classList.add("odometer-rolling");
        const startTime = performance.now();
        function stepOdo(now) {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / duration);
          const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          const val = Math.round(startNum + (targetNum - startNum) * ease);
          element.textContent = \`\${prefix}\${val.toLocaleString()}\${suffix}\`;
          if (progress < 1) {
            requestAnimationFrame(stepOdo);
          } else {
            element.textContent = \`\${prefix}\${targetNum.toLocaleString()}\${suffix}\`;
            setTimeout(() => element.classList.remove("odometer-rolling"), 100);
          }
        }
        requestAnimationFrame(stepOdo);
      }`;

html = replaceExact(html, targetHwAudio, replacementHwAudio);

// Replace the parallax tilt in initHardwareApp with Feature 1, Feature 2, Feature 4
const targetHwTilt = `      // Smooth 3D Cursor Parallax Tilt
      if (hwViewport && hwRotator) {
        hwViewport.addEventListener("mousemove", (e) => {
          const rect = hwViewport.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          const tiltX = (x * 10).toFixed(2);
          const tiltY = (-y * 10).toFixed(2);
          hwRotator.style.transform = \`perspective(1000px) rotateX(\${tiltY}deg) rotateY(\${tiltX}deg)\`;
        });

        hwViewport.addEventListener("mouseleave", () => {
          hwRotator.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
        });
      }`;

const replacementHwTilt = `      // Feature 1: Multi-Depth 3D Exploded X-Ray Parallax & Rig State
      let hwTilt = { x: 0, y: 0, targetX: 0, targetY: 0 };
      let hwPointer = { x: 200, y: 150, targetX: 200, targetY: 150 };
      let hwTurntableDeg = 0;
      let xrayExpansionDepth = 0; // 0.0 to 1.0

      const hwLightSpot = document.getElementById("hw-light-spot");
      const layerChassis = document.getElementById("hw-layer-chassis");
      const layerDriver = document.getElementById("hw-layer-driver");
      const layerMagnets = document.getElementById("hw-layer-magnets");
      const layerPcb = document.getElementById("hw-layer-pcb");
      const hwCallout1 = document.getElementById("hw-callout-1");
      const hwCallout2 = document.getElementById("hw-callout-2");
      const hwCallout3 = document.getElementById("hw-callout-3");
      const hwCallout4 = document.getElementById("hw-callout-4");

      // Feature 4: Atmospheric Cyber Motes Micro-Particles (Hardware)
      const hwParticlesCanvas = document.getElementById("hw-particles-canvas");
      const hwParticlesCtx = hwParticlesCanvas ? hwParticlesCanvas.getContext("2d") : null;
      const hwMotes = Array.from({ length: 32 }, () => ({
        x: Math.random() * 500,
        y: Math.random() * 400,
        r: 0.7 + Math.random() * 1.5,
        speedY: -0.15 - Math.random() * 0.35,
        speedX: -0.2 + Math.random() * 0.4,
        alpha: 0.2 + Math.random() * 0.45
      }));

      function renderHwParticles() {
        if (!hwParticlesCanvas || !hwParticlesCtx) return;
        const rect = hwParticlesCanvas.getBoundingClientRect();
        if (hwParticlesCanvas.width !== Math.round(rect.width) || hwParticlesCanvas.height !== Math.round(rect.height)) {
          hwParticlesCanvas.width = Math.max(Math.round(rect.width), 400);
          hwParticlesCanvas.height = Math.max(Math.round(rect.height), 300);
        }
        const w = hwParticlesCanvas.width;
        const h = hwParticlesCanvas.height;
        hwParticlesCtx.clearRect(0, 0, w, h);

        hwMotes.forEach(m => {
          m.y += m.speedY;
          m.x += m.speedX;
          if (m.y < 0) { m.y = h; m.x = Math.random() * w; }
          if (m.x < 0) m.x = w;
          if (m.x > w) m.x = 0;

          hwParticlesCtx.save();
          hwParticlesCtx.fillStyle = \`rgba(223, 183, 108, \${m.alpha.toFixed(3)})\`;
          hwParticlesCtx.shadowColor = "rgba(223, 183, 108, 0.6)";
          hwParticlesCtx.shadowBlur = 4;
          hwParticlesCtx.beginPath();
          hwParticlesCtx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          hwParticlesCtx.fill();
          hwParticlesCtx.restore();
        });

        // Update Specular Studio Light Flare (Feature 2)
        hwPointer.x += (hwPointer.targetX - hwPointer.x) * 0.15;
        hwPointer.y += (hwPointer.targetY - hwPointer.y) * 0.15;
        if (hwLightSpot) {
          hwLightSpot.style.left = \`\${hwPointer.x.toFixed(1)}px\`;
          hwLightSpot.style.top = \`\${hwPointer.y.toFixed(1)}px\`;
        }

        // Update 3D Exploded X-Ray Parallax Rig (Feature 1)
        hwTilt.x += (hwTilt.targetX - hwTilt.x) * 0.12;
        hwTilt.y += (hwTilt.targetY - hwTilt.y) * 0.12;

        if (hwRotator) {
          const rotX = (-hwTilt.y * 14).toFixed(2);
          const rotY = (hwTilt.x * 14 + hwTurntableDeg).toFixed(2);
          hwRotator.style.transform = \`perspective(1200px) rotateX(\${rotX}deg) rotateY(\${rotY}deg)\`;
        }

        const exp = xrayExpansionDepth; // 0.0 to 1.0
        if (teardownImg) {
          const zFwd = (exp * 32).toFixed(1);
          const sc = (1 + exp * 0.04).toFixed(3);
          teardownImg.style.transform = \`translateZ(\${zFwd}px) scale(\${sc})\`;
        }
        if (mainImg) {
          const zBack = (-exp * 18).toFixed(1);
          mainImg.style.transform = \`translateZ(\${zBack}px)\`;
        }

        if (layerChassis) layerChassis.style.transform = \`translateZ(\${(-22 * exp).toFixed(1)}px)\`;
        if (layerDriver) layerDriver.style.transform = \`translateZ(\${(16 * exp).toFixed(1)}px)\`;
        if (layerMagnets) layerMagnets.style.transform = \`translateZ(\${(36 * exp).toFixed(1)}px)\`;
        if (layerPcb) layerPcb.style.transform = \`translateZ(\${(56 * exp).toFixed(1)}px)\`;

        if (hwCallout1) hwCallout1.style.transform = \`translate3d(\${(-16 * exp).toFixed(1)}px, \${(-10 * exp).toFixed(1)}px, \${(45 * exp).toFixed(1)}px)\`;
        if (hwCallout2) hwCallout2.style.transform = \`translate3d(\${(16 * exp).toFixed(1)}px, \${(-8 * exp).toFixed(1)}px, \${(55 * exp).toFixed(1)}px)\`;
        if (hwCallout3) hwCallout3.style.transform = \`translate3d(\${(-14 * exp).toFixed(1)}px, \${(12 * exp).toFixed(1)}px, \${(65 * exp).toFixed(1)}px)\`;
        if (hwCallout4) hwCallout4.style.transform = \`translate3d(\${(14 * exp).toFixed(1)}px, \${(16 * exp).toFixed(1)}px, \${(75 * exp).toFixed(1)}px)\`;

        requestAnimationFrame(renderHwParticles);
      }
      requestAnimationFrame(renderHwParticles);

      if (hwViewport) {
        const handleHwPointer = (e) => {
          const rect = hwViewport.getBoundingClientRect();
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          hwTilt.targetX = (clientX - rect.left) / rect.width - 0.5;
          hwTilt.targetY = (clientY - rect.top) / rect.height - 0.5;
          hwPointer.targetX = clientX - rect.left;
          hwPointer.targetY = clientY - rect.top;
        };

        hwViewport.addEventListener("mousemove", handleHwPointer);
        hwViewport.addEventListener("touchmove", handleHwPointer, { passive: true });

        const resetHwPointer = () => {
          hwTilt.targetX = 0;
          hwTilt.targetY = 0;
        };
        hwViewport.addEventListener("mouseleave", resetHwPointer);
        hwViewport.addEventListener("touchend", resetHwPointer);
      }`;

html = replaceExact(html, targetHwTilt, replacementHwTilt);

// High-DPI canvas scaling for drawFrequencyResponseCurve & renderVisualizerLoop
const targetFrCurve = `      // Draw Frequency Response Curve
      function drawFrequencyResponseCurve(curve) {
        if (!frCanvas || !curve) return;
        const ctx = frCanvas.getContext("2d");
        const w = frCanvas.width;
        const h = frCanvas.height;
        ctx.clearRect(0, 0, w, h);`;

const replacementFrCurve = `      // Draw Frequency Response Curve with High-DPI Scaling
      function drawFrequencyResponseCurve(curve) {
        if (!frCanvas || !curve) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = frCanvas.getBoundingClientRect();
        const rw = Math.round(rect.width || frCanvas.width);
        const rh = Math.round(rect.height || frCanvas.height);
        if (frCanvas.width !== rw * dpr || frCanvas.height !== rh * dpr) {
          frCanvas.width = rw * dpr;
          frCanvas.height = rh * dpr;
        }
        const ctx = frCanvas.getContext("2d");
        ctx.save();
        ctx.scale(dpr, dpr);
        const w = rw;
        const h = rh;
        ctx.clearRect(0, 0, w, h);`;

html = replaceExact(html, targetFrCurve, replacementFrCurve);

// Add ctx.restore() to drawFrequencyResponseCurve
const targetFrStroke = `        curve.forEach((val, i) => {
          const x = i * step;
          const y = h / 2 - (val / 6) * (h / 2);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }`;

const replacementFrStroke = `        curve.forEach((val, i) => {
          const x = i * step;
          const y = h / 2 - (val / 6) * (h / 2);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.restore();
      }`;

html = replaceExact(html, targetFrStroke, replacementFrStroke);

// Update updateModelView in initHardwareApp with rollHwOdometer and playChamberResonance
const targetHwTelPrice = `        if (telPrice) telPrice.textContent = \`$\${model.price.toLocaleString()}\`;
        if (telWeight) telWeight.textContent = model.weight;`;

const replacementHwTelPrice = `        if (telPrice) rollHwOdometer(telPrice, model.price, "$");
        if (telWeight) telWeight.textContent = model.weight;`;

html = replaceExact(html, targetHwTelPrice, replacementHwTelPrice);

const targetHwModalPrice = `        if (modalProdTitle) modalProdTitle.textContent = \`\${model.brand} \${model.name}\`;
        if (modalPriceVal) modalPriceVal.textContent = \`$\${model.price.toLocaleString()}\`;`;

const replacementHwModalPrice = `        if (modalProdTitle) modalProdTitle.textContent = \`\${model.brand} \${model.name}\`;
        if (modalPriceVal) rollHwOdometer(modalPriceVal, model.price, "$");`;

html = replaceExact(html, targetHwModalPrice, replacementHwModalPrice);

// In X-Ray slider listener, update xrayExpansionDepth and play slider ticks
const targetHwSlider = `      // X-Ray Separation Slider Bar
      if (xraySlider) {
        xraySlider.addEventListener("input", (e) => {
          const val = parseFloat(e.target.value);
          if (xraySliderVal) xraySliderVal.textContent = \`\${Math.round(val)}%\`;
          const depth = val / 100;
          
          if (teardownImg) teardownImg.style.opacity = depth.toString();
          if (mainImg) mainImg.style.opacity = (1 - depth * 0.75).toString();
          if (xrayAssembly) xrayAssembly.style.opacity = (depth > 0.35 ? ((depth - 0.35) / 0.65).toString() : "0");

          if (val > 65) {
            currentHardwareRakurs = "teardown";
            isXRayMode = true;
          } else if (val === 0 && currentHardwareRakurs === "teardown") {
            currentHardwareRakurs = "hero";
            isXRayMode = false;
          }
          if (hudAngle) {
            hudAngle.textContent = (depth > 0.35) ? "STUDIO // EXPLODED TEARDOWN" : "STUDIO // 3/4 HERO PERSPECTIVE";
          }
        });
      }`;

const replacementHwSlider = `      // X-Ray Separation Slider Bar
      if (xraySlider) {
        xraySlider.addEventListener("input", (e) => {
          const val = parseFloat(e.target.value);
          if (xraySliderVal) xraySliderVal.textContent = \`\${Math.round(val)}%\`;
          const depth = val / 100;
          xrayExpansionDepth = depth;
          playSliderTick(val);
          
          if (teardownImg) teardownImg.style.opacity = depth.toString();
          if (mainImg) mainImg.style.opacity = (1 - depth * 0.75).toString();
          if (xrayAssembly) xrayAssembly.style.opacity = (depth > 0.35 ? ((depth - 0.35) / 0.65).toString() : "0");

          if (val > 65) {
            currentHardwareRakurs = "teardown";
            isXRayMode = true;
          } else if (val === 0 && currentHardwareRakurs === "teardown") {
            currentHardwareRakurs = "hero";
            isXRayMode = false;
          }
          if (hudAngle) {
            hudAngle.textContent = (depth > 0.35) ? "STUDIO // EXPLODED TEARDOWN" : "STUDIO // 3/4 HERO PERSPECTIVE";
          }
        });
      }`;

html = replaceExact(html, targetHwSlider, replacementHwSlider);

// In rakurs button click listener, also update xrayExpansionDepth
const targetHwRakursClick = `          if (r === "teardown") {
            isXRayMode = true;
            if (xraySlider) xraySlider.value = 100;
            if (xraySliderVal) xraySliderVal.textContent = "100%";
          } else {
            isXRayMode = false;
            if (xraySlider) xraySlider.value = 0;
            if (xraySliderVal) xraySliderVal.textContent = "0%";
          }`;

const replacementHwRakursClick = `          if (r === "teardown") {
            isXRayMode = true;
            xrayExpansionDepth = 1.0;
            if (xraySlider) xraySlider.value = 100;
            if (xraySliderVal) xraySliderVal.textContent = "100%";
          } else {
            isXRayMode = false;
            xrayExpansionDepth = 0.0;
            if (xraySlider) xraySlider.value = 0;
            if (xraySliderVal) xraySliderVal.textContent = "0%";
          }`;

html = replaceExact(html, targetHwRakursClick, replacementHwRakursClick);

// Add Rotation buttons (#hw-btn-rot-left, reset, right) and Play Cinema video button listener
const targetHwInitFinish = `      // Initialize
      populateRoster();
      updateModelView();
      renderVisualizerLoop();
    })();`;

const replacementHwInitFinish = `      // Turntable Rotation Controls
      const btnRotLeft = document.getElementById("hw-btn-rot-left");
      const btnRotReset = document.getElementById("hw-btn-rot-reset");
      const btnRotRight = document.getElementById("hw-btn-rot-right");

      if (btnRotLeft) {
        btnRotLeft.addEventListener("click", () => {
          hwTurntableDeg -= 15;
          playUiTick(900, 0.025, 0.05);
        });
      }
      if (btnRotReset) {
        btnRotReset.addEventListener("click", () => {
          hwTurntableDeg = 0;
          playUiTick(1200, 0.03, 0.06);
        });
      }
      if (btnRotRight) {
        btnRotRight.addEventListener("click", () => {
          hwTurntableDeg += 15;
          playUiTick(900, 0.025, 0.05);
        });
      }

      // Cinema Playback Video Control Hook
      const btnVideoPlay = document.getElementById("hw-btn-video-play");
      const hwVideoLayer = document.getElementById("hw-video-layer");
      const hwXrayVideo = document.getElementById("hw-xray-video");
      const hwVideoBadge = document.getElementById("hw-video-badge");
      let isCinemaPlaying = false;

      if (btnVideoPlay && hwXrayVideo) {
        btnVideoPlay.addEventListener("click", () => {
          isCinemaPlaying = !isCinemaPlaying;
          btnVideoPlay.textContent = isCinemaPlaying ? "❚❚ PAUSE CINEMA" : "▶ PLAY CINEMA";
          btnVideoPlay.classList.toggle("active", isCinemaPlaying);
          if (isCinemaPlaying) {
            playChamberResonance(220);
            if (hwVideoLayer) hwVideoLayer.style.opacity = "1";
            if (hwVideoBadge) hwVideoBadge.style.display = "flex";
            hwXrayVideo.play().catch(() => {});
          } else {
            playUiTick(750, 0.03, 0.05);
            hwXrayVideo.pause();
            if (hwVideoLayer) hwVideoLayer.style.opacity = "0";
            if (hwVideoBadge) hwVideoBadge.style.display = "none";
          }
        });
      }

      // Initialize
      populateRoster();
      updateModelView();
      renderVisualizerLoop();
    })();`;

html = replaceExact(html, targetHwInitFinish, replacementHwInitFinish);
console.log('✓ Project 3 Hardware Showcase Enhancements integrated');

// Save updated personal_brand_v4.html and copy to index.html
fs.writeFileSync(srcFile, html);
fs.copyFileSync(srcFile, dstFile);

const hash1 = crypto.createHash('sha256').update(fs.readFileSync(srcFile)).digest('hex');
const hash2 = crypto.createHash('sha256').update(fs.readFileSync(dstFile)).digest('hex');

console.log('✓ Byte-for-byte sync complete');
console.log('  personal_brand_v4.html SHA256:', hash1);
console.log('  index.html SHA256:            ', hash2);
console.log('  Parity match:', hash1 === hash2);
