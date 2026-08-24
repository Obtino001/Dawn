if (!customElements.get('model-variant-picker')) {
  customElements.define(
    'model-variant-picker',
    class ModelVariantPicker extends HTMLElement {
      connectedCallback() {
        this.inputs = Array.from(this.querySelectorAll('input[type="radio"]'));
        if (this.inputs.length < 8) return;

        const seriesMap = new Map();
        this.inputs.forEach((input) => {
          const series = this.seriesFromLabel(input.value);
          input.dataset.modelSeries = series;
          if (!seriesMap.has(series)) seriesMap.set(series, []);
          seriesMap.get(series).push(input);
        });

        const seriesKeys = this.sortSeries(Array.from(seriesMap.keys()));
        if (seriesKeys.length < 2) return;

        this.seriesNav = this.querySelector('[data-model-series]');
        if (!this.seriesNav) return;

        this.seriesNav.hidden = false;
        this.seriesNav.innerHTML = '';

        seriesKeys.forEach((key) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'model-series__btn';
          btn.dataset.series = key;
          btn.textContent = this.seriesLabel(key);
          btn.addEventListener('click', () => this.showSeries(key));
          this.seriesNav.appendChild(btn);
        });

        const selected = this.inputs.find((input) => input.checked) || this.inputs[0];
        this.showSeries(selected.dataset.modelSeries);

        this.addEventListener('change', (event) => {
          if (event.target.matches('input[type="radio"]')) {
            this.showSeries(event.target.dataset.modelSeries);
          }
        });
      }

      seriesFromLabel(label) {
        const text = String(label || '');
        if (/iphone\s*air/i.test(text)) return 'Air';
        const iphone = text.match(/iphone\s*(\d+)/i);
        if (iphone) return iphone[1];
        const galaxy = text.match(/galaxy\s*s?\s*(\d+)/i);
        if (galaxy) return `S${galaxy[1]}`;
        const pixel = text.match(/pixel\s*(\d+)/i);
        if (pixel) return pixel[1];
        return 'Other';
      }

      seriesLabel(key) {
        if (key === 'Air') return 'iPhone Air';
        if (key === 'Other') return 'Other';
        if (/^S\d+$/.test(key)) return `Galaxy ${key}`;
        if (/^\d+$/.test(key)) return `iPhone ${key}`;
        return key;
      }

      sortSeries(keys) {
        return keys.sort((a, b) => {
          const rank = (key) => {
            if (key === 'Other') return -999;
            if (key === 'Air') return 0.5;
            const num = parseInt(String(key).replace(/\D/g, ''), 10);
            return Number.isNaN(num) ? -1 : num;
          };
          return rank(b) - rank(a);
        });
      }

      showSeries(series) {
        this.inputs.forEach((input) => {
          const label = this.querySelector(`label[for="${input.id}"]`);
          const match = input.dataset.modelSeries === series;
          input.classList.toggle('is-series-hidden', !match);
          if (label) label.classList.toggle('is-series-hidden', !match);
        });

        this.seriesNav.querySelectorAll('.model-series__btn').forEach((btn) => {
          btn.classList.toggle('is-active', btn.dataset.series === series);
        });
      }
    }
  );
}
