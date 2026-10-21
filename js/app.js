document.addEventListener('DOMContentLoaded', () => {
  const headerHTML = `
    <div class="site-strip">This list is still being organised. Last updated <span class="header-date"></span>.</div>
    <header class="site-nav"></header>
  `;
  const footerHTML = `
    <footer id="footer" class="site-footer">
      <p>&copy; <span class="year">${new Date().getFullYear()}</span> Alec, gift.alec.today. All rights reserved.</p>
      <p>Powered by <a href="https://alec.today/" target="_blank" rel="noopener">Alec Doran-Twyford (Alectronic&trade;)</a></p>
    </footer>
  `;
  // The deployed index.html is prerendered with this layout already baked in
  if (document.querySelector('header.site-nav')) {
    return;
  }
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

  // --- shared catalogue (index, lego, zelda, videogames, boardgames, books, junk, health, grooming, consumables) ---
  const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => HTML_ESCAPES[char]);
  }

  // Data titles carry emoji from the old design; headings and chips are plain text now
  function plainLabel(text) {
    return String(text || '').replace(/\p{Extended_Pictographic}|️|‍/gu, '').replace(/\s+/g, ' ').trim();
  }

  function isPrice(text) {
    return /^~?£/.test(text || '');
  }

  // Card data is scraped from other sites: only plain web addresses may become links or pictures
  function webUrl(url) {
    return /^https?:\/\//i.test(url || '') ? url : '';
  }

  function externalLink(href, label, className) {
    return `<a class="${className}" href="${escapeHtml(webUrl(href))}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
  }

  function formatDatePill(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    }
    return dateStr;
  }

  function itemCard(item) {
    const img = webUrl(item.img);
    const url = webUrl(item.url);
    const picture = img
      ? `<img src="${escapeHtml(img)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
      : '<span class="item-card__blank">No picture yet</span>';
    const mediaClass = `item-card__media${item.cover ? ' item-card__media--cover' : ''}${img ? '' : ' item-card__media--blank'}`;
    const media = url
      ? `<a class="${mediaClass}" href="${escapeHtml(url)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">${picture}</a>`
      : `<div class="${mediaClass}">${picture}</div>`;
    const title = url ? externalLink(url, item.name, 'item-card__link') : escapeHtml(item.name);

    const dateTag = item.orderDate
      ? `<span class="tag tag--date" title="Order date: ${escapeHtml(item.orderDate)}">Ordered ${escapeHtml(formatDatePill(item.orderDate))}</span>`
      : (item.dateAdded ? `<span class="tag tag--date" title="Added on: ${escapeHtml(item.dateAdded)}">Added ${escapeHtml(formatDatePill(item.dateAdded))}</span>` : '');

    const verifiedTag = item.validated
      ? `<span class="tag tag--verified" title="Digitally verified via automated order/collection">✓ Verified</span>`
      : '';

    const footer = [
      item.price ? `<span class="item-card__price">${escapeHtml(item.price)}</span>` : '',
      item.status ? `<span class="tag">${escapeHtml(item.status)}</span>` : '',
      item.owned ? '<span class="tag tag--owned">Owned</span>' : '',
      item.toneLabel ? `<span class="tag tag--${item.tone}">${escapeHtml(item.toneLabel)}</span>` : '',
      ...(item.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`),
      dateTag,
      verifiedTag
    ].join('');
    const toneClass = item.tone ? ` item-card--${item.tone}` : '';
    return `
      <article class="item-card${toneClass}" title="${escapeHtml(item.name)}">
        ${media}
        <h3 class="item-card__title">${title}</h3>
        ${item.meta ? `<p class="item-card__meta">${escapeHtml(item.meta)}</p>` : ''}
        <div class="item-card__footer">${footer}</div>
        ${item.extraHtml || ''}
      </article>`;
  }

  /**
   * One list page: heading, everything/wanted/owned tabs, group chips and card grids.
   * config: { title, lede, links[{label, href}], introHtml, note, noteLinks[], groups[{key, label}], sectioned, wanted[], owned[] }
   * Optional: banner (text shown above everything); item.tone ('green' | 'amber' | 'red') + item.toneLabel colour a card.
   * filters[{key, label}] turns the chips into a filter on item.filter, leaving item.group for the
   * sections; item.subgroups[] splits a section further, one heading level each (books: type → author → series),
   * with item.subgroupNotes[] (trusted HTML) shown under that level's heading.
   * toneTabs[{key, label}] adds a second row of tabs that filters on item.tone.
   */
  function renderCatalogue(root, config) {
    const VIEWS = [
      { key: 'wanted', label: 'Wanted' },
      { key: 'owned', label: 'Already owned' }
    ].filter(view => config[view.key].length > 0);
    const state = { tab: 'all', group: 'all', tone: 'all' };

    const chipKey = item => (config.filters ? item.filter : item.group);

    function listHtml(items, groups, headingTag) {
      if (items.length === 0) {
        return '<p class="catalogue__empty">Nothing here for this filter.</p>';
      }
      const grid = cards => `<div class="item-grid">${cards.map(itemCard).join('')}</div>`;
      const levelsOf = card => card.subgroups || (card.subgroup ? [card.subgroup] : []);
      const subgrouped = (cards, level = 0) => {
        const keys = [...new Set(cards.map(card => levelsOf(card)[level] || ''))];
        if (keys.length === 1 && !keys[0]) {
          return grid(cards);
        }
        const tag = `h${Math.min(6, Number(headingTag.slice(1)) + 1 + level)}`;
        const blocks = keys.map(key => {
          const inSub = cards.filter(card => (levelsOf(card)[level] || '') === key);
          const body = subgrouped(inSub, level + 1);
          const note = (inSub[0].subgroupNotes || [])[level];
          const noteHtml = note ? `<p class="catalogue__subnote">${note}</p>` : '';
          return key ? `<div class="catalogue__subgroup catalogue__subgroup--${level}"><${tag}>${escapeHtml(key)} <span class="count">${inSub.length}</span></${tag}>${noteHtml}${body}</div>` : `<div class="catalogue__subgroup">${body}</div>`;
        }).join('');
        // Small blocks (an author with one book) sit side by side instead of taking a row each
        return `<div class="catalogue__subgroups">${blocks}</div>`;
      };
      const inGroups = groups.filter(group => items.some(item => item.group === group.key));
      const filteredToOne = state.group !== 'all' && !config.filters;
      if (!config.sectioned || filteredToOne || inGroups.length < 2) {
        return subgrouped(items);
      }
      return inGroups.map(group => {
        const inGroup = items.filter(item => item.group === group.key);
        return `<section class="catalogue__group"><${headingTag}>${escapeHtml(group.label)} <span class="count">${inGroup.length}</span></${headingTag}>${subgrouped(inGroup)}</section>`;
      }).join('');
    }

    function draw() {
      const shown = VIEWS.filter(view => state.tab === 'all' || state.tab === view.key);
      const everything = shown.flatMap(view => config[view.key]);
      const groups = (config.groups || []).filter(group => everything.some(item => item.group === group.key));
      const chips = (config.filters || groups).filter(chip => everything.some(item => chipKey(item) === chip.key));
      if (!chips.some(chip => chip.key === state.group)) {
        state.group = 'all';
      }
      const toneTabs = (config.toneTabs || []).filter(entry => everything.some(item => item.tone === entry.key));
      if (!toneTabs.some(entry => entry.key === state.tone)) {
        state.tone = 'all';
      }
      const inTone = item => state.tone === 'all' || item.tone === state.tone;
      const filtered = view => config[view.key].filter(item => (state.group === 'all' || chipKey(item) === state.group) && inTone(item));
      const toneTab = (key, label, count) => `<button type="button" data-tone="${key}" aria-pressed="${state.tone === key}">${escapeHtml(label)} ${count}</button>`;
      const tab = (key, label, count) => `<button type="button" data-tab="${key}" aria-pressed="${state.tab === key}">${label} ${count}</button>`;
      const chip = (key, label) => `<button type="button" data-group="${escapeHtml(key)}" aria-pressed="${state.group === key}">${escapeHtml(label)}</button>`;
      // With both lists on the page each gets its own heading; a single list needs none
      const lists = shown.length > 1
        ? shown.map(view => `<section class="catalogue__section"><h2>${view.label} <span class="count">${filtered(view).length}</span></h2>${listHtml(filtered(view), groups, 'h3')}</section>`).join('')
        : shown.map(view => listHtml(filtered(view), groups, 'h2')).join('');

      root.innerHTML = `
        ${config.banner ? `<div class="catalogue__banner" role="status">${escapeHtml(config.banner)}</div>` : ''}
        <div class="catalogue__head">
          <div>
            <h1>${escapeHtml(config.title)}</h1>
            <p class="lede">${escapeHtml(config.lede)}</p>
          </div>
          <div class="catalogue__links">${(config.links || []).filter(link => link.href).map(link => externalLink(link.href, link.label, 'button button--quiet')).join('')}</div>
        </div>
        ${config.introHtml || ''}
        ${config.note ? `<div class="catalogue__note"><p>${escapeHtml(config.note)}</p><p class="catalogue__links">${(config.noteLinks || []).map(link => externalLink(link.href, link.label, 'button')).join('')}</p></div>` : ''}
        ${VIEWS.length > 1 ? `<div class="tabs" role="group" aria-label="Show">${tab('all', 'Everything', VIEWS.reduce((sum, view) => sum + config[view.key].length, 0))}${VIEWS.map(view => tab(view.key, view.label, config[view.key].length)).join('')}</div>` : ''}
        ${toneTabs.length > 1 ? `<div class="tabs" role="group" aria-label="Ownership">${toneTab('all', 'All', everything.length)}${toneTabs.map(entry => toneTab(entry.key, entry.label, everything.filter(item => item.tone === entry.key).length)).join('')}</div>` : ''}
        ${chips.length > 1 ? `<div class="chips" role="group" aria-label="Filter">${chip('all', 'All')}${chips.map(entry => chip(entry.key, entry.label)).join('')}</div>` : ''}
        ${lists}`;
    }

    root.addEventListener('click', event => {
      const button = event.target.closest('button[data-tab], button[data-group], button[data-tone]');
      if (!button) {
        return;
      }
      if (button.dataset.tab) {
        state.tab = button.dataset.tab;
      }
      if (button.dataset.group) {
        state.group = button.dataset.group;
      }
      if (button.dataset.tone) {
        state.tone = button.dataset.tone;
      }
      draw();
    });
    draw();
  }

  function legoCatalogue(data) {
    const card = (set, owned) => ({
      name: set.name,
      img: set.img,
      url: set.url,
      meta: /^\d+$/.test(String(set.id)) ? `Set ${set.id}` : '',
      price: owned ? '' : set.price,
      status: owned ? '' : set.status,
      owned,
      orderDate: set.orderDate || set.added || '',
      dateAdded: set.dateAdded || '',
      validated: set.validated || (owned && Boolean(set.orderDate || set.added)),
      group: set.theme
    });
    return {
      title: 'LEGO',
      lede: 'Sets Alec would love, and the ones already built.',
      links: (data.wishlistUrls || []).map((href, index) => ({ label: `Open list ${index + 1} on LEGO.com`, href })),
      groups: Object.entries(data.themes).map(([key, theme]) => ({ key, label: plainLabel(theme.label) })),
      sectioned: true,
      wanted: data.wishlist.map(set => card(set, false)),
      owned: data.owned.map(set => card(set, true))
    };
  }

  function zeldaCatalogue(data) {
    return {
      title: 'Zelda',
      lede: 'Collector pieces for the shelf, plus what is already on it.',
      wanted: data.wishlist.map(item => ({
        name: item.name,
        img: item.img,
        url: item.url,
        price: isPrice(item.price) ? item.price : '',
        status: isPrice(item.price) ? '' : item.price,
        orderDate: item.orderDate || '',
        dateAdded: item.dateAdded || '',
        validated: item.validated || false
      })),
      owned: data.owned.map(item => ({
        name: item.name,
        img: item.img,
        url: item.url,
        meta: item.type,
        owned: true,
        orderDate: item.orderDate || '',
        validated: item.validated || false
      }))
    };
  }

  function gamesCatalogue(data) {
    const card = (game, owned) => ({
      name: game.name,
      img: game.img,
      url: game.url,
      meta: game.badge,
      owned,
      group: game.platform,
      cover: true
    });
    return {
      title: 'Video games',
      lede: 'Games on the wishlist, and the library by platform.',
      links: [{ label: 'Open the wishlist on IGDB', href: data.wishlistUrl }],
      note: data.note,
      noteLinks: [...(data.noteLinks || []), ...SITE_CONTENT.index.giftMoney.map(money => ({ label: `Send money with ${money.name}`, href: money.url }))],
      groups: Object.entries(data.platforms).map(([key, platform]) => ({ key, label: plainLabel(platform.label) })),
      sectioned: true,
      wanted: (data.wishlist || []).map(game => card(game, false)),
      owned: data.owned.map(game => card(game, true))
    };
  }

  function expansionsHtml(expansions) {
    if (!Array.isArray(expansions) || expansions.length === 0) {
      return '';
    }
    const rows = expansions.map(expansion => {
      const url = expansion.amazonUrl || (expansion.asin ? `https://www.amazon.co.uk/dp/${expansion.asin}` : '');
      const name = url ? externalLink(url, expansion.name, 'item-card__link') : escapeHtml(expansion.name);
      return `<li>${name}${expansion.owned ? ' <span class="tag tag--owned">Owned</span>' : ''}</li>`;
    }).join('');
    return `<details class="item-card__more"><summary>Expansions (${expansions.length})</summary><ul>${rows}</ul></details>`;
  }

  function boardgamesCatalogue(data) {
    const card = (game, owned) => ({
      name: game.name,
      img: game.img,
      url: game.amazonUrl || (game.asin ? `https://www.amazon.co.uk/dp/${game.asin}` : ''),
      meta: game.publisher || game.category || '',
      owned,
      orderDate: game.orderDate || '',
      dateAdded: game.dateAdded || '',
      validated: game.validated || (owned && Boolean(game.orderDate)),
      extraHtml: expansionsHtml(game.expansions)
    });
    return {
      title: 'Board games',
      lede: 'Card games, co-op and party games for the table.',
      links: [
        { label: 'Open the Amazon wishlist', href: data.amazonWishlistUrl },
        { label: 'Collection on BoardGameGeek', href: data.bggUrl },
        { label: 'Collection on GeekGroup', href: data.geekGroupUrl || 'https://geekgroup.app/users/alectronic0/collection' }
      ],
      wanted: data.wishlist.map(game => card(game, false)),
      owned: data.owned.map(game => card(game, true))
    };
  }

  const BOOK_TYPES = ['Fiction, Fantasy & Sci-fi', 'Manga', 'Cookbooks', 'Non-fiction', 'Computer Science & Business', 'Video games', 'Zelda', 'Misc'];
  const BOOK_LINKS = [['goodreads', 'Goodreads'], ['amazon', 'Amazon'], ['waterstones', 'Waterstones'], ['play', 'Play Books']];

  const BOOK_TONES = [
    { key: 'green', label: '🟢 In print' },
    { key: 'amber', label: '🟠 Ebook only' },
    { key: 'red', label: '🔴 Not owned' },
    { key: 'blue', label: '🔵 Pre-ordered' }
  ];

  // The goal is a print copy of everything: green = in print, amber = ebook only, red = not owned
  function bookTone(book) {
    if (book.preordered) {
      return { tone: 'blue', toneLabel: 'Pre-ordered' };
    }
    if (book.formats.includes('physical')) {
      return { tone: 'green', toneLabel: '✓ In print' };
    }
    if (book.status === 'owned') {
      return { tone: 'amber', toneLabel: 'Ebook only, print needed' };
    }
    return { tone: 'red', toneLabel: 'Not owned' };
  }

  // Shown under a series heading: who wrote it, whether it has finished, and the edition worth buying
  function seriesNoteHtml(series, books, notes) {
    const note = notes[series] || {};
    const authors = [...new Set(books.filter(book => book.series === series).map(book => book.author).filter(Boolean))];
    const status = {
      complete: `✓ Complete${note.volumes ? ` · ${note.volumes} vols` : ''}`,
      ongoing: `⚠ Ongoing${note.volumes ? ` · ${note.volumes} vols so far` : ''}`
    }[note.status];
    const parts = [
      authors.length ? escapeHtml(authors.join(', ')) : '',
      status ? `<span class="tag tag--${note.status}">${escapeHtml(status)}</span>` : '',
      note.edition ? `<span class="tag tag--edition">📕 ${escapeHtml(note.edition)}</span>` : '',
      note.boxSet ? `<span class="tag tag--boxset">📦 ${note.boxSet.url ? externalLink(note.boxSet.url, note.boxSet.name, '') : escapeHtml(note.boxSet.name)}</span>` : '',
      note.note ? escapeHtml(note.note) : ''
    ];
    return parts.filter(Boolean).join(' ');
  }

  // Sections are types; inside, a block per series (or per author for standalone books) in volume order
  function booksCatalogue(data) {
    const authorOf = book => book.author || 'Unknown author';
    const notes = data.seriesNotes || {};
    const inPrint = data.library.filter(book => book.formats.includes('physical')).length;
    const noteCache = new Map();
    const noteFor = series => {
      if (!noteCache.has(series)) {
        noteCache.set(series, seriesNoteHtml(series, data.library, notes));
      }
      return noteCache.get(series);
    };
    const card = book => {
      const tags = [
        ...(book.formats.includes('digital') ? ['📱 Ebook'] : []),
        ...(book.audiobook ? ['🎧 Audiobook'] : [])
      ];
      const links = BOOK_LINKS.filter(([key]) => book.links[key]).map(([key, label]) => externalLink(book.links[key], label, 'item-card__link'));
      return {
        name: book.title,
        img: book.img,
        url: book.links.goodreads || book.links.play || book.links.waterstones || book.links.amazon,
        meta: [book.seriesNo ? `Book ${book.seriesNo}` : '', book.series ? authorOf(book) : ''].filter(Boolean).join(' · '),
        ...bookTone(book),
        tags,
        group: book.type,
        subgroups: [book.series || authorOf(book)],
        subgroupNotes: [book.series ? noteFor(book.series) : ''],
        cover: true,
        extraHtml: links.length ? `<p class="item-card__meta">${links.join(' · ')}</p>` : ''
      };
    };
    return {
      title: 'Books',
      banner: '🚧 Work in progress: this book list is still being synced and checked',
      lede: `${inPrint} of ${data.library.length} books owned in print. Green is on the shelf in print, amber is an ebook that still needs a print copy, red is not owned yet, blue is pre-ordered.`,
      links: [
        { label: 'Amazon wish list', href: data.amazonWishlistUrl },
        { label: 'Waterstones wish list', href: data.waterstonesUrl },
        { label: 'Shelves on Goodreads', href: data.goodreadsUrl }
      ],
      groups: BOOK_TYPES.map(type => ({ key: type, label: type })),
      toneTabs: BOOK_TONES,
      sectioned: true,
      // One list in reading order: the colours already say owned or not, and a series reads 1, 2, 3…
      wanted: data.library.map(card),
      owned: []
    };
  }

  function junkCatalogue(data) {
    return {
      title: plainLabel(data.title) || 'Other ideas',
      lede: 'Loose ideas that do not belong on another list yet.',
      groups: data.categories.map(category => ({ key: category.id, label: plainLabel(category.name) })),
      sectioned: true,
      wanted: data.categories.flatMap(category => (category.items || []).map(item => ({
        name: item.name,
        img: item.img,
        url: item.url,
        meta: item.size ? `${item.theme}, size ${item.size}` : item.theme,
        price: isPrice(item.price) ? item.price : '',
        status: isPrice(item.price) ? '' : item.price,
        orderDate: item.orderDate || '',
        dateAdded: item.dateAdded || '',
        validated: item.validated || false,
        group: category.id
      }))),
      owned: []
    };
  }

  function nintendoCatalogue(data) {
    if (!data) return { title: 'Nintendo & Pokémon', lede: '', groups: [], wanted: [], owned: [] };
    const groups = data.groups || [
      { key: 'pokemon', label: 'Pokémon' },
      { key: 'mario', label: 'Super Mario & Yoshi' },
      { key: 'pikmin', label: 'Pikmin' },
      { key: 'metroid', label: 'Metroid' },
      { key: 'zelda', label: 'The Legend of Zelda' },
      { key: 'other', label: 'Other' }
    ];
    return {
      title: 'Nintendo & Pokémon',
      lede: 'Official merchandise from Nintendo Store UK and Pokémon Center UK.',
      links: [
        { label: 'My Nintendo Store UK', href: 'https://store.nintendo.com/en-gb' },
        { label: 'Pokémon Center UK', href: 'https://www.pokemoncenter.com/en-gb' }
      ],
      groups,
      sectioned: true,
      wanted: (data.wishlist || []).map(item => ({
        name: item.name,
        img: item.img,
        url: item.url,
        meta: item.status || '',
        price: isPrice(item.price) ? item.price : '',
        status: isPrice(item.price) ? '' : item.price,
        orderDate: item.orderDate || '',
        dateAdded: item.dateAdded || '',
        validated: item.validated || false,
        group: item.group || 'other'
      })),
      owned: []
    };
  }

  function healthCatalogue(data) {
    return {
      title: 'Health and gym',
      lede: 'Health trackers and gym kit: what is wanted, and what is already in use.',
      wanted: data.wishlist.map(item => ({ name: item.name, img: item.img, url: item.url, meta: item.status, price: item.price })),
      owned: data.owned.map(item => ({ name: item.name, img: item.img, url: item.url, meta: item.badge, owned: true }))
    };
  }

  function groomingCatalogue(data) {
    const categories = [...new Set(data.items.map(item => item.category))];
    const bullet = text => `<li>${escapeHtml(text)}</li>`;
    return {
      title: data.title,
      lede: data.lede,
      introHtml: `
        <div class="rules">
          <section class="rules__yes"><h2>Scents I like</h2><ul>${data.likes.map(bullet).join('')}</ul></section>
          <section class="rules__no"><h2>Please avoid</h2><ul>${data.avoid.map(bullet).join('')}</ul></section>
        </div>`,
      groups: categories.map(category => ({ key: category, label: category })),
      sectioned: true,
      wanted: data.items.map(item => ({
        name: item.name,
        img: item.img,
        url: item.url,
        meta: [item.brand, item.detail].filter(Boolean).join(', '),
        orderDate: item.orderDate || '',
        dateAdded: item.dateAdded || '',
        validated: item.validated || false,
        group: item.category
      })),
      owned: []
    };
  }

  // { title, lede, groups[], items[{name, url, img, meta, group}] }
  function plainListCatalogue(data) {
    return {
      title: data.title,
      lede: data.lede,
      groups: data.groups,
      sectioned: true,
      wanted: data.items.map(item => ({
        name: item.name,
        img: item.img,
        url: item.url,
        meta: item.meta,
        orderDate: item.orderDate || '',
        dateAdded: item.dateAdded || '',
        validated: item.validated || false,
        group: item.group
      })),
      owned: []
    };
  }

  const CATALOGUES = {
    lego: () => legoCatalogue(SITE_CONTENT.lego),
    zelda: () => zeldaCatalogue(SITE_CONTENT.zelda),
    nintendo: () => nintendoCatalogue(SITE_CONTENT.nintendo),
    videogames: () => gamesCatalogue(SITE_CONTENT.videogames),
    boardgames: () => boardgamesCatalogue(SITE_CONTENT.boardgames),
    books: () => booksCatalogue(SITE_CONTENT.books),
    junk: () => junkCatalogue(SITE_CONTENT.junk),
    health: () => healthCatalogue(SITE_CONTENT.health),
    grooming: () => groomingCatalogue(SITE_CONTENT.grooming),
    consumables: () => plainListCatalogue(SITE_CONTENT.consumables)
  };

  const catalogueRoot = document.getElementById('catalogue');
  if (catalogueRoot && CATALOGUES[catalogueRoot.dataset.page]) {
    renderCatalogue(catalogueRoot, CATALOGUES[catalogueRoot.dataset.page]());
  }

  // --- index.html ---
  const homeRoot = document.getElementById('home');
  if (homeRoot && SITE_CONTENT.index) {
    const index = SITE_CONTENT.index;
    const sections = index.intro.sections;
    const library = SITE_CONTENT.books.library;
    const counts = {
      'lego.html': [SITE_CONTENT.lego.wishlist.length, SITE_CONTENT.lego.owned.length],
      'zelda.html': [SITE_CONTENT.zelda.wishlist.length, SITE_CONTENT.zelda.owned.length],
      'nintendo.html': [SITE_CONTENT.nintendo ? SITE_CONTENT.nintendo.wishlist.length : 0, 0],
      'videogames.html': [(SITE_CONTENT.videogames.wishlist || []).length, SITE_CONTENT.videogames.owned.length],
      'boardgames.html': [SITE_CONTENT.boardgames.wishlist.length, SITE_CONTENT.boardgames.owned.length],
      'books.html': [
        library.filter(book => !book.formats.includes('physical')).length,
        library.filter(book => book.status === 'owned').length
      ]
    };
    const rule = text => {
      const [head, ...rest] = plainLabel(text).split(' — ');
      return `<li><strong>${escapeHtml(head)}</strong>${escapeHtml(rest.join(' — '))}</li>`;
    };
    const shelf = hub => {
      const count = counts[hub.href];
      const numbers = count
        ? `<span class="shelf__numbers"><span class="shelf__wanted">${count[0]} wanted</span>, <span class="shelf__owned">${count[1]} owned</span></span>`
        : '<span class="shelf__numbers"></span>';
      return `<a class="shelf" href="${escapeHtml(hub.href)}">
        <span class="shelf__name">${escapeHtml(plainLabel(hub.title))}</span>
        <span class="shelf__note">${escapeHtml(hub.notes)}</span>
        ${numbers}</a>`;
    };

    homeRoot.innerHTML = `
      <h1>What to get Alec, and what he already has</h1>
      <p class="lede">${escapeHtml(sections.warning.text)}</p>
      <div class="rules">
        <section class="rules__yes">
          <h2>Good ideas right now</h2>
          <ul>${sections.good.items.map(rule).join('')}</ul>
          <p class="rules__money">${index.giftMoney.map(money => externalLink(money.url, `Send money with ${money.name}`, 'button')).join('')}</p>
        </section>
        <section class="rules__no">
          <h2>Please don't buy</h2>
          <ul>${sections.dont.items.map(rule).join('')}</ul>
        </section>
      </div>
      <h2>Browse the lists</h2>
      <div class="shelves">${index.collectionHubs.map(shelf).join('')}</div>`;
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
      
        // Measurement formatting helper
        const formatMeasurementCard = (m) => {
          let displayValue = '—';
          let displayNotes = m.notes || '';
          let isPending = false;

          if (m.type === 'raw') {
            displayValue = m.value;
            displayNotes = m.notes || '';
          } else if (m.type === 'length') {
            if (m.inches != null) {
              displayValue = `${m.inches}"`;
              const cm = Math.round(m.inches * 2.54);
              displayNotes = m.notes ? `${cm} cm • ${m.notes}` : `${cm} cm`;
            } else {
              isPending = true;
            }
          } else if (m.type === 'cm') {
            if (m.cm != null) {
              displayValue = `${m.cm} cm`;
              const inVal = (m.cm / 2.54).toFixed(1);
              displayNotes = m.notes ? `${inVal}" • ${m.notes}` : `${inVal}"`;
            } else {
              isPending = true;
            }
          } else if (m.type === 'length-range') {
            displayValue = `${m.inchesMin} - ${m.inchesMax}"`;
            const cmMin = Math.round(m.inchesMin * 2.54);
            const cmMax = Math.round(m.inchesMax * 2.54);
            displayNotes = `${cmMin} - ${cmMax} cm`;
          } else if (m.type === 'cm-range') {
            displayValue = `${m.cmMin} - ${m.cmMax} cm`;
            const inMin = (m.cmMin / 2.54).toFixed(1);
            const inMax = (m.cmMax / 2.54).toFixed(1);
            displayNotes = `${inMin} - ${inMax}"`;
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

          const valueStyle = isPending
            ? 'color: var(--text-muted); opacity: 0.6; font-style: italic;'
            : 'color: var(--text);';

          const keyBadge = m.key
            ? `<code style="font-size: 0.65rem; color: var(--text-muted); background: var(--bg); padding: 1px 4px; border-radius: 3px; margin-left: 4px;">${m.key}</code>`
            : '';

          return `
            <div class="horizontal-card" style="display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between; min-height: 68px;">
              <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <span style="font-size: 0.72rem; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.05em;">${m.label}</span>
                ${keyBadge}
              </div>
              <span style="font-size: 1.15rem; font-weight: 800; margin: 2px 0 0 0; ${valueStyle}">${displayValue}</span>
              <span style="font-size: 0.7rem; color: var(--text-muted); margin-top: 1px; line-height: 1.2;">${displayNotes}</span>
            </div>
          `;
        };

        // Measurements
        const measurementsGrid = document.getElementById('measurements-grid');
        if (measurementsGrid && data.measurements) {
          measurementsGrid.innerHTML = data.measurements.map(m => formatMeasurementCard(m)).join('');
        }

        // Bespoke / FreeSewing measurements
        const bespokeContainer = document.getElementById('bespoke-measurements-container');
        if (bespokeContainer && data.bespokeMeasurements) {
          bespokeContainer.innerHTML = data.bespokeMeasurements.map(group => `
            <div>
              <h3 style="font-size: 0.92rem; font-weight: 700; color: var(--text); margin: 0 0 8px 0; display: flex; align-items: center; gap: 6px;">
                <span>${group.category}</span>
                <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 400;">(${group.items.length} landmarks)</span>
              </h3>
              <div class="horizontal-card-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
                ${group.items.map(m => formatMeasurementCard(m)).join('')}
              </div>
            </div>
          `).join('');
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
            "Graphic T-Shirts",
            "Casual & Basic T-Shirts",
            "Button-Up & Resort Shirts",
            "Formalwear & Suits",
            "Knitwear & Jumpers",
            "Outerwear & Hoodies",
            "Trousers",
            "Shorts",
            "Footwear",
            "Loungewear & Pyjamas",
            "Underwear",
            "Socks",
            "Accessories (Belts)",
            "Accessories (Ties)",
            "Accessories (Cufflinks)"
          ];
      
          // Group elements by matching category
          const groupItems = {};
          categoriesOrder.forEach(cat => { groupItems[cat] = []; });
      
          data.inventory.forEach(item => {
            const cat = item.category || item.type || "Other";
            const matchedCat = categoriesOrder.find(c => c === cat || cat.startsWith(c) || c.startsWith(cat)) || "Other";
            if (!groupItems[matchedCat]) {
              groupItems[matchedCat] = [];
            }
            groupItems[matchedCat].push(item);
          });
      
          let inventoryHTML = '';
          const activeCategories = [...categoriesOrder, ...Object.keys(groupItems).filter(c => !categoriesOrder.includes(c))];
          activeCategories.forEach(category => {
            const items = groupItems[category] || [];
            if (items.length === 0) return;
            const totalGarments = items.reduce((sum, it) => sum + (parseInt(it.qty, 10) || 1), 0);
            const countLabel = totalGarments !== items.length
              ? `${items.length} ${items.length === 1 ? 'entry' : 'entries'} (${totalGarments} physical)`
              : `${items.length} ${items.length === 1 ? 'item' : 'items'}`;

            inventoryHTML += `
              <div style="background: var(--bg-alt); border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
                <h3 style="color: var(--accent); font-size: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                  <span>📂 ${category}</span>
                  <span style="font-size: 0.75rem; background: var(--border); color: var(--text-muted); padding: 2px 8px; border-radius: 4px;">${countLabel}</span>
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; margin-top: 12px;">
                  ${items.map(item => {
                    const qtyBadge = (item.qty && item.qty > 1)
                      ? `<span class="inv-item-badge" style="font-size: 0.7rem; padding: 1px 6px; background: rgba(235, 160, 50, 0.15); color: var(--accent);">×${item.qty}</span>`
                      : '';
                    const sizeBadge = item.size && item.size !== 'N/A'
                      ? `<span class="inv-item-badge" style="font-size: 0.7rem; padding: 1px 6px;">${item.size}</span>`
                      : '';
                    let designSnippet = '';
                    if (item.breakdown && Array.isArray(item.breakdown) && item.breakdown.length > 0) {
                      designSnippet = `
                        <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
                          ${item.breakdown.map(b => {
                            const match = b.match(/^(\[x\d+\])\s*(.*)$/);
                            const countPart = match ? match[1] : '';
                            const descPart = match ? match[2] : b;
                            return `
                              <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.74rem; font-family: var(--font-mono, monospace); background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border); border-radius: 4px; padding: 2px 7px; width: fit-content;">
                                <span style="color: var(--accent); font-weight: 700;">${escapeHtml(countPart)}</span>
                                <span>${escapeHtml(descPart)}</span>
                              </div>
                            `;
                          }).join('')}
                        </div>
                      `;
                    } else if (item.design && item.design !== item.name) {
                      designSnippet = `<span style="font-size: 0.76rem; color: var(--text-muted); line-height: 1.3; margin-top: 2px; display: block;">${escapeHtml(item.design)}</span>`;
                    }
                    const fabricSnippet = item.fabric
                      ? `<span style="font-size: 0.7rem; color: var(--text-muted); opacity: 0.85;">${item.fabric}</span>`
                      : '';

                    const imgMarkup = item.img
                      ? `<div class="item-card__media" style="margin-bottom: 8px;"><img src="${item.img}" alt="${item.name}" loading="lazy" referrerpolicy="no-referrer"></div>`
                      : `<div class="item-card__media item-card__media--blank" style="margin-bottom: 8px;"><span class="item-card__blank">No picture yet</span></div>`;

                    return `
                      <div style="background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
                        <div>
                          ${imgMarkup}
                          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 6px;">
                            <span style="font-weight: 700; color: var(--text); font-size: 0.88rem; line-height: 1.25;">${item.name}</span>
                            ${qtyBadge}
                          </div>
                          ${designSnippet}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 6px;">
                          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted);">
                            <span>${item.brand ? `<strong>${item.brand}</strong>` : ''}</span>
                            ${sizeBadge}
                          </div>
                          ${fabricSnippet}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          });
      
          inventoryContainer.innerHTML = inventoryHTML;
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
              <div class="room-card" style="display: block;">
                <div class="room-header" style="margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border);">
                  <div class="room-icon">💡</div>
                  <div class="room-title-group">
                    <h3 style="font-size: 1.3rem;">Smart Tech & Infrastructure</h3>
                  </div>
                </div>
                <div class="room-smart-tech" style="font-size: 0.9rem; color: var(--text-muted);">
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
                  <div class="room-projects-container">
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
                <div class="room-card" style="display: block;">
                  <div class="room-header" style="margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border);">
                    <div class="room-title-group">
                      <h3 style="font-size: 1.3rem; margin: 0;">${room.name}</h3>
                    </div>
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                      ${smartTechHtml}
                      ${inventoryHtml}
                    </div>
                    ${projectsHtml ? `<div>${projectsHtml}</div>` : ''}
                  </div>
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
 * Global navigation: a row of plain links, scrollable sideways on narrow screens.
 */
(function () {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    const navLinks = [
        {href: 'lego.html', title: 'LEGO'},
        {href: 'zelda.html', title: 'Zelda'},
        {href: 'videogames.html', title: 'Video games'},
        {href: 'boardgames.html', title: 'Board games'},
        {href: 'books.html', title: 'Books'},
        {href: 'junk.html', title: 'Junk Box'},
        {href: 'home.html', title: 'Home'},
        {href: 'health.html', title: 'Health'},
        {href: 'grooming.html', title: 'Grooming'},
        {href: 'clothing.html', title: 'Clothing'},
        {href: 'misc.html', title: 'Stores'},
        {href: 'consumables.html', title: 'Consumables'}
    ];

    function renderNav() {
        const siteHeader = document.querySelector('header.site-nav');
        if (!siteHeader) return;

        siteHeader.innerHTML = `
      <a href="index.html" class="site-name">Gift Alec</a>
      <nav aria-label="Lists">
        ${navLinks.map(item => `<a href="${item.href}"${currentPath === item.href ? ' aria-current="page"' : ''}>${item.title}</a>`).join('')}
      </nav>
    `;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderNav);
    } else {
        renderNav();
    }
})();
