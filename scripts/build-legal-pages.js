#!/usr/bin/env node
/**
 * Build the Kamiwear support and legal pages.
 *
 * Run after editing policy copy:
 *
 *     node scripts/build-legal-pages.js
 *
 * The generated HTML is static and committed with the storefront.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const UPDATED = '16 November 2026';
const EMAIL = 'support@kamiwear.com';

const head = (title, description) => `<!DOCTYPE html>
<html class="dark" lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&amp;family=Orbitron:wght@500;700&amp;family=Syne:wght@600;700;800&amp;display=swap"
        rel="stylesheet" />
    <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
        rel="stylesheet" />
    <script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#f9f906",
                        "accent-purple": "#6366f1",
                        "background-light": "#f8f8f5",
                        "background-dark": "#0A0812",
                        "glass": "rgba(255, 255, 255, 0.03)",
                        "glass-border": "rgba(255, 255, 255, 0.1)"
                    },
                    fontFamily: {
                        "display": ["Inter", "sans-serif"],
                        "syne": ["Syne", "sans-serif"],
                        "orbitron": ["Orbitron", "sans-serif"]
                    },
                    borderRadius: {
                        "DEFAULT": "1rem",
                        "lg": "2rem",
                        "xl": "3rem",
                        "full": "9999px"
                    }
                }
            }
        }
    </script>
    <style>
        :root {
            --ink: #08070d;
            --paper: #f4f1e8;
            --acid: #f9f906;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            background: var(--ink);
            color: #f8fafc;
            font-family: Inter, system-ui, sans-serif;
            -webkit-font-smoothing: antialiased;
            overflow-x: hidden;
        }

        .glass-panel {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border: 1px solid rgba(255, 255, 255, 0.09);
        }

        .eyebrow {
            font-family: Orbitron, sans-serif;
            font-size: 10px;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: var(--acid);
        }

        .page-title {
            font-family: Syne, sans-serif;
            font-weight: 800;
            font-size: clamp(1.25rem, 7.6vw, 7rem);
            line-height: 0.9;
            letter-spacing: -0.05em;
            text-transform: uppercase;
        }

        .legal-prose h2 {
            font-family: Syne, sans-serif;
            font-size: clamp(1.6rem, 3vw, 2.35rem);
            line-height: 1;
            letter-spacing: -0.035em;
            text-transform: uppercase;
            font-weight: 800;
            color: #fff;
        }

        .legal-prose h3 {
            font-family: Inter, sans-serif;
            font-size: 0.82rem;
            line-height: 1.5;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            font-weight: 700;
            color: #fff;
        }

        .legal-prose p,
        .legal-prose li {
            font-size: 0.92rem;
            line-height: 1.85;
            color: rgba(203, 213, 225, 0.82);
        }

        .legal-prose ul,
        .legal-prose ol {
            display: grid;
            gap: 0.55rem;
            padding-left: 1.15rem;
        }

        .legal-prose ul {
            list-style: none;
            padding-left: 0;
        }

        .legal-prose ul li {
            position: relative;
            padding-left: 1.1rem;
        }

        .legal-prose ul li::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0.75rem;
            width: 5px;
            height: 5px;
            border-radius: 999px;
            background: var(--acid);
            opacity: 0.75;
        }

        .legal-prose ol {
            list-style: decimal;
        }

        .legal-prose ol li::marker {
            color: var(--acid);
            font-family: Orbitron, sans-serif;
            font-size: 0.7rem;
        }

        .legal-prose a {
            color: var(--acid);
            text-decoration: underline;
            text-decoration-color: rgba(249, 249, 6, 0.35);
            text-underline-offset: 3px;
        }

        .legal-prose strong {
            color: #fff;
            font-weight: 600;
        }

        .legal-prose section {
            scroll-margin-top: 120px;
        }

        .legal-prose section + section {
            padding-top: 2.4rem;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .fact-row {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 1.5rem;
            padding: 0.85rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .fact-row:last-child {
            border-bottom: 0;
        }

        .fact-row dt {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.42);
        }

        .fact-row dd {
            font-size: 0.78rem;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.85);
            text-align: right;
        }

        .toc-link {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.5);
            transition: color 0.2s ease;
        }

        .toc-link::before {
            content: "";
            width: 14px;
            height: 1px;
            background: rgba(255, 255, 255, 0.2);
            transition: background 0.2s ease, width 0.2s ease;
        }

        .toc-link:hover {
            color: var(--acid);
        }

        .toc-link:hover::before {
            width: 22px;
            background: var(--acid);
        }

        .doc-card {
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.025);
            transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s ease;
        }

        .doc-card:hover {
            border-color: rgba(249, 249, 6, 0.4);
            background: rgba(249, 249, 6, 0.045);
            transform: translateY(-2px);
        }

        .faq-item {
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.025);
            border-radius: 1rem;
            overflow: hidden;
        }

        .faq-item summary {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            cursor: pointer;
            padding: 1rem 1.15rem;
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            color: rgba(255, 255, 255, 0.9);
            list-style: none;
        }

        .faq-item summary::-webkit-details-marker {
            display: none;
        }

        .faq-item .faq-plus {
            flex-shrink: 0;
            display: grid;
            place-items: center;
            width: 22px;
            height: 22px;
            border: 1px solid rgba(249, 249, 6, 0.35);
            border-radius: 999px;
            color: var(--acid);
            font-size: 15px;
            line-height: 1;
            transition: transform 0.2s ease, background 0.2s ease;
        }

        .faq-item[open] .faq-plus {
            transform: rotate(45deg);
            background: rgba(249, 249, 6, 0.1);
        }

        .faq-item .faq-answer {
            padding: 0 1.15rem 1.1rem;
            font-size: 0.86rem;
            line-height: 1.8;
            color: rgba(203, 213, 225, 0.78);
        }

        .legal-prose table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.78rem;
        }

        .legal-prose th,
        .legal-prose td {
            padding: 0.8rem 0.7rem;
            text-align: left;
            vertical-align: top;
            border-bottom: 1px solid rgba(255, 255, 255, 0.09);
        }

        .legal-prose th {
            font-family: Orbitron, sans-serif;
            font-size: 8px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.45);
        }

        .legal-prose td {
            color: rgba(203, 213, 225, 0.8);
        }

        .legal-prose code {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 0.78em;
            color: var(--acid);
            background: rgba(249, 249, 6, 0.08);
            border: 1px solid rgba(249, 249, 6, 0.16);
            border-radius: 4px;
            padding: 0.1em 0.35em;
            white-space: nowrap;
        }

        @media (prefers-reduced-motion: reduce) {
            html {
                scroll-behavior: auto;
            }

            .doc-card {
                transition: none;
            }
        }
    </style>
</head>`;

const nav = `
    <div class="relative z-20 border-b border-white/10 bg-primary text-[#17140a]">
        <div
            class="mx-auto flex max-w-[1440px] items-center justify-center gap-2 px-5 py-2 text-center text-[9px] font-bold uppercase tracking-[0.22em] md:px-8">
            <span class="material-symbols-outlined text-[14px]">verified_user</span>
            <span>Kamiwear Systems · Transparent policies · Updated ${UPDATED}</span>
        </div>
    </div>

    <nav class="sticky top-0 z-50 border-b border-white/10 glass-panel">
        <div class="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-5 px-5 md:px-8">
            <a href="index.html" class="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80">
                <span class="material-symbols-outlined text-2xl text-primary sm:text-3xl">token</span>
                <span class="font-syne text-lg font-extrabold uppercase italic tracking-tighter sm:text-2xl">Kamiwear</span>
            </a>
            <div class="hidden items-center gap-7 lg:flex xl:gap-9">
                <a class="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:text-primary"
                    href="shop.html">Shop</a>
                <a class="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:text-primary"
                    href="index.html#collections">Collections</a>
                <a class="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:text-primary"
                    href="new-fashion.html">New Arrivals</a>
                <a class="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:text-primary"
                    href="women-denim.html">Denim Edit</a>
                <a class="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:text-primary"
                    href="lookbook.html">Lookbook</a>
                <a class="border-b border-primary pb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary"
                    href="faq.html" aria-current="page">Support</a>
            </div>
            <div class="flex items-center gap-0.5 sm:gap-2">
                <button type="button" aria-label="Search" data-kw-search
                    class="hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10 sm:flex">
                    <span class="material-symbols-outlined text-[22px]">search</span>
                </button>
                <a href="wishlist.html" aria-label="Wishlist"
                    class="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10 sm:h-10 sm:w-10">
                    <span class="material-symbols-outlined text-[21px] sm:text-[22px]">favorite</span>
                </a>
                <button type="button" aria-label="Open cart" onclick="if (window.toggleCart) window.toggleCart(true)"
                    class="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10 sm:h-10 sm:w-10">
                    <span class="material-symbols-outlined text-[21px] sm:text-[22px]">shopping_bag</span>
                    <span id="cart-count-badge"
                        class="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-black">0</span>
                </button>
                <button id="profile-btn-trigger" type="button" aria-label="Profile"
                    class="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10 sm:h-10 sm:w-10">
                    <span class="material-symbols-outlined text-[21px] sm:text-[22px]">person</span>
                </button>
            </div>
        </div>
        <div class="overflow-x-auto border-t border-white/5 lg:hidden">
            <div class="flex min-w-max items-center gap-6 px-5 py-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">
                <a href="shop.html" class="hover:text-primary">Shop</a>
                <a href="new-fashion.html" class="hover:text-primary">New</a>
                <a href="women-denim.html" class="hover:text-primary">Denim</a>
                <a href="index.html#collections" class="hover:text-primary">Collections</a>
                <a href="lookbook.html" class="hover:text-primary">Lookbook</a>
                <a href="faq.html" class="text-primary">Support</a>
            </div>
        </div>
    </nav>`;

const footer = `
    <footer class="relative z-10 border-t border-white/10 bg-[#07060b] pb-10 pt-16">
        <div class="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-5 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
            <div class="space-y-5">
                <a href="index.html" class="inline-flex items-center gap-2.5 hover:opacity-80">
                    <span class="material-symbols-outlined text-2xl text-primary">token</span>
                    <span class="font-syne text-xl font-extrabold uppercase italic tracking-tighter">Kamiwear</span>
                </a>
                <p class="max-w-[260px] text-xs leading-6 text-slate-500">Blending Silicon Valley minimalism with
                    high-octane anime culture. Premium streetwear for the digital vanguard.</p>
                <p class="font-orbitron text-[8px] uppercase tracking-[0.2em] text-white/30">Policy version 1.0 · ${UPDATED}</p>
            </div>
            <div>
                <h4 class="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">Explore</h4>
                <ul class="space-y-3 text-xs text-slate-500">
                    <li><a class="transition-colors hover:text-primary" href="shop.html">Catalog</a></li>
                    <li><a class="transition-colors hover:text-primary" href="new-fashion.html">New Fashion</a></li>
                    <li><a class="transition-colors hover:text-primary" href="women-denim.html">Denim Edit</a></li>
                    <li><a class="transition-colors hover:text-primary" href="lookbook.html">Lookbook</a></li>
                </ul>
            </div>
            <div>
                <h4 class="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">Support</h4>
                <ul class="space-y-3 text-xs text-slate-500">
                    <li><a class="transition-colors hover:text-primary" href="exchanges.html">Exchanges</a></li>
                    <li><a class="transition-colors hover:text-primary" href="faq.html">FAQ</a></li>
                    <li><a class="transition-colors hover:text-primary" href="identity-terminal.html">Identity Terminal</a></li>
                    <li><a class="transition-colors hover:text-primary" href="mailto:${EMAIL}">Contact</a></li>
                </ul>
            </div>
            <div>
                <h4 class="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">Legal</h4>
                <ul class="space-y-3 text-xs text-slate-500">
                    <li><a class="transition-colors hover:text-primary" href="terms.html">Terms</a></li>
                    <li><a class="transition-colors hover:text-primary" href="cookie-policy.html">Cookie Policy</a></li>
                    <li><a class="transition-colors hover:text-primary" href="privacy.html">Privacy</a></li>
                    <li><a class="transition-colors hover:text-primary" href="mailto:${EMAIL}">${EMAIL}</a></li>
                </ul>
            </div>
        </div>
        <div
            class="mx-auto mt-12 flex max-w-[1440px] flex-col gap-3 border-t border-white/10 px-5 pt-7 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600 sm:flex-row sm:items-center sm:justify-between md:px-8">
            <p>© 2026 Kamiwear Labs Inc. All rights reserved.</p>
            <p>Built for the digital vanguard.</p>
        </div>
    </footer>`;

const allDocs = [
    { file: 'exchanges.html', label: 'Exchanges', note: '7-day window, free size swaps, refunds.' },
    { file: 'faq.html', label: 'FAQ', note: 'Orders, shipping, sizing, accounts.' },
    { file: 'identity-terminal.html', label: 'Identity Terminal', note: 'Your account, orders and KamiKoins.' },
    { file: 'terms.html', label: 'Terms', note: 'The rules for using Kamiwear.' },
    { file: 'cookie-policy.html', label: 'Cookie Policy', note: 'Cookies and local storage explained.' },
    { file: 'privacy.html', label: 'Privacy', note: 'What we collect and how we protect it.' },
];

const relatedDocs = current => `
        <section class="border-y border-white/10 bg-white/[0.02] py-14">
            <div class="mx-auto max-w-[1440px] px-5 md:px-8">
                <div class="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p class="eyebrow">Related files</p>
                        <h2 class="font-syne mt-3 text-2xl font-extrabold uppercase tracking-tight md:text-3xl">More from the terminal</h2>
                    </div>
                    <a href="faq.html"
                        class="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-primary">Open
                        support index →</a>
                </div>
                <div class="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    ${allDocs
                        .filter(doc => doc.file !== current)
                        .slice(0, 3)
                        .map(
                            doc => `<a href="${doc.file}" class="doc-card group rounded-2xl p-5">
                        <p class="font-orbitron text-[8px] uppercase tracking-[0.18em] text-primary/80">${doc.label}</p>
                        <p class="mt-2 text-xs leading-6 text-slate-500">${doc.note}</p>
                        <span class="mt-3 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 transition-colors group-hover:text-primary">Open file
                            <span class="material-symbols-outlined text-sm">arrow_outward</span></span>
                    </a>`
                        )
                        .join('')}
                </div>
            </div>
        </section>`;

const render = ({
    file,
    title,
    description,
    eyebrow,
    docNumber,
    heading,
    intro,
    chips,
    facts,
    toc,
    body,
    extraScript = '',
}) => `${head(title, description)}
<body class="min-h-screen bg-background-dark font-display text-slate-100 selection:bg-primary selection:text-black">
${nav}

    <main class="relative z-10">
        <section class="mx-auto max-w-[1440px] px-5 pb-12 pt-14 md:px-8 md:pb-16 md:pt-20">
            <div class="mb-7 flex flex-wrap items-center gap-4">
                <span class="eyebrow">${eyebrow}</span>
                <span class="h-px w-16 bg-primary/50"></span>
                <span class="font-orbitron text-[9px] uppercase tracking-[0.24em] text-white/40">Doc ${docNumber} / 06</span>
                <span class="rounded-full border border-white/10 px-3 py-1 font-orbitron text-[8px] uppercase tracking-[0.16em] text-white/40">Updated ${UPDATED}</span>
            </div>
            <h1 class="page-title">${heading}</h1>
            <div class="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:gap-14">
                <div>
                    <p class="max-w-2xl text-sm leading-7 text-slate-400 md:text-base">${intro}</p>
                    <div class="mt-7 flex flex-wrap gap-2">
                        ${chips
                            .map(
                                chip =>
                                    `<span class="rounded-full border border-white/10 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.16em] text-white/55">${chip}</span>`
                            )
                            .join('')}
                    </div>
                </div>
                <aside class="glass-panel rounded-[1.75rem] p-6 md:p-7">
                    <p class="eyebrow">Quick read</p>
                    <dl class="mt-4">
                        ${facts
                            .map(
                                fact => `<div class="fact-row">
                            <dt>${fact.label}</dt>
                            <dd>${fact.value}</dd>
                        </div>`
                            )
                            .join('')}
                    </dl>
                    <a href="mailto:${EMAIL}"
                        class="mt-5 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-primary transition-colors hover:text-white">
                        Talk to support
                        <span class="material-symbols-outlined text-sm">arrow_outward</span>
                    </a>
                </aside>
            </div>
        </section>

        <section class="mx-auto max-w-[1440px] px-5 pb-20 md:px-8 md:pb-28">
            <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_290px] lg:gap-14">
                <article class="legal-prose space-y-10">
                    ${body}
                </article>
                <aside class="hidden lg:block">
                    <div class="sticky top-28 space-y-6">
                        <div class="glass-panel rounded-2xl p-5">
                            <p class="eyebrow">On this page</p>
                            <nav aria-label="On this page" class="mt-4 grid gap-2.5">
                                ${toc
                                    .map(
                                        item =>
                                            `<a class="toc-link" href="#${item.id}">${item.label}</a>`
                                    )
                                    .join('')}
                            </nav>
                        </div>
                        <div class="glass-panel rounded-2xl p-5">
                            <p class="eyebrow">Need a human?</p>
                            <p class="mt-3 text-xs leading-6 text-slate-500">Support replies within one business day,
                                Monday to Saturday.</p>
                            <a href="mailto:${EMAIL}"
                                class="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-black transition-colors hover:bg-white">
                                Email support
                                <span class="material-symbols-outlined text-sm">mail</span>
                            </a>
                            <a href="faq.html"
                                class="mt-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 transition-colors hover:text-primary">
                                Browse the FAQ
                                <span class="material-symbols-outlined text-sm">arrow_forward</span>
                            </a>
                        </div>
                    </div>
                </aside>
            </div>
        </section>
${relatedDocs(file)}
    </main>

${footer}

    <script src="js/core/assets.js?v=4"></script>
    <script src="js/store/core.js?v=7"></script>
    <script src="js/components/badge-manager.js?v=4"></script>
    <script src="js/components/cart-drawer.js?v=4"></script>
    <script src="js/components/profile-modal.js?v=7"></script>
    <script src="js/components/search-overlay.js?v=5"></script>
    <script src="js/core/app.js?v=4"></script>
    <script src="js/core/enhance.js?v=8"></script>
${extraScript}
</body>

</html>
`;

const exchanges = render({
    file: 'exchanges.html',
    title: 'Kamiwear | Exchanges &amp; Returns',
    description:
        'Kamiwear exchanges and returns: 7-day window, free first size swap in India, damaged-item replacements and refund timelines.',
    eyebrow: 'Support / Exchanges',
    docNumber: '01',
    heading: 'Exchanges<br /><span class="text-primary">&amp; Returns</span>',
    intro:
        'Wrong size, wrong vibe, or a piece that arrived less than perfect? Every Kamiwear order is covered by a 7-day exchange window. Start here, and we will route your request to the right terminal.',
    chips: ['7-day window', 'Free first size swap', '48-hour damage reports', 'India-wide pickup'],
    facts: [
        { label: 'Exchange window', value: '7 days from delivery' },
        { label: 'Condition', value: 'Unworn, tags attached' },
        { label: 'First size swap', value: 'Free in India' },
        { label: 'Refund time', value: '5–7 business days' },
        { label: 'Pickup', value: '48–72 hours' },
    ],
    toc: [
        { id: 'window', label: 'The 7-day window' },
        { id: 'eligibility', label: 'Eligibility' },
        { id: 'exclusions', label: 'Exclusions' },
        { id: 'start', label: 'Start an exchange' },
        { id: 'sizing', label: 'Size swaps' },
        { id: 'damaged', label: 'Damaged items' },
        { id: 'shipping', label: 'Shipping costs' },
        { id: 'refunds', label: 'Refunds' },
        { id: 'contact', label: 'Contact' },
    ],
    body: `
        <section id="window">
            <p class="eyebrow">01 / Window</p>
            <h2 class="mt-3">The 7-day window</h2>
            <p class="mt-4">Your exchange window opens when the delivery partner marks your order as delivered. You
                have <strong>7 calendar days</strong> to request an exchange from the Identity Terminal order history
                or by emailing <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
            <p>Requests raised after the window are reviewed case by case. We cannot guarantee approval once the
                window has closed, so start the request as soon as you know the fit is not right.</p>
        </section>

        <section id="eligibility">
            <p class="eyebrow">02 / Eligibility</p>
            <h2 class="mt-3">What qualifies</h2>
            <p class="mt-4">To keep the archive clean and fair, exchanged pieces must come back in resale-ready
                condition:</p>
            <ul>
                <li>The item is <strong>unworn, unwashed and unused</strong>.</li>
                <li>All original tags, labels and hygiene seals are attached.</li>
                <li>The item is returned in its original packaging or equivalent protective packaging.</li>
                <li>No perfume, deodorant, makeup, smoke, pet hair or washing detergent is present.</li>
                <li>Footwear is tried on indoors only and shows no creasing, scuffs or outdoor wear.</li>
                <li>The request is raised within 7 days of delivery.</li>
            </ul>
            <p>Pieces that fail inspection are returned to you. If you want them shipped back, a delivery fee may
                apply.</p>
        </section>

        <section id="exclusions">
            <p class="eyebrow">03 / Exclusions</p>
            <h2 class="mt-3">What we cannot exchange</h2>
            <p class="mt-4">For hygiene, safety and inventory reasons, the following are final sale unless they
                arrived damaged or incorrect:</p>
            <ul>
                <li>Innerwear, socks, face masks and earrings.</li>
                <li>Personalised or made-to-order pieces.</li>
                <li>Items marked <strong>Final Sale</strong> or <strong>Archive Sample</strong> at checkout.</li>
                <li>Mystery bundles and opened blind-box products.</li>
                <li>Gift cards and digital products.</li>
            </ul>
        </section>

        <section id="start">
            <p class="eyebrow">04 / Process</p>
            <h2 class="mt-3">Start an exchange</h2>
            <ol class="mt-4">
                <li><strong>Open your terminal.</strong> Sign in at the <a href="identity-terminal.html">Identity
                        Terminal</a> and open <a href="profile.html">Order History</a>, or email us with your order ID.</li>
                <li><strong>Tell us what changed.</strong> Share the item name, the size you need and a quick photo if
                    the piece is damaged or incorrect.</li>
                <li><strong>Approve the pickup.</strong> We arrange a reverse pickup with our delivery partner. Keep
                    the item packed and the pickup phone number reachable.</li>
                <li><strong>Quality check.</strong> Once the piece reaches our studio, we inspect it within 48 hours.</li>
                <li><strong>Replacement dispatched.</strong> Approved exchanges ship within 3–5 business days. If your
                    size is unavailable, we offer store credit or a refund.</li>
            </ol>
            <p>You can also start by emailing <a href="mailto:${EMAIL}?subject=Exchange%20request">${EMAIL}</a> with
                the subject line <strong>Exchange request</strong>.</p>
        </section>

        <section id="sizing">
            <p class="eyebrow">05 / Size swaps</p>
            <h2 class="mt-3">Size swaps, without the drama</h2>
            <p class="mt-4">The first size swap on apparel orders shipped within India is free. Subsequent size swaps,
                or exchanges for a different product, may carry a <strong>₹149</strong> handling and reverse-pickup
                fee.</p>
            <p>If the size you need is out of stock, we can hold the request for a restock, issue store credit, or
                process a refund. We will confirm the available option before closing the request.</p>
            <p>Need help choosing? The <a href="faq.html#sizing">sizing FAQ</a> includes fit notes for denim, hoodies
                and oversized tees.</p>
        </section>

        <section id="damaged">
            <p class="eyebrow">06 / Damaged</p>
            <h2 class="mt-3">Damaged or incorrect orders</h2>
            <p class="mt-4">If your order arrives damaged, defective or different from what you ordered, report it
                within <strong>48 hours of delivery</strong> with clear photos of the item, packaging and shipping
                label. We cover return shipping and send a replacement or refund, including any delivery fee.</p>
            <p>Do not wash or alter a damaged piece before contacting us. Alterations can make a claim difficult to
                verify.</p>
        </section>

        <section id="shipping">
            <p class="eyebrow">07 / Shipping</p>
            <h2 class="mt-3">Shipping costs and timelines</h2>
            <p class="mt-4">Domestic orders over <strong>₹2,999</strong> ship free. Below that threshold, standard
                shipping is <strong>₹149</strong>. International orders over <strong>₹12,000</strong> ship free;
                below that, shipping is calculated at checkout.</p>
            <ul>
                <li>Dispatch: 1–2 business days after payment confirmation.</li>
                <li>India delivery: 3–7 business days after dispatch.</li>
                <li>International delivery: 7–14 business days after dispatch.</li>
                <li>Duties, taxes and customs fees are the recipient's responsibility unless stated otherwise.</li>
            </ul>
            <p>For damaged or incorrect items, reverse pickup is free. For change-of-mind exchanges, the fee depends
                on your location and is confirmed before pickup.</p>
        </section>

        <section id="refunds">
            <p class="eyebrow">08 / Refunds</p>
            <h2 class="mt-3">Refund timelines</h2>
            <p class="mt-4">Approved refunds are processed within <strong>5–7 business days</strong> after the quality
                check. Refunds go back to the original payment method where possible. Cash-on-delivery orders are
                refunded by UPI or bank transfer using the details you provide.</p>
            <p>Original shipping fees are non-refundable unless the item arrived damaged, defective or incorrect.
                Store credit is issued instantly once approved and never expires.</p>
        </section>

        <section id="contact">
            <p class="eyebrow">09 / Contact</p>
            <h2 class="mt-3">Still stuck?</h2>
            <p class="mt-4">Email <a href="mailto:${EMAIL}">${EMAIL}</a> with your order ID and a short description of
                the issue. Support replies within one business day, Monday to Saturday. For account questions, open
                the <a href="identity-terminal.html">Identity Terminal</a> guide.</p>
            <a href="mailto:${EMAIL}?subject=Exchange%20request"
                class="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-black transition-colors hover:bg-white">
                Start an exchange
                <span class="material-symbols-outlined text-base">arrow_forward</span>
            </a>
        </section>`,
});

const faq = render({
    file: 'faq.html',
    title: 'Kamiwear | FAQ',
    description:
        'Answers to Kamiwear questions about orders, shipping, exchanges, sizing, payments, the Identity Terminal and product care.',
    eyebrow: 'Support / FAQ',
    docNumber: '02',
    heading: 'Frequently<br /><span class="text-primary">Asked</span>',
    intro:
        'Orders, shipping, fit, payments, accounts and care — the answers are indexed below. Search the terminal or jump straight to a category.',
    chips: ['Orders', 'Shipping', 'Exchanges', 'Sizing', 'Identity', 'Payments'],
    facts: [
        { label: 'Support hours', value: 'Mon–Sat, 10:00–19:00 IST' },
        { label: 'First reply', value: 'Within 1 business day' },
        { label: 'Exchange window', value: '7 days' },
        { label: 'Session length', value: '7 days' },
        { label: 'Contact', value: EMAIL },
    ],
    toc: [
        { id: 'orders', label: 'Orders &amp; payment' },
        { id: 'shipping', label: 'Shipping' },
        { id: 'exchanges', label: 'Exchanges' },
        { id: 'sizing', label: 'Sizing &amp; fit' },
        { id: 'identity', label: 'Identity Terminal' },
        { id: 'products', label: 'Products &amp; care' },
        { id: 'contact', label: 'Contact support' },
    ],
    body: `
        <div class="glass-panel rounded-2xl p-4 md:p-5">
            <label for="faq-filter" class="eyebrow">Search the FAQ</label>
            <div class="mt-3 flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-4 py-3">
                <span class="material-symbols-outlined text-xl text-primary">search</span>
                <input id="faq-filter" type="search" autocomplete="off"
                    placeholder="Type a question, product or policy..."
                    class="w-full border-none bg-transparent p-0 text-sm text-white placeholder:text-slate-600 focus:ring-0" />
            </div>
        </div>
        <div id="faq-empty" class="hidden rounded-2xl border border-white/10 p-8 text-center">
            <span class="material-symbols-outlined text-3xl text-slate-600">search_off</span>
            <p class="mt-3 font-orbitron text-[9px] uppercase tracking-[0.2em] text-primary">No match in the index</p>
            <p class="mt-2 text-sm text-slate-500">Try a shorter keyword, or email <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>
        </div>

        <section id="orders" data-faq-section>
            <p class="eyebrow">01 / Orders</p>
            <h2 class="mt-3">Orders &amp; payment</h2>
            <div class="mt-5 grid gap-3">
                <details class="faq-item" open>
                    <summary>Which payment methods do you accept?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">UPI and Cash on Delivery are available at checkout. Card payments appear
                        only when the payment provider has enabled them for your region. We never store full card
                        numbers on Kamiwear servers.</div>
                </details>
                <details class="faq-item">
                    <summary>Can I change or cancel an order?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Email <a href="mailto:${EMAIL}">${EMAIL}</a> as soon as possible. We can
                        usually change or cancel an order before it is dispatched, typically within 2 hours. Once the
                        parcel is handed to the delivery partner, the exchange process applies.</div>
                </details>
                <details class="faq-item">
                    <summary>How do I track my order?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Sign in and open your <a href="profile.html">Identity Terminal</a> to see
                        order history and tracking updates. If tracking has not moved for 48 hours, contact support
                        with your order ID.</div>
                </details>
                <details class="faq-item">
                    <summary>Do you offer gift cards or store credit?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Store credit is issued for approved refunds when you choose the credit
                        option. It never expires and can be applied at checkout. Physical gift cards are not currently
                        available.</div>
                </details>
                <details class="faq-item">
                    <summary>Can I use more than one promo code?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">One promo code can be applied per order. Codes cannot be combined with
                        archive-sample pricing or other automatic drop discounts unless the promotion says
                        otherwise.</div>
                </details>
            </div>
        </section>

        <section id="shipping" data-faq-section>
            <p class="eyebrow">02 / Shipping</p>
            <h2 class="mt-3">Shipping &amp; delivery</h2>
            <div class="mt-5 grid gap-3">
                <details class="faq-item">
                    <summary>When will my order ship?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Orders are dispatched within 1–2 business days after payment confirmation.
                        Drops and personalised pieces can take an extra 1–2 days. You will receive a tracking link once
                        the parcel leaves our studio.</div>
                </details>
                <details class="faq-item">
                    <summary>How much does shipping cost?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">India: free over ₹2,999, otherwise ₹149. International: free over ₹12,000;
                        below that, shipping is calculated at checkout. Customs duties and import taxes are the
                        recipient's responsibility.</div>
                </details>
                <details class="faq-item">
                    <summary>Do you ship internationally?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Yes. International delivery usually takes 7–14 business days after dispatch.
                        Some remote destinations can take longer. If your country is not available at checkout, email
                        support and we will check a manual route.</div>
                </details>
                <details class="faq-item">
                    <summary>My parcel says delivered but I cannot find it.<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Check with neighbours, building security and the delivery partner first.
                        If the parcel is still missing after 24 hours, email us with the order ID and we will open an
                        investigation with the carrier.</div>
                </details>
            </div>
        </section>

        <section id="exchanges" data-faq-section>
            <p class="eyebrow">03 / Exchanges</p>
            <h2 class="mt-3">Exchanges &amp; returns</h2>
            <div class="mt-5 grid gap-3">
                <details class="faq-item">
                    <summary>How long do I have to exchange an item?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">7 calendar days from delivery. The item must be unworn, unwashed and have
                        its original tags attached. Start the request from your order history or email
                        <a href="mailto:${EMAIL}">${EMAIL}</a>.</div>
                </details>
                <details class="faq-item">
                    <summary>Is the first size exchange free?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Yes for apparel orders shipped within India. Subsequent size swaps or
                        exchanges for a different product may carry a ₹149 handling fee. International return shipping
                        is paid by the customer unless the item was damaged or incorrect.</div>
                </details>
                <details class="faq-item">
                    <summary>Can I return a final-sale item?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Final-sale, archive-sample, innerwear, earrings, masks and personalised
                        pieces are not eligible unless they arrived damaged or incorrect. The full list is on the
                        <a href="exchanges.html#exclusions">Exchanges page</a>.</div>
                </details>
                <details class="faq-item">
                    <summary>How long does a refund take?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Approved refunds are processed within 5–7 business days after the quality
                        check. Cash-on-delivery orders are refunded by UPI or bank transfer. Store credit is issued
                        instantly once approved.</div>
                </details>
            </div>
        </section>

        <section id="sizing" data-faq-section>
            <p class="eyebrow">04 / Sizing</p>
            <h2 class="mt-3">Sizing &amp; fit</h2>
            <div class="mt-5 grid gap-3">
                <details class="faq-item">
                    <summary>How do oversized pieces fit?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Oversized hoodies and tees are cut with extra room through the chest and
                        shoulders. If you want a cleaner fit, size down once. If you want the full streetwear drape,
                        stay true to size.</div>
                </details>
                <details class="faq-item">
                    <summary>How should I choose denim?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Our wide-leg and baggy denim is designed to sit lower on the waist. Check
                        the fit notes on each product page and compare your waist measurement to the size chart. When
                        between sizes, choose the larger size for a relaxed silhouette.</div>
                </details>
                <details class="faq-item">
                    <summary>What if the size I need is sold out?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">We can hold an exchange request for a restock, issue store credit, or
                        refund the item. Contact support after raising the exchange and we will confirm the available
                        option.</div>
                </details>
            </div>
        </section>

        <section id="identity" data-faq-section>
            <p class="eyebrow">05 / Identity</p>
            <h2 class="mt-3">Identity Terminal</h2>
            <div class="mt-5 grid gap-3">
                <details class="faq-item">
                    <summary>What is the Identity Terminal?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">It is your Kamiwear account hub: sign in, view orders, manage your
                        wishlist and track KamiKoins. The full guide is on the
                        <a href="identity-terminal.html">Identity Terminal page</a>.</div>
                </details>
                <details class="faq-item">
                    <summary>I logged out and cannot find the sign-in form.<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">After logout, Kamiwear returns you to the page with a sign-in prompt and
                        your email prefilled. If the prompt is closed, open the profile icon in the navigation or go to
                        <a href="register.html">register.html</a> and choose Sign In.</div>
                </details>
                <details class="faq-item">
                    <summary>How long does a session last?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">A signed-in session lasts up to 7 days. The browser stores an httpOnly
                        session cookie, which JavaScript cannot read. Closing the browser does not immediately sign you
                        out; logging out does.</div>
                </details>
                <details class="faq-item">
                    <summary>How do I reset my password?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Self-serve password reset is not live yet. Email
                        <a href="mailto:${EMAIL}">${EMAIL}</a> from the address on your account and support will help
                        you regain access. Never share your password in an email.</div>
                </details>
                <details class="faq-item">
                    <summary>Why is the Google sign-in button missing?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Google Sign-In appears only when the store owner has configured a Google
                        client ID. When it is not configured, use the email and password form. Both routes create the
                        same Kamiwear identity.</div>
                </details>
            </div>
        </section>

        <section id="products" data-faq-section>
            <p class="eyebrow">06 / Products</p>
            <h2 class="mt-3">Products &amp; care</h2>
            <div class="mt-5 grid gap-3">
                <details class="faq-item">
                    <summary>How should I wash a graphic hoodie or tee?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Turn the piece inside out, wash cold on a gentle cycle and hang dry in the
                        shade. Do not iron directly over the print, and avoid bleach or fabric softener on heavyweight
                        cotton.</div>
                </details>
                <details class="faq-item">
                    <summary>Will the colours look exactly like the photos?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">We shoot in natural and studio light, but screens vary. Small differences in
                        tone, wash and print placement are normal for garment-dyed and small-batch pieces.</div>
                </details>
                <details class="faq-item">
                    <summary>Are drops restocked?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Some core pieces return; limited capsule drops usually do not. Join the
                        newsletter and follow the collection pages to hear about restocks and new chapters.</div>
                </details>
            </div>
        </section>

        <section id="contact" data-faq-section>
            <p class="eyebrow">07 / Contact</p>
            <h2 class="mt-3">Still need help?</h2>
            <p class="mt-4">Send your order ID and a short description to
                <a href="mailto:${EMAIL}">${EMAIL}</a>. We reply within one business day, Monday to Saturday,
                10:00–19:00 IST.</p>
            <a href="mailto:${EMAIL}?subject=Kamiwear%20support"
                class="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-black transition-colors hover:bg-white">
                Email support
                <span class="material-symbols-outlined text-base">mail</span>
            </a>
        </section>`,
    extraScript: `
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const filter = document.getElementById('faq-filter');
            const empty = document.getElementById('faq-empty');
            const sections = [...document.querySelectorAll('[data-faq-section]')];
            if (!filter || !sections.length) return;

            const apply = () => {
                const query = filter.value.trim().toLowerCase();
                let total = 0;
                sections.forEach(section => {
                    let visible = 0;
                    section.querySelectorAll('.faq-item').forEach(item => {
                        const match = !query || item.textContent.toLowerCase().includes(query);
                        item.classList.toggle('hidden', !match);
                        if (match) visible += 1;
                    });
                    section.classList.toggle('hidden', visible === 0);
                    total += visible;
                });
                if (empty) empty.classList.toggle('hidden', total > 0);
            };

            filter.addEventListener('input', apply);
        });
    </script>`,
});

const identity = render({
    file: 'identity-terminal.html',
    title: 'Kamiwear | Identity Terminal',
    description:
        'The Kamiwear Identity Terminal: one account for orders, wishlist, KamiKoins and a secure 7-day session.',
    eyebrow: 'Account / Identity',
    docNumber: '03',
    heading: 'Identity<br /><span class="text-primary">Terminal</span>',
    intro:
        'One identity for your orders, wishlist, KamiKoins and the entire Kamiwear archive. The terminal is the front door; your dashboard lives inside.',
    chips: ['Orders', 'Wishlist', 'KamiKoins', 'Secure session', 'Guest-friendly'],
    facts: [
        { label: 'Sign-in', value: 'Email + password' },
        { label: 'Optional', value: 'Google Identity' },
        { label: 'Session', value: 'Up to 7 days' },
        { label: 'Cookie', value: 'httpOnly, SameSite=Lax' },
        { label: 'Guest cart', value: 'Kept locally' },
    ],
    toc: [
        { id: 'what', label: 'What it is' },
        { id: 'access', label: 'Access your identity' },
        { id: 'capabilities', label: 'What you can do' },
        { id: 'security', label: 'Security model' },
        { id: 'troubleshooting', label: 'Troubleshooting' },
        { id: 'data', label: 'Data &amp; policies' },
        { id: 'contact', label: 'Contact' },
    ],
    body: `
        <section id="what">
            <p class="eyebrow">01 / Overview</p>
            <h2 class="mt-3">What the Identity Terminal is</h2>
            <p class="mt-4">The Identity Terminal is Kamiwear's account system. It links your orders, wishlist,
                KamiKoins and profile to one email address, without turning your session into a localStorage
                free-for-all.</p>
            <p>You can browse, add to cart and build a wishlist as a guest. When you are ready, sign in or create an
                identity to keep the archive connected across visits.</p>
        </section>

        <section id="access">
            <p class="eyebrow">02 / Access</p>
            <h2 class="mt-3">Access your identity</h2>
            <div class="glass-panel mt-5 rounded-2xl p-5">
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p id="terminal-status" class="font-orbitron text-[9px] uppercase tracking-[0.2em] text-primary">Checking terminal…</p>
                        <p id="terminal-copy" class="mt-2 text-xs leading-6 text-slate-400">Reading your local session.</p>
                    </div>
                    <a id="terminal-cta" href="register.html"
                        class="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[9px] font-extrabold uppercase tracking-[0.16em] text-black transition-colors hover:bg-white">
                        Create an identity
                        <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    </a>
                </div>
            </div>
            <div class="mt-5 grid gap-3 sm:grid-cols-2">
                <div class="glass-panel rounded-2xl p-5">
                    <span class="material-symbols-outlined text-2xl text-primary">person_add</span>
                    <h3 class="mt-3">Create an identity</h3>
                    <p class="mt-2">Register with a name, email and password. The first 1,000 XP starts your Genin
                        tier.</p>
                    <a href="register.html" class="mt-4 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-primary">Open registration <span class="material-symbols-outlined text-sm">arrow_outward</span></a>
                </div>
                <div class="glass-panel rounded-2xl p-5">
                    <span class="material-symbols-outlined text-2xl text-primary">login</span>
                    <h3 class="mt-3">Sign in</h3>
                    <p class="mt-2">Already have an identity? Use the email and password you registered with. The
                        profile modal works on every page.</p>
                    <a href="register.html" class="mt-4 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-primary">Open sign-in <span class="material-symbols-outlined text-sm">arrow_outward</span></a>
                </div>
            </div>
        </section>

        <section id="capabilities">
            <p class="eyebrow">03 / Capabilities</p>
            <h2 class="mt-3">What you can do</h2>
            <ul class="mt-4">
                <li><strong>Open your dashboard.</strong> See your profile, tier and KamiKoin balance at
                    <a href="profile.html">profile.html</a>.</li>
                <li><strong>Track orders.</strong> Order history and status are tied to your identity, not a browser
                    cache.</li>
                <li><strong>Keep a wishlist.</strong> Save pieces from any product card and return to them from the
                    <a href="wishlist.html">wishlist page</a>.</li>
                <li><strong>Earn KamiKoins.</strong> Your XP balance appears in the terminal and grows with activity.</li>
                <li><strong>Move between devices.</strong> Sign in with the same email to recover your profile and
                    order history. Guest cart and wishlist items live in the browser, so they do not travel
                    automatically.</li>
            </ul>
        </section>

        <section id="security">
            <p class="eyebrow">04 / Security</p>
            <h2 class="mt-3">How the session works</h2>
            <p class="mt-4">Kamiwear keeps authentication deliberately boring:</p>
            <ul>
                <li>The server issues an <strong>httpOnly session cookie</strong> named <code>kw_session</code>. It
                    cannot be read by JavaScript.</li>
                <li>The cookie is <strong>SameSite=Lax</strong>, scoped to the site path, and marked
                    <strong>Secure</strong> in production.</li>
                <li>Sessions last up to <strong>7 days</strong>. Logging out clears the cookie and the local profile
                    cache.</li>
                <li>Only the public profile is cached in localStorage for fast UI. The JWT is never stored there.</li>
                <li>The server applies rate limiting, request sanitisation and CSRF protection to state-changing
                    requests.</li>
                <li>Passwords are hashed; Kamiwear never stores plaintext passwords.</li>
            </ul>
        </section>

        <section id="troubleshooting">
            <p class="eyebrow">05 / Troubleshooting</p>
            <h2 class="mt-3">Common fixes</h2>
            <div class="mt-5 grid gap-3">
                <details class="faq-item" open>
                    <summary>I logged out and the sign-in form disappeared.<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Logout returns you to the same page with <code>?auth=true</code> and opens
                        the sign-in view. If you closed it, click the profile icon in the navigation or visit
                        <a href="register.html">register.html</a> and choose Sign In. Your last email is prefilled.</div>
                </details>
                <details class="faq-item">
                    <summary>My session ended unexpectedly.<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Sessions expire after 7 days, after a server-side session revocation, or
                        when the cookie is cleared. Sign in again with your email and password. If it keeps happening,
                        check that your browser is not blocking cookies for this site.</div>
                </details>
                <details class="faq-item">
                    <summary>I forgot my password.<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Self-serve reset is not live yet. Email
                        <a href="mailto:${EMAIL}">${EMAIL}</a> from the address on the account and support will help.
                        Never send your password in an email.</div>
                </details>
                <details class="faq-item">
                    <summary>My cart or wishlist vanished.<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">Guest cart and wishlist data are stored in this browser's local storage.
                        Clearing site data, using private mode, or switching devices will make them appear empty.
                        Signed-in order history is stored server-side and is not affected.</div>
                </details>
                <details class="faq-item">
                    <summary>Why is Google Sign-In not visible?<span class="faq-plus">+</span></summary>
                    <div class="faq-answer">It appears only when a Google client ID is configured for the deployment.
                        When it is absent, use email and password. Both routes resolve to the same Kamiwear
                        identity.</div>
                </details>
            </div>
        </section>

        <section id="data">
            <p class="eyebrow">06 / Data</p>
            <h2 class="mt-3">Your data, on the record</h2>
            <p class="mt-4">The <a href="privacy.html">Privacy Policy</a> explains what Kamiwear collects and how long
                it is kept. The <a href="cookie-policy.html">Cookie Policy</a> lists the exact cookie and storage keys
                used by the terminal. The <a href="terms.html">Terms</a> cover acceptable use and account
                responsibilities.</p>
        </section>

        <section id="contact">
            <p class="eyebrow">07 / Contact</p>
            <h2 class="mt-3">Open a support channel</h2>
            <p class="mt-4">For account recovery, order issues or data requests, email
                <a href="mailto:${EMAIL}">${EMAIL}</a>. Include the email address on the account and your order ID if
                relevant. Support replies within one business day, Monday to Saturday.</p>
        </section>`,
    extraScript: `
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const user = window.Store && typeof window.Store.getUser === 'function' ? window.Store.getUser() : null;
            const status = document.getElementById('terminal-status');
            const copy = document.getElementById('terminal-copy');
            const cta = document.getElementById('terminal-cta');
            if (!status || !copy || !cta) return;

            if (user && user.email) {
                status.textContent = 'IDENTITY VERIFIED';
                copy.textContent = 'Signed in as ' + (user.name || user.email) + '. Your dashboard is ready.';
                cta.textContent = 'Open your terminal';
                cta.href = 'profile.html';
            } else {
                status.textContent = 'GUEST ACCESS';
                copy.textContent = 'No active identity on this browser. Sign in or create one to open your dashboard.';
                cta.textContent = 'Create an identity';
                cta.href = 'register.html';
            }
        });
    </script>`,
});

const terms = render({
    file: 'terms.html',
    title: 'Kamiwear | Terms of Service',
    description:
        'The terms that govern your use of the Kamiwear storefront, account, orders, payments, shipping and exchanges.',
    eyebrow: 'Legal / Terms',
    docNumber: '04',
    heading: 'Terms of<br /><span class="text-primary">Service</span>',
    intro:
        'The rules for using Kamiwear: accounts, orders, payments, delivery, exchanges, intellectual property and the limits of our responsibility.',
    chips: ['Effective 16 Nov 2026', 'India governing law', '18+ or guardian consent'],
    facts: [
        { label: 'Version', value: '1.0' },
        { label: 'Effective', value: UPDATED },
        { label: 'Currency', value: 'INR' },
        { label: 'Governing law', value: 'India' },
        { label: 'Contact', value: EMAIL },
    ],
    toc: [
        { id: 'acceptance', label: 'Acceptance' },
        { id: 'accounts', label: 'Accounts' },
        { id: 'orders', label: 'Orders &amp; pricing' },
        { id: 'payments', label: 'Payments' },
        { id: 'shipping', label: 'Shipping' },
        { id: 'exchanges', label: 'Exchanges' },
        { id: 'intellectual-property', label: 'Intellectual property' },
        { id: 'acceptable-use', label: 'Acceptable use' },
        { id: 'third-party', label: 'Third-party services' },
        { id: 'disclaimers', label: 'Disclaimers' },
        { id: 'liability', label: 'Liability' },
        { id: 'indemnity', label: 'Indemnity' },
        { id: 'governing-law', label: 'Governing law' },
        { id: 'changes', label: 'Changes' },
        { id: 'contact', label: 'Contact' },
    ],
    body: `
        <section id="acceptance">
            <p class="eyebrow">01 / Acceptance</p>
            <h2 class="mt-3">Acceptance of these terms</h2>
            <p class="mt-4">These Terms of Service govern your access to and use of the Kamiwear website, storefront,
                checkout, Identity Terminal and related services. By browsing, creating an account or placing an
                order, you agree to these terms and to our <a href="privacy.html">Privacy Policy</a> and
                <a href="cookie-policy.html">Cookie Policy</a>.</p>
            <p>If you do not agree, do not use the storefront or place an order. If you are under 18, you may use
                Kamiwear only with the involvement of a parent or legal guardian.</p>
        </section>

        <section id="accounts">
            <p class="eyebrow">02 / Accounts</p>
            <h2 class="mt-3">Your identity</h2>
            <ul class="mt-4">
                <li>You must provide accurate, current information when creating an identity.</li>
                <li>You are responsible for keeping your password confidential and for activity under your account.</li>
                <li>Do not share, sell or transfer your account to another person.</li>
                <li>Tell us immediately if you suspect unauthorised access at <a href="mailto:${EMAIL}">${EMAIL}</a>.</li>
                <li>We may suspend or close an account that violates these terms, commits fraud or abuses the
                    storefront.</li>
            </ul>
        </section>

        <section id="orders">
            <p class="eyebrow">03 / Orders</p>
            <h2 class="mt-3">Orders, availability and pricing</h2>
            <p class="mt-4">All prices are displayed in Indian Rupees (INR) unless stated otherwise. Prices, drops and
                availability can change without notice. Adding an item to your cart does not reserve it.</p>
            <p>We may refuse or cancel an order if the item is unavailable, the price was listed incorrectly, the
                order appears fraudulent, or the delivery address cannot be verified. If we cancel after payment, we
                refund the amount paid for that order.</p>
            <p>Product photography, washes and colours are indicative. Small variations are normal for garment-dyed,
                small-batch and hand-finished pieces.</p>
        </section>

        <section id="payments">
            <p class="eyebrow">04 / Payments</p>
            <h2 class="mt-3">Payment terms</h2>
            <p class="mt-4">Available payment methods are shown at checkout and may include UPI, Cash on Delivery and
                card payments where enabled. By submitting payment, you confirm that you are authorised to use the
                selected method.</p>
            <p>Kamiwear does not store full card numbers or card security codes. Payment processing is handled by
                third-party providers, and their terms may also apply. Cash-on-delivery orders may be subject to
                order-value limits or address verification.</p>
        </section>

        <section id="shipping">
            <p class="eyebrow">05 / Shipping</p>
            <h2 class="mt-3">Delivery</h2>
            <p class="mt-4">Orders are dispatched within 1–2 business days after payment confirmation. India delivery
                usually takes 3–7 business days; international delivery usually takes 7–14 business days. These
                windows are estimates, not guarantees.</p>
            <p>Risk passes to you on delivery. If a parcel is lost or damaged in transit, contact us within 48 hours
                of the delivery scan so we can open a carrier investigation. Duties, taxes and customs fees on
                international orders are the recipient's responsibility unless stated otherwise.</p>
        </section>

        <section id="exchanges">
            <p class="eyebrow">06 / Exchanges</p>
            <h2 class="mt-3">Exchanges and returns</h2>
            <p class="mt-4">The exchange policy is set out on the <a href="exchanges.html">Exchanges &amp; Returns</a>
                page and forms part of these terms. The standard window is 7 days from delivery, and items must be
                unworn, unwashed and have their original tags attached. Exclusions include innerwear, earrings, masks,
                personalised pieces and final-sale items.</p>
        </section>

        <section id="intellectual-property">
            <p class="eyebrow">07 / Intellectual property</p>
            <h2 class="mt-3">Ownership</h2>
            <p class="mt-4">The Kamiwear name, logo, storefront design, photography, graphics, copy and product
                artwork are owned by Kamiwear Labs Inc. or its licensors and are protected by applicable intellectual
                property laws.</p>
            <p>You may view and share links to the storefront for personal, non-commercial use. You may not copy,
                scrape, resell, reproduce or create derivative works from our content without written permission.
                Anime and third-party properties referenced in capsule collections remain the property of their
                respective owners.</p>
        </section>

        <section id="acceptable-use">
            <p class="eyebrow">08 / Acceptable use</p>
            <h2 class="mt-3">What you may not do</h2>
            <ul class="mt-4">
                <li>Use the storefront for unlawful, fraudulent or abusive activity.</li>
                <li>Attempt to access another person's account or bypass authentication.</li>
                <li>Scrape, crawl or automate requests in a way that degrades the service.</li>
                <li>Upload malware, spam or misleading content.</li>
                <li>Interfere with checkout, payment, security or rate-limiting systems.</li>
                <li>Resell Kamiwear products as official merchandise without authorisation.</li>
            </ul>
        </section>

        <section id="third-party">
            <p class="eyebrow">09 / Third parties</p>
            <h2 class="mt-3">Third-party services</h2>
            <p class="mt-4">Kamiwear uses third-party services for hosting, payments, delivery, fonts, analytics (if
                enabled) and optional Google Sign-In. Links to Discord, Instagram, TikTok, Twitter and other sites are
                provided for convenience. We do not control those services and are not responsible for their content
                or privacy practices.</p>
        </section>

        <section id="disclaimers">
            <p class="eyebrow">10 / Disclaimers</p>
            <h2 class="mt-3">Availability and accuracy</h2>
            <p class="mt-4">The storefront is provided on an "as available" basis. We work to keep product information,
                stock and pricing accurate, but errors can happen. We do not warrant that the site will be
                uninterrupted, error-free or free of harmful components.</p>
            <p>Nothing on the storefront is medical, legal or financial advice. Product care instructions are
                guidance; always check the label on the garment.</p>
        </section>

        <section id="liability">
            <p class="eyebrow">11 / Liability</p>
            <h2 class="mt-3">Limits of responsibility</h2>
            <p class="mt-4">To the maximum extent permitted by law, Kamiwear is not liable for indirect, incidental,
                special, consequential or punitive damages, or for lost profits, data or goodwill arising from your
                use of the storefront.</p>
            <p>Our total liability for any claim relating to an order will not exceed the amount you paid for that
                order. Nothing in these terms excludes liability that cannot lawfully be excluded.</p>
        </section>

        <section id="indemnity">
            <p class="eyebrow">12 / Indemnity</p>
            <h2 class="mt-3">Indemnity</h2>
            <p class="mt-4">You agree to indemnify and hold harmless Kamiwear Labs Inc., its officers, employees and
                partners from claims, losses, liabilities and expenses arising from your breach of these terms, your
                misuse of the storefront, or your violation of another person's rights.</p>
        </section>

        <section id="governing-law">
            <p class="eyebrow">13 / Governing law</p>
            <h2 class="mt-3">Governing law and disputes</h2>
            <p class="mt-4">These terms are governed by the laws of India. Disputes are subject to the exclusive
                jurisdiction of the competent courts in India. Before starting formal proceedings, please contact us
                so we can try to resolve the issue directly.</p>
        </section>

        <section id="changes">
            <p class="eyebrow">14 / Changes</p>
            <h2 class="mt-3">Updates to these terms</h2>
            <p class="mt-4">We may update these terms as the storefront evolves. The effective date at the top of the
                page will change, and material updates may be announced on the site or by email. Continued use after
                an update means you accept the revised terms.</p>
        </section>

        <section id="contact">
            <p class="eyebrow">15 / Contact</p>
            <h2 class="mt-3">Questions about these terms</h2>
            <p class="mt-4">Email <a href="mailto:${EMAIL}">${EMAIL}</a> with the subject <strong>Terms
                    question</strong>. Support replies within one business day, Monday to Saturday.</p>
        </section>`,
});

const cookies = render({
    file: 'cookie-policy.html',
    title: 'Kamiwear | Cookie Policy',
    description:
        'How Kamiwear uses the kw_session cookie, local storage for cart, wishlist and identity, and optional third-party services.',
    eyebrow: 'Legal / Cookies',
    docNumber: '05',
    heading: 'Cookie<br /><span class="text-primary">Policy</span>',
    intro:
        'Kamiwear keeps browser storage intentionally small: one secure session cookie, a local cart and wishlist, and a few preference keys. Here is every key we use.',
    chips: ['Essential only', 'No ad pixels', 'Local cart &amp; wishlist', '7-day session'],
    facts: [
        { label: 'Session cookie', value: 'kw_session' },
        { label: 'Cookie lifetime', value: '7 days' },
        { label: 'Analytics', value: 'None active' },
        { label: 'Ad pixels', value: 'None' },
        { label: 'Control', value: 'Browser settings' },
    ],
    toc: [
        { id: 'scope', label: 'Scope' },
        { id: 'what-are', label: 'Cookies &amp; storage' },
        { id: 'essential', label: 'Essential storage' },
        { id: 'preferences', label: 'Preferences' },
        { id: 'analytics', label: 'Analytics &amp; ads' },
        { id: 'third-party', label: 'Third parties' },
        { id: 'managing', label: 'Managing storage' },
        { id: 'updates', label: 'Updates' },
        { id: 'contact', label: 'Contact' },
    ],
    body: `
        <section id="scope">
            <p class="eyebrow">01 / Scope</p>
            <h2 class="mt-3">What this policy covers</h2>
            <p class="mt-4">This policy explains how Kamiwear uses cookies, localStorage and sessionStorage on the
                storefront. It should be read with the <a href="privacy.html">Privacy Policy</a> and
                <a href="terms.html">Terms of Service</a>.</p>
        </section>

        <section id="what-are">
            <p class="eyebrow">02 / Basics</p>
            <h2 class="mt-3">Cookies and browser storage</h2>
            <p class="mt-4">A cookie is a small text file a site asks your browser to store. Local storage and session
                storage are browser databases that hold larger values, such as your cart, wishlist and cached profile.
                None of these are programs and none can read other files on your device.</p>
        </section>

        <section id="essential">
            <p class="eyebrow">03 / Essential</p>
            <h2 class="mt-3">Essential storage</h2>
            <p class="mt-4">These are required for sign-in, checkout and the basic storefront to work:</p>
            <div class="mt-5 overflow-x-auto">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Purpose</th>
                            <th>Lifetime</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>kw_session</code></td>
                            <td>Cookie</td>
                            <td>Signed-in session. HttpOnly, SameSite=Lax, Secure in production.</td>
                            <td>Up to 7 days</td>
                        </tr>
                        <tr>
                            <td><code>kw_user</code></td>
                            <td>localStorage</td>
                            <td>Public profile cache for instant UI. Contains no JWT.</td>
                            <td>Until logout or cleared</td>
                        </tr>
                        <tr>
                            <td><code>kw_cart</code></td>
                            <td>localStorage</td>
                            <td>Your cart, including guest carts.</td>
                            <td>Until cleared</td>
                        </tr>
                        <tr>
                            <td><code>kw_wishlist</code></td>
                            <td>localStorage</td>
                            <td>Saved products.</td>
                            <td>Until cleared</td>
                        </tr>
                        <tr>
                            <td><code>kw_session_hint</code></td>
                            <td>localStorage</td>
                            <td>Signals that a server session may exist, so the UI can verify it.</td>
                            <td>Until logout or cleared</td>
                        </tr>
                        <tr>
                            <td><code>kw_session_verified_at</code></td>
                            <td>localStorage</td>
                            <td>Timestamp used to avoid repeated session checks.</td>
                            <td>Until logout or cleared</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section id="preferences">
            <p class="eyebrow">04 / Preferences</p>
            <h2 class="mt-3">Convenience keys</h2>
            <div class="mt-5 overflow-x-auto">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Purpose</th>
                            <th>Lifetime</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>kw_last_email</code></td>
                            <td>localStorage</td>
                            <td>Prefills your email after logout or on the sign-in form.</td>
                            <td>Until cleared</td>
                        </tr>
                        <tr>
                            <td><code>kw_signed_out</code></td>
                            <td>sessionStorage</td>
                            <td>Shows the "session ended" notice once after logout.</td>
                            <td>Current tab session</td>
                        </tr>
                        <tr>
                            <td><code>kw_redirect_after_login</code></td>
                            <td>sessionStorage</td>
                            <td>Returns you to the page you were on after signing in.</td>
                            <td>Current tab session</td>
                        </tr>
                        <tr>
                            <td><code>kw_token</code></td>
                            <td>localStorage</td>
                            <td>Legacy JWT cleanup only. New sessions never write a token here; the key is removed
                                when a session is stored or cleared.</td>
                            <td>Removed on session change</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section id="analytics">
            <p class="eyebrow">05 / Analytics</p>
            <h2 class="mt-3">Analytics and advertising</h2>
            <p class="mt-4">The current Kamiwear build does not load advertising pixels or a third-party analytics
                script. If analytics is added later, this policy will be updated and, where required, consent will be
                requested before non-essential storage is set.</p>
            <p>Server logs may record request metadata such as IP address, browser type and timestamps for security
                and troubleshooting. That data is described in the <a href="privacy.html">Privacy Policy</a>.</p>
        </section>

        <section id="third-party">
            <p class="eyebrow">06 / Third parties</p>
            <h2 class="mt-3">Third-party services</h2>
            <ul class="mt-4">
                <li><strong>Google Fonts and Material Symbols</strong> load fonts and icons from Google's CDN. Google
                    may receive your IP address and request metadata.</li>
                <li><strong>Tailwind CDN</strong> serves the CSS runtime used by the storefront.</li>
                <li><strong>Google Identity Services</strong> loads only when a Google client ID is configured and you
                    choose to sign in with Google. Google may set its own cookies during that flow.</li>
                <li><strong>Payment and delivery partners</strong> may set cookies or collect data on their own
                    domains during checkout or tracking.</li>
                <li><strong>Social links</strong> to Discord, Instagram, TikTok and Twitter are ordinary links. They do
                    not load embedded trackers unless you click through.</li>
            </ul>
        </section>

        <section id="managing">
            <p class="eyebrow">07 / Managing</p>
            <h2 class="mt-3">How to control storage</h2>
            <p class="mt-4">You can clear or block cookies and browser storage in your browser settings. Clearing
                Kamiwear site data will:</p>
            <ul>
                <li>sign you out of the Identity Terminal;</li>
                <li>empty a guest cart and wishlist stored in this browser;</li>
                <li>remove the remembered email used to prefill sign-in;</li>
                <li>not delete server-side order history tied to your account.</li>
            </ul>
            <p>Blocking the <code>kw_session</code> cookie prevents sign-in and checkout. Because Kamiwear does not
                load non-essential analytics or ad cookies, there is currently no consent banner to manage.</p>
        </section>

        <section id="updates">
            <p class="eyebrow">08 / Updates</p>
            <h2 class="mt-3">Changes to this policy</h2>
            <p class="mt-4">We may update this policy when the storefront adds new storage or third-party services.
                The effective date at the top of the page will change. Material changes will be announced on the site
                or by email where appropriate.</p>
        </section>

        <section id="contact">
            <p class="eyebrow">09 / Contact</p>
            <h2 class="mt-3">Questions about cookies</h2>
            <p class="mt-4">Email <a href="mailto:${EMAIL}">${EMAIL}</a> with the subject <strong>Cookie
                    question</strong>. Support replies within one business day, Monday to Saturday.</p>
        </section>`,
});

const privacy = render({
    file: 'privacy.html',
    title: 'Kamiwear | Privacy Policy',
    description:
        'How Kamiwear collects, uses, stores and protects account, order, payment-reference and device data.',
    eyebrow: 'Legal / Privacy',
    docNumber: '06',
    heading: 'Privacy<br /><span class="text-primary">Policy</span>',
    intro:
        'What Kamiwear collects, why we need it, how long it stays, and the controls you have over your identity and order data.',
    chips: ['Data minimisation', 'No ad pixels', 'Account controls', 'Hashed passwords'],
    facts: [
        { label: 'Controller', value: 'Kamiwear Labs Inc.' },
        { label: 'Location', value: 'India' },
        { label: 'Account data', value: 'Until deletion' },
        { label: 'Order records', value: 'As required by law' },
        { label: 'Contact', value: EMAIL },
    ],
    toc: [
        { id: 'collect', label: 'What we collect' },
        { id: 'use', label: 'How we use it' },
        { id: 'sharing', label: 'Sharing' },
        { id: 'cookies', label: 'Cookies' },
        { id: 'retention', label: 'Retention' },
        { id: 'security', label: 'Security' },
        { id: 'rights', label: 'Your rights' },
        { id: 'children', label: 'Children' },
        { id: 'transfers', label: 'International transfers' },
        { id: 'changes', label: 'Changes' },
        { id: 'contact', label: 'Contact' },
    ],
    body: `
        <section id="collect">
            <p class="eyebrow">01 / Collection</p>
            <h2 class="mt-3">What we collect</h2>
            <p class="mt-4">Kamiwear collects the information needed to run the storefront and fulfil orders:</p>
            <ul>
                <li><strong>Identity data:</strong> name, email address, hashed password and optional Google account
                    identifier.</li>
                <li><strong>Order data:</strong> items, sizes, quantities, prices, order status and shipping
                    address.</li>
                <li><strong>Payment references:</strong> payment method, transaction ID and refund status. We do not
                    store full card numbers or security codes.</li>
                <li><strong>Support data:</strong> messages, photos and order IDs you send to support.</li>
                <li><strong>Device and log data:</strong> IP address, browser type, timestamps and security events
                    used for rate limiting and troubleshooting.</li>
                <li><strong>Local preferences:</strong> cart, wishlist and remembered email stored in your browser, as
                    described in the <a href="cookie-policy.html">Cookie Policy</a>.</li>
            </ul>
        </section>

        <section id="use">
            <p class="eyebrow">02 / Use</p>
            <h2 class="mt-3">How we use it</h2>
            <ul class="mt-4">
                <li>Create and secure your Identity Terminal account.</li>
                <li>Process orders, payments, deliveries, exchanges and refunds.</li>
                <li>Provide order history, wishlist and KamiKoin features.</li>
                <li>Respond to support requests and resolve disputes.</li>
                <li>Detect fraud, abuse, scraping and unauthorised access.</li>
                <li>Improve storefront performance, product information and checkout reliability.</li>
                <li>Send transactional messages about orders and, if you opt in, drop announcements.</li>
            </ul>
        </section>

        <section id="sharing">
            <p class="eyebrow">03 / Sharing</p>
            <h2 class="mt-3">Who we share with</h2>
            <p class="mt-4">We share only what is needed to run the service:</p>
            <ul>
                <li><strong>Payment and UPI providers</strong> to process and refund payments.</li>
                <li><strong>Delivery partners</strong> to ship orders and arrange reverse pickups.</li>
                <li><strong>Email and hosting providers</strong> that operate transactional mail and the storefront
                    infrastructure.</li>
                <li><strong>Professional advisers and authorities</strong> where required by law or to protect
                    Kamiwear's rights.</li>
            </ul>
            <p>We do not sell personal information. We do not share data with advertising networks in the current
                build.</p>
        </section>

        <section id="cookies">
            <p class="eyebrow">04 / Cookies</p>
            <h2 class="mt-3">Cookies and local storage</h2>
            <p class="mt-4">The storefront uses an httpOnly <code>kw_session</code> cookie for authentication and
                browser local storage for the cart, wishlist and a small profile cache. The full list, purposes and
                lifetimes are in the <a href="cookie-policy.html">Cookie Policy</a>.</p>
        </section>

        <section id="retention">
            <p class="eyebrow">05 / Retention</p>
            <h2 class="mt-3">How long we keep data</h2>
            <ul class="mt-4">
                <li><strong>Account data:</strong> while your identity is active, then deleted or anonymised after a
                    verified deletion request, subject to legal obligations.</li>
                <li><strong>Order and tax records:</strong> as long as required by applicable accounting and consumer
                    law.</li>
                <li><strong>Support messages:</strong> up to 24 months after the request is closed.</li>
                <li><strong>Security logs:</strong> typically 30–90 days, unless needed for an investigation.</li>
                <li><strong>Browser storage:</strong> until you log out, clear site data or your browser removes
                    it.</li>
            </ul>
        </section>

        <section id="security">
            <p class="eyebrow">06 / Security</p>
            <h2 class="mt-3">How we protect it</h2>
            <p class="mt-4">Kamiwear uses hashed passwords, an httpOnly SameSite session cookie, HTTPS in production,
                rate limiting, request sanitisation and CSRF protection. Access to production data is limited to
                people who need it to operate the store.</p>
            <p>No system is perfect. If you suspect unauthorised access, email <a href="mailto:${EMAIL}">${EMAIL}</a>
                immediately and change your password once support confirms the account is secure.</p>
        </section>

        <section id="rights">
            <p class="eyebrow">07 / Rights</p>
            <h2 class="mt-3">Your controls</h2>
            <p class="mt-4">Subject to applicable law, you can ask to:</p>
            <ul>
                <li>access the personal information linked to your account;</li>
                <li>correct inaccurate profile or shipping details;</li>
                <li>delete your account and associated personal data;</li>
                <li>export a copy of your account and order history;</li>
                <li>withdraw marketing consent without affecting transactional messages.</li>
            </ul>
            <p>Email <a href="mailto:${EMAIL}">${EMAIL}</a> with the subject <strong>Privacy request</strong>. We may
                need to verify your identity before acting. You can also clear browser storage yourself at any
                time.</p>
        </section>

        <section id="children">
            <p class="eyebrow">08 / Children</p>
            <h2 class="mt-3">Children's privacy</h2>
            <p class="mt-4">Kamiwear is not directed at children under 13, and we do not knowingly collect their
                personal information. If you are under 18, use the store only with a parent or guardian. If you
                believe a child has provided personal information, contact us and we will delete it.</p>
        </section>

        <section id="transfers">
            <p class="eyebrow">09 / Transfers</p>
            <h2 class="mt-3">International processing</h2>
            <p class="mt-4">Kamiwear is operated from India. Some service providers may process data in other
                countries. Where required, we use contractual safeguards and limit transfers to what is necessary to
                provide the storefront, payments, delivery and support.</p>
        </section>

        <section id="changes">
            <p class="eyebrow">10 / Changes</p>
            <h2 class="mt-3">Updates to this policy</h2>
            <p class="mt-4">We may update this policy as the storefront or the law changes. The effective date at the
                top of the page will change. Material updates will be announced on the site or by email where
                appropriate.</p>
        </section>

        <section id="contact">
            <p class="eyebrow">11 / Contact</p>
            <h2 class="mt-3">Privacy contact</h2>
            <p class="mt-4">Email <a href="mailto:${EMAIL}">${EMAIL}</a> with the subject <strong>Privacy
                    request</strong>. Support replies within one business day, Monday to Saturday.</p>
        </section>`,
});

const pages = [
    { file: 'exchanges.html', html: exchanges },
    { file: 'faq.html', html: faq },
    { file: 'identity-terminal.html', html: identity },
    { file: 'terms.html', html: terms },
    { file: 'cookie-policy.html', html: cookies },
    { file: 'privacy.html', html: privacy },
];

pages.forEach(({ file, html }) => {
    fs.writeFileSync(path.join(PUBLIC, file), html);
    console.log(`wrote public/${file}`);
});
