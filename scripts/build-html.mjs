import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist');
const docsDir = path.resolve('docs');
const htmlDistPath = path.join(distDir, 'index.html');

if (!fs.existsSync(htmlDistPath)) {
  console.error('dist/index.html not found! Run vite build first.');
  process.exit(1);
}

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

let html = fs.readFileSync(htmlDistPath, 'utf-8');

// Inline all CSS
const cssMatches = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/gi)];
for (const match of cssMatches) {
  const fullTag = match[0];
  const href = match[1].replace(/^\.\//, '');
  const cssPath = path.join(distDir, href);
  if (fs.existsSync(cssPath)) {
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    html = html.replace(fullTag, () => `<style>\n${cssContent}\n</style>`);
  }
}

// Inline JS modules
const scriptMatches = [...html.matchAll(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["'][^>]*><\/script>/gi)];
for (const match of scriptMatches) {
  const fullTag = match[0];
  const src = match[1].replace(/^\.\//, '');
  const jsPath = path.join(distDir, src);
  if (fs.existsSync(jsPath)) {
    const jsContent = fs.readFileSync(jsPath, 'utf-8');
    // Using replacer function prevents special replacement patterns like $& or $' in minified JS
    html = html.replace(fullTag, () => `<script type="module">\n${jsContent}\n</script>`);
  }
}

// Write to docs/index.html and docs/404.html for GitHub Pages
fs.writeFileSync(path.join(docsDir, 'index.html'), html, 'utf-8');
fs.writeFileSync(path.join(docsDir, '404.html'), html, 'utf-8');

// Write to root standalone html file
fs.writeFileSync(path.resolve('dietitian_pro_suite.html'), html, 'utf-8');

console.log('✅ Successfully built standalone static HTML files:');
console.log(' - docs/index.html (GitHub Pages /docs deployment)');
console.log(' - docs/404.html (GitHub Pages SPA fallback)');
console.log(' - dietitian_pro_suite.html (Direct browser & offline use)');
