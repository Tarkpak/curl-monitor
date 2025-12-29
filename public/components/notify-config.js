class NotifyConfig extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = { notifyUrls: [] };
    this._editId = null;
  }

  connectedCallback() {
    this.render();
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
    document.addEventListener('language-changed', () => {
      this.render();
      if (this._config.notifyUrls.length > 0) this.renderList();
    });
  }

  t(key) {
    return window.i18n?.t(key) || key;
  }

  async loadConfig() {
    const res = await fetch('/config');
    this._config = await res.json();
    this.renderList();
    this.dispatchEvent(new CustomEvent('config-loaded', { detail: this._config }));
    return this._config;
  }

  open() {
    this.loadConfig();
    this.shadowRoot.getElementById('modal').classList.remove('hidden');
  }

  close() {
    this.shadowRoot.getElementById('modal').classList.add('hidden');
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .modal.hidden { display: none; }
        .dialog { background: white; border-radius: 12px; box-shadow: 0 25px 50px rgba(0,0,0,0.25); width: 100%; max-width: 700px; max-height: 90vh; display: flex; flex-direction: column; }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
        .title { font-size: 18px; font-weight: 600; }
        .close { font-size: 24px; color: #6b7280; cursor: pointer; border: none; background: none; }
        .body { flex: 1; overflow: auto; padding: 20px; }
        .list { margin-bottom: 20px; }
        .item { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 8px; }
        .item-info { flex: 1; min-width: 0; }
        .item-name { font-weight: 500; font-size: 14px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .item-url { font-size: 12px; color: #6b7280; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .badge { padding: 2px 6px; font-size: 11px; border-radius: 4px; white-space: nowrap; }
        .badge-bark { background: #ffedd5; color: #c2410c; }
        .badge-url { background: #f3f4f6; color: #4b5563; }
        .badge-ts { background: #fee2e2; color: #b91c1c; }
        .badge-call { background: #f3e8ff; color: #7c3aed; }
        .actions { display: flex; gap: 8px; flex-shrink: 0; }
        .btn { padding: 6px 12px; border-radius: 6px; font-size: 13px; cursor: pointer; border: none; }
        .btn-test { background: #dbeafe; color: #1d4ed8; }
        .btn-edit { background: #f3f4f6; color: #374151; }
        .btn-del { background: #fee2e2; color: #b91c1c; }
        .btn-save { background: #059669; color: white; }
        .btn-reset { background: #e5e7eb; color: #374151; }
        .btn:hover { opacity: 0.8; }
        .form { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background: #f9fafb; }
        .form-title { font-size: 14px; font-weight: 500; margin-bottom: 12px; color: #374151; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; }
        input, select { width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
        .bark-options { margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; }
        .bark-title { font-size: 13px; font-weight: 500; color: #6b7280; margin-bottom: 12px; }
        .checkbox-group { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
        .checkbox-label { display: flex; align-items: center; gap: 4px; font-size: 13px; cursor: pointer; white-space: nowrap; }
        .checkbox-label input { width: auto; }
        .form-actions { margin-top: 12px; display: flex; gap: 8px; }
        .empty { color: #9ca3af; font-size: 14px; padding: 16px; text-align: center; background: #f9fafb; border-radius: 8px; }
      </style>
      <div id="modal" class="modal hidden" onclick="if(event.target===this)this.getRootNode().host.close()">
        <div class="dialog">
          <div class="header">
            <span class="title">${this.t('notifyConfig')}</span>
            <button class="close" onclick="this.getRootNode().host.close()">×</button>
          </div>
          <div class="body">
            <div class="list" id="list"></div>
            <div class="form" id="form"></div>
          </div>
        </div>
      </div>
    `;
    this.renderForm();
  }

  renderList() {
    const list = this.shadowRoot.getElementById('list');
    if (this._config.notifyUrls.length === 0) {
      list.innerHTML = `<div class="empty">${this.t('noNotifyConfig')}</div>`;
      return;
    }
    list.innerHTML = this._config.notifyUrls.map(n => `
      <div class="item">
        <div class="item-info">
          <div class="item-name">
            ${this.esc(n.name)}
            <span class="badge ${n.type === 'bark' ? 'badge-bark' : 'badge-url'}">${n.type || 'bark'}</span>
            ${n.level === 'timeSensitive' ? `<span class="badge badge-ts">${this.t('levelTimeSensitive')}</span>` : ''}
            ${n.call ? `<span class="badge badge-call">${this.t('call')}</span>` : ''}
          </div>
          <div class="item-url">${n.type === 'bark' ? this.esc(n.server + '/' + n.key) : this.esc(n.url)}</div>
        </div>
        <div class="actions">
          <button class="btn btn-test" data-id="${n.id}" data-action="test">${this.t('test')}</button>
          <button class="btn btn-edit" data-id="${n.id}" data-action="edit">${this.t('edit')}</button>
          <button class="btn btn-del" data-id="${n.id}" data-action="delete">${this.t('delete')}</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => this.handleAction(btn.dataset.action, btn.dataset.id);
    });
  }

  renderForm() {
    const form = this.shadowRoot.getElementById('form');
    const n = this._editId ? this._config.notifyUrls.find(x => x.id === this._editId) : {};
    form.innerHTML = `
      <div class="grid">
        <div>
          <label>${this.t('notifyName')} *</label>
          <input type="text" id="name" value="${this.esc(n.name || '')}" placeholder="${this.t('notifyName')}">
        </div>
        <div>
          <label>${this.t('notifyType')}</label>
          <select id="type">
            <option value="bark" ${(n.type || 'bark') === 'bark' ? 'selected' : ''}>Bark</option>
            <option value="url" ${n.type === 'url' ? 'selected' : ''}>URL</option>
          </select>
        </div>
      </div>
      
      <!-- Bark config -->
      <div id="barkOptions" class="bark-options">
        <div class="bark-title">Bark</div>
        <div class="grid">
          <div>
            <label>${this.t('barkServer')} *</label>
            <input type="text" id="server" value="${this.esc(n.server || 'https://api.day.app')}" placeholder="${this.t('barkServerPlaceholder')}">
          </div>
          <div>
            <label>${this.t('deviceKey')} *</label>
            <input type="text" id="key" value="${this.esc(n.key || '')}" placeholder="${this.t('deviceKeyPlaceholder')}">
          </div>
          <div>
            <label>${this.t('pushTitle')} <span style="color:#9ca3af">(${this.t('pushTitlePlaceholder')})</span></label>
            <input type="text" id="title" value="${this.esc(n.title || '')}" placeholder="${this.t('pushTitle')}">
          </div>
          <div>
            <label>${this.t('pushBody')} <span style="color:#9ca3af">(${this.t('pushBodyPlaceholder')})</span></label>
            <input type="text" id="body" value="${this.esc(n.body || '')}" placeholder="${this.t('pushBody')}">
          </div>
        </div>
        <div class="grid-3" style="margin-top:16px">
          <div>
            <label>${this.t('sound')}</label>
            <select id="sound">${this.getSoundOptions(n.sound)}</select>
          </div>
          <div>
            <label>${this.t('notifyLevel')}</label>
            <select id="level">
              <option value="active" ${(n.level || 'active') === 'active' ? 'selected' : ''}>active (${this.t('levelActive')})</option>
              <option value="timeSensitive" ${n.level === 'timeSensitive' ? 'selected' : ''}>timeSensitive (${this.t('levelTimeSensitive')})</option>
              <option value="passive" ${n.level === 'passive' ? 'selected' : ''}>passive (${this.t('levelPassive')})</option>
            </select>
          </div>
          <div>
            <label>${this.t('group')}</label>
            <input type="text" id="group" value="${this.esc(n.group || '')}" placeholder="${this.t('group')}">
          </div>
          <div>
            <label>${this.t('icon')}</label>
            <input type="text" id="icon" value="${this.esc(n.icon || '')}" placeholder="https://...">
          </div>
          <div>
            <label>${this.t('badge')}</label>
            <input type="number" id="badge" value="${n.badge || ''}">
          </div>
          <div class="checkbox-group">
            <label class="checkbox-label"><input type="checkbox" id="isArchive" ${n.isArchive !== false ? 'checked' : ''}> ${this.t('isArchive')}</label>
            <label class="checkbox-label"><input type="checkbox" id="autoCopy" ${n.autoCopy ? 'checked' : ''}> ${this.t('autoCopy')}</label>
            <label class="checkbox-label"><input type="checkbox" id="call" ${n.call ? 'checked' : ''}> ${this.t('call')}</label>
          </div>
        </div>
      </div>
      
      <!-- URL config -->
      <div id="urlOptions" class="bark-options" style="display:none">
        <div class="bark-title">URL</div>
        <div>
          <label>URL *</label>
          <input type="text" id="url" value="${this.esc(n.url || '')}" placeholder="https://example.com/webhook">
        </div>
      </div>
      
      <div class="form-actions">
        <button class="btn btn-save" id="saveBtn">${this._editId ? this.t('save') : this.t('add')}</button>
        <button class="btn btn-reset" id="resetBtn">${this.t('cancel')}</button>
      </div>
    `;

    form.querySelector('#type').onchange = () => this.toggleTypeOptions();
    form.querySelector('#saveBtn').onclick = () => this.save();
    form.querySelector('#resetBtn').onclick = () => this.reset();
    this.toggleTypeOptions();
  }

  toggleTypeOptions() {
    const type = this.shadowRoot.getElementById('type').value;
    this.shadowRoot.getElementById('barkOptions').style.display = type === 'bark' ? 'block' : 'none';
    this.shadowRoot.getElementById('urlOptions').style.display = type === 'url' ? 'block' : 'none';
  }

  async handleAction(action, id) {
    if (action === 'test') {
      const res = await fetch(`/config/notify/${id}/test`, { method: 'POST' });
      const data = await res.json();
      alert(data.success ? this.t('testSuccess') : this.t('testFailed') + ': ' + data.error);
    } else if (action === 'edit') {
      this._editId = id;
      this.renderForm();
    } else if (action === 'delete') {
      if (!confirm(this.t('confirmDeleteNotify'))) return;
      await fetch(`/config/notify/${id}`, { method: 'DELETE' });
      this.loadConfig();
    }
  }

  async save() {
    const type = this.shadowRoot.getElementById('type').value;
    const data = {
      name: this.shadowRoot.getElementById('name').value.trim(),
      type,
      server: this.shadowRoot.getElementById('server').value.trim(),
      key: this.shadowRoot.getElementById('key').value.trim(),
      url: this.shadowRoot.getElementById('url').value.trim(),
      title: this.shadowRoot.getElementById('title').value.trim(),
      body: this.shadowRoot.getElementById('body').value.trim(),
      sound: this.shadowRoot.getElementById('sound').value,
      level: this.shadowRoot.getElementById('level').value,
      group: this.shadowRoot.getElementById('group').value.trim(),
      icon: this.shadowRoot.getElementById('icon').value.trim(),
      badge: this.shadowRoot.getElementById('badge').value,
      isArchive: this.shadowRoot.getElementById('isArchive').checked,
      autoCopy: this.shadowRoot.getElementById('autoCopy').checked,
      call: this.shadowRoot.getElementById('call').checked
    };
    
    if (!data.name) return alert(this.t('fillName'));
    if (type === 'bark' && (!data.server || !data.key)) return alert(this.t('fillBarkServer'));
    if (type === 'url' && !data.url) return alert(this.t('fillUrl'));

    const method = this._editId ? 'PUT' : 'POST';
    const url = this._editId ? `/config/notify/${this._editId}` : '/config/notify';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    this.reset();
    this.loadConfig();
  }

  reset() {
    this._editId = null;
    this.renderForm();
  }

  getSoundOptions(current) {
    const sounds = ['default','alarm','anticipate','bell','birdsong','bloom','calypso','chime','choo','descent','electronic','fanfare','glass','gotosleep','healthnotification','horn','ladder','mailsent','minuet','multiwayinvitation','newmail','newsflash','noir','paymentsuccess','shake','sherwoodforest','silence','spell','suspense','telegraph','tiptoes','typewriters','update'];
    return sounds.map(s => `<option value="${s}" ${(current || 'default') === s ? 'selected' : ''}>${s}</option>`).join('');
  }

  esc(str) { return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
}

customElements.define('notify-config', NotifyConfig);
