// /js/tip.js
(function () {
  const $ = (sel) => document.querySelector(sel);

  async function loadTipData() {
    const res = await fetch("/data/tip.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load /data/tip.json");
    return await res.json();
  }

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value || "";
  }

  function setHref(id, value) {
    const el = $(id);
    if (el && value) el.setAttribute("href", value);
  }

  function escapeHtml(str) {
    return (str ?? "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    }
  }

  async function init() {
    const data = await loadTipData();

    setText("#tipTitle", data.title);
    setText("#tipIntro", data.intro);
    setText("#lnAddress", data.lightningAddress);
    setText("#tipNote", data.note);
    setText("#safetyNote", data.safetyNote);

    // Wallet links
    const linksWrap = $("#walletLinks");
    if (linksWrap && Array.isArray(data.walletLinks)) {
      linksWrap.innerHTML = data.walletLinks.map(l =>
        `<a class="rounded-2xl px-4 py-3 bg-white/5 border-2 border-[#f7931a]/25 hover:border-[#f7931a]/45 transition"
            href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`
      ).join("");
    }

    // What the QR should encode:
    // - Most wallets accept "lightning:<address>" nicely.
    const qrValue = data.lightningUrl || ("lightning:" + data.lightningAddress);
    // Show "Open Wallet" button if we have a lightning: link
const openWalletBtn = document.querySelector("#openWalletBtn");
if (openWalletBtn && qrValue) {
  openWalletBtn.setAttribute("href", qrValue);
  openWalletBtn.classList.remove("hidden");
}

    // Render QR (requires QRCode library loaded in the page)
    const qrTarget = $("#qr");
    qrTarget.innerHTML = ""; // clear placeholder
    new QRCode(qrTarget, {
      text: qrValue,
      width: 220,
      height: 220,
      correctLevel: QRCode.CorrectLevel.M
    });

    // Copy button
    const copyBtn = $("#copyBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const ok = await copyToClipboard(data.lightningAddress);
        copyBtn.textContent = ok ? "Copied" : "Copy failed";
        setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((err) => {
      console.error(err);
      const errBox = $("#errorBox");
      if (errBox) errBox.classList.remove("hidden");
    });
  });
})();
