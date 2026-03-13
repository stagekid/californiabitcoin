// /js/script.js
(function () {
  function safe(fn) {
    try { fn(); } catch (e) { console.error("[CBEL] script.js error:", e); }
  }

  // --- Premium, clean icons (Lucide-style stroke SVGs) ---
  const ICON_X = `
    <svg aria-hidden="true" viewBox="0 0 24 24"
      class="h-[18px] w-[18px] transition-transform group-hover:-translate-y-[0.5px]"
      fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 4l16 16" />
      <path d="M20 4L4 20" />
    </svg>
  `;

  const ICON_INSTAGRAM = `
    <svg aria-hidden="true" viewBox="0 0 24 24"
      class="h-[18px] w-[18px] transition-transform group-hover:-translate-y-[0.5px]"
      fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="7" y="7" width="10" height="10" rx="3" />
      <path d="M16.5 7.5h.01" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  `;

  const ICON_TIKTOK = `
    <svg aria-hidden="true" viewBox="0 0 24 24"
      class="h-[18px] w-[18px] transition-transform group-hover:-translate-y-[0.5px]"
      fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 4v10.2a3.8 3.8 0 1 1-3-3.7" />
      <path d="M14 7.2c1.2 1.6 2.8 2.5 5 2.6" />
    </svg>
  `;

  const ICON_YOUTUBE = `
    <svg aria-hidden="true" viewBox="0 0 24 24"
      class="h-[18px] w-[18px] transition-transform group-hover:-translate-y-[0.5px]"
      fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4.5" y="7.5" width="15" height="9" rx="2.5" />
      <path d="M11 10.5l3 1.5-3 1.5z" />
    </svg>
  `;

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

          <div class="flex items-center gap-1.5">
            ${socialBtn("https://x.com/CABitcoinLab", "X", ICON_X)}
            ${socialBtn("https://instagram.com/CABitcoinLab", "Instagram", ICON_INSTAGRAM)}
            ${socialBtn("https://tiktok.com/@CABitcoinLab", "TikTok", ICON_TIKTOK)}
            ${socialBtn("https://youtube.com/@CABitcoinLab", "YouTube", ICON_YOUTUBE)}
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
    <a
      href="${href}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="${label}"
      title="${label}"
      class="
        group
        inline-flex items-center justify-center
        h-9 w-9
        rounded-full
        border border-white/12
        bg-white/5
        text-slate-300

        /* subtle always-on premium halo */
        shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_10px_rgba(247,147,26,0.07)]

        transition-all duration-200 ease-out
        hover:bg-white/10
        hover:text-white
        hover:shadow-[0_0_0_1px_rgba(247,147,26,0.25),0_0_18px_rgba(247,147,26,0.15)]
        focus:outline-none
        focus:ring-2 focus:ring-[#f7931a]/40
      "
    >
      ${svg}
    </a>
  `;
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
