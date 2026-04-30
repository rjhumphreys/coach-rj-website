# How to edit your site, RJ

Your site is just a folder of files on GitHub. Editing it is like editing a Google Doc — click, type, save. The site rebuilds itself automatically about 60 seconds after you save.

You can do everything below from the GitHub website on your phone or laptop. You never need to install anything.

## Three things you'll do most

### 1. Fix a typo or update a paragraph

1. Go to your repo on **github.com**.
2. Click the file you want to fix:
   - Bio? → `src/about.md`
   - Homepage text? → `src/index.md`
   - Contact info? → `src/contact.md`
3. Click the **pencil icon** (top right of the file view) to edit.
4. Make your change.
5. Scroll to the bottom → **"Commit changes"** → **"Commit changes"** again.

That's it. The site rebuilds itself in about a minute.

### 2. Add a new write-up to the Work page

Each project on your Work page is one Markdown file in `src/work/`.

To add a new one:

1. Go to `src/work/` on github.com.
2. Click **"Add file" → "Create new file"**.
3. Name it something like `my-new-article.md` (lowercase, dashes, no spaces).
4. At the top of the file, paste this template and fill it in:

   ```markdown
   ---
   layout: layouts/work-item.njk
   title: My New Article Title
   summary: One sentence describing what it's about.
   tag: Article
   date: 2026-04-30
   image: /assets/images/some-photo.jpg
   file: /files/some-pdf.pdf
   ---

   Write whatever you want here in plain English. You can use **bold**,
   *italics*, headings (start a line with ##), and bullet lists
   (start a line with - ).
   ```

5. Below the template, write the body of your article.
6. Scroll down → **"Commit new file"**.

The Work page picks it up automatically. No template editing needed.

**Tip:** The easiest way is to find an existing file in `src/work/` (like `velocity-based-training.md`), copy what's at the top, and replace the values.

### 3. Add a photo or PDF

1. Go to `src/assets/images/` (for photos) or `src/files/` (for PDFs) on github.com.
2. Click **"Add file" → "Upload files"**.
3. Drag your file in.
4. Scroll down → **"Commit changes"**.
5. Reference it in any page by writing `/assets/images/your-photo.jpg` or `/files/your-doc.pdf`.

## What if you break something?

You can't break anything permanently. Every change is recorded.

To undo:

1. Go to your repo on github.com.
2. Click **"Commits"** at the top of the file list.
3. Find the commit just before the bad one.
4. Click the `<>` icon next to it ("Browse repository at this point").
5. Find the file, view it, click **"Raw"**, copy the contents.
6. Edit the live file and paste over its contents. Commit.

Or just ask Ryan — every version is saved forever.

## Markdown cheat sheet

```markdown
# Big heading
## Section heading
### Subsection

Regular paragraph text.

**bold** and *italic*

- bullet point
- another bullet

[link text](https://example.com)

![photo description](/assets/images/photo.jpg)
```

## What you don't touch

These are the bones of the site — Ryan handles them:

- `_includes/` (templates)
- `assets/styles.css` (visual design)
- `.eleventy.js`, `package.json`, `package-lock.json`
- `.github/workflows/`

If something looks off there, ping Ryan rather than editing.

---

## For the developer (Ryan)

```bash
npm install
npm run serve   # http://localhost:8080 with live reload
npm run build   # produces _site/
```

Deploy is via `.github/workflows/deploy.yml` — push to `main` and GitHub Actions builds + publishes to Pages.

Repo currently lives in Ryan's account; transfer to RJ when ready. To enable Pages: Settings → Pages → Source: "GitHub Actions". After first successful deploy, the URL appears at the top of Settings → Pages.

Custom domain: Add a `CNAME` file at the repo root containing the bare domain (e.g. `coachrjhumphreys.com`), then point an `A`/`CNAME` DNS record at GitHub Pages per the [docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

Design spec: `docs/superpowers/specs/2026-04-30-rj-website-design.md`.
