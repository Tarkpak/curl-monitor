class AddMonitor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._notifyOptions = [];
    this._editId = null;
  }

  connectedCallback() {
    this.render();
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
    document.addEventListener('language-changed', () => this.render());
  }

  t(key) { return window.i18n?.t(key) || key; }

  set notifyOptions(val) {
    this._notifyOptions = val || [];
    this.renderNotifySelect();
  }

  open(editId = null) {
    this._editId = editId;
    this.updateTitle();
    if (editId) {
      this.loadMonitor(editId);
    } else {
      this.reset();
    }
    this.shadowRoot.getElementById('modal').classList.remove('hidden');
    this.shadowRoot.getElementById('curl').focus();
  }

  async loadMonitor(id) {
    try {
      const res = await fetch(`/monitor/${id}`);
      const data = await res.json();
      this.shadowRoot.getElementById('name').value = data.name || '';
      this.shadowRoot.getElementById('curl').value = data.curlCommand || '';
      this.shadowRoot.getElementById('interval').value = (data.interval / 1000) || 60;
      
      this.shadowRoot.querySelectorAll('.notify-cb').forEach(cb => {
        cb.checked = data.notifyIds?.includes(cb.value);
      });
      this.updateSelectText();
    } catch (err) {
      alert(this.t('loadFailed') + ': ' + err.message);
    }
  }

  updateTitle() {
    const title = this.shadowRoot.getElementById('dialogTitle');
    const btn = this.shadowRoot.getElementById('submitBtn');
    if (this._editId) {
      title.textContent = this.t('editMonitorTitle');
      btn.textContent = this.t('save');
    } else {
      title.textContent = this.t('addMonitorTitle');
      btn.textContent = this.t('add');
    }
  }

  close() {
    this.shadowRoot.getElementById('modal').classList.add('hidden');
    this._editId = null;
  }

  reset() {
    this.shadowRoot.getElementById('name').value = '';
    this.shadowRoot.getElementById('curl').value = '';
    this.shadowRoot.getElementById('interval').value = '60';
    this._notifyOptions.forEach(n => {
      const cb = this.shadowRoot.querySelector(`input[value="${n.id}"]`);
      if (cb) cb.checked = true;
    });
    this.updateSelectText();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .modal.hidden { display: none; }
        .dialog { background: white; border-radius: 12px; box-shadow: 0 25px 50px rgba(0,0,0,0.25); width: 100%; max-width: 600px; }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
        .title { font-size: 18px; font-weight: 600; }
        .close { font-size: 24px; color: #6b7280; cursor: pointer; border: none; background: none; }
        .body { padding: 20px; }
        label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px; }
        textarea { width: 100%; height: 120px; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; box-sizing: border-box; }
        textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .row { display: flex; gap: 20px; margin-top: 16px; }
        .field { flex: 1; }
        .field-small { width: 120px; flex-shrink: 0; }
        input[type="text"], input[type="number"] { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
        input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .select-wrap { position: relative; }
        .select-trigger { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: white; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 14px; box-sizing: border-box; }
        .select-trigger:hover { border-color: #9ca3af; }
        .select-dropdown { display: none; position: absolute; z-index: 10; width: 100%; margin-top: 4px; background: white; border: 1px solid #d1d5db; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-height: 200px; overflow: auto; }
        .select-dropdown.open { display: block; }
        .select-all { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
        .select-options { padding: 8px; }
        .option { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 14px; }
        .option:hover { background: #f3f4f6; }
        .option input { width: 16px; height: 16px; }
        .arrow { color: #9ca3af; }
        .footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        .btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-primary:hover { background: #2563eb; }
        .btn-secondary { background: #f3f4f6; color: #374151; }
        .btn-secondary:hover { background: #e5e7eb; }
        .empty { color: #9ca3af; padding: 8px; font-size: 14px; }
      </style>
      <div id="modal" class="modal hidden" onclick="if(event.target===this)this.getRootNode().host.close()">
        <div class="dialog">
          <div class="header">
            <span class="title" id="dialogTitle">${this.t('addMonitorTitle')}</span>
            <button class="close" onclick="this.getRootNode().host.close()">×</button>
          </div>
          <div class="body">
            <div class="row" style="margin-top:0">
              <div class="field">
                <label>${this.t('monitorName')}</label>
                <input type="text" id="name" placeholder="${this.t('monitorNamePlaceholder')}">
              </div>
            </div>
            <div style="margin-top:16px">
              <label>${this.t('curlCommand')}</label>
              <textarea id="curl" placeholder="${this.t('curlPlaceholder')}"></textarea>
            </div>
            <div class="row">
              <div class="field-small">
                <label>${this.t('checkInterval')}</label>
                <input type="number" id="interval" value="60" min="10">
              </div>
              <div class="field">
                <label>${this.t('notifyChannels')}</label>
                <div class="select-wrap">
                  <div class="select-trigger" id="selectTrigger">
                    <span id="selectText">${this.t('selectNotify')}</span>
                    <span class="arrow">▼</span>
                  </div>
                  <div class="select-dropdown" id="selectDropdown">
                    <div class="select-all">
                      <label class="option">
                        <input type="checkbox" id="selectAll" checked>
                        <span style="font-weight:500">All</span>
                      </label>
                    </div>
                    <div class="select-options" id="selectOptions"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="footer">
              <button class="btn btn-secondary" onclick="this.getRootNode().host.close()">${this.t('cancel')}</button>
              <button class="btn btn-primary" id="submitBtn">${this.t('add')}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('selectTrigger').onclick = (e) => {
      e.stopPropagation();
      this.shadowRoot.getElementById('selectDropdown').classList.toggle('open');
    };

    this.shadowRoot.getElementById('selectAll').onchange = (e) => {
      this.toggleAll(e.target.checked);
    };

    this.shadowRoot.getElementById('submitBtn').onclick = () => this.submit();

    this.shadowRoot.addEventListener('click', (e) => {
      if (!e.target.closest('.select-wrap')) {
        this.shadowRoot.getElementById('selectDropdown').classList.remove('open');
      }
    });

    this.renderNotifySelect();
  }

  renderNotifySelect() {
    const container = this.shadowRoot.getElementById('selectOptions');
    if (!container) return;
    
    if (this._notifyOptions.length === 0) {
      container.innerHTML = `<div class="empty">${this.t('noNotifyConfig')}</div>`;
      this.updateSelectText();
      return;
    }

    container.innerHTML = this._notifyOptions.map(n => `
      <label class="option">
        <input type="checkbox" value="${n.id}" checked class="notify-cb">
        <span>${this.esc(n.name)}</span>
      </label>
    `).join('');

    container.querySelectorAll('.notify-cb').forEach(cb => {
      cb.onchange = () => this.updateSelectText();
    });

    this.updateSelectText();
  }

  toggleAll(checked) {
    this.shadowRoot.querySelectorAll('.notify-cb').forEach(cb => cb.checked = checked);
    this.updateSelectText();
  }

  updateSelectText() {
    const cbs = this.shadowRoot.querySelectorAll('.notify-cb');
    const checked = Array.from(cbs).filter(cb => cb.checked);
    const text = this.shadowRoot.getElementById('selectText');
    const selectAll = this.shadowRoot.getElementById('selectAll');

    if (cbs.length === 0) text.textContent = this.t('noNotifyConfig');
    else if (checked.length === 0) text.textContent = this.t('selectNotify');
    else if (checked.length === cbs.length) text.textContent = 'All';
    else text.textContent = `${checked.length} selected`;

    if (selectAll) selectAll.checked = checked.length === cbs.length;
  }

  async submit() {
    const name = this.shadowRoot.getElementById('name').value.trim();
    const curl = this.shadowRoot.getElementById('curl').value.trim();
    const interval = this.shadowRoot.getElementById('interval').value;
    const notifyIds = Array.from(this.shadowRoot.querySelectorAll('.notify-cb:checked')).map(cb => cb.value);

    if (!curl) return alert(this.t('curlPlaceholder'));
    if (notifyIds.length === 0) return alert(this.t('mustSelectNotify'));

    try {
      if (this._editId) {
        const res = await fetch(`/monitor/${this._editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, curl, interval, notifyIds: notifyIds.join(',') })
        });
        const data = await res.json();
        if (data.error) return alert(data.error);
      } else {
        const form = new URLSearchParams();
        form.append('name', name);
        form.append('curl', curl);
        form.append('interval', interval);
        form.append('notifyIds', notifyIds.join(','));
        const res = await fetch('/add', { method: 'POST', body: form });
        if (!res.redirected && !res.ok) {
          const text = await res.text();
          return alert(text || this.t('saveFailed'));
        }
      }
      this.close();
      this.dispatchEvent(new CustomEvent('saved'));
    } catch (err) {
      alert(this.t('saveFailed') + ': ' + err.message);
    }
  }

  esc(str) { return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
}

customElements.define('add-monitor', AddMonitor);
