/**
 * WHISPER — Admin Moderation Console
 * All API calls are identical to the original implementation.
 * Standard browser alerts/confirms replaced with branded toast system and modal.
 *
 * API endpoints used:
 *   GET    /api/admin/secrets
 *   PATCH  /api/admin/secrets/:id/hide
 *   PATCH  /api/admin/secrets/:id/restore
 *   DELETE /api/admin/secrets/:id
 *   POST   /api/admin/logout
 */

document.addEventListener('DOMContentLoaded', () => {
  const secretsList    = document.getElementById('admin-secrets-list');
  const btnLogout      = document.getElementById('btn-logout');
  const adminCountText = document.getElementById('admin-count-text');
  const summaryStrip   = document.getElementById('admin-summary-strip');
  const toastContainer = document.getElementById('toast-container');

  // Confirmation Modal elements
  const confirmModal     = document.getElementById('admin-confirm-modal');
  const modalTitle       = document.getElementById('admin-modal-title');
  const modalBody        = document.getElementById('admin-modal-body');
  const btnModalCancel   = document.getElementById('btn-admin-modal-cancel');
  const btnModalConfirm  = document.getElementById('btn-admin-modal-confirm');

  let pendingAction = null;

  /* ------------------------------------------------------------------
     Fetch & render
  ------------------------------------------------------------------ */
  const fetchSecrets = async () => {
    try {
      const res = await fetch('/api/admin/secrets');
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();

      if (data.success) {
        renderSecrets(data.data);
        renderSummary(data.data);
      } else {
        secretsList.innerHTML = '<p class="admin-loading-text">Error loading whispers.</p>';
      }
    } catch (err) {
      secretsList.innerHTML = '<p class="admin-loading-text">Connection error.</p>';
    }
  };

  /* ------------------------------------------------------------------
     Summary strip
  ------------------------------------------------------------------ */
  const renderSummary = (secrets) => {
    const total   = secrets.length;
    const active  = secrets.filter(s => s.status === 'active').length;
    const hidden  = secrets.filter(s => s.status === 'hidden').length;
    const deleted = secrets.filter(s => s.status === 'deleted').length;
    const flagged = secrets.filter(s => s.reportCount > 0 && s.status === 'active').length;

    if (adminCountText) {
      adminCountText.textContent = `${total} ${total === 1 ? 'whisper' : 'whispers'}`;
    }

    if (summaryStrip) {
      summaryStrip.innerHTML = `
        <div class="summary-stat">
          <span class="summary-value">${active}</span>
          <span class="summary-label">active</span>
        </div>
        <div class="summary-stat summary-stat--flagged">
          <span class="summary-value">${flagged}</span>
          <span class="summary-label">reported</span>
        </div>
        <div class="summary-stat">
          <span class="summary-value">${hidden}</span>
          <span class="summary-label">hidden</span>
        </div>
        <div class="summary-stat">
          <span class="summary-value">${deleted}</span>
          <span class="summary-label">deleted</span>
        </div>
      `;
    }
  };

  /* ------------------------------------------------------------------
     Render the moderation queue
  ------------------------------------------------------------------ */
  const renderSecrets = (secrets) => {
    if (!secretsList) return;

    if (secrets.length === 0) {
      secretsList.innerHTML = '<p class="admin-loading-text">No whispers in the queue.</p>';
      return;
    }

    secretsList.innerHTML = secrets.map((secret, index) => {
      const isFlagged = secret.reportCount > 0 && secret.status === 'active';
      const cardClass = [
        'admin-card',
        secret.status !== 'active' ? `admin-card--${secret.status}` : '',
        isFlagged ? 'admin-card--flagged' : ''
      ].filter(Boolean).join(' ');

      const statusLabel = {
        active:  'Active',
        hidden:  'Hidden',
        deleted: 'Deleted'
      }[secret.status] || secret.status;

      const date = secret.createdAt
        ? new Date(secret.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'unknown date';

      let actionHTML = '';
      if (secret.status === 'active') {
        actionHTML = `
          <button class="btn btn-outline action-btn" data-action="hide" data-id="${secret.id}" aria-label="Hide whisper #${secret.id}">Hide</button>
          <button class="btn btn-admin-delete action-btn" data-action="delete" data-id="${secret.id}" aria-label="Delete whisper #${secret.id}">Delete</button>
        `;
      } else if (secret.status === 'hidden') {
        actionHTML = `
          <button class="btn btn-outline action-btn" data-action="restore" data-id="${secret.id}" aria-label="Restore whisper #${secret.id}">Restore</button>
          <button class="btn btn-admin-delete action-btn" data-action="delete" data-id="${secret.id}" aria-label="Delete whisper #${secret.id}">Delete</button>
        `;
      } else if (secret.status === 'deleted') {
        actionHTML = `
          <button class="btn btn-outline action-btn" data-action="restore" data-id="${secret.id}" aria-label="Restore whisper #${secret.id} from trash">Restore from Trash</button>
        `;
      }

      return `
        <article class="${cardClass}" data-secret-id="${secret.id}" style="animation-delay: ${Math.min(index * 0.04, 0.3)}s">
          <div class="admin-card-header">
            <div class="admin-card-meta">
              <span class="feed-item-id">WHISPER #${formatId(secret.id)}</span>
              <span class="admin-status-badge admin-status-badge--${secret.status}">${statusLabel}</span>
            </div>
            ${isFlagged ? `<span class="admin-report-pill" title="${secret.reportCount} report${secret.reportCount !== 1 ? 's' : ''}">⚑ ${secret.reportCount} ${secret.reportCount === 1 ? 'report' : 'reports'}</span>` : ''}
          </div>

          <p class="admin-card-text">"${escapeHTML(secret.text)}"</p>

          <div class="admin-card-footer">
            <span class="admin-card-date">anonymous · ${date}</span>
            <div class="admin-card-actions">
              ${actionHTML}
            </div>
          </div>
        </article>
      `;
    }).join('');

    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', handleActionClick);
    });
  };

  /* ------------------------------------------------------------------
     Action dispatching & custom confirmation modal
  ------------------------------------------------------------------ */
  const handleActionClick = (e) => {
    const btn    = e.currentTarget;
    const action = btn.getAttribute('data-action');
    const id     = btn.getAttribute('data-id');

    if (action === 'delete') {
      openConfirmModal(
        'Delete Whisper',
        `Are you sure you want to mark whisper #${formatId(id)} as deleted?`,
        () => performAction(btn, action, id)
      );
    } else {
      performAction(btn, action, id);
    }
  };

  const openConfirmModal = (title, body, onConfirm) => {
    if (!confirmModal) {
      if (confirm(`${title}: ${body}`)) onConfirm();
      return;
    }

    if (modalTitle) modalTitle.textContent = title;
    if (modalBody) modalBody.textContent = body;
    pendingAction = onConfirm;
    confirmModal.classList.remove('hidden');
  };

  const closeConfirmModal = () => {
    pendingAction = null;
    if (confirmModal) confirmModal.classList.add('hidden');
  };

  btnModalCancel?.addEventListener('click', closeConfirmModal);
  confirmModal?.addEventListener('click', (e) => {
    if (e.target === confirmModal) closeConfirmModal();
  });
  btnModalConfirm?.addEventListener('click', () => {
    const actionToRun = pendingAction;
    closeConfirmModal();
    if (actionToRun) actionToRun();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && confirmModal && !confirmModal.classList.contains('hidden')) {
      closeConfirmModal();
    }
  });

  /* ------------------------------------------------------------------
     Perform Action API Calls
  ------------------------------------------------------------------ */
  const performAction = async (btn, action, id) => {
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = '…';

    try {
      let url    = `/api/admin/secrets/${id}`;
      let method = 'DELETE';

      if (action === 'hide') {
        url    = `/api/admin/secrets/${id}/hide`;
        method = 'PATCH';
      } else if (action === 'restore') {
        url    = `/api/admin/secrets/${id}/restore`;
        method = 'PATCH';
      }

      const res = await fetch(url, { method });
      if (res.ok) {
        showToast(`Whisper #${formatId(id)} updated (${action}).`, 'success');
        fetchSecrets();
      } else {
        showToast('Action failed. Please try again.', 'error');
        btn.disabled = false;
        btn.textContent = originalText;
      }
    } catch (err) {
      showToast('Connection error. Please try again.', 'error');
      btn.disabled = false;
      btn.textContent = originalText;
    }
  };

  /* ------------------------------------------------------------------
     Logout
  ------------------------------------------------------------------ */
  btnLogout?.addEventListener('click', async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (err) {
      showToast('Error logging out.', 'error');
    }
  });

  /* ------------------------------------------------------------------
     Toast Notification System
  ------------------------------------------------------------------ */
  function showToast(message, type = 'success') {
    if (!toastContainer) return;

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

  /* ------------------------------------------------------------------
     Utilities
  ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------
     Init
  ------------------------------------------------------------------ */
  fetchSecrets();
});
