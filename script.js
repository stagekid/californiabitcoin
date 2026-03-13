// /js/script.js
(function () {
  function safe(fn) {
    try { fn(); } catch (e) { console.error("[CBEL] script.js error:", e); }
  }

  function ensureFooterMount() {
    let mount = document.getElementById("site-footer");
    if (!mount) {
      // If a page forgot the mount, create it automatically
      mount = document.createElement("footer");
      mount.id = "site-footer";
      document.body.appendChild(mount);
    }
    return mount;
  }

  function renderFooter() {
    const mount = ensureFooterMount();

    // Force it visible (in case CSS hides footer elements)
    mount.style.display = "block";

    mount.className = "py-10 text-sm text-slate-400";

    mount.innerHTML = `
      <div class="mx-auto max-w-6xl px-4">
        <div class="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

          <div class="flex flex-col gap-2">
            <div>© <span id="year"></span> California Bitcoin Education Lab</div>
            <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] tracking-[0.14em] uppercase text-slate-400/90">
              <span class="h-1.5 w-1.5 rounded-full bg-[#f7931a]"></span>
              Built in California
            </div>
          </div>

          <div class="flex items-center gap-2">
            ${socialBtn("https://x.com/CABitcoinLab", "X", iconX())}
            ${socialBtn("https://instagram.com/CABitcoinLab", "Instagram", iconInstagram())}
            ${socialBtn("https://tiktok.com/@CABitcoinLab", "TikTok", iconTikTok())}
            ${socialBtn("https://youtube.com/@CABitcoinLab", "YouTube", iconYouTube())}
          </div>

        </div>
      </div>
    `;

    const yearEl = mount.querySelector("#year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    console.log("[CBEL] Footer rendered ✅");
  }

  function socialBtn(href, label, svg) {
    return `
      <a href="${href}" target="_blank" rel="noopener noreferrer"
         aria-label="${label}" title="${label}"
         class="inline-flex items-center justify-center h-10 w-10 rounded-full
                border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition">
        <span class="sr-only">${label}</span>
        ${svg}
      </a>
    `;
  }

  function iconX() {
    return `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M18.9 2H22l-6.8 7.8L23 22h-6.8l-5.3-6.5L5.2 22H2l7.3-8.4L1 2h6.9l4.8 6.1L18.9 2zm-1.2 18h1.7L7 3.9H5.2L17.7 20z"/>
    </svg>`;
  }

  function iconInstagram() {
    return `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 4.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5zm0 2A1.5 1.5 0 1 0 13.5 12 1.5 1.5 0 0 0 12 10.5zM17.8 6.2a.8.8 0 1 1-.8-.8.8.8 0 0 1 .8.8z"/>
    </svg>`;
  }

  function iconTikTok() {
    return `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M16 2c.3 2.6 1.8 4.2 4 4.5v3.1c-1.6.1-3.1-.4-4.4-1.3v6.7c0 3.8-3.1 6.9-6.9 6.9S2.8 18.8 2.8 15s3.1-6.9 6.9-6.9c.4 0 .8 0 1.2.1v3.3c-.4-.2-.8-.3-1.2-.3-2 0-3.6 1.6-3.6 3.6s1.6 3.6 3.6 3.6 3.6-1.6 3.6-3.6V2h3.3z"/>
    </svg>`;
  }

  function iconYouTube() {
    return `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5A2.7 2.7 0 0 0 2.4 7.2 28.2 28.2 0 0 0 2 12a28.2 28.2 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28.2 28.2 0 0 0 22 12a28.2 28.2 0 0 0-.4-4.8zM10.2 15.2V8.8l5.5 3.2-5.5 3.2z"/>
    </svg>`;
  }

  // Run after DOM is ready + retry once (covers weird load orders)
  function boot() {
    safe(renderFooter);
    setTimeout(() => safe(renderFooter), 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
