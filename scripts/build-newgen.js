/**
 * Builds the "new generation" catalog into the site (idempotent):
 *
 *   1. injects a NEW DROP 2026 row into every gender section of shop.html
 *   2. generates public/new-fashion.html (its own page, not a shop redirect)
 *   3. adds a New Gen Drop section to the four collection pages and removes a
 *      few of the weaker legacy cards from them
 *   4. points the homepage New Fashion card + chips at the new page
 *   5. validates: no product/image repeats inside a page, all images exist,
 *      and every page stays div-balanced
 *
 * Run: node scripts/build-newgen.js
 */
const fs = require('fs');
const path = require('path');
const catalog = require('./newgen-catalog');

const PUB = path.join(__dirname, '..', 'public');
const read = f => fs.readFileSync(path.join(PUB, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(PUB, f), s);
const money = n => '₹' + Number(n).toLocaleString('en-IN');

// Product images live in scripts/newgen-images.js ({ id: 'assets/...' }).
const imageMapPath = path.join(__dirname, 'newgen-images.js');
if (!fs.existsSync(imageMapPath)) {
    console.error('Missing scripts/newgen-images.js — run the image harvest first.');
    process.exit(1);
}
const images = require('./newgen-images');

const TYPE_ORDER = { jacket: 0, hoodie: 1, knit: 2, shirt: 3, tee: 4, jeans: 5, pants: 6, shoe: 7, hat: 8, bag: 9, accessory: 10 };

const products = catalog.map(p => ({ ...p, image: images[p.id] || p.image }));
const problems = [];
for (const p of products) {
    if (!p.image) problems.push(`${p.id} (${p.name}) has no image`);
    else if (!fs.existsSync(path.join(PUB, p.image))) problems.push(`${p.id}: missing file ${p.image}`);
}
if (problems.length) {
    console.error('Image problems:\n  ' + problems.join('\n  '));
    process.exit(1);
}
const dupImages = products.map(p => p.image).filter((v, i, a) => a.indexOf(v) !== i);
if (dupImages.length) {
    console.error('Images reused by more than one new product: ' + [...new Set(dupImages)].join(', '));
    process.exit(1);
}

const byGroup = g => products.filter(p => p.group === g).sort((a, b) => (TYPE_ORDER[a.type] - TYPE_ORDER[b.type]) || a.name.localeCompare(b.name));
const byGender = g => products.filter(p => p.gender === g).sort((a, b) => (TYPE_ORDER[a.type] - TYPE_ORDER[b.type]) || a.name.localeCompare(b.name));

// ─────────────────────────────────────────────────────────────── card markup
function shopCard(p) {
    const alt = p.name.replace(/"/g, '&quot;');
    return `                        <div class="product-card group relative" data-price="${p.price}" data-name="${p.name}" data-series="New Drop">
                            <div class="relative aspect-[4/5] glass-panel rounded-2xl overflow-hidden mb-4">
                                <img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    src="${p.image}" alt="${alt}" />
                                <div class="absolute top-4 left-4"><span class="font-orbitron text-[10px] bg-primary text-black px-2 py-1 font-bold">NEW</span></div>
                                <button class="absolute top-4 right-4 h-10 w-10 glass-panel flex items-center justify-center rounded-full hover:bg-white/20 transition-all"><span class="material-symbols-outlined text-xl">favorite</span></button>
                                <div class="quick-view absolute bottom-4 left-4 right-4 opacity-0 transform translate-y-4 transition-all duration-300 flex flex-col gap-2">
                                    <button class="w-full py-3 bg-white text-background-dark font-bold text-xs tracking-widest rounded-xl shadow-2xl uppercase">Quick View</button>
                                    <button class="w-full py-3 bg-primary text-black font-bold text-xs tracking-widest rounded-xl shadow-2xl uppercase flex items-center justify-center gap-2"><span class="material-symbols-outlined text-sm">add_shopping_cart</span>ADD TO CART</button>
                                </div>
                            </div>
                            <div class="space-y-1 px-2">
                                <p class="text-[10px] font-bold text-primary tracking-widest uppercase">${p.tag}</p>
                                <h3 class="text-sm font-semibold text-white/90">${p.name.toUpperCase()}</h3>
                                <div class="flex items-center justify-between mt-2"><p class="text-sm font-bold text-primary">${money(p.price)}.00</p><div class="flex text-primary"><span class="material-symbols-outlined text-xs fill-1">star</span><span class="material-symbols-outlined text-xs fill-1">star</span><span class="material-symbols-outlined text-xs fill-1">star</span><span class="material-symbols-outlined text-xs fill-1">star</span><span class="material-symbols-outlined text-xs">star</span></div></div>
                            </div>
                        </div>`;
}

function shopBlock(gender) {
    const list = byGender(gender);
    const grids = [];
    for (let i = 0; i < list.length; i += 8) grids.push(list.slice(i, i + 8).map((p, j) => shopCard(p)).join('\n'));
    return `<!-- NEWGEN:SHOP:${gender}:BEGIN -->
                    <h3 class="font-syne text-xl font-bold tracking-widest uppercase mb-4 flex items-center gap-3">
                        <span class="h-px flex-1 bg-white/10"></span>
                        <span class="text-primary">New Drop 2026</span>
                        <span class="h-px flex-1 bg-white/10"></span>
                    </h3>
${grids.map(g => `                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
${g}
                    </div>`).join('\n')}
                    <!-- NEWGEN:SHOP:${gender}:END -->`;
}

// ───────────────────────────────────────────────────────────────── shop.html
function upsertMarkers(html, gender, block) {
    const begin = `<!-- NEWGEN:SHOP:${gender}:BEGIN -->`;
    const end = `<!-- NEWGEN:SHOP:${gender}:END -->`;
    const bi = html.indexOf(begin);
    if (bi !== -1) {
        const ei = html.indexOf(end, bi);
        if (ei === -1) throw new Error(`unclosed marker for ${gender}`);
        return html.slice(0, bi) + block + html.slice(ei + end.length);
    }
    // First run: insert straight after the section's own header, so the drop is
    // the first thing shoppers see in that section.
    const secStart = html.indexOf(`data-gender="${gender}"`);
    if (secStart === -1) throw new Error(`no section for ${gender}`);
    const rowHeader = html.indexOf('<h3 class="font-syne', secStart);
    if (rowHeader === -1) throw new Error(`no insertion point for ${gender}`);
    return html.slice(0, rowHeader) + block + '\n                    ' + html.slice(rowHeader);
}

function buildShop() {
    let html = read('shop.html');
    for (const gender of ['women', 'men', 'unisex']) html = upsertMarkers(html, gender, shopBlock(gender));
    write('shop.html', html);
    return html;
}

// ─────────────────────────────────────────────────────── collection cards
function collectionCard(p, page) {
    const border = page === 'demon-slayer' ? 'hover:border-primary/30'
        : page === 'cursed-energy' ? 'hover:border-curse-glow/50'
            : 'hover:border-primary/30';
    const badge = page === 'demon-slayer'
        ? `                    <div class="absolute top-6 left-6 z-10 font-orbitron text-[10px] text-flame font-bold bg-black/40 px-2 py-0.5 rounded border border-flame/50">NEW GEN</div>\n`
        : '';
    const headingClass = page === 'demon-slayer' ? 'text-lavender font-bold text-lg' : 'text-white font-bold text-lg';
    return `                <div
                    class="group relative liquid-glass rounded-2xl p-4 flex flex-col transition-all duration-300 ${border}" data-price="${p.price}" data-name="${p.name}">
${badge}                    <div class="aspect-[4/5] rounded-xl bg-cover bg-center mb-6"
                        data-alt="${p.name}"
                        style="background-image: url('${p.image}')">
                    </div>
                    <div class="space-y-1">
                        <p class="text-[10px] font-orbitron font-bold tracking-widest uppercase text-primary">${p.tag}</p>
                        <h3 class="${headingClass}">${p.name}</h3>
                        <p class="text-primary font-bold text-xl">${money(p.price)}</p>
                    </div>
                    <button
                        class="mt-4 w-full bg-primary text-black font-bold py-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        ADD TO CART <span class="material-symbols-outlined text-sm">add_shopping_cart</span>
                    </button>
                </div>`;
}

const COLLECTIONS = {
    'demon-slayer.html': { group: 'slayer', before: '<!-- Collection Story -->', title: 'Fresh For The Corps', kicker: 'Slayer Corps · New Gen' },
    'cursed-energy.html': { group: 'cursed', before: '</main>', title: 'Beyond The Curse', kicker: 'Cursed Energy · New Gen' },
    'night-city.html': { group: 'night', before: '</main>', title: 'Street Of The Future', kicker: 'Night City · New Gen' },
    'neo-tokyo.html': { group: 'neotokyo', before: '</main>', title: 'Neo Street 2026', kicker: 'Neo-Tokyo · New Gen' },
};

// Weaker legacy cards the user asked us to prune from the collection pages.
const REMOVE = {
    'demon-slayer.html': ['Accessories Pack', 'Destructive Tee', 'Shadow Joggers'],
    'cursed-energy.html': ['Nobara Resonance', 'Shibuya Incident'],
    'night-city.html': ['Cyber-Link Joggers', 'Maelstrom Tactical'],
    'neo-tokyo.html': [],
};

function removeCard(html, page, name) {
    const h3 = html.indexOf(`>${name}</h3>`);
    if (h3 === -1) return { html, removed: false };
    const start = html.lastIndexOf('<!-- Product Card', h3);
    if (start === -1) throw new Error(`${page}: cannot locate card start for ${name}`);
    let end = html.indexOf('<!-- Product Card', h3);
    if (end === -1) {
        const btn = html.indexOf('</button>', h3);
        const cardClose = btn !== -1 ? html.indexOf('</div>', btn) : -1;
        if (cardClose === -1) throw new Error(`${page}: cannot locate card end for ${name}`);
        end = cardClose + 6;
    }
    return { html: html.slice(0, start) + html.slice(end), removed: true };
}

function buildCollections() {
    const report = [];
    for (const [file, cfg] of Object.entries(COLLECTIONS)) {
        let html = read(file);

        for (const name of REMOVE[file] || []) {
            const r = removeCard(html, file, name);
            html = r.html;
            report.push(`${file}: ${r.removed ? 'removed' : 'already gone'} "${name}"`);
        }

        const list = byGroup(cfg.group);
        const begin = `<!-- NEWGEN:COLL:${cfg.group}:BEGIN -->`;
        const end = `<!-- NEWGEN:COLL:${cfg.group}:END -->`;
        const block = `${begin}
        <section class="max-w-7xl mx-auto px-6 pb-24">
            <div class="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                    <p class="text-primary font-bold tracking-[0.2em] text-sm mb-2 uppercase">${cfg.kicker}</p>
                    <h2 class="font-syne text-4xl md:text-5xl uppercase font-extrabold italic">${cfg.title}</h2>
                    <p class="text-slate-400 text-sm mt-3">Denim · jackets · hoodies · tees — curated for the 15–25 crowd.</p>
                </div>
                <a class="text-sm font-medium border-b border-primary pb-1 hover:text-primary transition-colors" href="new-fashion.html">SEE ALL NEW FASHION</a>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
${list.map(p => collectionCard(p, file.replace('.html', ''))).join('\n')}
            </div>
        </section>
        ${end}`;

        const bi = html.indexOf(begin);
        if (bi !== -1) {
            const ei = html.indexOf(end, bi);
            html = html.slice(0, bi) + block + html.slice(ei + end.length);
        } else {
            const anchor = html.indexOf(cfg.before);
            if (anchor === -1) throw new Error(`${file}: anchor ${cfg.before} not found`);
            html = html.slice(0, anchor) + block + '\n        ' + html.slice(anchor);
        }
        write(file, html);
        report.push(`${file}: ${list.length} new-gen products`);
    }
    return report;
}

// ─────────────────────────────────────────────────────── new-fashion.html
function buildNewFashion() {
    const shop = read('shop.html');
    const MAIN_OPEN = '<main class="max-w-[1440px] mx-auto px-8 py-8">';
    const i = shop.indexOf(MAIN_OPEN);
    const j = shop.lastIndexOf('</main>');
    if (i === -1 || j === -1) throw new Error('shop.html main landmarks not found');
    const head = shop.slice(0, i + MAIN_OPEN.length);
    const tail = shop.slice(j);
    const body = shop.slice(i + MAIN_OPEN.length, j);

    // Header: breadcrumb + title + count line.
    let out = head
        .replace('<title>Kamiwear Anime Streetwear Shop Catalog</title>', '<title>Kamiwear | New Fashion 2026</title>');

    const bodyStart = body.indexOf('<!-- Breadcrumbs & Header -->');
    const sectionsStart = body.indexOf('<!-- ═══');
    const scriptStart = body.indexOf('<!-- Gender filter + progressive reveal script -->');
    if (bodyStart === -1 || sectionsStart === -1 || scriptStart === -1) throw new Error('new-fashion: shop body landmarks not found');

    let headerBlock = body.slice(bodyStart, sectionsStart);
    headerBlock = headerBlock
        .replace('<span class="text-slate-300">Shop</span>', '<span class="text-slate-300">New Fashion</span>')
        .replace('>ALL PRODUCTS<', '>NEW FASHION<')
        .replace(/Showing \d+ of \d+ products in premium catalog/,
            `Showing 12 of ${byGroup('newfashion').length} products in the 2026 drop`);
    if (!headerBlock.includes('>NEW FASHION<')) throw new Error('new-fashion: header title not injected');

    // Sidebar: drop the Anime Series block (this page has no anime series).
    const seriesStart = headerBlock.indexOf('<div class="h-px bg-white/10 mb-6"></div>');
    const categoriesStart = headerBlock.indexOf('<div class="mt-8">', seriesStart);
    if (seriesStart === -1 || categoriesStart === -1) throw new Error('new-fashion: sidebar landmarks not found');
    headerBlock = headerBlock.slice(0, seriesStart) + headerBlock.slice(categoriesStart);

    const sectionMarkup = gender => {
        const list = byGender(gender);
        const label = gender === 'women' ? "WOMEN'S DROP" : gender === 'men' ? "MEN'S DROP" : 'UNISEX DROP';
        const blurb = gender === 'women' ? 'Wide-leg denim · cropped hoodies · baby tees'
            : gender === 'men' ? 'Baggy jeans · bombers · oversized tees' : 'Shared fits · fleece · layering';
        return `                <div class="product-section" data-gender="${gender}">
                    <div class="relative mb-8 overflow-hidden rounded-2xl" style="background: linear-gradient(135deg, #140d2b 0%, #2a1b52 45%, #0a0a1a 100%);">
                        <div class="absolute inset-0 opacity-25" style="background: radial-gradient(circle at 25% 50%, #a855f7 0%, transparent 60%), radial-gradient(circle at 75% 50%, #22d3ee 0%, transparent 60%);"></div>
                        <div class="relative p-8 flex items-center justify-between gap-6">
                            <div>
                                <p class="text-[10px] font-bold tracking-[0.3em] text-accent-purple-light mb-2">NEW FASHION</p>
                                <h2 class="font-syne text-4xl font-extrabold text-white tracking-tight">${label}</h2>
                                <p class="text-slate-400 text-sm mt-2">${blurb}</p>
                            </div>
                            <span class="hidden md:block font-orbitron text-5xl font-bold text-white/10">${String(list.length).padStart(2, '0')}</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
${list.map(shopCard).join('\n')}
                    </div>
                </div>`;
    };

    let script = body.slice(scriptStart);
    script = script.replace(`                        // Initialize: show all
                        filterGender('all');`, `                        // Initialize: show all, or the section linked from the homepage chips
                        filterGender('all');
                        const presetGender = new URLSearchParams(location.search).get('gender');
                        if (['men', 'women', 'unisex'].includes(presetGender)) filterGender(presetGender);`);
    if (!script.includes('presetGender')) throw new Error('new-fashion: gender preset hook not injected');
    script = script.replace('data-kw-paginated="true"', 'data-kw-paginated="true"');

    out += headerBlock
        + ['women', 'men', 'unisex'].map(sectionMarkup).join('\n')
        + script;

    out += tail;
    write('new-fashion.html', out);
    return byGroup('newfashion').length;
}

// ────────────────────────────────────────────────────────────── homepage
function buildHome() {
    let html = read('index.html');
    const apply = (from, to, label) => {
        if (html.includes(to)) return; // already applied
        if (!html.includes(from)) throw new Error(`homepage: ${label} anchor not found`);
        html = html.replace(from, to);
    };

    // Featured "New Fashion" card + section chips now open the dedicated page.
    apply(`onclick="window.location.href='shop.html'"
                class="group relative overflow-hidden rounded-xl aspect-[3/4] cursor-pointer">
                <div class="collection-img absolute inset-0 bg-cover bg-center group-hover:scale-110"
                    style="background-image: url('assets/fashion/jean-women-48c39f8f8ffd.jpg');">`,
        `onclick="window.location.href='new-fashion.html'"
                class="group relative overflow-hidden rounded-xl aspect-[3/4] cursor-pointer">
                <div class="collection-img absolute inset-0 bg-cover bg-center group-hover:scale-110"
                    style="background-image: url('assets/fashion/jean-women-48c39f8f8ffd.jpg');">`,
        'featured New Fashion card');

    const chip = (label, href) => apply(
        `<a href="shop.html" class="px-4 py-2 rounded-full ${label === 'All' ? 'bg-primary text-black' : 'bg-white/10 hover:bg-white/20'} text-[11px] font-bold tracking-widest uppercase${label === 'All' ? '' : ' transition-colors'}">${label}</a>`,
        `<a href="${href}" class="px-4 py-2 rounded-full ${label === 'All' ? 'bg-primary text-black' : 'bg-white/10 hover:bg-white/20'} text-[11px] font-bold tracking-widest uppercase${label === 'All' ? '' : ' transition-colors'}">${label}</a>`,
        `section chip ${label}`);
    chip('All', 'new-fashion.html');
    chip('Men', 'new-fashion.html?gender=men');
    chip('Women', 'new-fashion.html?gender=women');
    chip('Unisex', 'new-fashion.html?gender=unisex');

    // Hero jacket is a real product — feature it as card 1 of the section.
    apply('data-price="2800" data-name="Embroidered Denim Jacket"',
        'data-price="4200" data-name="Hero Oversized Street Jacket"', 'hero product name');
    apply(`<img alt="Embroidered Denim Jacket"
                            class="w-full h-full object-cover transition-transform group-hover:scale-105"
                            src="assets/cdn/denim-jacket-with-embroidery-87f061.png" />`,
        `<img alt="Hero Oversized Street Jacket"
                            class="w-full h-full object-cover transition-transform group-hover:scale-105"
                            src="assets/fashion/hero-oversized-jacket.jpg" />`, 'hero product image');
    apply(`<h5 class="font-bold text-slate-200">EMBROIDERED DENIM JACKET</h5>
                            <p class="text-xs text-primary font-bold uppercase mt-1">Men · Outerwear</p>`,
        `<h5 class="font-bold text-slate-200">HERO OVERSIZED STREET JACKET</h5>
                            <p class="text-xs text-primary font-bold uppercase mt-1">Unisex · Outerwear</p>`, 'hero product label');
    apply(`<span class="font-bold">₹2,800</span>
                    </div>
                </div>
                <div class="group relative glass-panel rounded-xl overflow-hidden p-4" data-price="2800" data-name="Women Wide-Leg Jeans Blue">`,
        `<span class="font-bold">₹4,200</span>
                    </div>
                </div>
                <div class="group relative glass-panel rounded-xl overflow-hidden p-4" data-price="2800" data-name="Women Wide-Leg Jeans Blue">`, 'hero product price');

    write('index.html', html);
    return html.includes('new-fashion.html?gender=men') && html.includes('HERO OVERSIZED STREET JACKET');
}

// ───────────────────────────────────────────────────────────── validation
function divBalanced(file) {
    const html = read(file);
    const o = (html.match(/<div\b/g) || []).length;
    const c = (html.match(/<\/div>/g) || []).length;
    return { file, o, c, ok: o === c };
}

function validate() {
    const issues = [];

    // Every page: no product name or image used twice.
    for (const file of ['shop.html', 'new-fashion.html', 'demon-slayer.html', 'cursed-energy.html', 'night-city.html', 'neo-tokyo.html', 'index.html']) {
        const html = read(file);
        const bal = divBalanced(file);
        if (!bal.ok) issues.push(`${file}: divs ${bal.o}/${bal.c}`);

        const names = [...html.matchAll(/data-name="([^"]+)"/g)].map(m => m[1].toLowerCase());
        const dupN = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))];
        if (dupN.length) issues.push(`${file}: repeated product names: ${dupN.join(', ')}`);

        const imgs = [...html.matchAll(/(?:src=|url\(['"]?)(assets\/[^'")]+)/g)].map(m => m[1]);
        const dupI = [...new Set(imgs.filter((n, i) => imgs.indexOf(n) !== i))];
        if (dupI.length) issues.push(`${file}: repeated images: ${dupI.join(', ')}`);

        const missing = [...new Set(imgs)].filter(s => !fs.existsSync(path.join(PUB, s)));
        if (missing.length) issues.push(`${file}: missing files: ${missing.join(', ')}`);

        const externals = (html.match(/https:\/\/(?:i\.pinimg|images\.unsplash|images\.pexels)/g) || []).length;
        if (externals) issues.push(`${file}: ${externals} external image references`);
    }

    // Shop: every card sits in exactly one gender section, sections disjoint.
    const shop = read('shop.html');
    const sections = {};
    for (const gender of ['women', 'men', 'unisex']) {
        const start = shop.indexOf(`data-gender="${gender}"`);
        const nextStart = ['women', 'men', 'unisex'].map(g => shop.indexOf(`data-gender="${g}"`)).filter(x => x > start).sort((a, b) => a - b)[0];
        const end = nextStart !== undefined ? nextStart : shop.indexOf('<!-- Gender filter + progressive reveal script -->');
        const chunk = shop.slice(start, end);
        sections[gender] = [...chunk.matchAll(/data-name="([^"]+)"/g)].map(m => m[1]);
    }
    const all = Object.values(sections).flat();
    const dupAcross = [...new Set(all.filter((n, i) => all.indexOf(n) !== i))];
    if (dupAcross.length) issues.push(`shop.html: product in two sections: ${dupAcross.join(', ')}`);

    return { issues, sections, counts: Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, v.length])), total: all.length };
}

// ──────────────────────────────────────────────────────────────────── run
function main() {
    buildShop();
    const nf = buildNewFashion();
    const collectionReport = buildCollections();
    const homeOk = buildHome();
    const v = validate();

    console.log('new-fashion.html products:', nf);
    collectionReport.forEach(r => console.log(' ', r));
    console.log(' homepage links new-fashion:', homeOk);
    console.log(' shop sections:', JSON.stringify(v.counts), 'total', v.total);
    if (v.issues.length) {
        console.error('\nVALIDATION ISSUES:');
        v.issues.forEach(i => console.error('  - ' + i));
        process.exit(1);
    }
    console.log('validation: OK');
}

main();
