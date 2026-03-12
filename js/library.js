// /js/library.js — Content Vault only (Type + Podcast Mode filter + grouped tags + WebP srcset)
// Change requested: NO author-name tags. Instead, add ONE tag: "thought leaders"
// Rule: any item with a book attached (thoughtLeaderBookId) gets the "thought leaders" tag.
(function () {
  const DATA_PATH = document.body?.dataset?.source || "/content/content-vault.json";

  // Placeholder images (WebP + @2x)
  const FALLBACK_PLACEHOLDER = "/assets/covers/placeholder-512.jpg";
  const PODCAST_PLACEHOLDER = "/assets/covers/placeholder/podcast.webp";
  const ARTICLE_PLACEHOLDER = "/assets/covers/placeholder/article.webp";
  const BOOK_PLACEHOLDER = "/assets/covers/placeholder/book.webp";

  // Optional: add this container in your HTML where you want the mode pills to appear:
  // <div id="modeTabs"></div>
  const modeTabsEl = document.getElementById("modeTabs");

  const cardsEl = document.getElementById("cards");
  const searchEl = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearBtn");
  const tagBarEl = document.getElementById("tagBar");
  const resultCountEl = document.getElementById("resultCount");
  const typeTabsEl = document.getElementById("typeTabs");

  if (!cardsEl) return;

  let allItems = [];

  // Filters
  let selectedType = "all"; // all | podcast | book | article
  let selectedPodcastMode = "all"; // all | listen | watch (only applies when selectedType === "podcast")
  let selectedTag = ""; // unified tag pill selection
  let query = "";

  // Single canonical tag label for this category
  const THOUGHT_LEADERS_TAG = "thought leaders";

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

  function norm(s) { return String(s ?? "").toLowerCase().trim(); }

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

  function uniq(arr) { return Array.from(new Set(arr)); }

  // --- TAG SYSTEM (grouped + legacy support) ---
  // Tags are:
  // - foundations[] (array)
  // - using[] (array)
  // - level (string)
  // - thought leaders (single tag) if thoughtLeaderBookId exists (or thoughtLeader === true)
  // - legacy tags[] (optional, for gradual migration)
  function getAllTags(item) {
    const foundations = Array.isArray(item.foundations) ? item.foundations : [];
    const using = Array.isArray(item.using) ? item.using : [];
    const level = item.level ? [item.level] : [];

    const tags = [
      ...foundations,
      ...using,
      ...level
    ];

    // ✅ Your new rule:
    // If this item has a book attached, give it the "thought leaders" tag.
    // (Also supports a simple boolean if you prefer: thoughtLeader: true)
    const isThoughtLeader = Boolean(item.thoughtLeaderBookId) || item.thoughtLeader === true;
    if (isThoughtLeader) tags.push(THOUGHT_LEADERS_TAG);

    // Legacy support: if content still uses item.tags, include them until you delete that field
    const legacy = Array.isArray(item.tags) ? item.tags : [];
    tags.push(...legacy);

    return uniq(tags.map(t => String(t).trim()).filter(Boolean));
  }

  function computeCta(item) {
    if (item.type === "podcast") {
      if (item.mode === "listen") {
        const url = item.href || null;
        return { label: "Listen", url, disabled: !url };
      }
      if (item.mode === "watch") {
        const placeholder = !item.youtubeId || item.youtubeId === "REPLACE_WITH_VIDEO_ID";
        if (placeholder) return { label: "Watch", url: null, disabled: true };
        return { label: "Watch", url: `https://www.youtube.com/watch?v=${item.youtubeId}`, disabled: false };
      }
    }

    if (item.type === "book") {
      const url = item.buy || item.href || item.url || null;
      return { label: url ? (item.buy ? "Buy" : "Open") : "Info", url, disabled: !url };
    }

    if (item.type === "article") {
      const url = item.url || item.href || null;
      return { label: "Read", url, disabled: !url };
    }

    const url = item.href || item.url || null;
    return { label: "Open", url, disabled: !url };
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

    const ordered = ["all", "podcast", "book", "article"]
      .filter(t => t === "all" || types.includes(t));

    typeTabsEl.innerHTML = `
      <div class="tabs">
        ${ordered.map(t => `
          <button class="tab ${selectedType === t ? "active" : ""}" type="button" data-type="${escapeAttr(t)}">
            ${escapeHtml(pretty(t))}
          </button>
        `).join("")}
      </div>
    `;

    typeTabsEl.querySelectorAll("button[data-type]").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedType = btn.getAttribute("data-type") || "all";

        // Reset podcast mode when leaving podcasts
        if (selectedType !== "podcast") selectedPodcastMode = "all";

        renderAll();
      });
    });
  }

  function renderPodcastModeTabs() {
    if (!modeTabsEl) return;

    // Only show when Podcasts is selected
    if (selectedType !== "podcast") {
      modeTabsEl.innerHTML = "";
      return;
    }

    const options = [
      { key: "all", label: "All" },
      { key: "listen", label: "Listen" },
      { key: "watch", label: "Watch" }
    ];

    modeTabsEl.innerHTML = `
      <div class="tabs">
        ${options.map(o => `
          <button class="tab ${selectedPodcastMode === o.key ? "active" : ""}" type="button" data-mode="${escapeAttr(o.key)}">
            ${escapeHtml(o.label)}
          </button>
        `).join("")}
      </div>
    `;

    modeTabsEl.querySelectorAll("button[data-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedPodcastMode = btn.getAttribute("data-mode") || "all";
        renderAll();
      });
    });
  }

  function renderTagBar(tags) {
    if (!tagBarEl) return;

    tagBarEl.innerHTML = `
      <button class="pill ${selectedTag ? "" : "active"}" type="button" data-tag="">All</button>
      ${tags.map(t => `
        <button class="pill ${selectedTag === t ? "active" : ""}" type="button" data-tag="${escapeAttr(t)}">
          ${escapeHtml(t)}
        </button>
      `).join("")}
    `;

    tagBarEl.querySelectorAll("button[data-tag]").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedTag = btn.getAttribute("data-tag") || "";
        renderAll();
      });
    });
  }

  function resolveThumb(item) {
    const explicit = (item.thumb || item.image || "").toString().trim();
    if (explicit) return explicit;

    if (item.type === "podcast") return PODCAST_PLACEHOLDER;
    if (item.type === "article") return ARTICLE_PLACEHOLDER;
    if (item.type === "book") return BOOK_PLACEHOLDER;

    return FALLBACK_PLACEHOLDER;
  }

  // If url is ".../name.webp", srcset becomes "name.webp 1x, name@2x.webp 2x"
  function buildSrcset(url) {
    const m = String(url || "").match(/^(.*?)(\.[^./]+)$/);
    if (!m) return "";
    const base = m[1];
    const ext = m[2];
    const oneX = `${base}${ext}`;
    const twoX = `${base}@2x${ext}`;
    return `${oneX} 1x, ${twoX} 2x`;
  }

  function cardHtml(item) {
    const titleText = item.title || "Untitled";
    const title = escapeHtml(titleText);
    const desc = escapeHtml(item.subtitle || item.description || "");

    const thumbRaw = resolveThumb(item);
    const thumb = escapeAttr(thumbRaw);
    const srcset = escapeAttr(buildSrcset(thumbRaw));

    const tags = getAllTags(item);
    const cta = computeCta(item);

    const tagsHtml = tags.length ? `
      <div class="pills" aria-label="tags">
        ${tags.map(t => `<button class="pill" type="button" data-inline-tag="${escapeAttr(t)}">${escapeHtml(t)}</button>`).join("")}
      </div>
    ` : "";

    const typePill = item.type ? `<span class="pill subtle">${escapeHtml(item.type)}</span>` : "";
    const modePill = (item.type === "podcast" && item.mode) ? `<span class="pill subtle">${escapeHtml(item.mode)}</span>` : "";

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

    // Disabled CTA: show plain "Watch" (no "(soon)")
    if (cta.disabled) {
      return `
        <div class="card disabled" aria-disabled="true">
          <div class="cover">${imgTag}</div>
          <div class="card-body">
            <div class="card-title">${title}</div>
            ${desc ? `<div class="card-desc">${desc}</div>` : ""}
            ${tagsHtml}
            <div class="card-actions">
              ${typePill}
              ${modePill}
              <button class="btn disabled-cta" type="button" disabled>${escapeHtml(cta.label)}</button>
            </div>
          </div>
        </div>
      `;
    }

    const isExternal = /^https?:\/\//i.test(cta.url || "");
    const linkAttrs = isExternal ? `target="_blank" rel="noopener noreferrer"` : "";

    return `
      <a class="card" href="${escapeAttr(cta.url)}" ${linkAttrs}>
        <div class="cover">${imgTag}</div>
        <div class="card-body">
          <div class="card-title">${title}</div>
          ${desc ? `<div class="card-desc">${desc}</div>` : ""}
          ${tagsHtml}
          <div class="card-actions">
            ${typePill}
            ${modePill}
            <button class="btn" type="button">${escapeHtml(cta.label)}</button>
          </div>
        </div>
      </a>
    `;
  }

  function matchesFilters(item) {
    const q = norm(query);
    const tag = norm(selectedTag);

    const matchesType = (selectedType === "all") || (item.type === selectedType);

    // Podcast mode filter (only when podcasts selected)
    const matchesPodcastMode =
      (selectedType !== "podcast") ||
      (selectedPodcastMode === "all") ||
      (norm(item.mode) === selectedPodcastMode);

    const allTags = getAllTags(item);
    const hay = norm([
      item.title,
      item.subtitle || item.description,
      allTags.join(" "),
      item.type,
      item.mode
    ].join(" "));

    const matchesQuery = !q || hay.includes(q);
    const matchesTag = !tag || allTags.some(t => norm(t) === tag);

    return matchesType && matchesPodcastMode && matchesQuery && matchesTag;
  }

  function renderAll() {
    const types = uniq(allItems.map(i => i.type).filter(Boolean));
    renderTypeTabs(types);
    renderPodcastModeTabs();

    const tags = uniq(allItems.flatMap(i => getAllTags(i)).filter(Boolean))
      .map(t => String(t).trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    renderTagBar(tags);

    const filtered = allItems.filter(matchesFilters);

    filtered.sort((a, b) => {
      // Within podcasts: sort listen before watch (or swap if you prefer)
      if (a.type === "podcast" && b.type === "podcast") {
        const am = a.mode === "watch" ? 1 : 0;
        const bm = b.mode === "watch" ? 1 : 0;
        if (am !== bm) return am - bm;
      }
      return String(a.title || "").localeCompare(String(b.title || ""));
    });

    cardsEl.innerHTML = filtered.map(cardHtml).join("") || `
      <div class="block pad" style="grid-column: 1 / -1;">
        <div style="color: rgba(255,255,255,.75); font-weight:650; margin-bottom:8px;">No results</div>
        <div style="color: rgba(255,255,255,.62);">Try clearing filters or searching for something else.</div>
      </div>
    `;

    if (resultCountEl) resultCountEl.textContent = String(filtered.length);

    // Inline tag clicks
    cardsEl.querySelectorAll("button[data-inline-tag]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        selectedTag = btn.getAttribute("data-inline-tag") || "";
        document.getElementById("controls")?.scrollIntoView({ behavior: "smooth", block: "start" });
        renderAll();
      });
    });
  }

  async function init() {
    const json = await loadJson(DATA_PATH);
    allItems = unwrapItems(json);

    // Normalize items (supports both old "tags" and new grouped fields)
    allItems = allItems.map(it => ({
      id: it.id,
      type: it.type || "other",
      title: it.title || "Untitled",
      subtitle: it.subtitle ?? it.description ?? "",
      description: it.description,

      // New taxonomy (preferred)
      foundations: Array.isArray(it.foundations) ? it.foundations : [],
      using: Array.isArray(it.using) ? it.using : [],
      level: it.level || "",
      // Thought leaders rule uses this:
      thoughtLeaderBookId: it.thoughtLeaderBookId || "", // <- set this on items you want tagged "thought leaders"
      // Optional boolean alternative:
      thoughtLeader: it.thoughtLeader === true,

      // Legacy tags (optional; delete once migrated)
      tags: Array.isArray(it.tags) ? it.tags : [],

      // Media + CTA fields
      thumb: it.thumb || it.image || "",
      image: it.image,
      href: it.href,
      url: it.url,
      buy: it.buy,
      mode: it.mode,
      youtubeId: it.youtubeId
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
      selectedPodcastMode = "all";
      if (searchEl) searchEl.value = "";
      renderAll();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch(err => {
      console.error(err);
      cardsEl.innerHTML = `
        <div class="block pad" style="grid-column: 1 / -1;">
          <div style="font-weight:700; margin-bottom:8px;">Couldn’t load content</div>
          <div style="color: rgba(255,255,255,.62);">Check that <code>${escapeHtml(DATA_PATH)}</code> exists and returns valid JSON.</div>
        </div>
      `;
      if (resultCountEl) resultCountEl.textContent = "0";
    });
  });
})();
