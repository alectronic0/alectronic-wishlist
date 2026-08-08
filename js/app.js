document.addEventListener('DOMContentLoaded', () => {
  const headerHTML = `
    <div class="banner wip-banner" style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.14), rgba(249, 115, 22, 0.12)); border-bottom: 1px solid rgba(234, 179, 8, 0.35); padding: 14px 18px; text-align: center; color: var(--text);">
      <div style="font-size: 1.5rem; margin-bottom: 8px;">🚧</div>
      <h3 style="margin: 0 0 5px; font-size: 0.95rem; color: var(--gold); font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;">🚧 Work In Progress — Under Construction 🚧</h3>
      <p style="margin: 0 0 8px; font-size: 0.86rem; line-height: 1.45;">
        <strong>https://gift.alec.today/</strong> is currently under active construction and catalog reorganization!<br>Explore collection hubs while items are being updated.
      </p>
      <div style="font-size: 0.8rem; opacity: 0.9; font-weight: 500;">Last updated on: <span class="header-date"></span></div>
    </div>
    <header class="site-nav"></header>
  `;
  const footerHTML = `
    <footer id="footer" style="text-align: center; padding: 24px; color: var(--text-muted); border-top: 1px solid var(--border); margin-top: 24px;">
      <p>&copy; <span class="year">${new Date().getFullYear()}</span> Alec &middot; gift.alec.today &middot; All rights reserved.</p>
      <p style="margin-top: 4px; font-size: 0.8em; opacity: 0.8;">Powered by <a href="https://alec.today/" target="_blank" rel="noopener" style="text-decoration: underline; color: inherit;">Alec Doran-Twyford (Alectronic&trade;)</a></p>
    </footer>
  `;
  document.body.insertAdjacentHTML('afterbegin', headerHTML);
  document.body.insertAdjacentHTML('beforeend', footerHTML);
});
document.addEventListener('DOMContentLoaded', () => {
  const SITE_CONTENT = window.SITE_CONTENT;
  if (!SITE_CONTENT) return;

  if (SITE_CONTENT.meta && SITE_CONTENT.meta.updatedAt) {
    const d = new Date(SITE_CONTENT.meta.updatedAt);
    document.querySelectorAll('.header-date').forEach(el => el.textContent = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
  }

  // --- index.html ---
  if (document.getElementById('hero-title')) {
    const indexData = SITE_CONTENT.index;
    if (indexData) {
      
        // Render Intro Header
        const intro = indexData.intro;
        if (intro) {
          if (intro.title) document.getElementById('hero-title').textContent = intro.title;
          if (intro.subtitle) document.getElementById('hero-subtitle').textContent = intro.subtitle;
      
          const sectionsContainer = document.getElementById('intro-sections-container');
          if (sectionsContainer && intro.sections) {
            const s = intro.sections;
            
            // 1. Info Box (Blue/Neutral)
            if (s.info) {
              const infoDiv = document.createElement('div');
              infoDiv.style.cssText = 'background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.2);';
              infoDiv.innerHTML = `<h3 style="margin:0 0 8px; font-size:0.95rem; color:#60a5fa; font-weight:700;">${s.info.title}</h3><p style="margin:0; font-size:0.86rem; line-height:1.5;">${s.info.text}</p>`;
              sectionsContainer.appendChild(infoDiv);
            }
      
            // 2. Warning Box (Amber/Orange)
            if (s.warning) {
              const warnDiv = document.createElement('div');
              warnDiv.style.cssText = 'background: rgba(234, 179, 8, 0.09); border: 1px solid rgba(234, 179, 8, 0.35); border-radius: 12px; padding: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.2);';
              warnDiv.innerHTML = `<h3 style="margin:0 0 8px; font-size:0.95rem; color:var(--gold); font-weight:700;">${s.warning.title}</h3><p style="margin:0; font-size:0.86rem; line-height:1.5;">${s.warning.text}</p>`;
              sectionsContainer.appendChild(warnDiv);
            }
      
            // 3. Don't Box (Red - NEVER BUY THIS)
            if (s.dont) {
              const dontDiv = document.createElement('div');
              dontDiv.style.cssText = 'background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 12px; padding: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.2); grid-column: 1 / -1;';
              dontDiv.innerHTML = `
                <h3 style="margin:0 0 10px; font-size:0.98rem; color:#f87171; font-weight:800; text-transform:uppercase; letter-spacing:0.04em;">${s.dont.title}</h3>
                <ul style="margin:0; padding-left:18px; font-size:0.88rem; line-height:1.6; color:var(--text);">
                  ${s.dont.items.map(item => `<li style="margin-bottom:6px;">${item}</li>`).join('')}
                </ul>`;
              sectionsContainer.appendChild(dontDiv);
            }
      
            // 4. Good Suggestions Box (Green)
            if (s.good) {
              const goodDiv = document.createElement('div');
              goodDiv.style.cssText = 'background: rgba(34, 197, 94, 0.09); border: 1px solid rgba(34, 197, 94, 0.35); border-radius: 12px; padding: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.2); grid-column: 1 / -1;';
              goodDiv.innerHTML = `
                <h3 style="margin:0 0 10px; font-size:0.98rem; color:#4ade80; font-weight:800; text-transform:uppercase; letter-spacing:0.04em;">${s.good.title}</h3>
                <ul style="margin:0; padding-left:18px; font-size:0.88rem; line-height:1.6; color:var(--text);">
                  ${s.good.items.map(item => `<li style="margin-bottom:6px;">${item}</li>`).join('')}
                </ul>`;
              sectionsContainer.appendChild(goodDiv);
            }
          }
        }
      
        // Render Gift Money
        const moneyContainer = document.getElementById('gift-money-container');
        if (moneyContainer && Array.isArray(indexData.giftMoney)) {
          moneyContainer.innerHTML = indexData.giftMoney.map(m => `
            <a href="${m.url}" target="_blank" class="horizontal-card" style="padding: 12px 16px; display: flex; align-items: center; gap: 10px;">
              <img src="${m.logo}" alt="${m.name} Logo" style="width: 28px; height: 28px; border-radius: 6px;">
              <span style="font-weight: 700; font-size: 0.95rem;">${m.name}</span>
            </a>
          `).join('');
        }
      
        // Render Collection Hubs
        const hubsContainer = document.getElementById('collection-hubs-container');
        if (hubsContainer && Array.isArray(indexData.collectionHubs)) {
          hubsContainer.innerHTML = indexData.collectionHubs.map(h => `
            <a href="${h.href}" class="inv-shelf-card" style="text-decoration: none; color: inherit; transition: transform 0.15s;">
              <div class="inv-card-header" style="margin-bottom: 4px;">
                <div class="inv-title-group">
                  <span class="inv-card-icon">${h.icon}</span>
                  <h3 class="inv-card-title">${h.title}</h3>
                </div>
              </div>
              <p class="inv-card-notes" style="margin: 0; font-size: 0.82rem;">${h.notes}</p>
            </a>
          `).join('');
        }
      
        // Render Priority Items
        const priorityContainer = document.getElementById('priority-items-container');
        if (priorityContainer) {
          if (Array.isArray(indexData.priorityItems) && indexData.priorityItems.length > 0) {
            // Render priority cards when populated
            priorityContainer.innerHTML = `<div class="wishlist-grid">${indexData.priorityItems.map(item => `
              <div class="wishlist-item">
                <div class="wishlist-item-img"><img src="${item.img}" alt="${item.name}"></div>
                <div class="wishlist-item-content">
                  <h4>${item.name}</h4>
                  <p>${item.desc || ''}</p>
                </div>
              </div>
            `).join('')}</div>`;
          } else {
            // Empty priority box state
            priorityContainer.innerHTML = `
              <div class="empty-priority-box">
                <span class="empty-priority-icon">🎁</span>
                <div class="empty-priority-title">No Active Priority Wishlist Items</div>
                <div class="empty-priority-desc">Check back soon! Explore dedicated collection pages above for LEGO, Zelda, Books, Board Games, and Tech.</div>
              </div>`;
          }
        }
    }
  }

  // --- boardgames.html ---
  if (document.getElementById('boardgames-owned-section')) {
    const data = SITE_CONTENT.boardgames;
    if (data) {
      
        document.getElementById('boardgame-subtitle').textContent = 
          `${data.owned.length} Owned Games · ${data.wishlist.length} Wishlist Games`;
        if (data.bggUrl) {
          document.getElementById('bgg-link').href = data.bggUrl;
        }
        if (data.amazonWishlistUrl) {
          document.getElementById('amazon-wishlist-link').href = data.amazonWishlistUrl;
        }
      
        function renderCard(item, isWishlist) {
          const card = document.createElement('div');
          card.className = 'wishlist-item';
          card.style.cssText = 'border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;';
      
          // 1. Image
          const imgHTML = `
            <div class="wishlist-item-img">
              <img src="${item.img}" alt="${item.name}" loading="lazy" referrerpolicy="no-referrer">
            </div>`;
      
          // 2. BGG ID (clickable link to BGG profile page)
          let bggLinkHTML = '';
          if (item.bggId) {
            const bggUrl = `https://boardgamegeek.com/boardgame/${item.bggId}`;
            bggLinkHTML = `<a href="${bggUrl}" target="_blank" class="bgg-id-badge" style="font-size:0.72rem; font-weight:800; color:var(--accent); text-decoration:none; display:inline-flex; align-items:center; gap:2px; margin-bottom:2px;">BGG #${item.bggId} ↗</a>`;
          }
      
          // 3. Name
          const titleHTML = `<div class="wishlist-item-title" style="font-size:0.85rem; font-weight:700; color:var(--text); line-height:1.2; margin-bottom:2px;">${item.name}</div>`;
      
          // 4. Publisher / Creator
          const publisher = item.publisher || item.badge || item.category || 'Tabletop Game';
          const publisherHTML = `<div style="font-size:0.72rem; color:var(--text-muted); margin-bottom:8px; font-weight:500;">${publisher}</div>`;
      
          // 5. Buy Online Button
          let amazonUrl = item.amazonUrl;
          if (!amazonUrl && item.asin) {
            amazonUrl = `https://www.amazon.co.uk/dp/${item.asin}`;
          }
          if (!amazonUrl && item.url && (item.url.includes('amazon.co.uk') || item.url.includes('amazon.com') || item.url.includes('thediary.com'))) {
            amazonUrl = item.url;
          }
      
          let buyButtonHTML = '';
          if (!isWishlist) {
            buyButtonHTML = `<button class="inv-action-btn btn-disabled" disabled style="display:block; width:100%; text-align:center; padding:6px 10px; font-size:0.73rem; font-weight:600; opacity:0.6; cursor:not-allowed; background:var(--card); border:1px solid var(--border); color:var(--text-muted); margin-top:auto; border-radius:6px;">Own</button>`;
          } else if (amazonUrl) {
            buyButtonHTML = `<a href="${amazonUrl}" target="_blank" class="inv-action-btn" style="display:block; text-align:center; padding:6px 10px; font-size:0.75rem; font-weight:700; margin-top:auto; border-radius:6px; text-decoration:none;">Buy Online ↗</a>`;
          } else {
            buyButtonHTML = `<button class="inv-action-btn btn-disabled" disabled style="display:block; width:100%; text-align:center; padding:6px 10px; font-size:0.73rem; font-weight:600; opacity:0.5; cursor:not-allowed; background:var(--card); border:1px solid var(--border); color:var(--text-muted); margin-top:auto; border-radius:6px;">Link Currently Missing</button>`;
          }
      
          // 6. Expansions & Accessories Dropdown
          let expansionsHTML = '';
          if (Array.isArray(item.expansions) && item.expansions.length > 0) {
            const expItemsHTML = item.expansions.map(exp => {
              const expAmzUrl = exp.amazonUrl || (exp.asin ? `https://www.amazon.co.uk/dp/${exp.asin}` : null);
              const expBggUrl = exp.bggId ? `https://boardgamegeek.com/boardgameexpansion/${exp.bggId}` : null;
      
              let expBtn = '';
              if (exp.owned) {
                expBtn = `<button disabled style="padding:3px 6px; font-size:0.68rem; opacity:0.6; cursor:not-allowed; background:none; border:1px solid var(--border); color:var(--text-muted); margin-top:4px;">Owned</button>`;
              } else if (expAmzUrl) {
                expBtn = `<a href="${expAmzUrl}" target="_blank" class="inv-action-btn" style="padding:3px 6px; font-size:0.68rem; display:inline-block; margin-top:4px; text-decoration:none;">Buy Online ↗</a>`;
              } else {
                expBtn = `<button disabled style="padding:3px 6px; font-size:0.68rem; opacity:0.5; cursor:not-allowed; background:none; border:1px solid var(--border); color:var(--text-muted); margin-top:4px;">Link Currently Missing</button>`;
              }
      
              return `
                <div style="background:var(--card-hover); padding:6px 8px; border-radius:6px; font-size:0.72rem; border:1px solid var(--border); margin-top:4px; display:flex; flex-direction:column; gap:2px;">
                  <div style="font-weight:700; color:var(--text); line-height:1.2;">
                    ${exp.owned ? '<span style="color:var(--mint); font-weight:800; margin-right:3px;">✓ </span>' : ''}${exp.name}
                  </div>
                  ${expBggUrl ? `<div><a href="${expBggUrl}" target="_blank" style="color:var(--accent); font-weight:800; font-size:0.68rem; text-decoration:none;">BGG #${exp.bggId} ↗</a></div>` : ''}
                  <div style="margin-top:2px;">${expBtn}</div>
                </div>`;
            }).join('');
      
            expansionsHTML = `
              <details class="expansions-dropdown" style="margin-top:8px; border-top:1px dashed var(--border); padding-top:6px;">
                <summary style="font-size:0.73rem; font-weight:700; cursor:pointer; color:var(--accent); user-select:none;">Expansions & Accessories (${item.expansions.length})</summary>
                <div style="display:flex; flex-direction:column; gap:4px; margin-top:4px;">
                  ${expItemsHTML}
                </div>
              </details>`;
          }
      
          card.innerHTML = `
            ${imgHTML}
            <div class="wishlist-item-info" style="display:flex; flex-direction:column; padding:10px; flex:1;">
              ${bggLinkHTML}
              ${titleHTML}
              ${publisherHTML}
              ${buyButtonHTML}
              ${expansionsHTML}
            </div>`;
      
          return card;
        }
      
        function renderGrid(containerId, title, subtitle, items, isWishlist) {
          const container = document.getElementById(containerId);
          if (!container) return;
      
          const header = document.createElement('div');
          header.className = 'section-header';
          header.innerHTML = `<h2 style="font-size:1.3rem;">${title}</h2><p style="font-size:0.85rem;">${subtitle}</p>`;
          container.appendChild(header);
      
          const grid = document.createElement('div');
          grid.className = 'item-list grid-5-cols';
          for (const item of items) {
            grid.appendChild(renderCard(item, isWishlist));
          }
          container.appendChild(grid);
        }
      
        renderGrid(
          'boardgames-wanted-section',
          `🎁 Board Game Wishlist (${data.wishlist.length})`,
          'Games I would love to add to the table.',
          data.wishlist,
          true
        );
      
        renderGrid(
          'boardgames-owned-section',
          `✅ Owned Tabletop Games (${data.owned.length})`,
          'Games currently in my home board game collection.',
          data.owned,
          false
        );
    }
  }

  // --- books.html ---
  if (document.getElementById('books-section')) {
    const data = SITE_CONTENT.books;
    if (data) {
      
        // Calculate book counts across manga volumes and normal books
        const ownedManga = data.manga ? data.manga.reduce((sum, s) => sum + s.volumes.filter(v => v.status === 'owned').length, 0) : 0;
        const wantedManga = data.manga ? data.manga.reduce((sum, s) => sum + s.volumes.filter(v => v.status === 'wanted').length, 0) : 0;
        
        const ownedNormal = data.normal ? data.normal.filter(b => b.status === 'owned').length : 0;
        const wantedNormal = data.normal ? data.normal.filter(b => b.status === 'wanted').length : 0;
      
        document.getElementById('books-subtitle').textContent = 
          `${ownedManga + ownedNormal} Owned Books · ${wantedManga + wantedNormal} Wishlist Books`;
      
        if (data.amazonWishlistUrl) {
          const wishlistLink = document.getElementById('amazon-wishlist-link');
          if (wishlistLink) {
            wishlistLink.href = data.amazonWishlistUrl;
            wishlistLink.style.display = 'inline-block';
          }
        }
      
        // Modal Setup
        const modal = document.getElementById('book-modal');
        const modalBody = document.getElementById('modal-body-content');
        const closeBtn = document.getElementById('modal-close-btn');
      
        function openModal(series, vol) {
          let imgHTML = '';
          if (vol.img && vol.img !== '') {
            imgHTML = `<img src="${vol.img}" alt="${series.series} Vol. ${vol.vol}">`;
          } else {
            imgHTML = `
              <div class="fallback-cover">
                <div class="fallback-cover-title">${series.series}</div>
                <div style="font-size: 1.1rem; font-weight: 700; color: var(--text); margin-top: 8px;">Vol. ${vol.vol}</div>
                <div class="fallback-cover-author">${series.author}</div>
              </div>
            `;
          }
      
          const statusClass = vol.status === 'owned' ? 'owned' : 'wanted';
          const statusLabel = vol.status === 'owned' ? '✓ Owned' : '🎁 Wanted';
      
          let linksHTML = '';
          if (vol.amazon) {
            linksHTML += `<a href="${vol.amazon}" target="_blank" class="modal-link-btn amazon">Amazon.co.uk ↗</a>`;
          }
          if (vol.goodreads) {
            linksHTML += `<a href="${vol.goodreads}" target="_blank" class="modal-link-btn">Goodreads ↗</a>`;
          }
          if (vol.waterstones) {
            linksHTML += `<a href="${vol.waterstones}" target="_blank" class="modal-link-btn">Waterstones ↗</a>`;
          }
          if (linksHTML === '') {
            const fallbackUrl = series.wishlistUrl || data.amazonWishlistUrl || '#';
            linksHTML += `<a href="${fallbackUrl}" target="_blank" class="modal-link-btn amazon">Series Wishlist ↗</a>`;
          }
      
          modalBody.innerHTML = `
            <div class="modal-body-img">
              ${imgHTML}
            </div>
            <div class="modal-body-info">
              <div>
                <div class="modal-title">${series.series}</div>
                <div class="modal-subtitle">Volume ${vol.vol} &middot; By ${series.author}</div>
                <div class="modal-status ${statusClass}">${statusLabel}</div>
              </div>
              <div class="modal-links">
                ${linksHTML}
              </div>
            </div>
          `;
      
          modal.classList.add('open');
          document.body.style.overflow = 'hidden';
        }
      
        function closeModal() {
          modal.classList.remove('open');
          document.body.style.overflow = '';
        }
      
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (modal) {
          modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
          });
        }
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') closeModal();
        });
      
        // Render Manga Section
        function renderMangaSection() {
          const container = document.getElementById('manga-section');
          if (!container || !data.manga) return;
      
          data.manga.forEach(series => {
            const card = document.createElement('div');
            card.className = 'manga-series-card';
      
            let imgHTML = '';
            if (series.img && series.img !== '') {
              imgHTML = `<img src="${series.img}" alt="${series.series}" loading="lazy">`;
            } else {
              imgHTML = `
                <div class="fallback-cover">
                  <div class="fallback-cover-title">${series.series}</div>
                  <div class="fallback-cover-author">${series.author}</div>
                </div>
              `;
            }
      
            const volumesHTML = series.volumes.map(vol => {
              return `<button class="vol-btn ${vol.status}" type="button" title="Volume ${vol.vol}">${vol.vol}</button>`;
            }).join('');
      
            card.innerHTML = `
              <div class="manga-cover">
                ${imgHTML}
              </div>
              <div class="manga-info">
                <h3 class="manga-title">${series.series}</h3>
                <div class="manga-author">By ${series.author}</div>
                <p class="manga-desc">${series.notes}</p>
                <div class="volumes-grid">
                  ${volumesHTML}
                </div>
              </div>
            `;
      
            // Attach click listeners to volume buttons
            card.querySelectorAll('.vol-btn').forEach((btn, index) => {
              btn.addEventListener('click', () => {
                openModal(series, series.volumes[index]);
              });
            });
      
            container.appendChild(card);
          });
        }
      
        // Render Normal Books Section
        function renderNormalBooksSection() {
          const container = document.getElementById('books-section');
          if (!container || !data.normal) return;
      
          // Group books by category
          const categories = {};
          data.normal.forEach(book => {
            if (!categories[book.category]) {
              categories[book.category] = [];
            }
            categories[book.category].push(book);
          });
      
          // Generate section HTML for each category
          Object.entries(categories).forEach(([catName, books]) => {
            const section = document.createElement('section');
            section.className = 'wishlist-section';
      
            const header = document.createElement('div');
            header.className = 'section-header';
            header.innerHTML = `
              <h2>${catName}</h2>
              <p>Books and literature in the ${catName.toLowerCase()} category.</p>
            `;
            section.appendChild(header);
      
            const ownedBooks = books.filter(b => b.status === 'owned');
            const wishlistBooks = books.filter(b => b.status === 'wanted');
      
            // Helper function to render a grid of books
            function createBookGrid(itemsList) {
              const grid = document.createElement('div');
              grid.className = 'book-grid';
      
              itemsList.forEach(book => {
                const card = document.createElement('div');
                card.className = 'wishlist-item';
      
                // Check if there is a badge that is NOT equal to category name
                const badgeText = (book.badge && book.badge !== book.category) ? book.badge : '';
      
                let coverHTML = '';
                if (book.img && book.img !== '') {
                  coverHTML = `<img src="${book.img}" alt="${book.name}" loading="lazy">`;
                } else {
                  coverHTML = `
                    <div class="fallback-cover">
                      <div class="fallback-cover-title">${book.name}</div>
                      <div class="fallback-cover-author">${badgeText || 'Reference'}</div>
                    </div>
                  `;
                }
      
                let goodreadsHTML = '';
                if (book.goodreads) {
                  goodreadsHTML = `<a href="${book.goodreads}" target="_blank" style="font-size:0.68rem; color:var(--accent); text-decoration:none; display:inline-flex; align-items:center; gap:2px; margin-bottom:4px;">Goodreads ↗</a>`;
                }
      
                let actionHTML = '';
                let titleHTML = '';
                if (book.status === 'owned') {
                  const badgeHTML = badgeText ? `<span class="inv-item-badge" style="font-size:0.65rem; padding: 2px 6px;">${badgeText}</span>` : '';
                  actionHTML = `
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-top:auto; padding-top:6px; min-height: 28px; width: 100%;">
                      ${badgeHTML}
                      <span style="font-size:0.72rem; color:var(--mint); font-weight:600; margin-left:auto;">✓ Owned</span>
                    </div>
                  `;
                  const titleLink = book.amazon || book.url;
                  if (titleLink) {
                    titleHTML = `<a href="${titleLink}" target="_blank" class="wishlist-item-title" style="font-size: 0.8rem; line-height: 1.25; margin-bottom: 4px; font-weight: 700; color: var(--text); text-decoration:none; display:-webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow:hidden;">${book.name}</a>`;
                  } else {
                    titleHTML = `<div class="wishlist-item-title" style="font-size: 0.8rem; line-height: 1.25; margin-bottom: 4px; font-weight: 700; color: var(--text); display:-webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow:hidden;">${book.name}</div>`;
                  }
                } else {
                  const buyUrl = book.url || book.amazon || `https://www.amazon.co.uk/s?k=${encodeURIComponent(book.name)}`;
                  const hasPrice = book.price && book.price !== 'Amazon Wishlist' && book.price !== 'Wishlist';
                  const priceLabel = hasPrice ? `<span class="wishlist-item-price" style="font-size:0.8rem; font-weight:700; color:var(--gold);">${book.price}</span>` : '';
                  
                  actionHTML = `
                    <div style="display:flex; flex-direction:column; gap:6px; margin-top:auto; padding-top:6px; width:100%;">
                      ${priceLabel ? `<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:2px;">${priceLabel}</div>` : ''}
                      <a href="${buyUrl}" target="_blank" class="inv-action-btn" style="display:block; text-align:center; padding:6px 10px; font-size:0.75rem; font-weight:700; border-radius:6px; text-decoration:none; width:100%;">Buy Online ↗</a>
                    </div>
                  `;
                  titleHTML = `<a href="${buyUrl}" target="_blank" class="wishlist-item-title" style="font-size: 0.8rem; line-height: 1.25; margin-bottom: 4px; font-weight: 700; color: var(--text); text-decoration:none; display:-webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow:hidden;">${book.name}</a>`;
                }
      
                const imgBg = book.img ? 'background: #ffffff;' : 'background: transparent;';
                card.innerHTML = `
                  <div class="wishlist-item-img" style="${imgBg} padding: 6px; display: flex; align-items: center; justify-content: center; height: 130px;">
                    ${coverHTML}
                  </div>
                  <div class="wishlist-item-info" style="display:flex; flex-direction:column; padding: 10px; flex: 1;">
                    ${titleHTML}
                    ${goodreadsHTML}
                    ${actionHTML}
                  </div>
                `;
      
                grid.appendChild(card);
              });
      
              return grid;
            }
      
            // 1. Render Wishlist Books subsection first
            if (wishlistBooks.length > 0) {
              const wSub = document.createElement('h3');
              wSub.textContent = `🎁 Wanted / Wishlist (${wishlistBooks.length})`;
              wSub.style.cssText = 'font-size:0.9rem; color:var(--gold); margin:16px 0 8px; font-weight:700;';
              section.appendChild(wSub);
              section.appendChild(createBookGrid(wishlistBooks));
            }
      
            // 2. Render Owned Books subsection second
            if (ownedBooks.length > 0) {
              const oSub = document.createElement('h3');
              oSub.textContent = `✅ Library & Owned (${ownedBooks.length})`;
              oSub.style.cssText = 'font-size:0.9rem; color:var(--mint); margin:24px 0 8px; font-weight:700;';
              section.appendChild(oSub);
              section.appendChild(createBookGrid(ownedBooks));
            }
      
            container.appendChild(section);
          });
        }
      
        // Initialize
        renderMangaSection();
        renderNormalBooksSection();
    }
  }

  // --- clothing.html ---
  if (document.getElementById('clothing-philosophy')) {
    const data = SITE_CONTENT.clothing;
    if (data) {
      
        // Philosophy
        if (data.philosophy) {
          document.getElementById('clothing-philosophy').textContent = data.philosophy;
        }
      
        // Brands I Wear
        const brandsContainer = document.getElementById('brands-container');
        if (brandsContainer && data.brands) {
          brandsContainer.innerHTML = data.brands.map(b => `
            <div style="background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; display: flex; flex-direction: column; justify-content: center;">
              <span style="font-weight: 700; color: var(--text); font-size: 0.9rem;">${b.name}</span>
              <span style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.2; margin-top: 2px;">${b.notes}</span>
            </div>
          `).join('');
        }
      
        // Measurements
        const measurementsGrid = document.getElementById('measurements-grid');
        if (measurementsGrid && data.measurements) {
          measurementsGrid.innerHTML = data.measurements.map(m => {
            let displayValue = '';
            let displayNotes = '';
      
            if (m.type === 'raw') {
              displayValue = m.value;
              displayNotes = m.notes || '';
            } else if (m.type === 'length') {
              displayValue = `${m.inches}"`;
              const cm = Math.round(m.inches * 2.54);
              displayNotes = `${cm} cm`;
            } else if (m.type === 'length-range') {
              displayValue = `${m.inchesMin} - ${m.inchesMax}"`;
              const cmMin = Math.round(m.inchesMin * 2.54);
              const cmMax = Math.round(m.inchesMax * 2.54);
              displayNotes = `${cmMin} - ${cmMax} cm`;
            } else if (m.type === 'height-range') {
              const ftMin = Math.floor(m.inchesMin / 12);
              const inMin = m.inchesMin % 12;
              const ftMax = Math.floor(m.inchesMax / 12);
              const inMax = m.inchesMax % 12;
              displayValue = `${ftMin}'${inMin}" - ${ftMax}'${inMax}"`;
              const cmMin = Math.round(m.inchesMin * 2.54);
              const cmMax = Math.round(m.inchesMax * 2.54);
              displayNotes = `${cmMin} - ${cmMax} cm`;
            } else if (m.type === 'weight') {
              displayValue = `${m.kg} kg`;
              const totalLbs = m.kg * 2.20462;
              const stones = Math.floor(totalLbs / 14);
              const lbs = Math.round(totalLbs % 14);
              displayNotes = `${stones} st ${lbs} lbs (${Math.round(totalLbs)} lbs)`;
            }
      
            return `
              <div class="horizontal-card" style="display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between; min-height: 68px;">
                <span style="font-size: 0.72rem; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.05em;">${m.label}</span>
                <span style="font-size: 1.15rem; font-weight: 800; color: var(--text); margin: 2px 0 0 0;">${displayValue}</span>
                <span style="font-size: 0.7rem; color: var(--text-muted); margin-top: 1px;">${displayNotes}</span>
              </div>
            `;
          }).join('');
        }
      
        // Preferred items sizes table
        const tbody = document.getElementById('clothing-table-body');
        if (tbody && data.sizes) {
          tbody.innerHTML = data.sizes.map(row => `
            <tr>
              <td><strong>${row.brand}</strong></td>
              <td>${row.item}</td>
              <td>${row.color}</td>
              <td><span class="inv-item-badge" style="font-size:0.8rem; padding:2px 8px;">${row.size}</span></td>
              <td><a href="${row.url}" target="_blank" class="inv-action-btn">View Item ↗</a></td>
            </tr>
          `).join('');
        }
      
        // Inventory breakdown
        const inventoryContainer = document.getElementById('inventory-categories-container');
        if (inventoryContainer && data.inventory) {
          // Define the distinct groups in order
          const categoriesOrder = [
            "Head (Hats)",
            "Glasses",
            "Scarves",
            "Ties",
            "Cufflinks",
            "Shirts (Gym)",
            "Shirts (Casual)",
            "Shirts (Smart)",
            "Trousers (Gym)",
            "Trousers (Casual)",
            "Trousers (PJ)",
            "Trousers (Smart)",
            "Underwear (Pants)",
            "Socks",
            "Shoes (Flip flops)",
            "Shoes (Trainer)",
            "Shoes (Wellington boots)",
            "Shoes (Smart)",
            "Shoes (Slipper)",
            "Jacket / Hoodie / Coat (Light)",
            "Jacket / Hoodie / Coat (Heavy)",
            "Jacket / Hoodie / Coat (Winter)",
            "Jacket / Hoodie / Coat (Rain)"
          ];
      
          // Group elements by matching key or generic grouping
          const groupItems = {};
          categoriesOrder.forEach(cat => { groupItems[cat] = []; });
      
          data.inventory.forEach(item => {
            // Find category key that matches item.type
            const matchedCat = categoriesOrder.find(cat => item.type === cat || item.type.startsWith(cat)) || "Other";
            if (!groupItems[matchedCat]) {
              groupItems[matchedCat] = [];
            }
            groupItems[matchedCat].push(item);
          });
      
          let inventoryHTML = '';
          categoriesOrder.forEach(category => {
            const items = groupItems[category] || [];
            inventoryHTML += `
              <div style="background: var(--bg-alt); border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
                <h3 style="color: var(--accent); font-size: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                  <span>📂 ${category}</span>
                  <span style="font-size: 0.75rem; background: var(--border); color: var(--text-muted); padding: 2px 6px; border-radius: 4px;">${items.length} Item(s)</span>
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin-top: 10px;">
                  ${items.length > 0 ? items.map(item => `
                    <div style="background: var(--card); border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; display: flex; flex-direction: column; justify-content: space-between;">
                      <span style="font-weight: 700; color: var(--text); font-size: 0.85rem;">${item.name}</span>
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px; font-size: 0.75rem; color: var(--text-muted);">
                        <span>Brand: <strong>${item.brand}</strong></span>
                        <span class="inv-item-badge" style="font-size: 0.7rem; padding: 1px 6px;">Size: ${item.size}</span>
                      </div>
                    </div>
                  `).join('') : `<p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; margin: 0;">No items cataloged yet.</p>`}
                </div>
              </div>
            `;
          });
      
          inventoryContainer.innerHTML = inventoryHTML;
        }
    }
  }

  // --- consumables.html ---
  if (document.getElementById('consumables-title')) {
    const data = SITE_CONTENT.consumables;
    if (data) {

      if (data.title) document.getElementById('consumables-title').textContent = data.title;
      const container = document.getElementById('consumables-container');
      if (container && data.categories) {
        container.innerHTML = Object.values(data.categories).map(cat => `
          <section class="wishlist-section">
            <div class="section-header">
              <h2>${cat.label}</h2>
            </div>
            <div class="clean-list" style="margin-top: 12px;">
              ${cat.items.map(item => `<li>${item}</li>`).join('')}
            </div>
          </section>
        `).join('');
      }
    }
  }

  // --- health.html ---
  if (document.getElementById('health-title')) {
    const data = SITE_CONTENT.health;
    if (data) {
        const container = document.getElementById('health-content-container');
      
        const owned = data.owned || [];
        const wishlist = data.wishlist || [];
      
        if (data.title) document.getElementById('health-title').textContent = data.title;
        if (data.subtitle) document.getElementById('health-subtitle').textContent = data.subtitle;
      
        if (owned.length === 0 && wishlist.length === 0) {
          container.innerHTML = `
            <div style="background: var(--card); border: 1px dashed var(--border); border-radius: 12px; padding: 48px 24px; text-align: center; margin: 36px 0;">
              <span style="font-size: 2.8rem; display: block; margin-bottom: 12px;">🩺</span>
              <h2 style="font-size: 1.4rem; margin-bottom: 8px; color: var(--gold);">Health & Gym Gadgets</h2>
              <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto 20px; line-height: 1.5;">This section is currently empty and will be updated soon with health tracking and gym gear.</p>
              <a href="index.html" class="inv-action-btn">← Back to Main Wishlist Hub</a>
            </div>`;
          return;
        }
      
        function renderCard(item, isWishlist) {
          const card = document.createElement('div');
          card.className = 'wishlist-item';
      
          let infoHTML = '';
          if (isWishlist) {
            infoHTML = `
              <a href="${item.url || '#'}" target="_blank" class="wishlist-item-title">${item.name}</a>
              <div style="display:flex; align-items:center; justify-content:space-between; margin-top:8px;">
                <span class="wishlist-item-price">${item.price || 'Wishlist'}</span>
                ${item.url ? `<a href="${item.url}" target="_blank" class="inv-action-btn">Gift This ↗</a>` : ''}
              </div>
              ${item.status ? `<div style="margin-top:6px; font-size:0.75rem; color:var(--text-muted);">${item.status}</div>` : ''}`;
          } else {
            infoHTML = `
              ${item.url ? `<a href="${item.url}" target="_blank" class="wishlist-item-title">${item.name}</a>` : `<div class="wishlist-item-title">${item.name}</div>`}
              <div style="display:flex; align-items:center; justify-content:space-between; margin-top:8px;">
                <span class="inv-item-badge">${item.badge || item.category || 'Biometrics'}</span>
                <span style="font-size: 0.76rem; color: var(--mint); font-weight: 600;">✓ Owned</span>
              </div>`;
          }
      
          card.innerHTML = `
            ${item.img ? `<div class="wishlist-item-img"><img src="${item.img}" alt="${item.name}" loading="lazy"></div>` : ''}
            <div class="wishlist-item-info">${infoHTML}</div>`;
          return card;
        }
      
        if (wishlist.length > 0) {
          const wSection = document.createElement('section');
          wSection.className = 'wishlist-section';
          wSection.innerHTML = `
            <div class="section-header">
              <h2>🎁 Health & Fitness Tech Wishlist</h2>
              <p>Precision health monitoring equipment and fitness tools.</p>
            </div>`;
          const wGrid = document.createElement('div');
          wGrid.className = 'item-list';
          wGrid.style.cssText = 'grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));';
          wishlist.forEach(item => wGrid.appendChild(renderCard(item, true)));
          wSection.appendChild(wGrid);
          container.appendChild(wSection);
        }
      
        if (owned.length > 0) {
          const ownedSection = document.createElement('section');
          ownedSection.className = 'wishlist-section';
          ownedSection.innerHTML = `
            <div class="section-header">
              <h2>✅ Owned Biometrics & Gym Tech</h2>
              <p>Biometric monitors and wearables currently in use.</p>
            </div>`;
          const ownedGrid = document.createElement('div');
          ownedGrid.className = 'item-list';
          ownedGrid.style.cssText = 'grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));';
          owned.forEach(item => ownedGrid.appendChild(renderCard(item, false)));
          ownedSection.appendChild(ownedGrid);
          container.appendChild(ownedSection);
        }
    }
  }

  // --- home.html ---
  if (document.getElementById('home-content-container')) {
    const homeData = SITE_CONTENT.home;
    if (homeData) {
      const container = document.getElementById('home-content-container');
      let html = '';

      function formatLights(lights) {
        if (!lights || Object.keys(lights).length === 0) return '';
        return Object.entries(lights)
          .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
          .join(', ');
      }

      // Render Whole House
      const hasHouseLights = homeData.lights && Object.keys(homeData.lights).length > 0;
      const hasHouseSwitches = homeData.switches && homeData.switches.length > 0;

      if (hasHouseLights || hasHouseSwitches || (homeData.inventory && homeData.inventory.length > 0)) {
        html += `
          <section class="wishlist-section">
            <div class="section-header">
              <h2>🏡 Whole House Infrastructure</h2>
              <p>Master controls and house-wide integrations.</p>
            </div>
            <div class="room-grid" style="grid-template-columns: 1fr;">
              <div class="room-card">
                <div class="room-header">
                  <div class="room-icon">💡</div>
                  <div class="room-title-group">
                    <h3>Smart Tech & Infrastructure</h3>
                  </div>
                </div>
                <div class="room-smart-tech" style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 12px;">
                  ${hasHouseLights ? `<div style="margin-bottom: 4px;"><strong>Lights:</strong> ${formatLights(homeData.lights)}</div>` : ''}
                  ${hasHouseSwitches ? `<div><strong>Switches:</strong> ${homeData.switches.join(', ')}</div>` : ''}
                </div>
              </div>
            </div>
          </section>
        `;
      }

      // Render Floors
      if (homeData.floors) {
        Object.values(homeData.floors).forEach(floor => {
          html += `
            <section class="wishlist-section">
              <div class="section-header">
                <h2>${floor.icon || '📌'} ${floor.name}</h2>
              </div>
              <div class="room-grid" style="grid-template-columns: 1fr;">
          `;

          if (floor.rooms) {
            Object.values(floor.rooms).forEach(room => {
              // Build Projects HTML
              let projectsHtml = '';
              if (room.projects && room.projects.length > 0) {
                let projectItems = room.projects.map(proj => {
                  let badgeClass = 'badge-planned';
                  let statusLabel = 'Planned';
                  if (proj.status === 'in-progress') {
                    badgeClass = 'badge-in-progress';
                    statusLabel = 'In Progress';
                  } else if (proj.status === 'completed') {
                    badgeClass = 'badge-done';
                    statusLabel = 'Completed';
                  }
                  return `
                    <li class="project-item">
                      <span>${proj.name}</span>
                      <span class="project-badge ${badgeClass}">${statusLabel}</span>
                    </li>
                  `;
                }).join('');
                projectsHtml = `
                  <div class="room-projects-container" style="margin-top: auto; padding-top: 16px;">
                    <strong class="room-projects-title">Active & Planned Projects:</strong>
                    <ul class="project-list">
                      ${projectItems}
                    </ul>
                  </div>
                `;
              }

              // Build Smart Tech HTML
              let smartTechHtml = '';
              const rLights = room.lights && Object.keys(room.lights).length > 0;
              const rSwitches = room.switches && room.switches.length > 0;
              if (rLights || rSwitches) {
                smartTechHtml = `
                  <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px; background: rgba(255,255,255,0.02); padding: 8px; border-radius: 6px; border: 1px solid var(--border);">
                    <div style="font-weight: bold; margin-bottom: 4px; color: var(--text);">💡 Smart Tech</div>
                    ${rLights ? `<div style="margin-bottom: 2px;"><strong>Lights:</strong> ${formatLights(room.lights)}</div>` : ''}
                    ${rSwitches ? `<div><strong>Switches:</strong> ${room.switches.join(', ')}</div>` : ''}
                  </div>
                `;
              }

              // Build Inventory HTML
              let inventoryHtml = '';
              if (room.inventory && room.inventory.length > 0) {
                inventoryHtml = `
                  <div style="margin-bottom: 12px;">
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.85rem; color: var(--text-muted);">
                      ${room.inventory.map(item => {
                        if (item.isHeader) {
                          return `
                            <li style="margin: 12px 0 6px 0; font-weight: 700; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 2px;">
                              ${item.name}
                            </li>
                          `;
                        }
                        return `
                          <li style="margin-bottom: 4px; display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
                            <span>${item.name}</span>
                            ${item.badge ? `<span style="font-size:0.65rem; padding:1px 5px; background:rgba(255,255,255,0.05); border:1px solid var(--border); border-radius:4px; white-space: nowrap; flex-shrink: 0;">${item.badge}</span>` : ''}
                          </li>
                        `;
                      }).join('')}
                    </ul>
                  </div>
                `;
              }

              html += `
                <div class="room-card">
                  <div class="room-header">
                    <div class="room-title-group">
                      <h3>${room.name}</h3>
                    </div>
                  </div>
                  ${smartTechHtml}
                  ${inventoryHtml}
                  ${projectsHtml}
                </div>
              `;
            });
          }

          html += `
              </div>
            </section>
          `;
        });
      }

      container.innerHTML = html;
    }
  }
  if (document.getElementById('lego-themes-container')) {
    const data = SITE_CONTENT.lego;
    if (data) {
      
        const themes = data.themes;
        if (data.title) document.getElementById('lego-title').textContent = data.title;
        document.getElementById('lego-subtitle').textContent =
          `${data.wishlist.length} Wishlist Sets · ${data.owned.length} Owned Sets`;
        document.getElementById('lego-wishlist-link').href = data.officialWishlistUrl;
      
        function renderCard(item, isWishlist) {
          const card = document.createElement('div');
          card.className = 'wishlist-item';
          card.style.cssText = 'border-radius: 8px; overflow: hidden; position: relative;';
      
          let infoHTML = '';
          if (isWishlist) {
            const statusBadge = item.status
              ? `<span style="font-size:0.65rem; color:var(--gold); display:block; margin-top:2px; font-weight:600;">${item.status}</span>`
              : '';
            infoHTML = `
              <span style="font-size:0.72rem; font-weight:800; color:var(--accent); display:block; letter-spacing:0.02em; margin-bottom:2px;">#${item.id}</span>
              <a href="${item.url}" target="_blank" class="wishlist-item-title" style="font-size:0.8rem; line-height:1.2; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${item.name}</a>
              ${statusBadge}
              <div style="display:flex; align-items:center; justify-content:space-between; margin-top:6px;">
                <span class="wishlist-item-price" style="font-size:0.78rem; font-weight:700;">${item.price || 'Wishlist'}</span>
                <a href="${item.url}" target="_blank" class="inv-action-btn" style="padding:3px 8px; font-size:0.72rem;">Gift ↗</a>
              </div>`;
          } else {
            infoHTML = `
              <span style="font-size:0.72rem; font-weight:800; color:var(--text-muted); display:block; letter-spacing:0.02em; margin-bottom:2px;">#${item.id}</span>
              <a href="${item.url}" target="_blank" class="wishlist-item-title" style="font-size:0.8rem; line-height:1.2; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${item.name}</a>
              <div style="display:flex; align-items:center; justify-content:space-between; margin-top:6px;">
                <span style="font-size:0.72rem; color:var(--mint); font-weight:600;">✓ Owned</span>
              </div>`;
          }
      
          card.innerHTML = `
            <div class="wishlist-item-img" style="height: 130px; background: #ffffff; padding: 6px; display: flex; align-items: center; justify-content: center;">
              <img src="${item.img}" alt="${item.name}" loading="lazy" style="object-fit: contain; width: 100%; height: 100%;">
            </div>
            <div class="wishlist-item-info" style="padding: 8px 10px;">${infoHTML}</div>`;
          return card;
        }
      
        const container = document.getElementById('lego-themes-container');
      
        for (const [themeKey, themeCfg] of Object.entries(themes)) {
          const wishlistItems = data.wishlist
            .filter(i => i.theme === themeKey)
            .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
          const ownedItems = data.owned
            .filter(i => i.theme === themeKey)
            .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
      
          if (wishlistItems.length === 0 && ownedItems.length === 0) continue;
      
          const section = document.createElement('section');
          section.className = 'wishlist-section';
      
          // Theme Header
          const sectionHeader = document.createElement('div');
          sectionHeader.className = 'section-header';
          sectionHeader.style.borderBottom = `2px solid ${themeCfg.color}`;
          sectionHeader.style.paddingBottom = '8px';
          sectionHeader.innerHTML = `
            <h2 style="color:${themeCfg.color}; font-size:1.3rem;">${themeCfg.label}</h2>
            <p style="margin:2px 0 0; font-size:0.85rem; color:var(--text-muted);">${wishlistItems.length} Wanted Sets &middot; ${ownedItems.length} Registered Owned Sets</p>
          `;
          section.appendChild(sectionHeader);
      
          // 1. Wishlist Sets first under Theme
          if (wishlistItems.length > 0) {
            const wSub = document.createElement('h3');
            wSub.textContent = `🎁 Wanted / Wishlist Sets (${wishlistItems.length})`;
            wSub.style.cssText = 'font-size:0.95rem; color:var(--gold); margin:16px 0 8px; font-weight:700;';
            section.appendChild(wSub);
      
            const wGrid = document.createElement('div');
            wGrid.className = 'item-list';
            wGrid.style.cssText = 'grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin-top: 8px;';
            for (const item of wishlistItems) {
              wGrid.appendChild(renderCard(item, true));
            }
            section.appendChild(wGrid);
          }
      
          // 2. Owned Sets second under Theme
          if (ownedItems.length > 0) {
            const oSub = document.createElement('h3');
            oSub.textContent = `✅ Owned Sets (${ownedItems.length})`;
            oSub.style.cssText = 'font-size:0.95rem; color:var(--mint); margin:20px 0 8px; font-weight:700;';
            section.appendChild(oSub);
      
            const oGrid = document.createElement('div');
            oGrid.className = 'item-list';
            oGrid.style.cssText = 'grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin-top: 8px;';
            for (const item of ownedItems) {
              oGrid.appendChild(renderCard(item, false));
            }
            section.appendChild(oGrid);
          }
      
          container.appendChild(section);
        }
    }
  }

  // --- misc.html ---
  if (document.getElementById('misc-title')) {
    const data = SITE_CONTENT.misc;
    if (data) {
      
        if (data.title) document.getElementById('misc-title').textContent = data.title;
        if (data.subtitle) document.getElementById('misc-subtitle').textContent = data.subtitle;
      
        // Render Tech Merch
        const techGrid = document.getElementById('tech-merch-grid');
        if (techGrid && data.techMerch) {
          techGrid.innerHTML = data.techMerch.map(item => `
            <a href="${item.url}" target="_blank" class="horizontal-card">
              <img src="${item.icon}" alt="${item.name} Logo">
              <span>${item.name}</span>
            </a>
          `).join('');
        }
      
        // Render Household
        const householdGrid = document.getElementById('household-grid');
        if (householdGrid && data.householdBrands) {
          householdGrid.innerHTML = data.householdBrands.map(item => `
            <a href="${item.url}" target="_blank" class="horizontal-card">
              <img src="${item.icon}" alt="${item.name} Logo">
              <span>${item.name}</span>
            </a>
          `).join('');
        }
      
        // Render Subscriptions grouped by category
        const subsContainer = document.getElementById('subscriptions-list-group');
        if (subsContainer && data.subscriptions) {
          const categories = {};
          data.subscriptions.forEach(item => {
            const cat = item.category || 'Other';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(item);
          });
      
          subsContainer.innerHTML = Object.entries(categories).map(([categoryName, items]) => `
            <h3>${categoryName}</h3>
            <div class="clean-list">
              ${items.map(item => `<li><a href="${item.url}" target="_blank">${item.name}</a></li>`).join('')}
            </div>
          `).join('');
        }
    }
  }

  // --- videogames.html ---
  if (document.getElementById('vg-owned-section')) {
    const data = SITE_CONTENT.videogames;
    if (data) {
      
        const platforms = data.platforms || data.consoles || {};
        document.getElementById('vg-subtitle').textContent = `${data.owned.length} Registered Games & Titles`;
      
        function groupByPlatform(items) {
          const groups = {};
          for (const item of items) {
            const key = item.platform || item.console || 'other';
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
          }
          return groups;
        }
      
        function getPlatformEmoji(platformKey) {
          const map = {
            switch: '🔴',
            pc: '💻',
            steam: '💨',
            battlenet: '❄️',
            gamecube: '🟣',
            n64: '🕹️',
            '3ds': '🔵',
            ds: '🔷',
            gba: '🟢',
            gbc: '🟨',
            gb: '🟩',
            snes: '🎮',
            nes: '👾',
            ds_3ds: '🔵',
            gb_gbc: '🟢',
            retro_gb: '🟢',
            wii_wiiu: '🌊',
            amiibo: '🗿',
            zelda: '⚔️',
            mario: '🍄',
            pokemon: '🔴',
            nintendo_flagship: '🌟',
            rpg: '🗡️',
            indie_masterpieces: '💎',
            collection: '🎮'
          };
          return map[platformKey] || '🎮';
        }
      
        function renderCard(item) {
          const card = document.createElement('div');
          card.className = 'wishlist-item';
      
          const isValidImg = item.img && !item.img.includes('unavatar.io') && item.img.startsWith('http');
          const platformKey = item.platform || item.console;
          const url = item.url || item.igdb_url;
      
          const imgHtml = isValidImg
            ? `<div class="wishlist-item-img"><img src="${item.img}" alt="${item.name}" loading="lazy"></div>`
            : `<div class="wishlist-item-img placeholder-card" style="background: linear-gradient(135deg, rgba(40, 20, 36, 0.9), rgba(15, 8, 14, 0.95)); border: 1px solid var(--border-strong); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px 14px; text-align: center; gap: 8px;">
                 <span style="font-size: 2.2rem; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));">${getPlatformEmoji(platformKey)}</span>
                 <span style="font-size: 0.85rem; font-weight: 800; color: var(--gold); line-height: 1.2; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${item.name}</span>
               </div>`;

          const imgWrapped = url
            ? `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:block; text-decoration:none;">${imgHtml}</a>`
            : imgHtml;

          const titleHtml = url
            ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="wishlist-item-title" style="color:inherit; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                 <span>${item.name}</span>
               </a>`
            : `<div class="wishlist-item-title">${item.name}</div>`;
      
          card.innerHTML = `
            ${imgWrapped}
            <div class="wishlist-item-info">
              ${titleHtml}
              <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-top:6px; flex-wrap:wrap;">
                ${url ? `<a href="${url}" target="_blank" rel="noopener noreferrer" style="font-size:0.72rem; color:var(--accent); text-decoration:underline; font-weight:600;">IGDB ↗</a>` : ''}
                <span style="font-size:0.76rem; color:var(--mint); font-weight:600;">✓ In Collection</span>
              </div>
            </div>`;
          return card;
        }
      
        function renderPlatformsSection(containerId, items) {
          const container = document.getElementById(containerId);
          if (!container) return;
      
          const groups = groupByPlatform(items);
      
          const header = document.createElement('div');
          header.className = 'section-header';
          header.innerHTML = `<h2>🎮 Video Game Collection (${items.length} Games)</h2><p>Grouped by gaming platforms (Nintendo, Steam, Battle.net).</p>`;
          container.appendChild(header);
      
          const platformOrder = Object.keys(platforms);
          for (const key of Object.keys(groups)) {
            if (!platformOrder.includes(key)) platformOrder.push(key);
          }
      
          for (const platformKey of platformOrder) {
            const platformItems = groups[platformKey];
            if (!platformItems || platformItems.length === 0) continue;
      
            const cfg = platforms[platformKey] || { label: platformKey, color: 'var(--accent)' };
      
            const h3 = document.createElement('h3');
            h3.textContent = `${cfg.label} (${platformItems.length})`;
            h3.style.cssText = `color:${cfg.color}; margin:24px 0 12px; font-size:1.1rem; border-bottom:1px solid ${cfg.color}33; padding-bottom:8px;`;
            container.appendChild(h3);
      
            const grid = document.createElement('div');
            grid.className = 'item-list';
            for (const item of platformItems) {
              grid.appendChild(renderCard(item));
            }
            container.appendChild(grid);
          }
        }
      
        renderPlatformsSection('vg-owned-section', data.owned);
    }
  }

  // --- zelda.html ---
  if (document.getElementById('zelda-title')) {
    const data = SITE_CONTENT.zelda;
    if (data) {
        const container = document.getElementById('zelda-content-container');
      
        const owned = data.owned || [];
        const wishlist = data.wishlist || [];
      
        if (owned.length === 0 && wishlist.length === 0) {
          container.innerHTML = `
            <div style="background: var(--card); border: 1px dashed var(--border); border-radius: 12px; padding: 48px 24px; text-align: center; margin: 36px 0;">
              <span style="font-size: 2.8rem; display: block; margin-bottom: 12px;">🗡️🛡️</span>
              <h2 style="font-size: 1.4rem; margin-bottom: 8px; color: var(--gold);">Zelda Shrine Collection</h2>
              <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto 20px; line-height: 1.5;">This collection is currently empty and will be updated soon with Alec's Zelda games, lore books, and wanted collector items.</p>
              <a href="index.html" class="inv-action-btn">← Back to Main Wishlist Hub</a>
            </div>`;
          return;
        }
      
        function renderCard(item, isWishlist) {
          const card = document.createElement('div');
          card.className = 'wishlist-item';
          
          let infoHTML = '';
          if (isWishlist) {
            infoHTML = `
              <a href="${item.url || '#'}" target="_blank" class="wishlist-item-title">${item.name}</a>
              <div style="display:flex; align-items:center; justify-content:space-between; margin-top:8px;">
                <span class="wishlist-item-price">${item.price || 'Wishlist'}</span>
                ${item.url ? `<a href="${item.url}" target="_blank" class="inv-action-btn">Gift This ↗</a>` : ''}
              </div>`;
          } else {
            infoHTML = `
              <div class="wishlist-item-title">${item.name}</div>
              <div style="display:flex; align-items:center; justify-content:space-between; margin-top:8px;">
                <span class="inv-item-badge">${item.type || 'Zelda Relic'}</span>
                <span style="font-size: 0.76rem; color: var(--mint); font-weight: 600;">✓ Owned</span>
              </div>`;
          }
      
          card.innerHTML = `
            ${item.img ? `<div class="wishlist-item-img"><img src="${item.img}" alt="${item.name}" loading="lazy"></div>` : ''}
            <div class="wishlist-item-info">${infoHTML}</div>`;
          return card;
        }
      
        let html = '';
      
        if (owned.length > 0) {
          const ownedSection = document.createElement('section');
          ownedSection.className = 'wishlist-section';
          ownedSection.innerHTML = `
            <div class="section-header">
              <h2>✅ Owned Zelda Relics & Games</h2>
              <p>Physical games, music, and cookbooks in my collection.</p>
            </div>`;
          const ownedGrid = document.createElement('div');
          ownedGrid.className = 'item-list';
          owned.forEach(item => ownedGrid.appendChild(renderCard(item, false)));
          ownedSection.appendChild(ownedGrid);
          container.appendChild(ownedSection);
        }
      
        if (wishlist.length > 0) {
          const wSection = document.createElement('section');
          wSection.className = 'wishlist-section';
          wSection.innerHTML = `
            <div class="section-header">
              <h2>🎁 Wanted / Wishlist Items</h2>
              <p>Zelda collector's items and wanted games.</p>
            </div>`;
          const wGrid = document.createElement('div');
          wGrid.className = 'item-list';
          wishlist.forEach(item => wGrid.appendChild(renderCard(item, true)));
          wSection.appendChild(wGrid);
          container.appendChild(wSection);
        }
    }
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('inventory-app');
  if (!container || !window.INVENTORY_DATA) return;

  const data = window.INVENTORY_DATA;
  let activeCategory = 'all';
  let searchQuery = '';

  // Render Skeleton HTML Structure inside #inventory-app
  container.innerHTML = `
    <div class="inventory-controls">
      <div class="inventory-tabs" id="inventory-tabs"></div>
      <div class="inventory-search-wrap">
        <input 
          type="text" 
          id="inventory-search" 
          class="inventory-search-input" 
          placeholder="🔍 Search books, LEGO, games, vinyl..." 
          aria-label="Search Inventory"
        />
      </div>
    </div>
    <div id="inventory-grid" class="inventory-grid"></div>
  `;

  const tabsContainer = document.getElementById('inventory-tabs');
  const gridContainer = document.getElementById('inventory-grid');
  const searchInput = document.getElementById('inventory-search');

  // Build Tab Buttons
  function renderTabs() {
    let tabsHTML = `
      <button class="inv-tab ${activeCategory === 'all' ? 'active' : ''}" data-cat="all">
        ✨ All Items
      </button>
    `;

    data.categories.forEach(cat => {
      tabsHTML += `
        <button class="inv-tab ${activeCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}">
          ${cat.icon} ${cat.name}
        </button>
      `;
    });

    tabsContainer.innerHTML = tabsHTML;

    tabsContainer.querySelectorAll('.inv-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-cat');
        renderTabs();
        renderGrid();
      });
    });
  }

  // Render Grid Content
  function renderGrid() {
    let html = '';

    const categoriesToRender = activeCategory === 'all' 
      ? data.categories 
      : data.categories.filter(c => c.id === activeCategory);

    let totalItemsMatched = 0;

    categoriesToRender.forEach(cat => {
      // Filter items by search query
      const filteredItems = cat.items.filter(item => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(q);
        const subMatch = (item.subtitle || '').toLowerCase().includes(q);
        const notesMatch = (item.notes || '').toLowerCase().includes(q);
        const alreadyMatch = (item.already || []).some(a => a.name.toLowerCase().includes(q));
        const wantedMatch = (item.wanted || []).some(w => w.name.toLowerCase().includes(q));
        return titleMatch || subMatch || notesMatch || alreadyMatch || wantedMatch;
      });

      if (filteredItems.length === 0) return;

      totalItemsMatched += filteredItems.length;

      html += `
        <div class="inventory-category-block">
          <div class="inv-cat-header">
            <h3>${cat.icon} ${cat.name}</h3>
            <p>${cat.description}</p>
          </div>
          
          <div class="inv-cards-wrapper">
      `;

      filteredItems.forEach(item => {
        const alreadyCount = (item.already || []).length;
        const wantedCount = (item.wanted || []).length;
        const totalCount = alreadyCount + wantedCount;
        const progressPct = totalCount > 0 ? Math.round((alreadyCount / totalCount) * 100) : 100;

        html += `
          <div class="inv-shelf-card">
            <div class="inv-card-header">
              <div class="inv-title-group">
                <span class="inv-card-icon">${cat.icon}</span>
                <div>
                  <h4 class="inv-card-title">${escapeHTML(item.title)}</h4>
                  ${item.subtitle ? `<span class="inv-card-sub">${escapeHTML(item.subtitle)}</span>` : ''}
                </div>
              </div>
              <div class="inv-progress-badge" title="${alreadyCount} of ${totalCount} items collected">
                <span class="inv-progress-bar" style="width: ${progressPct}%"></span>
                <span class="inv-progress-text">${progressPct}% Collected</span>
              </div>
            </div>

            ${item.notes ? `<p class="inv-card-notes">${escapeHTML(item.notes)}</p>` : ''}

            <div class="inv-card-body">
              <!-- Already Owned Column -->
              <div class="inv-col inv-col-owned">
                <div class="inv-col-title">
                  <span class="inv-dot inv-dot-owned"></span>
                  <span>Already Have (${alreadyCount})</span>
                </div>
                <ul class="inv-list">
                  ${(item.already || []).map(owned => `
                    <li class="inv-list-item inv-owned-item">
                      <span class="inv-check-icon">✓</span>
                      <span class="inv-item-name">${escapeHTML(owned.name)}</span>
                      ${owned.badge ? `<span class="inv-item-badge">${escapeHTML(owned.badge)}</span>` : ''}
                    </li>
                  `).join('')}
                </ul>
              </div>

              <!-- Wanted Column -->
              <div class="inv-col inv-col-wanted">
                <div class="inv-col-title">
                  <span class="inv-dot inv-dot-wanted"></span>
                  <span>Help Complete Collection (${wantedCount})</span>
                </div>
                ${wantedCount > 0 ? `
                  <ul class="inv-list">
                    ${(item.wanted || []).map(w => `
                      <li class="inv-list-item inv-wanted-item">
                        <div class="inv-wanted-info">
                          <span class="inv-gift-icon">🎁</span>
                          <span class="inv-item-name">${escapeHTML(w.name)}</span>
                          ${w.note ? `<span class="inv-item-subnote">${escapeHTML(w.note)}</span>` : ''}
                        </div>
                        ${w.link ? `
                          <a href="${escapeHTML(w.link)}" target="_blank" rel="noopener" class="inv-action-btn">
                            Gift This ↗
                          </a>
                        ` : ''}
                      </li>
                    `).join('')}
                  </ul>
                ` : `
                  <div class="inv-complete-banner">🎉 Collection Complete!</div>
                `}
              </div>
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    if (totalItemsMatched === 0) {
      html = `
        <div class="inv-empty-state">
          <p>No inventory items match your search for "<strong>${escapeHTML(searchQuery)}</strong>".</p>
        </div>
      `;
    }

    gridContainer.innerHTML = html;
  }

  // Helper escapeHTML
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Search input handler
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderGrid();
  });

  // Init
  renderTabs();
  renderGrid();
});
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
    }



    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderNav);
    } else {
        renderNav();
    }
})();
