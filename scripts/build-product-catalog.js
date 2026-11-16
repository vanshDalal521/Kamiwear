#!/usr/bin/env node
/**
 * Build the global search catalog from every storefront page.
 *
 * The product grids are static HTML, so the catalog is generated from the same
 * markup the customer sees. Run this whenever products are added or changed:
 *
 *     npm run catalog:build
 */
'use strict';

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'data', 'products.json');

// Order matters: earlier pages provide the richest metadata when the same
// product appears in several places (e.g. the shop and a collection page).
const SOURCES = [
    { file: 'index.html', collection: 'Featured', kind: 'featured' },
    { file: 'shop.html', collection: 'The Archive', kind: 'shop' },
    { file: 'new-fashion.html', collection: 'New Fashion 2026', kind: 'shop' },
    { file: 'women-denim.html', collection: 'Denim Edit', kind: 'shop' },
    { file: 'demon-slayer.html', collection: 'Demon Slayer', kind: 'collection' },
    { file: 'neo-tokyo.html', collection: 'Neo Tokyo', kind: 'collection' },
    { file: 'night-city.html', collection: 'Night City', kind: 'collection' },
    { file: 'cursed-energy.html', collection: 'Cursed Energy', kind: 'collection' },
];

const CARD_ROOT = /<(div|article)\b[^>]*\bdata-price="(\d+)"[^>]*>/gi;
const NAME_ATTR = /\bdata-name="([^"]+)"/i;
const IMG_TAG = /<img\b[^>]*?\bsrc="([^"]+)"/i;
const BG_IMAGE = /background-image\s*:\s*url\(\s*['"]?([^'")\s]+)['"]?\s*\)/i;
const CATEGORY = /<p\b[^>]*>\s*((?:Women|Men|Unisex)\s*·\s*[^<]+?)\s*<\/p>/i;
const HEADING = /<h[1-5]\b[^>]*>([\s\S]*?)<\/h[1-5]>/i;
const SERIES_ATTR = /\bdata-series="([^"]+)"/i;

function clean(value) {
    return String(value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function slug(value) {
    return clean(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 90) || 'product';
}

function classify(name) {
    const value = String(name || '').toUpperCase();
    if (/SNEAKER|RUNNER|SHOE|BOOT/.test(value)) return 'Accessories';
    if (/\b(BELT|BAG|TOTE|CAP|HAT|MASK|PENDANT|SOCKS|NECKLACE|CHAIN)\b|ACCESSOR/.test(value)) return 'Accessories';
    if (/JOGGER|CARGO|PANT|SHORT|JEAN|TROUSER/.test(value)) return 'Bottoms';
    if (/TEE|T-SHIRT|SHIRT|TOP|LONG SLEEVE/.test(value)) return 'Tees';
    if (/HOODIE|JACKET|VEST|KNIT|BOMBER|SWEATSHIRT|COAT|KIMONO|CARDIGAN|CREWNECK/.test(value)) return 'Outerwear';
    return 'Apparel';
}

function genderOf(category) {
    const match = String(category || '').match(/^(Women|Men|Unisex)\b/i);
    return match ? match[1] : '';
}

function extractCards(source) {
    const filePath = path.join(PUBLIC_DIR, source.file);
    if (!fs.existsSync(filePath)) {
        console.warn(`! skipping missing ${source.file}`);
        return [];
    }

    const html = fs.readFileSync(filePath, 'utf8');
    const roots = [...html.matchAll(CARD_ROOT)];
    const cards = [];

    roots.forEach((match, index) => {
        const start = match.index;
        const end = index + 1 < roots.length ? roots[index + 1].index : Math.min(html.length, start + 7000);
        const segment = html.slice(start, end);
        const openingTag = match[0];

        const nameAttr = openingTag.match(NAME_ATTR);
        let name = nameAttr ? clean(nameAttr[1]) : '';
        if (!name) {
            const heading = segment.match(HEADING);
            name = heading ? clean(heading[1]) : '';
        }
        if (!name || name.length > 90) return;

        const price = Number(match[2]) || 0;
        if (!price) return;

        const imageMatch = segment.match(IMG_TAG) || segment.match(BG_IMAGE);
        const image = imageMatch ? imageMatch[1].trim() : '';

        const categoryMatch = segment.match(CATEGORY);
        const rawCategory = categoryMatch ? clean(categoryMatch[1]) : '';
        const type = classify(name);
        const category = rawCategory || `${source.collection} · ${type}`;
        const seriesMatch = openingTag.match(SERIES_ATTR);
        const series = seriesMatch ? clean(seriesMatch[1]) : source.collection;

        cards.push({
            name,
            price,
            image,
            category,
            series,
            gender: genderOf(category),
            type,
            collection: source.collection,
            collections: [source.collection],
            source: source.file,
        });
    });

    return cards;
}

function build() {
    const merged = new Map();
    let conflicts = 0;

    SOURCES.forEach(source => {
        extractCards(source).forEach(card => {
            const key = slug(card.name);
            const existing = merged.get(key);
            if (!existing) {
                merged.set(key, card);
                return;
            }

            if (existing.price !== card.price) {
                conflicts += 1;
                console.warn(`! price conflict for "${card.name}": ${existing.price} vs ${card.price}`);
            }
            // Fill in the richest metadata from later, more specific pages.
            ['image', 'category', 'series', 'gender', 'collection'].forEach(field => {
                if (!existing[field] && card[field]) existing[field] = card[field];
            });
            if (existing.category.startsWith(existing.collection) && !card.category.startsWith(card.collection)) {
                existing.category = card.category;
            }
            if (existing.type === 'Apparel' && card.type !== 'Apparel') existing.type = card.type;
            if (!existing.gender && card.gender) existing.gender = card.gender;
            existing.collections = [...new Set([
                ...(existing.collections || []),
                ...(card.collections || []),
            ])];
        });
    });

    const products = [...merged.entries()]
        .map(([id, product]) => {
            const image = product.image && !product.image.includes('${')
                ? product.image.replace(/^\.?\//, '')
                : '';
            const search = [
                product.name,
                product.category,
                product.series,
                (product.collections || []).join(' '),
                product.gender,
                product.type,
            ].filter(Boolean).join(' ').toLowerCase();
            return {
                id,
                name: product.name,
                price: product.price,
                image,
                category: product.category,
                series: product.series,
                collections: product.collections || [],
                gender: product.gender,
                type: product.type,
                search,
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

    const missingImages = products.filter(product => !product.image);
    if (missingImages.length) {
        console.warn(`! ${missingImages.length} product(s) without an image: ${missingImages.slice(0, 5).map(p => p.name).join(', ')}`);
    }

    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(
        OUTPUT_FILE,
        `${JSON.stringify({
            generatedAt: new Date().toISOString(),
            count: products.length,
            products,
        }, null, 2)}\n`
    );

    console.log(`Catalog written to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
    console.log(`  ${products.length} unique products from ${SOURCES.length} pages`);
    if (conflicts) console.log(`  ${conflicts} price conflict(s) resolved by first source`);
}

build();
