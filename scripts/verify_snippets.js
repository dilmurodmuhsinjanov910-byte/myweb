const fs = require('fs');
const s = fs.readFileSync('personal_brand_v4.html', 'utf8').replace(/\r\n/g, '\n');

const tests = [
  { name: 'foregroundCanvas', snippet: `        if (foregroundCanvas) {
          const rect = foregroundCanvas.getBoundingClientRect();
          foregroundCanvas.width = Math.max(rect.width * dpr, 400);
          foregroundCanvas.height = Math.max(rect.height * dpr, 300);
        }` },
  { name: 'animLoop', snippet: `        renderForeground(w, h, d, fgOffX, fgOffY);
        renderNeonCosmicPortal();
        updateHangingThreadsPhysics(cosmicTick);
        renderHangingThreads();` },
  { name: 'playCartChime', snippet: `      function playCartChime() {
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
      }` },
  { name: 'snkTilt', snippet: `      // Smooth 3D Mouse Parallax Tilt
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
      }` },
  { name: 'snkView', snippet: `        if (isAerialView || activeAngle === "top") {
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
        }` },
  { name: 'snkPrice', snippet: `if (priceValEl) priceValEl.textContent = \`\${sneaker.currency}\${sneaker.price.toLocaleString()}\`;` },
  { name: 'snkInitEnd', snippet: `      // Render initial view
      renderModelTabs();
      renderColorSwatches();
      updateSneakerView();
    })();` },
  { name: 'playReservationChime', snippet: `      function playReservationChime() {
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
      }` },
  { name: 'hwTilt', snippet: `      // Smooth 3D Cursor Parallax Tilt
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
      }` },
  { name: 'frCurve', snippet: `      // Draw Frequency Response Curve
      function drawFrequencyResponseCurve(curve) {
        if (!frCanvas || !curve) return;
        const ctx = frCanvas.getContext("2d");
        const w = frCanvas.width;
        const h = frCanvas.height;
        ctx.clearRect(0, 0, w, h);` },
  { name: 'frStroke', snippet: `        curve.forEach((val, i) => {
          const x = i * step;
          const y = h / 2 - (val / 6) * (h / 2);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }` },
  { name: 'hwTelPrice', snippet: `        if (telPrice) telPrice.textContent = \`$\${model.price.toLocaleString()}\`;
        if (telWeight) telWeight.textContent = model.weight;` },
  { name: 'hwModalPrice', snippet: `        if (modalProdTitle) modalProdTitle.textContent = \`\${model.brand} \${model.name}\`;
        if (modalPriceVal) modalPriceVal.textContent = \`$\${model.price.toLocaleString()}\`;` },
  { name: 'hwSlider', snippet: `      // X-Ray Separation Slider Bar
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
      }` },
  { name: 'hwRakursClick', snippet: `          if (r === "teardown") {
            isXRayMode = true;
            if (xraySlider) xraySlider.value = 100;
            if (xraySliderVal) xraySliderVal.textContent = "100%";
          } else {
            isXRayMode = false;
            if (xraySlider) xraySlider.value = 0;
            if (xraySliderVal) xraySliderVal.textContent = "0%";
          }` },
  { name: 'hwInitFinish', snippet: `      // Initialize
      populateRoster();
      updateModelView();
      renderVisualizerLoop();
    })();` }
];

let allOk = true;
tests.forEach(t => {
  const found = s.includes(t.snippet);
  console.log(t.name, ':', found ? 'FOUND' : 'MISSING');
  if (!found) allOk = false;
});
console.log('All found?', allOk);
