document.addEventListener('DOMContentLoaded', () => {
  const secretsList = document.getElementById('admin-secrets-list');
  const btnLogout = document.getElementById('btn-logout');

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
      } else {
        secretsList.innerHTML = '<p>Error loading secrets.</p>';
      }
    } catch (err) {
      secretsList.innerHTML = '<p>Connection error.</p>';
    }
  };

  const renderSecrets = (secrets) => {
    if (secrets.length === 0) {
      secretsList.innerHTML = '<p>No secrets found.</p>';
      return;
    }

    secretsList.innerHTML = secrets.map(secret => `
      <div class="admin-feed-item">
        <div class="admin-item-header">
          <span>ID: ${secret.id}</span>
          <span class="badge ${secret.status}">${secret.status.toUpperCase()}</span>
        </div>
        <p>${escapeHTML(secret.text)}</p>
        <div style="margin-top: 0.5rem; font-size: 0.9rem;">
          <span class="${secret.reportCount > 0 ? 'report-count' : ''}">Reports: ${secret.reportCount}</span> |
          <span>Created: ${new Date(secret.createdAt).toLocaleString()}</span>
        </div>
        <div class="admin-actions">
          ${secret.status !== 'deleted' ? (
            secret.status === 'active'
              ? `<button class="btn btn-outline action-btn" data-action="hide" data-id="${secret.id}">Hide</button>`
              : `<button class="btn btn-outline action-btn" data-action="restore" data-id="${secret.id}">Restore</button>`
          ) : ''}
          ${secret.status !== 'deleted'
            ? `<button class="btn btn-burgundy action-btn" data-action="delete" data-id="${secret.id}">Delete</button>`
            : `<button class="btn btn-outline action-btn" data-action="restore" data-id="${secret.id}">Restore from Trash</button>`
          }
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', handleAction);
    });
  };

  const handleAction = async (e) => {
    const action = e.target.getAttribute('data-action');
    const id = e.target.getAttribute('data-id');

    if (action === 'delete') {
      if (!confirm('Are you sure you want to delete this secret?')) return;
    }

    try {
      let url = `/api/admin/secrets/${id}`;
      let method = 'DELETE';

      if (action === 'hide') {
        url = `/api/admin/secrets/${id}/hide`;
        method = 'PATCH';
      } else if (action === 'restore') {
        url = `/api/admin/secrets/${id}/restore`;
        method = 'PATCH';
      }

      const res = await fetch(url, { method });
      if (res.ok) {
        fetchSecrets();
      } else {
        alert('Action failed.');
      }
    } catch (err) {
      alert('Error performing action.');
    }
  };

  btnLogout.addEventListener('click', async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (err) {
      alert('Error logging out.');
    }
  });

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  fetchSecrets();
});
