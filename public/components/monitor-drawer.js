class MonitorDrawer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._monitor = null;
    this._allData = [];
    this._selectedRecord = null;
  }

  connectedCallback() {
    this.render();
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this._selectedRecord) {
          this.closeDetail();
        } else {
          this.close();
        }
      }
    });
    document.addEventListener('language-changed', () => {
      this.render();
      if (this._monitor) this.renderList();
    });
  }

  t(key) {
    return window.i18n?.t(key) || key;
  }

  set allData(val) { this._allData = val; }

  open(monitorId) {
    this._monitor = this._allData.find(m => m.id === monitorId);
    if (!this._monitor) return;
    this._selectedRecord = null;
    this.renderList();
    this.shadowRoot.getElementById('overlay').classList.remove('hidden');
    this.shadowRoot.getElementById('drawer').classList.add('open');
  }

  close() {
    this.shadowRoot.getElementById('overlay').classList.add('hidden');
    this.shadowRoot.getElementById('drawer').classList.remove('open');
    this.closeDetail();
  }

  showDetail(historyId) {
    this._selectedRecord = this._monitor?.history.find(h => String(h.id) === String(historyId));
    if (!this._selectedRecord) return;
    this.renderDetail();
    this.shadowRoot.getElementById('detailOverlay').classList.remove('hidden');
    this.shadowRoot.getElementById('detailDrawer').classList.add('open');
  }

  closeDetail() {
    this.shadowRoot.getElementById('detailOverlay').classList.add('hidden');
    this.shadowRoot.getElementById('detailDrawer').classList.remove('open');
    this._selectedRecord = null;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; }
        .overlay.hidden { display: none; }
        .drawer {
          position: fixed; right: 0; top: 0; height: 100%; width: 100%; max-width: 500px;
          background: white; box-shadow: -4px 0 6px rgba(0,0,0,0.1); z-index: 50;
          transform: translateX(100%); transition: transform 0.3s; display: flex; flex-direction: column;
        }
        .drawer.open { transform: translateX(0); }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #e5e7eb; }
        .title { font-size: 16px; font-weight: 600; }
        .close { font-size: 24px; color: #6b7280; cursor: pointer; border: none; background: none; }
        .close:hover { color: #374151; }
        .body { flex: 1; overflow: auto; padding: 16px; }
        .url-box { padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 16px; }
        .url-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
        .url-text { font-size: 14px; word-break: break-all; }
        .stats-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .stats-title { font-weight: 500; color: #374151; }
        .stats { display: flex; gap: 16px; font-size: 14px; }
        .stats-ok { color: #16a34a; }
        .stats-change { color: #d97706; }
        .stats-error { color: #ef4444; }
        .history { display: flex; flex-direction: column; gap: 8px; }
        .record { padding: 12px; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .record:hover { filter: brightness(0.95); }
        .record-ok { background: #f9fafb; border: 1px solid #e5e7eb; }
        .record-change { background: #fef3c7; border: 1px solid #f59e0b; }
        .record-error { background: #fee2e2; border: 1px solid #ef4444; }
        .record-time { font-size: 14px; color: #374151; }
        .record-meta { font-size: 12px; color: #6b7280; }
        .badge { padding: 2px 8px; font-size: 12px; border-radius: 9999px; color: white; }
        .badge-ok { background: #22c55e; }
        .badge-change { background: #f59e0b; }
        .badge-error { background: #ef4444; }
        
        /* Second-level drawer */
        .detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 55; }
        .detail-overlay.hidden { display: none; }
        .detail-drawer {
          position: fixed; right: 0; top: 0; height: 100%; width: 100%; max-width: 1000px;
          background: white; box-shadow: -4px 0 6px rgba(0,0,0,0.15); z-index: 60;
          transform: translateX(100%); transition: transform 0.3s; display: flex; flex-direction: column;
        }
        .detail-drawer.open { transform: translateX(0); }
        .detail-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #e5e7eb; }
        .detail-header-left { display: flex; align-items: center; gap: 12px; }
        .back-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; padding: 4px 8px; border-radius: 4px; }
        .back-btn:hover { background: #e5e7eb; }
        .detail-body { flex: 1; overflow: auto; padding: 16px; }
        
        /* Left-right layout */
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; height: 100%; }
        .detail-column { display: flex; flex-direction: column; min-height: 0; }
        
        /* Detail view styles */
        .detail-section { margin-bottom: 16px; flex: 1; display: flex; flex-direction: column; min-height: 0; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .section-title { font-weight: 600; color: #374151; }
        .badge-method { background: #dbeafe; color: #1d4ed8; padding: 4px 8px; font-size: 12px; border-radius: 4px; }
        .badge-status { padding: 2px 8px; font-size: 12px; border-radius: 4px; }
        .badge-status-ok { background: #dcfce7; color: #166534; }
        .badge-status-error { background: #fee2e2; color: #991b1b; }
        .meta-text { font-size: 12px; color: #6b7280; }
        .box { background: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
        .box-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
        pre { margin: 0; font-size: 12px; background: #f9fafb; border-radius: 8px; padding: 12px; white-space: pre-wrap; word-break: break-all; overflow: auto; }
        .error-box { padding: 16px; background: #fef2f2; border-radius: 8px; color: #991b1b; }
        .diff-section { margin-top: 16px; }
        .diff-title { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
        .diff-content { background: #f9fafb; border-radius: 8px; padding: 12px; max-height: 300px; overflow: auto; }
        .diff-item { padding: 8px; border-radius: 4px; margin-bottom: 8px; }
        .diff-add { background: #dcfce7; border-left: 4px solid #22c55e; }
        .diff-remove { background: #fee2e2; border-left: 4px solid #ef4444; }
        .diff-modify { background: #fef3c7; border-left: 4px solid #f59e0b; }
        .diff-path { font-family: monospace; color: #2563eb; font-size: 13px; }
        .diff-label { font-size: 11px; font-weight: 500; margin-bottom: 4px; }
        .diff-value { background: rgba(0,0,0,0.05); padding: 4px 8px; border-radius: 4px; margin-top: 4px; font-family: monospace; max-height: 100px; overflow: auto; }
        .diff-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px; }
        .key { color: #2563eb; }
        .string { color: #16a34a; }
        .number { color: #d97706; }
        .boolean { color: #7c3aed; }
        .null { color: #6b7280; }
      </style>
      <div id="overlay" class="overlay hidden" onclick="this.getRootNode().host.close()"></div>
      <div id="drawer" class="drawer">
        <div class="header">
          <span class="title" id="drawerTitle"></span>
          <button class="close" onclick="this.getRootNode().host.close()">×</button>
        </div>
        <div class="body" id="drawerBody"></div>
      </div>
      <div id="detailOverlay" class="detail-overlay hidden" onclick="this.getRootNode().host.closeDetail()"></div>
      <div id="detailDrawer" class="detail-drawer">
        <div class="detail-header">
          <div class="detail-header-left">
            <button class="back-btn" onclick="this.getRootNode().host.closeDetail()">←</button>
            <span class="title" id="detailTitle"></span>
          </div>
          <button class="close" onclick="this.getRootNode().host.closeDetail()">×</button>
        </div>
        <div class="detail-body" id="detailBody"></div>
      </div>
    `;
  }


  renderList() {
    const m = this._monitor;
    this.shadowRoot.getElementById('drawerTitle').textContent = m.name || this.t('monitorDetail');

    const ok = m.history.filter(h => !h.error && !h.changed).length;
    const changes = m.history.filter(h => h.changed).length;
    const errors = m.history.filter(h => h.error).length;

    this.shadowRoot.getElementById('drawerBody').innerHTML = `
      <div class="url-box">
        <div class="url-label">${this.t('fullUrl')}</div>
        <div class="url-text">${this.esc(m.url || '-')}</div>
      </div>
      <div class="stats-row">
        <span class="stats-title">${this.t('checkHistory')} (${m.history.length})</span>
        <span class="stats">
          <span class="stats-ok">${ok} ${this.t('normal')}</span> · 
          <span class="stats-change">${changes} ${this.t('changed')}</span> · 
          <span class="stats-error">${errors} ${this.t('error')}</span>
        </span>
      </div>
      <div class="history">
        ${m.history.map(h => {
          const cls = h.error ? 'record-error' : h.changed ? 'record-change' : 'record-ok';
          const badge = h.error ? `<span class="badge badge-error">${this.t('error')}</span>` :
                        h.changed ? `<span class="badge badge-change">${this.t('changed')}</span>` :
                        `<span class="badge badge-ok">${this.t('normal')}</span>`;
          return `
            <div class="record ${cls}" data-id="${h.id}">
              <div>
                <div class="record-time">${h.time}</div>
                ${h.response ? `<div class="record-meta">${h.response.status} · ${h.response.responseTime}ms</div>` : ''}
              </div>
              ${badge}
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.shadowRoot.querySelectorAll('.record').forEach(el => {
      el.onclick = () => this.showDetail(el.dataset.id);
    });
  }

  renderDetail() {
    const record = this._selectedRecord;
    this.shadowRoot.getElementById('detailTitle').textContent = `${this.t('detailTitle')} - ${record.time}`;

    if (record.error) {
      this.shadowRoot.getElementById('detailBody').innerHTML = `<div class="error-box"><strong>${this.t('error')}:</strong> ${this.esc(record.error)}</div>`;
      return;
    }

    const r = record.response;
    const req = r.request || {};
    let baseUrl = req.url || '-';
    let urlParams = {};
    try {
      const u = new URL(req.url);
      baseUrl = u.origin + u.pathname;
      u.searchParams.forEach((v, k) => urlParams[k] = v);
    } catch {}

    let html = `<div class="detail-grid">
      <div class="detail-column">
        <div class="detail-section">
          <div class="section-header">
            <span class="section-title">${this.t('request')}</span>
            <span class="badge-method">${req.method || 'GET'}</span>
          </div>
          <div class="box">
            <div class="box-label">URL</div>
            <div style="font-size:13px;word-break:break-all">${this.esc(baseUrl)}</div>
          </div>
          ${Object.keys(urlParams).length ? `
          <div class="box">
            <div class="box-label">${this.t('queryParams')}</div>
            <pre>${this.highlight(JSON.stringify(urlParams, null, 2))}</pre>
          </div>` : ''}
          <div class="box-label">${this.t('requestHeaders')}</div>
          <pre style="flex:1;min-height:100px">${this.highlight(JSON.stringify(req.headers || {}, null, 2))}</pre>
          ${req.body ? `<div class="box-label" style="margin-top:8px">${this.t('requestBody')}</div><pre>${this.formatJson(req.body)}</pre>` : ''}
        </div>
      </div>
      <div class="detail-column">
        <div class="detail-section">
          <div class="section-header">
            <span class="section-title">${this.t('response')}</span>
            <div>
              <span class="badge-status ${r.status >= 400 ? 'badge-status-error' : 'badge-status-ok'}">${r.status} ${r.statusText}</span>
              <span class="meta-text" style="margin-left:8px">${r.responseTime}ms</span>
            </div>
          </div>
          <div class="box-label">${this.t('responseHeaders')}</div>
          <pre style="max-height:150px">${this.highlight(JSON.stringify(r.headers, null, 2))}</pre>
          <div class="box-label" style="margin-top:8px">${this.t('responseBody')}</div>
          <pre style="flex:1;min-height:200px">${this.formatJson(r.body)}</pre>
        </div>
      </div>
    </div>`;

    if (record.changed && record.previousBody) {
      html += `
        <div class="diff-section">
          <div class="diff-title">${this.t('diffTitle')}</div>
          <div class="diff-content">${this.renderDiff(record.previousBody, r.body)}</div>
        </div>
      `;
    }

    this.shadowRoot.getElementById('detailBody').innerHTML = html;
  }


  renderDiff(oldText, newText) {
    let oldObj, newObj;
    try { oldObj = JSON.parse(oldText); newObj = JSON.parse(newText); }
    catch { return this.renderTextDiff(oldText, newText); }

    const changes = this.deepCompare(oldObj, newObj);
    if (changes.length === 0) return `<div style="color:#6b7280">${this.t('noChange')}</div>`;

    return `<div style="margin-bottom:8px;color:#6b7280">${this.t('diffCount').replace('{count}', changes.length)}</div>` +
      changes.map(c => {
        if (c.type === 'added') {
          return `<div class="diff-item diff-add">
            <div class="diff-label" style="color:#166534">${this.t('added')}</div>
            <div class="diff-path">${this.esc(c.path)}</div>
            <div class="diff-value">${this.esc(this.formatValue(c.newVal))}</div>
          </div>`;
        } else if (c.type === 'removed') {
          return `<div class="diff-item diff-remove">
            <div class="diff-label" style="color:#991b1b">${this.t('removed')}</div>
            <div class="diff-path">${this.esc(c.path)}</div>
            <div class="diff-value">${this.esc(this.formatValue(c.oldVal))}</div>
          </div>`;
        } else {
          return `<div class="diff-item diff-modify">
            <div class="diff-label" style="color:#92400e">${this.t('modified')}</div>
            <div class="diff-path">${this.esc(c.path)}</div>
            <div class="diff-grid">
              <div><div style="font-size:11px;color:#991b1b">${this.t('oldValue')}</div><div class="diff-value">${this.esc(this.formatValue(c.oldVal))}</div></div>
              <div><div style="font-size:11px;color:#166534">${this.t('newValue')}</div><div class="diff-value">${this.esc(this.formatValue(c.newVal))}</div></div>
            </div>
          </div>`;
        }
      }).join('');
  }

  renderTextDiff(oldText, newText) {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const result = [];
    let i = 0, j = 0;
    while (i < oldLines.length || j < newLines.length) {
      if (i >= oldLines.length) result.push({ type: 'add', line: newLines[j++] });
      else if (j >= newLines.length) result.push({ type: 'remove', line: oldLines[i++] });
      else if (oldLines[i] === newLines[j]) { result.push({ type: 'same', line: oldLines[i] }); i++; j++; }
      else { result.push({ type: 'remove', line: oldLines[i++] }); result.push({ type: 'add', line: newLines[j++] }); }
    }
    return result.map(d => {
      if (d.type === 'add') return `<div style="background:#dcfce7;color:#166534;padding:2px 8px">+ ${this.esc(d.line)}</div>`;
      if (d.type === 'remove') return `<div style="background:#fee2e2;color:#991b1b;padding:2px 8px">- ${this.esc(d.line)}</div>`;
      return `<div style="padding:2px 8px;color:#6b7280">  ${this.esc(d.line)}</div>`;
    }).join('');
  }

  deepCompare(oldObj, newObj, path = '') {
    const changes = [];
    if (typeof oldObj !== typeof newObj) {
      changes.push({ path, type: 'modified', oldVal: oldObj, newVal: newObj });
      return changes;
    }
    if (oldObj === null || newObj === null || typeof oldObj !== 'object') {
      if (oldObj !== newObj) changes.push({ path, type: 'modified', oldVal: oldObj, newVal: newObj });
      return changes;
    }
    if (Array.isArray(oldObj) && Array.isArray(newObj)) {
      const max = Math.max(oldObj.length, newObj.length);
      for (let i = 0; i < max; i++) {
        const p = path ? `${path}[${i}]` : `[${i}]`;
        if (i >= oldObj.length) changes.push({ path: p, type: 'added', newVal: newObj[i] });
        else if (i >= newObj.length) changes.push({ path: p, type: 'removed', oldVal: oldObj[i] });
        else changes.push(...this.deepCompare(oldObj[i], newObj[i], p));
      }
      return changes;
    }
    const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    for (const k of keys) {
      const p = path ? `${path}.${k}` : k;
      if (!(k in oldObj)) changes.push({ path: p, type: 'added', newVal: newObj[k] });
      else if (!(k in newObj)) changes.push({ path: p, type: 'removed', oldVal: oldObj[k] });
      else changes.push(...this.deepCompare(oldObj[k], newObj[k], p));
    }
    return changes;
  }

  formatValue(val) {
    if (val === undefined) return 'undefined';
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return JSON.stringify(val);
  }

  formatJson(str) {
    try { return this.highlight(JSON.stringify(JSON.parse(str), null, 2)); }
    catch { return this.esc(str); }
  }

  highlight(json) {
    return this.esc(json).replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, m => {
      let cls = 'number';
      if (/^"/.test(m)) cls = /:$/.test(m) ? 'key' : 'string';
      else if (/true|false/.test(m)) cls = 'boolean';
      else if (/null/.test(m)) cls = 'null';
      return `<span class="${cls}">${m}</span>`;
    });
  }

  esc(str) { return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
}

customElements.define('monitor-drawer', MonitorDrawer);
