// /js/article.js
(function () {
  function safe(fn) {
    try { fn(); } catch (e) { console.error("[CBEL] article.js error:", e); }
  }

  function readConfig() {
    const el = document.getElementById("article-config");
    if (!el) return null;
    try { return JSON.parse(el.textContent || "{}"); }
    catch (e) { console.error("[CBEL] article-config JSON parse error:", e); return null; }
  }

  function buildRail(cfg) {
    const nav = document.querySelector(".article-rail-nav");
    if (!nav || !cfg || !Array.isArray(cfg.rail)) return;

    nav.innerHTML = cfg.rail
      .map(item => `<a href="#${item.id}">${item.label}</a>`)
      .join("");
  }

  function wireActiveHighlight(cfg) {
    const nav = document.querySelector(".article-rail-nav");
    if (!nav) return;

    const links = Array.from(nav.querySelectorAll("a"));
    if (!links.length) return;

    const targets = links
      .map(a => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);

    const setActive = (id) => {
      links.forEach(a => {
        a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
      });
    };

    const obs = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible && visible.target && visible.target.id) {
        setActive(visible.target.id);
      }
    }, { rootMargin: "-20% 0px -70% 0px", threshold: [0.1, 0.2, 0.4] });

    targets.forEach(t => obs.observe(t));

    // Default active: first rail item
    if (cfg && cfg.rail && cfg.rail[0] && cfg.rail[0].id) {
      setActive(cfg.rail[0].id);
    }
  }

  function boot() {
    const cfg = readConfig();
    safe(() => buildRail(cfg));
    safe(() => wireActiveHighlight(cfg));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
