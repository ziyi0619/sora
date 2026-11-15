// SORA site: the walk scene, Hold for help demo, check-in clock, mode tabs,
// scroll reveals and nav state. No libraries.
(function () {
  document.documentElement.classList.add('js');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

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
      window.scrollTo(0, top + (scrub.value / 1000) * span);
    });
    scrub.addEventListener('pointerdown', function () { dragging = true; });
    window.addEventListener('pointerup', function () { dragging = false; });

    render(progress());
  }

  /* ---------- Hold for help: a long press, so a stray tap never sets it off ---------- */
  var hold = $('#hold-btn');
  if (hold) {
    var note = $('#hold-note');
    var label = $('.hold__label', hold);
    var timer = null, done = false, resetTimer = null;
    var start = function () {
      if (done) return;
      clearTimeout(resetTimer);
      hold.classList.add('is-holding');
      timer = setTimeout(function () {
        done = true;
        hold.classList.remove('is-holding');
        hold.classList.add('is-done');
        label.textContent = 'Held on purpose';
        note.textContent = 'Held on purpose. A stray tap never counts.';
        resetTimer = setTimeout(reset, 3200);
      }, 1500);
    };
    var end = function () {
      if (done || !hold.classList.contains('is-holding')) return;
      clearTimeout(timer);
      hold.classList.remove('is-holding');
      note.textContent = 'Let go early: nothing happens.';
    };
    var reset = function () {
      done = false;
      hold.classList.remove('is-done');
      label.textContent = 'Hold for help';
      note.textContent = 'Press and hold';
    };
    hold.addEventListener('pointerdown', function (e) { e.preventDefault(); start(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { hold.addEventListener(ev, end); });
    hold.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    hold.addEventListener('keydown', function (e) {
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); }
    });
    hold.addEventListener('keyup', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); end(); }
    });
  }

  /* ---------- Missed check-in clock: three tiers, "I'm OK" stops it ---------- */
  var clock = $('#clock');
  if (clock) {
    var cTime = $('#clock-time'), bar = $('#clock-bar'), status = $('#clock-status');
    var startBtn = $('#clock-start'), okBtn = $('#clock-ok');
    var tiers = $$('.clock__tiers li', clock);
    var SPEED = 10, END = 120;
    var raf = null, t0 = 0, tier = 0;
    var fmt = function (s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };
    var lines = {
      1: 'Her circle gets her live location. Nobody nearby hears it.',
      2: 'Her phone and Watch speak a prompt and vibrate.',
      3: 'SORA contacts emergency services.'
    };
    var setTier = function (n) {
      if (n === tier) return;
      tier = n;
      clock.setAttribute('data-tier', String(n));
      tiers.forEach(function (li) { li.classList.toggle('is-on', +li.dataset.tier <= n); });
      status.textContent = lines[n];
    };
    var stop = function (msg) {
      cancelAnimationFrame(raf);
      raf = null;
      okBtn.hidden = true;
      startBtn.textContent = 'Run it again';
      startBtn.hidden = false;
      if (msg) status.textContent = msg;
    };
    var frame = function (now) {
      var sim = Math.min(END, ((now - t0) / 1000) * SPEED);
      cTime.textContent = fmt(sim);
      bar.style.width = (sim / END * 100).toFixed(2) + '%';
      setTier(sim < 60 ? 1 : sim < END ? 2 : 3);
      if (sim >= END) { stop(); return; }
      raf = requestAnimationFrame(frame);
    };
    startBtn.addEventListener('click', function () {
      tier = 0;
      tiers.forEach(function (li) { li.classList.remove('is-on'); });
      cTime.textContent = '0:00';
      bar.style.width = '0%';
      startBtn.hidden = true;
      okBtn.hidden = false;
      okBtn.focus();
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    });
    okBtn.addEventListener('click', function () {
      stop('Stopped at ' + cTime.textContent + '. Nothing more happens.');
      startBtn.focus();
    });
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
          a.setAttribute('aria-current', a.getAttribute('href') === '#' + entry.target.id ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) spy.observe(target);
    });
  }
})();
