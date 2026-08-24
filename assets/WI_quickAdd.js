class WIquickAdd extends HTMLElement {
  constructor() {
    super();
    // specific selectors stored here for easy maintenance
    this.selectors = {
      mobileBtn: ".WI_mobileQuickViewBtn",
      mobileDrawerMain: ".WI_mobileQuickAddDrawer_main",
      mobileDrawerInner: ".WI_mobileQuickAffDrawer_in",
      mobileDrawerClose: ".WI_mobileQuickAffDrawer_cls",
      mobileDrawerInfo: "wi-quickaddproduct-info",
      loadingOverlay: ".WI_loadingCartItemBlock",
      emptyCartMsg: ".WI_cartDrawerin_cart_empty",
      spinner: ".loading-overlay__spinner",
      btnSpan: ".Ma-span"
    };
  }

  connectedCallback() {
    this.initSingleVariantListeners();
    this.initMobileIconListener();
  }

  /**
   * SECTION 1: Mobile Quick Add Logic
   */
  initMobileIconListener() {
    const mobileBtn = this.querySelector(this.selectors.mobileBtn);
    if (!mobileBtn) return;

    mobileBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      this.openMobileDrawer();
    });
  }

  openMobileDrawer() {
    const drawerInfo = document.querySelector(this.selectors.mobileDrawerInfo);
    const drawerMain = document.querySelector(this.selectors.mobileDrawerMain);
    const drawerInner = document.querySelector(this.selectors.mobileDrawerInner);

    // 1. Inject Content
    // We assume the content is in the immediate next sibling as per original code
    if (this.nextElementSibling) {
      drawerInfo.innerHTML = this.nextElementSibling.innerHTML;
    }

    // 2. Show Drawer
    drawerMain.style.display = "block";
    this.closeCart();

    // 3. Animation delay
    setTimeout(() => {
      drawerInner.classList.add('shOw');
    }, 100);

    // 4. Attach events to the NEW HTML we just injected
    this.setupMobileDrawerEvents(drawerMain, drawerInner, drawerInfo);
  }

  setupMobileDrawerEvents(drawerMain, drawerInner, drawerContainer) {
    // A. Close Button Logic
    const closeBtn = document.querySelector(this.selectors.mobileDrawerClose);
    if (closeBtn) {
      // Remove old listener to prevent duplicates if any existed (though innerHTML rewrite usually kills them)
      closeBtn.replaceWith(closeBtn.cloneNode(true));
      const newCloseBtn = document.querySelector(this.selectors.mobileDrawerClose);

      newCloseBtn.addEventListener("click", () => {
        drawerInner.classList.remove('shOw');
        setTimeout(() => {
          drawerMain.style.display = "none";
        }, 100);
      });
    }

    // B. Add To Cart Button Logic
    const atcBtn = drawerContainer.querySelector(".quickATC");
    if (atcBtn) {
      atcBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        // Find selected variant dynamically at the moment of click
        const selectedInput = drawerContainer.querySelector('.WI_quickAddProduct_options input:checked');
        const variantId = selectedInput ? selectedInput.value : null;

        if (variantId) {
          await this.handleAddToCart(variantId, atcBtn);

          // Close drawer on success
          drawerInner.classList.remove('shOw');
          setTimeout(() => {
            drawerMain.style.display = "none";
          }, 100);
        } else {
          console.warn("No variant selected");
        }
      });
    }
  }

  /**
   * SECTION 2: Desktop/Single Variant Logic
   */
  initSingleVariantListeners() {
    // Handle Dropdown Change
    const selectElement = this.querySelector('.WI_completeLook_options');
    const mainAtcBtn = this.querySelector('.WI_quickAdd_atc');

    if (selectElement && mainAtcBtn) {
      selectElement.addEventListener('change', (e) => {
        mainAtcBtn.setAttribute("data-variantid", e.target.value);
      });
    }

    // Handle ATC Clicks
    this.querySelectorAll(".WI_quickAdd_atc").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const variantId = btn.getAttribute("data-variantid");
        if (variantId) {
          await this.handleAddToCart(variantId, btn);
        }
      });
    });
  }

  /**
   * SECTION 3: Shared Logic (API & UI Utilities)
   */

  // Centralized Add to Cart Logic
  async handleAddToCart(variantId, btnElement) {
    const spinner = btnElement.querySelector(this.selectors.spinner);
    const spanText = btnElement.querySelector(this.selectors.btnSpan);

    // 1. UI Loading State
    if (spinner) spinner.classList.remove('hidden');
    if (spanText) spanText.classList.add('hidden');

    try {
      const formData = {
        items: [{ id: variantId, quantity: 1 }],
      };

      // 2. API Call
      await fetch("/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // 3. UI Update (Cart Drawer)
      this.toggleCartLoadingState(true);
      this.openCart();
      await this.updateCart();

    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      // 4. Reset Button State
      if (spinner) spinner.classList.add('hidden');
      if (spanText) spanText.classList.remove('hidden');
    }
  }

  toggleCartLoadingState(isLoading) {
    const loadingBlock = document.querySelector(this.selectors.loadingOverlay);
    const emptyCart = document.querySelector(this.selectors.emptyCartMsg);

    if (loadingBlock) loadingBlock.style.display = isLoading ? "block" : "none";
    if (emptyCart && isLoading) emptyCart.style.display = "none";
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
}

customElements.define("wi-quickadd", WIquickAdd);