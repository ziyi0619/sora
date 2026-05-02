/* ============================================================
   SORA — main.js v6 restored
   Lenis smooth scroll · GSAP/ScrollTrigger
   word-mask reveal · click carousel · color flip nav
   anchor scroll with offset
   ============================================================ */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----------- Lenis smooth scroll ----------- */
let lenis;
if (!reduceMotion) {
  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
  });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
}

/* ----------- GSAP setup ----------- */
gsap.registerPlugin(ScrollTrigger);
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ----------- Anchor scroll: read each target's scroll-margin-top as the offset ----------- */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();

    if (id === '#top') {
      if (lenis) lenis.scrollTo(0, { duration: 1.1 });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // CSS scroll-margin-top is the source of truth — JS just honors it
    const smt = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;

    if (lenis) {
      lenis.scrollTo(target, { offset: -smt, duration: 1.1 });
    } else {
      const top = target.getBoundingClientRect().top + window.scrollY - smt;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ----------- Word-mask split reveal ----------- */
function splitWords(el) {
  const wrap = (text) => {
    const frag = document.createDocumentFragment();
    const parts = text.split(/(\s+)/);
    parts.forEach(part => {
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part));
      } else if (part.length > 0) {
        const outer = document.createElement('span');
        outer.className = 'word-mask';
        const inner = document.createElement('span');
        inner.className = 'word-mask__inner';
        inner.textContent = part;
        outer.appendChild(inner);
        frag.appendChild(outer);
      }
    });
    return frag;
  };
  const walk = (node) => {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.textContent.trim().length > 0) {
          node.replaceChild(wrap(child.textContent), child);
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };
  walk(el);
}

document.querySelectorAll('[data-split="words"]').forEach((el) => {
  splitWords(el);
  const masks = el.querySelectorAll('.word-mask__inner');
  if (reduceMotion) {
    masks.forEach(m => m.style.transform = 'translateY(0)');
    return;
  }
  ScrollTrigger.create({
    trigger: el,
    start: 'top 88%',
    once: true,
    onEnter: () => {
      gsap.to(masks, { y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.04 });
    }
  });
});

/* ----------- Click carousel ----------- */
function setupCarousel() {
  const carousel = document.querySelector('.carousel');
  if (!carousel) return;
  const track = carousel.querySelector('.carousel__track');
  const slides = carousel.querySelectorAll('.slide');
  const dots = carousel.querySelectorAll('.carousel__dot');
  const arrows = carousel.querySelectorAll('.carousel__arrow');
  const total = slides.length;
  let index = 0;
  let autoTimer = null;

  const goTo = (next) => {
    index = ((next % total) + total) % total;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
  };

  arrows.forEach(arrow => {
    arrow.addEventListener('click', () => {
      const dir = parseInt(arrow.dataset.dir, 10);
      goTo(index + dir);
      restartAuto();
    });
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      restartAuto();
    });
  });

  let inView = false;
  ScrollTrigger.create({
    trigger: carousel,
    start: 'top 60%',
    end: 'bottom 40%',
    onEnter: () => { inView = true; startAuto(); },
    onEnterBack: () => { inView = true; startAuto(); },
    onLeave: () => { inView = false; stopAuto(); },
    onLeaveBack: () => { inView = false; stopAuto(); },
  });

  document.addEventListener('keydown', (e) => {
    if (!inView) return;
    if (e.key === 'ArrowLeft')  { goTo(index - 1); restartAuto(); }
    if (e.key === 'ArrowRight') { goTo(index + 1); restartAuto(); }
  });

  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', () => { if (inView) startAuto(); });

  function startAuto() {
    if (reduceMotion || autoTimer) return;
    autoTimer = setInterval(() => goTo(index + 1), 5500);
  }
  function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }
  function restartAuto() { stopAuto(); if (inView) startAuto(); }
}
setupCarousel();

/* ----------- Color flip nav ----------- */
function setupNavColorFlip() {
  const nav = document.querySelector('.pill-nav');
  if (!nav) return;
  document.querySelectorAll('.color-flip').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 80px', end: 'bottom 80px',
      onEnter: () => nav.classList.add('is-dark'),
      onEnterBack: () => nav.classList.add('is-dark'),
      onLeave: () => nav.classList.remove('is-dark'),
      onLeaveBack: () => nav.classList.remove('is-dark'),
    });
  });
}
setupNavColorFlip();

/* ----------- Hero phone choreography (yoyo with scroll) -----------
   Rest: side phones tucked 200px behind center.
   Spread: by ~35% of scroll range, sides fly outward (220px past rest),
           tilt more, shrink slightly; center grows up + larger.
   Revert: by ~75%, all back to rest. Held until end. */
if (!reduceMotion && !window.matchMedia('(max-width: 900px)').matches) {
  const left   = document.querySelector('.hero-phone--left');
  const center = document.querySelector('.hero-phone--center');
  const right  = document.querySelector('.hero-phone--right');

  if (left && center && right) {
    [left, right, center].forEach(el => { el.style.transformOrigin = 'center bottom'; });

    // Set rest state explicitly so GSAP fully owns the transform
    gsap.set(left,   { x: 200, y: 40, rotation: -6, scale: 1 });
    gsap.set(right,  { x: -200, y: 40, rotation: 6, scale: 1 });
    gsap.set(center, { x: 0, y: 0, rotation: 0, scale: 1 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: '+=380',          // fixed short range so peak arrives quickly
        scrub: 0.25,           // tighter follow
      }
    });

    // Spread phase (0 → 0.18 of timeline = first ~70px of scroll → peak almost immediately)
    tl.to(left,   { x: 90, y: 12, rotation: -16, scale: 1.18, duration: 0.18, ease: 'power2.out' }, 0)
      .to(right,  { x: -90, y: 12, rotation: 16, scale: 1.18, duration: 0.18, ease: 'power2.out' }, 0)
      .to(center, { y: -100, scale: 1.42, duration: 0.18, ease: 'power2.out' }, 0)

      // Revert phase (0.18 → 0.7) — back to rest by the time hero is mostly past
      .to(left,   { x: 200, y: 40, rotation: -6, scale: 1, duration: 0.52, ease: 'power2.inOut' }, 0.18)
      .to(right,  { x: -200, y: 40, rotation: 6, scale: 1, duration: 0.52, ease: 'power2.inOut' }, 0.18)
      .to(center, { y: 0, scale: 1, duration: 0.52, ease: 'power2.inOut' }, 0.18);

    // 0.75 → 1.0 holds at rest naturally (no further tweens)
  }
}

/* ----------- Reveal on scroll ----------- */
const fadeUpEls = document.querySelectorAll('.how-card, .feat-card, .net-card, .device--watch-card, .swatch');
if (!reduceMotion) {
  fadeUpEls.forEach((el, i) => {
    gsap.from(el, {
      opacity: 0, y: 30, duration: 0.75, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      delay: (i % 3) * 0.05,
    });
  });
}

/* ----------- Hero opening sequence ----------- */
window.addEventListener('load', () => {
  if (reduceMotion) return;
  const heroMasks = document.querySelectorAll('.hero__headline .word-mask__inner');
  gsap.to(heroMasks, { y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.05, delay: 0.2 });
  gsap.from('.hero__sub', { opacity: 0, y: 16, duration: 0.7, ease: 'power3.out', delay: 0.55 });
  gsap.from('.hero__ctas', { opacity: 0, y: 16, duration: 0.7, ease: 'power3.out', delay: 0.7 });
  gsap.from('.hero-phone', { opacity: 0, y: 60, duration: 1, ease: 'power3.out', delay: 0.45, stagger: 0.1 });
  gsap.from('.pill-nav', { opacity: 0, y: -12, duration: 0.6, ease: 'power3.out', delay: 0.1 });
});
