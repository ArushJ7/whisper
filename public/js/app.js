/**
 * WHISPER — Client Application Logic (Warm Editorial Edition)
 * REST API Endpoints:
 *   - GET /api/secrets
 *   - GET /api/secrets/random
 *   - POST /api/secrets
 *   - POST /api/secrets/:id/report
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const randomCard = document.getElementById('random-card');
  const randomSecretText = document.getElementById('random-secret-text');
  const randomSecretId = document.getElementById('random-secret-id');
  const randomSecretDate = document.getElementById('random-secret-date');
  const btnRevealAnother = document.getElementById('btn-reveal-another');
  const btnHeroRead = document.getElementById('btn-hero-read');

  const secretForm = document.getElementById('secret-form');
  const secretTextarea = document.getElementById('secret-text');
  const charCount = document.getElementById('char-count');
  const charCounter = document.getElementById('char-counter');
  const btnSubmit = document.getElementById('btn-submit');
  const inlineNotice = document.getElementById('inline-notice');
  const toastContainer = document.getElementById('toast-container');

  const editorialFeed = document.getElementById('editorial-feed');
  const emptyState = document.getElementById('empty-state');
  const secretsCountText = document.getElementById('secrets-count-text');

  const reportModal = document.getElementById('report-modal');
  const modalSecretId = document.getElementById('modal-secret-id');
  const btnCancelReport = document.getElementById('btn-cancel-report');
  const btnConfirmReport = document.getElementById('btn-confirm-report');

  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');

  let pendingReportId = null;

  init();

  function init() {
    setupEventListeners();
    setupMobileNav();
    setupScrollSpy();
    fetchRandomSecret();
    fetchAllSecrets();
  }

  /* --------------------------------------------------------------------------
     Mobile Navigation & Keyboard Listeners
     -------------------------------------------------------------------------- */
  function setupMobileNav() {
    if (!mobileToggle || !navLinks) return;

    mobileToggle.addEventListener('click', () => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !isExpanded);
      mobileToggle.classList.toggle('active');
      navLinks.classList.toggle('nav-open');
    });

    // Close menu when clicking any nav link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.classList.remove('active');
        navLinks.classList.remove('nav-open');
      });
    });
  }

  function setupScrollSpy() {
    const sections = document.querySelectorAll('section[id], header[id]');
    const navItems = document.querySelectorAll('.nav-link');

    if (!sections.length || !navItems.length) return;

    window.addEventListener('scroll', () => {
      let current = '';
      const scrollPosition = window.scrollY + 200;

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          current = section.getAttribute('id');
        }
      });

      navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${current}`) {
          item.classList.add('active');
        }
      });
    }, { passive: true });
  }

  function setupEventListeners() {
    btnRevealAnother?.addEventListener('click', fetchRandomSecret);
    btnHeroRead?.addEventListener('click', () => {
      fetchRandomSecret();
    });

    secretTextarea?.addEventListener('input', (e) => {
      const length = e.target.value.length;
      if (charCount) charCount.textContent = length;
      
      if (charCounter) {
        if (length > 450) {
          charCounter.className = 'char-counter char-limit-warning';
        } else if (length > 400) {
          charCounter.className = 'char-counter char-limit-near';
        } else {
          charCounter.className = 'char-counter';
        }
      }
    });

    secretForm?.addEventListener('submit', handleFormSubmit);

    btnCancelReport?.addEventListener('click', closeReportModal);
    reportModal?.addEventListener('click', (e) => {
      if (e.target === reportModal) closeReportModal();
    });
    btnConfirmReport?.addEventListener('click', executePendingReport);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeReportModal();
        if (navLinks && navLinks.classList.contains('nav-open')) {
          mobileToggle?.setAttribute('aria-expanded', 'false');
          mobileToggle?.classList.remove('active');
          navLinks.classList.remove('nav-open');
        }
      }
    });
  }

  /* --------------------------------------------------------------------------
     1. REST API: GET /api/secrets/random
     -------------------------------------------------------------------------- */
  async function fetchRandomSecret() {
    try {
      randomCard.classList.remove('fade-in-anim');
      void randomCard.offsetWidth;
      randomCard.classList.add('fade-in-anim');

      const response = await fetch('/api/secrets/random');
      const data = await response.json();

      if (data.success && data.data) {
        const secret = data.data;
        randomSecretText.textContent = `"${secret.text}"`;
        randomSecretId.textContent = `WHISPER #${formatId(secret.id)}`;
        randomSecretDate.textContent = `anonymous • ${formatDate(secret.createdAt)}`;
      } else {
        randomSecretText.textContent = "No whispers in the archive yet. Be the first to leave one.";
        randomSecretId.textContent = "WHISPER #--";
        randomSecretDate.textContent = "anonymous • Today";
      }
    } catch (error) {
      console.error('Error fetching random secret:', error);
      showNotice('Could not load whisper.', 'error');
    }
  }

  /* --------------------------------------------------------------------------
     2. REST API: GET /api/secrets
     -------------------------------------------------------------------------- */
  async function fetchAllSecrets() {
    try {
      const response = await fetch('/api/secrets');
      const data = await response.json();

      if (data.success) {
        renderEditorialFeed(data.data);
        secretsCountText.textContent = `${data.count} ${data.count === 1 ? 'whisper' : 'whispers'}`;
      } else {
        showNotice('Failed to load archive.', 'error');
      }
    } catch (error) {
      console.error('Error fetching whispers:', error);
    }
  }

  /* --------------------------------------------------------------------------
     3. REST API: POST /api/secrets
     -------------------------------------------------------------------------- */
  async function handleFormSubmit(e) {
    e.preventDefault();

    const text = secretTextarea.value.trim();
    if (!text) {
      showNotice('Please write something before submitting.', 'error');
      return;
    }

    setSubmitLoading(true);

    try {
      const response = await fetch('/api/secrets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (response.status === 201 && data.success) {
        showNotice('Your whisper has been posted.', 'success');
        secretForm.reset();
        if (charCount) charCount.textContent = '0';
        if (charCounter) charCounter.className = 'char-counter';

        await fetchAllSecrets();
        fetchRandomSecret();
      } else {
        showNotice(data.error || 'Something went wrong. Try again.', 'error');
      }
    } catch (error) {
      console.error('Error submitting secret:', error);
      showNotice('Connection error. Try again.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  }

  /* --------------------------------------------------------------------------
     4. REST API: POST /api/secrets/:id/report
     -------------------------------------------------------------------------- */
  function confirmReportSecret(id) {
    pendingReportId = id;
    modalSecretId.textContent = `whisper #${formatId(id)}`;
    reportModal.classList.remove('hidden');
  }

  function closeReportModal() {
    pendingReportId = null;
    reportModal.classList.add('hidden');
  }

  async function executePendingReport() {
    if (!pendingReportId) return;

    const idToReport = pendingReportId;
    closeReportModal();

    btnConfirmReport.disabled = true;
    btnConfirmReport.textContent = 'Reporting...';

    try {
      const response = await fetch(`/api/secrets/${idToReport}/report`, {
        method: 'POST'
      });

      const data = await response.json();

      if (response.status === 200 && data.success) {
        showNotice(`Whisper #${formatId(idToReport)} reported.`, 'success');
      } else {
        showNotice(data.error || 'Could not report whisper.', 'error');
      }
    } catch (error) {
      console.error(`Error reporting secret #${idToReport}:`, error);
      showNotice('Error attempting to report whisper.', 'error');
    } finally {
      btnConfirmReport.disabled = false;
      btnConfirmReport.textContent = 'Report';
    }
  }

  /* --------------------------------------------------------------------------
     5. Render Single-Column Editorial Feed with Entrance Animations
     -------------------------------------------------------------------------- */
  function renderEditorialFeed(secretsList) {
    editorialFeed.innerHTML = '';

    if (!secretsList || secretsList.length === 0) {
      editorialFeed.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    editorialFeed.classList.remove('hidden');

    const observer = ('IntersectionObserver' in window) 
      ? new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 })
      : null;

    secretsList.forEach((secret, index) => {
      const item = document.createElement('article');
      item.className = 'feed-item';
      item.setAttribute('data-secret-id', secret.id);
      item.style.animationDelay = `${Math.min(index * 0.05, 0.4)}s`;

      item.innerHTML = `
        <div class="feed-item-header">
          <span class="feed-item-id">WHISPER #${formatId(secret.id)}</span>
        </div>
        
        <p class="feed-item-text">"${escapeHTML(secret.text)}"</p>
        
        <div class="feed-item-footer">
          <div class="feed-item-meta">
            <span>anonymous</span>
            <span class="dot-separator">•</span>
            <span>${formatDate(secret.createdAt)}</span>
          </div>
          <button class="btn-text-action action-report" data-id="${secret.id}" aria-label="Report whisper #${formatId(secret.id)}">report</button>
        </div>
      `;

      const reportBtn = item.querySelector('.action-report');
      reportBtn.addEventListener('click', () => {
        confirmReportSecret(secret.id);
      });

      editorialFeed.appendChild(item);

      if (observer) {
        observer.observe(item);
      } else {
        item.classList.add('is-visible');
      }
    });
  }

  function setSubmitLoading(isLoading) {
    if (isLoading) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Whispering...';
    } else {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Whisper it';
    }
  }

  /* --------------------------------------------------------------------------
     Toast & Inline Notice Notification System
     -------------------------------------------------------------------------- */
  function showNotice(message, type = 'success') {
    // 1. Update inline notice element if present
    if (inlineNotice) {
      inlineNotice.className = `inline-notice ${type}`;
      inlineNotice.textContent = message;

      setTimeout(() => {
        if (inlineNotice.textContent === message) {
          inlineNotice.textContent = '';
          inlineNotice.className = 'inline-notice';
        }
      }, 4000);
    }

    // 2. Render floating toast notification pill
    if (toastContainer) {
      const toast = document.createElement('div');
      toast.className = `toast toast--${type}`;
      toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : 'ℹ'}</span>
        <span class="toast-message">${escapeHTML(message)}</span>
      `;
      toastContainer.appendChild(toast);

      requestAnimationFrame(() => {
        toast.classList.add('toast--visible');
      });

      setTimeout(() => {
        toast.classList.remove('toast--visible');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }
  }

  function formatId(id) {
    return String(id).padStart(3, '0');
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(dateString) {
    if (!dateString) return 'recently';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'recently';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
});
