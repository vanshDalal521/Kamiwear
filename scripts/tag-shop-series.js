/**
 * One-off: add data-series to every product card in public/shop.html so the
 * aside "Anime Series" checkboxes have real data to filter on. Cards with no
 * anime theme get "Streetwear" (deliberately absent from the checkbox list,
 * so checking a series shows only the themed items).
 */
const fs = require('fs');
const path = require('path');

const SHOP = path.join(__dirname, '../public/shop.html');
let html = fs.readFileSync(SHOP, 'utf8');

if (/product-card group relative" data-price="\d+" data-name="[^"]+" data-series=/.test(html)) {
    console.log('Cards already tagged — nothing to do.');
    process.exit(0);
}

let tagged = 0;
const next = html.replace(
    /(<div class="product-card group relative" data-price="\d+" data-name="[^"]+")/g,
    (match, head) => {
        const name = (head.match(/data-name="([^"]+)"/) || [])[1] || '';
        const up = name.toUpperCase();
        let series = 'Streetwear';
        if (/EVA-01/.test(up)) series = 'Neon Genesis';
        else if (/SUKUNA|CURSED SEAL|DOMAIN EXPANSION/.test(up)) series = 'Jujutsu Kaisen';
        else if (/NEO-TOKYO/.test(up)) series = 'Akira';
        else if (/CYBER|EDGERUNNERS/.test(up)) series = 'Cyberpunk 2077';
        else if (/SECTION 9|TECHWEAR/.test(up)) series = 'Ghost in the Shell';
        tagged += 1;
        return `${head} data-series="${series}"`;
    }
);

if (tagged !== 41) {
    console.error(`Expected 41 cards, tagged ${tagged} — leaving file untouched.`);
    process.exit(1);
}

fs.writeFileSync(SHOP, next);
console.log(`Tagged ${tagged} cards with data-series.`);

const counts = {};
for (const m of next.matchAll(/data-series="([^"]+)"/g)) {
    counts[m[1]] = (counts[m[1]] || 0) + 1;
}
console.log(counts);
