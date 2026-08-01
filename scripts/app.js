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
    const data = SITE_CONTENT.home;
    if (data) {
          if (!homeData) return;
      
          const container = document.getElementById('home-content-container');
          if (!container) return;
      
          function formatLights(lights) {
            if (!lights || Object.keys(lights).length === 0) return '';
            return Object.entries(lights)
              .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
              .join(', ');
          }
      
          // Render Whole House Row at the very top
          let wholeHouseHTML = '';
          const hasHouseLights = homeData.lights && Object.keys(homeData.lights).length > 0;
          const hasHouseSwitches = homeData.switches && homeData.switches.length > 0;
          
          let houseSmartTechHTML = '';
          if (hasHouseLights || hasHouseSwitches) {
            houseSmartTechHTML = `
              <div class="room-smart-tech">
                <div class="smart-tech-header">
                  <span>💡 Whole-House Infrastructure</span>
                </div>
                <div class="smart-tech-detail">
                  ${hasHouseLights ? `<div><strong>Total Lights:</strong> ${formatLights(homeData.lights)}</div>` : ''}
                  ${hasHouseSwitches ? `<div><strong>Switches:</strong> ${homeData.switches.join(', ')}</div>` : ''}
                </div>
              </div>
            `;
          }
      
          let houseInventoryHTML = '';
          if (homeData.inventory && homeData.inventory.length > 0) {
            houseInventoryHTML = `
              <div style="margin-top: 12px; border-top: 1px dashed var(--border); padding-top: 10px;">
                <strong style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">House Inventory:</strong>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 0.84rem; color: var(--text-muted);">
                  ${homeData.inventory.map(item => {
                    if (item.isHeader) {
                      return `
                        <li style="margin: 12px 0 6px 0; list-style: none; margin-left: -20px; font-weight: 700; font-size: 0.8rem; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 2px;">
                          ${item.name}
                        </li>
                      `;
                    }
                    return `
                      <li style="margin-bottom: 4px;">
                        <span>${item.name}</span>
                        ${item.badge ? `<span class="inv-item-badge" style="margin-left:6px; font-size:0.68rem; padding:1px 5px; background:rgba(255,255,255,0.05); border:1px solid var(--border); border-radius:4px;">${item.badge}</span>` : ''}
                      </li>
                    `;
                  }).join('')}
                </ul>
              </div>
            `;
          }
      
          let houseProjectsHTML = '';
          if (homeData.projects && homeData.projects.length > 0) {
            houseProjectsHTML = `
              <strong style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">Whole House Projects:</strong>
              <ul class="project-list" style="margin-top: 8px;">
                ${homeData.projects.map(proj => {
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
                }).join('')}
              </ul>
            `;
          }
      
          wholeHouseHTML = `
            <section class="floor-section" style="border-bottom: 2px solid var(--border-strong); padding-bottom: 24px;">
              <div class="floor-title">
                <span class="floor-icon">🏡</span>
                <h2>Whole House</h2>
              </div>
              <div class="room-card" style="border: 1px solid var(--border-strong);">
                <div class="room-info-side">
                  <div class="room-header" style="margin-bottom: 4px;">
                    <div class="room-title-group">
                      <h3 style="font-size: 1.2rem; margin: 0; color: var(--text); font-weight: 700;">Home & Infrastructure</h3>
                    </div>
                  </div>
                  ${houseSmartTechHTML}
                  ${houseInventoryHTML}
                </div>
                ${houseProjectsHTML ? `
                  <div class="room-projects-side">
                    ${houseProjectsHTML}
                  </div>
                ` : ''}
              </div>
            </section>
          `;
      
          let html = wholeHouseHTML;
          
          if (homeData.floors) {
            Object.entries(homeData.floors).forEach(([key, floor]) => {
              let roomsHTML = '';
              
              if (floor.rooms) {
                Object.entries(floor.rooms).forEach(([roomKey, room]) => {
                  // Render Projects List
                  let projectsHTML = '';
                  if (room.projects && room.projects.length > 0) {
                    projectsHTML = `
                      <strong style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">Active & Planned Projects:</strong>
                      <ul class="project-list" style="margin-top: 8px;">
                        ${room.projects.map(proj => {
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
                        }).join('')}
                      </ul>
                    `;
                  }
      
                  // Render Smart Tech Details
                  let smartTechHTML = '';
                  const hasLights = room.lights && Object.keys(room.lights).length > 0;
                  const hasSwitches = room.switches && room.switches.length > 0;
      
                  if (hasLights || hasSwitches) {
                    smartTechHTML = `
                      <div class="room-smart-tech">
                        <div class="smart-tech-header">
                          <span>💡 Smart Lighting</span>
                        </div>
                        <div class="smart-tech-detail">
                          ${hasLights ? `<div><strong>Lights:</strong> ${formatLights(room.lights)}</div>` : ''}
                          ${hasSwitches ? `<div><strong>Switches:</strong> ${room.switches.join(', ')}</div>` : ''}
                        </div>
                      </div>
                    `;
                  }
      
                  // Render Room Inventory List
                  let inventoryHTML = '';
                  if (room.inventory && room.inventory.length > 0) {
                    inventoryHTML = `
                      <div style="margin-top: 12px; border-top: 1px dashed var(--border); padding-top: 10px;">
                        <strong style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">Room Inventory:</strong>
                        <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 0.84rem; color: var(--text-muted);">
                          ${room.inventory.map(item => {
                            if (item.isHeader) {
                              return `
                                <li style="margin: 12px 0 6px 0; list-style: none; margin-left: -20px; font-weight: 700; font-size: 0.8rem; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 2px;">
                                  ${item.name}
                                </li>
                              `;
                            }
                            return `
                              <li style="margin-bottom: 4px;">
                                <span>${item.name}</span>
                                ${item.badge ? `<span class="inv-item-badge" style="margin-left:6px; font-size:0.68rem; padding:1px 5px; background:rgba(255,255,255,0.05); border:1px solid var(--border); border-radius:4px;">${item.badge}</span>` : ''}
                              </li>
                            `;
                          }).join('')}
                        </ul>
                      </div>
                    `;
                  }
      
                  roomsHTML += `
                    <div class="room-card">
                      <div class="room-info-side">
                        <div class="room-header" style="margin-bottom: 4px;">
                          <div class="room-title-group">
                            <h3 style="font-size: 1.15rem; margin: 0; color: var(--text); font-weight: 700;">${room.name}</h3>
                          </div>
                        </div>
                        ${smartTechHTML}
                        ${inventoryHTML}
                      </div>
                      ${projectsHTML ? `
                        <div class="room-projects-side">
                          ${projectsHTML}
                        </div>
                      ` : ''}
                    </div>
                  `;
                });
              }
      
              html += `
                <section class="floor-section">
                  <div class="floor-title">
                    <span class="floor-icon">${floor.icon}</span>
                    <h2>${floor.name}</h2>
                  </div>
                  <div class="room-layout-grid">
                    ${roomsHTML}
                  </div>
                </section>
              `;
            });
          }
      
          container.innerHTML = html;
    }
  }

  // --- lego.html ---
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
