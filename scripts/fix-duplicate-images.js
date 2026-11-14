/**
 * Removes repeated product imagery: when two cards on a page share a photo,
 * the second card gets a fresh, unused photo of a matching type.
 *
 * Handles the five repeated images in shop.html and the repeated Neo-Tokyo
 * shot in index.html's community gallery. Run after assign-newgen-images.js.
 */
const fs = require('fs');
const path = require('path');

const PUB = path.join(__dirname, '..', 'public');
const read = f => fs.readFileSync(path.join(PUB, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(PUB, f), s);

const buckets = require('./newgen-image-buckets');
const newImages = fs.existsSync(path.join(__dirname, 'newgen-images.js')) ? require('./newgen-images') : {};

// Spares: bucket photos not used by any new product.
const used = new Set(Object.values(newImages));
const spare = {};
for (const [b, list] of Object.entries(buckets)) spare[b] = list.filter(img => !used.has(img));
const take = bucket => {
    const list = spare[bucket] || [];
    if (!list.length) throw new Error(`no spare image left for bucket ${bucket}`);
    const img = list.shift();
    used.add(img);
    return img;
};

// Which photo type each card that must be re-imaged needs.
const WANT = [
    [/EVA-01 TECH HOODIE|TECH HOODIE/i, 'hoodie'],
    [/DOMAIN EXPANSION/i, 'knit'],
    [/SECTION 9|EDGERUNNERS/i, 'jacket'],
    [/SUKUNA|GRAPHIC TEE/i, 'tee'],
    [/CARGO SHIRT TECHWEAR/i, 'shirt'],
];

const bucketForName = name => {
    const hit = WANT.find(([re]) => re.test(name));
    if (hit) return hit[1];
    if (/hoodie|sweatshirt/i.test(name)) return 'hoodie';
    if (/jacket|bomber|windbreaker/i.test(name)) return 'jacket';
    if (/tee|t-shirt|top/i.test(name)) return 'tee';
    if (/jean|denim/i.test(name)) return 'jeans';
    if (/cargo|pant|jogger/i.test(name)) return 'pants';
    if (/shirt/i.test(name)) return 'shirt';
    if (/knit|cardigan/i.test(name)) return 'knit';
    if (/sneaker|shoe/i.test(name)) return 'shoe';
    if (/cap|hat/i.test(name)) return 'hat';
    if (/bag|tote/i.test(name)) return 'bag';
    return 'model';
};

function fixShop() {
    const html = read('shop.html');
    const cards = [...html.matchAll(/data-name="([^"]+)"[\s\S]{0,700}?src="(assets\/[^"]+)"/g)]
        .map(m => ({ name: m[1], img: m[2], at: m.index }));

    const byImg = {};
    cards.forEach(c => (byImg[c.img] = byImg[c.img] || []).push(c));

    let out = html;
    let fixed = 0;
    for (const [img, group] of Object.entries(byImg)) {
        // keep the first card, re-image every later one (process from the end so
        // earlier offsets stay valid)
        for (const card of group.slice(1).sort((a, b) => b.at - a.at)) {
            const replacement = take(bucketForName(card.name));
            const slice = out.slice(card.at, card.at + 700);
            const newSlice = slice.replace(`src="${img}"`, `src="${replacement}"`);
            if (newSlice === slice) throw new Error(`shop: could not re-image ${card.name}`);
            out = out.slice(0, card.at) + newSlice + out.slice(card.at + 700);
            console.log(`shop: ${card.name}: ${img} -> ${replacement}`);
            fixed++;
        }
    }
    if (fixed) write('shop.html', out);
    return fixed;
}

function fixHome() {
    const html = read('index.html');
    const dup = 'assets/cdn/neo-tokyo-c3e3e2.png';
    const first = html.indexOf(dup);
    const second = html.indexOf(dup, first + 1);
    if (second === -1) return 0;
    const replacement = take('model');
    const out = html.slice(0, second) + html.slice(second).replace(dup, replacement);
    write('index.html', out);
    console.log(`index: community gallery: ${dup} -> ${replacement}`);
    return 1;
}

const n = fixShop() + fixHome();
console.log(`re-imaged ${n} card(s)`);
if (!n) console.log('nothing to do');
