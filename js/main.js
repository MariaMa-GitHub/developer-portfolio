(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isTypingTarget(el) {
    if (!el || el.nodeType !== 1) return false;
    const tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    return Boolean(el.isContentEditable);
  }

  /* ---- Subtle blob parallax ---- */
  const blobs = document.querySelector(".deco-blobs");
  if (blobs && !prefersReducedMotion) {
    window.addEventListener(
      "mousemove",
      (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 24;
        const y = (e.clientY / window.innerHeight - 0.5) * 24;
        blobs.style.transform = `translate(${x}px, ${y}px)`;
      },
      { passive: true }
    );
  }

  /* ---- Magnetic targets ---- */
  if (!prefersReducedMotion) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * 0.14}px, ${y * 0.14}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ---- Project cards: tilt (desktop, not when filtered dimmed) ---- */
  document.querySelectorAll(".project-panel").forEach((card) => {
    if (prefersReducedMotion) return;
    card.addEventListener("mousemove", (e) => {
      if (card.classList.contains("dimmed")) return;
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const midX = r.width / 2;
      const midY = r.height / 2;
      const rotateX = ((y - midY) / midY) * -5;
      const rotateY = ((x - midX) / midX) * 6;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1)`;
    });
    card.addEventListener("mouseleave", () => {
      if (card.classList.contains("dimmed")) return;
      card.style.transform = "";
    });
  });

  /* ---- Stack / tech filter ---- */
  const panels = [...document.querySelectorAll(".project-panel")];
  const chips = [...document.querySelectorAll(".stack-chip")];
  let activeFilter = null;

  function applyStackFilter(filter) {
    panels.forEach((p) => {
      p.style.transform = "";
    });
    const matches = panels.filter((p) =>
      (p.dataset.tech || "").split(/\s+/).includes(filter)
    );
    if (matches.length === 0) {
      panels.forEach((p) => p.classList.remove("dimmed"));
      return false;
    }
    panels.forEach((p) => {
      const tech = (p.dataset.tech || "").split(/\s+/);
      p.classList.toggle("dimmed", !tech.includes(filter));
    });
    return true;
  }

  function clearStackFilter() {
    activeFilter = null;
    chips.forEach((c) => c.classList.remove("is-active"));
    panels.forEach((p) => {
      p.classList.remove("dimmed");
      p.style.transform = "";
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const f = chip.dataset.filter;
      if (!f) return;
      if (activeFilter === f) {
        clearStackFilter();
        return;
      }
      if (!applyStackFilter(f)) return;
      activeFilter = f;
      chips.forEach((c) => c.classList.toggle("is-active", c.dataset.filter === f));
    });
  });

  /* ---- Command palette ---- */
  const palette = document.getElementById("palette");
  const overlay = document.getElementById("palette-overlay");
  const paletteInput = document.getElementById("palette-input");
  const paletteList = document.getElementById("palette-list");
  const openBtn = document.getElementById("palette-open-btn");

  const actions = [
    {
      id: "projects",
      label: "Go to projects",
      meta: "Section",
      keys: "builds shipped portfolio",
      run: () => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      id: "tools",
      label: "Go to tools & tech",
      meta: "Section",
      keys: "stack skills logos languages",
      run: () => document.getElementById("tools")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      id: "focus",
      label: "Go to focus areas",
      meta: "Section",
      keys: "interests web games ml fullstack",
      run: () => document.getElementById("focus")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      id: "education",
      label: "Go to education",
      meta: "Section",
      keys: "school degree university",
      run: () => document.getElementById("education")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      id: "work",
      label: "Go to work",
      meta: "Section",
      keys: "jobs experience employment",
      run: () => document.getElementById("work")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      id: "contact",
      label: "Go to contact",
      meta: "Section",
      keys: "hello hire email hi",
      run: () => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    },
    {
      id: "github",
      label: "Open GitHub profile",
      meta: "Link",
      keys: "code repos",
      run: () => window.open("https://github.com/MariaMa-GitHub", "_blank", "noopener,noreferrer"),
    },
    {
      id: "linkedin",
      label: "Open LinkedIn",
      meta: "Link",
      keys: "network",
      run: () => window.open("https://www.linkedin.com/in/maria-shurui-ma", "_blank", "noopener,noreferrer"),
    },
  ];

  let paletteActive = 0;
  let filteredActions = [...actions];

  function setPaletteOpen(open) {
    if (!palette || !overlay) return;
    palette.hidden = !open;
    overlay.hidden = !open;
    document.body.classList.toggle("palette-open", open);
    palette.setAttribute("aria-hidden", open ? "false" : "true");
    overlay.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) {
      paletteActive = 0;
      if (paletteInput) {
        paletteInput.value = "";
        paletteInput.focus();
      }
      filterPalette("");
    } else if (paletteInput) {
      paletteInput.blur();
    }
  }

  function filterPalette(q) {
    const query = (q || "").trim().toLowerCase();
    filteredActions = actions.filter((a) => {
      if (!query) return true;
      const hay = `${a.label} ${a.keys}`.toLowerCase();
      return hay.includes(query);
    });
    paletteActive = Math.min(paletteActive, Math.max(0, filteredActions.length - 1));
    renderPaletteList();
  }

  function renderPaletteList() {
    if (!paletteList) return;
    paletteList.innerHTML = "";
    if (filteredActions.length === 0) {
      const li = document.createElement("li");
      li.className = "palette-empty";
      li.textContent = "No matches — try another word.";
      paletteList.appendChild(li);
      return;
    }
    filteredActions.forEach((a, i) => {
      const li = document.createElement("li");
      li.className = "palette-item" + (i === paletteActive ? " is-active" : "");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", i === paletteActive ? "true" : "false");
      li.innerHTML = `<span class="palette-item-label">${escapeHtml(a.label)}</span><span class="palette-item-meta">${escapeHtml(a.meta)}</span>`;
      li.addEventListener("mousedown", (e) => e.preventDefault());
      li.addEventListener("click", () => runPaletteAction(i));
      paletteList.appendChild(li);
    });
    paletteList.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function runPaletteAction(index) {
    const a = filteredActions[index];
    if (!a) return;
    const fn = a.run;
    setPaletteOpen(false);
    Promise.resolve(fn()).catch(() => {});
  }

  openBtn?.addEventListener("click", () => setPaletteOpen(true));
  document.getElementById("palette-open-mobile")?.addEventListener("click", () => {
    setPaletteOpen(true);
    document.querySelector(".nav-toggle")?.setAttribute("aria-expanded", "false");
    document.querySelector(".nav-links")?.classList.remove("open");
  });
  overlay?.addEventListener("click", () => setPaletteOpen(false));

  paletteInput?.addEventListener("input", () => {
    paletteActive = 0;
    filterPalette(paletteInput.value);
  });

  paletteInput?.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      paletteActive = Math.min(paletteActive + 1, filteredActions.length - 1);
      renderPaletteList();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      paletteActive = Math.max(paletteActive - 1, 0);
      renderPaletteList();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredActions.length) runPaletteAction(paletteActive);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setPaletteOpen(false);
    }
  });

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (palette && !palette.hidden) {
        setPaletteOpen(false);
        return;
      }
      if (!isTypingTarget(e.target)) setPaletteOpen(true);
      return;
    }
    if (palette && !palette.hidden) return;
    if (isTypingTarget(e.target)) return;
    if (e.key === "/") {
      e.preventDefault();
      setPaletteOpen(true);
    }
  });

  /* ---- Nav scroll spy + mobile menu ---- */
  const navLinks = document.querySelectorAll(".nav-links a[data-section]");
  const sectionEls = [...navLinks]
    .map((a) => document.getElementById(a.dataset.section))
    .filter(Boolean);

  function updateActiveNav() {
    const scrollY = window.scrollY + 110;
    let current = sectionEls[0]?.id;
    for (const sec of sectionEls) {
      if (sec.offsetTop <= scrollY) current = sec.id;
    }
    navLinks.forEach((a) => {
      a.classList.toggle("active", a.dataset.section === current);
    });
  }

  window.addEventListener("scroll", updateActiveNav, { passive: true });
  updateActiveNav();

  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-links");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", !open);
      menu.classList.toggle("open", !open);
    });
    menu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("open");
      });
    });
  }

  /* ---- Reveal on scroll ---- */
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) en.target.classList.add("visible");
        });
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.05 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

})();
