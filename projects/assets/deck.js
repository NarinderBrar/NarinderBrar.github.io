/* Deck navigation: ← → / PgUp PgDn / Space, Home/End, H = projects, F = fullscreen, T = theme. */
(function () {
  const store = {
    get(k) { try { return localStorage.getItem("deck:" + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem("deck:" + k, v); } catch (e) {} },
  };
  if (/[?&]all\b/.test(location.search)) document.documentElement.classList.add("all");
  const params = new URLSearchParams(location.search);
  const requestedTheme = params.get("theme");
  const saved = store.get("theme");
  if (requestedTheme === "light" || requestedTheme === "dark") {
    document.documentElement.dataset.theme = requestedTheme;
    store.set("theme", requestedTheme);
  } else if (saved) {
    document.documentElement.dataset.theme = saved;
  }

  const deck = document.querySelector(".deck");
  const slides = [...document.querySelectorAll(".slide")];
  const isHome = document.body.dataset.home === "true";
  const only = parseInt(params.get("only") || "", 10);
  if (only) slides.forEach((sl, i) => { if (i !== only - 1) sl.style.display = "none"; });

  const tl = document.createElement("div");
  tl.className = "chrome tl";
  tl.innerHTML = isHome
    ? `<span>Selected projects</span>`
    : `<a href="index.html" title="All projects (H)">← Projects</a>`;
  const tr = document.createElement("div");
  tr.className = "chrome tr";
  tr.innerHTML = `<span id="count"></span><button id="themeBtn" title="Theme (T)">◐</button><button id="fsBtn" title="Fullscreen (F)">⛶</button>`;
  const br = document.createElement("div");
  br.className = "chrome br";
  br.innerHTML = `<button id="prevBtn" title="Previous (←)">↑</button><button id="nextBtn" title="Next (→)">↓</button>`;
  const bar = document.createElement("div");
  bar.className = "progress";
  const hint = document.createElement("div");
  hint.className = "hint";
  hint.textContent = "← → navigate · F fullscreen · T theme" + (isHome ? "" : " · H projects");
  document.body.append(tl, tr, br, bar, hint);

  let current = 0;
  function update(i) {
    current = i;
    document.getElementById("count").textContent = `${i + 1} / ${slides.length}`;
    bar.style.width = `${((i + 1) / slides.length) * 100}%`;
    try { history.replaceState(null, "", `${location.pathname}${location.search}#${i + 1}`); } catch (e) {}
  }
  function go(i) {
    const n = Math.max(0, Math.min(slides.length - 1, i));
    slides[n].scrollIntoView({ behavior: "smooth", block: "start" });
    update(n);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) update(slides.indexOf(e.target)); });
  }, { root: deck, threshold: 0.55 });
  slides.forEach((s) => io.observe(s));

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(k)) { e.preventDefault(); go(current + 1); }
    else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(k)) { e.preventDefault(); go(current - 1); }
    else if (k === "Home") { e.preventDefault(); go(0); }
    else if (k === "End") { e.preventDefault(); go(slides.length - 1); }
    else if ((k === "h" || k === "H" || k === "Escape") && !isHome && !document.fullscreenElement) location.href = "index.html";
    else if (k === "f" || k === "F") toggleFs();
    else if (k === "t" || k === "T") toggleTheme();
  });
  document.getElementById("prevBtn").onclick = () => go(current - 1);
  document.getElementById("nextBtn").onclick = () => go(current + 1);
  document.getElementById("fsBtn").onclick = toggleFs;
  document.getElementById("themeBtn").onclick = toggleTheme;

  function toggleFs() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }
  function toggleTheme() {
    const cur = document.documentElement.dataset.theme ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    store.set("theme", next);
  }

  // Images: swap to a fallback when the preferred screenshot isn't there yet.
  document.querySelectorAll("img[data-fallback]").forEach((img) => {
    const swap = () => { if (img.src.indexOf(img.dataset.fallback) === -1) img.src = img.dataset.fallback; };
    if (img.complete && img.naturalWidth === 0) swap();
    else img.addEventListener("error", swap, { once: true });
  });

  // Project hero images open uncropped in a full-screen viewer.
  const heroImg = document.querySelector(".hero-img");
  if (heroImg) {
    heroImg.tabIndex = 0;
    heroImg.setAttribute("role", "button");
    heroImg.setAttribute("aria-label", `${heroImg.alt || "Project image"} — view full image`);

    const viewer = document.createElement("dialog");
    viewer.className = "image-viewer";
    viewer.setAttribute("aria-label", "Full project image");
    viewer.innerHTML = `<button type="button" aria-label="Close full image">×</button><img alt="">`;
    document.body.append(viewer);

    const fullImg = viewer.querySelector("img");
    const openViewer = () => {
      fullImg.src = heroImg.currentSrc || heroImg.src;
      fullImg.alt = heroImg.alt;
      viewer.showModal();
    };
    heroImg.addEventListener("click", openViewer);
    heroImg.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openViewer(); }
    });
    viewer.querySelector("button").addEventListener("click", () => viewer.close());
    viewer.addEventListener("click", (e) => { if (e.target === viewer) viewer.close(); });
  }

  const start = parseInt((location.hash || "").slice(1), 10);
  if (start > 1 && start <= slides.length) requestAnimationFrame(() => { slides[start - 1].scrollIntoView(); update(start - 1); });
  else update(0);
})();
