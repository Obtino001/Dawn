/**
 * Derma Space–style search: height collapse animation + trending slider.
 */

const DS_SEARCH_DURATION = 380;

function setDsHeaderHeight() {
  const header = document.querySelector('.section-header');
  if (!header) return;
  // Use visible bottom edge so panel sits exactly under the header
  const bottom = Math.round(header.getBoundingClientRect().bottom);
  document.documentElement.style.setProperty('--header-height', `${Math.max(0, bottom)}px`);
}

function getSearchPanelMaxHeight() {
  const headerBottom = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--header-height')
  ) || 0;
  return Math.max(200, window.innerHeight - headerBottom);
}

function expandSearchPanel(panel) {
  if (!panel) return;

  panel.classList.add('is-animating', 'is-open');
  panel.style.overflow = 'hidden';
  panel.style.height = '0px';
  panel.style.opacity = '1';
  panel.style.visibility = 'visible';
  panel.style.pointerEvents = 'auto';

  // Force reflow before animating to measured height
  // eslint-disable-next-line no-unused-expressions
  panel.offsetHeight;

  const target = Math.min(panel.scrollHeight, getSearchPanelMaxHeight());
  panel.style.transition = `height ${DS_SEARCH_DURATION}ms ease`;
  panel.style.height = `${target}px`;

  const onEnd = (event) => {
    if (event.propertyName !== 'height') return;
    panel.removeEventListener('transitionend', onEnd);
    panel.style.height = '';
    panel.style.maxHeight = `${getSearchPanelMaxHeight()}px`;
    panel.style.overflow = 'hidden';
    panel.style.transition = '';
    panel.classList.remove('is-animating');
  };

  panel.addEventListener('transitionend', onEnd);
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
      panel.style.height = '';
      panel.style.maxHeight = '';
      panel.style.overflow = '';
      panel.style.transition = '';
      panel.style.visibility = '';
      panel.style.pointerEvents = '';
      panel.style.opacity = '';
      resolve();
    };

    const onEnd = (event) => {
      if (event.propertyName !== 'height') return;
      finish();
    };

    panel.classList.add('is-animating');
    panel.style.overflow = 'hidden';
    panel.style.height = `${panel.scrollHeight}px`;

    // Force reflow
    // eslint-disable-next-line no-unused-expressions
    panel.offsetHeight;

    panel.style.transition = `height ${DS_SEARCH_DURATION}ms ease`;
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

  // Smooth close: animate height to 0, then run original close
  const originalClose = modal.close.bind(modal);
  modal.close = function dsAnimatedClose(focusToggle = true) {
    if (modal.dataset.dsClosing === 'true') return;
    if (!details.open) {
      originalClose(focusToggle);
      return;
    }

    modal.dataset.dsClosing = 'true';
    collapseSearchPanel(panel).then(() => {
      originalClose(focusToggle);
      delete modal.dataset.dsClosing;
    });
  };

  details.addEventListener('toggle', () => {
    if (!details.open) return;

    setDsHeaderHeight();
    expandSearchPanel(panel);
    requestAnimationFrame(initDsTrendingSliders);

    const input = details.querySelector('.ds-search-form__input');
    if (input) setTimeout(() => input.focus(), 60);
  });
}

function initDsSearchEnhancements() {
  setDsHeaderHeight();
  initDsTrendingSliders();
  document.querySelectorAll('details-modal.ds-header-search').forEach(bindDsSearchCollapse);
}

document.addEventListener('DOMContentLoaded', initDsSearchEnhancements);
window.addEventListener('resize', setDsHeaderHeight);
window.addEventListener('scroll', setDsHeaderHeight, { passive: true });
