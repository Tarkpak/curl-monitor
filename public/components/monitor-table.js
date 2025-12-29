class MonitorTable extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._data = [];
  }

  connectedCallback() {
    this.render();
    this.loadData();
    setInterval(() => this.loadData(), 10000);
    document.addEventListener('language-changed', () => {
      this.render();
      this.renderTable();
    });
  }

  t(key) { return window.i18n?.t(key) || key; }

  async loadData() {
    const res = await fetch('/list');
    this._data = await res.json();
    this.renderTable();
    this.dispatchEvent(new CustomEvent('data-loaded', { detail: this._data }));
  }

  get data() { return this._data; }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .container { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        th:last-child { text-align: right; }
        td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
        tr:hover { background: #f9fafb; }
        tr.paused { opacity: 0.6; }
        .clickable { cursor: pointer; }
        .name { font-weight: 500; color: #111827; }
        .name-empty { color: #9ca3af; font-style: italic; }
        .method { padding: 4px 8px; font-size: 12px; font-weight: 500; border-radius: 4px; background: #dbeafe; color: #1d4ed8; }
        .url { color: #6b7280; font-size: 13px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .interval { color: #6b7280; }
        .badge { padding: 2px 8px; font-size: 12px; border-radius: 4px; color: white; }
        .badge-ok { background: #22c55e; }
        .badge-change { background: #f59e0b; }
        .badge-error { background: #ef4444; }
        .badge-paused { background: #9ca3af; }
        .stats { font-size: 12px; margin-left: 4px; }
        .stats-change { color: #d97706; }
        .stats-error { color: #dc2626; }
        .time { color: #6b7280; }
        .actions { text-align: right; white-space: nowrap; }
        .btn { padding: 4px 8px; font-size: 13px; border: none; border-radius: 4px; cursor: pointer; margin-left: 8px; }
        .btn-edit { color: #2563eb; background: none; }
        .btn-pause { color: #ca8a04; background: none; }
        .btn-resume { color: #16a34a; background: none; }
        .btn-delete { color: #dc2626; background: none; }
        .btn:hover { opacity: 0.7; }
        .empty { padding: 32px; text-align: center; color: #9ca3af; }
      </style>
      <div class="container">
        <table>
          <thead>
            <tr>
              <th>${this.t('nameUrl')}</th>
              <th>${this.t('interval')}</th>
              <th>${this.t('status')}</th>
              <th>${this.t('lastCheck')}</th>
              <th>${this.t('createdAt')}</th>
              <th>${this.t('actions')}</th>
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
        <div id="empty" class="empty" style="display:none"></div>
      </div>
    `;
  }

  renderTable() {
    const tbody = this.shadowRoot.getElementById('tbody');
    const empty = this.shadowRoot.getElementById('empty');

    if (this._data.length === 0) {
      tbody.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    tbody.innerHTML = this._data.map(m => {
      const last = m.history[0];
      const paused = m.status === 'paused';
      const statusBadge = paused ? `<span class="badge badge-paused">${this.t('paused')}</span>` :
        !last ? '-' :
        last.error ? `<span class="badge badge-error">${this.t('error')}</span>` :
        last.changed ? `<span class="badge badge-change">${this.t('changed')}</span>` :
        `<span class="badge badge-ok">${this.t('normal')}</span>`;

      const changes = m.history.filter(h => h.changed).length;
      const errors = m.history.filter(h => h.error).length;

      const createdTime = m.createdAt ? this.formatTime(m.createdAt) : '-';
      
      return `
        <tr class="${paused ? 'paused' : ''} clickable" data-id="${m.id}">
          <td>
            <div class="${m.name ? 'name' : 'name-empty'}">${m.name ? this.esc(m.name) : 'Unnamed'}</div>
            <div class="url" title="${this.esc(m.url)}">
              <span class="method">${m.method || 'GET'}</span>
              ${this.esc(m.url || '-')}
            </div>
          </td>
          <td class="interval">${m.interval / 1000}s</td>
          <td>
            ${statusBadge}
            ${changes > 0 ? `<span class="stats stats-change">(${changes})</span>` : ''}
            ${errors > 0 ? `<span class="stats stats-error">(${errors})</span>` : ''}
          </td>
          <td class="time">${last?.time || '-'}</td>
          <td class="time">${createdTime}</td>
          <td class="actions">
            <button class="btn btn-edit" data-action="edit" data-id="${m.id}">${this.t('edit')}</button>
            <button class="btn ${paused ? 'btn-resume' : 'btn-pause'}" data-action="${paused ? 'resume' : 'pause'}" data-id="${m.id}">
              ${paused ? this.t('resume') : this.t('pause')}
            </button>
            <button class="btn btn-delete" data-action="delete" data-id="${m.id}">${this.t('delete')}</button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('tr').forEach(tr => {
      tr.onclick = (e) => {
        if (e.target.tagName === 'BUTTON') return;
        this.dispatchEvent(new CustomEvent('row-click', { detail: tr.dataset.id }));
      };
    });

    tbody.querySelectorAll('button').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.handleAction(btn.dataset.action, btn.dataset.id);
      };
    });
  }

  async handleAction(action, id) {
    if (action === 'delete') {
      if (!confirm(this.t('confirmDelete'))) return;
      window.location.href = `/delete/${id}`;
    } else if (action === 'edit') {
      this.dispatchEvent(new CustomEvent('edit-click', { detail: id }));
    } else {
      await fetch(`/${action}/${id}`, { method: 'POST' });
      this.loadData();
    }
  }

  esc(str) { return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  formatTime(ts) {
    const d = new Date(ts);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
}

customElements.define('monitor-table', MonitorTable);
