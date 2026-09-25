(function () {
  document.documentElement.classList.add('js');

  /* ================= Gate + Video flow ================= */
  var gate = document.getElementById('gate');
  var openBtn = document.getElementById('openBtn');
  var introVideo = document.getElementById('introVideo');
  var video = document.getElementById('video');
  var skipVideo = document.getElementById('skipVideo');
  var site = document.getElementById('site');

  function showSite() {
    introVideo.style.display = 'none';
    site.style.display = 'block';
    window.scrollTo(0, 0);
    initReveals();
  }

  openBtn.addEventListener('click', function () {
    // Prepare video: make it visible but transparent, start playing
    introVideo.style.display = 'flex';
    introVideo.style.opacity = '0';
    introVideo.style.transition = 'opacity 0.85s cubic-bezier(0.22, 1, 0.36, 1)';

    video.play().catch(function () { showSite(); });

    // On next frame: simultaneously crossfade gate out → video in
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        gate.classList.add('hide');       // gate fades out
        introVideo.style.opacity = '1';  // video fades in
      });
    });
  });

  video.addEventListener('ended', showSite);
  video.addEventListener('error', showSite);
  skipVideo.addEventListener('click', function () {
    video.pause();
    showSite();
  });

  /* ================= Lightweight scroll reveals =================
     No external libraries. Simple CSS transition (opacity + translateY)
     triggered by an IntersectionObserver. Plays once only (no reverse),
     so scrolling does not re-hide text — removes perceived lag.
     If JS fails to run at all, the `.js` class is never added and all
     text stays visible. */
  function initReveals() {
    var els = document.querySelectorAll('.reveal');

    if (!('IntersectionObserver' in window)) {
      // No observer support: show everything so content is never stuck hidden.
      for (var j = 0; j < els.length; j++) {
        els[j].classList.add('is-visible');
      }
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

    for (var i = 0; i < els.length; i++) {
      observer.observe(els[i]);
    }

    // Safety net: reveal everything shortly after load so no text can ever
    // stay stuck invisible, even if the observer misbehaves.
    window.setTimeout(function () {
      var remaining = document.querySelectorAll('.js .reveal:not(.is-visible)');
      for (var k = 0; k < remaining.length; k++) {
        remaining[k].classList.add('is-visible');
      }
    }, 1500);
  }
})();
