const root = document.documentElement;
const body = document.body;
const header = document.querySelector("[data-header]");
const menuButton = document.querySelector(".menu-button");
const navLinks = [...document.querySelectorAll(".nav-links a")];
const progress = document.querySelector(".scroll-progress");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function updateScrollState() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progressValue = max > 0 ? window.scrollY / max : 0;
  progress.style.width = `${progressValue * 100}%`;
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

menuButton.addEventListener("click", () => {
  const open = body.classList.toggle("nav-open");
  menuButton.setAttribute("aria-expanded", String(open));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    body.classList.remove("nav-open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

window.addEventListener("scroll", updateScrollState, { passive: true });
updateScrollState();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.observe(element));

const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const navObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-42% 0px -48% 0px" }
);

sections.forEach((section) => navObserver.observe(section));

if (!reduceMotion) {
  const magneticElements = document.querySelectorAll(".button");
  magneticElements.forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
      element.style.setProperty("--button-x", `${x}px`);
      element.style.setProperty("--button-y", `${y}px`);
    });

    element.addEventListener("pointerleave", () => {
      element.style.setProperty("--button-x", "0px");
      element.style.setProperty("--button-y", "0px");
    });
  });

  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) translateY(-4px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

function createNeuralCanvas() {
  const canvas = document.getElementById("neuralCanvas");
  if (!canvas || reduceMotion) return;

  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let deviceScale = 1;
  let points = [];
  let animationFrame = 0;
  const pointer = { x: 0.62, y: 0.42, active: false };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    deviceScale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * deviceScale);
    canvas.height = Math.floor(height * deviceScale);
    context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);

    const count = Math.min(96, Math.max(44, Math.floor(width / 18)));
    points = Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2;
      const ring = 0.18 + (index % 9) * 0.044;
      return {
        x: width * (0.66 + Math.cos(angle) * ring * 0.65) + Math.random() * 80 - 40,
        y: height * (0.46 + Math.sin(angle) * ring) + Math.random() * 80 - 40,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        size: 1.2 + Math.random() * 2.4,
        hue: index % 4,
      };
    });
  }

  function drawRetinaPulse(time) {
    const cx = width * 0.66;
    const cy = height * 0.46;
    const maxRadius = Math.min(width, height) * 0.34;
    context.save();
    context.globalCompositeOperation = "screen";
    for (let i = 0; i < 5; i += 1) {
      const pulse = ((time * 0.00012 + i / 5) % 1) * maxRadius;
      context.beginPath();
      context.ellipse(cx, cy, pulse * 1.18, pulse * 0.82, -0.08, 0, Math.PI * 2);
      context.strokeStyle = `rgba(${i % 2 ? "255, 209, 102" : "66, 234, 212"}, ${0.18 * (1 - pulse / maxRadius)})`;
      context.lineWidth = 1;
      context.stroke();
    }
    context.restore();
  }

  function draw(time) {
    context.clearRect(0, 0, width, height);
    drawRetinaPulse(time);

    points.forEach((point) => {
      const dx = pointer.active ? pointer.x * width - point.x : width * 0.66 - point.x;
      const dy = pointer.active ? pointer.y * height - point.y : height * 0.46 - point.y;
      const distance = Math.hypot(dx, dy);
      const pull = Math.max(0, 1 - distance / 440) * 0.018;
      point.vx += dx * pull * 0.01;
      point.vy += dy * pull * 0.01;
      point.vx *= 0.985;
      point.vy *= 0.985;
      point.x += point.vx;
      point.y += point.vy;

      if (point.x < 0 || point.x > width) point.vx *= -1;
      if (point.y < 0 || point.y > height) point.vy *= -1;
    });

    context.save();
    context.globalCompositeOperation = "lighter";
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i];
        const b = points[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > 112) continue;
        const opacity = (1 - distance / 112) * 0.3;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.strokeStyle = `rgba(66, 234, 212, ${opacity})`;
        context.lineWidth = 0.85;
        context.stroke();
      }
    }

    points.forEach((point) => {
      const palette = point.hue === 0 ? "66, 234, 212" : point.hue === 1 ? "255, 209, 102" : point.hue === 2 ? "255, 107, 53" : "158, 240, 26";
      context.beginPath();
      context.arc(point.x, point.y, point.size, 0, Math.PI * 2);
      context.fillStyle = `rgba(${palette}, 0.72)`;
      context.shadowColor = `rgba(${palette}, 0.45)`;
      context.shadowBlur = 16;
      context.fill();
    });
    context.restore();

    animationFrame = requestAnimationFrame(draw);
  }

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width;
    pointer.y = (event.clientY - rect.top) / rect.height;
    pointer.active = true;
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  window.addEventListener("resize", resize);
  resize();
  animationFrame = requestAnimationFrame(draw);

  return () => cancelAnimationFrame(animationFrame);
}

createNeuralCanvas();
