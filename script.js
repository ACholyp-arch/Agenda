// =====================
// Variables globales y utilidades
// =====================
const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const calendarElement = document.getElementById('calendar');
const currentMonthText = document.getElementById('currentMonth');
const taskModal = document.getElementById('taskModal');
const modalDateTitle = document.getElementById('modalDateTitle');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const subTaskInput = document.getElementById('subTaskInput');
const addSubTaskBtn = document.getElementById('addSubTaskBtn');
const taskListForDay = document.getElementById('taskListForDay');
const closeModal = document.getElementById('closeModal');
const taskColorInput = document.getElementById('taskColorInput');
const sidebarList = document.getElementById('taskListToday');

const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayBtn = document.getElementById('todayBtn');

const filterAllBtn = document.getElementById('filterAll');
const filterPendingBtn = document.getElementById('filterPending');
const filterCompletedBtn = document.getElementById('filterCompleted');

const editModal = document.getElementById('editModal');
const editText = document.getElementById('editText');
const editColor = document.getElementById('editColor');
const editDate = document.getElementById('editDate');
const editCompleted = document.getElementById('editCompleted');
const cancelEdit = document.getElementById('cancelEdit');
const saveEdit = document.getElementById('saveEdit');

let currentDate = new Date();
let selectedDayKey = null; // yyyy-mm-dd
let tasks = JSON.parse(localStorage.getItem('tasks_v3')) || {}; // { "2025-12-03": [ {...}, ... ] }
let currentFilter = 'all'; // 'all' | 'pending' | 'completed'
let editing = { dayKey: null, taskIndex: null };

// helper: format date to yyyy-mm-dd
function formatDateYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function parseYMD(y,m,d){ return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }

// save/load
function saveTasks(){ localStorage.setItem('tasks_v3', JSON.stringify(tasks)); renderCalendarIndicators(); renderSidebar(); }
function loadTasks(){ tasks = JSON.parse(localStorage.getItem('tasks_v3')) || {}; }

// =====================
// RENDER CALENDAR
// =====================
function renderCalendar(){
  calendarElement.innerHTML = "";
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  currentMonthText.innerText = `${months[month]} ${year}`;

  // first day (0=domingo)
  const firstDayWeekDay = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month+1, 0).getDate();

  // header row (days names)
  const weekNames = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  weekNames.forEach(n => {
    const head = document.createElement('div');
    head.className = 'day header';
    head.innerText = n;
    calendarElement.appendChild(head);
  });

  // Empty slots
  for(let i=0;i<firstDayWeekDay;i++){
    const empty = document.createElement('div');
    empty.className = 'day empty';
    calendarElement.appendChild(empty);
  }

  // Days
  for(let d=1; d<=lastDay; d++){
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day';
    dayDiv.innerHTML = `<span class="num">${d}</span>`;

    const dateKey = parseYMD(year, month+1, d);
    dayDiv.dataset.date = dateKey;

    // Click: abrir modal del día
    dayDiv.addEventListener('click', ()=> openDayModal(dateKey));

    calendarElement.appendChild(dayDiv);
  }

  renderCalendarIndicators();
}

// render dots and minor highlights
function renderCalendarIndicators(){
  document.querySelectorAll('#calendar .day').forEach(dayEl => {
    const dateKey = dayEl.dataset.date;
    // remove existing indicators
    dayEl.querySelectorAll('.task-indicator').forEach(n=>n.remove());
    // reset background
    dayEl.style.backgroundColor = '';
    if(!dateKey) return;
    const list = tasks[dateKey] || [];
    if(list.length === 0) return;
    // show dot with first task's color
    const dot = document.createElement('div');
    dot.className = 'task-indicator';
    dot.style.backgroundColor = list[0].color || '#999';
    dayEl.appendChild(dot);
    // if all completed, soft green background
    if(list.every(t => t.completed)) dayEl.style.backgroundColor = '#e8ffea';
  });
}

// =====================
// SIDEBAR (Hoy) with filters
// =====================
function renderSidebar(){
  sidebarList.innerHTML = "";
  const todayKey = formatDateYMD(new Date());
  const list = tasks[todayKey] || [];
  // filter according to currentFilter
  const filtered = list.filter(t => {
    if(currentFilter === 'all') return true;
    if(currentFilter === 'pending') return !t.completed;
    if(currentFilter === 'completed') return t.completed;
  });
  filtered.forEach((t, i) => {
    const li = document.createElement('li');
    li.innerText = t.text;
    li.style.borderLeftColor = t.color || '#999';
    if(t.completed) li.classList.add('completed');
    // click to open modal for today
    li.addEventListener('click', ()=> openDayModal(todayKey));
    sidebarList.appendChild(li);
  });
  // show placeholder if none
  if(filtered.length === 0){
    const p = document.createElement('p');
    p.className = 'small-muted';
    p.innerText = 'No hay tareas para hoy con este filtro.';
    sidebarList.appendChild(p);
  }
}

// filter button handlers
filterAllBtn.addEventListener('click', ()=> { setFilter('all'); });
filterPendingBtn.addEventListener('click', ()=> { setFilter('pending'); });
filterCompletedBtn.addEventListener('click', ()=> { setFilter('completed'); });

function setFilter(f){
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if(f === 'all') filterAllBtn.classList.add('active');
  if(f === 'pending') filterPendingBtn.classList.add('active');
  if(f === 'completed') filterCompletedBtn.classList.add('active');
  renderSidebar();
}

// =====================
// DAY MODAL: abrir / render / agregar / subtareas / editar / borrar
// =====================
function openDayModal(dateKey){
  selectedDayKey = dateKey;
  const [y, m, d] = dateKey.split('-').map(Number);
  modalDateTitle.innerText = `Tareas del ${d} de ${months[m-1]} ${y}`;
  taskInput.value = '';
  subTaskInput.value = '';
  addSubTaskBtn.disabled = true;
  renderTaskListForDay();
  taskModal.setAttribute('aria-hidden','false');
  taskModal.style.display = 'flex';
}

closeModal.onclick = () => {
  taskModal.setAttribute('aria-hidden','true');
  taskModal.style.display = 'none';
  selectedDayKey = null;
};

// render list in modal
function renderTaskListForDay(){
  taskListForDay.innerHTML = '';
  const list = tasks[selectedDayKey] || [];
  list.forEach((task, idx) => {
    const li = document.createElement('li');
    li.style.borderLeftColor = task.color || '#999';
    // checkbox main
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = task.completed;
    cb.className = 'task-checkbox';
    cb.onchange = () => {
      task.completed = cb.checked;
      // animation toggle
      if(task.completed) li.classList.add('animate-complete');
      else li.classList.remove('animate-complete');
      saveTasks();
      renderTaskListForDay();
      renderSidebar();
      renderCalendarIndicators();
    };
    li.appendChild(cb);

    // text
    const span = document.createElement('span');
    span.className = 'task-text' + (task.completed ? ' completed' : '');
    span.innerText = task.text;
    li.appendChild(span);

    // actions: edit, delete, add sub
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.innerText = '✎';
    editBtn.onclick = () => openEditModal(selectedDayKey, idx);
    actions.appendChild(editBtn);

    const addSubBtn = document.createElement('button');
    addSubBtn.innerText = '➕sub';
    addSubBtn.onclick = () => {
      const subText = prompt('Texto de la subtarea:');
      if(!subText) return;
      if(!task.subtasks) task.subtasks = [];
      task.subtasks.push({ text: subText, completed: false });
      saveTasks();
      renderTaskListForDay();
    };
    actions.appendChild(addSubBtn);

    const delBtn = document.createElement('button');
    delBtn.innerText = '✕';
    delBtn.onclick = () => {
      if(!confirm('Eliminar tarea?')) return;
      tasks[selectedDayKey].splice(idx,1);
      if(tasks[selectedDayKey].length === 0) delete tasks[selectedDayKey];
      saveTasks();
      renderTaskListForDay();
      renderCalendar();
      renderSidebar();
    };
    actions.appendChild(delBtn);

    li.appendChild(actions);

    // subtasks
    if(task.subtasks && task.subtasks.length){
      const subUl = document.createElement('ul');
      subUl.className = 'subtask-list';
      task.subtasks.forEach((sub, sidx) => {
        const subLi = document.createElement('li');
        const subCb = document.createElement('input');
        subCb.type = 'checkbox';
        subCb.checked = sub.completed;
        subCb.onchange = () => {
          sub.completed = subCb.checked;
          // if all subtasks done, optionally mark main completed
          if(task.subtasks.every(st => st.completed)) task.completed = true;
          else task.completed = false;
          saveTasks();
          renderTaskListForDay();
          renderSidebar();
          renderCalendarIndicators();
        };
        subLi.appendChild(subCb);

        const subSpan = document.createElement('span');
        subSpan.innerText = sub.text;
        if(sub.completed) subSpan.classList.add('completed');
        subLi.appendChild(subSpan);

        const subDel = document.createElement('button');
        subDel.innerText = '✕';
        subDel.onclick = () => {
          if(!confirm('Eliminar subtarea?')) return;
          task.subtasks.splice(sidx,1);
          saveTasks();
          renderTaskListForDay();
        };
        subLi.appendChild(subDel);

        // edit subtask
        const subEdit = document.createElement('button');
        subEdit.innerText = '✎';
        subEdit.onclick = () => {
          const newText = prompt('Editar subtarea', sub.text);
          if(newText && newText.trim()){
            sub.text = newText.trim();
            saveTasks();
            renderTaskListForDay();
          }
        };
        subLi.appendChild(subEdit);

        subUl.appendChild(subLi);
      });
      li.appendChild(subUl);
    }

    taskListForDay.appendChild(li);
  });

  // enable add-sub controls only if there are pending tasks
  const hasPending = (tasks[selectedDayKey] || []).some(t => !t.completed);
  addSubTaskBtn.disabled = !hasPending;
  subTaskInput.disabled = !hasPending;
}

// ADD main task for selected day
addTaskBtn.onclick = () => {
  const text = taskInput.value.trim();
  if(!text || !selectedDayKey) return;
  if(!tasks[selectedDayKey]) tasks[selectedDayKey] = [];
  tasks[selectedDayKey].push({
    text,
    color: taskColorInput.value || '#6699ff',
    completed: false,
    subtasks: []
  });
  taskInput.value = '';
  saveTasks();
  renderTaskListForDay();
  renderCalendarIndicators();
  renderSidebar();
};

// ADD subtask (adds to first pending task) — keeps previous behaviour: adds to last pending
addSubTaskBtn.onclick = () => {
  const subText = subTaskInput.value.trim();
  if(!subText || !selectedDayKey) return;
  const list = tasks[selectedDayKey] || [];
  const target = list.slice().reverse().find(t => !t.completed);
  if(!target){
    alert('No hay tarea pendiente para añadir subtarea.');
    return;
  }
  if(!target.subtasks) target.subtasks = [];
  target.subtasks.push({ text: subText, completed: false });
  subTaskInput.value = '';
  saveTasks();
  renderTaskListForDay();
  renderCalendarIndicators();
};

// =====================
// EDIT TASK modal
// =====================
function openEditModal(dayKey, taskIndex){
  editing.dayKey = dayKey;
  editing.taskIndex = taskIndex;
  const t = tasks[dayKey][taskIndex];
  editText.value = t.text;
  editColor.value = t.color || '#6699ff';
  // set date input (yyyy-mm-dd)
  editDate.value = dayKey;
  editCompleted.checked = !!t.completed;

  editModal.setAttribute('aria-hidden','false');
  editModal.style.display = 'flex';
}
cancelEdit.onclick = () => { editModal.setAttribute('aria-hidden','true'); editModal.style.display = 'none'; editing = { dayKey:null, taskIndex:null }; };

saveEdit.onclick = () => {
  if(!editing.dayKey) return;
  const t = tasks[editing.dayKey][editing.taskIndex];
  t.text = editText.value.trim() || t.text;
  t.color = editColor.value;
  t.completed = editCompleted.checked;
  const newDateKey = editDate.value || editing.dayKey;

  // if date changed, move task
  if(newDateKey !== editing.dayKey){
    // remove from old
    const moved = tasks[editing.dayKey].splice(editing.taskIndex,1)[0];
    if(tasks[editing.dayKey].length === 0) delete tasks[editing.dayKey];
    // push to new date
    if(!tasks[newDateKey]) tasks[newDateKey] = [];
    tasks[newDateKey].push(moved);
  }
  saveTasks();
  editModal.setAttribute('aria-hidden','true');
  editModal.style.display = 'none';
  editing = { dayKey:null, taskIndex:null };
  // refresh views
  renderTaskListForDay();
  renderCalendar();
  renderSidebar();
};

// =====================
// Calendar nav & helpers
// =====================
prevMonthBtn.addEventListener('click', ()=> { currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); });
nextMonthBtn.addEventListener('click', ()=> { currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); });
todayBtn.addEventListener('click', ()=> { currentDate = new Date(); renderCalendar(); });

// quick open today
document.getElementById('currentMonth').addEventListener('click', ()=> {
  currentDate = new Date();
  renderCalendar();
});

// =====================
// Spotify embed loader (simple embed)
 // =====================
document.getElementById('loadSpotify').addEventListener('click', ()=> {
  let url = document.getElementById('spotifyInput').value.trim();
  if(!url.includes('spotify')) { alert('Enlace inválido'); return; }
  // normalize and build embed
  url = url.replace('https://open.spotify.com/intl-es/', 'https://open.spotify.com/');
  const embed = url.replace('open.spotify.com/', 'open.spotify.com/embed/').split('?')[0];
  document.getElementById('spotifyPlayer').innerHTML = `<iframe src="${embed}" frameborder="0" allow="encrypted-media" style="width:100%;height:80px"></iframe>`;
});

// =====================
// Init
// =====================
loadTasks();
renderCalendar();
renderSidebar();
setFilter('all'); // default

// Expose some functions for dev console if needed
window.openDayModal = openDayModal;
