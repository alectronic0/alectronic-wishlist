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
