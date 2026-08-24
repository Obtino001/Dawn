  class MaPredictiveSearch extends HTMLElement {
    constructor() {
      super();

      this.input = this.querySelector('input[type="search"]');
      this.predictiveSearchResults = this.querySelector('#ma-predictive-search-results-container');

      if (this.input) {
        this.input.addEventListener('input', this.debounce((event) => {
          this.onChange(event);
        }, 300).bind(this));
      }
      
      this.reset();
    }

    onChange() {
      const searchTerm = this.input.value.trim();

      if (!searchTerm.length) {
        this.close();
        return;
      }

      this.getSearchResults(searchTerm);
    }

    getSearchResults(searchTerm) {
      fetch(`${routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&section_id=predictive-search`)
        .then((response) => {
          if (!response.ok) {
            const error = new Error(response.status);
            this.close();
            throw error;
          }

          return response.text();
        })
        .then((text) => {
          const resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector('#shopify-section-predictive-search').innerHTML;
          this.predictiveSearchResults.innerHTML = resultsMarkup;
          this.open();
        })
        .catch((error) => {
          this.close();
          throw error;
        });
    }

    reset() {
      const clearBtn = this.querySelector('.ma-search-clear-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.input.value = "";
          this.onChange();
        });
      }
    }

    open() {
      const upsell = this.querySelector('.ma-search-upsell-container');
      const results = this.querySelector('.ma-search-dynamic-results');
      if (upsell) upsell.style.display = 'none';
      if (results) results.style.display = 'flex';
      const clearBtn = this.querySelector('.ma-search-clear-btn');
      if (clearBtn) clearBtn.style.display = 'flex';
    }

    close() {
      const upsell = this.querySelector('.ma-search-upsell-container');
      const results = this.querySelector('.ma-search-dynamic-results');
      if (upsell) upsell.style.display = 'flex';
      if (results) results.style.display = 'none';
      const clearBtn = this.querySelector('.ma-search-clear-btn');
      if (clearBtn) clearBtn.style.display = 'none';
    }

    debounce(fn, wait) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    }
  }

  if (!customElements.get('ma-predictive-search')) {
    customElements.define('ma-predictive-search', MaPredictiveSearch);
  }

if (document.getElementById('ma-search-input')) {
  let mainSearchElement = document.querySelector('ma-predictive-search, predictive-search');

  function openSearch() {
    if (!mainSearchElement) return;
    mainSearchElement.style.display = 'flex';
    document.body.classList.add('ma-search-open');
    setTimeout(() => {
      mainSearchElement.classList.add('ma-is-active');
      setTimeout(() => {
        document.getElementById('ma-search-input')?.focus();
      }, 200);
    }, 10);
  }

  function closeSearch() {
    if (!mainSearchElement) return;
    mainSearchElement.classList.remove('ma-is-active');
    document.body.classList.remove('ma-search-open');
    setTimeout(() => {
      mainSearchElement.style.display = 'none';
      const input = document.getElementById('ma-search-input');
      if (input) input.value = '';
    }, 310);
  }

  const closeBtn = document.querySelector('.ma-search-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);

  document.body.addEventListener('click', (e) => {
    if (document.body.classList.contains('ma-search-open') && e.target === document.body) {
      closeSearch();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('ma-search-open')) {
      closeSearch();
    }
  });
}

function redirectToSearch() {
  const searchValue = document.getElementById('ma-search-input')?.value.trim();
  if (searchValue?.length) {
    window.location.href = `/search?q=${encodeURIComponent(searchValue)}`;
  }
}
