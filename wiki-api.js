window.MM_API = {
  async fetchWiki(params) {
    const url = new URL(window.MM_CONFIG.WIKI_API);
    const queryParams = Object.assign({ origin: '*', format: 'json' }, params);
    Object.keys(queryParams).forEach((key) => {
      url.searchParams.append(key, queryParams[key]);
    });
    const response = await fetch(url);
    return await response.json();
  },

  async fetchWikiChunks(titlesArray, baseParams, chunkSize = 40) {
    const chunks = [];
    for (let i = 0; i < titlesArray.length; i += chunkSize) {
      chunks.push(titlesArray.slice(i, i + chunkSize));
    }
    let allPages = {};
    for (const chunk of chunks) {
      try {
        const res = await window.MM_API.fetchWiki(
          Object.assign({}, baseParams, { titles: chunk.join('|') })
        );
        if (res.query && res.query.pages) {
          allPages = Object.assign(allPages, res.query.pages);
        }
      } catch (e) {
        console.error('Chunk fetch error:', e);
      }
    }
    return allPages;
  },

  async getCategoryMembers(categoryTitle, cmtype = 'file') {
    const membersList = [];
    let cmcontinue = null;
    try {
      do {
        const params = {
          action: 'query',
          list: 'categorymembers',
          cmtitle: 'Category:' + categoryTitle,
          cmtype: cmtype,
          cmlimit: 500
        };
        if (cmcontinue) params.cmcontinue = cmcontinue;
        const data = await window.MM_API.fetchWiki(params);
        const members = (data.query && data.query.categorymembers) || [];
        members.forEach((m) => membersList.push(m.title));
        cmcontinue = data.continue && data.continue.cmcontinue;
      } while (cmcontinue);
    } catch (e) {
      console.error('Category fetch error:', categoryTitle, e);
    }
    return membersList;
  },

  async getPagesImages(pageTitles) {
    const usedImages = new Set();
    if (!pageTitles || pageTitles.length === 0) return usedImages;
    const pages = await window.MM_API.fetchWikiChunks(
      pageTitles,
      { action: 'query', prop: 'images', imlimit: 500 },
      50
    );
    Object.values(pages).forEach((page) => {
      if (page.images) {
        page.images.forEach((img) => usedImages.add(img.title));
      }
    });
    return usedImages;
  },

  normalizeTitle(title) {
    return String(title).toLowerCase().replace(/_/g, ' ').trim();
  },

  stripFilePrefix(name) {
    return String(name).trim().replace(/^(File|Image|Файл):/i, '').replace(/_/g, ' ');
  },

  escapeHtml(text) {
    const amp = String.fromCharCode(38);
    return String(text)
      .replace(/&/g, amp + 'amp;')
      .replace(/</g, amp + 'lt;')
      .replace(/>/g, amp + 'gt;')
      .replace(/"/g, amp + 'quot;')
      .replace(/'/g, amp + '#39;');
  },

  flashButtonText(btn, tempText, duration = 1500) {
    if (!btn) return;
    const original = btn.textContent;
    btn.textContent = tempText;
    setTimeout(() => {
      btn.textContent = original;
    }, duration);
  },

  renderNav(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const currentFile = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');
    container.innerHTML = window.MM_CONFIG.TOOLS_NAV
      .filter((item) => item.href !== currentFile)
      .map((item) => `<a href="${item.href}">${item.label}</a>`)
      .join('<span>•</span>');
  }
};
