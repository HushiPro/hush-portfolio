/* ============================================
   HUSH PORTFOLIO - Main JavaScript
   ============================================ */

(function () {
    'use strict';

    // ========== Configuration ==========
    const CONFIG = {
        goldColor: '#C9A96E',
        goldRGB: { r: 201, g: 169, b: 110 },
        bgColor: '#0A0A0A',
        lineSpacing: 3,
        logoSrc: 'assets/logo.webp',
        scrollAnimationLength: 3, // multiplier of viewport height
    };

    // ========== Utility ==========
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

    // ========== Preloader ==========
    class Preloader {
        constructor() {
            this.el = document.getElementById('preloader');
            this.bar = this.el.querySelector('.preloader-progress');
            this.progress = 0;
            this.targetProgress = 0;
            this.done = false;
        }

        setProgress(val) {
            this.targetProgress = clamp(val, 0, 100);
        }

        update() {
            this.progress = lerp(this.progress, this.targetProgress, 0.08);
            this.bar.style.width = this.progress + '%';
            if (this.progress > 99.5 && !this.done) {
                this.finish();
            }
        }

        finish() {
            this.done = true;
            this.bar.style.width = '100%';
            setTimeout(() => {
                this.el.classList.add('is-done');
                document.body.style.overflow = '';
                // Trigger entrance animations after preloader fades
                setTimeout(() => {
                    window.dispatchEvent(new Event('preloader-done'));
                }, 600);
            }, 400);
        }
    }

    // ========== Custom Cursor ==========
    class Cursor {
        constructor() {
            this.dot = document.getElementById('cursorDot');
            this.ring = document.getElementById('cursorRing');
            if (!this.dot || !this.ring) return;
            this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            this.mouse = { x: this.pos.x, y: this.pos.y };
            this.visible = false;
            this.init();
        }

        init() {
            document.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
                if (!this.visible) {
                    this.visible = true;
                    this.dot.style.opacity = '1';
                    this.ring.style.opacity = '1';
                }
            });

            // Hover effects
            const hoverEls = document.querySelectorAll('a, button, .project-card, .tool-card, .contact-link');
            hoverEls.forEach((el) => {
                el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
                el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
            });

            document.addEventListener('mouseleave', () => {
                this.dot.style.opacity = '0';
                this.ring.style.opacity = '0';
                this.visible = false;
            });
        }

        update() {
            if (!this.dot) return;
            this.pos.x = lerp(this.pos.x, this.mouse.x, 0.15);
            this.pos.y = lerp(this.pos.y, this.mouse.y, 0.15);
            this.dot.style.left = this.mouse.x + 'px';
            this.dot.style.top = this.mouse.y + 'px';
            this.ring.style.left = this.pos.x + 'px';
            this.ring.style.top = this.pos.y + 'px';
        }
    }

    // ========== Engraving Canvas Animation ==========
    class EngravingAnimation {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.goldCanvas = null;
            this.ready = false;
            this.progress = 0;
            this.logoLoaded = false;

            this.resize();
            this.loadLogo();
            window.addEventListener('resize', () => {
                this.resize();
                if (this.logoLoaded) {
                    this.prepareGoldImage();
                } else {
                    this.prepareDefaultDesign();
                }
                this.draw(this.progress);
            });
        }

        resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width * dpr;
            this.canvas.height = this.height * dpr;
            this.canvas.style.width = this.width + 'px';
            this.canvas.style.height = this.height + 'px';
            this.ctx.scale(dpr, dpr);
        }

        loadLogo() {
            return new Promise((resolve) => {
                this.logo = new Image();
                this.logo.onload = () => {
                    this.logoLoaded = true;
                    this.prepareGoldImage();
                    this.ready = true;
                    resolve(true);
                };
                this.logo.onerror = () => {
                    this.logoLoaded = false;
                    this.prepareDefaultDesign();
                    this.ready = true;
                    resolve(false);
                };
                this.logo.src = CONFIG.logoSrc;
            });
        }

        prepareGoldImage() {
            const temp = document.createElement('canvas');
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            temp.width = this.width * dpr;
            temp.height = this.height * dpr;
            const tctx = temp.getContext('2d');
            tctx.scale(dpr, dpr);

            // Center & scale logo
            const maxDim = Math.min(this.width, this.height) * 0.45;
            const scale = Math.min(maxDim / this.logo.width, maxDim / this.logo.height);
            const w = this.logo.width * scale;
            const h = this.logo.height * scale;
            const x = (this.width - w) / 2;
            const y = (this.height - h) / 2;

            tctx.drawImage(this.logo, x, y, w, h);

            // Convert to gold tint
            const imageData = tctx.getImageData(0, 0, temp.width, temp.height);
            const data = imageData.data;
            const g = CONFIG.goldRGB;

            for (let i = 0; i < data.length; i += 4) {
                const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
                const alpha = data[i + 3] / 255;
                if (alpha > 0.01) {
                    data[i] = Math.round(g.r * brightness);
                    data[i + 1] = Math.round(g.g * brightness);
                    data[i + 2] = Math.round(g.b * brightness);
                }
            }
            tctx.putImageData(imageData, 0, 0);
            this.goldCanvas = temp;
        }

        prepareDefaultDesign() {
            const temp = document.createElement('canvas');
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            temp.width = this.width * dpr;
            temp.height = this.height * dpr;
            const ctx = temp.getContext('2d');
            ctx.scale(dpr, dpr);

            const cx = this.width / 2;
            const cy = this.height / 2;
            const radius = Math.min(this.width, this.height) * 0.22;
            const gold = CONFIG.goldColor;

            // Engraving lines background (inside circle)
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 0.88, 0, Math.PI * 2);
            ctx.clip();

            ctx.strokeStyle = 'rgba(201, 169, 110, 0.06)';
            ctx.lineWidth = 0.5;
            for (let y = cy - radius; y < cy + radius; y += 3) {
                ctx.beginPath();
                ctx.moveTo(cx - radius, y);
                ctx.lineTo(cx + radius, y);
                ctx.stroke();
            }
            // Cross-hatching
            for (let y = cy - radius; y < cy + radius; y += 5) {
                ctx.beginPath();
                ctx.moveTo(cx - radius, y);
                ctx.lineTo(cx + radius, y - radius * 0.3);
                ctx.stroke();
            }
            ctx.restore();

            // Outer circle - decorative border
            ctx.strokeStyle = gold;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Border hatching
            ctx.save();
            ctx.strokeStyle = 'rgba(201, 169, 110, 0.3)';
            ctx.lineWidth = 0.5;
            const outerR = radius;
            const innerR = radius * 0.93;
            for (let angle = 0; angle < Math.PI * 2; angle += 0.04) {
                const x1 = cx + Math.cos(angle) * innerR;
                const y1 = cy + Math.sin(angle) * innerR;
                const x2 = cx + Math.cos(angle + 0.015) * outerR;
                const y2 = cy + Math.sin(angle + 0.015) * outerR;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            ctx.restore();

            // Inner circle
            ctx.strokeStyle = gold;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 0.9, 0, Math.PI * 2);
            ctx.stroke();

            // Draw Unreal Engine "U" - Gothic/Blackletter style
            ctx.save();
            ctx.fillStyle = gold;
            const s = radius; // scale factor

            ctx.beginPath();

            // === OUTER contour (clockwise) ===
            // Left arm tip - sharp thorn pointing upper-left
            ctx.moveTo(cx - 0.40 * s, cy - 0.62 * s);

            // Left outer edge curving down
            ctx.bezierCurveTo(
                cx - 0.32 * s, cy - 0.48 * s,
                cx - 0.30 * s, cy - 0.30 * s,
                cx - 0.30 * s, cy + 0.08 * s
            );

            // Bottom outer curve (left half)
            ctx.bezierCurveTo(
                cx - 0.30 * s, cy + 0.40 * s,
                cx - 0.16 * s, cy + 0.56 * s,
                cx + 0.00 * s, cy + 0.56 * s
            );

            // Bottom outer curve (right half)
            ctx.bezierCurveTo(
                cx + 0.16 * s, cy + 0.56 * s,
                cx + 0.30 * s, cy + 0.40 * s,
                cx + 0.30 * s, cy + 0.08 * s
            );

            // Right outer edge going up
            ctx.bezierCurveTo(
                cx + 0.30 * s, cy - 0.28 * s,
                cx + 0.30 * s, cy - 0.44 * s,
                cx + 0.24 * s, cy - 0.54 * s
            );

            // Right main tip (pointing up)
            ctx.lineTo(cx + 0.27 * s, cy - 0.66 * s);

            // Fork: across to right barb tip
            ctx.lineTo(cx + 0.40 * s, cy - 0.50 * s);

            // Back from barb into right inner area
            ctx.lineTo(cx + 0.32 * s, cy - 0.42 * s);

            // === INNER contour (counter-clockwise) ===
            // Right inner edge going down
            ctx.bezierCurveTo(
                cx + 0.25 * s, cy - 0.30 * s,
                cx + 0.22 * s, cy - 0.15 * s,
                cx + 0.22 * s, cy + 0.08 * s
            );

            // Bottom inner curve (right half)
            ctx.bezierCurveTo(
                cx + 0.22 * s, cy + 0.32 * s,
                cx + 0.12 * s, cy + 0.45 * s,
                cx + 0.00 * s, cy + 0.45 * s
            );

            // Bottom inner curve (left half)
            ctx.bezierCurveTo(
                cx - 0.12 * s, cy + 0.45 * s,
                cx - 0.22 * s, cy + 0.32 * s,
                cx - 0.22 * s, cy + 0.08 * s
            );

            // Left inner edge going up
            ctx.bezierCurveTo(
                cx - 0.22 * s, cy - 0.15 * s,
                cx - 0.22 * s, cy - 0.32 * s,
                cx - 0.28 * s, cy - 0.46 * s
            );

            // Close path back to left tip
            ctx.closePath();
            ctx.fill();

            // Engraving hatching lines inside the U shape
            ctx.save();
            // Re-create the U shape as a clipping path
            ctx.beginPath();
            ctx.moveTo(cx - 0.40 * s, cy - 0.62 * s);
            ctx.bezierCurveTo(cx - 0.32 * s, cy - 0.48 * s, cx - 0.30 * s, cy - 0.30 * s, cx - 0.30 * s, cy + 0.08 * s);
            ctx.bezierCurveTo(cx - 0.30 * s, cy + 0.40 * s, cx - 0.16 * s, cy + 0.56 * s, cx, cy + 0.56 * s);
            ctx.bezierCurveTo(cx + 0.16 * s, cy + 0.56 * s, cx + 0.30 * s, cy + 0.40 * s, cx + 0.30 * s, cy + 0.08 * s);
            ctx.bezierCurveTo(cx + 0.30 * s, cy - 0.28 * s, cx + 0.30 * s, cy - 0.44 * s, cx + 0.24 * s, cy - 0.54 * s);
            ctx.lineTo(cx + 0.27 * s, cy - 0.66 * s);
            ctx.lineTo(cx + 0.40 * s, cy - 0.50 * s);
            ctx.lineTo(cx + 0.32 * s, cy - 0.42 * s);
            ctx.bezierCurveTo(cx + 0.25 * s, cy - 0.30 * s, cx + 0.22 * s, cy - 0.15 * s, cx + 0.22 * s, cy + 0.08 * s);
            ctx.bezierCurveTo(cx + 0.22 * s, cy + 0.32 * s, cx + 0.12 * s, cy + 0.45 * s, cx, cy + 0.45 * s);
            ctx.bezierCurveTo(cx - 0.12 * s, cy + 0.45 * s, cx - 0.22 * s, cy + 0.32 * s, cx - 0.22 * s, cy + 0.08 * s);
            ctx.bezierCurveTo(cx - 0.22 * s, cy - 0.15 * s, cx - 0.22 * s, cy - 0.32 * s, cx - 0.28 * s, cy - 0.46 * s);
            ctx.closePath();
            ctx.clip();

            // Diagonal engraving lines (lower-left to upper-right)
            ctx.strokeStyle = 'rgba(201, 169, 110, 0.18)';
            ctx.lineWidth = 0.6;
            for (let i = -2 * s; i < 2 * s; i += 3) {
                ctx.beginPath();
                ctx.moveTo(cx - s + i, cy + s);
                ctx.lineTo(cx + i, cy - s);
                ctx.stroke();
            }

            // Secondary cross-hatching (opposite direction, lighter)
            ctx.strokeStyle = 'rgba(201, 169, 110, 0.08)';
            ctx.lineWidth = 0.4;
            for (let i = -2 * s; i < 2 * s; i += 5) {
                ctx.beginPath();
                ctx.moveTo(cx + s + i, cy + s);
                ctx.lineTo(cx + i, cy - s);
                ctx.stroke();
            }
            ctx.restore();

            ctx.restore();

            // Small decorative dots at cardinal points
            const dotR = 3;
            ctx.fillStyle = gold;
            [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((angle) => {
                const dx = cx + Math.cos(angle) * radius * 0.915;
                const dy = cy + Math.sin(angle) * radius * 0.915;
                ctx.beginPath();
                ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
                ctx.fill();
            });

            this.goldCanvas = temp;
        }

        draw(progress) {
            this.progress = progress;
            if (!this.goldCanvas) return;

            const ctx = this.ctx;
            const w = this.width;
            const h = this.height;

            // Clear
            ctx.clearRect(0, 0, w, h);

            // Handle fade-out at end (stay dark, fade gold image out)
            if (progress > 0.76) {
                const fade = (progress - 0.76) / 0.24;
                ctx.fillStyle = CONFIG.bgColor;
                ctx.fillRect(0, 0, w, h);

                // Fade out the gold image
                ctx.globalAlpha = 1 - fade;
                ctx.drawImage(this.goldCanvas, 0, 0, w, h);
                ctx.globalAlpha = 1;

                // Golden aurora persists and fades during fade-out
                const auroraFade = 1 - fade;
                if (auroraFade > 0) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'screen';
                    ctx.globalAlpha = auroraFade;

                    const ab1 = ctx.createRadialGradient(w * 0.28, h * 0.25, 0, w * 0.28, h * 0.25, w * 0.45);
                    ab1.addColorStop(0, 'rgba(160, 110, 40, 0.35)');
                    ab1.addColorStop(0.25, 'rgba(120, 75, 20, 0.2)');
                    ab1.addColorStop(0.55, 'rgba(60, 35, 8, 0.1)');
                    ab1.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = ab1;
                    ctx.fillRect(0, 0, w, h);

                    const ab2 = ctx.createRadialGradient(w * 0.75, h * 0.72, 0, w * 0.75, h * 0.72, w * 0.5);
                    ab2.addColorStop(0, 'rgba(140, 90, 25, 0.3)');
                    ab2.addColorStop(0.3, 'rgba(100, 60, 15, 0.18)');
                    ab2.addColorStop(0.6, 'rgba(45, 25, 5, 0.08)');
                    ab2.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = ab2;
                    ctx.fillRect(0, 0, w, h);

                    ctx.globalAlpha = 1;
                    ctx.restore();

                    // Vignette
                    const vigA = 0.9 * auroraFade;
                    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.22, w / 2, h / 2, Math.max(w, h) * 0.72);
                    vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
                    vg.addColorStop(0.45, `rgba(0, 0, 0, ${vigA * 0.15})`);
                    vg.addColorStop(0.7, `rgba(0, 0, 0, ${vigA * 0.55})`);
                    vg.addColorStop(1, `rgba(0, 0, 0, ${vigA})`);
                    ctx.fillStyle = vg;
                    ctx.fillRect(0, 0, w, h);
                }
                return;
            }

            // Black background
            ctx.fillStyle = CONFIG.bgColor;
            ctx.fillRect(0, 0, w, h);

            if (progress <= 0) return;

            // Remap progress for engraving reveal (0 to 0.76 -> 0 to 1)
            const revealProgress = clamp(progress / 0.76, 0, 1);

            // Engraving scan-line reveal from center outward
            const lineSpacing = CONFIG.lineSpacing;
            const totalLines = Math.ceil(h / lineSpacing);
            const centerY = h / 2;
            const maxDist = h / 2;
            const revealDist = revealProgress * maxDist * 1.3; // * 1.3 to fully reveal before end

            ctx.save();
            ctx.beginPath();

            for (let i = 0; i < totalLines; i++) {
                const y = i * lineSpacing;
                const distFromCenter = Math.abs(y - centerY);

                if (distFromCenter < revealDist) {
                    const age = (revealDist - distFromCenter) / maxDist;
                    const thickness = Math.min(lineSpacing, lineSpacing * age * 2.5);
                    ctx.rect(0, y - thickness / 2, w, thickness);
                }
            }

            ctx.clip();

            // Draw gold image with glow (subtle)
            if (revealProgress > 0.35) {
                const glowIntensity = clamp((revealProgress - 0.35) / 0.5, 0, 1);
                ctx.shadowBlur = 7 * glowIntensity;
                ctx.shadowColor = `rgba(201, 169, 110, ${0.13 * glowIntensity})`;
            }

            ctx.drawImage(this.goldCanvas, 0, 0, w, h);
            ctx.shadowBlur = 0;
            ctx.restore();

            // Additional glow layer for bloom effect (subtle)
            if (revealProgress > 0.6) {
                const bloomAlpha = (revealProgress - 0.6) * 0.067;
                ctx.save();
                ctx.globalAlpha = bloomAlpha;
                ctx.filter = `blur(${5 * revealProgress}px)`;
                ctx.drawImage(this.goldCanvas, 0, 0, w, h);
                ctx.filter = 'none';
                ctx.globalAlpha = 1;
                ctx.restore();
            }

            // ---- Dark Veil / Golden Aurora Effect ----
            const veilIntensity = clamp(revealProgress, 0, 1);

            // Use 'screen' blend for additive golden light blobs
            ctx.save();
            ctx.globalCompositeOperation = 'screen';

            // Aurora blob 1: upper-left, warm amber
            const drift1X = w * 0.28 + Math.sin(revealProgress * 2.5) * w * 0.06;
            const drift1Y = h * 0.25 + Math.cos(revealProgress * 1.8) * h * 0.05;
            const ab1 = ctx.createRadialGradient(drift1X, drift1Y, 0, drift1X, drift1Y, w * 0.45);
            ab1.addColorStop(0, `rgba(160, 110, 40, ${0.35 * veilIntensity})`);
            ab1.addColorStop(0.25, `rgba(120, 75, 20, ${0.2 * veilIntensity})`);
            ab1.addColorStop(0.55, `rgba(60, 35, 8, ${0.1 * veilIntensity})`);
            ab1.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = ab1;
            ctx.fillRect(0, 0, w, h);

            // Aurora blob 2: lower-right, deep gold
            const drift2X = w * 0.75 + Math.cos(revealProgress * 2.0) * w * 0.05;
            const drift2Y = h * 0.72 + Math.sin(revealProgress * 2.2) * h * 0.06;
            const ab2 = ctx.createRadialGradient(drift2X, drift2Y, 0, drift2X, drift2Y, w * 0.5);
            ab2.addColorStop(0, `rgba(140, 90, 25, ${0.3 * veilIntensity})`);
            ab2.addColorStop(0.3, `rgba(100, 60, 15, ${0.18 * veilIntensity})`);
            ab2.addColorStop(0.6, `rgba(45, 25, 5, ${0.08 * veilIntensity})`);
            ab2.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = ab2;
            ctx.fillRect(0, 0, w, h);

            // Aurora blob 3: upper-right, bronze/copper accent
            const drift3X = w * 0.8 + Math.sin(revealProgress * 1.6) * w * 0.04;
            const drift3Y = h * 0.18 + Math.cos(revealProgress * 2.8) * h * 0.04;
            const ab3 = ctx.createRadialGradient(drift3X, drift3Y, 0, drift3X, drift3Y, w * 0.35);
            ab3.addColorStop(0, `rgba(180, 100, 30, ${0.22 * veilIntensity})`);
            ab3.addColorStop(0.3, `rgba(100, 55, 15, ${0.12 * veilIntensity})`);
            ab3.addColorStop(0.6, `rgba(40, 20, 5, ${0.05 * veilIntensity})`);
            ab3.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = ab3;
            ctx.fillRect(0, 0, w, h);

            // Aurora blob 4: bottom-left, dark amber
            const drift4X = w * 0.15 + Math.cos(revealProgress * 3.0) * w * 0.05;
            const drift4Y = h * 0.8 + Math.sin(revealProgress * 1.5) * h * 0.04;
            const ab4 = ctx.createRadialGradient(drift4X, drift4Y, 0, drift4X, drift4Y, w * 0.38);
            ab4.addColorStop(0, `rgba(130, 80, 20, ${0.2 * veilIntensity})`);
            ab4.addColorStop(0.35, `rgba(80, 45, 10, ${0.1 * veilIntensity})`);
            ab4.addColorStop(0.65, `rgba(30, 15, 3, ${0.04 * veilIntensity})`);
            ab4.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = ab4;
            ctx.fillRect(0, 0, w, h);

            // Aurora blob 5: center-top highlight, brighter gold
            const drift5X = w * 0.5 + Math.sin(revealProgress * 2.0) * w * 0.08;
            const drift5Y = h * 0.12 + revealProgress * h * 0.05;
            const ab5 = ctx.createRadialGradient(drift5X, drift5Y, 0, drift5X, drift5Y, w * 0.4);
            ab5.addColorStop(0, `rgba(200, 150, 50, ${0.18 * veilIntensity})`);
            ab5.addColorStop(0.2, `rgba(140, 95, 30, ${0.12 * veilIntensity})`);
            ab5.addColorStop(0.5, `rgba(60, 35, 10, ${0.05 * veilIntensity})`);
            ab5.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = ab5;
            ctx.fillRect(0, 0, w, h);

            ctx.restore();

            // Strong vignette to frame the glow and deepen edges
            const vigAlpha = 0.55 + veilIntensity * 0.35;
            const vigGrad = ctx.createRadialGradient(
                w / 2, h / 2, Math.min(w, h) * 0.22,
                w / 2, h / 2, Math.max(w, h) * 0.72
            );
            vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            vigGrad.addColorStop(0.45, `rgba(0, 0, 0, ${vigAlpha * 0.15})`);
            vigGrad.addColorStop(0.7, `rgba(0, 0, 0, ${vigAlpha * 0.55})`);
            vigGrad.addColorStop(1, `rgba(0, 0, 0, ${vigAlpha})`);
            ctx.fillStyle = vigGrad;
            ctx.fillRect(0, 0, w, h);
        }
    }

    // ========== Navigation ==========
    class Navigation {
        constructor() {
            this.header = document.getElementById('header');
            this.lastScroll = 0;
            this.isInHero = true;

            // Smooth scroll to anchors
            document.querySelectorAll('a[href^="#"]').forEach((link) => {
                link.addEventListener('click', (e) => {
                    const target = document.querySelector(link.getAttribute('href'));
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        }

        update(scrollY) {
            const heroEnd = window.innerHeight * CONFIG.scrollAnimationLength;

            // Show/hide nav
            if (scrollY > heroEnd * 0.5) {
                this.header.classList.add('is-visible');
            } else {
                this.header.classList.remove('is-visible');
            }

            // Scrolled style
            if (scrollY > heroEnd + 100) {
                this.header.classList.add('is-scrolled');
            } else {
                this.header.classList.remove('is-scrolled');
            }

            // All sections are dark, keep nav dark style
            this.header.classList.remove('is-light');

            this.lastScroll = scrollY;
        }
    }

    // ========== Parallax ==========
    class Parallax {
        constructor() {
            this.elements = document.querySelectorAll('[data-speed]');
        }

        update(scrollY) {
            this.elements.forEach((el) => {
                const speed = parseFloat(el.dataset.speed) || 0;
                const rect = el.parentElement.getBoundingClientRect();
                const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
                el.style.transform = `translateY(${centerOffset * speed}px)`;
            });
        }
    }

    // ========== Main App ==========
    class App {
        constructor() {
            this.preloader = new Preloader();
            this.cursor = new Cursor();
            this.nav = new Navigation();
            this.parallax = new Parallax();
            this.engraving = null;
            this.scrollY = 0;
            this.rafId = null;

            document.body.style.overflow = 'hidden';
            this.init();
        }

        async init() {
            // Setup canvas
            const canvas = document.getElementById('engraving-canvas');
            this.engraving = new EngravingAnimation(canvas);

            // Simulate loading
            this.preloader.setProgress(30);
            await this.engraving.loadLogo();
            this.preloader.setProgress(70);

            // Wait a tiny bit for fonts
            await new Promise((r) => setTimeout(r, 300));
            this.preloader.setProgress(100);

            // Listen for preloader done
            window.addEventListener('preloader-done', () => {
                this.setupScrollTrigger();
                this.setupSectionAnimations();
                this.engraving.draw(0);
            });

            // Start render loop
            this.render();
        }

        setupScrollTrigger() {
            gsap.registerPlugin(ScrollTrigger);

            // ---- Hero Engraving Animation (scroll-controlled) ----
            ScrollTrigger.create({
                trigger: '#hero',
                start: 'top top',
                end: `+=${window.innerHeight * (CONFIG.scrollAnimationLength - 1)}`,
                pin: true,
                scrub: 0.8,
                onUpdate: (self) => {
                    this.engraving.draw(self.progress);
                },
            });

            // ---- Title Section ----
            const titleTL = gsap.timeline({
                scrollTrigger: {
                    trigger: '#title-section',
                    start: 'top 80%',
                    end: 'top 20%',
                    scrub: false,
                    toggleActions: 'play none none reverse',
                },
            });

            titleTL
                .to('.title-eyebrow', {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'expo.out',
                })
                .to(
                    '.title-word',
                    {
                        opacity: 1,
                        y: 0,
                        rotation: 0,
                        duration: 1.2,
                        stagger: 0.15,
                        ease: 'expo.out',
                    },
                    '-=0.4'
                )
                .to(
                    '.title-line',
                    {
                        scaleX: 1,
                        duration: 0.8,
                        ease: 'expo.out',
                    },
                    '-=0.6'
                )
                .to(
                    '.title-tagline',
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        ease: 'expo.out',
                    },
                    '-=0.4'
                );

            // ---- Parallax on Title Section ----
            gsap.to('.deco-circle', {
                y: -100,
                scrollTrigger: {
                    trigger: '#title-section',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            });

            gsap.to('.deco-dot', {
                y: 80,
                x: 30,
                scrollTrigger: {
                    trigger: '#title-section',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            });

            gsap.to('.deco-line-h', {
                x: 60,
                scrollTrigger: {
                    trigger: '#title-section',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            });

            gsap.to('.deco-cross', {
                y: -60,
                rotation: 45,
                scrollTrigger: {
                    trigger: '#title-section',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            });

            // ---- Tools Marquee speed on scroll ----
            gsap.to('.tools-track', {
                x: '-=200',
                ease: 'none',
                scrollTrigger: {
                    trigger: '#tools',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1,
                },
            });

            // ---- About section parallax ----
            gsap.to('.about-image-wrapper', {
                y: -40,
                scrollTrigger: {
                    trigger: '#about',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            });

            gsap.to('.about-float-tag', {
                y: 50,
                scrollTrigger: {
                    trigger: '#about',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            });
        }

        setupSectionAnimations() {
            // Animate elements when they enter viewport
            const animElements = document.querySelectorAll('[data-animate]');

            animElements.forEach((el, i) => {
                ScrollTrigger.create({
                    trigger: el,
                    start: 'top 85%',
                    once: true,
                    onEnter: () => {
                        // Stagger within parent
                        const siblings = el.parentElement.querySelectorAll('[data-animate]');
                        let index = 0;
                        siblings.forEach((s, idx) => {
                            if (s === el) index = idx;
                        });

                        gsap.to(el, {
                            opacity: 1,
                            y: 0,
                            duration: 0.9,
                            delay: index * 0.1,
                            ease: 'expo.out',
                        });
                    },
                });
            });

            // Stat number counting animation
            const statNumbers = document.querySelectorAll('.stat-number');
            statNumbers.forEach((el) => {
                ScrollTrigger.create({
                    trigger: el,
                    start: 'top 85%',
                    once: true,
                    onEnter: () => {
                        gsap.from(el, {
                            textContent: 0,
                            duration: 1.5,
                            ease: 'power2.out',
                            snap: { textContent: 1 },
                        });
                    },
                });
            });

            // Project cards tilt on hover + dynamic background
            const bgLayers = document.querySelectorAll('.projects-bg__layer');
            document.querySelectorAll('.project-card').forEach((card, idx) => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width - 0.5;
                    const y = (e.clientY - rect.top) / rect.height - 0.5;
                    gsap.to(card, {
                        rotateY: x * 6,
                        rotateX: -y * 6,
                        duration: 0.4,
                        ease: 'power2.out',
                        transformPerspective: 800,
                    });
                });

                card.addEventListener('mouseenter', () => {
                    bgLayers.forEach((layer, i) => {
                        layer.classList.toggle('is-active', i === idx);
                    });
                });

                card.addEventListener('mouseleave', () => {
                    gsap.to(card, {
                        rotateY: 0,
                        rotateX: 0,
                        duration: 0.6,
                        ease: 'expo.out',
                    });
                    bgLayers.forEach((layer) => layer.classList.remove('is-active'));
                });
            });

            // Contact link magnetic effect
            document.querySelectorAll('.contact-link').forEach((link) => {
                link.addEventListener('mousemove', (e) => {
                    const rect = link.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    gsap.to(link, {
                        x: x * 0.08,
                        y: y * 0.08,
                        duration: 0.3,
                        ease: 'power2.out',
                    });
                });

                link.addEventListener('mouseleave', () => {
                    gsap.to(link, {
                        x: 0,
                        y: 0,
                        duration: 0.5,
                        ease: 'expo.out',
                    });
                });
            });

            // Tool modal
            this.initToolModal();

            // Gallery lightbox
            this.initLightbox();
        }

        initToolModal() {
            const page = document.getElementById('tool-page');
            if (!page) return;

            const pageIcon = document.getElementById('page-icon');
            const pageTitle = document.getElementById('page-title');
            const pageSubtitle = document.getElementById('page-subtitle');
            const pageContent = document.getElementById('page-content');
            const pageScroll = page.querySelector('.tool-page__scroll');

            // ── Parse Markdown front-matter (YAML-like) + body ──
            function parseFrontMatter(raw) {
                const meta = {};
                let body = raw;
                const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
                if (match) {
                    const yamlBlock = match[1];
                    body = match[2];
                    for (const line of yamlBlock.split(/\r?\n/)) {
                        const kv = line.match(/^(\w+):\s*(.*)$/);
                        if (kv) {
                            meta[kv[1]] = kv[2].trim();
                        }
                    }
                }
                return { meta, body };
            }

            // ── 缓存已加载的工具数据 ──
            const toolDataCache = {};
            const toolKeys = ['ue', 'maya', 'mb'];

            async function loadToolData(toolKey) {
                if (toolDataCache[toolKey]) return toolDataCache[toolKey];
                try {
                    const resp = await fetch(`content/tools/${toolKey}.md?t=${Date.now()}`);
                    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                    const raw = await resp.text();
                    const { meta, body } = parseFrontMatter(raw);
                    console.log(`[Tool] Loaded ${toolKey}.md:`, meta);

                    // Convert markdown body to HTML
                    const htmlBody = marked.parse(body);
                    const data = {
                        icon: meta.icon || toolKey.toUpperCase(),
                        title: meta.title || toolKey,
                        subtitle: meta.subtitle || '',
                        html: htmlBody,
                    };
                    toolDataCache[toolKey] = data;
                    return data;
                } catch (err) {
                    console.warn(`Failed to load tool data for "${toolKey}":`, err);
                    return null;
                }
            }

            /**
             * Split rendered HTML by <hr> into sections.
             * Each section: if it contains <img>, collect ALL images into left column,
             * remaining text into right column.
             * Otherwise, create full-width text section.
             */
            function buildSections(html) {
                // Split by <hr> tag
                const chunks = html.split(/<hr\s*\/?>/i).map(s => s.trim()).filter(Boolean);
                let out = '';

                chunks.forEach((chunk) => {
                    // Create a temporary container to parse the HTML
                    const temp = document.createElement('div');
                    temp.innerHTML = chunk;

                    // Collect ALL images (inside <p> or standalone)
                    const allImgs = [];
                    // Find <p> tags that contain ONLY an <img>
                    temp.querySelectorAll('p > img').forEach((img) => {
                        const p = img.parentElement;
                        // Only treat as image block if the <p> contains just the image
                        if (p && p.childNodes.length === 1) {
                            allImgs.push({
                                src: img.getAttribute('src'),
                                alt: img.getAttribute('alt') || '',
                                removeEl: p,
                            });
                        } else {
                            allImgs.push({
                                src: img.getAttribute('src'),
                                alt: img.getAttribute('alt') || '',
                                removeEl: img,
                            });
                        }
                    });

                    // Also check for standalone <img> not inside <p>
                    temp.querySelectorAll('img').forEach((img) => {
                        if (!img.closest('p')) {
                            allImgs.push({
                                src: img.getAttribute('src'),
                                alt: img.getAttribute('alt') || '',
                                removeEl: img,
                            });
                        }
                    });

                    if (allImgs.length > 0) {
                        // Remove all image elements from the text content
                        allImgs.forEach((item) => {
                            if (item.removeEl && item.removeEl.parentElement) {
                                item.removeEl.remove();
                            }
                        });

                        // Build left column: stack all images vertically
                        const imgsHtml = allImgs.map((item) =>
                            `<img src="${item.src}" alt="${item.alt}" class="project-card__gallery-img">`
                        ).join('\n');

                        const textHtml = temp.innerHTML.trim();

                        out += `
                            <div class="tool-page__section">
                                <div class="tool-page__section-img">
                                    ${imgsHtml}
                                </div>
                                <div class="tool-page__section-text">
                                    ${textHtml}
                                </div>
                            </div>
                        `;
                    } else {
                        // No image — full-width text section
                        out += `
                            <div class="tool-page__section tool-page__section--full">
                                <div class="tool-page__section-text">
                                    ${chunk}
                                </div>
                            </div>
                        `;
                    }
                });

                out += '<div class="tool-page__footer"></div>';
                return out;
            }

            // ── Pre-load all tool data & generate hover previews on tool cards ──
            async function initToolPreviews() {
                for (const key of toolKeys) {
                    const data = await loadToolData(key);
                    if (!data) continue;
                    const card = document.querySelector(`.tool-card[data-tool="${key}"]`);
                    if (!card) continue;

                    // Extract first image from rendered HTML for preview
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = data.html;
                    const firstImg = tempDiv.querySelector('img');

                    if (firstImg) {
                        const imgSrc = firstImg.getAttribute('src') || firstImg.src;
                        const preview = document.createElement('div');
                        preview.className = 'tool-card__preview';
                        preview.innerHTML = `
                            <img src="${imgSrc}" alt="${data.title}" class="tool-card__preview-img">
                            <div class="tool-card__preview-footer">
                                <span class="tool-card__preview-label">点击查看详情</span>
                                <span class="tool-card__preview-action">查看 →</span>
                            </div>
                        `;
                        card.appendChild(preview);
                    }
                }
            }
            initToolPreviews();

            // ── Open tool page ──
            const openPage = async (toolKey) => {
                const data = await loadToolData(toolKey);
                if (!data) return;

                // Populate hero
                pageIcon.textContent = data.icon;
                pageTitle.textContent = data.title;
                pageSubtitle.textContent = data.subtitle;

                // Build sections from HTML
                pageContent.innerHTML = buildSections(data.html);

                // Scroll to top
                pageScroll.scrollTop = 0;

                // Show page
                page.classList.add('is-open');
                document.body.style.overflow = 'hidden';
            };

            const closePage = () => {
                page.classList.remove('is-open');
                document.body.style.overflow = '';
            };

            // Click on tool cards
            document.addEventListener('click', (e) => {
                const card = e.target.closest('.tool-card[data-tool]');
                if (card) {
                    openPage(card.dataset.tool);
                    return;
                }
                // Close button
                if (page.classList.contains('is-open')) {
                    if (e.target.closest('.tool-page__close')) {
                        closePage();
                    }
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && page.classList.contains('is-open')) {
                    closePage();
                }
            });
        }

        initLightbox() {
            const lightbox = document.getElementById('lightbox');
            const lightboxImg = document.getElementById('lightbox-img');
            if (!lightbox || !lightboxImg) return;

            const closeLightbox = () => {
                lightbox.classList.remove('is-open');
                document.body.style.overflow = '';
            };

            // Event delegation – works for any gallery image
            document.addEventListener('click', (e) => {
                const galleryImg = e.target.closest('.project-card__gallery-img');
                if (galleryImg) {
                    e.stopPropagation();
                    lightboxImg.src = galleryImg.src;
                    lightboxImg.alt = galleryImg.alt;
                    lightbox.classList.add('is-open');
                    document.body.style.overflow = 'hidden';
                    return;
                }

                // Close when clicking lightbox background (not the image itself)
                if (lightbox.classList.contains('is-open')) {
                    if (e.target === lightboxImg) return; // don't close on image click
                    if (e.target.closest('.lightbox')) {
                        closeLightbox();
                    }
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeLightbox();
            });
        }

        render() {
            this.preloader.update();
            this.cursor.update();

            const scrollY = window.scrollY || window.pageYOffset;
            this.nav.update(scrollY);

            this.rafId = requestAnimationFrame(() => this.render());
        }
    }

    // ========== Initialize ==========
    window.addEventListener('DOMContentLoaded', () => {
        new App();
    });
})();
