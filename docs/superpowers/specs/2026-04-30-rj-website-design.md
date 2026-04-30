# Coach RJ Website — Design

**Status:** Draft for review
**Date:** 2026-04-30
**Author:** Ryan Swope (with Claude)
**Subject:** A static personal website for Raymond J. Humphreys ("Coach RJ"), replacing his current Wix site at `raymondhumphreys.wixsite.com/professional-portfol`.

---

## Goals

1. **Look more professional** — the current Wix-templated look is hurting RJ's credibility.
2. **Help him land work** — primary audience is private and online coaching clients (athletes and parents); secondary audience is institutional hires (athletic departments, head coaches).
3. **Editable by RJ without local tooling** — he edits Markdown files via GitHub's web UI; Ryan or Copilot can help with templates, CSS, or larger restructures.
4. **Simple v1, room to grow** — port existing content cleanly. Add testimonials, services pages, blog, contact form, etc. later.

## Non-goals

- No backend, server, or database. Static site only.
- No email/contact form server (mailto link only for v1).
- No CMS layer (no Decap, Netlify CMS, etc.). RJ edits Markdown directly.
- No new content beyond what the Wix site has — modernize what exists.
- No custom domain in v1 (supported by the architecture; can be added later).

## Audience

| Audience | Priority | What they want |
|---|---|---|
| Private/individual athletes & parents | Primary | Personality, results, "what working with you is like," easy contact |
| Online/remote coaching clients | Primary | Trust signals, credentials, easy contact path |
| Athletic departments / head coaches | Secondary | Credentials, philosophy, programming samples, references |

The site should feel warm and personal first, professional and credentialed second — not the other way around.

## Visual direction

Warm, approachable, photo-forward. Anchored in RJ's outdoor / mountain-sports background (Stratton Mountain School). Reads "trusted coach you'd actually want to work with" rather than "academic CV" or "performance-brand boot camp."

### Palette

| Token | Hex | Usage |
|---|---|---|
| Cream | `#f7f2e7` | Page background |
| Sage | `#4a6b5e` | Primary brand: CTAs, accents, links |
| Ink | `#1f1d18` | Body text, headings |
| Stone | `#a89d8a` | Borders, dividers, muted text |
| Clay | `#b87148` | Sparingly — hover states or one accent flourish |

### Typography

- **Display & headings:** Fraunces (Google Fonts), weight 500
- **Body & UI:** Inter (Google Fonts), weights 400 and 500
- Both self-hosted via the 11ty build (or via Google Fonts CDN — decide in implementation).

### Imagery

- 3:2 aspect ratio for all hero/card photos.
- Soft 6px corner radius.
- Hero photo on home is full-bleed half-width (mountain or training shot).
- Project cards each get one hero photo.
- All photos sourced from RJ's existing Wix site for v1; he can swap them later by uploading replacements via the GitHub web UI.
- 11ty image plugin generates responsive WebP/AVIF variants automatically.

## Site architecture

### Pages

1. **Home (`/`)**
   - Hero: name + tagline ("Helping Everyone Reach Their Peak"), 2–3 sentence intro, primary CTA ("Get in touch")
   - Hero photo (mountain or training shot)
   - Three CTA tiles linking to About / Work / Contact
   - One philosophy quote ("Educate · Empower · Embrace" or values triplet)

2. **About (`/about`)**
   - Full bio
   - Coaching philosophy (passion/energy, autonomy, education focus)
   - Core values (consistency over intensity, enjoyment over ego, process over outcome)
   - Education (BS Exercise Science, current MS in Strength & Conditioning)
   - Work experience (Stratton Mountain School, Colby-Sawyer College)
   - One or two photos

3. **Work (`/work`)**
   - Index page automatically lists every Markdown file in `src/work/`
   - CAP project featured at top with prominent download link
   - Other projects/papers as cards (Rock Climber Case Study, Velocity Based Training, Rep/Load Continuum, Annual Planning Templates)
   - Each project has a detail page (`/work/<slug>`) with body content + optional PDF link

4. **Contact (`/contact`)**
   - Email link (mailto)
   - Instagram link (`@rj_fast`)
   - Downloadable resume PDF
   - Brief invitation/intro text

### Navigation

- **Header:** "Coach RJ" on the left, "About / Work / Contact" on the right. Mobile collapses to hamburger.
- **Footer:** Email, social links, copyright, "Educate · Empower · Embrace" tagline.

### Why multi-page (not single-page scroll)

- Single-page scroll buries projects, which matter for the institutional audience.
- Adding a new project is just dropping in a Markdown file — no scroll-section restructuring.
- Multi-page is more crawlable for SEO if RJ wants that later.
- Each audience can land on a focused page (`/work` for institutions, `/contact` for athletes).

## Technical architecture

### Stack

- **Static site generator:** Eleventy (11ty)
- **Templating:** Nunjucks
- **Styling:** Plain CSS (no Tailwind, no preprocessor for v1) in `src/assets/styles.css`
- **Content:** Markdown with YAML frontmatter
- **Image processing:** `@11ty/eleventy-img` plugin for responsive WebP/AVIF generation
- **Hosting:** GitHub Pages
- **Build & deploy:** GitHub Actions workflow, runs on every push to `main`

### Why 11ty over Jekyll or Astro

| Criterion | Jekyll | **11ty (chosen)** | Astro |
|---|---|---|---|
| Setup complexity | Lowest (native on GH Pages) | Low (one Actions workflow) | Higher (Node framework) |
| Image optimization | Manual / plugin gymnastics | First-class plugin | First-class |
| Editing UX for RJ | Identical (edit `.md`) | Identical (edit `.md`) | Identical |
| Modern tooling | Dated (Ruby, Liquid) | Modern, minimal JS | Modern, framework-y |
| Right-sized for v1 | A bit dated | ✓ Sweet spot | Overkill |

The image-handling matters because the site is photo-forward and RJ shouldn't have to think about file sizes.

### Repository structure

```
rj-website/
├── .github/workflows/deploy.yml   # Build + publish on push to main
├── .eleventy.js                   # 11ty config
├── package.json
├── README.md                      # "How to edit your site" — written for RJ
├── docs/superpowers/specs/        # Design docs (this file)
└── src/
    ├── _data/site.json            # name, email, socials, tagline
    ├── _includes/
    │   ├── layouts/
    │   │   ├── base.njk           # HTML shell
    │   │   ├── page.njk           # Standard page
    │   │   └── work-item.njk      # Project detail page
    │   └── partials/
    │       ├── header.njk
    │       └── footer.njk
    ├── assets/
    │   ├── images/                # Photos go here
    │   └── styles.css
    ├── files/                     # PDFs (CAP, resume, write-ups)
    ├── index.md                   # Home
    ├── about.md                   # About
    ├── contact.md                 # Contact
    ├── work.md                    # Work index (auto-lists work/*.md)
    └── work/                      # One Markdown file per project
        ├── cap-project.md
        ├── rock-climber-case-study.md
        ├── velocity-based-training.md
        ├── rep-load-continuum.md
        └── annual-planning-templates.md
```

### Content model

Each project file uses YAML frontmatter for structured fields and Markdown for prose:

```markdown
---
title: Velocity Based Training
summary: Applying VBT to collegiate strength programs.
date: 2024-09-01
file: /files/vbt.pdf            # optional PDF download
image: /assets/images/vbt.jpg   # optional cover image
order: 2                         # optional manual ordering
---

Long-form body in Markdown. Headings with ##, **bold**, lists, links.
```

The `work.md` page enumerates `src/work/*.md` automatically, sorted by `date` (or `order` when set). Adding a new write-up = uploading one Markdown file. No template editing.

`src/_data/site.json` holds site-wide values RJ might want to change without touching pages:

```json
{
  "name": "Coach RJ",
  "fullName": "Raymond J. Humphreys",
  "tagline": "Helping Everyone Reach Their Peak",
  "email": "raymond.humphreys@my.colby-sawyer.edu",
  "socials": {
    "instagram": "https://instagram.com/rj_fast"
  }
}
```

### What RJ touches vs what he doesn't

**He edits (via github.com web UI):**
- `src/index.md`, `about.md`, `contact.md` — body text in Markdown
- `src/work/*.md` — to add a write-up, copy an existing file and edit
- `src/_data/site.json` — site-wide values (rare)
- `src/assets/images/` — drag-drop new photos
- `src/files/` — drag-drop new PDFs

**He doesn't touch:**
- `_includes/`, `.eleventy.js`, `package.json`, `.github/workflows/`, `styles.css`

## Editing UX

### RJ's flows

**Fix a typo:**
1. github.com/.../rj-website → click the file → pencil icon → edit → commit
2. ~60 seconds later the site reflects the change

**Add a project write-up:**
1. Navigate to `src/work/` → "Add file → Create new file" (or copy an existing)
2. Fill frontmatter (title, summary, image, optional PDF), write body
3. Commit. Work index picks it up automatically.

**Add an image or PDF:**
1. Navigate to `src/assets/images/` (or `src/files/`)
2. "Add file → Upload files" → drag in
3. Commit. Reference in Markdown.

### Onboarding

A `README.md` at the repo root titled "How to edit your site," written for RJ, with:
- Step-by-step screenshotted walkthroughs of the three flows above
- Markdown cheat sheet (headings, bold, links, lists)
- "If you break it" section pointing to GitHub's commit history (one-click revert)
- Plain English, no jargon

### Safety

Every change is a Git commit. Any mistake is reverted in one click via the commit history. RJ literally cannot break the site permanently.

## Deployment

- GitHub Actions workflow `.github/workflows/deploy.yml`:
  - Trigger: push to `main`
  - Steps: checkout, setup Node, `npm ci`, `npx @11ty/eleventy`, upload artifact, deploy to Pages
  - Uses `actions/deploy-pages@v4` (official GitHub Pages action)
- Initial URL: `<github-username>.github.io/rj-website` (or `<github-username>.github.io` if hosted at the user's primary Pages site)
- **Custom domain:** out of scope for v1. When RJ wants `coachrjhumphreys.com` or similar, it's a DNS CNAME + repo setting + a `CNAME` file in the repo. Domain registration cost is on him.

## Resolved decisions

- **Brand label:** "Coach RJ" in the header.
- **Repo location:** Ryan's GitHub account for v1; transfer to RJ later.
- **Social links:** Instagram only (`@rj_fast`). Drop Wix's templated defaults.
- **CAP PDF source:** `https://49496a17-8c6b-44ab-b23a-b2a943240fb3.filesusr.com/ugd/706987_ec4632c40d414df3811b4ea083be18e2.pdf` — download and host at `src/files/cap-project.pdf`.

## Open questions for the implementation phase

- **Image sourcing:** Pull what's available from the Wix site during implementation; flag any gaps for RJ to provide.
- **Resume PDF:** Pull current PDF from the Wix site if accessible, otherwise placeholder until RJ provides.
- **Other PDFs:** Pull case studies / write-up PDFs from the Wix site where linked; placeholder otherwise.
- **Analytics:** None in v1. Mention as future option (Plausible, simple Cloudflare).

## Out of scope (v1)

- Testimonials section
- Services / "Work with me" / pricing page
- Blog or articles section beyond the existing project write-ups
- Contact form (server-backed)
- Photo/video gallery
- CMS UI layer
- Email newsletter signup
- Custom domain
- Analytics

All of these are easy to layer on later given the chosen stack.

## Success criteria

- RJ can fix a typo in his bio entirely through github.com, in under 5 minutes, without help.
- RJ can add a new project write-up by copying an existing Markdown file and editing it, with the README as his only reference.
- A photo dropped into `src/assets/images/` ships as an optimized responsive image without RJ doing anything.
- The site loads in under 1 second on a typical connection (lighthouse score ≥ 95 for performance).
- The site looks distinctly different from a default Wix template — warm palette, photo-forward, Fraunces/Inter typography.
