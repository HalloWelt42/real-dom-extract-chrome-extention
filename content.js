/**
 * DOM Extractor Pro - Content Script
 * Element Picker + Page Extractor
 */
(() => {
  if (window.__DOMEX_LOADED__) return;
  window.__DOMEX_LOADED__ = true;

  // ============================================
  // PAGE CONTENT EXTRACTOR
  // ============================================
  const PageExtractor = {
    EXCLUDE_SELECTORS: [
      '[class*="ad-"]', '[class*="ads-"]', '[class*="advert"]',
      '[id*="ad-"]', '[id*="ads-"]', '[id*="advert"]',
      '.ad', '.ads', '.advertisement', '.sponsored',
      '[data-ad]', '[data-ads]', 'ins.adsbygoogle',
      '[class*="comment"]', '[id*="comment"]',
      '.comments', '#comments', '.discussion',
      '[class*="disqus"]', '#disqus_thread',
      '[class*="share"]', '[class*="social"]',
      '.share-buttons', '.social-links',
      'nav', 'header', 'footer', 'aside',
      '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
      '.nav', '.navbar', '.menu', '.sidebar',
      '.breadcrumb', '.pagination',
      '[class*="popup"]', '[class*="modal"]', '[class*="overlay"]',
      '[class*="cookie"]', '[class*="gdpr"]', '[class*="consent"]',
      '[class*="related"]', '[class*="recommended"]',
      'form', 'button', 'input', 'select', 'textarea',
      '[class*="newsletter"]', '[class*="subscribe"]',
      '[hidden]', '[aria-hidden="true"]',
      '.hidden', '.invisible', '.sr-only',
      'script', 'style', 'noscript', 'iframe', 'svg', 'canvas',
      'video', 'audio', 'object', 'embed'
    ],

    CONTENT_SELECTORS: [
      'article', '[role="article"]', '[role="main"]', 'main',
      '.post-content', '.article-content', '.entry-content',
      '.content', '.post', '.article', '#content', '#main', '.main-content'
    ],

    extract() {
      let contentRoot = this.findContentRoot() || document.body;
      const clone = contentRoot.cloneNode(true);
      this.removeExcluded(clone);
      return {
        html: clone.innerHTML,
        title: document.title,
        url: location.href
      };
    },

    findContentRoot() {
      for (const selector of this.CONTENT_SELECTORS) {
        const el = document.querySelector(selector);
        if (el && (el.innerText || '').length > 200) return el;
      }
      const candidates = document.querySelectorAll('div, section, article');
      let best = null;
      let bestScore = 0;
      for (const el of candidates) {
        const score = this.scoreElement(el);
        if (score > bestScore) {
          bestScore = score;
          best = el;
        }
      }
      return best;
    },

    scoreElement(el) {
      const text = el.innerText || '';
      if (text.length < 100) return 0;
      const links = el.querySelectorAll('a');
      const linkText = Array.from(links).reduce((s, a) => s + (a.innerText?.length || 0), 0);
      const linkDensity = linkText / text.length;
      if (linkDensity > 0.5) return 0;
      const pText = Array.from(el.querySelectorAll('p')).reduce((s, p) => s + (p.innerText?.length || 0), 0);
      return text.length * (1 - linkDensity) * (pText / text.length + 0.5);
    },

    removeExcluded(root) {
      try {
        root.querySelectorAll(this.EXCLUDE_SELECTORS.join(', ')).forEach(el => el.remove());
      } catch (e) {
        // Fallback bei ungültigem Selector
      }
      root.querySelectorAll('*').forEach(el => {
        const cn = el.className?.toString?.() || '';
        const id = el.id || '';
        if (/(^|\s)(ad|ads|advert|banner|sponsor|promo|comment|disqus|social|share|related|sidebar|footer|header|nav|menu|popup|modal|cookie|newsletter)(\s|$|-|_)/i.test(cn + ' ' + id)) {
          el.remove();
        }
      });
    }
  };

  // ============================================
  // ELEMENT PICKER
  // ============================================
  const ElementPicker = {
    active: false,
    overlay: null,
    info: null,
    tooltip: null,
    hovered: null,

    start() {
      if (this.active) return;
      this.active = true;
      document.body.classList.add('domex-picker-active');

      this.overlay = document.createElement('div');
      this.overlay.id = 'domex-overlay';
      document.body.appendChild(this.overlay);

      this.info = document.createElement('div');
      this.info.id = 'domex-info';
      this.info.innerHTML =
        '<span class="domex-info-icon"><svg viewBox="0 0 512 512" width="20" height="20" fill="white"><path d="M256 0c17.7 0 32 14.3 32 32l0 10.4c93.7 13.9 167.7 88 181.6 181.6l10.4 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-10.4 0c-13.9 93.7-88 167.7-181.6 181.6l0 10.4c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-10.4C130.3 455.7 56.3 381.7 42.4 288L32 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l10.4 0C56.3 130.3 130.3 56.3 224 42.4L224 32c0-17.7 14.3-32 32-32zM107.4 288c12.5 58.3 58.4 104.1 116.6 116.6l0-20.6c0-17.7 14.3-32 32-32s32 14.3 32 32l0 20.6c58.3-12.5 104.1-58.4 116.6-116.6L384 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l20.6 0C392.1 165.7 346.3 119.9 288 107.4l0 20.6c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-20.6C165.7 119.9 119.9 165.7 107.4 224l20.6 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-20.6 0zM256 224a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg></span>' +
        '<span class="domex-info-text">' +
        '<strong>' + (chrome.i18n.getMessage('pickerInfoTitle') || 'Element Picker') + '</strong><br>' +
        '<small>' + (chrome.i18n.getMessage('pickerInfoHint') || 'Click to select -- ESC to cancel') + '</small>' +
        '</span>';
      document.body.appendChild(this.info);

      this.tooltip = document.createElement('div');
      this.tooltip.id = 'domex-tooltip';
      document.body.appendChild(this.tooltip);

      this._move = this.onMove.bind(this);
      this._click = this.onClick.bind(this);
      this._key = this.onKey.bind(this);

      document.addEventListener('mousemove', this._move, true);
      document.addEventListener('mousedown', this._click, true);
      document.addEventListener('keydown', this._key, true);
    },

    stop() {
      if (!this.active) return;
      this.active = false;
      document.body.classList.remove('domex-picker-active');
      this.overlay?.remove();
      this.info?.remove();
      this.tooltip?.remove();
      this.overlay = this.info = this.tooltip = this.hovered = null;
      document.removeEventListener('mousemove', this._move, true);
      document.removeEventListener('mousedown', this._click, true);
      document.removeEventListener('keydown', this._key, true);
    },

    onMove(e) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || el.id?.startsWith('domex-')) return;
      this.hovered = el;
      const rect = el.getBoundingClientRect();
      Object.assign(this.overlay.style, {
        top: (rect.top + window.scrollY) + 'px',
        left: (rect.left + window.scrollX) + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px'
      });
      const text = el.innerText?.trim() || '';
      if (text.length >= 10) {
        this.tooltip.textContent = text.slice(0, 80) + (text.length > 80 ? '...' : '');
        this.tooltip.style.display = 'block';
        this.tooltip.style.left = Math.min(e.clientX + 15, window.innerWidth - 300) + 'px';
        this.tooltip.style.top = (e.clientY + 20) + 'px';
      } else {
        this.tooltip.style.display = 'none';
      }
    },

    onClick(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const el = this.hovered;
      this.stop();
      if (el) {
        // Config aus Storage laden und Extraktion durchführen
        chrome.storage.sync.get(['mode', 'filters', 'maxChars'], (result) => {
          const config = Object.assign({
            mode: result.mode || 'html'
          }, result.filters || {});
          const rawMax = (result.maxChars || '100000000').replace(/\./g, '');
          config.maxChars = parseInt(rawMax) || 100000000;

          // Picker-Element als Root für Extraktion nutzen
          const root = el.cloneNode(true);
          // Temporär ins DOM hängen damit innerText funktioniert
          root.style.position = 'absolute';
          root.style.left = '-99999px';
          document.body.appendChild(root);
          const output = DOMExtractor.extractFromRoot(config, root);
          root.remove();

          chrome.runtime.sendMessage({
            action: 'pickerResult',
            output: output,
            url: location.href,
            title: document.title
          });
        });
      }
    },

    onKey(e) {
      if (e.key === 'Escape') {
        this.stop();
        chrome.runtime.sendMessage({ action: 'pickerCancelled' });
      }
    }
  };

  // ============================================
  // MESSAGE HANDLER
  // ============================================
  chrome.runtime.onMessage.addListener((req, sender, res) => {
    switch (req.action) {
      case 'startPicker':
        ElementPicker.start();
        res({ success: true });
        break;
      case 'stopPicker':
        ElementPicker.stop();
        res({ success: true });
        break;
      case 'getSelection':
        res({ text: window.getSelection()?.toString()?.trim() || '' });
        break;
      case 'extractPage':
        res(PageExtractor.extract());
        break;
      case 'getFullDOM':
        res({
          html: document.documentElement.innerHTML,
          url: location.href,
          title: document.title
        });
        break;
      case 'extractWithConfig':
        res(DOMExtractor.extract(req.config, req.source));
        break;
      case 'ping':
        res({ success: true });
        break;
    }
    return true;
  });

  // ============================================
  // DOM EXTRACTOR (Filter + Konvertierung im Tab-Kontext)
  // ============================================
  const DOMExtractor = {
    extract(config, source) {
      let root;
      if (source === 'page') {
        const pageData = PageExtractor.extract();
        root = document.createElement('div');
        root.innerHTML = pageData.html;
      } else if (source === 'selection') {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return { output: '', url: location.href, title: document.title };
        const range = sel.getRangeAt(0);
        const fragment = range.cloneContents();
        root = document.createElement('div');
        root.appendChild(fragment);
      } else {
        // full
        root = document.body.cloneNode(true);
      }
      // Relative URLs in absolute umwandeln (damit Vorschau Bilder laden kann)
      const baseUrl = location.origin;
      root.querySelectorAll('[src]').forEach(el => {
        const src = el.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('blob:')) {
          try { el.setAttribute('src', new URL(src, location.href).href); } catch (e) {}
        }
      });
      root.querySelectorAll('[href]').forEach(el => {
        const href = el.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('data:') && !href.startsWith('#') && !href.startsWith('javascript:')) {
          try { el.setAttribute('href', new URL(href, location.href).href); } catch (e) {}
        }
      });
      root.querySelectorAll('[srcset]').forEach(el => {
        const srcset = el.getAttribute('srcset');
        if (srcset) {
          const resolved = srcset.split(',').map(part => {
            const [url, ...rest] = part.trim().split(/\s+/);
            if (url && !url.startsWith('http') && !url.startsWith('data:')) {
              try { return [new URL(url, location.href).href, ...rest].join(' '); } catch (e) {}
            }
            return part.trim();
          }).join(', ');
          el.setAttribute('srcset', resolved);
        }
      });

      // Erst styled HTML für Vorschau sichern (vor dem Filtern)
      let styledHTML = '';
      try {
        const allCSS = this.collectCSS();
        const cssBlock = allCSS.length > 0 ? '<style>' + allCSS + '</style>' : '';
        styledHTML = cssBlock + root.innerHTML;
      } catch (e) {}

      // Klon temporär ins DOM hängen damit innerText funktioniert
      root.style.position = 'absolute';
      root.style.left = '-99999px';
      root.style.top = '-99999px';
      document.documentElement.appendChild(root);
      let output;
      try {
        output = this.extractFromRoot(config, root);
      } finally {
        root.remove();
      }
      return { output, styledHTML, url: location.href, title: document.title };
    },

    collectCSS() {
      const parts = [];
      for (const sheet of document.styleSheets) {
        try {
          const rules = [];
          for (const rule of sheet.cssRules) rules.push(rule.cssText);
          if (rules.length > 0) {
            let css = rules.join('\n');
            const sheetBase = sheet.href || location.href;
            css = css.replace(/url\(["']?(?!data:|https?:|blob:)([^"')]+)["']?\)/g, (match, path) => {
              try { return 'url("' + new URL(path, sheetBase).href + '")'; } catch (e) { return match; }
            });
            parts.push(css);
          }
        } catch (e) {}
      }
      return parts.join('\n');
    },

    extractFromRoot(config, root) {
      // Filter anwenden
      if (config.removeJS) {
        root.querySelectorAll('script').forEach(el => el.remove());
        root.querySelectorAll('*').forEach(el => {
          Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
          });
        });
      }

      if (config.removeCSS) {
        root.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.remove());
        root.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
        root.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));
      } else if (config.mode === 'html') {
        // CSS beibehalten: Stylesheets inline einbetten
        const collectedCSS = this.collectCSS();
        if (collectedCSS) {
          const styleEl = document.createElement('style');
          styleEl.textContent = collectedCSS;
          root.insertBefore(styleEl, root.firstChild);
        }
      }

      if (config.removeSVG) {
        root.querySelectorAll('svg, canvas').forEach(el => el.remove());
      }

      root.querySelectorAll('noscript, iframe, object, embed, applet, meta, link[rel="icon"], link[rel="preload"], link[rel="prefetch"]').forEach(el => el.remove());

      if (config.removeForms) {
        root.querySelectorAll('form, input, select, textarea, button, fieldset, legend').forEach(el => el.remove());
      }

      if (config.removeNavLinks) {
        root.querySelectorAll('nav, [role="navigation"], .breadcrumb, .pagination, .pager, .nav, .navbar, .menu, .sidebar').forEach(el => el.remove());
        try {
          root.querySelectorAll('[class*="breadcrumb"], [class*="pagination"], [class*="pager"], [class*="nav-link"]').forEach(el => el.remove());
        } catch (e) {}
      }

      if (config.removeDataAttrs) {
        root.querySelectorAll('*').forEach(el => {
          Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('data-') || attr.name.startsWith('aria-') || attr.name === 'role') {
              el.removeAttribute(attr.name);
            }
          });
        });
      }

      if (config.removeImages) {
        root.querySelectorAll('img, picture, figure').forEach(el => el.remove());
      } else {
        root.querySelectorAll('img').forEach(img => {
          const alt = img.getAttribute('alt');
          const src = img.getAttribute('src');
          const filename = src ? src.split('/').pop().split('?')[0] : 'unknown';
          img.replaceWith('[IMG: ' + (alt || filename) + ']');
        });
      }

      if (config.flattenDivs) {
        const wrapperTags = ['div', 'span', 'section', 'article', 'main', 'aside'];
        let changed = true, passes = 0;
        while (changed && passes < 10) {
          changed = false; passes++;
          root.querySelectorAll(wrapperTags.join(', ')).forEach(el => {
            if (el.children.length === 1 && el.childElementCount === 1) {
              const child = el.children[0];
              if (wrapperTags.includes(child.tagName.toLowerCase())) {
                el.replaceWith(child);
                changed = true;
              }
            }
            if (el.children.length === 0 && !el.textContent.trim()) {
              el.remove(); changed = true;
            }
          });
        }
      }

      if (config.removeEmptyTags) {
        let changed = true, passes = 0;
        const selfClosing = ['br','hr','img','input','meta','link','col','source','track','wbr'];
        while (changed && passes < 5) {
          changed = false; passes++;
          root.querySelectorAll('*').forEach(el => {
            if (selfClosing.includes(el.tagName.toLowerCase())) return;
            if (!el.textContent.trim() && el.children.length === 0) {
              el.remove(); changed = true;
            }
          });
        }
      }

      if (config.removeDuplicates) {
        const seen = new Set();
        root.querySelectorAll('p, li, div, span, td, th, h1, h2, h3, h4, h5, h6').forEach(el => {
          const text = el.innerText?.trim();
          if (text && text.length > 20) {
            if (seen.has(text)) el.remove();
            else seen.add(text);
          }
        });
      }

      // Links vereinfachen
      root.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href');
        const text = a.textContent.trim();
        if (text) a.replaceWith(text + (href ? ' (' + href + ')' : ''));
      });

      // Tabellen-Konvertierung
      const mode = config.mode;

      if (mode === 'markdown' || mode === 'text') {
        root.querySelectorAll('table').forEach(table => {
          const rows = Array.from(table.querySelectorAll('tr'));
          if (rows.length === 0) return;
          if (mode === 'markdown') {
            const matrix = rows.map(row =>
              Array.from(row.querySelectorAll('th, td')).map(c =>
                (c.innerText || c.textContent).trim().replace(/\|/g, '\\|').replace(/\n/g, ' ')
              )
            );
            const colCount = Math.max(...matrix.map(r => r.length));
            const lines = [];
            for (let i = 0; i < matrix.length; i++) {
              while (matrix[i].length < colCount) matrix[i].push('');
              lines.push('| ' + matrix[i].join(' | ') + ' |');
              if (i === 0) lines.push('| ' + matrix[i].map(() => '---').join(' | ') + ' |');
            }
            table.replaceWith('\n' + lines.join('\n') + '\n');
          } else {
            const lines = rows.map(row =>
              Array.from(row.querySelectorAll('th, td')).map(c =>
                (c.innerText || c.textContent).trim().replace(/\n/g, ' ')
              ).join('\t')
            );
            table.replaceWith('\n' + lines.join('\n') + '\n');
          }
        });
      }

      if (mode === 'markdown') {
        root.querySelectorAll('dl').forEach(dl => {
          let md = '\n';
          Array.from(dl.children).forEach(child => {
            if (child.tagName === 'DT') md += '**' + child.innerText.trim() + '**\n';
            else if (child.tagName === 'DD') md += ': ' + child.innerText.trim() + '\n';
          });
          dl.replaceWith(md);
        });
        root.querySelectorAll('details').forEach(details => {
          const summary = details.querySelector('summary');
          const summaryText = summary ? summary.innerText.trim() : 'Details';
          if (summary) summary.remove();
          details.replaceWith('\n**' + summaryText + ':**\n' + details.innerText.trim() + '\n');
        });
      }

      if (mode === 'text') {
        root.querySelectorAll('dl').forEach(dl => {
          let text = '\n';
          Array.from(dl.children).forEach(child => {
            if (child.tagName === 'DT') text += child.innerText.trim() + ':\n';
            else if (child.tagName === 'DD') text += '  ' + child.innerText.trim() + '\n';
          });
          dl.replaceWith(text);
        });
      }

      // Output generieren
      let output = '';
      switch (mode) {
        case 'text':
          output = root.innerText.trim();
          break;
        case 'html':
          output = root.innerHTML.replace(/>\s+</g, '>\n<').trim();
          break;
        case 'json': {
          const tables = [];
          root.querySelectorAll('table').forEach(table => {
            const rows = Array.from(table.querySelectorAll('tr'));
            if (rows.length === 0) return;
            const headers = Array.from(rows[0].querySelectorAll('th, td')).map(c => c.innerText.trim());
            const data = [];
            for (let i = 1; i < rows.length; i++) {
              const cells = Array.from(rows[i].querySelectorAll('th, td'));
              const obj = {};
              cells.forEach((c, j) => { obj[headers[j] || 'col_' + j] = c.innerText.trim(); });
              data.push(obj);
            }
            tables.push({ headers, rows: data });
            table.remove();
          });
          const treeToJSON = (node) => {
            const result = { tag: node.tagName?.toLowerCase() };
            const text = node.innerText?.trim();
            if (text && text.length <= 200) result.text = text;
            const children = Array.from(node.children).map(treeToJSON).filter(c => c.tag);
            if (children.length > 0) result.children = children;
            return result;
          };
          const jsonOut = { content: treeToJSON(root) };
          if (tables.length > 0) jsonOut.tables = tables;
          output = JSON.stringify(jsonOut, null, 2);
          break;
        }
        case 'markdown': {
          const walk = (node) => {
            let md = '';
            Array.from(node.childNodes).forEach(child => {
              if (child.nodeType === Node.TEXT_NODE) {
                const t = child.textContent.trim();
                if (t) md += t + ' ';
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                const tag = child.tagName.toLowerCase();
                const t = child.innerText?.trim();
                if (/^h[1-6]$/.test(tag)) md += '\n' + '#'.repeat(parseInt(tag[1])) + ' ' + t + '\n\n';
                else if (tag === 'p') md += t + '\n\n';
                else if (tag === 'li') md += '- ' + t + '\n';
                else if (tag === 'ul' || tag === 'ol') md += '\n' + walk(child) + '\n';
                else if (tag === 'blockquote') md += '\n> ' + t + '\n\n';
                else if (tag === 'pre' || tag === 'code') md += '\n```\n' + t + '\n```\n\n';
                else if (tag === 'strong' || tag === 'b') md += '**' + t + '**';
                else if (tag === 'em' || tag === 'i') md += '*' + t + '*';
                else if (tag === 'br') md += '\n';
                else if (tag === 'hr') md += '\n---\n\n';
                else md += walk(child);
              }
            });
            return md;
          };
          output = walk(root);
          break;
        }
      }

      if (config.normalizeSpaces) {
        output = output.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').replace(/^ +/gm, '').trim();
      }

      if (config.maxChars && output.length > config.maxChars) {
        output = output.substring(0, config.maxChars) + '\n\n[... ' + (chrome.i18n.getMessage('statusTruncated') || 'truncated') + ' @ ' + config.maxChars + ']';
      }

      return output;
    }
  };
})();
