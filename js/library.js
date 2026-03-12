// /js/library.js — Content Vault only
(function () {
  const DATA_PATH = document.body?.dataset?.source || "/content/content-vault.json";

  const cardsEl = document.getElementById("cards");
  const searchEl = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearBtn");
  const tagBarEl = document.getElementById("tagBar");
  const resultCountEl = document.getElementById("resultCount");
  const typeTabsEl = document.getElementById("typeTabs");

  if (!cardsEl) return;

  let allItems = [];
  let selectedType = "all"; // all | podcast | book | article
  let selectedTag = "";
  let query = "";

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

  function computeCta(item) {
    // Podcasts
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

    // Books
    if (item.type === "book") {
      const url = item.buy || item.href || item.url || null;
      return { label: url ? (item.buy ? "Buy" : "Open") : "Info", url, disabled: !url };
    }

    // Articles
    if (item.type === "article") {
      const url = item.url || item.href || null;
      return { label: "Read", url, disabled: !url };
    }

    // Fallback
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

  function cardHtml(item) {
    const title = escapeHtml(item.title || "Untitled");
    const desc = escapeHtml(item.subtitle || item.description || "");
    const thumb = escapeAttr(item.thumb || item.image || "/assets/covers/placeholder-512.jpg");
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const cta = computeCta(item);

    const tagsHtml = tags.length ? `
      <div class="pills" aria-label="tags">
        ${tags.map(t => `<button class="pill" type="button" data-inline-tag="${escapeAttr(t)}">${escapeHtml(t)}</button>`).join("")}
      </div>
    ` : "";

    const typePill = item.type ? `<span class="pill subtle">${escapeHtml(item.type)}</span>` : "";

    if (cta.disabled) {
      return `
        <div class="card disabled" aria-disabled="true">
          <div class="cover">
            <img src="${thumb}" alt="${title} cover" loading="lazy" />
          </div>
          <div class="card-body">
            <div class="card-title">${title}</div>
            ${desc ? `<div class="card-desc">${desc}</div>` : ""}
            ${tagsHtml}
            <div class="card-actions">
              ${typePill}
              <button class="btn disabled-cta" type="button" disabled>${escapeHtml(cta.label)} (soon)</button>
            </div>
          </div>
        </div>
      `;
    }

    const isExternal = /^https?:\/\//i.test(cta.url || "");
    const linkAttrs = isExternal ? `target="_blank" rel="noopener noreferrer"` : "";

    return `
      <a class="card" href="${escapeAttr(cta.url)}" ${linkAttrs}>
        <div class="cover">
          <img src="${thumb}" alt="${title} cover" loading="lazy" />
        </div>
        <div class="card-body">
          <div class="card-title">${title}</div>
          ${desc ? `<div class="card-desc">${desc}</div>` : ""}
          ${tagsHtml}
          <div class="card-actions">
            ${typePill}
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

    const hay = norm([
      item.title,
      item.subtitle || item.description,
      (Array.isArray(item.tags) ? item.tags.join(" ") : ""),
      item.type,
      item.mode
    ].join(" "));

    const matchesQuery = !q || hay.includes(q);
    const matchesTag = !tag || (Array.isArray(item.tags) && item.tags.some(t => norm(t) === tag));

    return matchesType && matchesQuery && matchesTag;
  }

  function renderAll() {
    // update tab + tag bar active states by re-rendering them
    const types = uniq(allItems.map(i => i.type).filter(Boolean));
    renderTypeTabs(types);

    const tags = uniq(allItems.flatMap(i => Array.isArray(i.tags) ? i.tags : []).filter(Boolean))
      .map(t => String(t).trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    renderTagBar(tags);

    const filtered = allItems.filter(matchesFilters);

    filtered.sort((a, b) => {
      // podcasts: listen first then watch
      if (a.type === "podcast" && b.type === "podcast") {
        const am = a.mode === "watch" ? 1 : 0;
        const bm = b.mode === "watch" ? 1 : 0;
        if (am !== bm) return am - bm;
      }
      // then by title
      return String(a.title || "").localeCompare(String(b.title || ""));
    });

    cardsEl.innerHTML = filtered.map(cardHtml).join("") || `
      <div class="block pad" style="grid-column: 1 / -1;">
        <div style="color: rgba(255,255,255,.75); font-weight:650; margin-bottom:8px;">No results</div>
        <div style="color: rgba(255,255,255,.62);">Try clearing filters or searching for something else.</div>
      </div>
    `;

    if (resultCountEl) resultCountEl.textContent = String(filtered.length);

    // inline tag click inside cards
    cardsEl.querySelectorAll("button[data-inline-tag]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        selectedTag = btn.getAttribute("data-inline-tag") || "";
        // scroll to controls for UX
        document.getElementById("controls")?.scrollIntoView({ behavior: "smooth", block: "start" });
        renderAll();
      });
    });
  }

  async function init() {
    const json = await loadJson(DATA_PATH);
    allItems = unwrapItems(json);

    // basic sanity normalize
    allItems = allItems.map(it => ({
      id: it.id,
      type: it.type || "other",
      title: it.title || "Untitled",
      subtitle: it.subtitle ?? it.description ?? "",
      description: it.description,
      tags: Array.isArray(it.tags) ? it.tags : [],
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

  // search
  if (searchEl) {
    searchEl.addEventListener("input", () => {
      query = searchEl.value || "";
      renderAll();
    });
  }

  // clear
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
