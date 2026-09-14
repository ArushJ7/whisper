/**
 * WHISPER — Admin Moderation Console
 * All API calls are identical to the original implementation.
 * Only the rendered HTML has been updated to match the public design system.
 *
 * API endpoints used:
 *   GET    /api/admin/secrets
 *   PATCH  /api/admin/secrets/:id/hide
 *   PATCH  /api/admin/secrets/:id/restore
 *   DELETE /api/admin/secrets/:id
 *   POST   /api/admin/logout
 */

document.addEventListener('DOMContentLoaded', () => {
  const secretsList   = document.getElementById('admin-secrets-list');
  const btnLogout     = document.getElementById('btn-logout');
  const adminCountText = document.getElementById('admin-count-text');
  const summaryStrip  = document.getElementById('admin-summary-strip');

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
     Summary strip (real counts from database data)
  ------------------------------------------------------------------ */
  const renderSummary = (secrets) => {
    const total   = secrets.length;
    const active  = secrets.filter(s => s.status === 'active').length;
    const hidden  = secrets.filter(s => s.status === 'hidden').length;
    const deleted = secrets.filter(s => s.status === 'deleted').length;
    const flagged = secrets.filter(s => s.reportCount > 0 && s.status === 'active').length;

    adminCountText.textContent = `${total} ${total === 1 ? 'whisper' : 'whispers'}`;

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
  };

  /* ------------------------------------------------------------------
     Render the moderation queue
  ------------------------------------------------------------------ */
  const renderSecrets = (secrets) => {
    if (secrets.length === 0) {
      secretsList.innerHTML = '<p class="admin-loading-text">No whispers in the queue.</p>';
      return;
    }

    secretsList.innerHTML = secrets.map(secret => {
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

      /* Action buttons — unchanged logic, updated classes */
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
        <article class="${cardClass}" data-secret-id="${secret.id}">
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
      btn.addEventListener('click', handleAction);
    });
  };

  /* ------------------------------------------------------------------
     Action handler — API calls unchanged
  ------------------------------------------------------------------ */
  const handleAction = async (e) => {
    const btn    = e.currentTarget;
    const action = btn.getAttribute('data-action');
    const id     = btn.getAttribute('data-id');

    if (action === 'delete') {
      if (!confirm('Permanently soft-delete this whisper? You can restore it later.')) return;
    }

    /* Disable button during request */
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
        fetchSecrets();
      } else {
        alert('Action failed. Please try again.');
        btn.disabled = false;
        btn.textContent = originalText;
      }
    } catch (err) {
      alert('Connection error. Please try again.');
      btn.disabled = false;
      btn.textContent = originalText;
    }
  };

  /* ------------------------------------------------------------------
     Logout
  ------------------------------------------------------------------ */
  btnLogout.addEventListener('click', async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (err) {
      alert('Error logging out.');
    }
  });

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
