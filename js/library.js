// /js/library.js  (UNIFIED Content Vault loader)
(function () {
  function qs(sel, el = document) { return el.querySelector(sel); }
  function qsa(sel, el = document) { return Array.from(el.querySelectorAll(sel)); }
  function normalize(s) { return (s || "").toString().toLowerCase().trim(); }
  function uniq(arr) { return Array.from(new Set(arr)); }
  function escapeHtml(str) { return (str ?? "").toString().replaceAll("&", "&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'", "&#039;"); }
  function escapeAttr(str) { return (str ?? "").toString().replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }

  async function loadJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return await res.json();
  }

  // Normalize wrapper object or array
  function normalizeData(json) {
    if (!json) return [];
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.items)) return json.items;
    return [];
  }

  // Build CTA depending on type + mode
  function computeCta(item) {
    if (item.type === "podcast") {
      if (item.mode === "listen") return { label: "Listen", url: item.href || item.url || null, disabled: !item.href };
      if (item.mode === "watch") {
        const placeholder = !item.youtubeId || item.youtubeId === "REPLACE_WITH_VIDEO_ID";
        if (placeholder) return { label: "Watch", url: null, disabled: true };
        return { label: "Watch", url: `https://www.youtube.com/watch?v=${item.youtubeId}`, disabled: false };
      }
    }

    if (item.type === "book") {
      if (item.buy) return { label: "Buy", url: item.buy, disabled: false };
      if (item.href || item.url) return { label: "Open", url: item.href || item.url, disabled: false };
      return { label: "Info", url: null, disabled: true };
    }

    if (item.type === "article") {
      if (item.url || item.href) return { label: "Read", url: item.url || item.href, disabled: false };
      return { label: "Open", url: null, disabled: true };
    }

    // generic fallback
    if (item.href || item.url) return { label: "Open", url: item.href || item.url, disabled: false };
    return { label: "Open", url: null, disabled: true };
  }

  function itemTags(item) { return Array.isArray(item.tags) ? item.tags : []; }

  function cardHtml(item) {
    const title = escapeHtml(item.title || "Untitled");
    const desc = escapeHtml(item.subtitle || item.description || "");
    const thumb = escapeAttr(item.thumb || item.image || "/assets/covers/placeholder-512.jpg");
    const tags = itemTags(item);
    const cta = computeCta(item);

    const tagsHtml = tags.length ? `<div class="pills">${tags.map(t => `<button class="pill" data-tag="${escapeAttr(t)}">${escapeHtml(t)}</button>`).join("")}</div>` : "";

    // Disabled CTA (no url) -> non-link card + disabled button
    if (cta.disabled) {
      return `
        <div class="card disabled" data-type="${escapeAttr(item.type || "")}">
          <div class="cover"><img src="${thumb}" alt="${title} cover" loading="lazy" /></div>
          <div class="card-body">
            <div class="card-title">${title}</div>
            ${desc ? `<div class="card-desc">${desc}</div>` : ""}
            ${tagsHtml}
            <div class="card-actions">
              <button class="btn disabled-cta" disabled>${escapeHtml(cta.label)} (soon)</button>
            </div>
          </div>
        </div>
      `;
    }

    const isExternal = /^https?:\/\//i.test(cta.url || "");
    const linkAttrs = isExternal ? `target="_blank" rel="noopener noreferrer"` : "";

    // clickable card
    return `
      <a class="card" href="${escapeAttr(cta.url || "#")}" ${linkAttrs} data-type="${escapeAttr(item.type || "")}">
        <div class="cover"><img src="${thumb}" alt="${title} cover" loading="lazy" /></div>
        <div class="card-body">
          <div class="card-title">${title}</div>
          ${desc ? `<div class="card-desc">${desc}</div>` : ""}
          ${tagsHtml}
          <div class="card-actions">
            <span class="pill subtle">${escapeHtml(item.type || "")}</span>
            <button class="btn">${escapeHtml(cta.label)}</button>
          </div>
        </div>
      </a>
    `;
  }

  // UI wiring
  async function init() {
    const dataPath = document.body.dataset.source;
    if (!dataPath) return;

    const cardsEl = qs("#cards");
    const searchEl = qs("#searchInput");
    const clearBtn = qs("#clearBtn");
    const tagBar = qs("#tagBar");
    const resultCount = qs("#resultCount");
    const typeTabs = qs("#typeTabs");

    let json = await loadJson(dataPath);
    let items = normalizeData(json);

    // normalize minimal fields and ensure type exists
    items = items.map(it => Object.assign({ type: it.type || "other", tags: it.tags || [] }, it));

    // master tag list
    const allTags = uniq(items.flatMap(i => itemTags(i))).sort((a,b) => a.localeCompare(b));

    // types list (for tabs)
    const types = uniq(items.map(i => i.type || "other"));
    // keep friendly order if present
    const preferredOrder = ["podcast","book","article","other"];
    types.sort((a,b) => {
      const ia = preferredOrder.indexOf(a) !== -1 ? preferredOrder.indexOf(a) : 999;
      const ib = preferredOrder.indexOf(b) !== -1 ? preferredOrder.indexOf(b) : 999;
      if (ia !== ib) return ia - ib;
      return a.localeCompare(b);
    });

    // create type tabs UI (if container exists)
    if (typeTabs) {
      const allTabHtml = `<button class="tab active" data-type="all">All</button>`;
      const typeBtns = types.map(t => `<button class="tab" data-type="${escapeAttr(t)}">${escapeHtml(t)}</button>`).join("");
      typeTabs.innerHTML = `<div class="tabs">${allTabHtml}${typeBtns}</div>`;
    }

    function render(currentType = "all", query = "", activeTag = "") {
      const q = normalize(query);
      const tagNorm = normalize(activeTag);
      const filtered = items.filter(it => {
        const matchesType = currentType === "all" || (it.type || "") === currentType;
        const hay = `${it.title || ""} ${it.subtitle || it.description || ""} ${(it.tags||[]).join(" ")}`.toLowerCase();
        const matchesQuery = !q || hay.includes(q);
        const matchesTag = !tagNorm || (it.tags || []).some(t => normalize(t) === tagNorm);
        return matchesType && matchesQuery && matchesTag;
      });

      // optional stable ordering: type then title
      filtered.sort((a,b) => {
        if (a.type !== b.type) return (a.type || "").localeCompare(b.type || "");
        return (a.title || "").localeCompare(b.title || "");
      });

      cardsEl.innerHTML = filtered.map(cardHtml).join("") || `
        <div class="block pad" style="grid-column:1 / -1;">
          <div style="font-weight:700;margin-bottom:8px;">No results</div>
          <div style="color:rgba(255,255,255,.62);">Try clearing filters or adjust your search.</div>
        </div>
      `;

      if (resultCount) resultCount.textContent = String(filtered.length);

      // wire card-internal tag click
      cardsEl.querySelectorAll(".pills .pill").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const tag = btn.getAttribute("data-tag") || "";
          // set tag control UI and re-render
          if (tagBar) {
            // simulate click on tagBar button if exists
            const tbBtn = tagBar.querySelector(`[data-tag="${tag}"]`);
            if (tbBtn) tbBtn.click();
          } else {
            render(currentType, query, tag);
          }
          e.preventDefault();
        });
      });
    }

    // render master tag bar
    if (tagBar) {
      const allBtn = `<button class="pill ${"" === "" ? "active" : ""}" data-tag="">All</button>`;
      const tagBtns = allTags.map(t => `<button class="pill" data-tag="${escapeAttr(t)}">${escapeHtml(t)}</button>`).join("");
      tagBar.innerHTML = allBtn + tagBtns;

      tagBar.addEventListener("click", (e) => {
        const pill = e.target.closest("button[data-tag]");
        if (!pill) return;
        // toggle active state visually
        qsa("#tagBar .pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        const tag = pill.getAttribute("data-tag") || "";
        const activeTab = qs("#typeTabs .tab.active")?.getAttribute("data-type") || "all";
        render(activeTab, searchEl?.value || "", tag);
      });
    }

    // type tab handling
    if (typeTabs) {
      typeTabs.addEventListener("click", (e) => {
        const btn = e.target.closest(".tab");
        if (!btn) return;
        qsa("#typeTabs .tab").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        const type = btn.getAttribute("data-type") || "all";
        // clear tag selection
        qsa("#tagBar .pill").forEach(p => p.classList.remove("active"));
        // render with current search
        render(type, searchEl?.value || "", "");
      });
    }

    // search
    if (searchEl) {
      searchEl.addEventListener("input", () => {
        const activeType = qs("#typeTabs .tab.active")?.getAttribute("data-type") || "all";
        const activeTag = qs("#tagBar .pill.active")?.getAttribute("data-tag") || "";
        render(activeType, searchEl.value || "", activeTag);
      });
    }

    // clear
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (searchEl) searchEl.value = "";
        qsa("#tagBar .pill").forEach(p => p.classList.remove("active"));
        qs("#tagBar .pill")?.classList.add("active"); // first = All
        qs("#typeTabs .tab.active")?.classList.remove("active");
        qs("#typeTabs .tab[data-type='all']")?.classList.add("active");
        render("all", "", "");
      });
    }

    // initial render
    render("all", "", "");
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch(err => {
      console.error(err);
      const grid = qs("#cards");
      if (grid) {
        grid.innerHTML = `
          <div class="block pad" style="grid-column: 1 / -1;">
            <div style="font-weight:700; margin-bottom:8px;">Couldn’t load content</div>
            <div style="color: rgba(255,255,255,.62);">Check that the JSON file exists and is valid and that <code>body[data-source]</code> points to it.</div>
          </div>
        `;
      }
    });
  });
})();
