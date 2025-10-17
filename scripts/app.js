// Single-module app (vanilla ES module)
const KEY = 'sf:records:v1';
const SETTINGS_KEY = 'sf:settings:v1';
const SEED = [
  {id:'txn_0001',description:'Lunch at cafeteria',amount:12.50,category:'Food',date:'2025-09-25',createdAt:'2025-09-25T12:30:00.000Z',updatedAt:'2025-09-25T12:30:00.000Z'},
  {id:'txn_0002',description:'Chemistry textbook',amount:89.99,category:'Books',date:'2025-09-23',createdAt:'2025-09-23T09:00:00.000Z',updatedAt:'2025-09-23T09:00:00.000Z'},
  {id:'txn_0003',description:'Bus pass monthly',amount:45.00,category:'Transport',date:'2025-09-20',createdAt:'2025-09-20T08:00:00.000Z',updatedAt:'2025-09-20T08:00:00.000Z'},
  {id:'txn_0004',description:'Coffee with friends',amount:8.75,category:'Entertainment',date:'2025-09-28',createdAt:'2025-09-28T15:00:00.000Z',updatedAt:'2025-09-28T15:00:00.000Z'},
  {id:'txn_0005',description:'Library fine',amount:2.00,category:'Other',date:'2025-08-05',createdAt:'2025-08-05T10:00:00.000Z',updatedAt:'2025-08-05T10:00:00.000Z'},
  {id:'txn_0006',description:'Laptop charger',amount:24.99,category:'Fees',date:'2025-07-15',createdAt:'2025-07-15T11:30:00.000Z',updatedAt:'2025-07-15T11:30:00.000Z'},
  {id:'txn_0007',description:'Snack--midnight study',amount:3.50,category:'Food',date:'2025-10-01',createdAt:'2025-10-01T00:30:00.000Z',updatedAt:'2025-10-01T00:30:00.000Z'},
  {id:'txn_0008',description:'Exam fees payment',amount:120.00,category:'Fees',date:'2025-09-01',createdAt:'2025-09-01T09:30:00.000Z',updatedAt:'2025-09-01T09:30:00.000Z'},
  {id:'txn_0009',description:'Beverage coffee coffee',amount:6.00,category:'Entertainment',date:'2025-09-29',createdAt:'2025-09-29T08:45:00.000Z',updatedAt:'2025-09-29T08:45:00.000Z'},
  {id:'txn_0010',description:'Used book purchase',amount:15.00,category:'Books',date:'2025-08-30',createdAt:'2025-08-30T14:00:00.000Z',updatedAt:'2025-08-30T14:00:00.000Z'}
];


// console.log("JS file is linked!");
// alert("JS is working!");


const menuToggle = document.getElementById('menuToggle');
const menu = document.querySelector('.menu');

menuToggle.addEventListener('click', () => {
  menu.classList.toggle('show');
  
});


// variable holds regex validators
const patterns = {
  description: /^\S(?:.*\S)?$/,
  amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
  duplicateWords: /\b(\w+)\s+\1\b/i
};



// Functions to load/save data within browser localStorage
function loadRecords(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return null;
    const arr = JSON.parse(raw);
    if(Array.isArray(arr)) return arr;
    return null;
  } catch(e){ console.error('loadRecords', e); return null; }
}
function saveRecords(arr){ localStorage.setItem(KEY, JSON.stringify(arr)); }

function loadSettings(){
  try{ const raw = localStorage.getItem(SETTINGS_KEY); if(!raw) return null; return JSON.parse(raw); } catch(e){ return null; }
}
function saveSettings(obj){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(obj)); }

function validateRecord(rec){
  const errors = {};
  if(!patterns.description.test(rec.description)) errors.description='Invalid description';
  if(!patterns.amount.test(String(rec.amount))) errors.amount='Invalid amount';
  if(!patterns.date.test(rec.date)) errors.date='Invalid date';
  if(!patterns.category.test(rec.category)) errors.category='Invalid category';
  if(patterns.duplicateWords.test(rec.description)) errors.duplicateWords='Duplicate adjacent words';
  return { valid: Object.keys(errors).length === 0, errors };
}

function compileRegex(input, flags='i'){
  if(!input) return null;
  try{ if(!flags.includes('g')) flags = flags + 'g'; return new RegExp(input, flags); } catch(e){ return null; }
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function highlight(text, re){
  if(!re) return escapeHtml(text);
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const g = new RegExp(re.source, flags);
  let out = '', last = 0, m;
  while((m = g.exec(text)) !== null){
    out += escapeHtml(text.slice(last, m.index));
    out += `<mark>${escapeHtml(m[0])}</mark>`;
    last = m.index + m[0].length;
    if(m.index === g.lastIndex) g.lastIndex++;
  }
  out += escapeHtml(text.slice(last));
  return out;
}

// state
let records = loadRecords();
if(!records){ records = SEED.slice(); saveRecords(records); }

let settings = loadSettings() || { theme:'dark', base:'RWF', usd:0.001, eur:0.0009, cap: null };
let currentRegex = null;
let currentSort = { field:'date', dir:'desc' };
let editingId = null;

// DOM refs
const els = {
  menuToggle: document.getElementById('menuToggle'),
  primaryMenu: document.getElementById('primaryMenu'),
  menuBtns: document.querySelectorAll('.menu-btn'),
  sections: {
    dashboard: document.getElementById('dashboard'),
    records: document.getElementById('records'),
    add: document.getElementById('add'),
    settings: document.getElementById('settings'),
    about: document.getElementById('about')
  },
  txnBody: document.getElementById('txnBody'),
  cardList: document.getElementById('cardList'),
  searchInput: document.getElementById('searchInput'),
  flagI: document.getElementById('flagI'),
  applySearch: document.getElementById('applySearch'),
  clearSearch: document.getElementById('clearSearch'),
  exportJSON: document.getElementById('exportJSON'),
  importFile: document.getElementById('importFile'),
  statTotal: document.getElementById('statTotal'),
  statIncome: document.getElementById('statIncome'),
  statExpense: document.getElementById('statExpense'),
  statBalance: document.getElementById('statBalance'),
  chart: document.getElementById('chart'),
  txnForm: document.getElementById('txnForm'),
  descInput: document.getElementById('description'),
  amtInput: document.getElementById('amount'),
  catInput: document.getElementById('category'),
  dateInput: document.getElementById('date'),
  formTitle: document.getElementById('formTitle'),
  cancelEdit: document.getElementById('cancelEdit'),
  themeToggle: document.getElementById('themeToggle'),
  baseCurrency: document.getElementById('baseCurrency'),
  rateUSD: document.getElementById('rateUSD'),
  rateEUR: document.getElementById('rateEUR'),
  capInput: document.getElementById('capInput'),
  saveSettings: document.getElementById('saveSettings'),
  resetData: document.getElementById('resetData'),
  status: document.getElementById('status')
};

// go through menu toggles
els.menuToggle.addEventListener('click', () => {
  const expanded = els.menuToggle.getAttribute('aria-expanded') === 'true';
  els.menuToggle.setAttribute('aria-expanded', String(!expanded));
  els.primaryMenu.style.display = expanded ? 'none' : 'flex';
});

els.menuBtns.forEach(btn => btn.addEventListener('click', (e) => {
  const target = e.currentTarget.dataset.target;
  showSection(target);
  els.menuBtns.forEach(b => b.removeAttribute('aria-current'));
  e.currentTarget.setAttribute('aria-current', 'true');
  if(window.innerWidth < 720){
    els.primaryMenu.style.display = 'none';
    els.menuToggle.setAttribute('aria-expanded','false');
  }
}));

function showSection(name){
  Object.keys(els.sections).forEach(k => {
    els.sections[k].classList.toggle('hidden', k !== name);
  });
  document.getElementById('main').focus();
}





// this function helps in sorting & search
function sortRecords(arr){
  const a = arr.slice();
  const fld = currentSort.field;
  const dir = currentSort.dir === 'asc' ? 1 : -1;
  a.sort((x,y) => {
    if(fld === 'date') return dir * (x.date < y.date ? -1 : x.date > y.date ? 1 : 0);
    if(fld === 'description') return dir * x.description.localeCompare(y.description);
    if(fld === 'amount') return dir * (x.amount - y.amount);
    return 0;
  });
  return a;
}
function applySearch(arr){
  if(!currentRegex) return arr.slice();
  return arr.filter(r => currentRegex.test(r.description) || currentRegex.test(r.category) || currentRegex.test(String(r.amount)) || currentRegex.test(r.date));
}

function render() {
  const list = applySearch(sortRecords(records));
  const isMobile = window.innerWidth <= 768;





  // Clear previous elements before rendering
  els.txnBody.innerHTML = '';
  els.cardList.innerHTML = '';

  if (isMobile) {
    renderCards(list);
  } else {
    renderTable(list);
  }

  updateStats(list);
}

function renderTable(list){
  els.txnBody.innerHTML = '';
  list.forEach(r => {
    const tr = document.createElement('tr');
    tr.tabIndex = 0;
    tr.dataset.id = r.id;
    tr.innerHTML = `<td>${r.date}</td><td>${highlight(r.description, currentRegex)}</td><td>${escapeHtml(r.category)}</td><td>${Number(r.amount).toFixed(2)}</td><td><button class="edit">Edit</button> <button class="del">Delete</button></td>`;
    els.txnBody.appendChild(tr);
  });
  attachRowHandlers();
}

function renderCards(list){
  els.cardList.innerHTML = '';
  list.forEach(r => {
    const d = document.createElement('div');
    d.className = 'txn-card';
    d.dataset.id = r.id;
    d.innerHTML = `<div><strong>${escapeHtml(r.description)}</strong><div class="meta">${r.date} • ${escapeHtml(r.category)}</div></div><div class="right"><div>${Number(r.amount).toFixed(2)}</div><div style="margin-top:8px"><button class="edit">Edit</button> <button class="del">Delete</button></div></div>`;
    els.cardList.appendChild(d);
  });
}

function attachRowHandlers(){
  document.querySelectorAll('.edit').forEach(b => b.addEventListener('click', onEdit));
  document.querySelectorAll('.del').forEach(b => b.addEventListener('click', onDelete));
}

function updateStats(list){
  els.statTotal.textContent = list.length;
  const income = list.filter(r => r.category.toLowerCase() === 'income').reduce((s,r)=>s+r.amount,0);
  const expense = list.filter(r => r.category.toLowerCase() !== 'income').reduce((s,r)=>s+r.amount,0);
  els.statIncome.textContent = income.toFixed(2);
  els.statExpense.textContent = expense.toFixed(2);
  els.statBalance.textContent = (income - expense).toFixed(2);




  // last 7 days chart
  const days = Array.from({length:7},(_,i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0,10);
    const sum = list.filter(r => r.date === key).reduce((s,r) => s + r.amount, 0);
    return { key, sum };
  });
  const max = Math.max(1, ...days.map(d => d.sum));
  els.chart.innerHTML = days.map(d => `<div class="bar" title="${d.key}: ${d.sum.toFixed(2)}" style="height:${Math.round((d.sum/max)*100)}%"></div>`).join('');


  
  // cap
  const cap = Number(els.capInput.value) || null;
  if(cap){
    const month = (new Date()).toISOString().slice(0,7);
    const monthSum = list.filter(r => r.date.startsWith(month)).reduce((s,r)=>s+r.amount,0);
    const rem = cap - monthSum;
    const alertEl = document.getElementById('status');
    if(rem < 0){
      alertEl.setAttribute('aria-live','assertive');
      alertEl.textContent = `Cap exceeded by ${Math.abs(rem).toFixed(2)}`;
    } else {
      alertEl.setAttribute('aria-live','polite');
      alertEl.textContent = `Remaining: ${rem.toFixed(2)}`;
    }
  }
}

// add/edit handlers
els.txnForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const rec = {
    description: els.descInput.value.trim().replace(/\s+/g,' '),
    amount: Number(els.amtInput.value),
    category: els.catInput.value,
    date: els.dateInput.value,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const chk = validateRecord(rec);
  document.getElementById('err-desc').textContent = chk.errors?.description || '';
  document.getElementById('err-amt').textContent = chk.errors?.amount || '';
  document.getElementById('err-cat').textContent = chk.errors?.category || '';
  document.getElementById('err-date').textContent = chk.errors?.date || '';
  if(!chk.valid){ els.status.textContent = 'Validation failed'; return; }

  if(editingId){
    const idx = records.findIndex(r => r.id === editingId);
    if(idx >= 0){
      rec.id = editingId;
      rec.createdAt = records[idx].createdAt;
      rec.updatedAt = new Date().toISOString();
      records[idx] = rec;
      saveRecords(records);
      els.status.textContent = 'Record updated';
    }
    editingId = null;
    els.formTitle.textContent = 'Add Transaction';
  } else {
    rec.id = 'txn_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6);
    records.push(rec);
    saveRecords(records);
    els.status.textContent = 'Record added';
  }
  els.txnForm.reset();
  render();
  showSection('records');
});

els.cancelEdit.addEventListener('click', () => {
  editingId = null;
  els.txnForm.reset();
  els.formTitle.textContent = 'Add Transaction';
  showSection('records');
});

function onEdit(e){
  const id = e.target.closest('[data-id]')?.dataset.id;
  if(!id) return;
  const rec = records.find(r => r.id === id);
  if(!rec) return;
  editingId = id;
  els.descInput.value = rec.description;
  els.amtInput.value = rec.amount;
  els.catInput.value = rec.category;
  els.dateInput.value = rec.date;
  els.formTitle.textContent = 'Edit Transaction';
  showSection('add');
}
function onDelete(e){
  const id = e.target.closest('[data-id]')?.dataset.id;
  if(!id) return;
  if(confirm('Delete this record?')){
    records = records.filter(r => r.id !== id);
    saveRecords(records);
    render();
    els.status.textContent = 'Record deleted';
  }
}

// search
els.applySearch.addEventListener('click', () => {
  const pat = els.searchInput.value.trim();
  const flags = els.flagI.checked ? 'ig' : 'g';
  const r = compileRegex(pat, flags);
  if(pat && !r){ alert('Invalid regex'); els.status.textContent = 'Invalid regex pattern'; return; }
  currentRegex = r;
  render();
  els.status.textContent = 'Search applied';
});
els.clearSearch.addEventListener('click', () => {
  els.searchInput.value = '';
  currentRegex = null;
  render();
  els.status.textContent = 'Search cleared';
});

// import/export
els.exportJSON.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(records, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'finance-export.json';
  a.click();
  URL.revokeObjectURL(url);
  els.status.textContent = 'Exported JSON';
});
els.importFile.addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if(!f) return;
  try{
    const txt = await f.text();
    const data = JSON.parse(txt);
    if(!Array.isArray(data)){ alert('JSON must be an array'); return; }
    const invalid = data.map((r,i)=>({i,ok:validateRecord(r).valid,errors:validateRecord(r).errors})).filter(x=>!x.ok);
    if(invalid.length){ alert('Import failed: some records invalid (see console)'); console.error('invalid', invalid); return; }
    if(confirm('Replace existing data? OK to replace — Cancel to merge')){
      records = data;
      saveRecords(records);
    } else {
      records = records.concat(data);
      saveRecords(records);
    }
    render();
    els.status.textContent = 'Import successful';
  } catch(err){ alert('Import error: ' + err.message); }
  finally { els.importFile.value = ''; }
});

// settings
els.saveSettings.addEventListener('click', () => {
  const s = {
    theme: els.themeToggle.value,
    base: els.baseCurrency.value || 'RWF',
    usd: Number(els.rateUSD.value) || 0.001,
    eur: Number(els.rateEUR.value) || 0.0009,
    cap: els.capInput.value || null
  };
  settings = s;
  saveSettings(s);
  applyTheme();
  els.status.textContent = 'Settings saved';
  render();
});
els.resetData.addEventListener('click', () => {
  if(confirm('Reset data to seed?')){
    records = SEED.slice();
    saveRecords(records);
    render();
    els.status.textContent = 'Data reset';
  }
});

function applyTheme(){
  if(settings.theme === 'light'){
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }
}

// keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if(e.key === 'n' && document.activeElement.tagName.toLowerCase() !== 'input'){ e.preventDefault(); showSection('add'); els.descInput.focus(); }
  if(e.key === '/' && document.activeElement.tagName.toLowerCase() !== 'input'){ e.preventDefault(); showSection('records'); els.searchInput.focus(); }
  if(e.key === 'Escape'){ if(!els.sections.add.classList.contains('hidden')) els.cancelEdit.click(); }
});

// responsive layout toggle
function updateLayout(){
  if(window.innerWidth < 720){
    document.querySelector('.txn-table').style.display = 'none';
    els.cardList.hidden = false;
  } else {
    document.querySelector('.txn-table').style.display = 'table';
    els.cardList.hidden = true;
  }
}
window.addEventListener('resize', updateLayout);

// attach sorting headers
document.querySelectorAll('th[data-field]').forEach(h => h.addEventListener('click', () => {
  const fld = h.dataset.field;
  if(currentSort.field === fld) currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
  else { currentSort.field = fld; currentSort.dir = 'asc'; }
  render();
}));

// init
settings = Object.assign(settings, loadSettings() || {});
applyTheme();
els.themeToggle.value = settings.theme || 'dark';
els.baseCurrency.value = settings.base || 'RWF';
els.rateUSD.value = settings.usd || 0.001;
els.rateEUR.value = settings.eur || 0.0009;
els.capInput.value = settings.cap || '';

updateLayout();
render();
showSection('dashboard');
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(render, 200);
});