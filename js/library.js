// /js/library.js — Content Vault only
// - No big CTA badges; whole card is clickable
// - Mode toggle removed entirely
// - Disabled items render as non-clickable cards
// - For podcast/watch placeholders, falls back to href/url instead of disabling
// - Includes "Built in California" footer badge helper (safe + no duplicates)

(function () {
  const DATA_PATH = document.body?.dataset?.source || "/content/content-vault.json";

  // Placeholder images
  const FALLBACK_PLACEHOLDER = "/assets/covers/placeholder-512.jpg";
  const PODCAST_PLACEHOLDER = "/assets/covers/placeholder/podcast.webp";
  const ARTICLE_PLACEHOLDER = "/assets/covers/placeholder/article.webp";
  const BOOK_PLACEHOLDER = "/assets/covers/placeholder/book.webp";

  const cardsEl = document.getElementById("cards");
  const searchEl = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearBtn");
  const tagBarEl = document.getElementById("tagBar");
  const resultCountEl = document.getElementById("resultCount");
  const typeTabsEl = document.getElementById("typeTabs");

  // ---------- Shared Footer Helper (Built in California) ----------
  function injectBuiltInCaliforniaBadge(intoEl) {
    if (!intoEl) return;
    if (intoEl.querySelector('[data-built-ca-badge="true"]')) return;

    const badge = document.createElement("div");
    badge.setAttribute("data-built-ca-badge", "true");
    badge.className =
      "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] tracking-[0.14em] uppercase text-slate-400/90";
    badge.innerHTML = `
      <span class="h-1.5 w-1.5 rounded-full bg-[#f7931a]"></span>
      Built in California
    `.trim();

    intoEl.appendChild(badge);
  }

  function renderSiteFooterIfPresent() {
    const mount = document.getElementById("site-footer");
    if (mount) {
      if (mount.getAttribute("data-rendered") === "true") return;

      mount.innerHTML = `
        <div class="container">
          <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:flex-start;">
            <div style="display:flex; flex-direction:column; gap:8px;">
              <div>© <span id="year"></span> California Bitcoin Education Lab</div>
              <div id="builtCaMount"></div>
            </div>
            <div style="opacity:.8;">Deep black • Bitcoin orange</div>
          </div>
        </div>
      `.trim();

      mount.classList.add("footer");
      mount.setAttribute("data-rendered", "true");

      const yearEl = mount.querySelector("#year");
      if (yearEl) yearEl.textContent = String(new Date().getFullYear());

      injectBuiltInCaliforniaBadge(mount.querySelector("#builtCaMount"));
      return;
    }

    const existingFooter = document.querySelector("footer.footer");
    if (existingFooter) {
      const leftCol =
        existingFooter.querySelector('div[style*="flex-direction:column"]') ||
        existingFooter.querySelector(".container") ||
        existingFooter;

      injectBuiltInCaliforniaBadge(leftCol);
    }
  }
  // ---------------------------------------------------------------

  renderSiteFooterIfPresent();

  if (!cardsEl) return;

  let allItems = [];

  // Filters
  let selectedType = "all"; // all | podcast | book | article
  let selectedTag = "";
  let query = "";

  const THOUGHT_LEADERS_TAG = "thought leaders";

  // Tags we never want to show as visible content tags
  const BANNED_TAGS = new Set([
    "podcast", "podcasts",
    "book", "books",
    "article", "articles",
    "listen", "watch",
    "open", "read",
    "video", "audio"
  ]);

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function norm(s) {
    return String(s ?? "").toLowerCase().trim();
  }

  function uniq(arr) {
    return Array.from(new Set(arr));
  }

  function pickUrl(...vals) {
    for (const v of vals) {
      const s = String(v ?? "").trim();
      if (s) return s;
    }
    return null;
  }

  async function loadJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return await res.json();
  }

  function unwrapItems(json) {
    if (Array.isArray(json)) return json;
    if (json && Array.isArray(json.items)) return json.items;
    return [];
  }

  function getAllTags(item) {
    const foundations = Array.isArray(item.foundations) ? item.foundations : [];
    const using = Array.isArray(item.using) ? item.using : [];
    const level = item.level ? [item.level] : [];
    const legacy = Array.isArray(item.tags) ? item.tags : [];

    const tags = [...foundations, ...using, ...level, ...legacy];

    const isThoughtLeader =
      Boolean(item.thoughtLeaderBookId) || item.thoughtLeader === true;

    if (isThoughtLeader) tags.push(THOUGHT_LEADERS_TAG);

    return uniq(
      tags.map((t) => String(t).trim()).filter(Boolean)
    ).filter((t) => !BANNED_TAGS.has(norm(t)));
  }

  function computeLink(item) {
    if (item.type === "podcast") {
      if (item.mode === "listen") {
        const url = pickUrl(item.href, item.url);
        return { url, disabled: !url };
      }

      if (item.mode === "watch") {
        const youtubeOk =
          Boolean(item.youtubeId) &&
          item.youtubeId !== "REPLACE_WITH_VIDEO_ID";

        if (youtubeOk) {
          return {
            url: `https://www.youtube.com/watch?v=${item.youtubeId}`,
            disabled: false
          };
        }

        const url = pickUrl(item.href, item.url);
        return { url, disabled: !url };
      }

      const url = pickUrl(item.href, item.url);
      return { url, disabled: !url };
    }

    if (item.type === "book") {
      const url = pickUrl(item.buy, item.url, item.href);
      return { url, disabled: !url };
    }

    if (item.type === "article") {
      const url = pickUrl(item.url, item.href);
      return { url, disabled: !url };
    }

    const url = pickUrl(item.href, item.url);
    return { url, disabled: !url };
  }

  function renderTypeTabs(types) {
    if (!typeTabsEl) return;

    const pretty = (t) => {
      if (t === "all") return "All";
      if (t === "podcast") return "Podcasts";
      if (t === "book") return "Books";
      if (t === "article") return "Articles";
      return t;
    };

    const ordered = ["all", "podcast", "book", "article"].filter(
      (t) => t === "all" || types.includes(t)
    );

    typeTabsEl.innerHTML = `
      <div class="tabs">
        ${ordered.map((t) => `
          <button class="tab ${selectedType === t ? "active" : ""}" type="button" data-type="${escapeAttr(t)}">
            ${escapeHtml(pretty(t))}
          </button>
        `).join("")}
      </div>
    `;

    typeTabsEl.querySelectorAll("button[data-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedType = btn.getAttribute("data-type") || "all";
        renderAll();
      });
    });
  }

  function renderTagBar(tags) {
    if (!tagBarEl) return;

    tagBarEl.innerHTML = `
      <button class="pill ${selectedTag ? "" : "active"}" type="button" data-tag="">All</button>
      ${tags.map((t) => `
        <button class="pill ${selectedTag === t ? "active" : ""}" type="button" data-tag="${escapeAttr(t)}">
          ${escapeHtml(t)}
        </button>
      `).join("")}
    `;

    tagBarEl.querySelectorAll("button[data-tag]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedTag = btn.getAttribute("data-tag") || "";
        renderAll();
      });
    });
  }

  function resolveThumb(item) {
    const explicit = String(item.thumb || item.image || "").trim();
    if (explicit) return explicit;

    if (item.type === "podcast") return PODCAST_PLACEHOLDER;
    if (item.type === "article") return ARTICLE_PLACEHOLDER;
    if (item.type === "book") return BOOK_PLACEHOLDER;

    return FALLBACK_PLACEHOLDER;
  }

  function buildSrcset(url) {
    const u = String(url || "");
    const isKnown =
      u.endsWith("/assets/covers/placeholder/podcast.webp") ||
      u.endsWith("/assets/covers/placeholder/book.webp") ||
      u.endsWith("/assets/covers/placeholder/article.webp");

    if (!isKnown) return "";
    return `${u} 1x, ${u.replace(".webp", "@2x.webp")} 2x`;
  }

  function cardHtml(item) {
    const titleText = item.title || "Untitled";
    const title = escapeHtml(titleText);
    const desc = escapeHtml(item.subtitle || item.description || "");

    const thumbRaw = resolveThumb(item);
    const thumb = escapeAttr(thumbRaw);
    const srcset = escapeAttr(buildSrcset(thumbRaw));

    const tags = getAllTags(item);
    const { url, disabled } = computeLink(item);

    const tagsHtml = tags.length
      ? `
        <div class="pills" aria-label="tags">
          ${tags.map((t) => `
            <button class="pill" type="button" data-inline-tag="${escapeAttr(t)}">
              ${escapeHtml(t)}
            </button>
          `).join("")}
        </div>
      `
      : "";

    const imgTag = `
      <img
        src="${thumb}"
        ${srcset ? `srcset="${srcset}"` : ""}
        sizes="200px"
        width="500"
        height="700"
        alt="${escapeAttr(titleText)} cover"
        loading="lazy"
        onerror="this.onerror=null; this.src='${escapeAttr(FALLBACK_PLACEHOLDER)}';"
        style="object-fit:cover; width:100%; height:100%; display:block;"
      />
    `;

    if (disabled) {
      return `
        <div class="card disabled" aria-disabled="true">
          <div class="cover">${imgTag}</div>
          <div class="card-body">
            <div class="card-title">${title}</div>
            ${desc ? `<div class="card-desc">${desc}</div>` : ""}
            ${tagsHtml}
          </div>
        </div>
      `;
    }

    const isExternal = /^https?:\/\//i.test(url || "");
    const linkAttrs = isExternal ? `target="_blank" rel="noopener noreferrer"` : "";

    return `
      <a class="card" href="${escapeAttr(url)}" ${linkAttrs}>
        <div class="cover">${imgTag}</div>
        <div class="card-body">
          <div class="card-title">${title}</div>
          ${desc ? `<div class="card-desc">${desc}</div>` : ""}
          ${tagsHtml}
        </div>
      </a>
    `;
  }

  function matchesFilters(item) {
    const q = norm(query);
    const tag = norm(selectedTag);

    const matchesType =
      selectedType === "all" || item.type === selectedType;

    const allTags = getAllTags(item);

    const hay = norm([
      item.title,
      item.subtitle || item.description,
      allTags.join(" "),
      item.type,
      item.mode
    ].join(" "));

    const matchesQuery = !q || hay.includes(q);
    const matchesTag = !tag || allTags.some((t) => norm(t) === tag);

    return matchesType && matchesQuery && matchesTag;
  }

  function renderAll() {
    const types = uniq(allItems.map((i) => i.type).filter(Boolean));
    renderTypeTabs(types);

    const tags = uniq(
      allItems.flatMap((i) => getAllTags(i)).filter(Boolean)
    )
      .map((t) => String(t).trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    renderTagBar(tags);

    const filtered = allItems.filter(matchesFilters);

    filtered.sort((a, b) =>
      String(a.title || "").localeCompare(String(b.title || ""))
    );

    cardsEl.innerHTML =
      filtered.map(cardHtml).join("") ||
      `
        <div class="block pad" style="grid-column: 1 / -1;">
          <div style="color: rgba(255,255,255,.75); font-weight:650; margin-bottom:8px;">No results</div>
          <div style="color: rgba(255,255,255,.62);">Try clearing filters or searching for something else.</div>
        </div>
      `;

    if (resultCountEl) resultCountEl.textContent = String(filtered.length);

    cardsEl.querySelectorAll("button[data-inline-tag]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectedTag = btn.getAttribute("data-inline-tag") || "";
        document.getElementById("controls")?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
        renderAll();
      });
    });
  }

  async function init() {
    const json = await loadJson(DATA_PATH);
    allItems = unwrapItems(json);

    allItems = allItems.map((it) => ({
      id: it.id,
      type: it.type || "other",
      title: it.title || "Untitled",
      subtitle: it.subtitle ?? it.description ?? "",
      description: it.description ?? "",

      foundations: Array.isArray(it.foundations) ? it.foundations : [],
      using: Array.isArray(it.using) ? it.using : [],
      level: it.level || "",
      thoughtLeaderBookId: it.thoughtLeaderBookId || "",
      thoughtLeader: it.thoughtLeader === true,

      tags: Array.isArray(it.tags) ? it.tags : [],

      thumb: it.thumb || it.image || "",
      image: it.image || "",
      href: it.href || "",
      url: it.url || "",
      buy: it.buy || "",
      mode: it.mode || "",
      youtubeId: it.youtubeId || ""
    }));

    renderAll();
  }

  if (searchEl) {
    searchEl.addEventListener("input", () => {
      query = searchEl.value || "";
      renderAll();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      query = "";
      selectedTag = "";
      selectedType = "all";
      if (searchEl) searchEl.value = "";
      renderAll();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderSiteFooterIfPresent();

    init().catch((err) => {
      console.error(err);

      if (cardsEl) {
        cardsEl.innerHTML = `
          <div class="block pad" style="grid-column: 1 / -1;">
            <div style="font-weight:700; margin-bottom:8px;">Couldn’t load content</div>
            <div style="color: rgba(255,255,255,.62);">
              Check that <code>${escapeHtml(DATA_PATH)}</code> exists and returns valid JSON.
            </div>
          </div>
        `;
      }

      if (resultCountEl) resultCountEl.textContent = "0";
    });
  });
})();
