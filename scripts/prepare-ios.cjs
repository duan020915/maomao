const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'www');
const demo = process.argv.includes('--demo');
const url = process.env.MAOMAO_SUPABASE_URL;
const key = process.env.MAOMAO_SUPABASE_PUBLISHABLE_KEY;
if (!demo && (!url || !key)) {
  throw new Error('Set MAOMAO_SUPABASE_URL and MAOMAO_SUPABASE_PUBLISHABLE_KEY for the independent Supabase project. Use --demo only for simulator layout checks.');
}

fs.rmSync(output, {recursive: true, force: true});
fs.mkdirSync(output, {recursive: true});
for (const name of fs.readdirSync(root)) {
  if (/\.(css|js|svg|webmanifest)$/.test(name) && name !== 'config.js') {
    fs.copyFileSync(path.join(root, name), path.join(output, name));
  }
}
for (const directory of ['assets', 'vendor']) {
  fs.cpSync(path.join(root, directory), path.join(output, directory), {recursive: true});
}
const config = demo ? null : {url, key, authRedirectUrl: process.env.MAOMAO_AUTH_REDIRECT_URL || 'maomao-duan020915://auth-callback'};
fs.writeFileSync(path.join(output, 'config.js'), `window.MAOMAO_CONFIG = ${JSON.stringify(config)};\n`);
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace('冒冒 · 新版互动预览（模拟数据）', '冒冒 · 小圈子日程');
html = html.replace('width=device-width,initial-scale=1', 'width=device-width,initial-scale=1,viewport-fit=cover');
html = html.replace('<body>', '<body class="ios-native">');
html = html.replace('<script src="icons.js', '<script src="vendor/supabase.js"></script><script src="config.js"></script><script src="icons.js');
if (!html.includes('<script src="config.js"></script>')) throw new Error('Could not inject native runtime configuration.');
fs.writeFileSync(path.join(output, 'index.html'), html);
console.log(`Prepared ${demo ? 'simulator demo' : 'connected'} web assets in www/`);
