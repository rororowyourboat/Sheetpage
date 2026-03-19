/**
 * SheetPage Configuration
 *
 * All site settings in one place. Copy this file to get started,
 * then fill in your Google Sheet and Form URLs.
 */
const SheetPageConfig = {
  // ── Data Source ──────────────────────────────────────────────
  // Google Sheets: File → Share → Publish to web → CSV format
  sheetCSVUrl: "",

  // ── Google Form (optional) ──────────────────────────────────
  // Google Forms: Send → Embed icon (<>) → copy the src URL
  // Leave empty to hide the submission form.
  formEmbedUrl: "",

  // ── Site Branding ───────────────────────────────────────────
  siteTitle: "Team Presentations",
  siteSubtitle: "Browse and download team presentations",
  footerText: "Powered by Google Sheets",

  // Path or URL to a logo image. Leave empty for no logo.
  logoUrl: "",
  // Alt text for the logo (for accessibility)
  logoAlt: "",

  // ── Form Section ────────────────────────────────────────────
  formHeading: "Submit a Presentation",
  formDescription: "Use the form below to add a new presentation to the collection.",

  // ── Card Display ────────────────────────────────────────────
  // Column names in your Google Sheet (case-insensitive).
  // Change these if your sheet uses different header names.
  columns: {
    title: "title",
    description: "description",
    pdfLink: "pdf link",
    thumbnail: "thumbnail",
    category: "category",
  },

  // Label for the download button
  downloadLabel: "Download PDF",

  // Placeholder emoji when no thumbnail is provided
  thumbnailPlaceholder: "\u{1F4C4}",

  // ── Layout ──────────────────────────────────────────────────
  // Minimum card width in the grid (CSS value)
  cardMinWidth: "300px",

  // ── Messages ────────────────────────────────────────────────
  loadingMessage: "Loading presentations\u2026",
  emptyMessage: "No presentations found.",
  errorMessage: "Error loading presentations. Check the sheet URL and try again.",
  noConfigMessage: "Configure sheetCSVUrl in config.js to load presentations.",
};
