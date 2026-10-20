import React, { useEffect, useRef } from 'react';

interface SphereNode {
  x: number;
  y: number;
  z: number;
}

interface AmbientParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  alpha: number;
}

const ThreeDCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse coordinates in normalized [-1, 1] range
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / width) * 2 - 1;
      targetMouseY = (e.clientY / height) * 2 - 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 1. Generate 3D Neural Network Sphere Nodes using Fibonacci Sphere
    const sphereNodeCount = 70;
    const sphereRadius = 190;
    const sphereNodes: SphereNode[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden ratio angle

    for (let i = 0; i < sphereNodeCount; i++) {
      const y = 1 - (i / (sphereNodeCount - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      sphereNodes.push({
        x: Math.cos(theta) * radiusAtY * sphereRadius,
        y: y * sphereRadius,
        z: Math.sin(theta) * radiusAtY * sphereRadius,
      });
    }

    // 2. Generate Floating Light Ambient Particles (Soft blue, cyan, violet)
    const ambientCount = 55;
    const ambientParticles: AmbientParticle[] = [];
    const particleColors = [
      'rgba(37, 99, 235, ',  // Royal blue
      'rgba(2, 132, 199, ',  // Sky cyan
      'rgba(6, 182, 212, ',  // Aqua cyan
      'rgba(139, 92, 246, ', // Soft violet
    ];

    for (let i = 0; i < ambientCount; i++) {
      ambientParticles.push({
        x: (Math.random() - 0.5) * 1400,
        y: (Math.random() - 0.5) * 900,
        z: (Math.random() - 0.5) * 800,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.2 + 1.2,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        alpha: Math.random() * 0.4 + 0.25,
      });
    }

    let rotX = 0;
    let rotY = 0;
    let rotZ = 0;

    const fov = 750;

    const render = () => {
      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      // Gentle sphere continuous rotation
      rotX += 0.0018 + mouseY * 0.002;
      rotY += 0.0035 + mouseX * 0.003;
      rotZ += 0.001;

      ctx.clearRect(0, 0, width, height);

      // --- A. Draw Light Cyber Grid at Bottom ---
      const gridY = height * 0.88;
      const vanishingX = width * 0.5 + mouseX * 60;
      const vanishingY = gridY - 120;
      const gridLines = 16;

      ctx.lineWidth = 0.8;
      for (let i = 0; i <= gridLines; i++) {
        const xBottom = (width / gridLines) * i;
        ctx.strokeStyle = 'rgba(219, 234, 254, 0.45)'; // very soft light blue
        ctx.beginPath();
        ctx.moveTo(vanishingX, vanishingY);
        ctx.lineTo(xBottom, height);
        ctx.stroke();
      }

      for (let j = 1; j <= 6; j++) {
        const yLine = vanishingY + Math.pow(j / 6, 2) * (height - vanishingY);
        ctx.beginPath();
        ctx.moveTo(0, yLine);
        ctx.lineTo(width, yLine);
        ctx.strokeStyle = `rgba(186, 230, 253, ${0.12 + j * 0.04})`;
        ctx.stroke();
      }

      // Sphere Center Position (Positioned towards the left side on desktop, centered on mobile)
      const sphereCenterX = width > 1024 ? width * 0.24 : width * 0.5;
      const sphereCenterY = width > 1024 ? height * 0.48 : height * 0.25;

      // --- B. Project & Draw Rotating 3D Neural-Network Sphere ---
      const projectedSphere = sphereNodes.map((v) => {
        // Rotate Y
        let x1 = v.x * Math.cos(rotY) - v.z * Math.sin(rotY);
        let z1 = v.z * Math.cos(rotY) + v.x * Math.sin(rotY);

        // Rotate X
        let y2 = v.y * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = z1 * Math.cos(rotX) + v.y * Math.sin(rotX);

        // Rotate Z
        let x3 = x1 * Math.cos(rotZ) - y2 * Math.sin(rotZ);
        let y3 = y2 * Math.cos(rotZ) + x1 * Math.sin(rotZ);

        const depth = z2 + 850;
        const scale = fov / Math.max(depth, 100);

        return {
          x: sphereCenterX + x3 * scale,
          y: sphereCenterY + y3 * scale,
          z: z2,
          scale,
          // Front nodes are brighter, back nodes are softer
          alpha: Math.min(Math.max((z2 + sphereRadius) / (2 * sphereRadius), 0.15), 0.85),
        };
      });

      // Draw Thin Blue/Cyan Connection Lines between neighboring sphere nodes
      ctx.lineWidth = 0.9;
      for (let i = 0; i < projectedSphere.length; i++) {
        const p1 = projectedSphere[i];
        for (let j = i + 1; j < projectedSphere.length; j++) {
          const p2 = projectedSphere[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 65) {
            const lineAlpha = (1 - dist / 65) * 0.45 * Math.min(p1.alpha, p2.alpha);
            ctx.strokeStyle = `rgba(14, 165, 233, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw Neural Nodes on Sphere
      for (const p of projectedSphere) {
        ctx.beginPath();
        const r = Math.max(p.scale * 2.8, 1.8);
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);

        // Soft gradient glow
        ctx.fillStyle = `rgba(37, 99, 235, ${p.alpha})`;
        ctx.fill();

        // Extra highlight on frontmost nodes
        if (p.z > 80) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(6, 182, 212, ${p.alpha * 1.2})`;
          ctx.fill();
        }
      }

      // --- C. Floating Ambient Light Particles ---
      for (const p of ambientParticles) {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        if (p.x < -700) p.x = 700;
        if (p.x > 700) p.x = -700;
        if (p.y < -450) p.y = 450;
        if (p.y > 450) p.y = -450;
        if (p.z < -400) p.z = 400;
        if (p.z > 400) p.z = -400;

        const cosY = Math.cos(mouseX * 0.25);
        const sinY = Math.sin(mouseX * 0.25);
        const cosX = Math.cos(mouseY * 0.25);
        const sinX = Math.sin(mouseY * 0.25);

        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        const depth = z2 + 850;
        const scale = fov / Math.max(depth, 100);

        const projX = width * 0.5 + x1 * scale;
        const projY = height * 0.5 + y1 * scale;

        ctx.beginPath();
        ctx.arc(projX, projY, p.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha * 0.65})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ opacity: 0.95 }}
    />
  );
};

export default ThreeDCanvas;
