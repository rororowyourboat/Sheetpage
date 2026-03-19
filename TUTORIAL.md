# SheetPage — Team Setup Tutorial

This guide walks your team through setting up your own SheetPage instance with custom branding, theme, and content.

---

## Table of Contents

1. [Overview](#overview)
2. [Step 1: Fork or Clone the Repo](#step-1-fork-or-clone-the-repo)
3. [Step 2: Set Up the Google Sheet](#step-2-set-up-the-google-sheet)
4. [Step 3: Publish the Sheet](#step-3-publish-the-sheet)
5. [Step 4: Set Up a Google Form (Optional)](#step-4-set-up-a-google-form-optional)
6. [Step 5: Add Your Branding](#step-5-add-your-branding)
7. [Step 6: Customize the Theme](#step-6-customize-the-theme)
8. [Step 7: Add a Logo](#step-7-add-a-logo)
9. [Step 8: Customize Column Names](#step-8-customize-column-names)
10. [Step 9: Deploy to GitHub Pages](#step-9-deploy-to-github-pages)
11. [Step 10: Keep It Updated](#step-10-keep-it-updated)
12. [Theme Gallery](#theme-gallery)
13. [Troubleshooting](#troubleshooting)

---

## Overview

SheetPage turns a Google Sheet into a live webpage. Here's the flow:

```
Google Sheet (your content)
    ↓  published as CSV
SheetPage (fetches + renders)
    ↓  hosted on GitHub Pages
Your team's webpage (cards with PDF downloads)
    ↑
Google Form (optional — team submits new entries)
```

**No coding is required** for basic setup. Everything is configured by editing `config.js` and optionally tweaking CSS variables.

---

## Step 1: Fork or Clone the Repo

**Option A — Fork (recommended for teams):**

1. Go to the [SheetPage repository](https://github.com/rororowyourboat/Sheetpage)
2. Click **Fork** in the top-right corner
3. This creates a copy under your GitHub account

**Option B — Clone locally:**

```bash
git clone https://github.com/rororowyourboat/Sheetpage.git my-team-page
cd my-team-page
```

---

## Step 2: Set Up the Google Sheet

Create a new Google Sheet and add these column headers in **row 1**:

| Title | Description | PDF Link | Thumbnail | Category |
|-------|-------------|----------|-----------|----------|

Then fill in your data starting from row 2:

| Title | Description | PDF Link | Thumbnail | Category |
|-------|-------------|----------|-----------|----------|
| Q1 Strategy Deck | Overview of Q1 goals and KPIs | https://drive.google.com/file/d/abc123/view | https://i.imgur.com/example.png | Strategy |
| Product Roadmap | 2026 product roadmap | https://drive.google.com/file/d/def456/view | | Product |
| Onboarding Guide | New hire orientation slides | https://drive.google.com/file/d/ghi789/view | | HR |

**Tips:**
- **PDF Link** should be a Google Drive share link. SheetPage auto-converts it to a direct download URL.
- **Thumbnail** is optional — cards without one show a placeholder icon.
- **Category** is optional — if present, a filter dropdown appears on the page.
- Column headers are **case-insensitive** (`PDF Link`, `pdf link`, and `PDF LINK` all work).

---

## Step 3: Publish the Sheet

1. Open your Google Sheet
2. Go to **File → Share → Publish to web**
3. In the dropdown, select **your sheet tab** (e.g., "Sheet1")
4. Change the format to **Comma-separated values (.csv)**
5. Click **Publish**
6. Copy the URL — it looks like:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/pub?gid=0&single=true&output=csv
   ```

> **Important:** The sheet must be published (not just shared). Published means anyone with the link can read the CSV data.

---

## Step 4: Set Up a Google Form (Optional)

A Google Form lets team members submit new presentations without editing the sheet directly.

1. Go to [Google Forms](https://docs.google.com/forms) and create a new form
2. Add fields that match your sheet columns:
   - **Title** (Short answer)
   - **Description** (Paragraph)
   - **PDF Link** (Short answer — the Google Drive share link)
   - **Thumbnail** (Short answer — optional, image URL)
   - **Category** (Dropdown or Short answer)
3. Click the **Responses** tab → **Link to Sheets** → select your existing sheet
4. To get the embed URL:
   - Click **Send** (top right)
   - Click the **embed icon** (`< >`)
   - Copy the URL from the `src="..."` attribute in the iframe code

The URL looks like:
```
https://docs.google.com/forms/d/e/FORM_ID/viewform?embedded=true
```

---

## Step 5: Add Your Branding

Open `config.js` and customize the text:

```js
const SheetPageConfig = {
  // Your data sources
  sheetCSVUrl: "https://docs.google.com/spreadsheets/d/.../pub?output=csv",
  formEmbedUrl: "https://docs.google.com/forms/d/.../viewform?embedded=true",

  // Branding — change these to match your team
  siteTitle: "Engineering Presentations",
  siteSubtitle: "Decks, docs, and resources from the engineering team",
  footerText: "Maintained by the Engineering team",

  // Form section text
  formHeading: "Share a Presentation",
  formDescription: "Have a deck to share? Submit it below and it will appear on this page.",

  // Download button label
  downloadLabel: "Download PDF",
};
```

All text on the page comes from `config.js` — you never need to edit `index.html`.

---

## Step 6: Customize the Theme

All visual styling is controlled by CSS custom properties (design tokens) in `css/variables.css`. You can override any of these without touching the component CSS files.

### Change colors

Open `css/variables.css` and edit the color values:

```css
:root {
  --color-bg: #f5f5f7;              /* Page background */
  --color-surface: #ffffff;          /* Card and header background */
  --color-text: #1d1d1f;            /* Primary text */
  --color-text-secondary: #6e6e73;  /* Descriptions, subtitles */
  --color-accent: #0071e3;          /* Buttons, category labels */
  --color-accent-hover: #005bb5;    /* Button hover state */
  --color-border: #e0e0e0;          /* Dividers */
}
```

### Change fonts

```css
:root {
  /* Use Google Fonts — add the <link> in index.html's <head> */
  --font-family: "Inter", sans-serif;
}
```

To use a Google Font, add this to `index.html` before the `style.css` link:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Change card appearance

```css
:root {
  --card-min-width: 250px;          /* Narrower cards = more columns */
  --card-thumb-height: 200px;       /* Taller thumbnails */
  --radius-lg: 16px;                /* Rounder card corners */
  --radius-lg: 0;                   /* Square card corners */
  --shadow-card: none;              /* Flat cards, no shadow */
}
```

### Change spacing

```css
:root {
  --space-lg: 2rem;                 /* More space between cards */
  --max-width: 1400px;              /* Wider page */
}
```

---

## Step 7: Add a Logo

1. Place your logo image in the repo (e.g., `assets/logo.png`) or use an external URL
2. Set it in `config.js`:

```js
logoUrl: "assets/logo.png",
logoAlt: "Acme Corp Logo",
```

3. Adjust the logo size in `css/variables.css`:

```css
:root {
  --logo-height: 80px;   /* Make the logo taller */
}
```

**Supported formats:** PNG, SVG, JPG, WebP, or any image URL.

---

## Step 8: Customize Column Names

If your Google Sheet uses different column headers (e.g., in another language or with different naming conventions), remap them in `config.js`:

```js
columns: {
  title: "Presentation Name",
  description: "Summary",
  pdfLink: "Download URL",
  thumbnail: "Preview Image",
  category: "Department",
}
```

The values must match your sheet's column headers exactly (case-insensitive).

**Example:** If your sheet looks like this:

| Presentation Name | Summary | Download URL | Department |
|-------------------|---------|--------------|------------|
| Q1 Review | ... | https://drive.google.com/... | Sales |

Then your config would be:

```js
columns: {
  title: "Presentation Name",
  description: "Summary",
  pdfLink: "Download URL",
  category: "Department",
}
```

---

## Step 9: Deploy to GitHub Pages

1. Push your changes to GitHub:
   ```bash
   git add -A
   git commit -m "Configure SheetPage for our team"
   git push
   ```

2. In your GitHub repo, go to **Settings → Pages**

3. Under **Source**, select **Deploy from a branch**

4. Choose the **main** branch and **/ (root)** folder

5. Click **Save**

6. Your site will be live in ~1 minute at:
   ```
   https://<your-username>.github.io/<repo-name>/
   ```

### Custom domain (optional)

Want your page at `presentations.yourteam.com` instead of `username.github.io`? Here's how:

**A. Add the domain in GitHub:**

1. Go to your repo's **Settings → Pages**
2. Under **Custom domain**, type your domain (e.g., `presentations.yourteam.com`)
3. Click **Save**

**B. Create a CNAME file:**

Add a file called `CNAME` (no extension) to the root of your repo with just your domain:

```
presentations.yourteam.com
```

**C. Configure DNS with your domain provider:**

Go to your domain registrar (Cloudflare, Namecheap, Google Domains, etc.) and add a DNS record:

For a **subdomain** (e.g., `presentations.yourteam.com`):
| Type  | Name           | Value                        |
|-------|----------------|------------------------------|
| CNAME | presentations  | your-username.github.io      |

For an **apex domain** (e.g., `yourteam.com`):
| Type | Name | Value            |
|------|------|------------------|
| A    | @    | 185.199.108.153  |
| A    | @    | 185.199.109.153  |
| A    | @    | 185.199.110.153  |
| A    | @    | 185.199.111.153  |

**D. Enable HTTPS:**

1. After DNS propagates (can take up to 24 hours), go back to **Settings → Pages**
2. Check **Enforce HTTPS**

**E. Verify it works:**

Visit your custom domain. If you see your SheetPage, you're done.

> **Tip:** DNS changes can take up to 24-48 hours to propagate, but usually it's much faster (5-30 minutes). You can check progress at [dnschecker.org](https://dnschecker.org).

---

## Step 10: Keep It Updated

The page fetches fresh data from the Google Sheet **every time someone loads it**. So:

- **To add a presentation:** Add a row to the sheet (or submit via the Google Form)
- **To remove one:** Delete the row from the sheet
- **To edit one:** Edit the cell in the sheet

No redeployment needed — changes appear on the next page load.

---

## Theme Gallery

Here are some starter themes you can copy into `css/variables.css`:

### Dark Mode

```css
:root {
  --color-bg: #1a1a2e;
  --color-surface: #16213e;
  --color-text: #eaeaea;
  --color-text-secondary: #a0a0b0;
  --color-text-muted: #6e6e80;
  --color-accent: #e94560;
  --color-accent-hover: #c73650;
  --color-border: #2a2a4a;
  --color-placeholder-bg: #1f2740;
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-card-hover: 0 8px 24px rgba(0, 0, 0, 0.4);
}
```

### Warm / Earthy

```css
:root {
  --color-bg: #faf3e0;
  --color-surface: #ffffff;
  --color-text: #2d2013;
  --color-text-secondary: #7a6852;
  --color-accent: #d4770b;
  --color-accent-hover: #b5640a;
  --color-border: #e8dcc8;
  --color-placeholder-bg: #f0e6d2;
  --radius-lg: 8px;
}
```

### Minimal / Monochrome

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #fafafa;
  --color-text: #111111;
  --color-text-secondary: #666666;
  --color-accent: #111111;
  --color-accent-hover: #333333;
  --color-border: #eeeeee;
  --color-placeholder-bg: #f5f5f5;
  --radius-lg: 0;
  --shadow-card: none;
  --shadow-card-hover: 0 1px 4px rgba(0, 0, 0, 0.08);
}
```

### Ocean Blue

```css
:root {
  --color-bg: #e8f4f8;
  --color-surface: #ffffff;
  --color-text: #0d3b66;
  --color-text-secondary: #3a7ca5;
  --color-accent: #f4845f;
  --color-accent-hover: #d6724f;
  --color-border: #c8dfe6;
  --color-placeholder-bg: #d4eaf0;
}
```

---

## Troubleshooting

### Cards aren't loading

- **Check the sheet URL:** Open the `sheetCSVUrl` in your browser. You should see raw CSV text. If you see an error or HTML page, the sheet isn't published correctly.
- **Check the browser console:** Open DevTools (F12) → Console tab. Look for fetch errors.
- **CORS issues:** Google Sheets published CSV should work from any domain. If you see CORS errors, double-check the URL format.

### Form isn't showing

- Make sure `formEmbedUrl` is set in `config.js`
- The URL should end with `?embedded=true`
- Test the URL directly in your browser to verify it loads

### PDF download opens a preview instead of downloading

- Make sure the Google Drive file is shared (at minimum "Anyone with the link can view")
- SheetPage auto-converts Drive links to direct download format

### Categories aren't showing

- The filter dropdown only appears if at least one row has a value in the Category column
- Check that your `columns.category` in config matches the actual column header in your sheet

### Changes to the sheet aren't appearing

- Published Google Sheets can have a few minutes of cache delay
- Try a hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Verify the sheet is still published: File → Share → Publish to web → check status

### Logo isn't showing

- Check the path is correct relative to `index.html` (e.g., `assets/logo.png`)
- If using an external URL, make sure it's accessible (not behind authentication)
- Check browser console for 404 errors
