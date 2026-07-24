/**
 * Derma Space–style search: stable under-header panel + smooth height animation.
 * Avoids flicker by freezing header position and scroll-locking without layout jump.
 */

const DS_SEARCH_DURATION = 360;

function getHeaderEl() {
  return document.querySelector('.section-header');
}

function getHeaderGroupEl() {
  return (
    document.querySelector('.shopify-section-group-header-group') ||
    document.querySelector('#shopify-section-group-header-group') ||
    document.querySelector('[id*="header-group"]')
  );
}

/**
 * Collect every bar that can sit above the page (announcements + main header).
 * Supports 0–N announcement bars, sticky or normal.
 */
function getHeaderStackItems() {
  const items = [];
  const seen = new Set();
  const group = getHeaderGroupEl();

  const sections = group
    ? Array.from(group.querySelectorAll(':scope > .shopify-section'))
    : Array.from(
        document.querySelectorAll(
          '.announcement-bar-section, .shopify-section-announcement-bar, [id*="announcement"], .section-header'
        )
      );

  sections.forEach((section) => {
    if (!section || seen.has(section)) return;
    seen.add(section);

    const el =
      section.querySelector('sticky-header') ||
      section.querySelector('.header-wrapper') ||
      section.querySelector('.utility-bar') ||
      section.querySelector('.announcement-bar') ||
      section;

    items.push({
      section,
      el,
      isHeader: section.classList.contains('section-header'),
    });
  });

  const header = getHeaderEl();
  if (header && !seen.has(header)) {
    items.push({
      section: header,
      el: header.querySelector('sticky-header, .header-wrapper') || header,
      isHeader: true,
    });
  }

  return items;
}

/**
 * Bottom of the contiguous top stack (all visible announcement bars + header).
 * Handles 0–N announcement bars, sticky/non-sticky, and scrolled-away bars.
 */
function getSearchPanelTop() {
  const items = getHeaderStackItems();
  if (!items.length) return 0;

  const rects = items
    .map((item) => {
      const rect = item.el.getBoundingClientRect();
      const sectionRect = item.section.getBoundingClientRect();
      // Use whichever box is actually visible in the top chrome
      const useRect =
        rect.height > 1 ? rect : sectionRect.height > 1 ? sectionRect : null;
      if (!useRect || useRect.bottom <= 0) return null;
      return { ...item, rect: useRect };
    })
    .filter(Boolean)
    .sort((a, b) => a.rect.top - b.rect.top);

  if (!rects.length) return 0;

  // Contiguous stack starting from viewport top (or first bar near top)
  let stackBottom = 0;
  let started = false;

  for (const { rect } of rects) {
    if (!started) {
      // Accept first bar that is at/near the top of the viewport
      if (rect.top <= 8) {
        started = true;
        stackBottom = rect.bottom;
      }
      continue;
    }

    // Continue stack while bars are stacked on each other
    if (rect.top <= stackBottom + 6) {
      stackBottom = Math.max(stackBottom, rect.bottom);
    } else {
      break;
    }
  }

  // Fallback: use main header bottom, or lowest visible stack item
  if (!started || stackBottom <= 0) {
    const headerItem = rects.find((item) => item.isHeader) || rects[rects.length - 1];
    stackBottom = headerItem.rect.bottom;
  }

  return Math.max(0, Math.round(stackBottom));
}

function isDsSearchOpen() {
  return Boolean(document.querySelector('details-modal.ds-header-search details[open]'));
}

function getScrollbarWidth() {
  return window.innerWidth - document.documentElement.clientWidth;
}

function lockBodyScroll() {
  if (document.body.dataset.dsScrollLocked === 'true') return;

  const scrollY = window.scrollY || window.pageYOffset;
  const scrollbar = getScrollbarWidth();

  document.body.dataset.dsScrollLocked = 'true';
  document.body.dataset.dsScrollY = String(scrollY);
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'relative';
  if (scrollbar > 0) {
    document.body.style.paddingRight = `${scrollbar}px`;
  }
}

function unlockBodyScroll() {
  if (document.body.dataset.dsScrollLocked !== 'true') return;

  const scrollY = parseInt(document.body.dataset.dsScrollY || '0', 10);

  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.paddingRight = '';
  delete document.body.dataset.dsScrollLocked;
  delete document.body.dataset.dsScrollY;

  window.scrollTo(0, scrollY);
}

function pinHeaderForSearch() {
  const header = getHeaderEl();
  if (!header) return;

  header.classList.add('ds-search-header-pinned');
  header.classList.remove('shopify-section-header-hidden');
  header.classList.remove('animate');

  // Keep natural stacking with announcement bars — do not force sticky.
  // Sticky state is left as-is from scroll behavior.
}

function unpinHeaderForSearch() {
  const header = getHeaderEl();
  if (!header) return;
  header.classList.remove('ds-search-header-pinned');
}

function placePanelUnderHeader(panel) {
  if (!panel) return 0;

  const top = getSearchPanelTop();
  panel.style.top = `${top}px`;
  document.documentElement.style.setProperty('--ds-search-top', `${top}px`);
  return top;
}

function getSearchPanelMaxHeight(panelTop) {
  const top =
    typeof panelTop === 'number'
      ? panelTop
      : parseFloat(panel?.style?.top) || 0;
  return Math.max(180, window.innerHeight - top);
}

function expandSearchPanel(panel) {
  if (!panel) return;

  const top = placePanelUnderHeader(panel);
  const maxHeight = getSearchPanelMaxHeight(top);

  panel.classList.add('is-open', 'is-animating');
  panel.style.visibility = 'visible';
  panel.style.pointerEvents = 'auto';
  panel.style.overflow = 'hidden';
  panel.style.maxHeight = 'none';
  panel.style.height = '0px';

  // Measure full content height while at 0 (scrollHeight still works)
  const contentHeight = panel.scrollHeight;
  const target = Math.min(contentHeight, maxHeight);

  // Force reflow, then animate
  // eslint-disable-next-line no-unused-expressions
  panel.offsetHeight;

  panel.style.transition = `height ${DS_SEARCH_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`;
  panel.style.height = `${target}px`;

  const onEnd = (event) => {
    if (event.target !== panel || event.propertyName !== 'height') return;
    panel.removeEventListener('transitionend', onEnd);
    panel.style.transition = '';
    panel.style.height = 'auto';
    panel.style.maxHeight = `${maxHeight}px`;
    panel.style.overflow = 'hidden';
    panel.classList.remove('is-animating');
  };

  panel.addEventListener('transitionend', onEnd);
  setTimeout(() => {
    if (!panel.classList.contains('is-animating')) return;
    panel.style.transition = '';
    panel.style.height = 'auto';
    panel.style.maxHeight = `${maxHeight}px`;
    panel.classList.remove('is-animating');
  }, DS_SEARCH_DURATION + 60);
}

function collapseSearchPanel(panel) {
  return new Promise((resolve) => {
    if (!panel) {
      resolve();
      return;
    }

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      panel.removeEventListener('transitionend', onEnd);
      panel.classList.remove('is-open', 'is-animating');
      panel.style.height = '0px';
      panel.style.maxHeight = '';
      panel.style.overflow = 'hidden';
      panel.style.transition = '';
      panel.style.visibility = 'hidden';
      panel.style.pointerEvents = 'none';
      panel.style.top = '';
      resolve();
    };

    const onEnd = (event) => {
      if (event.target !== panel || event.propertyName !== 'height') return;
      finish();
    };

    // Lock current pixel height before collapsing (needed when height is "auto")
    const currentHeight = panel.getBoundingClientRect().height;
    panel.classList.add('is-animating');
    panel.style.maxHeight = 'none';
    panel.style.overflow = 'hidden';
    panel.style.height = `${currentHeight}px`;

    // Force reflow
    // eslint-disable-next-line no-unused-expressions
    panel.offsetHeight;

    panel.style.transition = `height ${DS_SEARCH_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    panel.style.height = '0px';

    panel.addEventListener('transitionend', onEnd);
    setTimeout(finish, DS_SEARCH_DURATION + 80);
  });
}

class DsTrendingSlider {
  constructor(root) {
    this.root = root;
    this.track = root.querySelector('[data-ds-trending-track]');
    this.dotsWrap = root.querySelector('[data-ds-trending-dots]');
    this.slides = Array.from(root.querySelectorAll('.ds-trending-slide'));
    this.activeIndex = 0;

    if (!this.track || this.slides.length === 0) return;

    this.setupDots();
    this.track.addEventListener('scroll', () => this.onScroll(), { passive: true });
    window.addEventListener('resize', () => this.setupDots());
  }

  setupDots() {
    if (!this.dotsWrap) return;

    const visible = this.getVisibleCount();
    const pages = Math.max(1, this.slides.length - visible + 1);

    if (pages <= 1) {
      this.dotsWrap.hidden = true;
      this.dotsWrap.innerHTML = '';
      return;
    }

    this.dotsWrap.hidden = false;
    this.dotsWrap.innerHTML = '';

    for (let i = 0; i < pages; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-trending-slider__dot' + (i === this.activeIndex ? ' is-active' : '');
      btn.setAttribute('aria-label', `Slide ${i + 1}`);
      btn.addEventListener('click', () => this.goTo(i));
      this.dotsWrap.appendChild(btn);
    }
  }

  getVisibleCount() {
    if (!this.slides[0]) return 1;
    const slideWidth = this.slides[0].getBoundingClientRect().width;
    if (!slideWidth) return 1;
    return Math.max(1, Math.round(this.track.clientWidth / slideWidth));
  }

  goTo(index) {
    const slide = this.slides[index];
    if (!slide) return;
    this.track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
    this.setActive(index);
  }

  onScroll() {
    if (!this.slides[0]) return;
    const slideWidth = this.slides[0].offsetWidth + 8;
    const index = Math.round(this.track.scrollLeft / slideWidth);
    this.setActive(index);
  }

  setActive(index) {
    this.activeIndex = Math.max(0, Math.min(index, this.slides.length - 1));
    if (!this.dotsWrap) return;
    this.dotsWrap.querySelectorAll('.ds-trending-slider__dot').forEach((dot, i) => {
      dot.classList.toggle('is-active', i === this.activeIndex);
    });
  }
}

function initDsTrendingSliders() {
  document.querySelectorAll('[data-ds-trending-slider]').forEach((el) => {
    if (el.dataset.dsSliderReady) return;
    el.dataset.dsSliderReady = 'true';
    new DsTrendingSlider(el);
  });
}

function bindDsSearchCollapse(modal) {
  if (modal.dataset.dsCollapseBound) return;
  modal.dataset.dsCollapseBound = 'true';

  const details = modal.querySelector('details');
  const panel = modal.querySelector('.ds-search-panel');
  if (!details || !panel) return;

  const originalOpen = modal.open.bind(modal);
  const originalClose = modal.close.bind(modal);

  modal.open = function dsAnimatedOpen(event) {
    pinHeaderForSearch();
    placePanelUnderHeader(panel);
    lockBodyScroll();

    originalOpen(event);

    // Replace Dawn's overflow-hidden (causes scrollbar jump / header flicker)
    document.body.classList.remove('overflow-hidden');
    lockBodyScroll();
  };

  modal.close = function dsAnimatedClose(focusToggle = true) {
    if (modal.dataset.dsClosing === 'true') return;

    if (!details.open) {
      unlockBodyScroll();
      unpinHeaderForSearch();
      originalClose(focusToggle);
      return;
    }

    modal.dataset.dsClosing = 'true';

    collapseSearchPanel(panel).then(() => {
      originalClose(focusToggle);
      document.body.classList.remove('overflow-hidden');
      unlockBodyScroll();
      unpinHeaderForSearch();
      delete modal.dataset.dsClosing;
    });
  };

  // Close button was bound to Dawn's original close in the constructor — intercept it
  const closeBtn = modal.querySelector('.ds-search-form__close');
  if (closeBtn) {
    closeBtn.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        modal.close();
      },
      true
    );
  }

  details.addEventListener('toggle', () => {
    if (!details.open) return;

    placePanelUnderHeader(panel);
    // Remeasure after layout/sticky settles (multi announcement bars)
    requestAnimationFrame(() => {
      placePanelUnderHeader(panel);
      expandSearchPanel(panel);
      initDsTrendingSliders();
      requestAnimationFrame(() => placePanelUnderHeader(panel));
    });

    const input = details.querySelector('.ds-search-form__input');
    if (input) setTimeout(() => input.focus(), 40);
  });
}

function initDsSearchEnhancements() {
  initDsTrendingSliders();
  document.querySelectorAll('details-modal.ds-header-search').forEach(bindDsSearchCollapse);
}

document.addEventListener('DOMContentLoaded', initDsSearchEnhancements);

window.addEventListener(
  'resize',
  () => {
    if (!isDsSearchOpen()) return;
    document.querySelectorAll('.ds-search-panel.is-open').forEach((panel) => {
      const top = placePanelUnderHeader(panel);
      if (!panel.classList.contains('is-animating')) {
        panel.style.maxHeight = `${getSearchPanelMaxHeight(top)}px`;
      }
    });
  },
  { passive: true }
);

// Expose for sticky-header to skip hide/reveal while search is open
window.dsSearchIsOpen = isDsSearchOpen;
