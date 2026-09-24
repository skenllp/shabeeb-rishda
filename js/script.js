(function () {
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
    // Kick off reveals on next paint so layout is settled
    requestAnimationFrame(function () {
      initReveals();
    });
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

  /* ================= GSAP scroll reveals ================= */
  function initReveals() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    // Mark all reveals so CSS safety-net transition is disabled
    gsap.utils.toArray('.reveal').forEach(function (el) {
      el.classList.add('gsap-active');
    });

    var inView = [];
    var offScreen = [];

    gsap.utils.toArray('.reveal').forEach(function (el) {
      var rect = el.getBoundingClientRect();
      // Consider element "in view" if its top is above 95% of viewport height
      if (rect.top < window.innerHeight * 0.95) {
        inView.push(el);
      } else {
        offScreen.push(el);
      }
    });

    // --- Already-visible elements: staggered immediate entrance ---
    if (inView.length) {
      gsap.fromTo(
        inView,
        { opacity: 0, y: 30, rotationX: 10, transformPerspective: 1200 },
        {
          opacity: 1, y: 0, rotationX: 0,
          duration: 0.7,
          ease: 'power2.out',
          stagger: 0.08,
          clearProps: 'transform,opacity'
        }
      );
    }

    // --- Off-screen elements: reveal on scroll ---
    offScreen.forEach(function (el) {
      gsap.fromTo(
        el,
        // transformPerspective applies perspective per-element, avoiding the
        // need for body-level perspective that causes full-page repaint
        { opacity: 0, transformPerspective: 1200, z: -220, rotationX: 18, y: 40 },
        {
          opacity: 1, z: 0, rotationX: 0, y: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
  }
})();
