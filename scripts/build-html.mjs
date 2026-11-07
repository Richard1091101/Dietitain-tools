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

// Also copy dist/assets to docs/assets so that whether an asset is inlined or fetched, it never 404s
const distAssets = path.join(distDir, 'assets');
const docsAssets = path.join(docsDir, 'assets');
if (fs.existsSync(distAssets)) {
  fs.cpSync(distAssets, docsAssets, { recursive: true });
}

let html = fs.readFileSync(htmlDistPath, 'utf-8');

// 1. Inline all CSS into <head>
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

// 2. Extract and remove JS script tags from <head>
let jsBundle = '';
const scriptMatches = [...html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/gi)];
for (const match of scriptMatches) {
  const fullTag = match[0];
  const src = match[1].replace(/^\.\//, '');
  const jsPath = path.join(distDir, src);
  if (fs.existsSync(jsPath)) {
    jsBundle += fs.readFileSync(jsPath, 'utf-8') + '\n';
  }
  html = html.replace(fullTag, '');
}

// 3. Escape closing script tags in string literals to prevent premature HTML parser termination
const safeJs = jsBundle.replace(/<\/script/gi, '<\\/script');

// 4. Inject as a standard synchronous script right before </body>, GUARANTEEING #root is in DOM
const scriptPlacement = `<script>\n${safeJs}\n</script>\n</body>`;
html = html.replace('</body>', () => scriptPlacement);

// 5. Write to docs/index.html and docs/404.html for GitHub Pages
fs.writeFileSync(path.join(docsDir, 'index.html'), html, 'utf-8');
fs.writeFileSync(path.join(docsDir, '404.html'), html, 'utf-8');

// 6. Write to root standalone html file
fs.writeFileSync(path.resolve('dietitian_pro_suite.html'), html, 'utf-8');

console.log('✅ Successfully built standalone static HTML files:');
console.log(' - docs/index.html (Inlined, placed at bottom of body, DOM-safe)');
console.log(' - docs/404.html (GitHub Pages SPA fallback)');
console.log(' - dietitian_pro_suite.html (Direct browser & offline use)');
console.log(' - docs/assets/ (Copied for fallback support)');
