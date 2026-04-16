# getrebar.dev

Landing page + blog for [Rebar](https://github.com/spotcircuit/rebar).

Pure static site. Deploys anywhere that serves HTML (GitHub Pages, Vercel, Cloudflare Pages, Netlify, S3+CDN).

## Layout

```
index.html                 # landing page
blog/
  published/*.md           # post sources (edit these)
  index.html               # generated — blog listing
  <slug>/index.html        # generated — per-post page
  rss.xml                  # generated — RSS feed
sitemap.xml                # generated — sitemap
scripts/build-blog.mjs     # build script (Node 20+)
```

## Authoring a post

1. Add a markdown file to `blog/published/` with this frontmatter:

   ```md
   ---
   title: "Post title"
   slug: "post-slug"                 # URL-safe; optional, derived from title if omitted
   description: "One-sentence summary used for <meta description> and og:description."
   date: "2026-04-16"                # YYYY-MM-DD
   author: "SpotCircuit"             # optional
   tags: ["rebar", "claude-code"]    # optional
   og_image: "https://..."           # optional, absolute URL
   canonical: "https://..."          # optional, overrides default canonical
   ---

   Post body in markdown.
   ```

2. Build:

   ```bash
   npm install        # first time only
   npm run build
   ```

3. Preview locally:

   ```bash
   npm run serve      # http://localhost:8000
   ```

4. Commit the sources **and** the generated output (`blog/index.html`, `blog/<slug>/`, `blog/rss.xml`, `sitemap.xml`). The site has no build step in production — whatever is on `master` is what ships.

## SEO / OG

Every post gets:

- `<title>`, `<meta name="description">`, canonical URL
- Open Graph tags (`og:title`, `og:description`, `og:url`, `og:type=article`, `og:image`, `article:published_time`, `article:tag`)
- Twitter summary card
- JSON-LD `BlogPosting` structured data
- An entry in `blog/rss.xml` and `sitemap.xml`

The blog index gets JSON-LD `Blog` with a `blogPost` array.

## Styling

The blog reuses the landing page's dark theme tokens (`#0a0a0a` background, `#a3e635` accent, system font stack). Prose is tuned for long-form reading (72ch measure, 1.75 line-height). Styles are inlined in each generated page — zero external CSS requests.
