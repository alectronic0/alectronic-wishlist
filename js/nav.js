/**
 * Global Navigation Script for Alec's Wishlist & Home Inventory
 * Implements the alectronic-date fold-down hamburger navigation bar.
 */
(function () {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    const navLinks = [
        {href: 'index.html', icon: '🏠', title: 'Wishlist Hub', sub: 'Main hub & money gifts'},
        {href: 'lego.html', icon: '🧱', title: 'LEGO® Collection', sub: 'Star Wars, Botanical & Icons'},
        {href: 'zelda.html', icon: '⚔️', title: 'The Zelda Shrine', sub: 'Relics, games & lore'},
        {href: 'boardgames.html', icon: '🎲', title: 'Board Games', sub: 'Quacks, Ticket to Ride, Clank!'},
        {href: 'videogames.html', icon: '🎮', title: 'Video Games', sub: 'Switch, 3DS & Steam library'},
        {href: 'books.html', icon: '📚', title: 'Books & Reference', sub: 'Cookbooks, manga & CS textbooks'},
        {href: 'home.html', icon: '🏡', title: 'Home & Smart Tech', sub: 'Office, living room & bathroom'},
        {href: 'health.html', icon: '🩺', title: 'Health & Gym', sub: 'ECG monitor & Hilo bracelet'},
        {href: 'clothing.html', icon: '👕', title: 'Clothing & Sizes', sub: 'Style philosophy & sizing chart'},
        {href: 'misc.html', icon: '🛒', title: 'Stores & Subscriptions', sub: 'Tech merch & subscription boxes'},
        {
            href: 'consumables.html',
            icon: '📦',
            title: 'Recurring Household Consumables',
            sub: 'A reference list of common household items that need recurring top-ups.'
        }
    ];

    function renderNav() {
        const siteHeader = document.querySelector('header.site-nav');
        if (!siteHeader) return;

        // Render fold-down top bar layout (matching alectronic-date pattern)
        siteHeader.innerHTML = `
      <div class="nav-bar">
        <button class="nav-burger" id="navBurger" type="button" aria-expanded="false" aria-controls="nav-foldout" aria-label="Toggle Navigation Menu">
          <span class="burger-lines" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="burger-label" id="burgerLabel">Menu</span>
        </button>
        <a href="index.html" class="logo"><strong>Alec's Wishlist</strong></a>
      </div>

      <div class="nav-foldout" id="navFoldout">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
          <span style="font-size:0.78rem; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--accent);">Explore Sections</span>
          <span style="font-size:0.75rem; color:var(--text-muted);">${navLinks.length} Catalog Pages</span>
        </div>
        <div class="nav-grid">
          ${navLinks
            .map((item) => {
                const isActive =
                    currentPath === item.href || (currentPath === '' && item.href === 'index.html')
                        ? 'active'
                        : '';
                return `
                <a href="${item.href}" class="nav-link-card ${isActive}">
                  <span class="nav-link-icon">${item.icon}</span>
                  <div class="nav-link-info">
                    <span class="nav-link-title">${item.title}</span>
                    <span class="nav-link-sub">${item.sub}</span>
                  </div>
                </a>
              `;
            })
            .join('')}
        </div>
      </div>
    `;

        const navBurger = document.getElementById('navBurger');
        const burgerLabel = document.getElementById('burgerLabel');

        function toggleMenu() {
            const isOpen = siteHeader.classList.toggle('open');
            navBurger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            if (burgerLabel) {
                burgerLabel.textContent = isOpen ? 'Close' : 'Menu';
            }
        }

        if (navBurger) {
            navBurger.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleMenu();
            });
        }

        // Close menu when clicking outside header
        document.addEventListener('click', function (e) {
            if (siteHeader.classList.contains('open') && !siteHeader.contains(e.target)) {
                siteHeader.classList.remove('open');
                navBurger.setAttribute('aria-expanded', 'false');
                if (burgerLabel) burgerLabel.textContent = 'Menu';
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && siteHeader.classList.contains('open')) {
                siteHeader.classList.remove('open');
                navBurger.setAttribute('aria-expanded', 'false');
                if (burgerLabel) burgerLabel.textContent = 'Menu';
            }
        });
        // Render WIP Construction Banner on all pages
        renderWipBanner();
    }

    function renderWipBanner() {
        const mainContainer = document.querySelector('main.container') || document.querySelector('.container');
        if (!mainContainer || mainContainer.querySelector('.wip-banner')) return;

        const banner = document.createElement('div');
        banner.className = 'wip-banner';
        banner.style.cssText = 'background: linear-gradient(135deg, rgba(234, 179, 8, 0.14), rgba(249, 115, 22, 0.12)); border: 1px solid rgba(234, 179, 8, 0.35); border-radius: 12px; padding: 14px 18px; margin: 16px 0 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);';
        banner.innerHTML = `
      <span style="font-size: 2rem; flex-shrink: 0; filter: drop-shadow(0 2px 8px rgba(234, 179, 8, 0.4));">🚧</span>
      <div>
        <h3 style="margin: 0 0 3px; font-size: 0.95rem; color: var(--gold); font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;">🚧 Work In Progress — Under Construction 🚧</h3>
        <p style="margin: 0; font-size: 0.86rem; color: var(--text); line-height: 1.45;">
          <strong>https://gift.alec.today/</strong> is currently under active construction and catalog reorganization! Explore collection hubs while items are being updated.
        </p>
      </div>`;

        mainContainer.insertBefore(banner, mainContainer.firstChild);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderNav);
    } else {
        renderNav();
    }
})();
