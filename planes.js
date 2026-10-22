/**
 * Chromatic Flight Radar & Airshow Animation Engine
 * Simulates coordinated aerial flyover, smoke trails, and radar telemetry decoding.
 */

window.FlightEngine = (function () {
  let canvas = null;
  let ctx = null;
  let animFrameId = null;

  const ROWS = 24;
  const COLS = 54;
  let gridNumbers = [];
  let cellStates = []; // 'empty', 'red', 'blue', 'purple'

  let cellW = 24;
  let cellH = 24;
  let cellGap = 2;
  let offsetX = 20;
  let offsetY = 20;
  let showNumbers = true;
  let speedMultiplier = 0.6;
  let lastFrameTime = 0;

  let planes = [];
  let paintBombs = [];
  let splashEffects = [];
  let smokePuffs = [];
  let bannerPlane = null;
  let celebrationActive = false;
  let confettiParticles = [];

  const CONFETTI_COLORS = [
    '#ec4899', '#f43f5e', '#f472b6', '#fbcfe8',
    '#a855f7', '#c084fc', '#fbbf24', '#fde047',
    '#38bdf8', '#ffffff'
  ];

  function createConfettiPiece(x, y, vyMin, vyMax, vxSpread) {
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const isCircle = Math.random() < 0.22;
    const w = 7 + Math.random() * 8;
    const h = isCircle ? w : (10 + Math.random() * 10);
    return {
      x: x !== undefined ? x : Math.random() * (canvas ? canvas.width / (window.devicePixelRatio || 1) : 1200),
      y: y !== undefined ? y : -20,
      vx: (Math.random() - 0.5) * (vxSpread || 6),
      vy: vyMin !== undefined ? (vyMin + Math.random() * (vyMax - vyMin)) : (1.2 + Math.random() * 2.2),
      width: w,
      height: h,
      size: w,
      shape: isCircle ? 'circle' : 'ribbon',
      color: color,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.16,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.05 + Math.random() * 0.07,
      flutter: 1.5 + Math.random() * 2.2,
      gravity: 0.09 + Math.random() * 0.04,
      drag: 0.985
    };
  }

  function spawnConfettiBurst() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas ? canvas.width / dpr : 1200;
    const h = canvas ? canvas.height / dpr : 600;

    confettiParticles = [];

    // Left cannon burst (shoots up and toward center)
    for (let i = 0; i < 48; i++) {
      const p = createConfettiPiece(w * 0.12 + (Math.random() - 0.5) * 60, h * 0.88, -17, -10, 6);
      p.vx = 2.5 + Math.random() * 7;
      confettiParticles.push(p);
    }

    // Right cannon burst (shoots up and toward center)
    for (let i = 0; i < 48; i++) {
      const p = createConfettiPiece(w * 0.88 + (Math.random() - 0.5) * 60, h * 0.88, -17, -10, 6);
      p.vx = -(2.5 + Math.random() * 7);
      confettiParticles.push(p);
    }

    // Center celebratory fountain
    for (let i = 0; i < 64; i++) {
      const p = createConfettiPiece(w * 0.5 + (Math.random() - 0.5) * 120, h * 0.82, -18, -11, 11);
      confettiParticles.push(p);
    }
  }

  let pass2Timer = null;
  let finaleTimer = null;
  let crossingBurstDone = false;
  let onCompleteCallback = null;

  // Question mark mask for Pass 1 suspense on Line 2
  const qGlyph = [
    " ###### ",
    "##    ##",
    "      ##",
    "    ### ",
    "    ##  ",
    "    ##  ",
    "        ",
    "    ##  "
  ];
  const questionMarksMask = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const startRow = 13;
  const startCol = 12;
  for (let i = 0; i < 3; i++) {
    const colOffset = startCol + i * 11;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (qGlyph[r][c] === '#') {
          questionMarksMask[startRow + r][colOffset + c] = true;
        }
      }
    }
  }

  function init(canvasElement, numbersMatrix) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    gridNumbers = numbersMatrix;
    resetGrid();
    resize();
    window.addEventListener('resize', resize);
    if (!animFrameId) {
      render();
    }
  }

  function resetGrid() {
    cellStates = Array.from({ length: ROWS }, () => Array(COLS).fill('empty'));
    planes = [];
    paintBombs = [];
    splashEffects = [];
    smokePuffs = [];
    bannerPlane = null;
    celebrationActive = false;
    confettiParticles = [];
    crossingBurstDone = false;
    if (pass2Timer) {
      clearTimeout(pass2Timer);
      pass2Timer = null;
    }
    if (finaleTimer) {
      clearTimeout(finaleTimer);
      finaleTimer = null;
    }
    lastFrameTime = 0;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (window.SoundEngine) {
      window.SoundEngine.stopEngineSound();
    }
    // Blank out stage immediately
    render();
  }

  function resize() {
    if (!canvas) return;
    const container = canvas.parentElement;
    const containerRect = container ? container.getBoundingClientRect() : canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const targetWidth = Math.max(900, Math.floor(containerRect.width) || 1200);
    const targetHeight = Math.max(500, Math.floor(containerRect.height) || 620);

    canvas.width = targetWidth * dpr;
    canvas.height = targetHeight * dpr;
    canvas.style.width = targetWidth + 'px';
    canvas.style.height = targetHeight + 'px';
    ctx.scale(dpr, dpr);

    if (bannerPlane) {
      bannerPlane.endX = targetWidth + 450;
    }

    // Reserve 65px headroom for plane flyovers
    const availW = targetWidth - 40;
    const availH = targetHeight - 85;

    cellGap = 2;
    const rawCellW = Math.floor((availW - (COLS - 1) * cellGap) / COLS);
    const rawCellH = Math.floor((availH - (ROWS - 1) * cellGap) / ROWS);

    const cellSize = Math.min(rawCellW, rawCellH, 26);
    cellW = Math.max(12, cellSize);
    cellH = Math.max(12, cellSize);

    const totalGridW = COLS * cellW + (COLS - 1) * cellGap;
    const totalGridH = ROWS * cellH + (ROWS - 1) * cellGap;

    offsetX = Math.max(20, Math.floor((targetWidth - totalGridW) / 2));
    offsetY = Math.max(55, Math.floor((targetHeight - totalGridH) / 2) + 15);

    if (!animFrameId) {
      render();
    }
  }

  function getCellCenter(r, c) {
    return {
      x: offsetX + c * (cellW + cellGap) + cellW / 2,
      y: offsetY + r * (cellH + cellGap) + cellH / 2
    };
  }

  // Draw Biplane
  function drawBiplane(p, dt = 1) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.scale(p.scale || 1, p.scale || 1);

    // Drop Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 16;

    // Top Wing
    ctx.fillStyle = p.accentColor || '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-24, -28, 48, 8, 4);
    ctx.fill();

    // Bottom Wing
    ctx.beginPath();
    ctx.roundRect(-20, 18, 40, 7, 3);
    ctx.fill();

    // Fuselage
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Racing stripe
    ctx.fillStyle = p.accentColor || '#ffffff';
    ctx.fillRect(-8, -4, 16, 8);

    // Cockpit
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(-2, -5, 8, 5, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Tail Fin
    ctx.fillStyle = p.accentColor || '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-32, 0);
    ctx.lineTo(-44, -16);
    ctx.lineTo(-37, -16);
    ctx.lineTo(-25, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Propeller
    p.propAngle = (p.propAngle || 0) + 0.55 * dt;
    ctx.save();
    ctx.translate(34, 0);
    ctx.rotate(p.propAngle);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(-1.5, -18, 3, 36);
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // Draw Banner Plane
  function drawBannerPlane(bp) {
    if (!bp) return;
    drawBiplane(bp);

    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 2]);

    const planeTailX = bp.x - Math.cos(bp.angle) * 35;
    const planeTailY = bp.y - Math.sin(bp.angle) * 35;
    const bannerStartX = planeTailX - 60;
    const bannerStartY = planeTailY + 12 + Math.sin(bp.waveTime * 3) * 6;

    ctx.beginPath();
    ctx.moveTo(planeTailX, planeTailY);
    ctx.quadraticCurveTo(
      planeTailX - 30,
      planeTailY + Math.sin(bp.waveTime * 3) * 8,
      bannerStartX,
      bannerStartY
    );
    ctx.stroke();
    ctx.setLineDash([]);

    bp.waveTime += 0.05;
    const bWidth = 320;
    const bHeight = 48;

    ctx.save();
    ctx.translate(bannerStartX - bWidth, bannerStartY - bHeight / 2);

    const grad = ctx.createLinearGradient(0, 0, bWidth, 0);
    grad.addColorStop(0, '#f43f5e');
    grad.addColorStop(0.5, '#ec4899');
    grad.addColorStop(1, '#a855f7');

    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(236, 72, 153, 0.7)';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    ctx.roundRect(0, Math.sin(bp.waveTime * 2) * 5, bWidth, bHeight, 8);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Outfit", "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 6;
    ctx.fillText('🎀 IT’S A BABY GIRL! 💕', bWidth / 2, bHeight / 2 + Math.sin(bp.waveTime * 2) * 5);

    ctx.restore();
    ctx.restore();
  }

  // Render Loop
  function render(timestamp) {
    if (!canvas || !ctx) return;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    const now = typeof timestamp === 'number' ? timestamp : performance.now();
    if (!lastFrameTime) {
      lastFrameTime = now;
    }
    let dt = (now - lastFrameTime) / 16.6667;
    lastFrameTime = now;

    // Guard against background tab or initialization spikes
    if (dt < 0.1 || dt > 2.5) {
      dt = 1.0;
    }

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#06090f';
    ctx.fillRect(0, 0, width, height);

    // Pure dark canvas background (no faint background circles)

    // Set font style once per frame outside cell loop to prevent font re-parsing overhead
    if (showNumbers && cellW >= 14) {
      ctx.font = `${Math.max(9, Math.floor(cellH * 0.44))}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    }

    // Draw Grid Cells (Ultra-fast, zero-allocation solid fills & crisp borders)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = offsetX + c * (cellW + cellGap);
        const y = offsetY + r * (cellH + cellGap);
        const state = cellStates[r][c];
        const val = gridNumbers[r] ? gridNumbers[r][c] : '';

        if (state === 'purple') {
          // Radiant Neon Fuchsia / Pink Reveal (100% Solid & Glowing)
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.roundRect(x, y, cellW, cellH, 4);
          ctx.fill();

          ctx.strokeStyle = '#fbcfe8';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else if (state === 'red') {
          // Alpha Squadron Red (Translucent Reagent Mist / Decoy Chaff)
          ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.beginPath();
          ctx.roundRect(x, y, cellW, cellH, 3);
          ctx.fill();

          ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        } else if (state === 'blue') {
          // Bravo Squadron Blue (Translucent Reagent Mist / Decoy Chaff)
          ctx.fillStyle = 'rgba(2, 132, 199, 0.45)';
          ctx.beginPath();
          ctx.roundRect(x, y, cellW, cellH, 3);
          ctx.fill();

          ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        } else {
          // Neutral Dark Slate Tile
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.beginPath();
          ctx.roundRect(x, y, cellW, cellH, 3);
          ctx.fill();

          ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        if (showNumbers && cellW >= 14) {
          ctx.fillStyle = (state === 'purple')
            ? '#ffffff'
            : (state === 'red' || state === 'blue')
            ? 'rgba(226, 232, 240, 0.65)'
            : 'rgba(148, 163, 184, 0.35)';
          ctx.fillText(val, x + cellW / 2, y + cellH / 2 + 1, Math.max(10, cellW - 2));
        }
      }
    }

    // Smoke
    for (let i = smokePuffs.length - 1; i >= 0; i--) {
      const sp = smokePuffs[i];
      sp.x += sp.vx * speedMultiplier * dt;
      sp.y += sp.vy * speedMultiplier * dt;
      sp.radius += sp.growth * speedMultiplier * dt;
      sp.alpha -= sp.decay * speedMultiplier * dt;

      if (sp.alpha <= 0) {
        smokePuffs.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, sp.alpha);
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Paint Bombs
    for (let i = paintBombs.length - 1; i >= 0; i--) {
      const b = paintBombs[i];
      b.progress += 0.08 * speedMultiplier * dt;

      const curX = b.startX + (b.targetX - b.startX) * b.progress;
      const linearY = b.startY + (b.targetY - b.startY) * b.progress;
      const arcHeight = Math.sin(b.progress * Math.PI) * 40;
      const curY = linearY - arcHeight;

      if (b.progress >= 1.0) {
        paintBombs.splice(i, 1);
        onPaintBombHit(b);
        continue;
      }

      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(curX, curY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Splash Ripples
    for (let i = splashEffects.length - 1; i >= 0; i--) {
      const s = splashEffects[i];
      s.radius += 2.0 * speedMultiplier * dt;
      s.alpha -= 0.045 * speedMultiplier * dt;

      if (s.alpha <= 0) {
        splashEffects.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();

      if (s.isPurple) {
        ctx.fillStyle = '#ffffff';
        for (let k = 0; k < 4; k++) {
          const ang = k * (Math.PI / 2) + s.radius * 0.15;
          const sx = s.x + Math.cos(ang) * (s.radius + 6);
          const sy = s.y + Math.sin(ang) * (s.radius + 6);
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Planes
    for (let i = planes.length - 1; i >= 0; i--) {
      const p = planes[i];
      updatePlane(p, dt);
      drawBiplane(p, dt);

      if (p.completed) {
        planes.splice(i, 1);
      }
    }

    // Spectacular mid-air scissor crossing burst when both planes coincide
    if (planes.length >= 2 && !crossingBurstDone) {
      const p1 = planes.find(p => p.direction === 'left-to-right');
      const p2 = planes.find(p => p.direction === 'right-to-left');
      if (p1 && p2 && p1.x >= p2.x - 30) {
        crossingBurstDone = true;
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        for (let k = 0; k < 22; k++) {
          const angle = (k / 22) * Math.PI * 2;
          const spd = 2 + Math.random() * 3.5;
          smokePuffs.push({
            x: midX,
            y: midY,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            radius: 8 + Math.random() * 6,
            growth: 0.45,
            alpha: 0.9,
            decay: 0.025,
            color: k % 2 === 0 ? 'rgba(236, 72, 153, 0.8)' : 'rgba(56, 189, 248, 0.8)'
          });
        }
        if (window.SoundEngine) {
          window.SoundEngine.updateEnginePitch(96);
          window.SoundEngine.playPurpleSparkle();
        }
      }
    }

    // Banner Plane
    if (bannerPlane) {
      updateBannerPlane(bannerPlane, dt);
      drawBannerPlane(bannerPlane);
    }

    // Confetti Particles (Joyous celebration)
    if (celebrationActive) {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;

      // Continuously spawn gentle drifting confetti from the sky
      if (confettiParticles.length < 130 && Math.random() < 0.35) {
        confettiParticles.push(createConfettiPiece(Math.random() * w, -15, 1.0, 2.5, 3));
      }
    }

    if (confettiParticles.length > 0) {
      for (let i = confettiParticles.length - 1; i >= 0; i--) {
        const p = confettiParticles[i];
        p.vy += p.gravity * dt;
        p.vx *= Math.pow(p.drag, dt);
        p.x += (p.vx + Math.sin(p.wobble) * p.flutter) * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotationSpeed * dt;
        p.wobble += p.wobbleSpeed * dt;

        if (p.y > height + 40) {
          confettiParticles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const flipScale = Math.cos(p.wobble);
        ctx.scale(1, flipScale);

        ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // Idle when nothing is in motion to conserve CPU & memory
    const hasActiveMotion = (
      planes.length > 0 ||
      paintBombs.length > 0 ||
      splashEffects.length > 0 ||
      smokePuffs.length > 0 ||
      bannerPlane !== null ||
      celebrationActive ||
      confettiParticles.length > 0
    );

    if (hasActiveMotion) {
      animFrameId = requestAnimationFrame(render);
    } else {
      animFrameId = null;
      lastFrameTime = 0;
    }
  }

  function onPaintBombHit(bomb) {
    const r = bomb.row;
    const c = bomb.col;
    const current = cellStates[r][c];
    let newState = bomb.type;
    let isReaction = false;

    if (bomb.needsPurple) {
      if (bomb.type === 'red') {
        if (current === 'blue') {
          newState = 'purple';
          isReaction = true;
        } else {
          newState = 'red';
        }
      } else if (bomb.type === 'blue') {
        if (current === 'red') {
          newState = 'purple';
          isReaction = true;
        } else {
          newState = 'blue';
        }
      }
    } else {
      newState = bomb.type;
    }

    cellStates[r][c] = newState;

    if (window.SoundEngine) {
      if (isReaction) {
        window.SoundEngine.playPurpleSparkle();
      } else {
        window.SoundEngine.playSplatter(bomb.type);
      }
    }

    splashEffects.push({
      x: bomb.targetX,
      y: bomb.targetY,
      radius: isReaction ? 6 : 4,
      alpha: 1.0,
      color: isReaction ? '#ec4899' : (newState === 'red' ? '#ef4444' : '#0284c7'),
      isPurple: isReaction
    });
  }

  function updatePlane(p, dt = 1) {
    p.t += 0.0055 * speedMultiplier * dt;

    const prevX = p.x;
    const prevY = p.y;

    p.x = p.startX + (p.endX - p.startX) * p.t;
    p.y = p.startY + Math.sin(p.t * Math.PI * 3.5) * (p.waveAmplitude || 30);
    p.angle = Math.atan2(p.y - prevY, p.x - prevX);

    if (Math.random() < 0.7) {
      smokePuffs.push({
        x: p.x - Math.cos(p.angle) * 30,
        y: p.y - Math.sin(p.angle) * 30,
        vx: -Math.cos(p.angle) * 1.5 + (Math.random() - 0.5),
        vy: -Math.sin(p.angle) * 1.5 + (Math.random() - 0.5),
        radius: 6 + Math.random() * 4,
        growth: 0.35,
        alpha: 0.7,
        decay: 0.02,
        color: p.smokeColor
      });
    }

    // Column-by-column drop trigger
    if (p.targets && p.targets.length > 0) {
      for (let k = 0; k < p.targets.length; k++) {
        const item = p.targets[k];
        if (item.dropped) continue;

        const cellCenter = getCellCenter(item.r, item.c);
        const reached = p.direction === 'left-to-right'
          ? (p.x >= cellCenter.x - 20)
          : (p.x <= cellCenter.x + 20);

        if (reached) {
          item.dropped = true;
          paintBombs.push({
            startX: p.x,
            startY: p.y,
            targetX: cellCenter.x,
            targetY: cellCenter.y,
            row: item.r,
            col: item.c,
            progress: 0,
            type: p.paintType,
            color: p.paintColor,
            needsPurple: item.needsPurple
          });
        }
      }
    }

    if (p.t >= 1.0) {
      p.completed = true;
    }
  }

  function updateBannerPlane(bp, dt = 1) {
    bp.t += 0.003 * speedMultiplier * dt;
    bp.x = bp.startX + (bp.endX - bp.startX) * bp.t;
    bp.y = bp.startY + Math.sin(bp.t * Math.PI * 3.5) * 20;
    bp.angle = Math.sin(bp.t * Math.PI * 3.5) * 0.1;

    if (Math.random() < 0.4) {
      smokePuffs.push({
        x: bp.x - 32,
        y: bp.y + 4,
        vx: -1.2,
        vy: (Math.random() - 0.5) * 0.5,
        radius: 6,
        growth: 0.3,
        alpha: 0.6,
        decay: 0.02,
        color: 'rgba(244, 114, 182, 0.45)'
      });
    }

    // Keep the plane flying around the screen indefinitely!
    if (bp.t >= 1.25) {
      bp.t = 0;
      bp.pass = (bp.pass || 0) + 1;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas ? canvas.width / dpr : 1200;
      bp.startX = -420;
      bp.endX = w + 450;
      const altVariations = [0, 16, -12, 10, -18];
      const altOffset = altVariations[bp.pass % altVariations.length];
      const baseBannerY = Math.max(26, offsetY - 28);
      bp.startY = baseBannerY + altOffset;
      bp.endY = bp.startY;
      bp.x = bp.startX;
      bp.y = bp.startY;
    }
  }

  // Launch Full Sequence with Maximum Suspense (Supports live user grid for Guess & Check)
  function startFlightSequence(onComplete, userGrid, isCorrect) {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    lastFrameTime = 0;
    resetGrid();
    onCompleteCallback = onComplete;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;

    if (window.SoundEngine) {
      window.SoundEngine.startEngineSound(72);
    }

    if (userGrid === undefined) {
      isCorrect = true;
    }

    function getUserColor(r, c) {
      if (userGrid && userGrid[r] && userGrid[r][c]) {
        return (userGrid[r][c] || '').toLowerCase().trim();
      }
      return 'empty';
    }

    // -----------------------------------------------------------------------
    // Prepare Targets for Both Squadrons
    // -----------------------------------------------------------------------
    const redTargets = [];
    const blueTargets = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const col = isCorrect
          ? window.FlightMatrix.getExpectedColor(gridNumbers[r][c])
          : getUserColor(r, c);

        if (col === 'purple') {
          // Both planes must deliver reagent for the chemical reaction!
          redTargets.push({ r, c, needsPurple: true, dropped: false });
          blueTargets.push({ r, c, needsPurple: true, dropped: false });
        } else if (col === 'red') {
          redTargets.push({ r, c, needsPurple: false, dropped: false });
        } else if (col === 'blue') {
          blueTargets.push({ r, c, needsPurple: false, dropped: false });
        }
      }
    }

    redTargets.sort((a, b) => a.c - b.c);
    blueTargets.sort((a, b) => b.c - a.c);

    // -----------------------------------------------------------------------
    // SQUADRON ALPHA (Red Plane) - Flying Left to Right
    // -----------------------------------------------------------------------
    const planeY1 = Math.max(22, offsetY - 38);
    const planeY2 = Math.max(38, offsetY - 18);

    planes.push({
      startX: -35,
      startY: planeY1,
      endX: w + 80,
      endY: planeY1,
      x: -35,
      y: planeY1,
      waveAmplitude: 20,
      t: 0,
      angle: 0,
      color: '#ef4444',
      accentColor: '#fef08a',
      smokeColor: 'rgba(239, 68, 68, 0.45)',
      paintColor: '#ef4444',
      paintType: 'red',
      direction: 'left-to-right',
      targets: redTargets,
      scale: 1.15
    });

    // -----------------------------------------------------------------------
    // SQUADRON BRAVO (Blue Plane) - Flying Right to Left SIMULTANEOUSLY!
    // -----------------------------------------------------------------------
    planes.push({
      startX: w + 35,
      startY: planeY2,
      endX: -80,
      endY: planeY2,
      x: w + 35,
      y: planeY2,
      waveAmplitude: -20,
      t: 0,
      angle: Math.PI,
      color: '#0284c7',
      accentColor: '#ffffff',
      smokeColor: 'rgba(56, 189, 248, 0.45)',
      paintColor: '#0284c7',
      paintType: 'blue',
      direction: 'right-to-left',
      targets: blueTargets,
      scale: 1.15
    });

    // Start animation loop immediately
    if (!animFrameId) {
      render();
    }

    // -----------------------------------------------------------------------
    // FINALE (Triggered after both planes sweep past each other and clear stage)
    // -----------------------------------------------------------------------
    finaleTimer = setTimeout(() => {
      if (isCorrect) {
        instantSolve();

        const bannerY = Math.max(26, offsetY - 28);
        bannerPlane = {
          startX: -420,
          startY: bannerY,
          endX: w + 450,
          endY: bannerY,
          x: -420,
          y: bannerY,
          t: 0,
          angle: 0,
          color: '#ec4899',
          accentColor: '#ffffff',
          smokeColor: 'rgba(244, 114, 182, 0.45)',
          waveTime: 0,
          scale: 1.15,
          pass: 0
        };

        if (window.SoundEngine) {
          window.SoundEngine.stopEngineSound();
          window.SoundEngine.playCelebrationFanfare();
        }

        celebrationActive = true;
        spawnConfettiBurst();

        if (!animFrameId) {
          render();
        }
        if (onCompleteCallback) onCompleteCallback(true);
      } else {
        if (window.SoundEngine) {
          window.SoundEngine.stopEngineSound();
          window.SoundEngine.playKeyClick();
        }
        if (onCompleteCallback) onCompleteCallback(false);
      }
    }, 3300 / speedMultiplier);
  }

  function instantSolve() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        cellStates[r][c] = window.FlightMatrix.getExpectedColor(gridNumbers[r][c]);
      }
    }
    if (!animFrameId) {
      render();
    }
  }

  function toggleNumbers(state) {
    showNumbers = typeof state === 'boolean' ? state : !showNumbers;
    if (!animFrameId) {
      render();
    }
    return showNumbers;
  }

  function setSpeed(speed) {
    speedMultiplier = speed;
  }

  function start() {
    if (!animFrameId) {
      render();
    }
  }

  return {
    init,
    start,
    startFlightSequence,
    instantSolve,
    resetGrid,
    toggleNumbers,
    setSpeed,
    resize,
    render
  };
})();
