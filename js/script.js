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

  /* ================= 3D forest / leaf scene (Three.js) ================= */
  var container = document.getElementById('canvas-container');
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050d07, 0.035);

  var camera = new THREE.PerspectiveCamera(
    55, window.innerWidth / window.innerHeight, 0.1, 100
  );
  camera.position.set(0, 0, 12);

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  var ambient = new THREE.AmbientLight(0x8fae7d, 0.6);
  scene.add(ambient);
  var keyLight = new THREE.DirectionalLight(0xf3ecdc, 0.8);
  keyLight.position.set(3, 6, 4);
  scene.add(keyLight);
  var rim = new THREE.PointLight(0xc9a86a, 0.6, 30);
  rim.position.set(-4, 2, 6);
  scene.add(rim);

  // Load SVG leaf assets as sprite textures
  var leafUrls = ['assets/leaf1.svg', 'assets/leaf2.svg', 'assets/leaf3.svg'];
  var textures = [];
  var loadedCount = 0;

  leafUrls.forEach(function (url) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      var c = document.createElement('canvas');
      c.width = 256; c.height = 256;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, 256, 256);
      var tex = new THREE.CanvasTexture(c);
      textures.push(tex);
      loadedCount++;
      if (loadedCount === leafUrls.length) buildLeaves();
    };
    img.onerror = function () {
      loadedCount++;
      if (loadedCount === leafUrls.length && textures.length) buildLeaves();
    };
    img.src = url;
  });

  var leafGroup = new THREE.Group();
  scene.add(leafGroup);
  var leaves = [];

  function buildLeaves() {
    var count = window.innerWidth < 700 ? 60 : 110;
    for (var i = 0; i < count; i++) {
      var tex = textures[Math.floor(Math.random() * textures.length)];
      var mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0.65 + Math.random() * 0.3,
        depthWrite: false
      });
      var sprite = new THREE.Sprite(mat);
      var scale = 0.6 + Math.random() * 1.6;
      sprite.scale.set(scale, scale, 1);
      sprite.position.set(
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 60 - 10,
        (Math.random() - 0.5) * 24
      );
      sprite.material.rotation = Math.random() * Math.PI * 2;
      leafGroup.add(sprite);
      leaves.push({
        mesh: sprite,
        driftSpeed: 0.05 + Math.random() * 0.15,
        rotSpeed: (Math.random() - 0.5) * 0.01,
        baseX: sprite.position.x,
        swaySpeed: 0.3 + Math.random() * 0.5,
        swayOffset: Math.random() * Math.PI * 2
      });
    }
  }

  // Scroll-driven camera parallax through the "forest"
  var scrollY = 0;
  var targetScrollY = 0;
  window.addEventListener('scroll', function () {
    targetScrollY = window.scrollY;
  }, { passive: true });

  function docHeight() {
    return Math.max(document.body.scrollHeight - window.innerHeight, 1);
  }

  var clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    // Smooth scroll interpolation
    scrollY += (targetScrollY - scrollY) * 0.08;
    var progress = scrollY / docHeight(); // 0..1

    // Move camera deeper into the scene & gently rotate as the guest scrolls
    camera.position.z = 12 - progress * 20;
    camera.position.y = -progress * 6;
    camera.rotation.z = Math.sin(progress * Math.PI) * 0.03;
    camera.position.x = Math.sin(t * 0.1) * 0.4;

    // Drift + sway leaves for a living, breathing forest
    leaves.forEach(function (l) {
      l.mesh.position.y -= l.driftSpeed * 0.02;
      l.mesh.position.x = l.baseX + Math.sin(t * l.swaySpeed + l.swayOffset) * 0.6;
      l.mesh.material.rotation += l.rotSpeed;
      if (l.mesh.position.y < -40) {
        l.mesh.position.y = 40;
      }
    });

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ================= GSAP scroll reveals (3D tilt-in) ================= */
  function initReveals() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.reveal').forEach(function (el, i) {
      gsap.fromTo(
        el,
        { opacity: 0, z: -220, rotationX: 18, y: 40 },
        {
          opacity: 1, z: 0, rotationX: 0, y: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
  }
})();
