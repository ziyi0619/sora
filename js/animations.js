/* ============================================================
   SORA — GSAP Animations
   Premium scroll-driven animations for design award quality
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  gsap.registerPlugin(ScrollTrigger);

  // ---- Hero Entrance ----
  const heroTl = gsap.timeline({ delay: 0.3 });

  heroTl
    .fromTo('.hero__title', {
      opacity: 0,
      y: 40,
      scale: 0.95
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.2,
      ease: 'power3.out'
    }, 0.2)
    .fromTo('.hero__subtitle', {
      opacity: 0,
      y: 30
    }, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out'
    }, 0.5)
    .fromTo('.hero__description', {
      opacity: 0,
      y: 20
    }, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, 0.8);

  // ---- Hero Parallax on Scroll ----
  gsap.to('.hero__content', {
    y: -80,
    opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1
    }
  });

  gsap.to('.hero__gradient::before', {
    scale: 1.3,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1
    }
  });

  // ---- Generic Section Reveals ----
  // Batch process all .anim-reveal elements for staggered entrance
  ScrollTrigger.batch('.anim-reveal', {
    onEnter: (elements) => {
      gsap.fromTo(elements, {
        opacity: 0,
        y: 40
      }, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
        overwrite: true
      });
    },
    start: 'top 88%',
    once: true
  });

  // ---- Stats Counter Animation ----
  document.querySelectorAll('.stat__number').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const isDecimal = target % 1 !== 0;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.fromTo(el, {
          innerText: 0
        }, {
          innerText: target,
          duration: 2,
          ease: 'power2.out',
          snap: { innerText: isDecimal ? 0.1 : 1 },
          onUpdate: function() {
            const val = parseFloat(gsap.getProperty(el, 'innerText'));
            el.textContent = isDecimal ? val.toFixed(1) : Math.round(val);
          }
        });
      }
    });
  });

  // ---- Behavior Tags (now Split Panel) — Entrance ----
  ScrollTrigger.create({
    trigger: '.split-panel',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.fromTo('.split-item', {
        opacity: 0,
        x: -15
      }, {
        opacity: 1,
        x: 0,
        duration: 0.4,
        ease: 'power3.out',
        stagger: 0.06
      });
    }
  });

  // ---- Evidence Accordion — Entrance ----
  ScrollTrigger.create({
    trigger: '.accordion',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.fromTo('.accordion__item', {
        opacity: 0,
        y: 20
      }, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.12
      });
    }
  });

  // ---- Comparison Section — Old Way → New Way ----
  ScrollTrigger.create({
    trigger: '.reframe__comparison',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      const tl = gsap.timeline();

      // Old column fades in first
      tl.fromTo('.comparison-col--old', {
        opacity: 0,
        x: -30
      }, {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: 'power3.out'
      });

      // Divider appears
      tl.fromTo('.comparison-divider', {
        opacity: 0,
        scale: 0
      }, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: 'back.out(2)'
      }, 0.4);

      // New column slides in with emphasis
      tl.fromTo('.comparison-col--new', {
        opacity: 0,
        x: 40,
        scale: 0.98
      }, {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.8,
        ease: 'power3.out'
      }, 0.5);

      // Old column dims slightly to emphasize the new
      tl.to('.comparison-col--old', {
        opacity: 0.7,
        duration: 0.4,
        ease: 'power2.out'
      }, 1);
    }
  });

  // ---- Device Showcase — Entrance ----
  ScrollTrigger.create({
    trigger: '.device-showcase',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.fromTo('.device-showcase__center', {
        opacity: 0, y: 40, scale: 0.95
      }, {
        opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out'
      });
      gsap.fromTo('.device-showcase__side', {
        opacity: 0, x: (i) => i === 0 ? -30 : 30
      }, {
        opacity: 0.5, x: 0, duration: 0.6, ease: 'power3.out', stagger: 0.15, delay: 0.3
      });
    }
  });

  // ---- Modes Panel — Entrance ----
  ScrollTrigger.create({
    trigger: '.modes-panel',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.fromTo('.mode-item', {
        opacity: 0, x: -20
      }, {
        opacity: 1, x: 0, duration: 0.5, ease: 'power3.out', stagger: 0.1
      });
      gsap.fromTo('.modes-panel__device', {
        opacity: 0, y: 30, scale: 0.95
      }, {
        opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out', delay: 0.3
      });
    }
  });

  // ---- Network Section — Dramatic Entrance ----
  ScrollTrigger.create({
    trigger: '.section--network',
    start: 'top 70%',
    once: true,
    onEnter: () => {
      gsap.fromTo('.section--network .section__eyebrow', {
        opacity: 0,
        y: 20
      }, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out'
      });

      gsap.fromTo('.section--network .section__title', {
        opacity: 0,
        y: 40,
        scale: 0.95
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: 'power3.out',
        delay: 0.2
      });

      gsap.fromTo('.network-feature', {
        opacity: 0,
        y: 30,
        scale: 0.97
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.15,
        delay: 0.5
      });
    }
  });

  // ---- Palette Swatches — Pop In ----
  ScrollTrigger.create({
    trigger: '.palette-row',
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.fromTo('.palette-swatch', {
        opacity: 0,
        scale: 0.5,
        y: 20
      }, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.5,
        ease: 'back.out(2)',
        stagger: 0.1
      });
    }
  });

  // ---- Research Grid — Cascade ----
  ScrollTrigger.create({
    trigger: '.research-grid',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.fromTo('.research-item', {
        opacity: 0,
        y: 30
      }, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.1
      });
    }
  });

  // ---- Team Members — Stagger ----
  ScrollTrigger.create({
    trigger: '.team-grid',
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.fromTo('.team-member', {
        opacity: 0,
        y: 30,
        scale: 0.9
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.5)',
        stagger: 0.15
      });
    }
  });

  // ---- Footer CTA — Grand Reveal ----
  ScrollTrigger.create({
    trigger: '.footer__cta',
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.fromTo('.footer__title', {
        opacity: 0,
        y: 40,
        scale: 0.96
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: 'power3.out'
      });

      gsap.fromTo('.footer__subtitle', {
        opacity: 0,
        y: 20
      }, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.3
      });

      gsap.fromTo('.award-badge', {
        opacity: 0,
        y: 20,
        scale: 0.9
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.5)',
        stagger: 0.15,
        delay: 0.6
      });
    }
  });

  // ---- Parallax for Section Titles ----
  document.querySelectorAll('.section__title').forEach(title => {
    gsap.to(title, {
      y: -15,
      ease: 'none',
      scrollTrigger: {
        trigger: title,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2
      }
    });
  });

  // ---- Magnetic Hover Effect for Cards ----
  document.querySelectorAll('.device-showcase__center, .principle-card, .research-item').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        transformPerspective: 800,
        duration: 0.4,
        ease: 'power2.out'
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: 'power2.out'
      });
    });
  });

});
