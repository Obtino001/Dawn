/**
 * Skin Bay–style multi-level mobile menu panels.
 * Works inside Dawn's <header-drawer> without accordion / overflow lock issues.
 */

(function () {
  const ROOT_ID = 'nlk-panel-root';
  let stack = [ROOT_ID];

  function drawerRoot() {
    return document.querySelector('header-drawer');
  }

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function updateHead() {
    const root = drawerRoot();
    if (!root) return;
    const back = qs('#nlk-back', root);
    const title = qs('#nlk-head-title', root);
    const logo = qs('#nlk-head-logo', root);
    const atRoot = stack.length <= 1;

    if (back) back.classList.toggle('is-visible', !atRoot);
    if (logo) logo.classList.toggle('is-hidden', !atRoot);
    if (title) {
      title.classList.toggle('is-visible', !atRoot);
      if (atRoot) {
        title.textContent = '';
      } else {
        const current = document.getElementById(stack[stack.length - 1]);
        title.textContent = current ? current.getAttribute('data-nlk-title') || '' : '';
      }
    }
  }

  function resetPanels() {
    stack = [ROOT_ID];
    const viewport = document.getElementById('nlk-viewport');
    if (viewport) viewport.classList.remove('is-sub-open');
    qsa('.nlk-drawer .nlk-submenu').forEach((panel) => {
      panel.classList.remove('is-open', 'is-behind');
      panel.scrollTop = 0;
    });
    const rootScroll = qs('.nlk-drawer .nlk-root-scroll');
    if (rootScroll) rootScroll.scrollTop = 0;
    updateHead();
  }

  function openPanel(panelId) {
    const next = document.getElementById(panelId);
    if (!next || !next.classList.contains('nlk-submenu')) return;

    const viewport = document.getElementById('nlk-viewport');
    const currentId = stack[stack.length - 1];

    if (currentId !== ROOT_ID) {
      const current = document.getElementById(currentId);
      if (current) {
        current.classList.remove('is-open');
        current.classList.add('is-behind');
      }
    }

    next.classList.add('is-open');
    next.classList.remove('is-behind');
    next.scrollTop = 0;
    stack.push(panelId);

    if (viewport) viewport.classList.add('is-sub-open');
    updateHead();
  }

  function goBack() {
    if (stack.length <= 1) return;

    const viewport = document.getElementById('nlk-viewport');
    const closingId = stack.pop();
    const closing = document.getElementById(closingId);
    if (closing) closing.classList.remove('is-open', 'is-behind');

    const prevId = stack[stack.length - 1];

    if (prevId === ROOT_ID) {
      if (viewport) viewport.classList.remove('is-sub-open');
      qsa('.nlk-drawer .nlk-submenu.is-behind').forEach((panel) => {
        panel.classList.remove('is-behind');
      });
    } else {
      const prev = document.getElementById(prevId);
      if (prev) {
        prev.classList.add('is-open');
        prev.classList.remove('is-behind');
      }
    }

    updateHead();
  }

  function closeDawnDrawer() {
    const drawer = drawerRoot();
    if (!drawer) return;
    const summary = drawer.querySelector('details > summary');
    if (summary) summary.setAttribute('aria-expanded', 'false');
    if (typeof drawer.closeMenuDrawer === 'function' && summary) {
      drawer.closeMenuDrawer(new Event('click'), summary);
    } else {
      const details = drawer.querySelector('details');
      if (details) {
        details.removeAttribute('open');
        details.classList.remove('menu-opening');
      }
    }
    document.body.classList.remove(
      'overflow-hidden',
      'overflow-hidden-mobile',
      'overflow-hidden-tablet',
      'overflow-hidden-desktop'
    );
    document.querySelector('.section-header')?.classList.remove('menu-open');
    resetPanels();
  }

  function onDrawerClick(event) {
    const trigger = event.target.closest('[data-nlk-open]');
    if (trigger && trigger.closest('.nlk-drawer')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openPanel(trigger.getAttribute('data-nlk-open'));
      return;
    }

    if (event.target.closest('[data-nlk-back]') || event.target.closest('#nlk-back')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      goBack();
      return;
    }

    if (event.target.closest('.nlk-close')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeDawnDrawer();
    }
  }

  function bind() {
    const drawer = drawerRoot();
    if (!drawer || drawer.dataset.nlkBound === 'true') return;
    drawer.dataset.nlkBound = 'true';

    drawer.addEventListener('click', onDrawerClick, true);

    const details = drawer.querySelector('details');
    if (details) {
      details.addEventListener('toggle', () => {
        if (details.open) {
          resetPanels();
        } else {
          resetPanels();
        }
      });
    }

    drawer.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Escape') return;
        if (!details || !details.open) return;
        if (stack.length > 1) {
          event.preventDefault();
          event.stopImmediatePropagation();
          goBack();
        }
      },
      true
    );
  }

  document.addEventListener('DOMContentLoaded', bind);
  document.addEventListener('shopify:section:load', () => {
    const drawer = drawerRoot();
    if (drawer) delete drawer.dataset.nlkBound;
    bind();
  });

  window.nlkResetPanels = resetPanels;
  window.nlkOpenPanel = openPanel;
  window.nlkGoBack = goBack;
})();
