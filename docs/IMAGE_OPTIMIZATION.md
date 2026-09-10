# Image Optimization Guide for Coach RJ Website

This guide explains how to optimize images for maximum performance while maintaining visual quality.

## Table of Contents
1. [Current Issues](#current-issues)
2. [Format Recommendations](#format-recommendations)
3. [Compression Guidelines](#compression-guidelines)
4. [Responsive Images (srcset)](#responsive-images-srcset)
5. [Lazy Loading](#lazy-loading)
6. [Implementation Steps](#implementation-steps)
7. [Tools & Services](#tools--services)

---

## Current Issues

### Image Inventory Analysis
Your site has **28 images** totaling **~58 MB**. Key problems:

| Issue | Impact | Priority |
|-------|--------|----------|
| **Uncompressed JPGs** | Hero carousel (9 images) loads ALL at once | 🔴 CRITICAL |
| **HEIC format** (Climbing-Russell.HEIC) | 4.06 MB, not web-compatible | 🔴 CRITICAL |
| **Large carousel images** | Several images > 3 MB each (Gym-Aura.JPG: 3.5 MB) | 🟠 HIGH |
| **No lazy loading** | All images load on page init, not on-demand | 🟠 HIGH |
| **No responsive sizes** | Images load full resolution on mobile too | 🟠 HIGH |

**Estimated page load impact:** ~5-8 second delay on standard 4G connections.

---

## Format Recommendations

### Use Modern Formats (WebP with JPG fallback)

| Format | Pros | Cons | Best For |
|--------|------|------|----------|
| **WebP** | 25-35% smaller than JPG, better quality | Requires fallback | Photos, hero images |
| **AVIF** | 30-40% smaller than WebP | Limited browser support | Future-proof, not yet |
| **JPG** | Universal support, reliable | Larger file size | Fallback/older browsers |
| **PNG** | Lossless, transparency | Larger than JPG | Diagrams, graphics |

### Format Decision Matrix
```
Photos (hero, feature) → WebP + JPG
Diagrams/charts       → PNG (if transparent) or Optimized JPG
Text in image         → PNG (lossless)
Logos                 → SVG (if possible) or PNG
```

---

## Compression Guidelines

### Target File Sizes

| Image Type | Current | Target | Reduction |
|------------|---------|--------|-----------|
| **Hero carousel** (9 imgs) | ~18 MB | ~4 MB | 78% |
| **About feature photo** | 948 KB | 250 KB | 74% |
| **Diagrams** | 2.4 MB | 600 KB | 75% |
| **Total** | ~58 MB | ~12 MB | 79% |

### Compression Steps

#### 1. **Use ImageMagick (command line)**
```bash
# Compress JPG to 85% quality
convert input.jpg -quality 85 output.jpg

# WebP conversion with quality 85
cwebp -q 85 input.jpg -o output.webp

# Batch convert all JPGs in a directory
for f in *.jpg; do cwebp -q 85 "$f" -o "${f%.*}.webp"; done
```

#### 2. **Use Online Tools (Free, No Setup)**
- **TinyJPG** (tinyjpg.com) – Excellent compression, bulk uploads
- **ImageOptim** (imageoptim.com) – Drag & drop, smart compression
- **Squoosh** (squoosh.app) – Google's visual compressor, see before/after

#### 3. **macOS: ImageOptim App**
- Drop images into the app
- Automatically optimizes all formats
- Saves in place

#### 4. **Local Node.js Script**
```bash
npm install sharp
```
Create `compress-images.js`:
```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imageDir = './assets/images';
fs.readdirSync(imageDir).forEach(file => {
  if (!/\.(jpg|jpeg|png)$/i.test(file)) return;
  
  sharp(path.join(imageDir, file))
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(path.join(imageDir, `${path.parse(file).name}.webp`))
    .then(() => console.log(`✓ Converted ${file}`))
    .catch(err => console.error(err));
});
```

Run: `node compress-images.js`

---

## Responsive Images (srcset)

### Why srcset?
- Serves appropriate resolution for device (1x, 2x, 3x)
- Saves bandwidth on mobile (smaller screens load smaller images)
- Reduces load time without visible quality loss

### Implementation

#### Hero Carousel Images
```html
<!-- BEFORE (loads full resolution on all devices) -->
<img src="/assets/images/Gym-Aura.JPG" alt="Gym interior" class="hero-bg">

<!-- AFTER (responsive + WebP + lazy loading) -->
<picture>
  <source 
    media="(max-width: 640px)"
    srcset="/assets/images/Gym-Aura-sm.webp 1x, /assets/images/Gym-Aura-sm@2x.webp 2x"
    type="image/webp">
  <source 
    media="(max-width: 640px)"
    srcset="/assets/images/Gym-Aura-sm.jpg 1x, /assets/images/Gym-Aura-sm@2x.jpg 2x">
  <source 
    srcset="/assets/images/Gym-Aura.webp 1x, /assets/images/Gym-Aura@2x.webp 2x"
    type="image/webp">
  <img 
    src="/assets/images/Gym-Aura.jpg" 
    alt="Gym interior with aura"
    class="hero-bg"
    loading="lazy">
</picture>
```

#### Simpler Version (Use For Most Images)
```html
<img 
  srcset="/assets/images/photo-small.webp 480w, /assets/images/photo-large.webp 1200w"
  src="/assets/images/photo-large.jpg"
  alt="Description"
  loading="lazy">
```

---

## Lazy Loading

### Native HTML Lazy Loading
Add `loading="lazy"` to defer image loading until needed.

```html
<!-- Images below the fold load only when scrolling near them -->
<img 
  src="/assets/images/rj-feature.jpg"
  alt="Coach RJ"
  loading="lazy"
  class="about-photo">
```

### Key Rules
- **First hero image (Gym-Aura)** → `loading="eager"` (critical, show immediately)
- **Carousel slides 2-9** → `loading="lazy"` (user may not swipe, defer)
- **Below-the-fold images** → Always use `loading="lazy"`
- **Above-the-fold non-critical** → `loading="lazy"` is fine if < 100ms delay acceptable

### For Maximum Control: Intersection Observer
```javascript
// Only if you need to customize lazy loading behavior
const images = document.querySelectorAll('img[data-lazy]');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-lazy');
      observer.unobserve(img);
    }
  });
});
images.forEach(img => observer.observe(img));
```

HTML:
```html
<img data-lazy src="placeholder.jpg" data-src="/assets/images/actual-image.jpg" alt="...">
```

---

## Implementation Steps

### Quick Win (Do This First)
1. **Convert hero carousel images to WebP**
   - Saves ~3 MB immediately
   - Add fallback JPGs with `<picture>` tag
   - Estimate: 15 minutes

2. **Enable lazy loading on carousel slides 2-9**
   - Add `loading="lazy"` to all non-active carousel images
   - Estimate: 5 minutes

3. **Compress all JPGs to 85% quality**
   - Use TinyJPG or ImageOptim
   - Reduces another 40-50%
   - Estimate: 20 minutes

**Total time: ~40 minutes | Savings: ~60% page load reduction**

### Phase 2 (Add Responsive Images)
1. Create small, medium, large versions of each image
2. Add `srcset` attributes to `<img>` tags
3. Save additional 30-40% on mobile
4. Estimate: 2 hours

---

## Tools & Services

### Desktop
| Tool | Cost | Platform | Use Case |
|------|------|----------|----------|
| ImageOptim | Free | macOS | Bulk optimize, smart compression |
| XnConvert | Free | Win/Mac/Linux | Batch conversion, watermarking |
| IrfanView | Free | Windows | Quick conversions |

### Online
| Service | Cost | Best For |
|---------|------|----------|
| TinyJPG/TinyPNG | Free (20/mo) | Quick compression, bulk |
| Squoosh | Free | Visual before/after comparison |
| CloudFlare Polish | Free (Pro) | Automatic compression + CDN |

### Node.js/CLI
```bash
# Install sharp (best for automation)
npm install -g sharp-cli

# Convert single image
sharp input.jpg -o output.webp

# Batch with resize
sharp --input '*.jpg' --output webp --resize 1920
```

### GitHub Actions (Automate)
Add `.github/workflows/image-optimize.yml`:
```yaml
name: Optimize Images
on: [pull_request]
jobs:
  optimize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: calibreapp/image-actions@main
        with:
          githubToken: ${{ secrets.GITHUB_TOKEN }}
          compressOnly: true
          quality: 85
          webp: true
```

---

## Specific Recommendations for Your Images

### 🔴 URGENT
- **Climbing-Russell.HEIC** (4.06 MB) → Convert to WebP (~800 KB)
- **Gym-Aura.JPG** (3.5 MB) → Compress to 85% (~600 KB)
- **Skier-Tucks.jpg** (7 MB) → Compress to 85% (~1.2 MB)
- **Tucks-Spring.jpg** (7.5 MB) → Compress to 85% (~1.3 MB)

### 🟠 HIGH PRIORITY
- All hero carousel images → Add `loading="lazy"` except first
- All diagrams → Already reasonably sized, but add WebP versions
- Feature photos → Create small version for mobile

### 🟡 NICE TO HAVE
- Add `<picture>` element with WebP + JPG sources
- Create `srcset` for responsive behavior
- Set up automated compression in CI/CD

---

## Performance Targets

| Metric | Before | Target | How |
|--------|--------|--------|-----|
| Hero load time | 3-4s | 0.8-1s | Compress + WebP + lazy |
| Page size | 58 MB | 12 MB | Compression ratio 79% |
| Time to Interactive | 8-10s | 2-3s | Deferred image loading |
| Lighthouse Score | ~45 | 85+ | Combined optimizations |

---

## Questions?

Refer to these resources:
- [MDN: Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Web.dev: Image Optimization](https://web.dev/fast/#optimize-your-images)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
