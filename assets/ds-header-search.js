/**
 * Lightweight trending slider for Derma Space–style search panel.
 * Uses native horizontal scroll + pagination dots.
 */
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

function setDsHeaderHeight() {
  const header = document.querySelector('.section-header');
  if (!header) return;
  document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
}

function initDsSearchEnhancements() {
  setDsHeaderHeight();

  document.querySelectorAll('[data-ds-trending-slider]').forEach((el) => {
    if (el.dataset.dsSliderReady) return;
    el.dataset.dsSliderReady = 'true';
    new DsTrendingSlider(el);
  });
}

document.addEventListener('DOMContentLoaded', initDsSearchEnhancements);
window.addEventListener('resize', setDsHeaderHeight);

// Re-init when search opens (details toggle) so widths are correct
document.querySelectorAll('.ds-header-search details').forEach((details) => {
  details.addEventListener('toggle', () => {
    if (details.open) {
      setDsHeaderHeight();
      requestAnimationFrame(initDsSearchEnhancements);
      const input = details.querySelector('.ds-search-form__input');
      if (input) setTimeout(() => input.focus(), 50);
    }
  });
});
