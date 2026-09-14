/**
 * WHISPER — Client Application Logic (Warm Editorial Edition)
 * REST API Endpoints:
 *   - GET /api/secrets
 *   - GET /api/secrets/random
 *   - POST /api/secrets
 *   - DELETE /api/secrets/:id
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
  const btnSubmit = document.getElementById('btn-submit');
  const inlineNotice = document.getElementById('inline-notice');

  const editorialFeed = document.getElementById('editorial-feed');
  const emptyState = document.getElementById('empty-state');
  const secretsCountText = document.getElementById('secrets-count-text');

  const reportModal = document.getElementById('report-modal');
  const modalSecretId = document.getElementById('modal-secret-id');
  const btnCancelReport = document.getElementById('btn-cancel-report');
  const btnConfirmReport = document.getElementById('btn-confirm-report');

  let pendingReportId = null;

  init();

  function init() {
    setupEventListeners();
    fetchRandomSecret();
    fetchAllSecrets();
  }

  function setupEventListeners() {
    btnRevealAnother?.addEventListener('click', fetchRandomSecret);
    btnHeroRead?.addEventListener('click', () => {
      fetchRandomSecret();
    });

    secretTextarea?.addEventListener('input', (e) => {
      const length = e.target.value.length;
      charCount.textContent = length;
    });

    secretForm?.addEventListener('submit', handleFormSubmit);

    btnCancelReport?.addEventListener('click', closeReportModal);
    reportModal?.addEventListener('click', (e) => {
      if (e.target === reportModal) closeReportModal();
    });
    btnConfirmReport?.addEventListener('click', executePendingReport);
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
        randomSecretText.textContent = `"${secret.text}"`; // textContent automatically escapes HTML
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
        charCount.textContent = '0';

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
    }
  }

  /* --------------------------------------------------------------------------
     5. Render Single-Column Editorial Feed
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

    secretsList.forEach(secret => {
      const item = document.createElement('article');
      item.className = 'feed-item';
      item.setAttribute('data-secret-id', secret.id);

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
          <button class="btn-text-action action-report" data-id="${secret.id}">report</button>
        </div>
      `;

      const reportBtn = item.querySelector('.action-report');
      reportBtn.addEventListener('click', () => {
        confirmReportSecret(secret.id);
      });

      editorialFeed.appendChild(item);
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

  function showNotice(message, type = 'success') {
    if (!inlineNotice) return;
    inlineNotice.className = `inline-notice ${type}`;
    inlineNotice.textContent = message;

    setTimeout(() => {
      if (inlineNotice.textContent === message) {
        inlineNotice.textContent = '';
        inlineNotice.className = 'inline-notice';
      }
    }, 4000);
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
