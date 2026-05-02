/* ============================================================
   SORA — Nebula Particle System
   Organic, warm, guardian aura visualization
   Canvas-based particle animation for the Network section
   ============================================================ */

class NebulaSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.connections = [];
    this.mouse = { x: 0, y: 0, radius: 150 };
    this.animationId = null;
    this.isVisible = false;

    this.updateColors();
    this.resize();
    this.createParticles();
    this.setupObserver();
    this.setupMouseTracking();

    window.addEventListener('resize', () => this.resize());
    window.nebulaInstance = this;
  }

  updateColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.colors = isDark ? {
      particle1: 'rgba(244, 162, 97, 0.6)',
      particle2: 'rgba(196, 181, 212, 0.5)',
      particle3: 'rgba(74, 127, 229, 0.4)',
      glow1: 'rgba(244, 162, 97, 0.15)',
      glow2: 'rgba(196, 181, 212, 0.12)',
      connection: 'rgba(244, 162, 97, 0.08)'
    } : {
      particle1: 'rgba(232, 115, 90, 0.5)',
      particle2: 'rgba(196, 181, 212, 0.4)',
      particle3: 'rgba(74, 127, 229, 0.35)',
      glow1: 'rgba(232, 115, 90, 0.12)',
      glow2: 'rgba(196, 181, 212, 0.1)',
      connection: 'rgba(232, 115, 90, 0.06)'
    };
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  createParticles() {
    const count = Math.min(60, Math.floor((this.width * this.height) / 15000));
    this.particles = [];

    for (let i = 0; i < count; i++) {
      const colorSet = [this.colors.particle1, this.colors.particle2, this.colors.particle3];
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 3 + 1.5,
        baseRadius: Math.random() * 3 + 1.5,
        color: colorSet[Math.floor(Math.random() * colorSet.length)],
        glowColor: i % 2 === 0 ? this.colors.glow1 : this.colors.glow2,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        opacity: 0.3 + Math.random() * 0.5
      });
    }
  }

  setupObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.isVisible = true;
          this.animate();
        } else {
          this.isVisible = false;
          if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
          }
        }
      });
    }, { threshold: 0.1 });

    observer.observe(this.canvas.parentElement);
  }

  setupMouseTracking() {
    this.canvas.parentElement.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.parentElement.addEventListener('mouseleave', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });
  }

  animate() {
    if (!this.isVisible) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Update & draw particles
    this.particles.forEach(p => {
      // Pulse
      p.pulse += p.pulseSpeed;
      p.radius = p.baseRadius + Math.sin(p.pulse) * 0.8;

      // Mouse interaction — gentle attraction
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.mouse.radius) {
        const force = (this.mouse.radius - dist) / this.mouse.radius;
        p.vx += dx * force * 0.0005;
        p.vy += dy * force * 0.0005;
      }

      // Movement with damping
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.998;
      p.vy *= 0.998;

      // Wrap edges
      if (p.x < -20) p.x = this.width + 20;
      if (p.x > this.width + 20) p.x = -20;
      if (p.y < -20) p.y = this.height + 20;
      if (p.y > this.height + 20) p.y = -20;

      // Draw glow
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 8);
      gradient.addColorStop(0, p.glowColor);
      gradient.addColorStop(1, 'transparent');
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius * 8, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          const opacity = (1 - dist / 150) * 0.15;
          this.ctx.beginPath();
          this.ctx.moveTo(a.x, a.y);
          this.ctx.lineTo(b.x, b.y);
          this.ctx.strokeStyle = this.colors.connection.replace('0.06', opacity.toFixed(3)).replace('0.08', opacity.toFixed(3));
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new NebulaSystem('nebulaCanvas');
});
