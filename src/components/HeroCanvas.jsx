import React, { useEffect, useRef } from "react";

/* Lightweight canvas motion — no external script, so the page never breaks if a CDN is unavailable.
   Hero: flowing woven-thread waves + soft glowing spheres. Story: rotating ring of small woven cubes. */
export default function HeroCanvas() {
    const ref = useRef(null);
    useEffect(() => {
        const canvas = ref.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        let raf = 0;
        let w = 0;
        let h = 0;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const resize = () => { const r = canvas.getBoundingClientRect(); w = r.width; h = r.height; canvas.width = Math.max(1, Math.floor(w * dpr)); canvas.height = Math.max(1, Math.floor(h * dpr)); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        const dots = Array.from({ length: 42 }, (_, i) => ({ x: Math.random(), y: Math.random(), r: 1.2 + Math.random() * 3.2, speed: .00018 + Math.random() * .00045, phase: Math.random() * Math.PI * 2, color: ["#C9A24B", "#DCE8B5", "#D8D3E6", "#FFFFFF"][i % 4] }));
        let t = 0;
        const draw = () => {
            t += reduced ? 0 : 0.006;
            ctx.clearRect(0, 0, w, h);
            const cols = ["rgba(201,162,75,.55)", "rgba(220,232,181,.5)", "rgba(216,211,230,.55)", "rgba(255,255,255,.28)"];
            cols.forEach((c, ci) => {
                ctx.beginPath();
                ctx.strokeStyle = c;
                ctx.lineWidth = 1.6;
                for (let x = 0; x <= w; x += 8) {
                    const y = h * (0.18 + ci * 0.22) + Math.sin(x * 0.008 + t * 2 + ci * 1.4) * 18 + Math.sin(x * 0.003 - t) * 10;
                    if (x === 0)
                        ctx.moveTo(x, y);
                    else
                        ctx.lineTo(x, y);
                }
                ctx.stroke();
            });
            dots.forEach(d => { const y = ((d.y + Math.sin(t * 1.2 + d.phase) * 0.04 + t * d.speed * 22) % 1.15); const yy = y < 0 ? y + 1.15 : y; ctx.beginPath(); ctx.fillStyle = d.color; ctx.globalAlpha = .75; ctx.shadowColor = d.color; ctx.shadowBlur = 14; ctx.arc(d.x * w, yy * h, d.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.shadowBlur = 0; });
            if (!reduced)
                raf = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    }, []);
    return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full"/>;
}
