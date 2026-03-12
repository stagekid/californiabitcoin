// /js/library.js
(function () {
  function qs(sel, el = document) { return el.querySelector(sel); }
  function qsa(sel, el = document) { return Array.from(el.querySelectorAll(sel)); }

  function normalize(str) { return (str || "").toString().toLowerCase().trim(); }
  function uniq(arr) { return Array.from(new Set(arr)); }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function escapeHtml(str) {
    return (str ?? "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(str) {
    return (str ?? "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  async function loadJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return await res.json();
  }

  // Determine section: prefer explicit mode mapping, then section field, then "Other"
  function getSection(item) {
    if (!item) return "Other";
    if (item.mode === "listen") return "Listen";
    if (item.mode === "watch") return "Watch";
    return (item.section || "").toString().trim() || "Other";
  }

  // Normalize incoming JSON: support either plain array or wrapper { items: [...] }
  function normalizeData(json) {
    if (!json) return [];
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.items)) return json.items;
    return [];
  }

  // Build CTA for podcast / generic items
  function computeCta(item) {
    // Listen items: external link
    if (item.mode === "listen") {
      return { label: "Listen", url: item.href || item.url || null, disabled: !item.href };
    }

    // Watch items: youtubeId
    if (item.mode === "watch") {
      const placeholder = !item.youtubeId || item.youtubeId === "REPLACE_WITH_VIDEO_ID";
      if (placeholder) return { label: "Watch", url: null, disabled: true };
      return { label: "Watch", url: `https://www.youtube.com/watch?v=${item.youtubeId}`, disabled: false };
    }

    // Generic fallback: prefer href/url
    if (item.href || item.url) return { label: "Open", url: item.href || item.url, disabled: false };
    return { label: "Open", url: null, disabled: true };
  }

  function cardTemplate(item) {
    const title = item.title || "Untitled";
    const desc = item.subtitle || item.description || "";
    const date = item.date ? formatDate(item.date) : "";
    const source = item.source ? item.source : "";
    const duration = item.duration ? item.duration : "";
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const img = item.thumb || item.image || "";

    const metaLeft = [date, source].filter(Boolean).join(" • ");
    const cta = computeCta(item);

    const tagsHtml = tags.length
      ? `<div class="pills" aria-label="tags">${tags.map(t => `<span class="pill" data-tag="${escapeAttr(t)}">${escapeHtml(t)}</span>`).join("")}</div>`
      : "";

    // If CTA is disabled (e.g., watch placeholder), render non-link card with disabled CTA.
    if (cta.disabled) {
      return `
        <div class="card disabled">
          ${img ? `
            <div class="cover">
              <img src="${escapeAttr(img)}" alt="${escapeAttr(title)} cover" loading="lazy" />
            </div>` : ""}
          <div class="card-body">
            <div class="card-title">${escapeHtml(title)}</div>
            ${desc ? `<div class="card-desc">${escapeHtml(desc)}</div>` : ""}
            ${(metaLeft || duration) ? `
              <div class="meta">
                <div>${escapeHtml(metaLeft)}</div>
                <div>${escapeHtml(duration)}</div>
              </div>` : ""}
            ${tagsHtml}
            <div class="card-actions">
              <button class="btn disabled-cta" type="button" disabled>${escapeHtml(cta.label)} (soon)</button>
            </div>
          </div>
        </div>
      `;
    }

    // normal clickable card
    const isExternal = /^https?:\/\//i.test(cta.url || "");
    const linkAttrs = isExternal ? `target="_blank" rel="noopener"` : "";
    return `
      <a class="card" href="${escapeAttr(cta.url || "#")}" ${linkAttrs}>
        ${img ? `
          <div class="cover">
            <img src="${escapeAttr(img)}" alt="${escapeAttr(title)} cover" loading="lazy" />
          </div>` : ""}
        <div class="card-body">
          <div class="card-title">${escapeHtml(title)}</div>
          ${desc ? `<div class="card-desc">${escapeHtml(desc)}</div>` : ""}
          ${(metaLeft || duration) ? `
            <div class="meta">
              <div>${escapeHtml(metaLeft)}</div>
              <div>${escapeHtml(duration)}</div>
            </div>` : ""}
          ${tagsHtml}
          <div class="card-actions">
            <span class="pill subtle">${escapeHtml(item.mode || item.section || "")}</span>
            <button class="btn">${escapeHtml(cta.label)}</button>
          </div>
        </div>
      </a>
    `;
  }

  function renderTagBar(tags, selectedTag) {
    const tagBar = qs("#tagBar");
    if (!tagBar) return;
    const all = ["All", ...tags];
    tagBar.innerHTML = all.map(t => {
      const isSelected = (t === "All" && !selectedTag) || (t === selectedTag);
      return `<span class="pill ${isSelected ? "selected" : ""}" data-tag="${escapeAttr(t)}">${escapeHtml(t)}</span>`;
    }).join("");
  }

  function applyFilters(items, query, selectedTag) {
    const q = normalize(query);
    const tagNorm = normalize(selectedTag);

    return items.filter(item => {
      const haystack = normalize([
        item.title,
        item.subtitle || item.description,
        item.source,
        (item.tags || []).join(" "),
        item.section,
        item.mode
      ].join(" "));

      const matchesQuery = !q || haystack.includes(q);
      const matchesTag = (!tagNorm || tagNorm === "all")
        ? true
        : (item.tags || []).some(t => normalize(t) === tagNorm);

      return matchesQuery && matchesTag;
    });
  }

  function renderList(items) {
    const grid = qs("#cards");
    const count = qs("#resultCount");
    if (!grid) return;

    if (!items.length) {
      grid.innerHTML = `
        <div class="block pad" style="grid-column: 1 / -1;">
          <div style="color: rgba(255,255,255,.75); font-weight:650; margin-bottom:8px;">No results</div>
          <div style="color: rgba(255,255,255,.62);">Try clearing filters or searching for something else.</div>
        </div>
      `;
      if (count) count.textContent = "0";
      return;
    }

    if (count) count.textContent = String(items.length);

    // Group by section (using mode mapping first)
    const groups = {};
    items.forEach((item) => {
      const s = getSection(item);
      if (!groups[s]) groups[s] = [];
      groups[s].push(item);
    });

    // Preferred order (Listen first, then Watch)
    const sectionOrder = ["Listen", "Watch", "Other"];
    const orderedSections = Object.keys(groups).sort((a, b) => {
      const ia = sectionOrder.indexOf(a);
      const ib = sectionOrder.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

    // Render sections with their own grid
    grid.innerHTML = orderedSections.map((sectionName) => {
      const sectionItems = groups[sectionName] || [];
      return `
        <div class="library-section" style="grid-column: 1 / -1;">
          <div class="library-section-head">
            <h3>${escapeHtml(sectionName)}</h3>
            <div class="hint">${sectionItems.length} items</div>
          </div>
          <div class="grid">
            ${sectionItems.map(cardTemplate).join("")}
          </div>
        </div>
      `;
    }).join("");
  }

  function setActiveNav() {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    qsa(".nav-pill").forEach(a => {
      const href = a.getAttribute("href") || "";
      const normalized = href.replace(/\/+$/, "") || "/";
      if (normalized !== "/" && path.startsWith(normalized)) a.classList.add("active");
      if (normalized === "/" && path === "/") a.classList.add("active");
    });
  }

  async function init() {
    setActiveNav();

    const dataPath = document.body.dataset.source;
    if (!dataPath) return;

    const searchInput = qs("#searchInput");
    const clearBtn = qs("#clearBtn");

    let selectedTag = "";
    let query = "";

    let json = await loadJson(dataPath);
    let data = normalizeData(json);

    // Sort newest first only if dates present
    data.sort((a, b) => {
      const ad = a.date ? new Date(a.date).getTime() : 0;
      const bd = b.date ? new Date(b.date).getTime() : 0;
      return bd - ad;
    });

    // Build master tag list
    const allTags = uniq(
      data.flatMap(i => Array.isArray(i.tags) ? i.tags : [])
        .map(t => (t || "").toString().trim())
        .filter(Boolean)
    ).sort((a, b) => a.localeCompare(b));

    renderTagBar(allTags, selectedTag);
    renderList(data);

    // Tag bar click
    const tagBar = qs("#tagBar");
    if (tagBar) {
      tagBar.addEventListener("click", (e) => {
        const pill = e.target.closest(".pill");
        if (!pill) return;
        const t = pill.dataset.tag || "";
        selectedTag = (t === "All") ? "" : t;
        renderTagBar(allTags, selectedTag);
        renderList(applyFilters(data, query, selectedTag));
      });
    }

    // Tag click inside card
    document.addEventListener("click", (e) => {
      const pill = e.target.closest(".card .pill");
      if (!pill) return;
      e.preventDefault();
      const t = pill.dataset.tag || "";
      selectedTag = t;
      renderTagBar(allTags, selectedTag);
      renderList(applyFilters(data, query, selectedTag));
      const controls = qs("#controls");
      if (controls) controls.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Search
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        query = searchInput.value || "";
        renderList(applyFilters(data, query, selectedTag));
      });
    }

    // Clear
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        query = "";
        selectedTag = "";
        if (searchInput) searchInput.value = "";
        renderTagBar(allTags, selectedTag);
        renderList(data);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch(err => {
      console.error(err);
      const grid = qs("#cards");
      if (grid) {
        grid.innerHTML = `
          <div class="block pad" style="grid-column: 1 / -1;">
            <div style="font-weight:700; margin-bottom:8px;">Couldn’t load content</div>
            <div style="color: rgba(255,255,255,.62);">Check that the JSON file exists and is valid.</div>
          </div>
        `;
      }
    });
  });
})();
