/* Fairhold home: one small motion. The rule from each sample rate con down to the app draws itself as you reach it.
   Without JavaScript, or with reduced motion, the rules simply show. Nothing else moves. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  els.forEach(function (el) {
    // anything already on screen when the page opens stays as it is
    if (el.getBoundingClientRect().top < innerHeight) el.classList.add('on');
    io.observe(el);
  });
  document.documentElement.classList.add('rv');
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
