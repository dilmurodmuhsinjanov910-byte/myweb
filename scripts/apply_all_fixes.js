const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "..", "personal_brand_v4.html");
const indexPath = path.join(__dirname, "..", "index.html");

let rawContent = fs.readFileSync(htmlPath, "utf8");
const isCRLF = rawContent.includes("\r\n");

// Normalize to LF for clean matching
let content = rawContent.replace(/\r\n/g, "\n");

console.log("Original file size:", content.length);

// -------------------------------------------------------------
// 1. Fix ReferenceError in resizeAllCanvases (line ~6893)
// -------------------------------------------------------------
const oldResizeCanvases = `        if (foregroundCanvas) {
          const rect = foregroundCanvas.getBoundingClientRect();
          foregroundCanvas.width = Math.max(rect.width * dpr, 400);
          foregroundCanvas.height = Math.max(rect.height * dpr, 300);
        }
        if (petalsCanvas) {
          petalsCanvas.width = Math.max(rect.width * dpr, 400);
          petalsCanvas.height = Math.max(rect.height * dpr, 300);
        }`;

const newResizeCanvases = `        if (foregroundCanvas) {
          const rect = foregroundCanvas.getBoundingClientRect();
          foregroundCanvas.width = Math.max(rect.width * dpr, 400);
          foregroundCanvas.height = Math.max(rect.height * dpr, 300);
        }
        if (petalsCanvas) {
          const rect = petalsCanvas.getBoundingClientRect();
          petalsCanvas.width = Math.max(rect.width * dpr, 400);
          petalsCanvas.height = Math.max(rect.height * dpr, 300);
        }`;

if (content.includes(oldResizeCanvases)) {
  content = content.replace(oldResizeCanvases, newResizeCanvases);
  console.log("Fixed Issue 1: petalsCanvas ReferenceError in resizeAllCanvases");
} else {
  console.log("Note: oldResizeCanvases snippet already patched or not found");
}

// -------------------------------------------------------------
// 2. Fix Sneaker initial HTML price tag ($395 instead of 395$)
// -------------------------------------------------------------
const oldSnkPriceTag = `<span class="snk-price-val" id="snk-price-val">395$</span>`;
const newSnkPriceTag = `<span class="snk-price-val" id="snk-price-val">$395</span>`;

if (content.includes(oldSnkPriceTag)) {
  content = content.replace(oldSnkPriceTag, newSnkPriceTag);
  console.log("Fixed Issue 2A: Updated initial sneaker price to $395");
}

// -------------------------------------------------------------
// 3. CSS Enhancements: Depth Layers, Specular Glare Tracking, Buttons, Odometer
// -------------------------------------------------------------
const oldCssSnippet = `    /* Feature 2: Dynamic Specular Studio Lighting Flare */
    .snk-light-spot,
    .hw-light-spot {
      position: absolute;
      width: 360px;
      height: 360px;
      border-radius: 50%;
      background: radial-gradient(circle at center, rgba(255, 248, 230, 0.22) 0%, rgba(223, 183, 108, 0.12) 28%, rgba(223, 183, 108, 0.02) 58%, transparent 72%);
      pointer-events: none;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 4;
    }
    .snk-tilt-card:hover .snk-light-spot,
    .hw-viewport:hover .hw-light-spot {
      opacity: 1;
    }

    /* Feature 4: Atmospheric Environment Micro-Particles Canvases */
    .portal-petals-canvas,
    .snk-particles-canvas,
    .hw-particles-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 6;
    }

    /* Feature 3: Kinetic Typography Odometer & Digit Roll */
    .odometer-rolling {
      display: inline-block;
      font-variant-numeric: tabular-nums;
      transition: transform 0.15s ease, text-shadow 0.25s ease;
      text-shadow: 0 0 14px rgba(223, 183, 108, 0.65), 0 0 25px rgba(223, 183, 108, 0.35);
      color: #fff6de !important;
    }
    .snk-price-val, .hw-card-price, #hw-tele-price, #snk-degree-val, #hw-hud-angle, #hw-spec-weight, #hw-xray-slider-val {
      font-variant-numeric: tabular-nums;
    }

    /* Feature 1: Multi-Depth 3D Exploded X-Ray Parallax */
    .hw-rig {
      perspective: 1200px;
      transform-style: preserve-3d;
    }
    .hw-rotator {
      transform-style: preserve-3d;
      transition: transform 0.15s cubic-bezier(0.2, 0, 0.2, 1);
    }
    .hw-main-img,
    .hw-teardown-img {
      transform-style: preserve-3d;
      backface-visibility: hidden;
      will-change: transform, opacity;
    }
    .hw-xray-assembly {
      transform-style: preserve-3d;
    }
    .hw-callout {
      transform-style: preserve-3d;
      will-change: transform;
      transition: transform 0.15s cubic-bezier(0.2, 0, 0.2, 1), opacity 0.35s ease;
    }
    .hw-cat-btn, .hw-rakurs-btn, .hw-profile-btn, .snk-model-tab, .snk-angle-pill, .snk-size-pill, .hw-hud-btn, .hw-video-toggle-btn, .snk-autospin-btn {
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }`;

const newCssSnippet = `    /* Feature 2: Dynamic Specular Studio Lighting Flare */
    .snk-light-spot,
    .hw-light-spot {
      position: absolute;
      width: 360px;
      height: 360px;
      border-radius: 50%;
      background: radial-gradient(circle at center, rgba(255, 248, 230, 0.24) 0%, rgba(223, 183, 108, 0.13) 28%, rgba(223, 183, 108, 0.02) 58%, transparent 72%);
      pointer-events: none;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 4;
    }
    .snk-tilt-card:hover .snk-light-spot,
    .snk-tilt-card.tracking .snk-light-spot,
    .hw-viewport:hover .hw-light-spot,
    .hw-viewport.tracking .hw-light-spot {
      opacity: 1;
    }

    /* Feature 4: Atmospheric Environment Micro-Particles Canvases */
    .portal-petals-canvas,
    .snk-particles-canvas,
    .hw-particles-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 6;
    }

    /* Feature 3: Kinetic Typography Odometer & Digit Roll */
    .odometer-rolling {
      display: inline-block;
      font-variant-numeric: tabular-nums;
      transition: transform 0.15s ease, text-shadow 0.25s ease;
      text-shadow: 0 0 14px rgba(223, 183, 108, 0.65), 0 0 25px rgba(223, 183, 108, 0.35);
      color: #fff6de !important;
    }
    .snk-price-val, .hw-card-price, #hw-tele-price, #snk-degree-val, #hw-hud-angle, #hw-spec-weight, #hw-spec-freq, #hw-spec-latency, #hw-spec-conn, #hw-spec-battery, #hw-xray-slider-val {
      font-variant-numeric: tabular-nums;
    }

    /* Feature 1: Multi-Depth 3D Exploded X-Ray Parallax */
    .hw-rig {
      perspective: 1200px;
      transform-style: preserve-3d;
    }
    .hw-rotator {
      transform-style: preserve-3d;
      transition: transform 0.15s cubic-bezier(0.2, 0, 0.2, 1);
    }
    .hw-main-img,
    .hw-teardown-img {
      transform-style: preserve-3d;
      backface-visibility: hidden;
      will-change: transform, opacity;
    }
    .hw-xray-assembly {
      transform-style: preserve-3d;
    }
    .hw-callout {
      transform-style: preserve-3d;
      will-change: transform;
      transition: transform 0.15s cubic-bezier(0.2, 0, 0.2, 1), opacity 0.35s ease;
    }
    .hw-depth-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
      transform-style: preserve-3d;
      opacity: 0;
      transition: opacity 0.35s ease;
      border-radius: 14px;
    }
    .hw-layer-chassis {
      border: 1px dashed rgba(223, 183, 108, 0.18);
      background: radial-gradient(circle at center, rgba(223, 183, 108, 0.035) 0%, transparent 70%);
      box-shadow: inset 0 0 24px rgba(223, 183, 108, 0.035);
    }
    .hw-layer-driver {
      border: 1px solid rgba(0, 229, 255, 0.16);
      background: radial-gradient(circle at 45% 50%, rgba(0, 229, 255, 0.05) 0%, transparent 65%);
      box-shadow: 0 0 28px rgba(0, 229, 255, 0.06);
    }
    .hw-layer-magnets {
      border: 1px dotted rgba(255, 170, 50, 0.18);
      background: radial-gradient(circle at 55% 50%, rgba(255, 170, 50, 0.04) 0%, transparent 65%);
      box-shadow: 0 0 22px rgba(255, 170, 50, 0.05);
    }
    .hw-layer-pcb {
      border: 1px solid rgba(223, 183, 108, 0.26);
      background: radial-gradient(circle at 50% 50%, rgba(223, 183, 108, 0.06) 0%, transparent 60%);
      box-shadow: inset 0 0 32px rgba(223, 183, 108, 0.05);
    }

    /* Interactive Buttons States & Touch Ergonomics */
    .hw-cat-btn, .hw-rakurs-btn, .hw-profile-btn, .snk-model-tab, .snk-angle-pill, .snk-size-btn, .hw-hud-btn, .hw-video-toggle-btn, .snk-autospin-btn {
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    .hw-rakurs-btn:hover:not(.active) {
      background: rgba(255, 255, 255, 0.12) !important;
      border-color: rgba(223, 183, 108, 0.45) !important;
      color: #fff !important;
      transform: translateY(-1px);
    }
    .hw-rakurs-btn:active {
      transform: translateY(0px) scale(0.96);
    }
    .hw-rakurs-btn.active {
      background: rgba(223, 183, 108, 0.22) !important;
      border-color: rgba(223, 183, 108, 0.5) !important;
      color: #fff3d1 !important;
    }
    .snk-angle-pill:hover:not(.active) {
      background: rgba(255, 255, 255, 0.12) !important;
      border-color: rgba(223, 183, 108, 0.4) !important;
      color: #fff !important;
      transform: translateY(-1px);
    }
    .snk-angle-pill:active {
      transform: translateY(0px) scale(0.96);
    }
    .snk-model-tab:hover:not(.active) {
      border-color: rgba(223, 183, 108, 0.5) !important;
      color: #fff !important;
    }
    .snk-size-btn:hover:not(.active) {
      border-color: rgba(223, 183, 108, 0.45) !important;
      color: #fff !important;
    }`;

if (content.includes(oldCssSnippet)) {
  content = content.replace(oldCssSnippet, newCssSnippet);
  console.log("Fixed Issue 3: Enhanced CSS depth layers, hover/active states, and mobile touch styles");
} else {
  console.log("Note: oldCssSnippet already patched or not found");
}

// -------------------------------------------------------------
// 4. Sneaker App: rollAngleOdometer, swatch audio plucks, cart silky audio, RAF particle caching
// -------------------------------------------------------------
const oldSnkAudioAndOdo = `      // Feature 3: Kinetic Typography Odometer & Digit Roll
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
      }

      // Feature 2: Dynamic Specular Studio Lighting Flare (Sneakers)
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

const newSnkAudioAndOdo = `      // Feature 3: Kinetic Typography Odometer & Digit Roll
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
            setTimeout(() => element.classList.remove("odometer-rolling"), 120);
          }
        }
        requestAnimationFrame(stepOdo);
      }

      function rollAngleOdometer(element, targetLabel, duration = 350) {
        if (!element || !targetLabel) return;
        element.classList.add("odometer-rolling");
        const curText = element.textContent || "";
        const curDegMatch = curText.match(/^(\\d+)°/);
        const tgtDegMatch = targetLabel.match(/^(\\d+)°/);

        if (curDegMatch && tgtDegMatch) {
          const startDeg = parseInt(curDegMatch[1], 10);
          const targetDeg = parseInt(tgtDegMatch[1], 10);
          const suffix = targetLabel.replace(/^\\d+°/, "");
          const startTime = performance.now();
          function stepDeg(now) {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const deg = Math.round(startDeg + (targetDeg - startDeg) * ease);
            element.textContent = \`\${deg}°\${suffix}\`;
            if (progress < 1) {
              requestAnimationFrame(stepDeg);
            } else {
              element.textContent = targetLabel;
              setTimeout(() => element.classList.remove("odometer-rolling"), 100);
            }
          }
          requestAnimationFrame(stepDeg);
        } else {
          element.textContent = targetLabel;
          setTimeout(() => element.classList.remove("odometer-rolling"), 150);
        }
      }

      // Feature 2: Dynamic Specular Studio Lighting Flare (Sneakers)
      const snkLightSpot = document.getElementById("snk-light-spot");
      let snkSpot = { x: 160, y: 140, targetX: 160, targetY: 140 };

      // Feature 4: Atmospheric Champagne-Gold Dust Micro-Particles (Sneakers)
      const snkParticlesCanvas = document.getElementById("snk-particles-canvas");
      const snkParticlesCtx = snkParticlesCanvas ? snkParticlesCanvas.getContext("2d") : null;
      let snkCanvasW = 320;
      let snkCanvasH = 260;

      function updateSnkCanvasDimensions() {
        if (!snkParticlesCanvas) return;
        const rect = snkParticlesCanvas.getBoundingClientRect();
        snkCanvasW = Math.max(Math.round(rect.width), 300);
        snkCanvasH = Math.max(Math.round(rect.height), 240);
        snkParticlesCanvas.width = snkCanvasW;
        snkParticlesCanvas.height = snkCanvasH;
      }
      updateSnkCanvasDimensions();
      window.addEventListener("resize", updateSnkCanvasDimensions);

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
        const w = snkCanvasW;
        const h = snkCanvasH;
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

        // Update specular spot lerp (Feature 2)
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
          tiltCard.classList.add("tracking");
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
          tiltCard.classList.remove("tracking");
          renderBox.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
        };
        tiltCard.addEventListener("mouseleave", resetCardPointer);
        tiltCard.addEventListener("touchend", resetCardPointer);
      }`;

if (content.includes(oldSnkAudioAndOdo)) {
  content = content.replace(oldSnkAudioAndOdo, newSnkAudioAndOdo);
  console.log("Fixed Issue 4: Updated Sneaker App with rollAngleOdometer, mobile touch tracking, and zero-reflow particles");
} else {
  console.log("Note: oldSnkAudioAndOdo already patched or not found");
}

// -------------------------------------------------------------
// 5. Sneaker App: degreeVal rollAngleOdometer & Swatch plucks
// -------------------------------------------------------------
const oldDegreeValUpdate = `        if (degreeVal) {
          degreeVal.textContent = angleLabel;
        }`;

const newDegreeValUpdate = `        if (degreeVal) {
          rollAngleOdometer(degreeVal, angleLabel);
        }`;

if (content.includes(oldDegreeValUpdate)) {
  content = content.replace(oldDegreeValUpdate, newDegreeValUpdate);
}

const oldSwatchClick = `            sw.addEventListener("click", () => {
              activeColorwayIdx = idx;
              playUiTick(1100, 0.02, 0.04);
              updateSneakerView();
            });`;

const newSwatchClick = `            sw.addEventListener("click", () => {
              activeColorwayIdx = idx;
              playClothSwatchPluck(360 + idx * 40);
              updateSneakerView();
            });`;

if (content.includes(oldSwatchClick)) {
  content = content.replace(oldSwatchClick, newSwatchClick);
  console.log("Fixed Issue 5: Hooked up playClothSwatchPluck to colorway swatches and rollAngleOdometer to degreeVal");
}

// -------------------------------------------------------------
// 6. Sneaker App: Cart silky drawer glide audio
// -------------------------------------------------------------
const oldCartOpenClose = `      function openCart() {
        if (cartDrawer && cartBackdrop) {
          cartDrawer.classList.add("open");
          cartBackdrop.classList.add("open");
        }
      }

      function closeCart() {
        if (cartDrawer && cartBackdrop) {
          cartDrawer.classList.remove("open");
          cartBackdrop.classList.remove("open");
        }
      }`;

const newCartOpenClose = `      function openCart() {
        if (cartDrawer && cartBackdrop) {
          cartDrawer.classList.add("open");
          cartBackdrop.classList.add("open");
          playDrawerGlide();
        }
      }

      function closeCart() {
        if (cartDrawer && cartBackdrop) {
          cartDrawer.classList.remove("open");
          cartBackdrop.classList.remove("open");
          playDrawerGlide();
        }
      }`;

if (content.includes(oldCartOpenClose)) {
  content = content.replace(oldCartOpenClose, newCartOpenClose);
  console.log("Fixed Issue 6: Cart open/close triggers playDrawerGlide acoustics");
}

// -------------------------------------------------------------
// 7. Hardware App: rollNumericSpec & rollHudAngle
// -------------------------------------------------------------
const oldRollHwOdo = `      // Feature 3: Kinetic Typography Odometer (Hardware Studio)
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

const newRollHwOdo = `      // Feature 3: Kinetic Typography Odometer & Numeric Spec Roll (Hardware Studio)
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
            setTimeout(() => element.classList.remove("odometer-rolling"), 120);
          }
        }
        requestAnimationFrame(stepOdo);
      }

      function rollNumericSpec(element, targetValStr, duration = 400) {
        if (!element || !targetValStr) return;
        const match = targetValStr.match(/^([^0-9.]*)([0-9]+(?:\\.[0-9]+)?)(.*)$/);
        if (!match) {
          element.textContent = targetValStr;
          return;
        }
        const prefix = match[1];
        const targetNum = parseFloat(match[2]);
        const suffix = match[3];
        const isDecimal = match[2].includes(".");

        const curText = element.textContent || "";
        const curMatch = curText.match(/^([^0-9.]*)([0-9]+(?:\\.[0-9]+)?)(.*)$/);
        const startNum = curMatch ? (parseFloat(curMatch[2]) || 0) : targetNum;

        if (startNum === targetNum) {
          element.textContent = targetValStr;
          return;
        }

        element.classList.add("odometer-rolling");
        const startTime = performance.now();
        function stepSpec(now) {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / duration);
          const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          const curVal = startNum + (targetNum - startNum) * ease;
          const formatted = isDecimal ? curVal.toFixed(1) : Math.round(curVal).toLocaleString();
          element.textContent = \`\${prefix}\${formatted}\${suffix}\`;
          if (progress < 1) {
            requestAnimationFrame(stepSpec);
          } else {
            element.textContent = targetValStr;
            setTimeout(() => element.classList.remove("odometer-rolling"), 120);
          }
        }
        requestAnimationFrame(stepSpec);
      }

      function rollHudAngle(element, targetText) {
        if (!element || !targetText) return;
        if (element.textContent === targetText) return;
        element.classList.add("odometer-rolling");
        element.textContent = targetText;
        setTimeout(() => element.classList.remove("odometer-rolling"), 180);
      }`;

if (content.includes(oldRollHwOdo)) {
  content = content.replace(oldRollHwOdo, newRollHwOdo);
  console.log("Fixed Issue 7: Added rollNumericSpec and rollHudAngle");
}

// -------------------------------------------------------------
// 8A. Hardware App: Visualizer High-DPI Scaling
// -------------------------------------------------------------
const oldVisLoop = `      // Real-Time Canvas Visualizer
      function renderVisualizerLoop() {
        if (visCanvas) {
          const ctx = visCanvas.getContext("2d");
          const w = visCanvas.width;
          const h = visCanvas.height;
          ctx.clearRect(0, 0, w, h);

          const barCount = 32;
          const barWidth = w / barCount - 1;

          let dataArray = null;
          if (analyser && isPlayingAudio) {
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
          }

          for (let i = 0; i < barCount; i++) {
            let barHeight = 3;
            if (dataArray) {
              const val = dataArray[i % dataArray.length] || 0;
              barHeight = Math.max(3, (val / 255) * h * 0.9);
            } else {
              barHeight = 2 + Math.sin(Date.now() * 0.003 + i * 0.25) * 1.5;
            }

            const x = i * (barWidth + 1);
            const y = h - barHeight;
            ctx.fillStyle = isPlayingAudio ? "#dfb76c" : "rgba(255,255,255,0.15)";
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }
        requestAnimationFrame(renderVisualizerLoop);
      }`;

const newVisLoop = `      // Real-Time Canvas Visualizer with High-DPI Scaling
      function renderVisualizerLoop() {
        if (visCanvas) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const rect = visCanvas.getBoundingClientRect();
          const rw = Math.round(rect.width || 600);
          const rh = Math.round(rect.height || 62);
          if (visCanvas.width !== rw * dpr || visCanvas.height !== rh * dpr) {
            visCanvas.width = rw * dpr;
            visCanvas.height = rh * dpr;
          }
          const ctx = visCanvas.getContext("2d");
          ctx.save();
          ctx.scale(dpr, dpr);
          const w = rw;
          const h = rh;
          ctx.clearRect(0, 0, w, h);

          const barCount = 32;
          const barWidth = w / barCount - 1;

          let dataArray = null;
          if (analyser && isPlayingAudio) {
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
          }

          for (let i = 0; i < barCount; i++) {
            let barHeight = 3;
            if (dataArray) {
              const val = dataArray[i % dataArray.length] || 0;
              barHeight = Math.max(3, (val / 255) * h * 0.9);
            } else {
              barHeight = 2 + Math.sin(Date.now() * 0.003 + i * 0.25) * 1.5;
            }

            const x = i * (barWidth + 1);
            const y = h - barHeight;
            ctx.fillStyle = isPlayingAudio ? "#dfb76c" : "rgba(255,255,255,0.15)";
            ctx.fillRect(x, y, barWidth, barHeight);
          }
          ctx.restore();
        }
        requestAnimationFrame(renderVisualizerLoop);
      }`;

if (content.includes(oldVisLoop)) {
  content = content.replace(oldVisLoop, newVisLoop);
  console.log("Fixed Issue 8A: Added visualizer high-DPI scaling");
} else {
  throw new Error("Could not find oldVisLoop");
}

// -------------------------------------------------------------
// 8B. Hardware App: 3D Multi-Layer Differential Parallax, Zero-Reflow Particles & Turntable Drag
// -------------------------------------------------------------
const oldHwParticlesAndPointer = `      // Feature 4: Atmospheric Cyber Motes Micro-Particles (Hardware)
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

const newHwParticlesAndPointer = `      // Feature 4: Atmospheric Cyber Motes Micro-Particles (Hardware)
      const hwParticlesCanvas = document.getElementById("hw-particles-canvas");
      const hwParticlesCtx = hwParticlesCanvas ? hwParticlesCanvas.getContext("2d") : null;
      let hwCanvasW = 500;
      let hwCanvasH = 400;

      function updateHwCanvasDimensions() {
        if (!hwParticlesCanvas) return;
        const rect = hwParticlesCanvas.getBoundingClientRect();
        hwCanvasW = Math.max(Math.round(rect.width), 400);
        hwCanvasH = Math.max(Math.round(rect.height), 300);
        hwParticlesCanvas.width = hwCanvasW;
        hwParticlesCanvas.height = hwCanvasH;
      }
      updateHwCanvasDimensions();
      window.addEventListener("resize", updateHwCanvasDimensions);

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
        const w = hwCanvasW;
        const h = hwCanvasH;
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

        // Multi-Depth Differential 3D Parallax Offsets (Feature 1)
        const dx = hwTilt.x * exp;
        const dy = hwTilt.y * exp;
        const layerOpacity = (exp > 0.05 ? Math.min(1, (exp - 0.05) * 1.5) : 0).toFixed(2);

        if (layerChassis) {
          layerChassis.style.opacity = layerOpacity;
          layerChassis.style.transform = \`translate3d(\${(-14 * dx).toFixed(1)}px, \${(-14 * dy).toFixed(1)}px, \${(-22 * exp).toFixed(1)}px)\`;
        }
        if (layerDriver) {
          layerDriver.style.opacity = layerOpacity;
          layerDriver.style.transform = \`translate3d(\${(12 * dx).toFixed(1)}px, \${(12 * dy).toFixed(1)}px, \${(16 * exp).toFixed(1)}px)\`;
        }
        if (layerMagnets) {
          layerMagnets.style.opacity = layerOpacity;
          layerMagnets.style.transform = \`translate3d(\${(24 * dx).toFixed(1)}px, \${(24 * dy).toFixed(1)}px, \${(36 * exp).toFixed(1)}px)\`;
        }
        if (layerPcb) {
          layerPcb.style.opacity = layerOpacity;
          layerPcb.style.transform = \`translate3d(\${(36 * dx).toFixed(1)}px, \${(36 * dy).toFixed(1)}px, \${(56 * exp).toFixed(1)}px)\`;
        }

        if (hwCallout1) hwCallout1.style.transform = \`translate3d(\${(-16 * exp - 10 * dx).toFixed(1)}px, \${(-10 * exp - 8 * dy).toFixed(1)}px, \${(45 * exp).toFixed(1)}px)\`;
        if (hwCallout2) hwCallout2.style.transform = \`translate3d(\${(16 * exp + 10 * dx).toFixed(1)}px, \${(-8 * exp - 8 * dy).toFixed(1)}px, \${(55 * exp).toFixed(1)}px)\`;
        if (hwCallout3) hwCallout3.style.transform = \`translate3d(\${(-14 * exp - 12 * dx).toFixed(1)}px, \${(12 * exp + 10 * dy).toFixed(1)}px, \${(65 * exp).toFixed(1)}px)\`;
        if (hwCallout4) hwCallout4.style.transform = \`translate3d(\${(14 * exp + 12 * dx).toFixed(1)}px, \${(16 * exp + 10 * dy).toFixed(1)}px, \${(75 * exp).toFixed(1)}px)\`;

        requestAnimationFrame(renderHwParticles);
      }
      requestAnimationFrame(renderHwParticles);

      // Viewport Mouse & Touch Interaction with Direct Turntable Drag Rotation
      if (hwViewport) {
        let isHwDragging = false;
        let hwDragStartX = 0;
        let hwDragStartDeg = 0;

        const onHwPointerDown = (e) => {
          isHwDragging = true;
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          hwDragStartX = clientX;
          hwDragStartDeg = hwTurntableDeg;
          hwViewport.classList.add("tracking");
          hwViewport.style.cursor = "grabbing";
        };

        const handleHwPointer = (e) => {
          const rect = hwViewport.getBoundingClientRect();
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clientY = e.touches ? e.touches[0].clientY : e.clientY;
          hwTilt.targetX = (clientX - rect.left) / rect.width - 0.5;
          hwTilt.targetY = (clientY - rect.top) / rect.height - 0.5;
          hwPointer.targetX = clientX - rect.left;
          hwPointer.targetY = clientY - rect.top;

          if (isHwDragging) {
            const deltaX = clientX - hwDragStartX;
            hwTurntableDeg = (hwDragStartDeg + deltaX * 0.45) % 360;
          }
        };

        const onHwPointerUp = () => {
          isHwDragging = false;
          hwViewport.classList.remove("tracking");
          hwViewport.style.cursor = "grab";
        };

        hwViewport.addEventListener("mousedown", onHwPointerDown);
        hwViewport.addEventListener("touchstart", onHwPointerDown, { passive: true });
        hwViewport.addEventListener("mousemove", handleHwPointer);
        hwViewport.addEventListener("touchmove", handleHwPointer, { passive: true });
        window.addEventListener("mouseup", onHwPointerUp);
        window.addEventListener("touchend", onHwPointerUp);

        const resetHwPointer = () => {
          hwTilt.targetX = 0;
          hwTilt.targetY = 0;
        };
        hwViewport.addEventListener("mouseleave", resetHwPointer);
      }`;

if (content.includes(oldHwParticlesAndPointer)) {
  content = content.replace(oldHwParticlesAndPointer, newHwParticlesAndPointer);
  console.log("Fixed Issue 8B: Added 3D multi-layer differential parallax, zero-reflow particles, and direct turntable drag");
} else {
  throw new Error("Could not find oldHwParticlesAndPointer");
}

// -------------------------------------------------------------
// 9. Hardware App: Image switching crossfade & telemetry odometer updates
// -------------------------------------------------------------
const oldModelViewUpdates = `        if (mainImg) {
          const targetSrc = (currentHardwareRakurs === "profile") ? profileSrc : heroSrc;
          if (mainImg.getAttribute("src") !== targetSrc) {
            mainImg.src = targetSrc;
          }
        }

        if (teardownImg) {
          if (teardownImg.getAttribute("src") !== teardownSrc) {
            teardownImg.src = teardownSrc;
          }
        }

        // Apply Opacity & Modes
        if (currentHardwareRakurs === "teardown" || isXRayMode) {
          if (teardownImg) teardownImg.style.opacity = "1";
          if (mainImg) mainImg.style.opacity = "0.22";
          if (xrayAssembly) xrayAssembly.style.opacity = "1";
          if (hudAngle) hudAngle.textContent = "STUDIO // EXPLODED TEARDOWN";
        } else if (currentHardwareRakurs === "profile") {
          if (teardownImg) teardownImg.style.opacity = "0";
          if (mainImg) mainImg.style.opacity = "1";
          if (xrayAssembly) xrayAssembly.style.opacity = "0";
          if (hudAngle) hudAngle.textContent = "STUDIO // LATERAL PROFILE";
        } else {
          if (teardownImg) teardownImg.style.opacity = "0";
          if (mainImg) mainImg.style.opacity = "1";
          if (xrayAssembly) xrayAssembly.style.opacity = "0";
          if (hudAngle) hudAngle.textContent = "STUDIO // 3/4 HERO PERSPECTIVE";
        }

        // Rakurs buttons active state
        rakursBtns.forEach(btn => {
          const r = btn.getAttribute("data-rakurs");
          const isActive = (r === currentHardwareRakurs);
          btn.classList.toggle("active", isActive);
          btn.style.background = isActive ? "rgba(223,183,108,0.22)" : "rgba(0,0,0,0.6)";
          btn.style.borderColor = isActive ? "rgba(223,183,108,0.5)" : "rgba(255,255,255,0.12)";
          btn.style.color = isActive ? "#fff3d1" : "#888";
        });

        // Telemetry updates
        if (telSeries) telSeries.textContent = \`SERIES // \${activeCategory.toUpperCase()}-0\${activeModelIdx + 1}\`;
        if (telName) telName.textContent = model.name;
        if (telBrand) telBrand.textContent = model.brandTag;
        if (telPrice) rollHwOdometer(telPrice, model.price, "$");
        if (telWeight) telWeight.textContent = model.weight;
        if (telFreq) telFreq.textContent = model.freq;
        if (telDriver) telDriver.textContent = model.driver;
        if (telLatency) telLatency.textContent = model.latency;
        if (telConn) telConn.textContent = model.conn;
        if (telBattery) telBattery.textContent = model.battery;

        if (specChassis) specChassis.textContent = model.chassisSpec;
        if (specDriver) specDriver.textContent = model.driverSpec;
        if (specPcb) specPcb.textContent = model.pcbSpec;
        if (specBase) specBase.textContent = model.baseSpec;

        if (modalProdTitle) modalProdTitle.textContent = \`\${model.brand} \${model.name}\`;
        if (modalPriceVal) rollHwOdometer(modalPriceVal, model.price, "$");
        if (modalSerialCode) modalSerialCode.textContent = \`SN: CS-\${Math.floor(1000 + Math.random() * 9000)}-\${model.id.toUpperCase().slice(0, 8)}\`;`;

const newModelViewUpdates = `        if (mainImg) {
          const targetSrc = (currentHardwareRakurs === "profile") ? profileSrc : heroSrc;
          if (mainImg.getAttribute("src") !== targetSrc) {
            mainImg.style.opacity = "0.35";
            mainImg.src = targetSrc;
            mainImg.onload = () => {
              mainImg.style.opacity = (currentHardwareRakurs === "teardown" || isXRayMode) ? "0.22" : "1";
            };
            if (mainImg.complete) {
              mainImg.style.opacity = (currentHardwareRakurs === "teardown" || isXRayMode) ? "0.22" : "1";
            }
          }
        }

        if (teardownImg) {
          if (teardownImg.getAttribute("src") !== teardownSrc) {
            teardownImg.src = teardownSrc;
          }
        }

        // Apply Opacity & Modes
        if (currentHardwareRakurs === "teardown" || isXRayMode) {
          if (teardownImg) teardownImg.style.opacity = "1";
          if (mainImg) mainImg.style.opacity = "0.22";
          if (xrayAssembly) xrayAssembly.style.opacity = "1";
          if (hudAngle) rollHudAngle(hudAngle, "STUDIO // EXPLODED TEARDOWN");
        } else if (currentHardwareRakurs === "profile") {
          if (teardownImg) teardownImg.style.opacity = "0";
          if (mainImg) mainImg.style.opacity = "1";
          if (xrayAssembly) xrayAssembly.style.opacity = "0";
          if (hudAngle) rollHudAngle(hudAngle, "STUDIO // LATERAL PROFILE");
        } else {
          if (teardownImg) teardownImg.style.opacity = "0";
          if (mainImg) mainImg.style.opacity = "1";
          if (xrayAssembly) xrayAssembly.style.opacity = "0";
          if (hudAngle) rollHudAngle(hudAngle, "STUDIO // 3/4 HERO PERSPECTIVE");
        }

        // Rakurs buttons active state
        rakursBtns.forEach(btn => {
          const r = btn.getAttribute("data-rakurs");
          const isActive = (r === currentHardwareRakurs);
          btn.classList.toggle("active", isActive);
          btn.style.background = isActive ? "rgba(223,183,108,0.22)" : "rgba(0,0,0,0.6)";
          btn.style.borderColor = isActive ? "rgba(223,183,108,0.5)" : "rgba(255,255,255,0.12)";
          btn.style.color = isActive ? "#fff3d1" : "#888";
        });

        // Telemetry kinetic odometer & roll updates (Feature 3)
        if (telSeries) telSeries.textContent = \`SERIES // \${activeCategory.toUpperCase()}-0\${activeModelIdx + 1}\`;
        if (telName) telName.textContent = model.name;
        if (telBrand) telBrand.textContent = model.brandTag;
        if (telPrice) rollHwOdometer(telPrice, model.price, "$");
        if (telWeight) rollNumericSpec(telWeight, model.weight);
        if (telFreq) {
          telFreq.classList.add("odometer-rolling");
          telFreq.textContent = model.freq;
          setTimeout(() => telFreq.classList.remove("odometer-rolling"), 150);
        }
        if (telDriver) telDriver.textContent = model.driver;
        if (telLatency) rollNumericSpec(telLatency, model.latency);
        if (telConn) telConn.textContent = model.conn;
        if (telBattery) rollNumericSpec(telBattery, model.battery);

        if (specChassis) specChassis.textContent = model.chassisSpec;
        if (specDriver) specDriver.textContent = model.driverSpec;
        if (specPcb) specPcb.textContent = model.pcbSpec;
        if (specBase) specBase.textContent = model.baseSpec;

        if (modalProdTitle) modalProdTitle.textContent = \`\${model.brand} \${model.name}\`;
        if (modalPriceVal) rollHwOdometer(modalPriceVal, model.price, "$");
        if (modalSerialCode) modalSerialCode.textContent = \`SN: CS-\${Math.floor(1000 + Math.random() * 9000)}-\${model.id.toUpperCase().slice(0, 8)}\`;`;

if (content.includes(oldModelViewUpdates)) {
  content = content.replace(oldModelViewUpdates, newModelViewUpdates);
  console.log("Fixed Issue 9: Updated updateModelView with smooth crossfade and kinetic telemetry odometers");
} else {
  throw new Error("Could not find oldModelViewUpdates");
}

// Restore CRLF if needed
if (isCRLF) {
  content = content.replace(/\n/g, "\r\n");
}

// Save updated content to personal_brand_v4.html and copy to index.html
fs.writeFileSync(htmlPath, content, "utf8");
fs.writeFileSync(indexPath, content, "utf8");

console.log("Successfully wrote updated content to personal_brand_v4.html and index.html");
const crypto = require("crypto");
const hashV4 = crypto.createHash("sha256").update(fs.readFileSync(htmlPath)).digest("hex");
const hashIndex = crypto.createHash("sha256").update(fs.readFileSync(indexPath)).digest("hex");
console.log("SHA-256 parity check:", hashV4 === hashIndex ? "MATCH (SUCCESS)" : "MISMATCH (ERROR)");
console.log("Hash:", hashV4);
