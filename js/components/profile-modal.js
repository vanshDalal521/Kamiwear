document.addEventListener('DOMContentLoaded', () => {
    const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE'; // Replace with real ID to enable Google Login

    function renderGoogleButton() {
        // Only initialize if a real client ID is provided
        if (window.google && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE') {
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCredentialResponse,
                context: 'use'
            });
            google.accounts.id.renderButton(
                document.getElementById("google-login-btn-container"),
                { theme: "outline", size: "large", type: "standard", shape: "pill", width: 300, text: "continue_with" }
            );
        } else {
            // Provide a graceful placeholder
            const container = document.getElementById("google-login-btn-container");
            if (container) {
                container.innerHTML = '<div class="text-[10px] text-slate-500 italic p-2 border border-slate-700 rounded w-full text-center cursor-not-allowed border-dashed">Google Sign-In requires config</div>';
            }
        }
    }

    // 1. Create Profile Modal HTML
    if (!document.getElementById('profile-modal')) {
        const modal = document.createElement('div');
        modal.id = 'profile-modal';
        modal.className = 'fixed inset-0 z-[110] flex items-center justify-center opacity-0 pointer-events-none transition-all duration-500 backdrop-blur-2xl bg-black/60';
        modal.innerHTML = `
            <div class="glass-panel w-full max-w-md p-1 rounded-2xl border-white/20 shadow-[0_0_80px_rgba(242,223,13,0.1)] scale-95 transition-all duration-500 overflow-hidden" id="modal-content">
                <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent-purple/10 pointer-events-none"></div>
                
                <div class="relative p-10 space-y-8">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                <span class="material-symbols-outlined text-primary text-xl">account_tree</span>
                            </div>
                            <h3 class="font-syne text-2xl uppercase italic font-extrabold tracking-tighter">Identity Terminal</h3>
                        </div>
                        <button id="close-profile" class="p-2 hover:bg-white/5 rounded-full transition-colors"><span class="material-symbols-outlined">close</span></button>
                    </div>

                    <!-- Auth Message (for checkout gate) -->
                    <div id="auth-msg" class="hidden glass-panel bg-primary/10 border-primary/20 p-4 rounded-xl text-center">
                        <p class="text-[10px] text-primary font-bold uppercase tracking-widest">Authentication Required for Checkout</p>
                    </div>
                    
                    <!-- Login View -->
                    <div id="login-view" class="space-y-6 transition-all duration-300">
                        <div class="space-y-4">
                            <div class="space-y-2 group">
                                <label class="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1 transition-colors group-focus-within:text-primary">Access Token (Email)</label>
                                <div class="relative">
                                    <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">alternate_email</span>
                                    <input id="login-email" class="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-4 focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm transition-all text-white" placeholder="SHINOBI@KAMIWEAR.COM" type="email">
                                </div>
                            </div>
                            <div class="space-y-2 group">
                                <label class="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1 transition-colors group-focus-within:text-primary">Security Key (Password)</label>
                                <div class="relative">
                                    <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">lock</span>
                                    <input id="login-password" class="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-4 focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm transition-all text-white" placeholder="••••••••" type="password">
                                </div>
                            </div>
                        </div>
                        <button id="login-submit" class="w-full bg-primary text-black font-bold py-4 rounded-full hover:shadow-[0_0_20px_rgba(242,223,13,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 group">
                            ESTABLISH CONNECTION
                            <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">bolt</span>
                        </button>

                        <div class="flex items-center gap-4 py-2">
                            <div class="h-px bg-white/10 flex-1"></div>
                            <span class="text-[10px] text-slate-500 font-bold tracking-widest uppercase">OR</span>
                            <div class="h-px bg-white/10 flex-1"></div>
                        </div>
                        <div id="google-login-btn-container" class="flex justify-center"></div>

                        <div class="text-center text-[10px] text-slate-500 tracking-widest uppercase py-4 border-t border-white/5">
                            New recruit? <button id="to-signup" class="text-primary hover:underline font-bold">Apply for entry</button>
                        </div>
                    </div>

                    <!-- Signup View -->
                    <div id="signup-view" class="hidden space-y-6 transition-all duration-300">
                        <div class="space-y-4">
                            <div class="space-y-2 group">
                                <label class="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Codename (Name)</label>
                                <div class="relative">
                                    <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">person</span>
                                    <input id="signup-name" class="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-4 focus:ring-1 focus:ring-primary outline-none text-sm text-white" placeholder="UZUMAKI NARUTO" type="text">
                                </div>
                            </div>
                            <div class="space-y-2 group">
                                <label class="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Access Token (Email)</label>
                                <div class="relative">
                                    <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">alternate_email</span>
                                    <input id="signup-email" class="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-4 focus:ring-1 focus:ring-primary outline-none text-sm text-white" placeholder="SHINOBI@KAMIWEAR.COM" type="email">
                                </div>
                            </div>
                            <div class="space-y-2 group">
                                <label class="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Security Key (Password)</label>
                                <div class="relative">
                                    <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">lock</span>
                                    <input id="signup-password" class="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-4 focus:ring-1 focus:ring-primary outline-none text-sm text-white" placeholder="••••••••" type="password">
                                </div>
                            </div>
                        </div>
                        <button id="register-submit" class="w-full bg-white text-black font-bold py-4 rounded-full hover:bg-primary transition-all active:scale-95 flex items-center justify-center gap-2">
                            INITIALIZE PROTOCOL
                            <span class="material-symbols-outlined">database</span>
                        </button>
                        <div class="text-center text-[10px] text-slate-500 tracking-widest uppercase py-4 border-t border-white/5">
                            Already registered? <button id="to-login" class="text-primary hover:underline font-bold">Resync Identity</button>
                        </div>
                    </div>

                    <!-- User View (Logged In) -->
                    <div id="user-view" class="hidden space-y-8 animate-in fade-in zoom-in duration-500">
                        <div class="flex items-center gap-6 p-6 glass-panel border-primary/20 rounded-2xl bg-primary/5">
                            <div class="w-20 h-20 rounded-full border-2 border-primary p-1 relative shadow-[0_0_15px_rgba(242,223,13,0.2)]">
                                <img id="user-avatar" src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Kami" class="w-full h-full rounded-full bg-slate-800 border-2 border-black">
                                <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-black rounded-full"></div>
                            </div>
                            <div>
                                <h4 id="user-display-name" class="font-syne text-2xl uppercase italic font-bold tracking-tight text-white">USER_NAME</h4>
                                <div class="flex items-center gap-2 mt-1">
                                    <span class="bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase" id="user-tier">GENIN</span>
                                    <span class="text-[10px] text-slate-400 uppercase tracking-widest font-medium" id="user-points">0 XP</span>
                                </div>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <button onclick="window.location.href='profile.html'" class="glass-panel p-6 text-center hover:bg-white/5 transition-all group border-white/5 text-white">
                                <span class="material-symbols-outlined block mb-2 opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all">terminal</span>
                                <span class="text-[10px] font-bold uppercase tracking-widest">DASHBOARD</span>
                            </button>
                            <button onclick="window.location.href='profile.html#orders'" class="glass-panel p-6 text-center hover:bg-white/5 transition-all group border-white/5 text-white">
                                <span class="material-symbols-outlined block mb-2 opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all">package_2</span>
                                <span class="text-[10px] font-bold uppercase tracking-widest">DRIVE_ORDERS</span>
                            </button>
                        </div>
                        <button id="logout-btn" class="w-full border border-white/10 text-slate-400 font-bold py-4 rounded-full hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all flex items-center justify-center gap-2">
                            TERMINATE SESSION
                            <span class="material-symbols-outlined text-sm">power_settings_new</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Load Google Identity Services Script dynamically
        if (!document.getElementById('google-gsi-script')) {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.id = 'google-gsi-script';
            script.async = true;
            script.defer = true;
            script.onload = renderGoogleButton;
            document.head.appendChild(script);
        }
    }

    window.handleGoogleCredentialResponse = async (response) => {
        const loginBtn = document.getElementById('login-submit');
        const originalContent = loginBtn.innerHTML;
        loginBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> PROCESSING';
        loginBtn.disabled = true;

        try {
            const res = await window.Store.googleLogin(response.credential);
            if (res.user) {
                loginBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> LINK ESTABLISHED';
                setTimeout(() => {
                    toggleProfile(false);
                    if (!window.location.pathname.includes('product.html') && !window.location.pathname.includes('index') && window.location.pathname !== '/') {
                        window.location.href = 'index_v2.html';
                    }
                }, 1000);
            } else {
                throw new Error(res.error || 'Authentication Failed');
            }
        } catch (e) {
            loginBtn.innerHTML = '<span class="material-symbols-outlined">error</span> LINK FAILED';
            loginBtn.classList.add('bg-red-500', 'text-white');
            document.getElementById('modal-content').classList.add('ring-2', 'ring-red-500/50');
            setTimeout(() => {
                loginBtn.innerHTML = originalContent;
                loginBtn.disabled = false;
                loginBtn.classList.remove('bg-red-500', 'text-white');
                document.getElementById('modal-content').classList.remove('ring-2', 'ring-red-500/50');
            }, 2000);
        }
    };

    const modal = document.getElementById('profile-modal');
    const content = document.getElementById('modal-content');
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const userView = document.getElementById('user-view');
    const authMsg = document.getElementById('auth-msg');

    const toggleProfile = (show, showAuthMsg = false) => {
        if (show) {
            modal.classList.remove('opacity-0', 'pointer-events-none');
            content.classList.remove('scale-95');
            authMsg.classList.toggle('hidden', !showAuthMsg);
            updateView();
            // Try rendering again in case script loaded before modal was displayed
            if (window.google && !document.querySelector('#google-login-btn-container iframe')) {
                renderGoogleButton();
            }
        } else {
            modal.classList.add('opacity-0', 'pointer-events-none');
            content.classList.add('scale-95');
        }
    };
    window.toggleProfile = toggleProfile;

    const updateView = () => {
        const user = window.Store.getUser();
        if (user) {
            loginView.classList.add('hidden');
            signupView.classList.add('hidden');
            userView.classList.remove('hidden');
            document.getElementById('user-display-name').textContent = user.name;
            document.getElementById('user-tier').textContent = user.tier || 'GENIN';
            document.getElementById('user-points').textContent = `${user.kamiKoins || 0} XP`;
            const avatarSeed = user.avatarSeed || user.name;
            document.getElementById('user-avatar').src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${avatarSeed}`;
        } else {
            loginView.classList.remove('hidden');
            signupView.classList.add('hidden');
            userView.classList.add('hidden');
        }
    };

    // View Toggles
    document.getElementById('to-signup').addEventListener('click', () => {
        loginView.classList.add('hidden');
        signupView.classList.remove('hidden');
    });
    document.getElementById('to-login').addEventListener('click', () => {
        signupView.classList.add('hidden');
        loginView.classList.remove('hidden');
    });

    document.getElementById('close-profile').addEventListener('click', () => toggleProfile(false));
    modal.addEventListener('click', (e) => { if (e.target === modal) toggleProfile(false); });

    // Auth Actions
    const handleAuth = async (action, data) => {
        const btn = document.getElementById(`${action}-submit`);
        if (!btn) {
            console.error(`Auth button for ${action} not found`);
            return;
        }
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> PROCESSING';
        btn.disabled = true;

        try {
            const res = await window.Store[action](...data);
            if (res.user) {
                btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> LINK ESTABLISHED';
                setTimeout(() => {
                    toggleProfile(false);
                    // If on shop or index, just show success, if on specific page, maybe redirect
                    if (window.location.pathname.includes('index') || window.location.pathname === '/') {
                         // Stay on page
                    } else if (!window.location.pathname.includes('product.html')) {
                        window.location.href = 'index_v2.html';
                    }
                }, 1000);
            } else {
                throw new Error(res.error || 'Authentication Failed');
            }
        } catch (e) {
            const errorMsg = e.message || 'Authentication Failed';
            btn.innerHTML = `<span class="material-symbols-outlined">error</span> ${errorMsg.toUpperCase()}`;
            btn.classList.add('bg-red-500', 'text-white');
            content.classList.add('ring-2', 'ring-red-500/50');
            
            // Add a temporary error label if it doesn't exist
            let errorLabel = document.getElementById('auth-error-feedback');
            if (!errorLabel) {
                errorLabel = document.createElement('div');
                errorLabel.id = 'auth-error-feedback';
                errorLabel.className = 'text-[10px] text-red-500 font-bold uppercase tracking-widest text-center mt-2 animate-bounce';
                btn.parentNode.insertBefore(errorLabel, btn.nextSibling);
            }
            errorLabel.textContent = errorMsg;

            setTimeout(() => {
                btn.innerHTML = originalContent;
                btn.disabled = false;
                btn.classList.remove('bg-red-500', 'text-white');
                content.classList.remove('ring-2', 'ring-red-500/50');
                if (errorLabel) errorLabel.remove();
            }, 3000);
        }
    };

    document.getElementById('login-submit').addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        if (!email || !password) return;
        handleAuth('login', [email, password]);
    });

    document.getElementById('register-submit').addEventListener('click', () => {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        if (!name || !email || !password) return;
        handleAuth('register', [name, email, password]);
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        window.Store.logout();
        toggleProfile(false);
    });

    // Navigation intercept - More robust detection
    const attachListeners = () => {
        // 1. Find by icon text
        const icons = Array.from(document.querySelectorAll('.material-symbols-outlined, .material-icons, i, span'));
        icons.forEach(icon => {
            const text = icon.textContent.trim().toLowerCase();
            if (text === 'person' || text === 'account_circle') {
                const btn = icon.closest('button') || icon.closest('a') || icon;
                if (btn.dataset.profileInited) return;
                setupTrigger(btn);
            }
        });

        // 2. Find by Profile/Identity Terminal text
        const allElements = document.querySelectorAll('a, button, span, p');
        allElements.forEach(el => {
            const text = el.textContent.trim().toUpperCase();
            if (text === 'IDENTITY TERMINAL' || text === 'TERMINAL' || text === 'PROFILE') {
                if (el.dataset.profileInited) return;
                setupTrigger(el);
            }
        });

        // 3. Find by Image Alt
        const imgs = document.querySelectorAll('img');
        imgs.forEach(img => {
            const alt = (img.alt || '').toUpperCase();
            if (alt.includes('PROFILE') || alt.includes('USER AVATAR')) {
                const trigger = img.closest('button') || img.closest('a') || img.parentElement;
                if (trigger.dataset.profileInited) return;
                setupTrigger(trigger);
            }
        });

        // 4. Also look for buttons with text like "Join" or "Apply" or "Login"
        const allBtns = document.querySelectorAll('button, a.btn, a.rounded-full');
        allBtns.forEach(btn => {
            // IGNORE buttons already inside the modal
            if (btn.closest('#profile-modal')) return;

            const text = btn.textContent.toUpperCase();
            if (
                text.includes('JOIN THE SYNDICATE') || 
                text.includes('APPLY FOR ENTRY') || 
                text.includes('APPLY FOR ENTERY') || 
                text.includes('CHECK YOUR RANK') || 
                text.includes('SIGN IN') ||
                text.includes('SIGN UP') ||
                text.includes('REGISTER') ||
                text.includes('LOGIN')
            ) {
                if (btn.dataset.profileInited) return;
                setupTrigger(btn);
            }
        });
    };

    const setupTrigger = (el) => {
        if (!el) return;
        el.dataset.profileInited = 'true';
        el.style.cursor = 'pointer';
        
        // If it's the home link, don't intercept
        if (el.tagName === 'A' && (el.getAttribute('href') === 'index_v2.html' || el.getAttribute('href') === '/')) return;

        el.addEventListener('click', (e) => {
            // Check if we should actually intercept (if it's not already navigating to profile)
            if (el.tagName === 'A' && el.getAttribute('href') === 'profile.html' && window.Store.getUser()) return;

            e.preventDefault();
            e.stopPropagation();
            if (window.Store.getUser()) {
                window.location.href = 'profile.html';
            } else {
                toggleProfile(true);
            }
        });
    };

    attachListeners();
    const observer = new MutationObserver(attachListeners);
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Initial verification handled by app.js, but we listen for updates
    window.addEventListener('authUpdated', updateView);
});
