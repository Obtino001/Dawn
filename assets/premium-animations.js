/**
 * Premium Animations & Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Page Load Animation
  document.body.classList.add('premium-loading');
  
  // Wait a small frame for paint, then reveal
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.body.classList.remove('premium-loading');
      document.body.classList.add('premium-loaded');
    }, 100);
  });

  // 2. Scroll Reveals - Dynamically attach to common Dawn theme elements
  const revealElements = document.querySelectorAll(`
    .card-wrapper,
    .collection-list__item,
    .article-card,
    .banner__content,
    .rich-text__blocks > *,
    .image-with-text__text-item > *,
    .multicolumn-card
  `);

  // Add the base reveal classes to these elements dynamically so we don't have to edit every liquid file
  revealElements.forEach((el, index) => {
    // Skip if it already has an animation
    if (el.classList.contains('scroll-trigger')) return;
    
    el.classList.add('premium-reveal', 'premium-reveal-up');
    
    // Add staggered delay if it's inside a grid
    if (el.closest('.grid') || el.closest('.slider')) {
      el.style.transitionDelay = `${(index % 4) * 100}ms`;
    }
  });

  // Intersection Observer for scroll animations
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.1
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        // Optional: stop observing once revealed to keep it visible
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.premium-reveal').forEach(el => {
    revealObserver.observe(el);
  });

  // 3. Header Scroll Effect
  const headerWrapper = document.querySelector('.header-wrapper');
  if (headerWrapper) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        headerWrapper.classList.add('is-scrolled');
      } else {
        headerWrapper.classList.remove('is-scrolled');
      }
    }, { passive: true });
  }

  // 4. Magnetic Buttons
  const buttons = document.querySelectorAll('.button, .btn, .sl-card-add-btn');
  
  buttons.forEach(button => {
    button.addEventListener('mousemove', (e) => {
      const position = button.getBoundingClientRect();
      const x = e.clientX - position.left - position.width / 2;
      const y = e.clientY - position.top - position.height / 2;
      
      // Calculate pull strength (smaller divider = stronger pull)
      button.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.02)`;
    });

    button.addEventListener('mouseleave', () => {
      // Reset transform when mouse leaves
      button.style.transform = 'translate(0px, 0px) scale(1)';
    });
  });
});
