document.addEventListener('DOMContentLoaded', () => {
    // 1. Create Search Overlay HTML
    if (!document.getElementById('search-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'search-overlay';
        overlay.className = 'fixed inset-0 z-[120] opacity-0 pointer-events-none transition-all duration-500 backdrop-blur-3xl bg-black/60 flex items-start justify-center pt-24 px-6';
        overlay.innerHTML = `
            <div class="w-full max-w-3xl scale-95 opacity-0 transition-all duration-500" id="search-container">
                <div class="glass-panel rounded-[32px] overflow-hidden border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
                    <!-- Search Input -->
                    <div class="relative flex items-center p-8 border-b border-white/10">
                        <span class="material-symbols-outlined text-primary text-3xl animate-pulse">search</span>
                        <input id="search-main-input" type="text" 
                               placeholder="SEARCH THE ARCHIVES..." 
                               class="w-full bg-transparent border-none focus:ring-0 text-2xl font-syne font-bold uppercase tracking-tighter placeholder:text-slate-700 ml-4 outline-none">
                        <button id="close-search" class="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <span class="material-symbols-outlined text-slate-500">close</span>
                        </button>
                    </div>

                    <!-- Search Suggestions / Results -->
                    <div class="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar" id="search-results-area">
                        <div id="default-suggestions">
                            <h4 class="text-[10px] font-orbitron font-bold tracking-[0.4em] text-slate-500 uppercase mb-6">Trending Missions</h4>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <button class="suggestion-chip liquid-glass px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-primary transition-all text-left flex items-center gap-3 group">
                                    <span class="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform"></span>
                                    Tanjiro V2
                                </button>
                                <button class="suggestion-chip liquid-glass px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-primary transition-all text-left flex items-center gap-3 group">
                                    <span class="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform"></span>
                                    Cyber Joggers
                                </button>
                                <button class="suggestion-chip liquid-glass px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-primary transition-all text-left flex items-center gap-3 group">
                                    <span class="w-1.5 h-1.5 bg-primary rounded-full group-hover:scale-150 transition-transform"></span>
                                    Sukuna Drop
                                </button>
                            </div>
                        </div>

                        <div id="live-results" class="hidden space-y-4">
                            <!-- Results will be injected here -->
                        </div>
                    </div>

                    <!-- Footer Info -->
                    <div class="p-4 bg-white/5 border-t border-white/5 flex justify-between items-center px-8">
                        <div class="flex gap-4 text-[9px] font-orbitron text-slate-500 tracking-widest uppercase">
                            <span><b class="text-slate-300">ESC</b> TO CLOSE</span>
                            <span><b class="text-slate-300">↵</b> TO SELECT</span>
                        </div>
                        <span class="text-[9px] font-orbitron text-primary uppercase animate-pulse tracking-widest">Archive Terminal Active</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    const overlay = document.getElementById('search-overlay');
    const container = document.getElementById('search-container');
    const input = document.getElementById('search-main-input');
    const resultsArea = document.getElementById('search-results-area');
    const defaultSuggestions = document.getElementById('default-suggestions');
    const liveResults = document.getElementById('live-results');

    const toggleSearch = (show) => {
        if (show) {
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            container.classList.remove('scale-95', 'opacity-0');
            setTimeout(() => input.focus(), 100);
        } else {
            overlay.classList.add('opacity-0', 'pointer-events-none');
            container.classList.add('scale-95', 'opacity-0');
            input.value = '';
            renderResults([]);
        }
    };

    const renderResults = (results) => {
        if (results.length > 0) {
            defaultSuggestions.classList.add('hidden');
            liveResults.classList.remove('hidden');
            liveResults.innerHTML = results.map(p => `
                <div class="flex items-center gap-6 p-4 rounded-2xl hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-white/10" onclick="window.location.href='/product.html?id=${p.id}'">
                    <div class="w-16 h-16 rounded-xl bg-white/5 overflow-hidden border border-white/10 shrink-0">
                        <img src="${p.image}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-grow">
                        <h5 class="text-sm font-bold uppercase tracking-tight group-hover:text-primary transition-colors">${p.name}</h5>
                        <p class="text-[10px] font-orbitron text-slate-500 uppercase tracking-widest">${p.category}</p>
                    </div>
                    <div class="text-right">
                        <span class="font-syne font-bold italic text-white">$${p.price.toFixed(2)}</span>
                    </div>
                </div>
            `).join('');
        } else {
            defaultSuggestions.classList.remove('hidden');
            liveResults.classList.add('hidden');
        }
    };

    input.addEventListener('input', (e) => {
        const query = e.target.value;
        const results = window.Store.searchProducts(query);
        renderResults(results);
    });

    document.getElementById('close-search').addEventListener('click', () => toggleSearch(false));

    // Quick suggestion clicks
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            input.value = chip.textContent.trim();
            input.dispatchEvent(new Event('input'));
        });
    });

    // Global Triggers
    window.toggleSearch = toggleSearch;

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') toggleSearch(false);
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            toggleSearch(true);
        }
    });

    // Replace existing search buttons
    const setupTriggers = () => {
        const elements = Array.from(document.querySelectorAll('button, a, input[placeholder*="Search"]')).filter(el =>
            el.querySelector('.material-symbols-outlined')?.textContent.trim() === 'search' ||
            el.textContent.includes('SEARCH') ||
            (el.tagName === 'INPUT' && el.placeholder.toLowerCase().includes('search'))
        );

        elements.forEach(el => {
            if (el.tagName === 'INPUT') {
                el.addEventListener('focus', (e) => {
                    e.preventDefault();
                    el.blur();
                    toggleSearch(true);
                });
            } else {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    toggleSearch(true);
                });
            }
        });
    };

    setupTriggers();
});
