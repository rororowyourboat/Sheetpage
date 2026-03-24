/**
 * SheetPage — Core runtime
 *
 * Data sources (checked in order):
 *   1. Google Sheets API (spreadsheetId + apiKey)
 *      — Each tab = a page. Tab "_settings" = site config. Multi-page CMS.
 *   2. Google Drive folder (driveFolderId + driveApiKey)
 *      — Folders become cards. Supports flat / categories / sections layouts.
 *   3. Google Sheet CSV (sheetCSVUrl)
 *      — Single published sheet. Supports grid / sections layouts.
 *
 * Sheets API tab layout:
 *   Tab "_settings":  Setting | Value
 *   Content tabs:     Section | Section Description | Title | Description | Link | Link Text | Thumbnail
 */
(function () {
  "use strict";

  var cfg = window.SheetPageConfig || {};
  var col = cfg.columns || {};
  var allItems = [];

  // ── Utilities ─────────────────────────────────────────────────

  function colKey(name) { return (col[name] || name).toLowerCase(); }
  function field(item, key) { return item[(col[key] || key).toLowerCase()] || ""; }
  function stripPrefix(name) { return name.replace(/^\d+[\s.\-–—]+/, "").trim(); }

  function flatten(arrays) {
    var r = [];
    arrays.forEach(function (a) { a.forEach(function (b) { r.push(b); }); });
    return r;
  }

  function valuesToObjects(values) {
    if (!values || values.length < 2) return [];
    var headers = values[0].map(function (h) { return h.toLowerCase().trim(); });
    return values.slice(1)
      .filter(function (row) { return row.some(function (c) { return c && c.trim(); }); })
      .map(function (row) {
        var obj = {};
        headers.forEach(function (h, i) { obj[h] = (row[i] || "").trim(); });
        return obj;
      });
  }

  function toDriveDownloadURL(url) {
    if (!url) return "";
    var m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return "https://drive.google.com/uc?export=download&id=" + m[1];
    m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m) return "https://drive.google.com/uc?export=download&id=" + m[1];
    return url;
  }

  // ════════════════════════════════════════════════════════════════
  //  SOURCE 1: Google Sheets API
  // ════════════════════════════════════════════════════════════════

  var SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets/";

  function sheetsUrl(path, params) {
    var url = SHEETS_API + cfg.spreadsheetId + (path || "");
    var qs = ["key=" + encodeURIComponent(cfg.apiKey)];
    if (params) Object.keys(params).forEach(function (k) {
      qs.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
    });
    return url + "?" + qs.join("&");
  }

  function fetchSheetMeta() {
    return fetch(sheetsUrl("", { fields: "sheets.properties.title" }))
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d.error) throw new Error(d.error.message); return d.sheets.map(function (s) { return s.properties.title; }); });
  }

  function fetchSheetData(tabName) {
    return fetch(sheetsUrl("/values/" + encodeURIComponent(tabName)))
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d.error) throw new Error(d.error.message); return d.values || []; });
  }

  function parseSettings(values) {
    var s = {};
    (values || []).forEach(function (row) {
      if (row.length >= 2 && row[0]) s[row[0].toLowerCase().trim()] = row[1].trim();
    });
    return s;
  }

  function applySheetSettings(settings) {
    var map = {
      "brand name": "brandName", "site title": "siteTitle", "site subtitle": "siteSubtitle",
      "logo url": "logoUrl", "logo alt": "logoAlt", "footer text": "footerText",
      "download label": "downloadLabel", "form embed url": "formEmbedUrl",
      "form heading": "formHeading", "form description": "formDescription",
    };
    Object.keys(map).forEach(function (k) { if (settings[k]) cfg[map[k]] = settings[k]; });
  }

  function groupIntoSections(items) {
    var secCol = colKey("section"), secDescCol = colKey("sectionDescription");
    var sections = [], current = null;
    items.forEach(function (item) {
      var name = item[secCol] || "";
      if (!name) return;
      if (!current || current.name !== name) {
        current = { name: name, description: item[secDescCol] || "", items: [] };
        sections.push(current);
      } else if (!current.description && item[secDescCol]) {
        current.description = item[secDescCol];
      }
      if (item[colKey("title")]) current.items.push(item);
    });
    return sections;
  }

  function pageDescription(items) {
    var col2 = colKey("sectionDescription");
    for (var i = 0; i < items.length; i++) { if (items[i][col2]) return items[i][col2]; }
    return "";
  }

  function initSheetsMode() {
    fetchSheetMeta().then(function (tabs) {
      var settingsTab = tabs.filter(function (t) { return t.toLowerCase() === "_settings"; })[0];
      var contentTabs = tabs.filter(function (t) { return t.charAt(0) !== "_"; });

      var p = settingsTab
        ? fetchSheetData(settingsTab).then(function (v) { applySheetSettings(parseSettings(v)); })
        : Promise.resolve();

      return p.then(function () {
        applyBranding(); setupForm();
        function route() {
          var hash = decodeURIComponent(window.location.hash.slice(1));
          if (hash && contentTabs.indexOf(hash) !== -1) showPageContent(hash);
          else showPagesListing(contentTabs);
        }
        window.addEventListener("hashchange", route);
        route();
      });
    }).catch(function (err) {
      document.getElementById("loading").textContent = cfg.errorMessage || "Error loading.";
      console.error("Sheets API error:", err);
    });
  }

  function showPagesListing(tabs) {
    var container = document.getElementById("cards-container");
    container.innerHTML = ""; container.className = "";
    document.getElementById("filters").style.display = "none";
    var bc = document.getElementById("breadcrumb"); if (bc) bc.hidden = true;

    var titleEl = document.querySelector(".sp-header__title");
    var subEl = document.querySelector(".sp-header__subtitle");
    if (titleEl) titleEl.textContent = cfg.siteTitle || "Presentations";
    if (subEl) subEl.textContent = cfg.siteSubtitle || "";
    if (cfg.siteTitle) document.title = cfg.siteTitle;

    if (tabs.length === 0) {
      container.innerHTML = '<p class="sp-grid__message">No pages found.</p>'; return;
    }

    var grid = document.createElement("div");
    grid.className = "sp-pages-grid";

    Promise.all(tabs.map(function (tab) {
      return fetchSheetData(tab).then(function (v) {
        var items = valuesToObjects(v);
        return { name: tab, sections: groupIntoSections(items), items: items };
      }).catch(function () { return { name: tab, sections: [], items: [] }; });
    })).then(function (pages) {
      pages.forEach(function (page) {
        var card = document.createElement("a");
        card.className = "sp-page-card";
        card.href = "#" + encodeURIComponent(page.name);

        card.innerHTML =
          '<div class="sp-page-card__icon">\u{1F4CA}</div>' +
          '<div class="sp-page-card__title"></div>';
        card.querySelector(".sp-page-card__title").textContent = page.name;

        var desc = pageDescription(page.items);
        if (desc) {
          var d = document.createElement("div");
          d.className = "sp-page-card__desc"; d.textContent = desc;
          card.appendChild(d);
        }

        var meta = document.createElement("div");
        meta.className = "sp-page-card__meta";
        var sc = page.sections.length;
        var ec = page.items.filter(function (i) { return i[colKey("title")]; }).length;
        meta.textContent = sc + " section" + (sc !== 1 ? "s" : "") + " \u00B7 " + ec + " entr" + (ec !== 1 ? "ies" : "y") + " \u2192";
        card.appendChild(meta);

        grid.appendChild(card);
      });
      container.appendChild(grid);
    });
  }

  function showPageContent(tabName) {
    var container = document.getElementById("cards-container");
    container.innerHTML = '<p class="sp-grid__message">Loading...</p>';
    container.className = "";
    document.getElementById("filters").style.display = "none";
    var bc = document.getElementById("breadcrumb"); if (bc) bc.hidden = false;

    var titleEl = document.querySelector(".sp-header__title");
    var subEl = document.querySelector(".sp-header__subtitle");
    if (titleEl) titleEl.textContent = tabName;
    document.title = tabName + " \u2014 " + (cfg.brandName || cfg.siteTitle || "SheetPage");

    fetchSheetData(tabName).then(function (values) {
      var items = valuesToObjects(values);
      if (subEl) subEl.textContent = pageDescription(items);
      renderSections(groupIntoSections(items), container);
    }).catch(function (err) {
      container.innerHTML = '<p class="sp-grid__message">Error loading page.</p>';
      console.error(err);
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  SOURCE 2: Google Drive Folder
  // ════════════════════════════════════════════════════════════════

  var DRIVE_API = "https://www.googleapis.com/drive/v3/files";

  function driveQuery(folderId, extraQ) {
    var q = "'" + folderId + "' in parents and trashed=false";
    if (extraQ) q += " and " + extraQ;
    var params = ["q=" + encodeURIComponent(q), "key=" + encodeURIComponent(cfg.driveApiKey),
      "fields=" + encodeURIComponent("files(id,name,mimeType,description,createdTime)"),
      "pageSize=1000", "orderBy=" + encodeURIComponent("name")];
    return fetch(DRIVE_API + "?" + params.join("&"))
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d.error) throw new Error(d.error.message); return d.files || []; });
  }

  function driveThumbUrl(id) { return "https://drive.google.com/thumbnail?id=" + id + "&sz=w400"; }
  function driveDownloadUrl(id) { return "https://drive.google.com/uc?export=download&id=" + id; }
  function isImage(f) { return /^image\//.test(f.mimeType); }
  function isPdf(f) { return f.mimeType === "application/pdf"; }

  function folderToItem(folder, files, category) {
    var pdf = files.filter(isPdf)[0], image = files.filter(isImage)[0];
    var item = {};
    item[colKey("title")] = folder.name; item[colKey("description")] = folder.description || "";
    item[colKey("pdfLink")] = pdf ? driveDownloadUrl(pdf.id) : "";
    item[colKey("thumbnail")] = image ? driveThumbUrl(image.id) : (pdf ? driveThumbUrl(pdf.id) : "");
    if (category) item[colKey("category")] = category;
    return item;
  }

  function loadFromDrive() {
    var folderId = cfg.driveFolderId, layout = cfg.driveLayout || "flat";
    driveQuery(folderId, "mimeType='application/vnd.google-apps.folder'").then(function (folders) {
      if (folders.length === 0) return driveQuery(folderId, "mimeType='application/pdf'").then(function (pdfs) {
        onDataReady(pdfs.map(function (p) {
          var item = {}; item[colKey("title")] = p.name.replace(/\.pdf$/i, "");
          item[colKey("description")] = p.description || ""; item[colKey("pdfLink")] = driveDownloadUrl(p.id);
          item[colKey("thumbnail")] = driveThumbUrl(p.id); return item;
        }));
      });
      if (layout === "sections") return loadDriveSections(folders);
      if (layout === "categories") return loadDriveNested(folders, true).then(onDataReady);
      return loadDriveFlat(folders).then(onDataReady);
    }).catch(function (err) {
      document.getElementById("loading").textContent = cfg.errorMessage || "Error loading.";
      console.error(err);
    });
  }

  function loadDriveFlat(folders) {
    return Promise.all(folders.map(function (f) {
      return driveQuery(f.id).then(function (files) { return folderToItem(f, files); });
    }));
  }

  function loadDriveNested(parents, cat) {
    return Promise.all(parents.map(function (p) {
      return driveQuery(p.id, "mimeType='application/vnd.google-apps.folder'").then(function (pfs) {
        return Promise.all(pfs.map(function (pf) {
          return driveQuery(pf.id).then(function (files) { return folderToItem(pf, files, cat ? p.name : undefined); });
        }));
      });
    })).then(flatten);
  }

  function loadDriveSections(sfs) {
    Promise.all(sfs.map(function (sf) {
      return driveQuery(sf.id, "mimeType='application/vnd.google-apps.folder'").then(function (pfs) {
        return Promise.all(pfs.map(function (pf) {
          return driveQuery(pf.id).then(function (files) { return folderToItem(pf, files); });
        })).then(function (items) { return { name: stripPrefix(sf.name), description: sf.description || "", items: items }; });
      });
    })).then(function (secs) {
      renderSections(secs, document.getElementById("cards-container"));
      document.getElementById("filters").style.display = "none";
    });
  }

  // ════════════════════════════════════════════════════════════════
  //  SOURCE 3: Google Sheet CSV
  // ════════════════════════════════════════════════════════════════

  function parseCSV(text) {
    var rows = [], current = "", inQuotes = false, row = [];
    for (var i = 0; i < text.length; i++) {
      var ch = text[i], next = text[i + 1];
      if (inQuotes) { if (ch === '"' && next === '"') { current += '"'; i++; } else if (ch === '"') inQuotes = false; else current += ch; }
      else { if (ch === '"') inQuotes = true; else if (ch === ",") { row.push(current.trim()); current = ""; }
        else if (ch === "\n" || (ch === "\r" && next === "\n")) { row.push(current.trim()); current = "";
          if (row.length > 1 || row[0] !== "") rows.push(row); row = []; if (ch === "\r") i++; }
        else current += ch; }
    }
    row.push(current.trim()); if (row.length > 1 || row[0] !== "") rows.push(row); return rows;
  }

  function csvToObjects(rows) {
    if (rows.length < 2) return [];
    var headers = rows[0].map(function (h) { return h.toLowerCase().trim(); });
    return rows.slice(1).map(function (row) {
      var obj = {}; headers.forEach(function (h, i) { obj[h] = row[i] || ""; }); return obj;
    });
  }

  function loadFromSheet() {
    fetch(cfg.sheetCSVUrl).then(function (r) { if (!r.ok) throw new Error("Fetch failed"); return r.text(); })
      .then(function (text) {
        var items = csvToObjects(parseCSV(text));
        if ((cfg.pageLayout || "grid") === "sections") {
          var catKey2 = colKey("category"), secs = [], map = {};
          items.forEach(function (item) {
            var n = item[catKey2] || "Other";
            if (!map[n]) { map[n] = { name: n, description: "", items: [] }; secs.push(map[n]); }
            map[n].items.push(item);
          });
          renderSections(secs, document.getElementById("cards-container"));
          document.getElementById("filters").style.display = "none";
        } else onDataReady(items);
      }).catch(function (err) {
        document.getElementById("loading").textContent = cfg.errorMessage || "Error loading.";
        console.error(err);
      });
  }

  // ════════════════════════════════════════════════════════════════
  //  RENDERING
  // ════════════════════════════════════════════════════════════════

  function createCard(item) {
    var card = document.createElement("div"); card.className = "sp-card";
    var category = field(item, "category"), title = field(item, "title"),
      description = field(item, "description"), thumbnail = field(item, "thumbnail"),
      pdfLink = field(item, "pdfLink") || field(item, "link"),
      linkText = field(item, "linkText");
    if (category) card.dataset.category = category;

    if (thumbnail) {
      var img = document.createElement("img"); img.className = "sp-card__thumb";
      img.src = thumbnail; img.alt = title || "Thumbnail"; img.loading = "lazy"; card.appendChild(img);
    } else {
      var ph = document.createElement("div"); ph.className = "sp-card__thumb-placeholder";
      ph.textContent = cfg.thumbnailPlaceholder || "\u{1F4C4}"; card.appendChild(ph);
    }

    var body = document.createElement("div"); body.className = "sp-card__body";
    if (category) { var cat = document.createElement("span"); cat.className = "sp-card__category"; cat.textContent = category; body.appendChild(cat); }
    if (title) { var h3 = document.createElement("h3"); h3.className = "sp-card__title"; h3.textContent = title; body.appendChild(h3); }
    if (description) { var desc = document.createElement("p"); desc.className = "sp-card__desc"; desc.textContent = description; body.appendChild(desc); }
    if (pdfLink) {
      var link = document.createElement("a"); link.className = "sp-card__download";
      link.href = toDriveDownloadURL(pdfLink); link.target = "_blank"; link.rel = "noopener noreferrer";
      link.textContent = linkText || cfg.downloadLabel || "Download PDF"; body.appendChild(link);
    }
    card.appendChild(body); return card;
  }

  function renderCards(items, container) {
    container.innerHTML = ""; container.className = "sp-grid";
    if (items.length === 0) { container.innerHTML = '<p class="sp-grid__message">' + (cfg.emptyMessage || "No presentations found.") + '</p>'; return; }
    items.forEach(function (item) { container.appendChild(createCard(item)); });
  }

  function renderSections(sections, container) {
    container.innerHTML = ""; container.className = "";
    if (sections.length === 0) { container.innerHTML = '<p class="sp-grid__message">' + (cfg.emptyMessage || "No presentations found.") + '</p>'; return; }
    sections.forEach(function (section) {
      var el = document.createElement("section"); el.className = "sp-section";
      var heading = document.createElement("h2"); heading.className = "sp-section__title"; heading.textContent = section.name; el.appendChild(heading);
      if (section.description) { var d = document.createElement("p"); d.className = "sp-section__desc"; d.textContent = section.description; el.appendChild(d); }
      if (section.items.length === 0) { var m = document.createElement("p"); m.className = "sp-section__empty"; m.textContent = "No presentations in this section yet."; el.appendChild(m); }
      else { var grid = document.createElement("div"); grid.className = "sp-grid"; section.items.forEach(function (item) { grid.appendChild(createCard(item)); }); el.appendChild(grid); }
      container.appendChild(el);
    });
  }

  function onDataReady(items) {
    allItems = items;
    var container = document.getElementById("cards-container");
    renderCards(allItems, container); populateCategories(allItems);
    document.getElementById("category-filter").addEventListener("change", function (e) {
      var val = e.target.value, catKey2 = (col.category || "category").toLowerCase();
      renderCards(val ? allItems.filter(function (i) { return i[catKey2] === val; }) : allItems, container);
    });
  }

  function populateCategories(items) {
    var select = document.getElementById("category-filter");
    var catKey2 = (col.category || "category").toLowerCase(), categories = [], seen = {};
    items.forEach(function (item) { var c = item[catKey2]; if (c && !seen[c]) { seen[c] = true; categories.push(c); } });
    if (categories.length === 0) { document.getElementById("filters").style.display = "none"; return; }
    categories.sort();
    categories.forEach(function (cat) { var o = document.createElement("option"); o.value = cat; o.textContent = cat; select.appendChild(o); });
  }

  // ════════════════════════════════════════════════════════════════
  //  BRANDING & INIT
  // ════════════════════════════════════════════════════════════════

  function applyBranding() {
    var titleEl = document.querySelector(".sp-header__title");
    var subEl = document.querySelector(".sp-header__subtitle");
    var footerEl = document.querySelector(".sp-footer p");
    var formH = document.querySelector(".sp-form-section__heading");
    var formD = document.querySelector(".sp-form-section__desc");

    if (cfg.siteTitle && titleEl) titleEl.textContent = cfg.siteTitle;
    if (cfg.siteSubtitle && subEl) subEl.textContent = cfg.siteSubtitle;
    if (cfg.footerText && footerEl) footerEl.textContent = cfg.footerText;
    if (cfg.formHeading && formH) formH.textContent = cfg.formHeading;
    if (cfg.formDescription && formD) formD.textContent = cfg.formDescription;

    var logoEl = document.getElementById("site-logo");
    if (cfg.logoUrl && logoEl) { logoEl.src = cfg.logoUrl; logoEl.alt = cfg.logoAlt || "Logo"; logoEl.hidden = false; }
    if (cfg.siteTitle) document.title = cfg.siteTitle;
    if (cfg.cardMinWidth) document.documentElement.style.setProperty("--card-min-width", cfg.cardMinWidth);
  }

  function setupForm() {
    if (!cfg.formEmbedUrl) { document.getElementById("form-section").style.display = "none"; return; }
    var c = document.getElementById("form-container"); c.innerHTML = "";
    var iframe = document.createElement("iframe"); iframe.className = "sp-form-section__iframe";
    iframe.src = cfg.formEmbedUrl; iframe.title = cfg.formHeading || "Submit"; c.appendChild(iframe);
  }

  function init() {
    var hasSheetsApi = cfg.spreadsheetId && cfg.apiKey;
    var hasDrive = cfg.driveFolderId && cfg.driveApiKey;
    var hasCSV = cfg.sheetCSVUrl;

    if (hasSheetsApi) { initSheetsMode(); }
    else if (hasDrive) { applyBranding(); setupForm(); loadFromDrive(); }
    else if (hasCSV) { applyBranding(); setupForm(); loadFromSheet(); }
    else { applyBranding(); setupForm(); document.getElementById("loading").textContent = cfg.noConfigMessage || "Configure a data source in config.js."; }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
