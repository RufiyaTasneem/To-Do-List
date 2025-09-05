const STORAGE_KEY = 'todos.v1';
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const state = {
  items: load(),
  filter: 'all',
};

// Elements
const listEl = $('#list');
const inputEl = $('#newInput');
const addBtn = $('#addBtn');
const filters = $$('.filters button');
const counterEl = $('#counter');
const clearBtn = $('#clearCompleted');

// Storage
function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}

// Actions
function addTodo(title) {
  title = title.trim();
  if (!title) return;
  state.items.push({ id: crypto.randomUUID(), title, done: false });
  inputEl.value = '';
  commit();
}

function toggle(id) {
  const t = state.items.find(x => x.id === id);
  if (t) { t.done = !t.done; commit(); }
}

function remove(id) {
  state.items = state.items.filter(x => x.id !== id);
  commit();
}

function updateTitle(id, title) {
  title = title.trim();
  const t = state.items.find(x => x.id === id);
  if (t) { t.title = title || t.title; commit(); }
}

function clearCompleted() {
  state.items = state.items.filter(x => !x.done);
  commit();
}

// Rendering
function render() {
  const visible = state.items.filter(item =>
    state.filter === 'all' ||
    (state.filter === 'active' && !item.done) ||
    (state.filter === 'completed' && item.done)
  );

  listEl.innerHTML = visible.map(item => `
    <li data-id="${item.id}" class="${item.done ? 'completed' : ''}">
      <input type="checkbox" ${item.done ? 'checked' : ''} aria-label="Toggle completed" />
      <div class="title" tabindex="0" role="textbox" aria-label="Todo title">${escapeHtml(item.title)}</div>
      <div class="todo-actions">
        <button data-action="edit">Edit</button>
        <button data-action="delete">Delete</button>
      </div>
    </li>
  `).join('');

  const remaining = state.items.filter(x => !x.done).length;
  counterEl.textContent = `${remaining} item${remaining === 1 ? '' : 's'} left`;

  filters.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === state.filter));
  filters.forEach(btn => btn.setAttribute('aria-selected', String(btn.dataset.filter === state.filter)));

  save();
}

function escapeHtml(str) {
  return str.replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}

function commit() { render(); }

// Events
addBtn.addEventListener('click', () => addTodo(inputEl.value));
inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(inputEl.value); });

listEl.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.matches('input[type="checkbox"]')) {
    toggle(id);
  } else if (e.target.matches('button[data-action="delete"]')) {
    remove(id);
  } else if (e.target.matches('button[data-action="edit"]')) {
    startEditing(li);
  }
});

listEl.addEventListener('dblclick', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  if (e.target.classList.contains('title')) startEditing(li);
});

function startEditing(li) {
  const titleEl = li.querySelector('.title');
  titleEl.setAttribute('contenteditable', 'true');
  titleEl.focus();
  document.getSelection()?.collapse(titleEl, 1);

  function finish(commitEdit) {
    titleEl.removeAttribute('contenteditable');
    if (commitEdit) updateTitle(li.dataset.id, titleEl.textContent || '');
  }

  const onKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); finish(true); }
    if (e.key === 'Escape') { e.preventDefault(); finish(false); render(); }
  };
  titleEl.addEventListener('keydown', onKey, { once: true });
  titleEl.addEventListener('blur', () => finish(true), { once: true });
}

filters.forEach(btn => btn.addEventListener('click', () => {
  state.filter = btn.dataset.filter;
  render();
}));
clearBtn.addEventListener('click', clearCompleted);

render();
