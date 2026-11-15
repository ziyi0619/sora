// SORA site: the walk scene, Hold for help demo, check-in clock, mode tabs,
// scroll reveals and nav state. No libraries.
(function () {
  document.documentElement.classList.add('js');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // centre an item inside a sideways-scrolling row (nav links, mode tabs on phones)
  var keepInView = function (box, el) {
    if (!box || !box.scrollTo || box.scrollWidth <= box.clientWidth) return;
    var r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    box.scrollTo({ left: box.scrollLeft + (r.left - b.left) - (b.width - r.width) / 2, behavior: calm ? 'auto' : 'smooth' });
  };

  /* ---------- The walk: scroll or drag moves Mei up Amsterdam Ave ---------- */
  var walk = $('#walk');
  var route = $('#route-live');
  if (walk && route && route.getTotalLength) {
    var L = route.getTotalLength();
    var preview = $('.route--preview');
    var walker = $('#walker');
    var map = $('.map');
    var chipText = $('#map-chip-text');
    var timeEl = $('#walk-time');
    var scrub = $('#walk-scrub');
    var captions = $$('.walk__captions p');
    var shots = $$('.phone__stack img');
    var pois = $$('.poi');
    var chips = ['Only you can see you', 'Mom & Lia walk with you', 'Mom & Lia can see you', 'Mom & Lia can’t see you now'];
    var shares = ['off', 'off', 'on', 'ended'];
    var places = ['at West 72nd Street', 'choosing the route', 'walking up Amsterdam Avenue', 'home, route deleted'];
    var lastPhase = -1;
    var dragging = false;

    route.style.strokeDasharray = L + ' ' + L;
    route.style.strokeDashoffset = L;

    var progress = function () {
      var span = walk.offsetHeight - window.innerHeight;
      return span > 0 ? clamp(-walk.getBoundingClientRect().top / span, 0, 1) : 0;
    };

    var render = function (p) {
      var phase = p < 0.12 ? 0 : p < 0.24 ? 1 : p < 0.86 ? 2 : 3;
      var t = phase < 2 ? 0 : phase === 2 ? (p - 0.24) / 0.62 : 1;
      var erase = phase === 3 ? clamp((p - 0.86) / 0.1, 0, 1) : 0;

      // the route draws as she walks, then erases itself from the start once she's home
      route.style.strokeDashoffset = phase < 3 ? L * (1 - t) : -L * erase;
      preview.style.opacity = phase < 3 ? '' : String(0.35 * (1 - erase));
      var pt = route.getPointAtLength(L * t);
      walker.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ')');
      walker.classList.toggle('is-home', phase === 3);
      pois.forEach(function (g) { g.classList.toggle('is-passed', phase >= 2 && t >= parseFloat(g.dataset.at)); });
      map.classList.toggle('is-deleted', erase > 0.6);

      var minutes = Math.round(13 * t);
      var time = '10:' + (29 + minutes);
      timeEl.textContent = time;

      if (phase !== lastPhase) {
        captions.forEach(function (c) { c.classList.toggle('is-on', +c.dataset.phase === phase); });
        shots.forEach(function (s) { s.classList.toggle('is-on', +s.dataset.phase === phase); });
        chipText.textContent = chips[phase];
        map.setAttribute('data-share', shares[phase]);
        lastPhase = phase;
      }

      if (!dragging) scrub.value = Math.round(p * 1000);
      scrub.style.setProperty('--p', (p * 100).toFixed(1) + '%');
      scrub.setAttribute('aria-valuetext', time + ' PM, ' + places[phase]);
    };

    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { render(progress()); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    // dragging the scrubber scrolls the page, so scroll stays the single source of truth
    scrub.addEventListener('input', function () {
      var span = walk.offsetHeight - window.innerHeight;
      var top = walk.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + (scrub.value / 1000) * span, behavior: 'instant' });
    });
    scrub.addEventListener('pointerdown', function () { dragging = true; });
    window.addEventListener('pointerup', function () { dragging = false; });

    render(progress());
  }

  /* ---------- Demo 1 · Hold for help, on the real walking screen ---------- */
  var hold = $('#hold-btn');
  if (hold) {
    var toast = $('#hold-toast');
    var holdTimer = null, toastTimer = null, held = false;
    var say = function (msg, ms) {
      clearTimeout(toastTimer);
      toast.textContent = msg;
      toast.classList.add('is-on');
      toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, ms);
    };
    var press = function () {
      if (held) return;
      hold.classList.add('is-holding');
      holdTimer = setTimeout(function () {
        held = true;
        hold.classList.remove('is-holding');
        hold.classList.add('is-done');
        say('Held on purpose. That’s how SORA knows she means it.', 3000);
        setTimeout(function () { held = false; hold.classList.remove('is-done'); }, 3000);
      }, 1500);
    };
    var release = function () {
      if (held || !hold.classList.contains('is-holding')) return;
      clearTimeout(holdTimer);
      hold.classList.remove('is-holding');
      say('Let go early. Nothing happens.', 2000);
    };
    hold.addEventListener('pointerdown', function (e) { e.preventDefault(); press(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { hold.addEventListener(ev, release); });
    hold.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    hold.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(); } });
    hold.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); release(); } });
  }

  /* ---------- Demo 2 · Missed check-in, on the real Escalation Protocol screen ---------- */
  var clock = $('#clock');
  if (clock) {
    var IMG_H = 1610;                                  // escalation.jpg height in px
    var VIEW = 1343;                                    // visible screen height in the same px
    var CARDS = { 1: [575, 850], 2: [862, 1125], 3: [1140, 1400], done: [1428, 1555] };
    var SCROLL = { 1: 0, 2: 140, 3: IMG_H - VIEW, done: IMG_H - VIEW };
    var LINES = {
      1: 'Tier 1: her circle gets a silent ping with her live location.',
      2: 'Tier 2: an audible prompt and a haptic pulse on her phone.',
      3: 'Tier 3: SORA contacts emergency services.',
      done: 'Disarmed. The cycle is complete.'
    };
    var scrollEl = $('#esc-scroll'), hl = $('#esc-hl'), cTime = $('#clock-time'), cStatus = $('#clock-status');
    var startBtn = $('#clock-start'), okBtn = $('#clock-ok');
    var SPEED = 10, END = 120, raf = null, t0 = 0, tier = null;
    var fmt = function (s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };
    var show = function (key) {
      if (key === tier) return;
      tier = key;
      var c = CARDS[key];
      hl.style.setProperty('--ht', (c[0] / IMG_H * 100).toFixed(2) + '%');
      hl.style.setProperty('--hh', ((c[1] - c[0]) / IMG_H * 100).toFixed(2) + '%');
      scrollEl.style.transform = 'translateY(' + (-SCROLL[key] / IMG_H * 100).toFixed(2) + '%)';
      clock.setAttribute('data-tier', String(key));
      cStatus.textContent = LINES[key];
    };
    var stop = function () {
      cancelAnimationFrame(raf);
      okBtn.hidden = true;
      startBtn.hidden = false;
      startBtn.textContent = 'Run it again';
    };
    var frame = function (now) {
      var sim = Math.min(END, ((now - t0) / 1000) * SPEED);
      cTime.textContent = fmt(sim);
      show(sim < 60 ? 1 : sim < END ? 2 : 3);
      if (sim >= END) { stop(); return; }
      raf = requestAnimationFrame(frame);
    };
    startBtn.addEventListener('click', function () {
      tier = null;
      clock.classList.add('is-active');
      cTime.textContent = '0:00';
      startBtn.hidden = true;
      okBtn.hidden = false;
      okBtn.focus();
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    });
    okBtn.addEventListener('click', function () {
      stop();
      show('done');
      startBtn.focus();
    });
  }

  /* ---------- Demo 3 · Fake call: setup, incoming call, on the call ---------- */
  var callScreen = $('#call-screen');
  if (callScreen) {
    var callScroll = $('#call-scroll'), pressEl = $('#call-press'), callNote = $('#call-note');
    var callStart = $('#call-start'), accept = $('#call-accept'), decline = $('#call-decline'), end = $('#call-end');
    var NOTES = {
      setup: 'A believable call gives her a reason to step away.',
      ring: 'Dad is calling. Answer it, like any other call.',
      talk: 'To anyone nearby, she’s just on a call.'
    };
    var step = function (s) {
      callScreen.setAttribute('data-step', s);
      callNote.textContent = NOTES[s];
      accept.hidden = decline.hidden = s !== 'ring';
      end.hidden = s !== 'talk';
      callStart.disabled = s !== 'setup';
      if (s === 'setup') callScroll.style.transform = '';
    };
    callStart.addEventListener('click', function () {
      callStart.disabled = true;
      callScroll.style.transform = 'translateY(' + (-(1624 - 1343) / 1624 * 100).toFixed(2) + '%)';
      setTimeout(function () { pressEl.classList.add('is-on'); }, 550);
      setTimeout(function () { pressEl.classList.remove('is-on'); step('ring'); accept.focus(); }, 900);
    });
    accept.addEventListener('click', function () { step('talk'); end.focus(); });
    decline.addEventListener('click', function () { step('setup'); callStart.textContent = 'Try it again'; callStart.focus(); });
    end.addEventListener('click', function () { step('setup'); callStart.textContent = 'Try it again'; callStart.focus(); });
  }

  /* ---------- Mode tabs (WAI-ARIA tabs, arrow keys) ---------- */
  var section = $('#modes');
  var tabs = $$('.tab');
  var select = function (tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    section.setAttribute('data-mode', tab.dataset.mode);
    keepInView(tab.parentNode, tab);
    if (focus) tab.focus();
  };
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); select(next, true); }
    });
  });

  // on touch screens, a sideways swipe on the phone moves to the next or previous mode
  $$('.mode-panel').forEach(function (panel) {
    var x0 = null, y0 = 0;
    panel.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    panel.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      var i = tabs.indexOf($('.tab[aria-selected="true"]'));
      var next = tabs[clamp(i + (dx < 0 ? 1 : -1), 0, tabs.length - 1)];
      if (next !== tabs[i]) select(next, false);
    }, { passive: true });
  });

  /* ---------- Scroll reveals: fade up once, 12px, 0.4s ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Nav: hairline once scrolled, highlight the section in view ---------- */
  var nav = $('.nav');
  var navScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', navScroll, { passive: true });
  navScroll();
  var links = $$('.nav__links a');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + entry.target.id;
          a.setAttribute('aria-current', on ? 'true' : 'false');
          if (on) keepInView(a.parentNode, a);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) spy.observe(target);
    });
  }
})();
