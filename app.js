(() => {
  'use strict';
  const config = window.SITE_CONFIG || {};
  const datasets = {
    variables: { label: '变量名称表', file: '变量名称表.csv' }, switches: { label: '开关名称表', file: '开关名称表.csv' },
    weapons: { label: '武器', file: '武器.csv' }, armor: { label: '防具', file: '防具.csv' }, items: { label: '物品', file: '物品.csv' },
    actors: { label: '人物', file: '人物.csv' }, enemies: { label: '敌人', file: '敌人.csv' }, maps: { label: '地图', file: '地图.csv' },
    recruits: { label: '敌人入队', file: '敌人入队.csv', columns: ['敌人ID', '日本敌人名称', '中文敌人名称', '队友ID', '中文队友名称', '基础入队概率'] },
    skills: { label: '技能', file: '技能.csv', columns: ['技能ID', '中文名称', '中文所属', '中文说明', 'HP消耗', 'MP消耗', 'SP消耗（内部TP）'] },
    abilities: { label: '能力', file: '能力.csv', columns: ['能力ID', '中文名称', '中文所属', '中文说明', '所需AP'] },
    jobs: { label: '职业学习', file: '职业.csv', columns: ['来源ID', '中文名称', '学习等级', '学习类型', '学习对象ID', '中文技能/能力名称', '中文所属'], learning: true },
    races: { label: '种族学习', file: '种族.csv', columns: ['来源ID', '中文名称', '学习等级', '学习类型', '学习对象ID', '中文技能/能力名称', '中文所属'], learning: true }
  };
  const state = { key: 'variables', rows: [], headers: [], visibleRows: [], query: '', page: 1, pageSize: 50, cache: {}, learningType: '', learningLevel: '' };
  const els = { tabs: document.querySelector('.tabs'), tabScrollRange: document.querySelector('#tab-scroll-range'), thead: document.querySelector('#data-table thead'), tbody: document.querySelector('#data-table tbody'), tableState: document.querySelector('#table-state'), tableTitle: document.querySelector('#table-title'), resultCount: document.querySelector('#result-count'), pagination: document.querySelector('#pagination'), search: document.querySelector('#search-input'), pageSize: document.querySelector('#page-size'), download: document.querySelector('#download-csv'), filters: document.querySelector('#advanced-filters'), learningType: document.querySelector('#learning-type'), learningLevel: document.querySelector('#learning-level'), modal: document.querySelector('#detail-modal'), detailTitle: document.querySelector('#detail-title'), detailList: document.querySelector('#detail-list') };
  function setLink(id, url) { const node = document.getElementById(id); if (node) node.href = url || '#'; }
  function setupLinks() {
    const version = config.modVersion ? String(config.modVersion) : 'v—';
    ['header-version', 'footer-version'].forEach(id => { const node = document.getElementById(id); if (node) node.textContent = version; });
    document.title = `Gouqi Research Mod ${version}`;
    const github = config.githubUrl || '#'; const baidu = config.baiduUrl || '#'; ['header-github', 'hero-github'].forEach(id => setLink(id, github)); ['header-baidu', 'hero-baidu'].forEach(id => setLink(id, baidu));
    const note = document.querySelector('#config-note'); if (!note) return;
    if (!config.baiduUrl || config.baiduUrl === 'https://pan.baidu.com/') { note.textContent = '提示：请在 config.js 填入百度云分享链接、提取码和解压密码。'; return; }
    const details = []; if (config.baiduCode) details.push(`百度云提取码：${config.baiduCode}`); if (config.archivePassword) details.push(`解压密码：${config.archivePassword}`); note.textContent = details.join('　|　');
  }
  // Parse quoted CSV fields, including line breaks inside quoted cells.
  function parseCsv(text) {
    const rows = []; let row = []; let field = ''; let quoted = false; text = text.replace(/^\uFEFF/, '');
    for (let i = 0; i < text.length; i += 1) { const char = text[i];
      if (quoted) { if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; } else if (char === '"') quoted = false; else field += char; }
      else if (char === '"' && field.length === 0) quoted = true; else if (char === ',') { row.push(field); field = ''; }
      else if (char === '\n' || char === '\r') { if (char === '\r' && text[i + 1] === '\n') i += 1; row.push(field); field = ''; if (row.some(value => value.trim() !== '')) rows.push(row); row = []; } else field += char;
    }
    if (field.length || row.length) { row.push(field); if (row.some(value => value.trim() !== '')) rows.push(row); } if (!rows.length) return { headers: [], rows: [] };
    const headers = rows.shift().map((header, index) => header.trim() || `列 ${index + 1}`); return { headers, rows: rows.map(values => headers.map((_, index) => values[index] == null ? '' : values[index])) };
  }
  async function loadDataset(key) { if (state.cache[key]) return state.cache[key]; const response = await fetch(encodeURI(datasets[key].file), { cache: 'no-cache' }); if (!response.ok) throw new Error(`HTTP ${response.status}`); state.cache[key] = parseCsv(await response.text()); return state.cache[key]; }
  function columnIndex(name) { return state.headers.indexOf(name); }
  function filteredRows() {
    const query = state.query.trim().toLocaleLowerCase(); const typeIndex = columnIndex('学习类型'); const levelIndex = columnIndex('学习等级');
    return state.rows.filter(row => { if (query && !row.some(value => String(value).toLocaleLowerCase().includes(query))) return false; if (state.learningType && typeIndex >= 0 && row[typeIndex] !== state.learningType) return false; if (state.learningLevel && levelIndex >= 0) { const level = Number(row[levelIndex]); if (state.learningLevel === '5' ? level < 5 : level !== Number(state.learningLevel)) return false; } return true; });
  }
  function displayColumns() { return datasets[state.key].columns || state.headers; }
  function formatCell(value) {
    const text = String(value == null ? '' : value); const preview = text.length > 180 ? `${text.slice(0, 180)}…` : text;
    return `<td${text.length > 180 ? ` title="${escapeHtml(text)}"` : ''}>${escapeHtml(preview)}</td>`;
  }
  function renderTable() {
    const rows = filteredRows(); const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize)); state.page = Math.min(state.page, totalPages); const columns = displayColumns(); const indexes = columns.map(columnIndex); const start = (state.page - 1) * state.pageSize; state.visibleRows = rows.slice(start, start + state.pageSize);
    els.thead.innerHTML = `<tr>${columns.map(escapeHtml).map(header => `<th>${header}</th>`).join('')}<th class="action-column">操作</th></tr>`;
    els.tbody.innerHTML = state.visibleRows.map((row, rowIndex) => `<tr>${indexes.map(index => formatCell(index >= 0 ? row[index] : '')).join('')}<td class="action-column"><button class="detail-button" type="button" data-row-index="${rowIndex}">详情</button></td></tr>`).join('');
    els.tableState.hidden = rows.length > 0; els.tableState.textContent = state.rows.length ? '没有符合条件的记录' : '数据表为空'; els.resultCount.textContent = state.query || state.learningType || state.learningLevel ? `${rows.length.toLocaleString()} / ${state.rows.length.toLocaleString()} 条` : `${rows.length.toLocaleString()} 条`; renderPagination(totalPages);
  }
  function renderPagination(totalPages) { if (totalPages <= 1) { els.pagination.innerHTML = ''; return; } const buttons = [`<button type="button" data-page="prev" ${state.page === 1 ? 'disabled' : ''}>上一页</button>`]; const first = Math.max(1, Math.min(state.page - 2, totalPages - 4)); const last = Math.min(totalPages, first + 4); for (let page = first; page <= last; page += 1) buttons.push(`<button type="button" data-page="${page}" class="${page === state.page ? 'is-current' : ''}">${page}</button>`); buttons.push(`<button type="button" data-page="next" ${state.page === totalPages ? 'disabled' : ''}>下一页</button>`); els.pagination.innerHTML = buttons.join(''); }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function syncTabScrollRange() {
    if (!els.tabs || !els.tabScrollRange) return;
    const maxScroll = Math.max(0, els.tabs.scrollWidth - els.tabs.clientWidth);
    els.tabScrollRange.max = String(maxScroll); els.tabScrollRange.disabled = maxScroll === 0;
    els.tabScrollRange.value = String(Math.min(maxScroll, els.tabs.scrollLeft));
  }
  function syncUrl() {
    const params = new URLSearchParams(); params.set('dataset', state.key);
    if (state.query) params.set('q', state.query); if (state.learningType) params.set('type', state.learningType); if (state.learningLevel) params.set('level', state.learningLevel);
    if (state.page > 1) params.set('page', String(state.page)); if (state.pageSize !== 50) params.set('size', String(state.pageSize));
    const query = params.toString(); window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }
  function readUrlState() {
    const params = new URLSearchParams(window.location.search); const requested = params.get('dataset');
    const key = requested && datasets[requested] ? requested : 'variables'; const size = Number(params.get('size'));
    state.query = params.get('q') || ''; state.learningType = params.get('type') || ''; state.learningLevel = params.get('level') || '';
    state.page = Math.max(1, Number(params.get('page')) || 1); state.pageSize = [25, 50, 100].includes(size) ? size : 50;
    els.search.value = state.query; els.pageSize.value = String(state.pageSize); els.learningType.value = state.learningType; els.learningLevel.value = state.learningLevel;
    return key;
  }
  function showLoading() { els.tableState.hidden = false; els.tableState.textContent = '正在读取数据……'; els.thead.innerHTML = ''; els.tbody.innerHTML = ''; }
  function showDetails(row) { els.detailTitle.textContent = `${datasets[state.key].label} · 记录详情`; els.detailList.innerHTML = ''; state.headers.forEach((header, index) => { const term = document.createElement('dt'); const description = document.createElement('dd'); term.textContent = header; description.textContent = row[index] || '（空）'; els.detailList.append(term, description); }); els.modal.hidden = false; document.body.classList.add('modal-open'); els.modal.querySelector('.modal-close').focus(); }
  function closeDetails() { els.modal.hidden = true; document.body.classList.remove('modal-open'); }
  async function selectDataset(key, preserveState) {
    state.key = key; if (!preserveState) { state.query = ''; state.page = 1; state.learningType = ''; state.learningLevel = ''; els.search.value = ''; els.learningType.value = ''; els.learningLevel.value = ''; }
    els.tableTitle.textContent = datasets[key].label; els.filters.hidden = !datasets[key].learning; showLoading();
    document.querySelectorAll('.tab').forEach(tab => { const active = tab.dataset.dataset === key; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', active ? 'true' : 'false'); });
    try { const data = await loadDataset(key); state.headers = data.headers; state.rows = data.rows; renderTable(); syncUrl(); } catch (error) { els.tableState.hidden = false; els.tableState.textContent = `读取失败：${error.message}`; els.resultCount.textContent = ''; }
  }
  function downloadCurrent() { const source = state.cache[state.key]; if (!source) return; const csv = [source.headers, ...source.rows].map(row => row.map(value => { const text = String(value); return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }).join(',')).join('\r\n'); const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = datasets[state.key].file; link.click(); URL.revokeObjectURL(link.href); }
  document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => selectDataset(tab.dataset.dataset, false))); els.search.addEventListener('input', event => { state.query = event.target.value; state.page = 1; renderTable(); syncUrl(); }); els.pageSize.addEventListener('change', event => { state.pageSize = Number(event.target.value); state.page = 1; renderTable(); syncUrl(); }); els.learningType.addEventListener('change', event => { state.learningType = event.target.value; state.page = 1; renderTable(); syncUrl(); }); els.learningLevel.addEventListener('change', event => { state.learningLevel = event.target.value; state.page = 1; renderTable(); syncUrl(); });
  els.tbody.addEventListener('click', event => { const button = event.target.closest('.detail-button'); if (button) showDetails(state.visibleRows[Number(button.dataset.rowIndex)]); });
  els.pagination.addEventListener('click', event => { const button = event.target.closest('button'); if (!button || button.disabled) return; const target = button.dataset.page; const max = Math.max(1, Math.ceil(filteredRows().length / state.pageSize)); if (target === 'prev') state.page -= 1; else if (target === 'next') state.page += 1; else state.page = Number(target); state.page = Math.max(1, Math.min(max, state.page)); renderTable(); syncUrl(); }); els.download.addEventListener('click', downloadCurrent); document.querySelectorAll('[data-close-modal]').forEach(node => node.addEventListener('click', closeDetails)); document.addEventListener('keydown', event => { if (event.key === 'Escape' && !els.modal.hidden) closeDetails(); });
  if (els.tabs && els.tabScrollRange) { els.tabs.addEventListener('scroll', () => { els.tabScrollRange.value = String(els.tabs.scrollLeft); }); els.tabScrollRange.addEventListener('input', event => { els.tabs.scrollLeft = Number(event.target.value); }); window.addEventListener('resize', syncTabScrollRange); }
  window.addEventListener('popstate', () => { const key = readUrlState(); selectDataset(key, true); }); setupLinks(); const initialKey = readUrlState(); selectDataset(initialKey, true); window.requestAnimationFrame(syncTabScrollRange); window.setTimeout(syncTabScrollRange, 300);
})();
