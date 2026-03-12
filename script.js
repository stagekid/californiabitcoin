window.CABTLab = {
  handleSubmit: (e) => {
    e.preventDefault();
    const email = document.querySelector('#email')?.value?.trim();
    if (!email) return false;

    // Placeholder behavior for now:
    alert("Thanks! We'll email you when we launch. ✅");
    e.target.reset();

    // Later: replace this with your ConvertKit/Beehiiv form action
    // or send to a Worker endpoint.
    return false;
  }
};

// -------- Shared Footer (all pages) --------
(function footerInit(){
  const BRAND_NAME = "California Bitcoin Education Lab";
  const COPYRIGHT_YEAR = "2026";

  const SOCIAL = [
    { name: "X", href: "https://x.com/CABitcoinLab", icon: "x" },
    { name: "Instagram", href: "https://instagram.com/CABitcoinLab", icon: "instagram" },
    { name: "TikTok", href: "https://tiktok.com/@CABitcoinLab", icon: "tiktok" },
    { name: "YouTube", href: "https://youtube.com/@CABitcoinLab", icon: "youtube" }
  ];

  function iconSvg(kind) {
    switch (kind) {
      case "x":
        return `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M18.9 2H22l-6.9 7.9L23.5 22h-6.6l-5.2-6.8L5.8 22H2.6l7.4-8.5L.5 2h6.8l4.7 6.2L18.9 2Zm-1.2 18h1.7L7.4 3.9H5.6L17.7 20Z"/>
          </svg>
        `;
      case "instagram":
        return `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.7-.8a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z"/>
          </svg>
        `;
      case "tiktok":
        return `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M16.6 2c.3 2.3 1.6 3.8 3.9 4v3.1c-1.6.1-3.1-.4-4.3-1.3v7c0 3.5-2.9 6.2-6.4 6.2S3.4 18.3 3.4 14.8c0-3.5 2.9-6.3 6.4-6.3.4 0 .8 0 1.2.1v3.4c-.4-.2-.8-.3-1.2-.3-1.6 0-3 1.3-3 3 0 1.6 1.4 3 3 3s3-.9 3-3.2V2h3.8Z"/>
          </svg>
        `;
      case "youtube":
        return `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5A3 3 0 0 0 2.4 7.2 31.6 31.6 0 0 0 2 12a31.6 31.6 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 22 12a31.6 31.6 0 0 0-.4-4.8ZM10.2 15.3V8.7L15.8 12l-5.6 3.3Z"/>
          </svg>
        `;
      default:
        return "";
    }
  }

  function ensureFooterStyles() {
    if (document.getElementById("cab-footer-styles")) return;
    const style = document.createElement("style");
    style.id = "cab-footer-styles";
    style.textContent = `
      .cab-footer{
        padding: 40px 0;
        color: rgba(148,163,184,.92);
        font-size: 14px;
      }
      .cab-footer-inner{
        max-width: 72rem;
        margin: 0 auto;
        padding: 0 16px;
        border-top: 1px solid rgba(255,255,255,.10);
        padding-top: 20px;

        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .cab-footer-left{
        display:flex;
        flex-direction:column;
        gap: 10px;
      }
      .cab-footer-copy{
        color: rgba(148,163,184,.95);
        font-weight: 500;
      }
      .cab-footer-built{
        display:inline-flex;
        align-items:center;
        gap:10px;
        width: fit-content;
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(255,255,255,.05);
        font-size: 11px;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: rgba(148,163,184,.92);
      }
      .cab-dot{
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: #f7931a;
        display:inline-block;
      }
      .cab-footer-right{
        display:flex;
        align-items:center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .cab-social{
        display:inline-flex;
        align-items:center;
        gap: 10px;
        padding: 10px 14px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.04);
        text-decoration: none;
        color: rgba(226,232,240,.90);
        transition: transform .12s ease, background .12s ease, border-color .12s ease, color .12s ease;
      }
      .cab-social:hover{
        background: rgba(255,255,255,.08);
        border-color: rgba(255,255,255,.18);
        color: rgba(255,255,255,.96);
        transform: translateY(-1px);
      }
      .cab-social:focus{
        outline: none;
      }
      .cab-social:focus-visible{
        box-shadow: 0 0 0 2px rgba(247,147,26,.35);
      }
      .cab-ic{
        width: 18px;
        height: 18px;
        display:inline-flex;
        align-items:center;
        justify-content:center;
      }
      .cab-ic svg{
        width: 18px;
        height: 18px;
        display:block;
      }
      .cab-txt{
        font-weight: 600;
        font-size: 13px;
        letter-spacing: .01em;
      }
      @media (max-width: 520px){
        .cab-social{ padding: 10px 12px; }
        .cab-txt{ display:none; } /* icons-only on tiny screens */
      }
    `;
    document.head.appendChild(style);
  }

  function footerHtml() {
    const social = SOCIAL.map(s => `
      <a class="cab-social" href="${s.href}" target="_blank" rel="noopener noreferrer" aria-label="${s.name}">
        <span class="cab-ic">${iconSvg(s.icon)}</span>
        <span class="cab-txt">${s.name}</span>
      </a>
    `).join("");

    return `
      <footer class="cab-footer" role="contentinfo">
        <div class="cab-footer-inner">
          <div class="cab-footer-left">
            <div class="cab-footer-copy">© ${COPYRIGHT_YEAR} ${BRAND_NAME}</div>
            <div class="cab-footer-built">
              <span class="cab-dot" aria-hidden="true"></span>
              Built in California
            </div>
          </div>
          <div class="cab-footer-right" aria-label="Social links">
            ${social}
          </div>
        </div>
      </footer>
    `;
  }

  function mountFooter() {
    ensureFooterStyles();

    // Preferred mount
    const mount = document.getElementById("site-footer");
    if (mount) {
      mount.outerHTML = footerHtml();
      return;
    }

    // Replace existing footer if present
    const existing = document.querySelector("footer");
    if (existing) {
      existing.outerHTML = footerHtml();
      return;
    }

    // Last resort
    document.body.insertAdjacentHTML("beforeend", footerHtml());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountFooter);
  } else {
    mountFooter();
  }
})();

// -------- Existing init --------
(function init(){
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const modeBtn = document.getElementById('modeBtn');
  const saved = localStorage.getItem('cablab_theme');
  if (saved === 'light') document.body.classList.add('light');

  modeBtn?.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('cablab_theme', document.body.classList.contains('light') ? 'light' : 'dark');
  });
})();
