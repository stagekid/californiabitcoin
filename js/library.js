// /js/library.js
(function () {
  function qs(sel, el = document) { return el.querySelector(sel); }
  function qsa(sel, el = document) { return Array.from(el.querySelectorAll(sel)); }

  function normalize(str) {
    return (str || "").toString().toLowerCase().trim();
  }

  function uniq(arr) {
    return Array.from(new Set(arr));
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function cardTemplate(item) {
    const title = item.title || "Untitled";
    const desc = item.description || "";
    const date = item.date ? formatDate(item.date) : "";
    const source = item.source ? item.source : "";
    const link = item.url || "#";
    const tags = Array.isArray(item.tags) ? item.tags : [];

    const metaLeft = [date, source].filter(Boolean).join(" • ");

    return `
      <a class="card" href="${link}" ${link.startsWith("http") ? `target="_blank" rel="noopener"` : ""}>
        <div class="card-title">${escapeHtml(title)}</div>
        <div class="card-desc">${escapeHtml(desc)}</div>
        <div class="meta">
          <div>${escapeHtml(metaLeft)}</div>
          <div>${item.duration ? escapeHtml(item.duration) : ""}</div>
        </div>
        <div class="pills" aria-label="tags">
          ${tags.map(t => `<span class="pill" data-tag="${escapeAttr(t)}">${escapeHtml(t)}</span>`).join("")}
        </div>
      </a>
    `;
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
    return (str ?? "").toString().replaceAll('"', "&quot;");
  }

  async function loadJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return await res.json();
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

    return items.filter(item => {
      const haystack = normalize([
        item.title, item.description, item.source, (item.tags || []).join(" ")
      ].join(" "));

      const matchesQuery = !q || haystack.includes(q);
      const matchesTag = !selectedTag || selectedTag === "All"
        ? true
        : (item.tags || []).some(t => normalize(t) === normalize(selectedTag));

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

    grid.innerHTML = items.map(cardTemplate).join("");
    if (count) count.textContent = String(items.length);
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

    let data = await loadJson(dataPath);

    // Optional: sort newest first if dates exist
    data = (Array.isArray(data) ? data : []).slice().sort((a, b) => {
      const ad = a.date ? new Date(a.date).getTime() : 0;
      const bd = b.date ? new Date(b.date).getTime() : 0;
      return bd - ad;
    });

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

    // Clicking a tag inside a card sets the filter too
    document.addEventListener("click", (e) => {
      const pill = e.target.closest(".card .pill");
      if (!pill) return;

      e.preventDefault();
      const t = pill.dataset.tag || "";
      selectedTag = t;

      renderTagBar(allTags, selectedTag);
      renderList(applyFilters(data, query, selectedTag));

      // scroll to controls on mobile
      const controls = qs("#controls");
      if (controls) controls.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Search input
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
      const grid = document.querySelector("#cards");
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
