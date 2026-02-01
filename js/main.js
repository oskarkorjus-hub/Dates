/* ========================================
   SUNKISSED — Main JavaScript
   ======================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const header = document.getElementById('header');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  const heroContent = document.querySelector('.hero__content');
  const heroScroll = document.querySelector('.hero__scroll');
  const heroSection = document.getElementById('hero');

  // --- Scroll: header state + hero parallax ---
  const SCROLL_THRESHOLD = 50;

  function onScroll() {
    const scrollY = window.scrollY;

    // Header background
    if (scrollY > SCROLL_THRESHOLD) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }

    // Hero parallax — only while hero is in view
    if (heroSection && heroContent) {
      const heroHeight = heroSection.offsetHeight;
      if (scrollY < heroHeight) {
        const offset = scrollY * 0.3;
        const opacity = 1 - scrollY / heroHeight;
        heroContent.style.transform = `translateY(${offset}px)`;
        heroContent.style.opacity = Math.max(opacity, 0);
      }
    }

    // Fade out scroll indicator
    if (heroScroll) {
      heroScroll.style.opacity = scrollY > 100 ? '0' : '';
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // set initial state

  // --- Mobile menu toggle ---
  function openMenu() {
    navMenu.classList.add('is-open');
    navToggle.classList.add('is-active');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
  }

  function closeMenu() {
    navMenu.classList.remove('is-open');
    navToggle.classList.remove('is-active');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }

  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.contains('is-open');
    isOpen ? closeMenu() : openMenu();
  });

  // --- Smooth scroll for anchor links (closes mobile menu) ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        closeMenu();

        const headerHeight = header.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  });

  // --- Close mobile menu on Escape key ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
      closeMenu();
    }
  });

  // --- Testimonials slider ---
  const slider = document.getElementById('slider');
  const sliderTrack = slider ? slider.querySelector('.slider__track') : null;
  const sliderDots = document.getElementById('sliderDots');
  const slides = sliderTrack ? Array.from(sliderTrack.children) : [];
  let currentSlide = 0;
  let autoplayTimer = null;
  const AUTOPLAY_DELAY = 5000;

  function getVisibleCount() {
    if (window.innerWidth >= 1024) return slides.length; // all visible
    if (window.innerWidth >= 768) return 2;
    return 1;
  }

  function getMaxSlide() {
    return Math.max(0, slides.length - getVisibleCount());
  }

  function buildDots() {
    if (!sliderDots) return;
    sliderDots.innerHTML = '';
    const count = getMaxSlide() + 1;
    if (count <= 1) { sliderDots.style.display = 'none'; return; }
    sliderDots.style.display = '';
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.className = 'slider__dot' + (i === currentSlide ? ' is-active' : '');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i));
      sliderDots.appendChild(dot);
    }
  }

  function updateDots() {
    if (!sliderDots) return;
    const dots = sliderDots.querySelectorAll('.slider__dot');
    dots.forEach((d, i) => d.classList.toggle('is-active', i === currentSlide));
  }

  function goToSlide(index) {
    const max = getMaxSlide();
    currentSlide = Math.max(0, Math.min(index, max));
    if (!sliderTrack || slides.length === 0) return;

    const visible = getVisibleCount();
    if (visible >= slides.length) {
      sliderTrack.style.transform = 'translateX(0)';
    } else {
      // Calculate offset based on slide width + gap
      const style = getComputedStyle(sliderTrack);
      const gap = parseFloat(style.gap) || 0;
      const slideWidth = slides[0].offsetWidth;
      const offset = currentSlide * (slideWidth + gap);
      sliderTrack.style.transform = `translateX(-${offset}px)`;
    }
    updateDots();
  }

  function nextSlide() {
    const max = getMaxSlide();
    if (max <= 0) return;
    goToSlide(currentSlide >= max ? 0 : currentSlide + 1);
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(nextSlide, AUTOPLAY_DELAY);
  }

  function stopAutoplay() {
    if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
  }

  if (slider && slides.length > 0) {
    buildDots();
    goToSlide(0);
    startAutoplay();

    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);

    // Touch swipe support
    let touchStartX = 0;
    slider.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      stopAutoplay();
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? goToSlide(currentSlide + 1) : goToSlide(currentSlide - 1);
      }
      startAutoplay();
    }, { passive: true });

    // Rebuild on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        buildDots();
        goToSlide(Math.min(currentSlide, getMaxSlide()));
      }, 150);
    });
  }

  // --- Email signup form ---
  const signupForm = document.getElementById('signupForm');
  const signupEmail = document.getElementById('signupEmail');
  const signupError = document.getElementById('signupError');
  const signupSuccess = document.getElementById('signupSuccess');

  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = signupEmail.value.trim();

      // Reset state
      signupError.textContent = '';
      signupEmail.classList.remove('has-error');
      signupSuccess.classList.remove('is-visible');

      // Validate
      if (!email) {
        signupError.textContent = 'Please enter your email address.';
        signupEmail.classList.add('has-error');
        signupEmail.focus();
        return;
      }

      if (!email.includes('@') || !email.includes('.') || email.indexOf('@') > email.lastIndexOf('.') - 1) {
        signupError.textContent = 'Please enter a valid email address.';
        signupEmail.classList.add('has-error');
        signupEmail.focus();
        return;
      }

      // Success — TODO: connect to Klaviyo / Mailchimp
      signupForm.style.display = 'none';
      signupSuccess.classList.add('is-visible');
    });

    // Clear error on input
    signupEmail.addEventListener('input', () => {
      if (signupEmail.classList.contains('has-error')) {
        signupEmail.classList.remove('has-error');
        signupError.textContent = '';
      }
    });
  }

  // --- Scroll-triggered animation observer ---
  const animatedElements = document.querySelectorAll('[data-animate]');

  if (animatedElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
    });

    animatedElements.forEach(el => observer.observe(el));
  }

});
