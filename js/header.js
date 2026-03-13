// /js/header.js
(function () {
  function safe(fn) {
    try { fn(); } catch (e) { console.error("[CBEL] header.js error:", e); }
  }

  function ensureHeaderMount() {
    let mount = document.getElementById("site-header");
    if (!mount) {
      mount = document.createElement("header");
      mount.id = "site-header";
      document.body.prepend(mount);
    }
    return mount;
  }

  function normalizePath(p) {
    // Treat /vault and /vault/ the same, etc.
    if (!p) return "/";
    return p.endsWith("/") ? p : (p + "/");
  }

  function isActive(targetPath) {
    const here = normalizePath(window.location.pathname);
    const target = normalizePath(targetPath);

    if (target === "/") return here === "/";
    return here.startsWith(target);
  }

  function navClass(path) {
    return isActive(path)
      ? "px-4 py-2 rounded-full bg-white/10 text-white"
      : "px-4 py-2 rounded-full text-base text-slate-200 hover:bg-white/10 hover:text-white";
  }

  function mobileLinkClass(path) {
    return isActive(path)
      ? "rounded-2xl px-4 py-3 bg-white/10 text-white"
      : "rounded-2xl px-4 py-3 hover:bg-white/10";
  }

  function renderHeader() {
    const mount = ensureHeaderMount();

    mount.innerHTML = `
<header class="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur">
  <div class="mx-auto max-w-6xl px-4">
    <div class="flex items-center justify-between gap-3 py-4">
      <!-- Brand -->
      <a href="/" class="flex items-center gap-3">
        <img src="/assets/logo-circle.png" alt="CBEL logo" class="h-11 w-11 rounded-full shadow" />
        <div class="leading-tight">
          <div class="text-lg sm:text-xl font-semibold tracking-tight">
            California Bitcoin Education Lab
          </div>
          <div class="text-xs sm:text-sm text-slate-300">
            Bitcoin-only education for the Golden State
          </div>
        </div>
      </a>

      <!-- Desktop pill nav -->
      <nav class="hidden lg:flex items-center">
        <div class="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-2">
          <a href="/about" class="${navClass("/about/")}">About</a>

          <a href="/vault/" class="${navClass("/vault/")}">
            Bitcoin Library
          </a>

          <a href="/contact" class="${navClass("/contact/")}">Contact</a>

          <!-- Tip button -->
          <a href="/tip"
             class="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full ${
               isActive("/tip/") ? "bg-[#f7931a] text-black" : "bg-[#f7931a] text-black"
             } text-xl font-semibold hover:brightness-105"
             aria-label="Tip">
            ₿
          </a>
        </div>
      </nav>

      <!-- Mobile menu button -->
      <button id="menuBtn"
              class="lg:hidden inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10"
              aria-label="Open menu"
              aria-expanded="false">
        <span class="text-sm font-semibold text-slate-200">Menu</span>
      </button>
    </div>

    <!-- Mobile nav -->
    <div id="mobileNav" class="lg:hidden hidden pb-4">
<div class="rounded-3xl p-4 border border-white/10 bg-white/5 backdrop-blur">
<div class="grid gap-2 text-base text-slate-200">
          <a href="/about" class="${mobileLinkClass("/about/")}">About</a>
          <a href="/vault/" class="${mobileLinkClass("/vault/")}">Bitcoin Library</a>
          <a href="/contact" class="${mobileLinkClass("/contact/")}">Contact</a>

          <a href="/tip" class="rounded-2xl px-4 py-3 bg-[#f7931a] text-black">
            <span class="font-normal text-[0.95em] align-[0.02em]">₿</span>
            <span class="font-semibold"> Tip</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</header>
    `;

    // Mobile menu toggle (scoped to injected header)
    const btn = document.getElementById("menuBtn");
    const nav = document.getElementById("mobileNav");
    if (btn && nav) {
      btn.addEventListener("click", () => {
        const willOpen = nav.classList.contains("hidden");
        nav.classList.toggle("hidden");
        btn.setAttribute("aria-expanded", String(willOpen));
      });
    }
  }

  function boot() {
    safe(renderHeader);
    // Retry once in case something weird loads out of order
    setTimeout(() => safe(renderHeader), 150);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
