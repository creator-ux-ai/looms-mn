import React, { useEffect, useRef } from "react";

export default function LoomCanvas() {
    const ref = useRef(null);
    useEffect(() => {
        const canvas = ref.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        let raf = 0;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let w = 0, h = 0;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const resize = () => { const r = canvas.getBoundingClientRect(); w = r.width; h = r.height; canvas.width = Math.max(1, Math.floor(w * dpr)); canvas.height = Math.max(1, Math.floor(h * dpr)); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        let a = 0.6;
        const project = (x, y, z) => { const s = 220 / (420 + z); return { x: w / 2 + x * s, y: h / 2 + y * s, s }; };
        const draw = () => {
            a += reduced ? 0 : 0.008;
            ctx.clearRect(0, 0, w, h);
            const cubes = [];
            const colors = ["#4B2A85", "#C9A24B", "#B9D07A", "#2D1B4E", "#D8D3E6"];
            for (let i = 0; i < 28; i++) {
                const ang = (i / 28) * Math.PI * 2;
                const ring = Math.sin(i * 1.7) * 14;
                const x = Math.cos(ang) * 150;
                const y = Math.sin(ang) * 82 + ring;
                const z = Math.sin(ang) * 90;
                cubes.push({ x, y, z, c: colors[i % colors.length] });
            }
            // rotate around Y
            const rot = cubes.map(p => { const ca = Math.cos(a), sa = Math.sin(a); return { x: p.x * ca + p.z * sa, y: p.y, z: -p.x * sa + p.z * ca, c: p.c }; }).sort((p, q) => p.z - q.z);
            rot.forEach(p => { const pr = project(p.x, p.y, p.z); const size = 17 * pr.s; ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(a * 0.35); ctx.fillStyle = p.c; ctx.globalAlpha = 0.92; ctx.fillRect(-size / 2, -size / 2, size, size); ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.2; ctx.strokeRect(-size / 2, -size / 2, size, size); ctx.beginPath(); ctx.moveTo(-size / 2, 0); ctx.lineTo(size / 2, 0); ctx.moveTo(0, -size / 2); ctx.lineTo(0, size / 2); ctx.stroke(); ctx.restore(); });
            ctx.beginPath();
            ctx.strokeStyle = "rgba(75,42,133,.22)";
            ctx.ellipse(w / 2, h / 2, 170, 92, 0, 0, Math.PI * 2);
            ctx.stroke();
            if (!reduced)
                raf = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    }, []);
    return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full"/>;
}
