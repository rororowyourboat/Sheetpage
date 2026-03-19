/**
 * SheetPage — Core runtime
 * Reads SheetPageConfig from config.js, fetches the published Google Sheet CSV,
 * and renders presentation cards with optional category filtering and form embed.
 */
(function () {
  "use strict";

  const cfg = window.SheetPageConfig || {};
  const col = cfg.columns || {};

  // ── CSV Parser ────────────────────────────────────────────────

  function parseCSV(text) {
    const rows = [];
    let current = "";
    let inQuotes = false;
    let row = [];

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (ch === '"' && next === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          row.push(current.trim());
          current = "";
        } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
          row.push(current.trim());
          current = "";
          if (row.length > 1 || row[0] !== "") rows.push(row);
          row = [];
          if (ch === "\r") i++;
        } else {
          current += ch;
        }
      }
    }

    row.push(current.trim());
    if (row.length > 1 || row[0] !== "") rows.push(row);
    return rows;
  }

  function csvToObjects(rows) {
    if (rows.length < 2) return [];
    const headers = rows[0].map(function (h) { return h.toLowerCase().trim(); });
    return rows.slice(1).map(function (row) {
      var obj = {};
      headers.forEach(function (header, i) {
        obj[header] = row[i] || "";
      });
      return obj;
    });
  }

  // ── Google Drive Link Helper ──────────────────────────────────

  function toDriveDownloadURL(url) {
    if (!url) return "";
    var fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) return "https://drive.google.com/uc?export=download&id=" + fileMatch[1];
    var openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (openMatch) return "https://drive.google.com/uc?export=download&id=" + openMatch[1];
    return url;
  }

  // ── Field Accessors ───────────────────────────────────────────

  function field(item, key) {
    return item[(col[key] || key).toLowerCase()] || "";
  }

  // ── Rendering ─────────────────────────────────────────────────

  function createCard(item) {
    var card = document.createElement("div");
    card.className = "sp-card";

    var category = field(item, "category");
    var title = field(item, "title");
    var description = field(item, "description");
    var thumbnail = field(item, "thumbnail");
    var pdfLink = field(item, "pdfLink");

    if (category) card.dataset.category = category;

    // Thumbnail
    if (thumbnail) {
      var img = document.createElement("img");
      img.className = "sp-card__thumb";
      img.src = thumbnail;
      img.alt = title || "Presentation thumbnail";
      img.loading = "lazy";
      card.appendChild(img);
    } else {
      var placeholder = document.createElement("div");
      placeholder.className = "sp-card__thumb-placeholder";
      placeholder.textContent = cfg.thumbnailPlaceholder || "\u{1F4C4}";
      card.appendChild(placeholder);
    }

    // Body
    var body = document.createElement("div");
    body.className = "sp-card__body";

    if (category) {
      var cat = document.createElement("span");
      cat.className = "sp-card__category";
      cat.textContent = category;
      body.appendChild(cat);
    }

    if (title) {
      var h3 = document.createElement("h3");
      h3.className = "sp-card__title";
      h3.textContent = title;
      body.appendChild(h3);
    }

    if (description) {
      var desc = document.createElement("p");
      desc.className = "sp-card__desc";
      desc.textContent = description;
      body.appendChild(desc);
    }

    if (pdfLink) {
      var link = document.createElement("a");
      link.className = "sp-card__download";
      link.href = toDriveDownloadURL(pdfLink);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = cfg.downloadLabel || "Download PDF";
      body.appendChild(link);
    }

    card.appendChild(body);
    return card;
  }

  function renderCards(items) {
    var container = document.getElementById("cards-container");
    container.innerHTML = "";

    if (items.length === 0) {
      var empty = document.createElement("p");
      empty.className = "sp-grid__message";
      empty.textContent = cfg.emptyMessage || "No presentations found.";
      container.appendChild(empty);
      return;
    }

    items.forEach(function (item) { container.appendChild(createCard(item)); });
  }

  function populateCategories(items) {
    var select = document.getElementById("category-filter");
    var catKey = (col.category || "category").toLowerCase();
    var categories = [];
    var seen = {};

    items.forEach(function (item) {
      var c = item[catKey];
      if (c && !seen[c]) {
        seen[c] = true;
        categories.push(c);
      }
    });

    if (categories.length === 0) {
      document.getElementById("filters").style.display = "none";
      return;
    }

    categories.sort();
    categories.forEach(function (cat) {
      var option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      select.appendChild(option);
    });
  }

  // ── Branding ──────────────────────────────────────────────────

  function applyBranding() {
    var titleEl = document.querySelector(".sp-header__title");
    var subtitleEl = document.querySelector(".sp-header__subtitle");
    var footerEl = document.querySelector(".sp-footer p");
    var formHeading = document.querySelector(".sp-form-section__heading");
    var formDesc = document.querySelector(".sp-form-section__desc");

    if (cfg.siteTitle && titleEl) titleEl.textContent = cfg.siteTitle;
    if (cfg.siteSubtitle && subtitleEl) subtitleEl.textContent = cfg.siteSubtitle;
    if (cfg.footerText && footerEl) footerEl.textContent = cfg.footerText;
    if (cfg.formHeading && formHeading) formHeading.textContent = cfg.formHeading;
    if (cfg.formDescription && formDesc) formDesc.textContent = cfg.formDescription;

    if (cfg.siteTitle) document.title = cfg.siteTitle;
    if (cfg.cardMinWidth) document.documentElement.style.setProperty("--card-min-width", cfg.cardMinWidth);
  }

  // ── Form Embed ────────────────────────────────────────────────

  function setupForm() {
    if (!cfg.formEmbedUrl) {
      document.getElementById("form-section").style.display = "none";
      return;
    }
    var container = document.getElementById("form-container");
    container.innerHTML = "";
    var iframe = document.createElement("iframe");
    iframe.className = "sp-form-section__iframe";
    iframe.src = cfg.formEmbedUrl;
    iframe.title = cfg.formHeading || "Submit a Presentation";
    container.appendChild(iframe);
  }

  // ── Init ──────────────────────────────────────────────────────

  var allItems = [];

  function init() {
    applyBranding();
    setupForm();

    if (!cfg.sheetCSVUrl) {
      document.getElementById("loading").textContent =
        cfg.noConfigMessage || "Configure sheetCSVUrl in config.js to load presentations.";
      return;
    }

    fetch(cfg.sheetCSVUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to fetch sheet");
        return res.text();
      })
      .then(function (text) {
        var rows = parseCSV(text);
        allItems = csvToObjects(rows);
        populateCategories(allItems);
        renderCards(allItems);

        document.getElementById("category-filter").addEventListener("change", function (e) {
          var val = e.target.value;
          var catKey = (col.category || "category").toLowerCase();
          var filtered = val ? allItems.filter(function (i) { return i[catKey] === val; }) : allItems;
          renderCards(filtered);
        });
      })
      .catch(function (err) {
        document.getElementById("loading").textContent =
          cfg.errorMessage || "Error loading presentations. Check the sheet URL and try again.";
        console.error("SheetPage fetch error:", err);
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
