/**
 * One-off helper: mirror every externally hosted product image referenced by
 * public/shop.html into public/assets/fashion/ so the storefront has no
 * third-party image dependency (Pinterest/Unsplash hotlinks break or get
 * blocked by referer checks).
 *
 * Usage: node scripts/mirror-shop-images.js   (prints the URL -> local path map)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SHOP = path.join(ROOT, 'public/shop.html');
const OUT_DIR = path.join(ROOT, 'public/assets/fashion');

function localNameFor(url) {
    let ext = (url.split('?')[0].match(/\.([a-z0-9]{3,4})$/i) || [])[1] || 'jpg';
    ext = ext.toLowerCase();

    if (/pinimg\.com/i.test(url)) {
        const base = path.basename(url.split('?')[0]); // 48c39f8f....jpg
        const stem = base.replace(/\.[a-z0-9]+$/i, '').slice(0, 12);
        return `jean-women-${stem}.${ext}`;
    }

    const unsplashId = (url.match(/photo-([0-9a-z-]+)/i) || [])[1];
    if (unsplashId) return `photo-${unsplashId}.${ext}`;

    const digest = crypto.createHash('md5').update(url).digest('hex').slice(0, 10);
    return `asset-${digest}.${ext}`;
}

(async () => {
    const html = fs.readFileSync(SHOP, 'utf8');
    const urls = Array.from(new Set(html.match(/https:\/\/(?:i\.pinimg\.com|images\.unsplash\.com)[^"'\s)]+/g) || []));
    if (!urls.length) {
        console.log('No external images found.');
        return;
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });

    const map = {};
    let ok = 0;
    let failed = 0;
    // Written outside public/ so the mapping never ships to the CDN.
    const mapFile = path.join(require('os').tmpdir(), 'kamiwear-shop-image-map.json');

    for (const url of urls) {
        const name = localNameFor(url);
        const dest = path.join(OUT_DIR, name);
        if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
            map[url] = `assets/fashion/${name}`;
            ok++;
            continue;
        }
        try {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
                    Referer: 'https://www.pinterest.com/',
                    Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                },
                redirect: 'follow',
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.length < 2000) throw new Error(`too small (${buf.length} bytes)`);
            fs.writeFileSync(dest, buf);
            map[url] = `assets/fashion/${name}`;
            ok++;
            console.log(`ok   ${name}  ${buf.length} bytes`);
        } catch (error) {
            failed++;
            console.log(`FAIL ${url}  -> ${error.message}`);
        }
    }

    let rewritten = 0;
    if (failed === 0) {
        let html2 = html;
        for (const [url, local] of Object.entries(map)) {
            if (html2.includes(url)) {
                html2 = html2.split(url).join(local);
                rewritten++;
            }
        }
        fs.writeFileSync(SHOP, html2);
    }

    fs.writeFileSync(mapFile, JSON.stringify(map, null, 2));
    console.log(`\n${ok} mirrored, ${failed} failed.`);
    console.log(`${rewritten} src attributes rewritten in public/shop.html.`);
    console.log(`Map: ${mapFile}`);
    if (failed > 0) console.log('Shop.html left untouched because some downloads failed.');
})();
