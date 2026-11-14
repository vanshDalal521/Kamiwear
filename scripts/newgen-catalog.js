/**
 * Kamiwear new-generation catalog — 100 fresh products aimed at 15–25 year olds.
 *
 * Every entry is distinct (unique name, price and image) and belongs to exactly
 * one showcase group:
 *   newfashion -> public/new-fashion.html (the dedicated New Fashion section)
 *   slayer     -> public/demon-slayer.html  (Slayer Corps)
 *   cursed     -> public/cursed-energy.html (Cursed Energy)
 *   night      -> public/night-city.html    (Night City)
 *   neotokyo   -> public/neo-tokyo.html     (Neo-Tokyo)
 *
 * `type` drives image selection: scripts/build-newgen.js pulls one photo per
 * product from the matching bucket in public/assets/newgen (see newgen-images.js).
 * `gender` places the card in the matching shop section, so no product ever
 * shows up in two sections.
 *
 * Category chips use enhance.js classifyProduct(), which reads the product
 * name, so names deliberately contain the matching keyword
 * (TEE/SHIRT/TOP -> TEES, JEAN/CARGO/PANT -> BOTTOMS, HOODIE/JACKET -> OUTERWEAR,
 * SNEAKER/CAP/BAG -> ACCESSORIES).
 */
module.exports = [
    // ── NEW FASHION (40) ─────────────────────────────────────────────────────
    { id: 'nf-01', name: 'Hero Oversized Street Jacket', price: 4200, gender: 'unisex', group: 'newfashion', type: 'jacket', tag: 'Unisex · Outerwear', image: 'assets/fashion/hero-oversized-jacket.jpg', note: 'The jacket from the homepage hero.' },
    { id: 'nf-02', name: 'Washed Baggy Jeans Cream', price: 2800, gender: 'women', group: 'newfashion', type: 'jeans', tag: 'Women · Denim' },
    { id: 'nf-03', name: 'Puff Print Hoodie Ink Black', price: 3200, gender: 'unisex', group: 'newfashion', type: 'hoodie', tag: 'Unisex · Hoodies' },
    { id: 'nf-04', name: 'Cropped Zip Hoodie Violet', price: 2600, gender: 'women', group: 'newfashion', type: 'hoodie', tag: 'Women · Hoodies' },
    { id: 'nf-05', name: 'Acid Wash Baggy Denim', price: 3100, gender: 'men', group: 'newfashion', type: 'jeans', tag: 'Men · Denim' },
    { id: 'nf-06', name: 'Boxy Graphic Tee Bone', price: 1600, gender: 'unisex', group: 'newfashion', type: 'tee', tag: 'Unisex · Tees' },
    { id: 'nf-07', name: 'Panel Track Jacket Olive', price: 3400, gender: 'men', group: 'newfashion', type: 'jacket', tag: 'Men · Outerwear' },
    { id: 'nf-08', name: 'Wide Leg Denim Indigo', price: 2900, gender: 'women', group: 'newfashion', type: 'jeans', tag: 'Women · Denim' },
    { id: 'nf-09', name: 'Fleece Crewneck Sand', price: 2400, gender: 'women', group: 'newfashion', type: 'hoodie', tag: 'Women · Fleece' },
    { id: 'nf-10', name: 'Double Knee Work Pants', price: 2700, gender: 'men', group: 'newfashion', type: 'pants', tag: 'Men · Pants' },
    { id: 'nf-11', name: 'Varsity Bomber Navy', price: 4600, gender: 'men', group: 'newfashion', type: 'jacket', tag: 'Men · Outerwear' },
    { id: 'nf-12', name: 'Sherpa Denim Jacket', price: 3900, gender: 'men', group: 'newfashion', type: 'jacket', tag: 'Men · Outerwear' },
    { id: 'nf-13', name: 'Ribbed Knit Cardigan Charcoal', price: 3300, gender: 'women', group: 'newfashion', type: 'knit', tag: 'Women · Knitwear' },
    { id: 'nf-14', name: 'Y2K Baby Tee Lime', price: 1400, gender: 'women', group: 'newfashion', type: 'tee', tag: 'Women · Tees' },
    { id: 'nf-15', name: 'Ripstop Cargo Pants', price: 3000, gender: 'men', group: 'newfashion', type: 'pants', tag: 'Men · Cargo' },
    { id: 'nf-16', name: 'Oversized Band Tee Black', price: 1800, gender: 'men', group: 'newfashion', type: 'tee', tag: 'Men · Tees' },
    { id: 'nf-17', name: 'Denim Overshirt Stone', price: 2800, gender: 'men', group: 'newfashion', type: 'shirt', tag: 'Men · Shirts' },
    { id: 'nf-18', name: 'Cropped Puffer Vest Black', price: 3100, gender: 'women', group: 'newfashion', type: 'jacket', tag: 'Women · Outerwear' },
    { id: 'nf-19', name: 'Tapered Track Pants Grey', price: 2300, gender: 'men', group: 'newfashion', type: 'pants', tag: 'Men · Pants' },
    { id: 'nf-20', name: 'Ringer Tee Acid Green', price: 1500, gender: 'women', group: 'newfashion', type: 'tee', tag: 'Women · Tees' },
    { id: 'nf-21', name: 'Hooded Flannel Charcoal', price: 2900, gender: 'men', group: 'newfashion', type: 'shirt', tag: 'Men · Shirts' },
    { id: 'nf-22', name: 'Parachute Pants Black', price: 2600, gender: 'women', group: 'newfashion', type: 'pants', tag: 'Women · Pants' },
    { id: 'nf-23', name: 'Cable Knit Vest Cream', price: 2500, gender: 'women', group: 'newfashion', type: 'knit', tag: 'Women · Knitwear' },
    { id: 'nf-24', name: 'Zip Through Hoodie Jet', price: 3400, gender: 'men', group: 'newfashion', type: 'hoodie', tag: 'Men · Hoodies' },
    { id: 'nf-25', name: 'Carpenter Jeans Taupe', price: 3000, gender: 'men', group: 'newfashion', type: 'jeans', tag: 'Men · Denim' },
    { id: 'nf-26', name: 'Cropped Hoodie Cream', price: 2500, gender: 'women', group: 'newfashion', type: 'hoodie', tag: 'Women · Hoodies' },
    { id: 'nf-27', name: 'Mesh Long Sleeve Top', price: 1700, gender: 'women', group: 'newfashion', type: 'tee', tag: 'Women · Tops' },
    { id: 'nf-28', name: 'Suede Bomber Jacket Brown', price: 5200, gender: 'men', group: 'newfashion', type: 'jacket', tag: 'Men · Outerwear' },
    { id: 'nf-29', name: 'Distressed Wide Jeans Blue', price: 3200, gender: 'women', group: 'newfashion', type: 'jeans', tag: 'Women · Denim' },
    { id: 'nf-30', name: 'Boxy Pocket Tee White', price: 1600, gender: 'men', group: 'newfashion', type: 'tee', tag: 'Men · Tees' },
    { id: 'nf-31', name: 'Quilted Liner Jacket Sand', price: 4100, gender: 'women', group: 'newfashion', type: 'jacket', tag: 'Women · Outerwear' },
    { id: 'nf-32', name: 'Sweat Shorts Grey', price: 1900, gender: 'men', group: 'newfashion', type: 'pants', tag: 'Men · Shorts' },
    { id: 'nf-33', name: 'Longline Tee Charcoal', price: 1700, gender: 'men', group: 'newfashion', type: 'tee', tag: 'Men · Tees' },
    { id: 'nf-34', name: 'Corduroy Overshirt Rust', price: 3100, gender: 'men', group: 'newfashion', type: 'shirt', tag: 'Men · Shirts' },
    { id: 'nf-35', name: 'Low Top Leather Sneaker', price: 3900, gender: 'unisex', group: 'newfashion', type: 'shoe', tag: 'Unisex · Footwear' },
    { id: 'nf-36', name: 'Dad Cap Washed Black', price: 1200, gender: 'unisex', group: 'newfashion', type: 'hat', tag: 'Unisex · Headwear' },
    { id: 'nf-37', name: 'Crossbody Sling Bag Black', price: 2100, gender: 'unisex', group: 'newfashion', type: 'bag', tag: 'Unisex · Bags' },
    { id: 'nf-38', name: 'Wide Cord Pants Olive', price: 2800, gender: 'women', group: 'newfashion', type: 'pants', tag: 'Women · Pants' },
    { id: 'nf-39', name: 'Graphic Sweatshirt Cloud', price: 2700, gender: 'women', group: 'newfashion', type: 'hoodie', tag: 'Women · Fleece' },
    { id: 'nf-40', name: 'Canvas High Top Sneaker', price: 3400, gender: 'women', group: 'newfashion', type: 'shoe', tag: 'Women · Footwear' },

    // ── SLAYER CORPS (15) ───────────────────────────────────────────────────
    { id: 'sl-01', name: 'Water Wash Hoodie Sky', price: 3300, gender: 'men', group: 'slayer', type: 'hoodie', tag: 'Men · Hoodies' },
    { id: 'sl-02', name: 'Flame Orange Bomber Jacket', price: 4700, gender: 'men', group: 'slayer', type: 'jacket', tag: 'Men · Outerwear' },
    { id: 'sl-03', name: 'Baggy Jeans Wash Blue', price: 2900, gender: 'men', group: 'slayer', type: 'jeans', tag: 'Men · Denim' },
    { id: 'sl-04', name: 'Pinstripe Wide Jeans', price: 3100, gender: 'women', group: 'slayer', type: 'jeans', tag: 'Women · Denim' },
    { id: 'sl-05', name: 'Oversized Tee Storm Grey', price: 1700, gender: 'men', group: 'slayer', type: 'tee', tag: 'Men · Tees' },
    { id: 'sl-06', name: 'Track Jacket Retro Blue', price: 3200, gender: 'women', group: 'slayer', type: 'jacket', tag: 'Women · Outerwear' },
    { id: 'sl-07', name: 'Fleece Joggers Forest', price: 2400, gender: 'men', group: 'slayer', type: 'pants', tag: 'Men · Joggers' },
    { id: 'sl-08', name: 'Crop Top Tee Sunrise', price: 1300, gender: 'women', group: 'slayer', type: 'tee', tag: 'Women · Tees' },
    { id: 'sl-09', name: 'Denim Trucker Jacket Indigo', price: 3600, gender: 'men', group: 'slayer', type: 'jacket', tag: 'Men · Outerwear' },
    { id: 'sl-10', name: 'Oxford Shirt Sky Blue', price: 2200, gender: 'men', group: 'slayer', type: 'shirt', tag: 'Men · Shirts' },
    { id: 'sl-11', name: 'Graphic Hoodie Crimson', price: 3500, gender: 'unisex', group: 'slayer', type: 'hoodie', tag: 'Unisex · Hoodies' },
    { id: 'sl-12', name: 'Cargo Shorts Khaki', price: 1900, gender: 'men', group: 'slayer', type: 'pants', tag: 'Men · Shorts' },
    { id: 'sl-13', name: 'Knit Beanie Rib Sand', price: 1100, gender: 'unisex', group: 'slayer', type: 'hat', tag: 'Unisex · Headwear' },
    { id: 'sl-14', name: 'Skate Sneaker White', price: 3600, gender: 'unisex', group: 'slayer', type: 'shoe', tag: 'Unisex · Footwear' },
    { id: 'sl-15', name: 'Printed Tote Bag Canvas', price: 1500, gender: 'women', group: 'slayer', type: 'bag', tag: 'Women · Bags' },

    // ── CURSED ENERGY (15) ──────────────────────────────────────────────────
    { id: 'ce-01', name: 'Void Black Zip Hoodie', price: 3600, gender: 'men', group: 'cursed', type: 'hoodie', tag: 'Men · Hoodies' },
    { id: 'ce-02', name: 'Purple Wash Baggy Jeans', price: 3000, gender: 'women', group: 'cursed', type: 'jeans', tag: 'Women · Denim' },
    { id: 'ce-03', name: 'Motocross Tee Black', price: 1900, gender: 'men', group: 'cursed', type: 'tee', tag: 'Men · Tees' },
    { id: 'ce-04', name: 'Utility Vest Black', price: 2800, gender: 'women', group: 'cursed', type: 'jacket', tag: 'Women · Outerwear' },
    { id: 'ce-05', name: 'Tapered Cargo Grey', price: 3100, gender: 'men', group: 'cursed', type: 'pants', tag: 'Men · Cargo' },
    { id: 'ce-06', name: 'Cropped Knit Top Black', price: 1800, gender: 'women', group: 'cursed', type: 'knit', tag: 'Women · Knitwear' },
    { id: 'ce-07', name: 'Oversized Hoodie Smoke', price: 3400, gender: 'men', group: 'cursed', type: 'hoodie', tag: 'Men · Hoodies' },
    { id: 'ce-08', name: 'Asym Zip Top Charcoal', price: 2600, gender: 'women', group: 'cursed', type: 'tee', tag: 'Women · Tops' },
    { id: 'ce-09', name: 'Leather Biker Jacket Jet', price: 5900, gender: 'unisex', group: 'cursed', type: 'jacket', tag: 'Unisex · Outerwear' },
    { id: 'ce-10', name: 'Wide Leg Trousers Ink', price: 2700, gender: 'women', group: 'cursed', type: 'pants', tag: 'Women · Trousers' },
    { id: 'ce-11', name: 'Fleece Half Zip Sand', price: 2900, gender: 'men', group: 'cursed', type: 'hoodie', tag: 'Men · Fleece' },
    { id: 'ce-12', name: 'Long Sleeve Top Mesh', price: 1700, gender: 'women', group: 'cursed', type: 'tee', tag: 'Women · Tops' },
    { id: 'ce-13', name: 'Chunky Chain Necklace', price: 1400, gender: 'unisex', group: 'cursed', type: 'accessory', tag: 'Unisex · Jewelry' },
    { id: 'ce-14', name: 'High Top Sneaker Jet', price: 4200, gender: 'unisex', group: 'cursed', type: 'shoe', tag: 'Unisex · Footwear' },
    { id: 'ce-15', name: 'Studded Belt Black', price: 1300, gender: 'unisex', group: 'cursed', type: 'accessory', tag: 'Unisex · Belts' },

    // ── NIGHT CITY (15) ─────────────────────────────────────────────────────
    { id: 'nc-01', name: 'Neon Panel Windbreaker', price: 4300, gender: 'unisex', group: 'night', type: 'jacket', tag: 'Unisex · Outerwear' },
    { id: 'nc-02', name: 'Tech Cargo Pants Black', price: 3300, gender: 'men', group: 'night', type: 'pants', tag: 'Men · Cargo' },
    { id: 'nc-03', name: 'Reflective Tee Silver', price: 2100, gender: 'men', group: 'night', type: 'tee', tag: 'Men · Tees' },
    { id: 'nc-04', name: 'Gorpcore Shell Jacket', price: 5400, gender: 'men', group: 'night', type: 'jacket', tag: 'Men · Outerwear' },
    { id: 'nc-05', name: 'Baggy Sweatpants Fleece', price: 2600, gender: 'women', group: 'night', type: 'pants', tag: 'Women · Pants' },
    { id: 'nc-06', name: 'Cropped Hoodie Graphite', price: 2700, gender: 'women', group: 'night', type: 'hoodie', tag: 'Women · Hoodies' },
    { id: 'nc-07', name: 'Panel Ski Jacket Volt', price: 5600, gender: 'unisex', group: 'night', type: 'jacket', tag: 'Unisex · Outerwear' },
    { id: 'nc-08', name: 'Slim Jean Wash Black', price: 2800, gender: 'men', group: 'night', type: 'jeans', tag: 'Men · Denim' },
    { id: 'nc-09', name: 'Graphic Long Sleeve Tee', price: 2000, gender: 'women', group: 'night', type: 'tee', tag: 'Women · Tees' },
    { id: 'nc-10', name: 'Tapered Track Jacket', price: 3100, gender: 'women', group: 'night', type: 'jacket', tag: 'Women · Outerwear' },
    { id: 'nc-11', name: 'Waffle Knit Crew Sand', price: 2400, gender: 'men', group: 'night', type: 'knit', tag: 'Men · Knitwear' },
    { id: 'nc-12', name: 'Sling Pack Black', price: 1900, gender: 'unisex', group: 'night', type: 'bag', tag: 'Unisex · Bags' },
    { id: 'nc-13', name: 'Runner Sneaker Volt', price: 4400, gender: 'unisex', group: 'night', type: 'shoe', tag: 'Unisex · Footwear' },
    { id: 'nc-14', name: 'Bucket Hat Washed Black', price: 1300, gender: 'unisex', group: 'night', type: 'hat', tag: 'Unisex · Headwear' },
    { id: 'nc-15', name: 'Flare Denim Wash Blue', price: 3000, gender: 'women', group: 'night', type: 'jeans', tag: 'Women · Denim' },

    // ── NEO-TOKYO (15) ──────────────────────────────────────────────────────
    { id: 'nt-01', name: 'Tokyo Oversized Tee White', price: 1800, gender: 'unisex', group: 'neotokyo', type: 'tee', tag: 'Unisex · Tees' },
    { id: 'nt-02', name: 'Acid Knit Cardigan Lime', price: 3200, gender: 'women', group: 'neotokyo', type: 'knit', tag: 'Women · Knitwear' },
    { id: 'nt-03', name: 'Racing Striped Jacket', price: 3900, gender: 'men', group: 'neotokyo', type: 'jacket', tag: 'Men · Outerwear' },
    { id: 'nt-04', name: 'Baggy Carpenter Denim', price: 3100, gender: 'men', group: 'neotokyo', type: 'jeans', tag: 'Men · Denim' },
    { id: 'nt-05', name: 'Cropped Sweatshirt Pink', price: 2400, gender: 'women', group: 'neotokyo', type: 'hoodie', tag: 'Women · Fleece' },
    { id: 'nt-06', name: 'Two Tone Track Top', price: 3300, gender: 'men', group: 'neotokyo', type: 'jacket', tag: 'Men · Outerwear' },
    { id: 'nt-07', name: 'Wide Jeans Acid Wash', price: 3200, gender: 'women', group: 'neotokyo', type: 'jeans', tag: 'Women · Denim' },
    { id: 'nt-08', name: 'Oversized Hoodie Sky', price: 3300, gender: 'unisex', group: 'neotokyo', type: 'hoodie', tag: 'Unisex · Hoodies' },
    { id: 'nt-09', name: 'Slogan Tee Oversized', price: 1600, gender: 'men', group: 'neotokyo', type: 'tee', tag: 'Men · Tees' },
    { id: 'nt-10', name: 'Denim Shirt Jacket Blue', price: 3400, gender: 'women', group: 'neotokyo', type: 'shirt', tag: 'Women · Shirts' },
    { id: 'nt-11', name: 'Sweat Shorts Acid Green', price: 1800, gender: 'men', group: 'neotokyo', type: 'pants', tag: 'Men · Shorts' },
    { id: 'nt-12', name: 'Platform Skate Shoe', price: 3800, gender: 'women', group: 'neotokyo', type: 'shoe', tag: 'Women · Footwear' },
    { id: 'nt-13', name: 'Graphic Bucket Hat', price: 1400, gender: 'unisex', group: 'neotokyo', type: 'hat', tag: 'Unisex · Headwear' },
    { id: 'nt-14', name: 'Mini Crossbody Bag Silver', price: 2200, gender: 'women', group: 'neotokyo', type: 'bag', tag: 'Women · Bags' },
    { id: 'nt-15', name: 'Ribbed Tank Top Sand', price: 1300, gender: 'women', group: 'neotokyo', type: 'tee', tag: 'Women · Tops' },
];
