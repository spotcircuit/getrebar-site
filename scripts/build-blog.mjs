#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'blog', 'published');
const OUT_BLOG = join(ROOT, 'blog');
const SITE_ORIGIN = 'https://getrebar.dev';
const SITE_NAME = 'Rebar';
const DEFAULT_AUTHOR = 'SpotCircuit';
const DEFAULT_OG = `${SITE_ORIGIN}/og-default.png`;

marked.setOptions({ gfm: true, breaks: false, headerIds: true, mangle: false });

const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeAttr = escapeHtml;

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const formatDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

const readPosts = () => {
  if (!existsSync(SRC)) return [];
  const files = readdirSync(SRC).filter((f) => f.endsWith('.md') && statSync(join(SRC, f)).isFile());
  const posts = files.map((file) => {
    const raw = readFileSync(join(SRC, file), 'utf8');
    const { data, content } = matter(raw);
    const required = ['title', 'description', 'date'];
    for (const k of required) {
      if (!data[k]) throw new Error(`Post ${file} missing required frontmatter field: ${k}`);
    }
    const slug = data.slug || slugify(data.title);
    if (!slug) throw new Error(`Post ${file} produced empty slug`);
    return {
      file,
      slug,
      title: String(data.title),
      description: String(data.description),
      date: String(data.date),
      author: data.author || DEFAULT_AUTHOR,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      ogImage: data.og_image || data.image || DEFAULT_OG,
      canonical: data.canonical || `${SITE_ORIGIN}/blog/${slug}/`,
      bodyHtml: marked.parse(content),
      bodyRaw: content,
    };
  });
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
};

const BASE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root { color-scheme: dark; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: #0a0a0a;
    color: #e5e5e5;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.6;
  }
  a { color: #a3e635; text-decoration: none; }
  a:hover { text-decoration: underline; }
  header.site {
    width: 100%;
    padding: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 900px;
    margin: 0 auto;
  }
  header.site .brand { font-weight: 800; color: #fff; font-size: 18px; letter-spacing: -0.5px; }
  header.site nav a { color: #a3a3a3; margin-left: 20px; font-size: 14px; }
  header.site nav a:hover { color: #fff; text-decoration: none; }
  main { width: 100%; max-width: 720px; padding: 24px; flex: 1; }
  footer.site {
    padding: 40px 24px;
    text-align: center;
    color: #525252;
    font-size: 13px;
    border-top: 1px solid #1a1a1a;
    width: 100%;
    margin-top: 64px;
  }
  footer.site a { color: #737373; }
  footer.site a:hover { color: #a3a3a3; text-decoration: none; }
`;

const INDEX_STYLES = `
  .page-title { font-size: 36px; font-weight: 800; color: #fff; margin: 24px 0 8px; letter-spacing: -0.5px; }
  .page-sub { color: #a3a3a3; margin-bottom: 40px; font-size: 16px; }
  .post-list { display: flex; flex-direction: column; gap: 24px; }
  .post-card {
    background: #1a1a1a;
    border: 1px solid #262626;
    border-radius: 12px;
    padding: 24px;
    transition: border-color 0.2s;
  }
  .post-card:hover { border-color: #404040; }
  .post-card a.title-link { color: #fff; text-decoration: none; }
  .post-card a.title-link:hover { color: #a3e635; }
  .post-card h2 { font-size: 22px; font-weight: 700; margin-bottom: 8px; line-height: 1.3; }
  .post-meta { font-size: 13px; color: #737373; margin-bottom: 12px; }
  .post-meta .tag {
    display: inline-block;
    background: #262626;
    color: #d4d4d4;
    padding: 2px 8px;
    border-radius: 4px;
    margin-right: 6px;
    font-size: 12px;
  }
  .post-card p.desc { color: #a3a3a3; font-size: 15px; }
  .empty {
    background: #1a1a1a;
    border: 1px dashed #333;
    border-radius: 12px;
    padding: 48px 24px;
    text-align: center;
    color: #737373;
  }
`;

const POST_STYLES = `
  article { padding: 24px 0; }
  .post-head { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #262626; }
  .post-head h1 { font-size: 36px; font-weight: 800; color: #fff; letter-spacing: -0.5px; line-height: 1.2; margin-bottom: 12px; }
  .post-head .meta { color: #737373; font-size: 14px; }
  .post-head .tag { display: inline-block; background: #262626; color: #d4d4d4; padding: 2px 8px; border-radius: 4px; margin-right: 6px; font-size: 12px; }
  .prose { color: #d4d4d4; font-size: 17px; line-height: 1.75; }
  .prose p { margin-bottom: 20px; }
  .prose h2 { color: #fff; font-size: 26px; font-weight: 700; margin: 40px 0 16px; letter-spacing: -0.3px; }
  .prose h3 { color: #fff; font-size: 20px; font-weight: 700; margin: 28px 0 12px; }
  .prose ul, .prose ol { margin: 0 0 20px 24px; }
  .prose li { margin-bottom: 8px; }
  .prose blockquote { border-left: 3px solid #a3e635; padding: 4px 16px; color: #a3a3a3; margin: 20px 0; font-style: italic; }
  .prose code {
    background: #1a1a1a;
    border: 1px solid #262626;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'SF Mono', 'Fira Code', Menlo, Consolas, monospace;
    font-size: 0.9em;
    color: #a3e635;
  }
  .prose pre {
    background: #1a1a1a;
    border: 1px solid #262626;
    border-radius: 8px;
    padding: 16px 20px;
    overflow-x: auto;
    margin: 20px 0;
    font-family: 'SF Mono', 'Fira Code', Menlo, Consolas, monospace;
    font-size: 14px;
    line-height: 1.5;
  }
  .prose pre code { background: none; border: none; padding: 0; color: #e5e5e5; }
  .prose a { color: #a3e635; text-decoration: underline; text-underline-offset: 3px; }
  .prose a:hover { color: #d9f99d; }
  .prose img { max-width: 100%; border-radius: 8px; margin: 20px 0; }
  .back-link { display: inline-block; margin-top: 48px; color: #a3a3a3; font-size: 14px; }
  .back-link:hover { color: #fff; text-decoration: none; }
`;

const MOBILE_STYLES = `
  @media (max-width: 640px) {
    header.site { flex-direction: column; gap: 12px; }
    header.site nav a { margin: 0 10px; }
    .page-title, .post-head h1 { font-size: 28px; }
    .prose { font-size: 16px; }
  }
`;

const siteHeader = (activeBlog) => `
  <header class="site">
    <a href="/" class="brand">Rebar</a>
    <nav>
      <a href="/"${activeBlog ? '' : ' aria-current="page"'}>Home</a>
      <a href="/blog/"${activeBlog ? ' aria-current="page"' : ''}>Blog</a>
      <a href="https://github.com/spotcircuit/rebar">GitHub</a>
    </nav>
  </header>
`;

const siteFooter = `
  <footer class="site">
    <a href="https://github.com/spotcircuit/rebar">GitHub</a>
    &nbsp;&middot;&nbsp;
    <a href="/blog/">Blog</a>
    &nbsp;&middot;&nbsp;
    <a href="/blog/rss.xml">RSS</a>
    &nbsp;&middot;&nbsp;
    Built by <a href="https://github.com/spotcircuit">SpotCircuit</a>
  </footer>
`;

const faviconLink = `<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔩</text></svg>">`;

const renderIndexHtml = (posts) => {
  const title = `Blog — ${SITE_NAME}`;
  const description = 'Notes on Claude Code, project memory, and building with Rebar.';
  const url = `${SITE_ORIGIN}/blog/`;
  const blogList = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} Blog`,
    description,
    url,
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.description,
      datePublished: p.date,
      url: `${SITE_ORIGIN}/blog/${p.slug}/`,
      author: { '@type': 'Person', name: p.author },
    })),
  };
  const cards = posts.length
    ? posts
        .map(
          (p) => `
      <article class="post-card">
        <h2><a class="title-link" href="/blog/${escapeAttr(p.slug)}/">${escapeHtml(p.title)}</a></h2>
        <div class="post-meta">
          <time datetime="${escapeAttr(p.date)}">${escapeHtml(formatDate(p.date))}</time>
          &nbsp;&middot;&nbsp; ${escapeHtml(p.author)}
          ${p.tags.length ? '<br>' + p.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('') : ''}
        </div>
        <p class="desc">${escapeHtml(p.description)}</p>
      </article>`
        )
        .join('')
    : `<div class="empty">No posts yet. Check back soon.</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}">
  <link rel="canonical" href="${escapeAttr(url)}">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(description)}">
  <meta property="og:url" content="${escapeAttr(url)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapeAttr(SITE_NAME)}">
  <meta property="og:image" content="${escapeAttr(DEFAULT_OG)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(title)}">
  <meta name="twitter:description" content="${escapeAttr(description)}">
  <meta name="twitter:image" content="${escapeAttr(DEFAULT_OG)}">
  <link rel="alternate" type="application/rss+xml" title="${escapeAttr(SITE_NAME)} Blog" href="/blog/rss.xml">
  ${faviconLink}
  <style>${BASE_STYLES}${INDEX_STYLES}${MOBILE_STYLES}</style>
  <script type="application/ld+json">${JSON.stringify(blogList)}</script>
</head>
<body>
  ${siteHeader(true)}
  <main>
    <h1 class="page-title">Blog</h1>
    <p class="page-sub">Notes on Claude Code, project memory, and building with Rebar.</p>
    <div class="post-list">${cards}</div>
  </main>
  ${siteFooter}
</body>
</html>
`;
};

const renderPostHtml = (p) => {
  const url = p.canonical;
  const pageTitle = `${p.title} — ${SITE_NAME} Blog`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.description,
    datePublished: p.date,
    dateModified: p.date,
    author: { '@type': 'Person', name: p.author },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/og-default.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: p.ogImage,
    url,
    keywords: p.tags.join(', '),
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeAttr(p.description)}">
  <meta name="author" content="${escapeAttr(p.author)}">
  <link rel="canonical" href="${escapeAttr(url)}">
  <meta property="og:title" content="${escapeAttr(p.title)}">
  <meta property="og:description" content="${escapeAttr(p.description)}">
  <meta property="og:url" content="${escapeAttr(url)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${escapeAttr(SITE_NAME)}">
  <meta property="og:image" content="${escapeAttr(p.ogImage)}">
  <meta property="article:published_time" content="${escapeAttr(p.date)}">
  <meta property="article:author" content="${escapeAttr(p.author)}">
  ${p.tags.map((t) => `<meta property="article:tag" content="${escapeAttr(t)}">`).join('\n  ')}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(p.title)}">
  <meta name="twitter:description" content="${escapeAttr(p.description)}">
  <meta name="twitter:image" content="${escapeAttr(p.ogImage)}">
  ${faviconLink}
  <style>${BASE_STYLES}${POST_STYLES}${MOBILE_STYLES}</style>
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
  ${siteHeader(true)}
  <main>
    <article>
      <header class="post-head">
        <h1>${escapeHtml(p.title)}</h1>
        <div class="meta">
          <time datetime="${escapeAttr(p.date)}">${escapeHtml(formatDate(p.date))}</time>
          &nbsp;&middot;&nbsp; ${escapeHtml(p.author)}
          ${p.tags.length ? '<br>' + p.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('') : ''}
        </div>
      </header>
      <div class="prose">${p.bodyHtml}</div>
      <a class="back-link" href="/blog/">&larr; All posts</a>
    </article>
  </main>
  ${siteFooter}
</body>
</html>
`;
};

const renderRss = (posts) => {
  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${escapeAttr(`${SITE_ORIGIN}/blog/${p.slug}/`)}</link>
      <guid isPermaLink="true">${escapeAttr(`${SITE_ORIGIN}/blog/${p.slug}/`)}</guid>
      <description>${escapeHtml(p.description)}</description>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <author>noreply@getrebar.dev (${escapeHtml(p.author)})</author>
      ${p.tags.map((t) => `<category>${escapeHtml(t)}</category>`).join('\n      ')}
    </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(SITE_NAME)} Blog</title>
    <link>${SITE_ORIGIN}/blog/</link>
    <atom:link href="${SITE_ORIGIN}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>Notes on Claude Code, project memory, and building with Rebar.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
};

const renderSitemap = (posts) => {
  const urls = [
    { loc: `${SITE_ORIGIN}/`, priority: '1.0' },
    { loc: `${SITE_ORIGIN}/blog/`, priority: '0.8' },
    ...posts.map((p) => ({
      loc: `${SITE_ORIGIN}/blog/${p.slug}/`,
      lastmod: new Date(p.date).toISOString().split('T')[0],
      priority: '0.7',
    })),
  ];
  const body = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
};

const cleanGenerated = () => {
  if (!existsSync(OUT_BLOG)) return;
  for (const entry of readdirSync(OUT_BLOG)) {
    if (entry === 'published') continue;
    const p = join(OUT_BLOG, entry);
    rmSync(p, { recursive: true, force: true });
  }
};

const writeFile = (path, contents) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, 'utf8');
};

const main = () => {
  const posts = readPosts();
  cleanGenerated();
  mkdirSync(OUT_BLOG, { recursive: true });

  writeFile(join(OUT_BLOG, 'index.html'), renderIndexHtml(posts));
  for (const p of posts) {
    writeFile(join(OUT_BLOG, p.slug, 'index.html'), renderPostHtml(p));
  }
  writeFile(join(OUT_BLOG, 'rss.xml'), renderRss(posts));
  writeFile(join(ROOT, 'sitemap.xml'), renderSitemap(posts));

  console.log(`Built ${posts.length} post${posts.length === 1 ? '' : 's'}:`);
  for (const p of posts) console.log(`  /blog/${p.slug}/  — ${p.title}`);
  console.log('Output: blog/index.html, blog/<slug>/index.html, blog/rss.xml, sitemap.xml');
};

main();
