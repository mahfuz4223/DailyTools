/**
 * Adapts navigation links in header/footer for correct paths and active states.
 * Should be called *after* header and footer components are loaded into the DOM.
 */
function adaptNavigation() {
    const header = document.querySelector('#header');
    const footer = document.querySelector('#footer');
    const currentFullUrl = window.location.href;
    const currentPathname = window.location.pathname;

    // Determine the depth of the current page's directory from the root
    // Example: /index.html -> depth 0; /pages/foo.html -> depth 1; /pages/sub/bar.html -> depth 2
    const pathParts = currentPathname.split('/').filter(Boolean);
    let currentDirDepth = 0;
    if (pathParts.length > 0 && pathParts[pathParts.length - 1].includes('.')) {
        currentDirDepth = pathParts.length - 1;
    } else {
        currentDirDepth = pathParts.length;
    }

    // Function to adjust a single link's href attribute
    function adjustLinkPath(linkElement, originalHrefAttr) {
        let originalHref = linkElement.getAttribute(originalHrefAttr);
        if (!originalHref) {
            originalHref = linkElement.getAttribute('href');
            linkElement.setAttribute(originalHrefAttr, originalHref); // Store it if not already stored
        }

        let newHref = originalHref;
        if (originalHref && !originalHref.startsWith('#') && !originalHref.startsWith('http') && !originalHref.startsWith('mailto:') && !originalHref.startsWith('tel:')) {
            // Links in components like '../index.html' assume the component is used in a page 1 level deep.
            if (originalHref.startsWith('../')) {
                const pathRelativeTo предполагаемыйRoot = originalHref.substring(3); // e.g., 'index.html' or 'tools/pdf.html'
                let prefix = '';
                for (let i = 0; i < currentDirDepth; i++) {
                    prefix += '../';
                }
                newHref = prefix + pathRelativeTo предполагаемыйRoot;
            } else if (!originalHref.startsWith('/')) {
                 // Links like 'some-tool.html' are relative from current dir. These are generally fine if intentional.
                 // However, for shared components, it's safer if all site-internal links are either absolute (start with '/')
                 // or use the '../' convention to signify "from site root".
                 // If currentDirDepth > 0, and link is like 'assets/img.png' it could break if component is shared.
                 // For now, we only explicitly adjust '../' prefixed links assuming they are root-relative from one-level-deep.
            }
        }
        linkElement.setAttribute('href', newHref);
        return newHref; // Return the possibly modified href for active state checking
    }

    if (header) {
        const navLinks = header.querySelectorAll('a[href]');
        navLinks.forEach(link => {
            adjustLinkPath(link, 'data-original-href');
            
            // Active state logic
            link.classList.remove('active');
            const parentNavItem = link.closest('.nav-item');
            if (parentNavItem) parentNavItem.classList.remove('active');
            const parentDropdownToggle = link.closest('.nav-item.dropdown')?.querySelector('.nav-link.dropdown-toggle');
            if (parentDropdownToggle) parentDropdownToggle.classList.remove('active');

            if (link.href) { // Check if href is not empty after potential modification
                const linkUrl = new URL(link.href, currentFullUrl); // Resolve to absolute URL
                const currentUrl = new URL(currentFullUrl);

                // Normalize pathnames (remove .html, ensure trailing slash for directory comparison)
                const normalizePath = (path) => path.replace(/\/(index\.html)?$/, '/').replace(/\.html$/, '');
                
                const currentNorm = normalizePath(currentUrl.pathname);
                const targetNorm = normalizePath(linkUrl.pathname);

                if (currentNorm === targetNorm && currentUrl.origin === linkUrl.origin) {
                     // Basic path match. For hash links, ensure it's not a different hash on same page.
                    if (linkUrl.hash && linkUrl.hash !== currentUrl.hash && currentNorm === normalizePath(currentUrl.pathname) && currentUrl.hash) {
                        // This is a link to a different section of the current page, don't mark active unless it IS the current section
                    } else {
                        link.classList.add('active');
                        if (parentNavItem) parentNavItem.classList.add('active'); // Also activate parent li if exists

                        const dropdownMenu = link.closest('.dropdown-menu-glass');
                        if (dropdownMenu) {
                            const dropdownToggle = dropdownMenu.closest('.nav-item.dropdown')?.querySelector('.nav-link.dropdown-toggle');
                            if (dropdownToggle) {
                                dropdownToggle.classList.add('active');
                            }
                        }
                    }
                }
            }
        });
    }

    if (footer) {
        const footerLinks = footer.querySelectorAll('a[href]');
        footerLinks.forEach(link => {
            adjustLinkPath(link, 'data-original-footer-href');
        });
    }
}

// Ensure this script is included in your HTML pages,
// and adaptNavigation() is called AFTER your componentLoader.js has injected
// the header and footer HTML. 
// For example, if componentLoader.js returns a promise:
// componentLoader.load().then(adaptNavigation);
// Or, if using DOMContentLoaded and components are loaded synchronously by then:
// document.addEventListener('DOMContentLoaded', adaptNavigation);
// However, since component loading is often async, a callback or promise is safer. 