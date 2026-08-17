/* GHOST MCP site — shared behavior for index + subpages.
   Everything motion-related is gated behind body.js and skipped under
   prefers-reduced-motion; without JS the pages render fully static. */
(function () {
  var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!rm) document.body.classList.add('js');
  addEventListener('load', function () {
    requestAnimationFrame(function () { document.body.classList.add('loaded'); });
  });

  // ---- nav shadow on scroll
  var nav = document.querySelector('.nav');
  if (nav) {
    addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', scrollY > 8);
    }, { passive: true });
  }

  // ---- right-rail "On this page" scrollspy
  var toc = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  if (toc.length) {
    var spySections = toc.map(function (a) {
      return document.getElementById(a.getAttribute('href').slice(1));
    }).filter(Boolean);
    var spy = function () {
      var cur = spySections[0];
      spySections.forEach(function (s) {
        if (s.getBoundingClientRect().top <= innerHeight * 0.3) cur = s;
      });
      toc.forEach(function (a) {
        a.classList.toggle('on', !!cur && a.getAttribute('href') === '#' + cur.id);
      });
    };
    addEventListener('scroll', spy, { passive: true });
    spy();
  }

  // ---- functional tabs, auto-rotating until first user click
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.panel-tabs button'));
  var panes = Array.prototype.slice.call(document.querySelectorAll('.panel-media > pre'));
  var cur = 0, timer = null, auto = !rm;
  function show(i, byUser) {
    cur = i;
    tabs.forEach(function (b, j) {
      b.classList.toggle('on', j === i);
      b.setAttribute('aria-selected', j === i ? 'true' : 'false');
      b.classList.remove('prog');
    });
    panes.forEach(function (p, j) { p.classList.toggle('on', j === i); });
    if (byUser) { auto = false; clearInterval(timer); }
    else if (auto) { void tabs[i].offsetWidth; tabs[i].classList.add('prog'); }
  }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { show(i, true); });
  });
  if (auto && tabs.length) {
    timer = setInterval(function () { show((cur + 1) % tabs.length, false); }, 6000);
    tabs[0].classList.add('prog');
  }

  if (rm) return; // everything below is motion

  // ---- scroll reveals with per-group stagger
  var sel = '.section-head, .cards > *, .mosaic > *, .grid2 > *, .why > li, ' +
            '.road, .faq-item, .honesty, .cta-h, .cta-card > div, .panel-wrap, .underbar, ' +
            '.page-head, .prose, table.honesty-table';
  var targets = Array.prototype.slice.call(document.querySelectorAll(sel));
  targets.forEach(function (el) {
    el.classList.add('reveal');
    var i = Array.prototype.indexOf.call(el.parentElement.children, el);
    el.style.setProperty('--i', i % 6);
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('in'); });
  }

  // ---- count-up on the measured figures (final values stay the source of truth)
  function countUp(el) {
    var raw = el.getAttribute('data-to');
    var to = parseFloat(raw);
    var dec = (raw.split('.')[1] || '').length;
    var t0 = performance.now(), D = 1100;
    function frame(t) {
      var p = Math.min(1, (t - t0) / D);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = raw;
    }
    requestAnimationFrame(frame);
  }
  var counters = Array.prototype.slice.call(document.querySelectorAll('.count'));
  if (counters.length && 'IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); io2.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) {
      el.textContent = (0).toFixed((el.getAttribute('data-to').split('.')[1] || '').length);
      io2.observe(el);
    });
  }
})();
