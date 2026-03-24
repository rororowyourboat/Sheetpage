/**
 * SheetPage Configuration
 *
 * Data sources (checked in order):
 *   1. Google Sheets API — one spreadsheet = multi-page site (recommended)
 *   2. Google Drive folder — folders become cards
 *   3. Google Sheet CSV — single published sheet
 *
 * See TUTORIAL.md for full setup instructions.
 */
const SheetPageConfig = {

  // ── Google Sheets API (multi-page CMS) ────────────────────────
  // Each tab = a page. Tab "_settings" = site config.
  // Spreadsheet ID from URL: docs.google.com/spreadsheets/d/THIS_PART/edit
  spreadsheetId: "",
  apiKey: "",

  // ── Google Drive Folder ───────────────────────────────────────
  // driveFolderId: "",
  // driveApiKey: "",
  // driveLayout: "flat",    // "flat" | "categories" | "sections"

  // ── Published CSV ─────────────────────────────────────────────
  // sheetCSVUrl: "",
  // pageLayout: "grid",     // "grid" | "sections"

  // ── Google Form (optional) ────────────────────────────────────
  formEmbedUrl: "",

  // ── Site Branding (overridden by _settings tab) ───────────────
  siteTitle: "Team Presentations",
  siteSubtitle: "Browse and download team presentations",
  footerText: "Powered by Google Sheets",
  logoUrl: "",
  logoAlt: "",

  // ── Form Section ──────────────────────────────────────────────
  formHeading: "Submit a Presentation",
  formDescription: "Use the form below to add a new presentation to the collection.",

  // ── Column Mapping ────────────────────────────────────────────
  columns: {
    section: "section",
    sectionDescription: "section description",
    title: "title",
    description: "description",
    pdfLink: "link",
    linkText: "link text",
    thumbnail: "thumbnail",
    category: "category",
  },

  downloadLabel: "Download PDF",
  thumbnailPlaceholder: "\u{1F4C4}",
  cardMinWidth: "300px",

  // ── Messages ──────────────────────────────────────────────────
  emptyMessage: "No presentations found.",
  errorMessage: "Error loading. Check the configuration and try again.",
  noConfigMessage: "Configure a data source in config.js to load presentations.",
};
