// Router module for KamiWear

// Router class for handling routing functionality
export class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.params = {};
        this.query = {};
        this.initializeRouter();
    }

    initializeRouter() {
        // Add event listener for popstate
        window.addEventListener('popstate', () => {
            this.handleRoute(window.location.pathname);
        });

        // Add event listener for click on links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href.startsWith(window.location.origin)) {
                e.preventDefault();
                this.navigate(link.pathname);
            }
        });

        // Handle initial route
        this.handleRoute(window.location.pathname);
    }

    addRoute(path, component) {
        this.routes.set(path, component);
    }

    removeRoute(path) {
        this.routes.delete(path);
    }

    navigate(path) {
        window.history.pushState(null, '', path);
        this.handleRoute(path);
    }

    handleRoute(path) {
        // Parse query parameters
        const url = new URL(window.location.href);
        this.query = Object.fromEntries(url.searchParams.entries());

        // Find matching route
        let matchedRoute = null;
        let matchedParams = {};

        for (const [routePath, component] of this.routes) {
            const pattern = this.pathToPattern(routePath);
            const match = path.match(pattern);

            if (match) {
                matchedRoute = routePath;
                matchedParams = this.extractParams(routePath, match);
                break;
            }
        }

        if (matchedRoute) {
            this.currentRoute = matchedRoute;
            this.params = matchedParams;
            this.renderComponent(matchedRoute);
        } else {
            this.handleNotFound();
        }
    }

    pathToPattern(path) {
        return new RegExp(
            '^' + path.replace(/:[^/]+/g, '([^/]+)') + '$'
        );
    }

    extractParams(routePath, match) {
        const params = {};
        const paramNames = routePath.match(/:[^/]+/g) || [];
        
        paramNames.forEach((param, index) => {
            const name = param.slice(1);
            params[name] = match[index + 1];
        });

        return params;
    }

    renderComponent(route) {
        const component = this.routes.get(route);
        const container = document.querySelector('#app');

        if (container && component) {
            // Clear container
            container.innerHTML = '';

            // Render component
            if (typeof component === 'function') {
                component(container, this.params, this.query);
            } else if (typeof component === 'string') {
                container.innerHTML = component;
            } else if (component instanceof HTMLElement) {
                container.appendChild(component);
            }

            // Update active link
            this.updateActiveLink(route);
        }
    }

    handleNotFound() {
        const container = document.querySelector('#app');
        if (container) {
            container.innerHTML = `
                <div class="not-found">
                    <h1>404</h1>
                    <p>Page not found</p>
                    <a href="/" class="btn btn-primary">Go Home</a>
                </div>
            `;
        }
    }

    updateActiveLink(route) {
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            if (link.pathname === route) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    getCurrentRoute() {
        return this.currentRoute;
    }

    getParams() {
        return this.params;
    }

    getQuery() {
        return this.query;
    }

    getQueryParam(key) {
        return this.query[key];
    }

    setQueryParam(key, value) {
        this.query[key] = value;
        this.updateQueryString();
    }

    removeQueryParam(key) {
        delete this.query[key];
        this.updateQueryString();
    }

    updateQueryString() {
        const url = new URL(window.location.href);
        Object.entries(this.query).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
        window.history.pushState(null, '', url);
    }

    // Route guards
    addRouteGuard(route, guard) {
        const component = this.routes.get(route);
        if (component) {
            this.routes.set(route, {
                component,
                guard
            });
        }
    }

    removeRouteGuard(route) {
        const routeData = this.routes.get(route);
        if (routeData && routeData.guard) {
            this.routes.set(route, routeData.component);
        }
    }

    // Route transitions
    addRouteTransition(route, transition) {
        const component = this.routes.get(route);
        if (component) {
            this.routes.set(route, {
                component,
                transition
            });
        }
    }

    removeRouteTransition(route) {
        const routeData = this.routes.get(route);
        if (routeData && routeData.transition) {
            this.routes.set(route, routeData.component);
        }
    }

    // Route middleware
    addRouteMiddleware(route, middleware) {
        const component = this.routes.get(route);
        if (component) {
            this.routes.set(route, {
                component,
                middleware
            });
        }
    }

    removeRouteMiddleware(route) {
        const routeData = this.routes.get(route);
        if (routeData && routeData.middleware) {
            this.routes.set(route, routeData.component);
        }
    }

    // Route hooks
    addRouteHook(route, hook) {
        const component = this.routes.get(route);
        if (component) {
            this.routes.set(route, {
                component,
                hook
            });
        }
    }

    removeRouteHook(route) {
        const routeData = this.routes.get(route);
        if (routeData && routeData.hook) {
            this.routes.set(route, routeData.component);
        }
    }

    // Route events
    onRouteChange(callback) {
        window.addEventListener('popstate', () => {
            callback(this.currentRoute, this.params, this.query);
        });
    }

    offRouteChange(callback) {
        window.removeEventListener('popstate', callback);
    }

    // Route utilities
    isRouteActive(route) {
        return this.currentRoute === route;
    }

    isRouteMatch(route) {
        const pattern = this.pathToPattern(route);
        return pattern.test(window.location.pathname);
    }

    getRouteParams(route) {
        const pattern = this.pathToPattern(route);
        const match = window.location.pathname.match(pattern);
        return match ? this.extractParams(route, match) : {};
    }

    getRouteQuery(route) {
        return this.query;
    }

    getRouteComponent(route) {
        const routeData = this.routes.get(route);
        return routeData ? routeData.component : null;
    }

    getRouteGuard(route) {
        const routeData = this.routes.get(route);
        return routeData ? routeData.guard : null;
    }

    getRouteTransition(route) {
        const routeData = this.routes.get(route);
        return routeData ? routeData.transition : null;
    }

    getRouteMiddleware(route) {
        const routeData = this.routes.get(route);
        return routeData ? routeData.middleware : null;
    }

    getRouteHook(route) {
        const routeData = this.routes.get(route);
        return routeData ? routeData.hook : null;
    }
}

// Create router instance
const router = new Router();

// Export router instance
export default router; 