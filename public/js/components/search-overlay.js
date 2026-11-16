document.addEventListener('DOMContentLoaded', () => {
    // 1. Create Search Overlay HTML
    if (!document.getElementById('search-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'search-overlay';
        overlay.className = 'fixed inset-0 z-[120] opacity-0 pointer-events-none transition-all duration-500 backdrop-blur-3xl bg-black/60 flex items-start justify-center pt-16 sm:pt-24 px-4 sm:px-6';
        overlay.innerHTML = `
            <div class="w-full max-w-3xl scale-95 opacity-0 transition-all duration-500" id="search-container">
                <div class="glass-panel rounded-[28px] sm:rounded-[32px] overflow-hidden border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
                    <!-- Search Input -->
                    <div class="relative flex items-center p-5 sm:p-8 border-b border-white/10 gap-3 sm:gap-4">
                        <span class="material-symbols-outlined text-primary text-2xl sm:text-3xl">search</span>
                        <input id="search-main-input" type="text"
                               placeholder="SEARCH THE ARCHIVE..."
                               aria-label="Search all products"
                               autocomplete="off"
                               class="w-full bg-transparent border-none focus:ring-0 text-lg sm:text-2xl font-syne font-bold uppercase tracking-tighter placeholder:text-slate-700 outline-none">
                        <button id="close-search" aria-label="Close search" class="p-2 hover:bg-white/5 rounded-full transition-colors shrink-0">
                            <span class="material-symbols-outlined text-slate-500">close</span>
                        </button>
                    </div>

                    <!-- Search Suggestions / Results -->
                    <div class="p-5 sm:p-8 max-h-[65vh] overflow-y-auto custom-scrollbar" id="search-results-area">
                        <div id="default-suggestions">
                            <div class="flex items-center justify-between gap-4 mb-5">
                                <h4 class="text-[10px] font-orbitron font-bold tracking-[0.4em] text-slate-500 uppercase">Trending Signals</h4>
                                <span id="catalog-count" class="text-[9px] font-orbitron uppercase tracking-[0.2em] text-slate-600">INDEXING ARCHIVE…</span>
                            </div>
                            <div id="suggestion-grid" class="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <button data-query="women denim" class="suggestion-chip liquid-glass px-5 py-4 rounded-2xl text-left text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-primary hover:border-primary/30 transition-all flex items-center gap-3 group">
                                    <span class="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform"></span>
                                    Women's Denim
                                </button>
                                <button data-query="hoodie" class="suggestion-chip liquid-glass px-5 py-4 rounded-2xl text-left text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-primary hover:border-primary/30 transition-all flex items-center gap-3 group">
                                    <span class="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform"></span>
                                    Hoodies
                                </button>
                                <button data-query="baggy jeans" class="suggestion-chip liquid-glass px-5 py-4 rounded-2xl text-left text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-primary hover:border-primary/30 transition-all flex items-center gap-3 group">
                                    <span class="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform"></span>
                                    Baggy Jeans
                                </button>
                                <button data-query="neo tokyo" class="suggestion-chip liquid-glass px-5 py-4 rounded-2xl text-left text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-primary hover:border-primary/30 transition-all flex items-center gap-3 group">
                                    <span class="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform"></span>
                                    Neo Tokyo
                                </button>
                                <button data-query="accessories" class="suggestion-chip liquid-glass px-5 py-4 rounded-2xl text-left text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-primary hover:border-primary/30 transition-all flex items-center gap-3 group">
                                    <span class="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform"></span>
                                    Accessories
                                </button>
                                <button data-query="jacket" class="suggestion-chip liquid-glass px-5 py-4 rounded-2xl text-left text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-primary hover:border-primary/30 transition-all flex items-center gap-3 group">
                                    <span class="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform"></span>
                                    Jackets
                                </button>
                            </div>
                        </div>

                        <div id="live-results" class="hidden">
                            <div id="search-summary" class="flex items-center justify-between gap-4 mb-4"></div>
                            <div id="search-result-list" class="space-y-2"></div>
                        </div>

                        <div id="search-empty" class="hidden py-10 text-center">
                            <span class="material-symbols-outlined text-4xl text-slate-600">search_off</span>
                            <p class="mt-3 text-sm font-bold uppercase tracking-widest text-slate-300">No signals found</p>
                            <p id="search-empty-copy" class="mt-2 text-xs text-slate-500">Try a broader search, or browse the full archive.</p>
                            <a href="shop.html" class="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-black hover:bg-white transition-colors">
                                Open the shop
                                <span class="material-symbols-outlined text-sm">arrow_forward</span>
                            </a>
                        </div>
                    </div>

                    <!-- Footer Info -->
                    <div class="p-3 sm:p-4 bg-white/5 border-t border-white/5 flex justify-between items-center px-5 sm:px-8 gap-3">
                        <div class="flex gap-4 text-[9px] font-orbitron text-slate-500 tracking-widest uppercase">
                            <span><b class="text-slate-300">ESC</b> TO CLOSE</span>
                            <span class="hidden sm:inline"><b class="text-slate-300">↑↓</b> TO NAVIGATE</span>
                            <span><b class="text-slate-300">↵</b> TO OPEN</span>
                        </div>
                        <span class="text-[9px] font-orbitron text-primary uppercase animate-pulse tracking-widest whitespace-nowrap">Archive Terminal Active</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const style = document.createElement('style');
        style.id = 'kw-search-styles';
        style.textContent = `
            #search-overlay .suggestion-chip { border: 1px solid rgba(255,255,255,.1); }
            #search-overlay .suggestion-chip:hover { border-color: rgba(249,249,6,.35); }
            #search-overlay .search-result-active {
                background: rgba(255,255,255,.06) !important;
                border-color: rgba(249,249,6,.35) !important;
            }
            #search-overlay .search-result-price { color: #f9f906; }
        `;
        document.head.appendChild(style);
    }

    const overlay = document.getElementById('search-overlay');
    const container = document.getElementById('search-container');
    const input = document.getElementById('search-main-input');
    const resultsArea = document.getElementById('search-results-area');
    const defaultSuggestions = document.getElementById('default-suggestions');
    const liveResults = document.getElementById('live-results');
    const resultList = document.getElementById('search-result-list');
    const summary = document.getElementById('search-summary');
    const emptyState = document.getElementById('search-empty');
    const emptyCopy = document.getElementById('search-empty-copy');
    const catalogCount = document.getElementById('catalog-count');

    let activeIndex = -1;
    let visibleResults = [];
    let searchRun = 0;

    const escapeHtml = value => String(value || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    const toggleSearch = (show) => {
        if (show) {
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            container.classList.remove('scale-95', 'opacity-0');
            setTimeout(() => input.focus(), 100);
            // Warm the catalog the first time the terminal opens.
            if (window.Store?.loadProductCatalog) {
                window.Store.loadProductCatalog().then(updateCatalogCount);
            }
        } else {
            overlay.classList.add('opacity-0', 'pointer-events-none');
            container.classList.add('scale-95', 'opacity-0');
            input.value = '';
            activeIndex = -1;
            renderDefault();
        }
    };

    const updateCatalogCount = () => {
        const total = window.Store?.getProductCatalog?.().length || 0;
        if (catalogCount) {
            catalogCount.textContent = total
                ? `${total} PIECES INDEXED`
                : 'INDEXING ARCHIVE…';
        }
    };

    const syncActiveResult = () => {
        const rows = resultList ? [...resultList.querySelectorAll('[data-result-index]')] : [];
        rows.forEach((row, index) => {
            row.classList.toggle('search-result-active', index === activeIndex);
            row.setAttribute('aria-selected', String(index === activeIndex));
        });
        const active = rows[activeIndex];
        if (active && typeof active.scrollIntoView === 'function') {
            active.scrollIntoView({ block: 'nearest' });
        }
    };

    const renderDefault = () => {
        visibleResults = [];
        activeIndex = -1;
        defaultSuggestions.classList.remove('hidden');
        liveResults.classList.add('hidden');
        emptyState.classList.add('hidden');
        updateCatalogCount();
        resultsArea.scrollTop = 0;
    };

    const renderResults = (results, query) => {
        visibleResults = results;
        activeIndex = -1;
        defaultSuggestions.classList.add('hidden');
        emptyState.classList.add('hidden');

        if (!results.length) {
            liveResults.classList.add('hidden');
            emptyState.classList.remove('hidden');
            if (emptyCopy) {
                emptyCopy.textContent = `Nothing in the archive matches “${query}”. Try one word, a product type, or a collection name.`;
            }
            return;
        }

        liveResults.classList.remove('hidden');
        summary.innerHTML = `
            <p class="text-[10px] font-orbitron font-bold uppercase tracking-[0.26em] text-primary">
                ${results.length} signal${results.length === 1 ? '' : 's'} found
            </p>
            <p class="text-[9px] font-orbitron uppercase tracking-[0.18em] text-slate-500 truncate">“${escapeHtml(query)}”</p>
        `;
        resultList.innerHTML = results.map((product, index) => {
            const params = new URLSearchParams({
                name: product.name || 'Product',
                price: String(product.price || 0),
                image: product.image || '',
                category: product.category || 'Apparel',
            });
            return `
                <a data-result-index="${index}" aria-selected="false"
                   class="flex items-center gap-4 sm:gap-6 p-3 sm:p-4 rounded-2xl hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-white/10"
                   href="product.html?${escapeHtml(params.toString())}">
                    <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white/5 overflow-hidden border border-white/10 shrink-0">
                        <img src="${escapeHtml(product.image || 'assets/brand/placeholder.jpg')}" alt="${escapeHtml(product.name)}"
                             loading="lazy" class="w-full h-full object-cover"
                             onerror="this.onerror=null;this.src='assets/brand/placeholder.jpg'">
                    </div>
                    <div class="flex-grow min-w-0">
                        <h5 class="text-xs sm:text-sm font-bold uppercase tracking-tight group-hover:text-primary transition-colors truncate">${escapeHtml(product.name)}</h5>
                        <p class="text-[9px] sm:text-[10px] font-orbitron text-slate-500 uppercase tracking-widest truncate">${escapeHtml(product.category || 'Apparel')}</p>
                    </div>
                    <div class="text-right shrink-0">
                        <span class="search-result-price font-syne font-bold italic">${money(product.price)}</span>
                    </div>
                </a>`;
        }).join('');

        resultsArea.scrollTop = 0;
    };

    const runSearch = async query => {
        const trimmed = String(query || '').trim();
        if (!trimmed) {
            renderDefault();
            return;
        }

        const run = ++searchRun;
        if (window.Store?.loadProductCatalog) {
            const catalog = await window.Store.loadProductCatalog();
            if (run !== searchRun) return;
            updateCatalogCount();
            renderResults(window.Store.searchProducts(trimmed, catalog), trimmed);
        } else {
            renderResults([], trimmed);
        }
    };

    input.addEventListener('input', event => runSearch(event.target.value));

    input.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            if (!visibleResults.length) return;
            event.preventDefault();
            const direction = event.key === 'ArrowDown' ? 1 : -1;
            activeIndex = (activeIndex + direction + visibleResults.length) % visibleResults.length;
            syncActiveResult();
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            const target = resultList.querySelectorAll('[data-result-index]')[activeIndex >= 0 ? activeIndex : 0];
            if (target) window.location.href = target.getAttribute('href');
        }
    });

    document.getElementById('close-search').addEventListener('click', () => toggleSearch(false));

    // Quick suggestion clicks
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.dataset.query || chip.textContent.trim();
            input.value = query;
            input.dispatchEvent(new Event('input'));
            input.focus();
        });
    });

    // Global Triggers
    window.toggleSearch = toggleSearch;

    // Keyboard Shortcuts
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') toggleSearch(false);
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            toggleSearch(true);
        }
    });

    // Replace existing search buttons. Data attributes let pages opt in
    // explicitly, while the text/icon heuristics keep the older templates
    // working without markup changes.
    const setupTriggers = () => {
        const elements = Array.from(document.querySelectorAll('button, a, input[placeholder*="Search"], [data-kw-search]')).filter(el => {
            if (el.closest('#search-overlay')) return false;
            if (el.matches('[data-kw-search]')) return true;
            if (el.querySelector('.material-symbols-outlined')?.textContent.trim() === 'search') return true;
            if (el.tagName !== 'INPUT' && el.textContent.includes('SEARCH')) return true;
            return el.tagName === 'INPUT' && el.placeholder.toLowerCase().includes('search');
        });

        elements.forEach(el => {
            if (el.dataset.kwSearchBound === 'true') return;
            el.dataset.kwSearchBound = 'true';
            if (el.tagName === 'INPUT') {
                el.addEventListener('focus', event => {
                    event.preventDefault();
                    el.blur();
                    toggleSearch(true);
                });
            } else {
                el.addEventListener('click', event => {
                    event.preventDefault();
                    toggleSearch(true);
                });
            }
        });
    };

    setupTriggers();

    // Preload in the background so the first query is instant.
    if (window.Store?.loadProductCatalog) {
        window.Store.loadProductCatalog().then(updateCatalogCount);
    }
    updateCatalogCount();
});
