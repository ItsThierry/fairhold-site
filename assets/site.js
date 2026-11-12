/* Fairhold home, alive. The page plays the check it describes: a light reads each sample rate con, what is inside
   the file comes out from under the sheet, the rule runs down, the iPhone's screen comes on and lights the page.
   Every scene ends in the still page. Without this script the page is that still page (see the note in site.css).
   The motion also plays under prefers-reduced-motion; it is gentle on purpose. */
(function () {
  var d = document, root = d.documentElement, w = window;
  w.__fhAlive = 1;
  if (!root.classList.contains('alive')) return;

  function all(sel, el) { return Array.prototype.slice.call((el || d).querySelectorAll(sel)); }
  function now() { return Date.now(); }

  /* seen(el, fn): call fn once, the first time any part of el is on screen. Also keeps el.__in current.
     IntersectionObserver is used (not scroll position) because it still works when the page sits in a frame
     that is as tall as the page and never scrolls itself. */
  var ioWorks = false, waiting = [];
  function fire(el) { var f = el.__seen; if (!f) return; el.__seen = null; var i = waiting.indexOf(el); if (i > -1) waiting.splice(i, 1); f(); }
  var io = new IntersectionObserver(function (entries) {
    ioWorks = true;
    entries.forEach(function (e) {
      e.target.__in = e.isIntersecting;
      if (e.isIntersecting) fire(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: [0, .2] });
  function seen(el, fn) { el.__seen = fn; waiting.push(el); io.observe(el); }
  /* Second net, for a browser whose observer goes quiet: where the page scrolls in its own window, the same
     question is asked from positions, on scroll and twice a second. */
  function sweep() {
    var vh = w.innerHeight || 0;
    if (!waiting.length || root.scrollHeight <= vh + 50) return;
    waiting.slice().forEach(function (el) { var r = el.getBoundingClientRect(); if (r.width && r.top < vh * .92 && r.bottom > 0) fire(el); });
  }
  var swept = 0;
  w.addEventListener('scroll', function () { var t = now(); if (t - swept > 150) { swept = t; sweep(); } }, { passive: true });
  setInterval(sweep, 500);
  /* Last net: an observer always reports once for each thing it watches. If it has said nothing at all after
     three seconds it does not work here, and the page goes back to being the still page, with nothing hidden. */
  setTimeout(function () { if (!ioWorks) { sweep(); if (root.scrollHeight <= (w.innerHeight || 0) + 50) root.classList.remove('alive'); } }, 3000);

  /* gate(prev, fn): run fn when the scene before it has finished, or at once if that scene is off screen
     (a fast thumb must never wait on something it has already passed). */
  function gate(prev, fn) {
    (function wait() {
      if (!prev || !prev.__in) return fn();
      var left = prev.__waiting ? 120 : (prev.__busyUntil || 0) - now();
      if (left <= 0) return fn();
      setTimeout(wait, Math.min(left, 120));
    })();
  }

  /* ---- the light on the green band needs the band's height (name + headline on phones, name only when wide) ---- */
  var h1 = d.getElementById('h1'), top = d.querySelector('.top');
  function band() {
    var wide = w.matchMedia && matchMedia('(min-width: 1120px)').matches;
    var el = wide ? top : h1;
    if (!el) return;
    root.style.setProperty('--band', Math.round(el.offsetTop + el.offsetHeight) + 'px');
  }
  band();
  w.addEventListener('resize', band);
  w.addEventListener('load', band);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(band);
  if ('ResizeObserver' in w && h1) new ResizeObserver(band).observe(h1);

  /* ---- things that rise into place ---- */
  all('.ex-h, .ex-sub, .ex-get, .phone figcaption, .get-icon, .get-h, .get-fine, .get-b, .foot-in').forEach(function (el) {
    el.setAttribute('data-rise', '');
    if (el.classList.contains('ex-sub') || el.classList.contains('get-h')) el.style.setProperty('--rd', '90ms');
    if (el.classList.contains('get-fine')) el.style.setProperty('--rd', '180ms');
    seen(el, function () { el.classList.add('on'); });
  });

  /* ---- the check, played on each sample rate con ---- */
  all('.ex').forEach(function (ex) {
    var paper = ex.querySelector('[data-scan]'), says = ex.querySelector('.says'), phone = ex.querySelector('.phone');
    if (!paper) return;
    var red = paper.getAttribute('data-scan') === 'red';
    var doc = paper.querySelector('.doc'), file = paper.querySelector('.file');
    var beam = d.createElement('i'); beam.className = 'beam'; beam.setAttribute('aria-hidden', 'true'); doc.appendChild(beam);

    seen(paper, function () {
      var H = doc.offsetHeight, T0 = 380, TAIL = 130;
      var scan = Math.max(900, Math.min(1400, Math.round(H * 3.3)));
      function at(el) { return Math.round(T0 + scan * ((el.offsetTop + el.offsetHeight / 2) / (H + TAIL))); }
      doc.style.setProperty('--scan', scan + 'ms');
      doc.style.setProperty('--t0', T0 + 'ms');
      all('.d-lines p, .d-total', doc).forEach(function (r) { r.style.setProperty('--d', (at(r) - 120) + 'ms'); });
      var total = doc.querySelector('.d-total'), hit = total ? at(total) : T0 + scan;
      var foundAt = red ? hit + 640 : hit + 260, landAt = foundAt + (red ? 520 : 330);
      paper.__waiting = false; paper.__busyUntil = now() + landAt + 100;
      paper.classList.add('go');
      if (red && total && file) setTimeout(function () { xray(paper, doc, file, total); }, hit - 60);
      setTimeout(function () { paper.classList.add('found'); }, foundAt);
      setTimeout(function () { paper.classList.add('landed'); }, landAt);
    });

    paper.__waiting = true;
    if (says) { says.__waiting = true; seen(says, function () {
      gate(paper, function () { says.__waiting = false; says.__busyUntil = now() + 700; says.classList.add('on'); });
    }); }

    if (phone) {
      var inn = phone.querySelector('.phone-in'), frame = phone.querySelector('.phone-frame');
      ['glow', 'floor'].forEach(function (c) { var s = d.createElement('i'); s.className = c; s.setAttribute('aria-hidden', 'true'); inn.insertBefore(s, inn.firstChild); });
      var g = d.createElement('i'); g.className = 'glare'; g.setAttribute('aria-hidden', 'true'); inn.insertBefore(g, frame);
      seen(phone, function () {
        gate(says, function () {
          phone.classList.add('lit');
          setTimeout(function () { phone.classList.add('settled'); }, 1000);
        });
      });
    }
  });

  /* The edited sample: where the light meets the total, the total that an earlier version of the file holds
     shows in red for a moment, then drops into the box below, which states it. The text is read from that box,
     so the page has one source for the number. */
  function xray(paper, doc, file, total) {
    var from = total.querySelector('b'), to = file.querySelector('.file-row b');
    if (!from || !to || !to.animate) return;
    var gh = d.createElement('p'); gh.className = 'ghost'; gh.setAttribute('aria-hidden', 'true'); gh.textContent = to.textContent;
    paper.appendChild(gh);
    var fs = parseFloat(getComputedStyle(from).fontSize) || 26, ts = parseFloat(getComputedStyle(to).fontSize) || 17;
    gh.style.fontSize = fs + 'px';
    var pr = paper.getBoundingClientRect(), fr = from.getBoundingClientRect();   /* the sheet is at rest by now */
    var sx = fr.right - pr.left - gh.offsetWidth, sy = fr.top - pr.top + (fr.height - gh.offsetHeight) / 2;
    var tx = file.offsetLeft + to.offsetLeft + to.offsetWidth - gh.offsetWidth, ty = file.offsetTop + to.offsetTop + (to.offsetHeight - gh.offsetHeight * ts / fs) / 2;
    gh.style.left = sx + 'px'; gh.style.top = sy + 'px';
    var dx = tx - sx, dy = ty - sy, s = ts / fs;
    paper.classList.add('xray');
    var a = gh.animate([
      { opacity: 0, transform: 'translate(0,0) scale(1.08)', offset: 0 },
      { opacity: 1, transform: 'translate(0,0) scale(1)', offset: .12 },
      { opacity: 1, transform: 'translate(0,0) scale(1)', offset: .52, easing: 'cubic-bezier(.5,0,.2,1)' },
      { opacity: 1, transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')', offset: .95 },
      { opacity: 0, transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')', offset: 1 }
    ], { duration: 1280, fill: 'both' });
    setTimeout(function () { paper.classList.remove('xray'); }, 640);
    a.onfinish = function () { if (gh.parentNode) gh.parentNode.removeChild(gh); };
  }

  /* ---- the small iPhone on the first screen: a reflection crosses its glass too (under the frame, never on it) ---- */
  all('.mini .phone-in').forEach(function (inn) {
    var g = d.createElement('i'); g.className = 'glare'; g.setAttribute('aria-hidden', 'true');
    inn.insertBefore(g, inn.querySelector('.phone-frame'));
    setTimeout(function () { inn.classList.add('lit'); }, 900);
  });

  /* ---- depth: the phones drift a few pixels against the page as it scrolls (only where scroll events exist) ---- */
  var phones = all('.ex .phone-in'), ticking = false;
  function drift() {
    ticking = false;
    var vh = w.innerHeight || 800;
    phones.forEach(function (p) {
      var r = p.parentNode.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var y = ((r.top + r.height / 2) - vh / 2) * -0.035;
      p.style.setProperty('--py', Math.max(-14, Math.min(14, y)).toFixed(1) + 'px');
    });
  }
  w.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });

  /* ---- the film in the last band: a truck heading into first light (made with AI; the footer says so).
     On phones and tablets it is a strip across the top of the band, above the words; on wide screens a window
     under the words. Never behind the words. It is asked for only when the band is near. The file has no sound
     track and is muted as well. If a phone will not play it (Low Power Mode), its first frame stays as a picture. ---- */
  var get = d.querySelector('.get[data-film]');
  if (get) {
    var near = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      near.disconnect();
      var col = get.querySelector('.get-a'), mq = w.matchMedia('(min-width: 1120px)');
      var box = d.createElement('div'); box.className = 'get-film'; box.setAttribute('aria-hidden', 'true');
      var im = new Image(); im.alt = ''; im.decoding = 'async'; im.onload = function () { box.classList.add('playing'); };
      im.src = get.getAttribute('data-poster'); box.appendChild(im);
      var v = d.createElement('video');
      v.muted = true; v.defaultMuted = true; v.volume = 0; v.loop = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('loop', '');
      v.setAttribute('disablepictureinpicture', ''); v.setAttribute('disableremoteplayback', ''); v.setAttribute('tabindex', '-1');
      v.autoplay = true; v.setAttribute('autoplay', '');
      v.addEventListener('playing', function () { box.classList.add('playing'); });
      v.src = get.getAttribute('data-film');
      box.appendChild(v);
      function place() { if (mq.matches && col) col.appendChild(box); else get.insertBefore(box, get.firstChild); }
      place(); get.classList.add('has-film');
      if (mq.addEventListener) mq.addEventListener('change', function () { place(); play(); });
      var tries = 0;
      function play() { if (!box.__on || !v.paused) return; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      /* The film runs only while it is on screen. Some browsers pause a video that is barely in view, so it is
         started again as more of it shows, on scroll, and after a pause it did not ask for (a few tries per visit). */
      new IntersectionObserver(function (e2) {
        var e = e2[e2.length - 1]; box.__on = e.isIntersecting;
        if (box.__on) { play(); } else { tries = 0; v.pause(); }
      }, { threshold: [0, .25, .6, 1] }).observe(box);
      v.addEventListener('pause', function () { if (box.__on && tries++ < 12) setTimeout(play, 350); });
      var st = 0;
      w.addEventListener('scroll', function () { var t = now(); if (t - st > 400) { st = t; play(); } }, { passive: true });
    }, { rootMargin: '700px 0px' });
    near.observe(get);
  }
})();

/* A picture that does not arrive (a weak signal drops the connection) is asked for again, twice at most.
   Nothing on the page changes; without JavaScript the browser's own loading is all there is. */
(function () {
  function again(img) {
    var n = +(img.getAttribute('data-retry') || 0);
    if (n >= 2) return;
    img.setAttribute('data-retry', n + 1);
    setTimeout(function () {
      var tag = '?retry=' + (n + 1), ss = img.getAttribute('srcset');
      if (ss) img.setAttribute('srcset', ss.replace(/\?retry=\d/g, '').replace(/(\S+)(\s+\d+w)/g, '$1' + tag + '$2'));
      img.setAttribute('src', img.getAttribute('src').replace(/\?retry=\d$/, '') + tag);
    }, 700 * (n + 1));
  }
  var imgs = document.images;
  for (var i = 0; i < imgs.length; i++) (function (img) {
    img.addEventListener('error', function () { again(img); });
    // it may have failed before this script ran
    if (img.complete && !img.naturalWidth && /\.webp$/.test(img.getAttribute('src') || '')) again(img);
  })(imgs[i]);
})();
