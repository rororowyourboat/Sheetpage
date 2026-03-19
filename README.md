# SheetPage

> Turn a Google Sheet into a shareable presentation page — no code required.

A zero-build, zero-dependency webpage that reads from a published Google Sheet and renders a clean card grid with downloadable PDFs (via Google Drive links). Team members can submit new entries through an embedded Google Form.

<!-- Replace with an actual screenshot once deployed -->
<!-- ![SheetPage Screenshot](screenshot.png) -->

---

**New to SheetPage?** Read the full [Team Setup Tutorial](TUTORIAL.md) — covers everything from Google Sheet setup to custom domains and themes.

## Why SheetPage?

Most teams already use Google Sheets and Drive. SheetPage removes the friction of building a website — just fill in a spreadsheet, publish it, and deploy a static page. No backend, no database, no build tools.

## Features

- **Google Sheet as CMS** — edit a spreadsheet, the page updates on reload
- **PDF downloads** — Google Drive share links are auto-converted to direct downloads
- **Google Form submissions** — embedded form feeds back into the sheet
- **Category filtering** — optional dropdown filter when a Category column is present
- **Fully configurable** — branding, column names, labels, and messages in one `config.js`
- **Themeable** — modular CSS with custom properties (design tokens) for easy restyling
- **Zero dependencies** — plain HTML, CSS, and JS; no frameworks, no build step
- **Responsive** — works on desktop, tablet, and mobile

---

## Quick Start

### 1. Set up the Google Sheet

Create a new Google Sheet with these columns in the first row:

| Title | Description | PDF Link | Thumbnail | Category |
|-------|-------------|----------|-----------|----------|

| Column | Required | Description |
|--------|----------|-------------|
| **Title** | Yes | Presentation name |
| **Description** | Yes | Short summary shown on the card |
| **PDF Link** | Yes | Google Drive share link to the PDF file |
| **Thumbnail** | No | Image URL for the card preview |
| **Category** | No | Used for the dropdown filter |

### 2. Publish the Sheet as CSV

1. In Google Sheets, go to **File → Share → Publish to web**
2. Choose your sheet tab and select **Comma-separated values (.csv)**
3. Click **Publish** and copy the generated URL

### 3. Set up a Google Form *(optional)*

1. Create a Google Form with matching fields (Title, Description, PDF Link, etc.)
2. Link responses to the same sheet: **Responses tab → Link to Sheets**
3. Get the embed URL: **Send → embed icon** (`< >`) → copy the `src` from the iframe snippet

### 4. Configure

Open `config.js` and fill in your URLs:

```js
const SheetPageConfig = {
  sheetCSVUrl: "https://docs.google.com/spreadsheets/d/YOUR_ID/pub?output=csv",
  formEmbedUrl: "https://docs.google.com/forms/d/YOUR_ID/viewform?embedded=true",
  siteTitle: "My Team's Presentations",
  siteSubtitle: "Browse and download our latest decks",
};
```

See [`config.js`](config.js) for the full list of options (branding, column mapping, labels, etc.).

### 5. Deploy

**GitHub Pages:**
1. Push the repo to GitHub
2. Go to **Settings → Pages → Source** and select the `main` branch
3. Your site is live at `https://<user>.github.io/sheetpage/`

**Any static host:** Just upload the files — there's nothing to build.

---

## Project Structure

```
sheetpage/
├── index.html          Main page (loads config, script, and styles)
├── config.js           All user configuration
├── script.js           Core runtime — fetch, parse CSV, render cards
├── style.css           CSS entry point (imports modular components)
├── .gitignore
├── LICENSE
└── css/
    ├── variables.css   Design tokens — colors, spacing, type, shadows
    ├── base.css        Reset and body defaults
    ├── layout.css      Max-width container
    ├── header.css      Site header
    ├── filters.css     Category dropdown
    ├── cards.css       Card grid and individual card
    ├── form.css        Embedded form section
    └── footer.css      Site footer
```

---

## Customization

### Theming

All visual properties are defined as CSS custom properties in [`css/variables.css`](css/variables.css). Override them to restyle the entire site:

```css
:root {
  --color-accent: #e63946;
  --color-bg: #f1faee;
  --font-family: "Inter", sans-serif;
  --radius-lg: 0;            /* square cards */
  --card-min-width: 250px;   /* narrower cards */
}
```

### Column Mapping

If your sheet uses different column headers, remap them in `config.js`:

```js
columns: {
  title: "Presentation Name",
  description: "Summary",
  pdfLink: "File URL",
  thumbnail: "Preview Image",
  category: "Department",
}
```

Column matching is case-insensitive.

### Branding

All text on the page is configurable:

```js
siteTitle: "Engineering Resources",
siteSubtitle: "Internal presentations and documents",
footerText: "Maintained by the Engineering team",
logoUrl: "assets/logo.png",
logoAlt: "Our Team Logo",
downloadLabel: "Get PDF",
formHeading: "Add a Resource",
formDescription: "Submit a new document for the team.",
```

---

## Contributing

Contributions are welcome! To get started:

1. Fork this repository
2. Create a branch (`git checkout -b feature/my-change`)
3. Make your changes
4. Open a pull request

Please keep changes focused — one feature or fix per PR.

---

## License

[MIT](LICENSE)
