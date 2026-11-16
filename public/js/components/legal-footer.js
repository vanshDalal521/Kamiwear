/**
 * Shared legal + support index.
 *
 * Injected at the end of every existing storefront page so Exchanges, FAQ,
 * Identity Terminal, Terms, Cookie Policy and Privacy are never dead links.
 * The new policy pages carry the same links directly in their footers.
 */
(function () {
    'use strict';

    const LINKS = [
        { href: 'exchanges.html', label: 'Exchanges' },
        { href: 'faq.html', label: 'FAQ' },
        { href: 'identity-terminal.html', label: 'Identity Terminal' },
        { href: 'terms.html', label: 'Terms' },
        { href: 'cookie-policy.html', label: 'Cookie Policy' },
        { href: 'privacy.html', label: 'Privacy' },
    ];

    function mount() {
        if (document.getElementById('kw-legal-strip')) return;

        const style = document.createElement('style');
        style.id = 'kw-legal-strip-styles';
        style.textContent = `
            #kw-legal-strip {
                position: relative;
                z-index: 20;
                background: #07060b;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                padding: 18px 20px;
            }
            #kw-legal-strip .kw-legal-inner {
                width: 100%;
                max-width: 1440px;
                margin: 0 auto;
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: 10px 24px;
            }
            #kw-legal-strip .kw-legal-brand {
                font-family: Orbitron, sans-serif;
                font-size: 8px;
                font-weight: 700;
                letter-spacing: 0.22em;
                text-transform: uppercase;
                color: rgba(255, 255, 255, 0.32);
                white-space: nowrap;
            }
            #kw-legal-strip nav {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 8px 20px;
            }
            #kw-legal-strip a {
                font-family: Inter, system-ui, sans-serif;
                font-size: 9px;
                font-weight: 700;
                letter-spacing: 0.16em;
                text-transform: uppercase;
                color: rgba(255, 255, 255, 0.5);
                text-decoration: none;
                transition: color 0.2s ease;
            }
            #kw-legal-strip a:hover,
            #kw-legal-strip a[aria-current="page"] {
                color: #f9f906;
            }
            @media (max-width: 640px) {
                #kw-legal-strip .kw-legal-inner {
                    justify-content: center;
                    text-align: center;
                }
                #kw-legal-strip nav {
                    justify-content: center;
                    gap: 8px 14px;
                }
            }
            @media (prefers-reduced-motion: reduce) {
                #kw-legal-strip a { transition: none; }
            }
        `;
        document.head.appendChild(style);

        const current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
        const strip = document.createElement('div');
        strip.id = 'kw-legal-strip';
        strip.innerHTML = `
            <div class="kw-legal-inner">
                <span class="kw-legal-brand">Kamiwear Systems · Legal index</span>
                <nav aria-label="Legal and support">
                    ${LINKS.map(link => {
                        const active = link.href.toLowerCase() === current;
                        return `<a href="${link.href}"${active ? ' aria-current="page"' : ''}>${link.label}</a>`;
                    }).join('')}
                </nav>
            </div>
        `;
        document.body.appendChild(strip);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
