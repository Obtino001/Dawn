if (!customElements.get('ma-quickadd')) {
  class MaQuickAdd extends HTMLElement {
  constructor() {
    super();
    this.selectors = {
      btn: '.ma_quickAdd_atc',
      text: '.ma-span',
      spinner: '.loading-overlay__spinner'
    };
  }

  connectedCallback() {
    this.querySelector(this.selectors.btn)?.addEventListener('click', (e) => this.handleAtc(e));
  }

  async handleAtc(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const variantId = btn.dataset.variantid;
    if (!variantId) return;

    this.toggleLoading(btn, true);

    try {
      const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: variantId, quantity: 1 }],
          sections: "cart-drawer,cart-icon-bubble"
        })
      });

      const data = await response.json();

      if (response.ok) {
          this.updateCart();
        this.openCart();
      } else {
        alert(data.description);
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.toggleLoading(btn, false);
    }
  }

  openCart() {
    document.querySelector('cart-drawer')?.open();
  }

  closeCart() {
    document.querySelector('cart-drawer')?.close();
  }

  async updateCart() {
    try {
      const res = await fetch('/?sections=cart-drawer,cart-icon-bubble');
      const data = await res.json();

      const parsedHTML = new DOMParser().parseFromString(data['cart-drawer'], 'text/html');
      const drawerInner = parsedHTML.querySelector('.drawer__inner');
      const isEmpty = drawerInner?.classList.contains('is-empty');

      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer && !isEmpty) {
        cartDrawer.classList.remove('is-empty');
        cartDrawer.renderContents({
          sections: {
            'cart-drawer': data['cart-drawer'],
            'cart-icon-bubble': data['cart-icon-bubble']
          },
          id: null
        });
      }
    } catch (err) {
      console.error("Error updating cart:", err);
    }
  }

  toggleLoading(btn, isLoading) {
    btn.querySelector(this.selectors.spinner)?.classList.toggle('hidden', !isLoading);
    btn.querySelector(this.selectors.text)?.classList.toggle('hidden', isLoading);
  }
}

customElements.define('ma-quickadd', MaQuickAdd);
}
