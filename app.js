(() => {
  'use strict';

  const config = window.SITE_CONFIG || {};
  const datasets = {
    variables: { label: '变量名称表', file: '变量名称表.csv' },
    switches: { label: '开关名称表', file: '开关名称表.csv' },
    weapons: { label: '武器', file: '武器.csv' },
    armor: { label: '防具', file: '防具.csv' },
    items: { label: '物品', file: '物品.csv' }
  };
  const state = { key: 'variables', rows: [], headers: [], query: '', page: 1, pageSize: 50, cache: {} };
  const els = {
    table: document.querySelector('#data-table'), thead: document.querySelector('#data-table thead'), tbody: document.querySelector('#data-table tbody'),
    tableState: document.querySelector('#table-state'), tableTitle: document.querySelector('#table-title'), resultCount: document.querySelector('#result-count'),
    pagination: document.querySelector('#pagination'), search: document.querySelector('#search-input'), pageSize: document.querySelector('#page-size'), download: document.querySelector('#download-csv')
  };

  function setLink(id, url) {
    const node = document.getElementById(id);
    if (node) node.href = url || '#';
  }
  function setupLinks() {
    const github = config.githubUrl || '#';
    const baidu = config.baiduUrl || '#';
    ['header-github', 'hero-github'].forEach(id => setLink(id, github));
    ['header-baidu', 'hero-baidu'].forEach(id => setLink(id, baidu));
    const note = document.querySelector('#config-note');
    if (note && (!config.baiduUrl || config.baiduUrl === 'https://pan.baidu.com/')) note.textContent = '提示：请在 config.js 填入百度云分享链接与提取码。';
    else if (note && config.baiduCode) note.textContent = `百度云提取码：${config.baiduCode}`;
  }

  // Parse quoted CSV fields without requiring a third-party library.
  function parseCsv(text) {
    const rows = []; let row = []; let field = ''; let quoted = false;
    text = text.replace(/^\uFEFF/, '');
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (quoted) {
        if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
        else if (char === '"') quoted = false;
        else field += char;
      } else if (char === '"' && field.length === 0) quoted = true;
      else if (char === ',') { row.push(field); field = ''; }
      else if (char === '\n' || char === '\r') {
        if (char === '\r' && text[i + 1] === '\n') i += 1;
        row.push(field); field = '';
        if (row.some(value => value.trim() !== '')) rows.push(row);
        row = [];
      } else field += char;
    }
    if (field.length || row.length) { row.push(field); if (row.some(value => value.trim() !== '')) rows.push(row); }
    if (!rows.length) return { headers: [], rows: [] };
    const headers = rows.shift().map((header, index) => header.trim() || `列 ${index + 1}`);
    return { headers, rows: rows.map(values => headers.map((_, index) => values[index] == null ? '' : values[index])) };
  }

  async function loadDataset(key) {
    if (state.cache[key]) return state.cache[key];
    const response = await fetch(encodeURI(datasets[key].file), { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = parseCsv(await response.text());
    state.cache[key] = parsed;
    return parsed;
  }
  function filteredRows() {
    const query = state.query.trim().toLocaleLowerCase();
    if (!query) return state.rows;
    return state.rows.filter(row => row.some(value => String(value).toLocaleLowerCase().includes(query)));
  }
  function renderTable() {
    const rows = filteredRows(); const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * state.pageSize;
    els.thead.innerHTML = `<tr>${state.headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr>`;
    els.tbody.innerHTML = rows.slice(start, start + state.pageSize).map(row => `<tr>${row.map(value => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('');
    els.tableState.hidden = rows.length > 0;
    els.tableState.textContent = state.rows.length ? '没有符合条件的记录' : '数据表为空';
    els.resultCount.textContent = state.query ? `${rows.length.toLocaleString()} / ${state.rows.length.toLocaleString()} 条` : `${rows.length.toLocaleString()} 条`;
    renderPagination(totalPages);
  }
  function renderPagination(totalPages) {
    if (totalPages <= 1) { els.pagination.innerHTML = ''; return; }
    const buttons = [];
    buttons.push(`<button type="button" data-page="prev" ${state.page === 1 ? 'disabled' : ''}>上一页</button>`);
    const first = Math.max(1, Math.min(state.page - 2, totalPages - 4));
    const last = Math.min(totalPages, first + 4);
    for (let page = first; page <= last; page += 1) buttons.push(`<button type="button" data-page="${page}" class="${page === state.page ? 'is-current' : ''}">${page}</button>`);
    buttons.push(`<button type="button" data-page="next" ${state.page === totalPages ? 'disabled' : ''}>下一页</button>`);
    els.pagination.innerHTML = buttons.join('');
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function showLoading() { els.tableState.hidden = false; els.tableState.textContent = '正在读取数据……'; els.thead.innerHTML = ''; els.tbody.innerHTML = ''; }
  async function selectDataset(key) {
    state.key = key; state.query = ''; state.page = 1; els.search.value = ''; els.tableTitle.textContent = datasets[key].label; showLoading();
    document.querySelectorAll('.tab').forEach(tab => { const active = tab.dataset.dataset === key; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', active ? 'true' : 'false'); });
    try { const data = await loadDataset(key); state.headers = data.headers; state.rows = data.rows; renderTable(); }
    catch (error) { els.tableState.hidden = false; els.tableState.textContent = `读取失败：${error.message}`; els.resultCount.textContent = ''; }
  }
  function downloadCurrent() {
    const source = state.cache[state.key]; if (!source) return;
    const csv = [source.headers, ...source.rows].map(row => row.map(value => { const text = String(value); return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }); const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = datasets[state.key].file; link.click(); URL.revokeObjectURL(link.href);
  }
  document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => selectDataset(tab.dataset.dataset)));
  els.search.addEventListener('input', event => { state.query = event.target.value; state.page = 1; renderTable(); });
  els.pageSize.addEventListener('change', event => { state.pageSize = Number(event.target.value); state.page = 1; renderTable(); });
  els.pagination.addEventListener('click', event => { const button = event.target.closest('button'); if (!button || button.disabled) return; const target = button.dataset.page; const max = Math.max(1, Math.ceil(filteredRows().length / state.pageSize)); if (target === 'prev') state.page -= 1; else if (target === 'next') state.page += 1; else state.page = Number(target); state.page = Math.max(1, Math.min(max, state.page)); renderTable(); });
  els.download.addEventListener('click', downloadCurrent);
  setupLinks(); selectDataset('variables');
})();
