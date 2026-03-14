// /js/library.js — Content Vault only (updated: show only Type/Level/Focus tags; remove Featured badge text)
(function () {
  const DATA_PATH = document.body?.dataset?.source || "/content/content-vault.json";

  // Placeholder images
  const FALLBACK_PLACEHOLDER = "/assets/covers/placeholder-512.jpg";
  const PODCAST_PLACEHOLDER = "/assets/covers/placeholder/podcast.webp";
  const ARTICLE_PLACEHOLDER = "/assets/covers/placeholder/article.webp";
  const BOOK_PLACEHOLDER = "/assets/covers/placeholder/book.webp";

  const cardsEl = document.getElementById("cards");
  const featuredSectionEl = document.getElementById("featuredSection");
  const featuredCardsEl = document.getElementById("featuredCards");
  const searchEl = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearBtn");
  const tagBarEl = document.getElementById("tagBar");
  const resultCountEl = document.getElementById("resultCount");
  const typeTabsEl = document.getElementById("typeTabs");

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
      .replaceAll('"', "&quot;')
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

  // LEVEL normalizer: map a few synonyms to your desired tags
  function normalizeLevel(l) {
    const s = norm(l || "");
    if (!s) return "";
    if (s === "basic") return "beginner";
    if (s === "beginner" || s === "intermediate" || s === "advanced") return s;
    if (s.includes("begin") || s.includes("intro") || s.includes("starter")) return "beginner";
    return s;
  }

  // build the three visible tag pills for a card: [type, level, focus]
  function getVisiblePills(item) {
    const pills = [];

    // 1) Type (podcast / book / article)
    const t = String(item.type || "").trim();
    if (t) pills.push(norm(t)); // keep lowercase like you asked

    // 2) Level (normalized)
    const lvl = normalizeLevel(item.level || "");
    if (lvl) pills.push(lvl);

    // 3) Focus (explicit 'focus' field preferred; else first foundation)
    let focus = "";
    if (item.focus && String(item.focus).trim()) {
      focus = String(item.focus).trim();
    } else if (Array.isArray(item.foundations) && item.foundations.length > 0) {
      focus = String(item.foundations[0] || "").trim();
    } else if (Array.isArray(item.tags) && item.tags.length > 0) {
      // last-resort fallback (not preferred) — but keep it quiet
      focus = String(item.tags[0] || "").trim();
    }

    if (focus) pills.push(focus);

    // Ensure uniqueness and trim empties — but keep order [type, level, focus]
    return pills.map((p) => String(p).trim()).filter(Boolean);
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

  function getCreatorMeta(item) {
    const explicitCreator = String(item.creator || "").trim();
    const explicitLabel = String(item.creatorLabel || "").trim();

    if (explicitCreator) {
      return {
        label: explicitLabel || "By",
        name: explicitCreator
      };
    }

    if (item.type === "book" && item.author) {
      return {
        label: "By",
        name: String(item.author).trim()
      };
    }

    if (item.type === "article" && item.author) {
      return {
        label: "By",
        name: String(item.author).trim()
      };
    }

    if (item.type === "podcast" && item.host) {
      return {
        label: "Hosted by",
        name: String(item.host).trim()
      };
    }

    if (item.thoughtLeader && typeof item.thoughtLeader === "string") {
      return {
        label: item.type === "podcast" ? "With" : "By",
        name: String(item.thoughtLeader).trim()
      };
    }

    return null;
  }

  function cardHtml(item, options = {}) {
    const featured = options.featured === true;
    const titleText = item.title || "Untitled";
    const title = escapeHtml(titleText);
    const desc = escapeHtml(item.subtitle || item.description || "");

    const thumbRaw = resolveThumb(item);
    const thumb = escapeAttr(thumbRaw);
    const srcset = escapeAttr(buildSrcset(thumbRaw));

    const pills = getVisiblePills(item);
    const { url, disabled } = computeLink(item);
    const creatorMeta = getCreatorMeta(item);

    // NOTE: FEATURED BADGE REMOVED (user requested no 'Featured' label on cards)
    const featuredBadge = "";

    const creatorHtml = creatorMeta
      ? `
        <div class="card-meta">
          <span class="card-meta-label">${escapeHtml(creatorMeta.label)}</span>
          <span class="card-meta-name">${escapeHtml(creatorMeta.name)}</span>
        </div>
      `
      : "";

    const tagsHtml = pills.length
      ? `
        <div class="pills" aria-label="tags">
          ${pills.map((t) => `
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

    const cardClass = featured ? "card featured-card" : "card";

    if (disabled) {
      return `
        <div class="${cardClass} disabled" aria-disabled="true">
          <div class="cover">${imgTag}</div>
          <div class="card-body">
            ${featuredBadge}
            <div class="card-title">${title}</div>
            ${creatorHtml}
            ${desc ? `<div class="card-desc">${desc}</div>` : ""}
            ${tagsHtml}
          </div>
        </div>
      `;
    }

    const isExternal = /^https?:\/\//i.test(url || "");
    const linkAttrs = isExternal ? `target="_blank" rel="noopener noreferrer"` : "";

    return `
      <a class="${cardClass}" href="${escapeAttr(url)}" ${linkAttrs}>
        <div class="cover">${imgTag}</div>
        <div class="card-body">
          ${featuredBadge}
          <div class="card-title">${title}</div>
          ${creatorHtml}
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

    const allPills = getVisiblePills(item);
    const creatorMeta = getCreatorMeta(item);

    const hay = norm([
      item.title,
      item.subtitle || item.description,
      creatorMeta?.name || "",
      allPills.join(" "),
      item.type,
      item.mode
    ].join(" "));

    const matchesQuery = !q || hay.includes(q);
    const matchesTag = !tag || allPills.some((t) => norm(t) === tag);

    return matchesType && matchesQuery && matchesTag;
  }

  function wireInlineTagButtons(scopeEl) {
    if (!scopeEl) return;

    scopeEl.querySelectorAll("button[data-inline-tag]").forEach((btn) => {
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

  function renderTypeTabs(types) {
    if (!typeTabsEl) return;

    const ordered = ["all", "podcast", "book", "article"].filter(
      (t) => t === "all" || types.includes(t)
    );

    typeTabsEl.innerHTML = `
      <div class="tabs">
        ${ordered.map((t) => `
          <button class="tab ${selectedType === t ? "active" : ""}" type="button" data-type="${escapeAttr(t)}">
            ${escapeHtml(t === "all" ? "All" : (t === "podcast" ? "Podcasts" : (t === "book" ? "Books" : (t === "article" ? "Articles" : t))))}
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

  function renderAll() {
    const types = uniq(allItems.map((i) => i.type).filter(Boolean));
    renderTypeTabs(types);

    // collect visible pills across items and use them as filterable tags
    const tags = uniq(
      allItems.flatMap((i) => getVisiblePills(i)).filter(Boolean)
    )
      .map((t) => String(t).trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    renderTagBar(tags);

    const filtered = allItems.filter(matchesFilters);

    const featuredItems = filtered
      .filter((item) => item.featured === true)
      .slice(0, 3);

    const regularItems = filtered
      .filter((item) => item.featured !== true)
      .sort((a, b) =>
        String(a.title || "").localeCompare(String(b.title || ""))
      );

    if (featuredSectionEl && featuredCardsEl) {
      if (featuredItems.length > 0) {
        featuredSectionEl.classList.remove("hidden");
        // render only the cards in the featured grid (no "Featured" badge text)
        featuredCardsEl.innerHTML = featuredItems.map((item) => cardHtml(item, { featured: true })).join("");
        wireInlineTagButtons(featuredCardsEl);
      } else {
        featuredSectionEl.classList.add("hidden");
        featuredCardsEl.innerHTML = "";
      }
    }

    cardsEl.innerHTML =
      regularItems.map((item) => cardHtml(item)).join("") ||
      `
        <div class="block pad" style="grid-column: 1 / -1;">
          <div style="color: rgba(255,255,255,.75); font-weight:650; margin-bottom:8px;">No results</div>
          <div style="color: rgba(255,255,255,.62);">Try clearing filters or searching for something else.</div>
        </div>
      `;

    if (resultCountEl) resultCountEl.textContent = String(filtered.length);

    wireInlineTagButtons(cardsEl);
  }

  // ---- init and wiring ----
  let allItems = [];
  let selectedType = "all";
  let selectedTag = "";
  let query = "";

  async function init() {
    const json = await loadJson(DATA_PATH);
    allItems = unwrapItems(json);

    // Normalize items and preserve creator meta etc.
    allItems = allItems.map((it) => ({
      id: it.id,
      type: it.type || "other",
      title: it.title || "Untitled",
      subtitle: it.subtitle ?? it.description ?? "",
      description: it.description ?? "",

      // creator fields
      author: it.author || "",
      host: it.host || "",
      creator: it.creator || "",
      creatorLabel: it.creatorLabel || "",

      foundations: Array.isArray(it.foundations) ? it.foundations : [],
      focus: it.focus || "",
      level: it.level || "",
      thoughtLeaderBookId: it.thoughtLeaderBookId || "",
      thoughtLeader: it.thoughtLeader || "",

      tags: Array.isArray(it.tags) ? it.tags : [],
      featured: it.featured === true,

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
