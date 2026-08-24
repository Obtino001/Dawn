class MaSlider extends HTMLElement {
  constructor() {
    super();
    this.observer = null;
    this.swiper = null;
  }

  connectedCallback() {
    this.init();
    this.observeChanges();
  }

  disconnectedCallback() {
    if (this.observer) this.observer.disconnect();
    if (this.swiper) this.swiper.destroy();
  }

  observeChanges() {
    this.observer = new MutationObserver((mutations) => {
      const swiperEl = this.querySelector('.js-swiper-template');
      if (swiperEl && !swiperEl.classList.contains('swiper-initialized')) {
        this.init();
      }
    });
    this.observer.observe(this, { childList: true, subtree: true });
  }

  init() {
    const swiperEl = this.querySelector('.js-swiper-template');
    if (!swiperEl || swiperEl.classList.contains('swiper-initialized')) return;

    if (typeof Swiper === 'undefined') {
        console.warn('Swiper JS not loaded');
        return;
    }

    const config = this.getConfig(swiperEl);
    if (!config) return;

    const params = {
      slidesPerView: config.mobileSlides,
      spaceBetween: config.mobileSpacing,
      loop: false,
      breakpoints: {
        990: {
          slidesPerView: config.tabletSlides,
          spaceBetween: config.desktopSpacing,
        },
        1024: {
          slidesPerView: config.desktopSlides,
          spaceBetween: config.desktopSpacing,
        }
      },
      navigation: {
        nextEl: this.querySelector('.swiper-custom-next'),
        prevEl: this.querySelector('.swiper-custom-prev')
      },
      on: {
        init: (swiper) => this.updateProgress(swiper),
        slideChange: (swiper) => this.updateProgress(swiper),
        progress: (swiper) => this.updateProgress(swiper)
      }
    };

    // --- NEW: Add Pagination Config ---
    const paginationEl = this.querySelector('.swiper-custom-pagination');
    if (paginationEl) {
        params.pagination = {
            el: paginationEl,
            clickable: true,
            type: 'bullets', // Change to 'fraction' if you want numbers
        };
    }

    // Scrollbar Config
    const scrollbarEl = this.querySelector('.swiper-custom-scrollbar');
    if (scrollbarEl) {
      params.scrollbar = {
        el: scrollbarEl,
        draggable: true,
        hide: false
      };
    }

    if (config.autoplay) {
      params.autoplay = {
        delay: config.autoplayInterval,
        disableOnInteraction: false
      };
    }

    this.swiper = new Swiper(swiperEl, params);
  }

  getConfig(el) {
    try {
      return JSON.parse(el.dataset.swiperConfig || '{}');
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  updateProgress(swiper) {
    const progressFill = this.querySelector('.swiper-progress-fill');
    if (!progressFill) return;
    
    const percentage = Math.max(0, Math.min(100, swiper.progress * 100));
    progressFill.style.width = `${percentage}%`;
  }
}

customElements.define('ma-slider', MaSlider);



  if (!customElements.get('custom-slider')) {
    
    class CustomSlider extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        this.initSlider();
      }

      initSlider() {
        const swiperEl = this.querySelector('swiper-container');
        if (!swiperEl || !swiperEl.dataset.swiperConfig) return;
        if (swiperEl.part && swiperEl.part.contains('initialized')) return;
        
        let config;
        try {
          config = JSON.parse(swiperEl.dataset.swiperConfig);
        } catch (e) {
          console.error('Invalid Swiper Config JSON', e);
          return;
        }

        const nextBtn = this.querySelector('.swiper-custom-next');
        const prevBtn = this.querySelector('.swiper-custom-prev');
        const paginationEl = this.querySelector('.swiper-custom-pagination');
        const scrollbarEl = this.querySelector('.swiper-custom-scrollbar');
        const progressFill = this.querySelector('.swiper-progress-fill');
        
        const params = {
          slidesPerView: config.mobileSlides,
          spaceBetween: config.mobileSpacing,
          loop: false,
          breakpoints: {
            990: {
              slidesPerView: config.tabletSlides,
              spaceBetween: config.desktopSpacing,
            },
            1024: {
              slidesPerView: config.desktopSlides,
              spaceBetween: config.desktopSpacing,
            }
          }
        };

        if (nextBtn && prevBtn) {
          params.navigation = {
            nextEl: nextBtn,
            prevEl: prevBtn
          };
        }

        if (paginationEl) {
          params.pagination = {
            el: paginationEl,
            clickable: true
          };
        }

        if (scrollbarEl) {
          params.scrollbar = {
            el: scrollbarEl,
            draggable: true,
            hide: false
          };
        }

        if (config.autoplay) {
          params.autoplay = {
            delay: config.autoplayInterval,
            disableOnInteraction: false
          };
        }

        Object.assign(swiperEl, params);

        swiperEl.initialize();
        if (progressFill) {
          swiperEl.addEventListener('swiperprogress', (e) => {
            const [swiper, progress] = e.detail;
            const percentage = Math.max(0, Math.min(100, progress * 100));
            progressFill.style.width = `${percentage}%`;
          });
          
          swiperEl.addEventListener('swiperslidechange', (e) => {
            const [swiper] = e.detail;
            const percentage = Math.max(0, Math.min(100, swiper.progress * 100));
            progressFill.style.width = `${percentage}%`;
          });
        }
      }
    }

    customElements.define('custom-slider', CustomSlider);
}

  class FAQItem extends HTMLElement {
  constructor() {
    super();
    this.handleToggle = this.handleToggle.bind(this);
  }

  connectedCallback() {
    this.question = this.querySelector(".faqrs-question");
    this.answer = this.querySelector(".faqrs-answer");
    if (this.question && this.answer) {
      this.question.addEventListener("click", this.handleToggle);
    }
  }

  disconnectedCallback() {
    if (this.question) {
      this.question.removeEventListener("click", this.handleToggle);
    }
  }

  handleToggle() {
    const isActive = this.classList.contains("faqrs-active");
    const allItems = document.querySelectorAll("faq-item");
    allItems.forEach(item => item.close());
    if (!isActive) {
      this.open();
    }
  }

  open() {
    this.classList.add("faqrs-active");
    this.answer.style.maxHeight = this.answer.scrollHeight + "px";
    this.question.setAttribute("aria-expanded", "true");
  }

  close() {
    this.classList.remove("faqrs-active");
    if(this.answer) {
        this.answer.style.maxHeight = null;
    }
    if(this.question) {
        this.question.setAttribute("aria-expanded", "false");
    }
  }
}
customElements.define("faq-item", FAQItem);


/* --------------------------------------------------------------------------
   Slider Container
   -------------------------------------------------------------------------- */
if (!customElements.get('slider-container')) {
    class SliderContainer extends HTMLElement {
        constructor() {
            super();
            this.swiperInstance = null;
            this._onMediaChange = this._onMediaChange.bind(this);
            this._onVisibility = this._onVisibility.bind(this);
            this._rafId = null;
        }

        connectedCallback() {
            this._rafId = requestAnimationFrame(() => this._setup());
        }

        disconnectedCallback() {
            if (this._rafId) cancelAnimationFrame(this._rafId);
            this._teardownMedia();
            this._teardownVisibility();
            this._destroySlider();
        }

        _setup() {
            this.swiperEl = this.querySelector('.js-slider-template-swiper');
            if (!this.swiperEl) return;

            this.config = this._parseConfig(this.swiperEl);
            if (!this.config) return;

            this._progressFill = this.querySelector('.slider-template-progress-fill');
            this._paginationEl = this.querySelector('.slider-template-pagination');
            this._prevBtn = this.querySelector('.js-slider-template-prev');
            this._nextBtn = this.querySelector('.js-slider-template-next');

            this._mql = window.matchMedia('(max-width: 749px)');
            this._mql.addEventListener('change', this._onMediaChange);
            this._onMediaChange(this._mql);

            if (this.config.autoplay) {
                this._observer = new IntersectionObserver(this._onVisibility, { threshold: 0.25 });
                this._observer.observe(this);
            }
        }

        _onMediaChange(e) {
            const isMobile = e.matches;
            const shouldEnable = isMobile
                ? this.config.enableSliderMobile
                : this.config.enableSliderDesktop;

            if (shouldEnable) {
                this.classList.remove('slider-disabled');
                this._initSlider();
            } else {
                this._destroySlider();
                this.classList.add('slider-disabled');
            }
        }

        _onVisibility(entries) {
            if (!this.swiperInstance || !this.swiperInstance.autoplay) return;

            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    this.swiperInstance.autoplay.start();
                } else {
                    this.swiperInstance.autoplay.stop();
                }
            });
        }

        _teardownMedia() {
            if (this._mql) {
                this._mql.removeEventListener('change', this._onMediaChange);
                this._mql = null;
            }
        }

        _teardownVisibility() {
            if (this._observer) {
                this._observer.disconnect();
                this._observer = null;
            }
        }

        _initSlider() {
            if (this.swiperInstance) return;

            const swiperParams = {
                slidesPerView: this.config.mobileSlides,
                spaceBetween: this.config.mobileSpacing,
                loop: this.config.loop || false,
                grabCursor: true,
                mousewheel: { forceToAxis: true },
                breakpoints: {
                    750: {
                        slidesPerView: this.config.desktopSlides,
                        spaceBetween: this.config.desktopSpacing,
                    },
                },
                on: {
                    init: (swiper) => {
                        this.classList.add('is-initialized');
                        this._updateProgress(swiper);
                    },
                    progress: (swiper) => this._updateProgress(swiper),
                    slideChange: (swiper) => this._updateProgress(swiper),
                    resize: (swiper) => this._updateProgress(swiper),
                },
            };

            if (this._paginationEl) {
                swiperParams.pagination = {
                    el: this._paginationEl,
                    type: 'bullets',
                    clickable: true,
                    dynamicBullets: this.config.desktopSlides > 5,
                };
            }

            if (this._prevBtn && this._nextBtn) {
                swiperParams.navigation = {
                    nextEl: this._nextBtn,
                    prevEl: this._prevBtn,
                };
            }

            if (this.config.autoplay) {
                swiperParams.autoplay = {
                    delay: this.config.autoplayInterval,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                };
            }

            try {
                this.swiperInstance = new Swiper(this.swiperEl, swiperParams);
            } catch (err) {
                console.warn('[slider-container] Swiper init failed:', err);
            }
        }

        _destroySlider() {
            if (!this.swiperInstance) return;

            this.swiperInstance.destroy(true, true);
            this.swiperInstance = null;
            this.classList.remove('is-initialized');

            const wrapper = this.swiperEl?.querySelector('.swiper-wrapper');
            if (wrapper) wrapper.removeAttribute('style');

            this.querySelectorAll('.swiper-slide').forEach((slide) => {
                slide.removeAttribute('style');
            });
        }

        _updateProgress(swiper) {
            if (!this._progressFill) return;
            const total = swiper.slides.length - swiper.params.slidesPerView;
            if (total <= 0) {
                this._progressFill.style.width = '100%';
                return;
            }
            const pct = Math.min(100, (swiper.realIndex / total) * 100);
            this._progressFill.style.width = `${pct}%`;
        }

        _parseConfig(el) {
            try {
                return JSON.parse(el.dataset.swiperConfig || '{}');
            } catch {
                console.warn('[slider-container] Invalid data-swiper-config JSON.');
                return null;
            }
        }
    }

    customElements.define('slider-container', SliderContainer);
}


document.addEventListener("DOMContentLoaded", function() {
  const accordionToggles = document.querySelectorAll(".mobile-accordion-toggle");

  accordionToggles.forEach(function(toggle) {
    toggle.addEventListener("click", function() {
      // Only act on mobile (CSS hides content on mobile)
      if (window.innerWidth >= 750) return;

      // Toggle the active class to flip the arrow
      this.classList.toggle("is-active");

      // Find the content sibling and toggle visibility
      let content = this.nextElementSibling;
      while (content && !content.classList.contains("footer-block__details-content")) {
        content = content.nextElementSibling;
      }
      if (content) {
        content.classList.toggle("is-open");
      }
    });
  });
});