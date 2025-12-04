// =====================
// script.js - Versión unificada y extendida
// Incluye: emociones por tarea, modal de stats por tarea,
// colores por prioridad/categoría, charts por tarea y globales,
// localStorage persistente.
// =====================

// --- CONSTANTES / UTILIDADES ---
const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const uid = () => Math.random().toString(36).slice(2,10);

// DOM referencias (de tu HTML original)
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

const spotifyInput = document.getElementById('spotifyInput');
const loadSpotifyBtn = document.getElementById('loadSpotify');
const spotifyPlayer = document.getElementById('spotifyPlayer');

// Chart instances
let dailyChartInstance = null;
let monthlyDoughnutInstance = null;
let monthlyLineInstance = null;
let monthlyBarInstance = null;

// Estado runtime
let currentDate = new Date();
let selectedDayKey = null; // 'YYYY-MM-DD'
let tasks = JSON.parse(localStorage.getItem('tasks_v4')) || {}; // migración v4
let currentFilter = 'all';
let editing = { dayKey: null, taskIndex: null };

// ----------------- formato fecha -----------------
function formatDateYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function parseYMD(y,m,d){ return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }

// ----------------- persistencia -----------------
function saveTasks() {
  localStorage.setItem('tasks_v4', JSON.stringify(tasks));
  renderCalendarIndicators();
  renderSidebar();
  updateCharts();
}
function loadTasks() {
  tasks = JSON.parse(localStorage.getItem('tasks_v4')) || {};
}

// ----------------- inicializador simple para compatibilidad con datos antiguos
(function migrateIfNeeded(){
  const prev = JSON.parse(localStorage.getItem('tasks_v3'));
  if(prev && !localStorage.getItem('tasks_v4')){
    // convertimos a estructura nueva: cada task tendrá id, category, emotionHistory, priority
    Object.keys(prev).forEach(day => {
      prev[day] = prev[day].map(t => ({
        id: uid(),
        text: t.text || '',
        color: t.color || '#6699ff',
        category: t.category || 'General',
        priority: t.priority || 'media',
        completed: !!t.completed,
        subtasks: t.subtasks || [],
        emotionHistory: t.emotionHistory || [] // si existía
      }));
    });
    localStorage.setItem('tasks_v4', JSON.stringify(prev));
    tasks = prev;
  }
})();

// ========== RENDER CALENDAR ==========
function renderCalendar(){
  calendarElement.innerHTML = "";
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  currentMonthText.innerText = `${months[month]} ${year}`;

  const firstDayWeekDay = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month+1, 0).getDate();

  const weekNames = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  weekNames.forEach(d => {
    const header = document.createElement('div');
    header.className = 'day header';
    header.innerText = d;
    calendarElement.appendChild(header);
  });

  for (let i = 0; i < firstDayWeekDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'day empty';
    calendarElement.appendChild(empty);
  }

  for (let d = 1; d <= lastDay; d++) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day';
    dayDiv.innerHTML = `<span class="num">${d}</span>`;
    const dateKey = parseYMD(year, month+1, d);
    dayDiv.dataset.date = dateKey;
    dayDiv.addEventListener('click', ()=> openDayModal(dateKey));
    calendarElement.appendChild(dayDiv);
  }
  renderCalendarIndicators();
}

// Pinta puntos de tareas en días y resalta si todas completadas
function renderCalendarIndicators(){
  document.querySelectorAll('#calendar .day').forEach(dayEl => {
    const dateKey = dayEl.dataset.date;
    dayEl.querySelectorAll('.task-indicator').forEach(n=>n.remove());
    dayEl.style.backgroundColor = '';
    if(!dateKey) return;
    const list = tasks[dateKey] || [];
    if(list.length === 0) return;
    const dot = document.createElement('div');
    dot.className = 'task-indicator';
    dot.style.backgroundColor = list[0].color || '#999';
    dayEl.appendChild(dot);
    if(list.every(t => t.completed)) dayEl.style.backgroundColor = '#e6ffe6';
  });
}

// ========== SIDEBAR HOY ==========
function renderSidebar(){
  sidebarList.innerHTML = "";
  const todayKey = formatDateYMD(new Date());
  const list = tasks[todayKey] || [];

  const filtered = list.filter(t => {
    if(currentFilter === 'all') return true;
    if(currentFilter === 'pending') return !t.completed;
    if(currentFilter === 'completed') return t.completed;
  });

  filtered.forEach((t, i) => {
    const li = document.createElement('li');
    // marcador de categoria/prioridad pequeño
    const dot = document.createElement('span');
    dot.style.display = 'inline-block';
    dot.style.width = '10px';
    dot.style.height = '10px';
    dot.style.borderRadius = '50%';
    dot.style.marginRight = '8px';
    dot.style.backgroundColor = (t.priority === 'alta' ? '#e74c3c' : t.priority === 'baja' ? '#4CAF50' : '#f1c40f');
    li.appendChild(dot);

    const text = document.createElement('span');
    text.innerText = ' ' + t.text;
    li.appendChild(text);

    li.style.borderLeft = `6px solid ${t.color || '#999'}`;
    if(t.completed) li.classList.add('completed');

    li.addEventListener('click', ()=> openDayModal(todayKey));
    sidebarList.appendChild(li);
  });

  if(filtered.length === 0){
    const p = document.createElement('p');
    p.className = 'small-muted';
    p.innerText = 'No hay tareas para hoy con este filtro.';
    sidebarList.appendChild(p);
  }
}

// filtros
filterAllBtn.addEventListener('click', ()=> setFilter('all'));
filterPendingBtn.addEventListener('click', ()=> setFilter('pending'));
filterCompletedBtn.addEventListener('click', ()=> setFilter('completed'));

function setFilter(f){
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if(f === 'all') filterAllBtn.classList.add('active');
  if(f === 'pending') filterPendingBtn.classList.add('active');
  if(f === 'completed') filterCompletedBtn.classList.add('active');
  renderSidebar();
}

// ========== DAY MODAL: abrir / render / agregar / subtareas / editar / borrar ==========
function openDayModal(dateKey){
  selectedDayKey = dateKey;
  const [y, m, d] = dateKey.split('-').map(Number);
  modalDateTitle.innerText = `Tareas del ${d} de ${months[m-1]} ${y}`;

  // limpiar campos
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

// render lista tareas del día (con botones de stats/emoción)
function renderTaskListForDay(){
  taskListForDay.innerHTML = '';
  const list = tasks[selectedDayKey] || [];

  list.forEach((task, idx) => {
    const li = document.createElement('li');
    li.style.borderLeftColor = task.color || '#999';
    li.dataset.taskId = task.id || '';

    // checkbox principal
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.onchange = () => {
      const prevEmotion = getLatestEmotionValue(task);
      task.completed = checkbox.checked;
      // registro emocional
      registerEmotionChange(task, checkbox.checked ? +1 : -0.5, "toggle_complete");
      // animacion
      if(task.completed) li.classList.add('animate-complete');
      else li.classList.remove('animate-complete');
      saveTasks();
      renderTaskListForDay();
      renderSidebar();
      renderCalendarIndicators();
    };
    li.appendChild(checkbox);

    // prioridad dot (categoría)
    const priorityDot = document.createElement('span');
    priorityDot.className = 'priority-dot';
    priorityDot.title = `Prioridad: ${task.priority || 'media'}`;
    priorityDot.style.display = 'inline-block';
    priorityDot.style.width = '10px';
    priorityDot.style.height = '10px';
    priorityDot.style.borderRadius = '50%';
    priorityDot.style.margin = '0 8px';
    priorityDot.style.backgroundColor = (task.priority === 'alta' ? '#e74c3c' : task.priority === 'baja' ? '#4CAF50' : '#f1c40f');
    li.appendChild(priorityDot);

    // texto
    const taskTextSpan = document.createElement('span');
    taskTextSpan.className = `task-text ${task.completed ? 'completed' : ''}`;
    taskTextSpan.innerText = task.text;
    li.appendChild(taskTextSpan);

    // actions
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    // abrir stats
    const statsBtn = document.createElement('button');
    statsBtn.innerText = '📈';
    statsBtn.title = 'Ver estadísticas';
    statsBtn.onclick = (e) => {
      e.stopPropagation();
      openTaskStatsModal(task);
    };
    actions.appendChild(statsBtn);

    // editar
    const editBtn = document.createElement('button');
    editBtn.innerText = '✎';
    editBtn.title = 'Editar';
    editBtn.onclick = (e) => {
      e.stopPropagation();
      openEditModal(selectedDayKey, idx);
    };
    actions.appendChild(editBtn);

    // agregar subtarea (rápido)
    const addSubBtn = document.createElement('button');
    addSubBtn.innerText = '➕sub';
    addSubBtn.title = 'Añadir subtarea';
    addSubBtn.onclick = (e) => {
      e.stopPropagation();
      const subText = prompt('Texto de la subtarea:');
      if(!subText) return;
      if(!task.subtasks) task.subtasks = [];
      task.subtasks.push({ id: uid(), text: subText, completed: false });
      registerEmotionChange(task, +0.5, "add_subtask");
      saveTasks();
      renderTaskListForDay();
    };
    actions.appendChild(addSubBtn);

    // eliminar
    const delBtn = document.createElement('button');
    delBtn.innerText = '✕';
    delBtn.title = 'Eliminar tarea';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      if(!confirm('Eliminar tarea?')) return;
      taskListForDay.removeChild(li); // visual immediate
      tasks[selectedDayKey].splice(idx,1);
      if(tasks[selectedDayKey].length === 0) delete tasks[selectedDayKey];
      // emoción por borrar
      registerEmotionChange(task, -2, "delete_task");
      saveTasks();
      renderTaskListForDay();
      renderCalendar();
      renderSidebar();
    };
    actions.appendChild(delBtn);

    li.appendChild(actions);

    // subtasks
    if (task.subtasks && task.subtasks.length) {
      const subUl = document.createElement('ul');
      subUl.className = 'subtask-list';
      task.subtasks.forEach((sub, sidx) => {
        const subLi = document.createElement('li');

        const subCb = document.createElement('input');
        subCb.type = 'checkbox';
        subCb.checked = sub.completed;
        subCb.onchange = () => {
          sub.completed = subCb.checked;
          // si todas las subtareas completas -> marcar main
          if(task.subtasks.every(st => st.completed)) task.completed = true;
          else task.completed = false;
          // emoción
          registerEmotionChange(task, subCb.checked ? +0.5 : -0.2, "toggle_sub");
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
          registerEmotionChange(task, -0.2, "del_sub");
          saveTasks();
          renderTaskListForDay();
        };
        subLi.appendChild(subDel);

        subUl.appendChild(subLi);
      });
      li.appendChild(subUl);
    }

    taskListForDay.appendChild(li);
  });

  // Habilitar/Deshabilitar entrada de subtarea
  const hasPendingTask = (tasks[selectedDayKey] || []).some(t => !t.completed);
  subTaskInput.disabled = !hasPendingTask;
  addSubTaskBtn.disabled = !hasPendingTask;
}

// ========== AGREGAR TAREA ==========
addTaskBtn.onclick = () => {
  const taskText = taskInput.value.trim();
  if (!taskText || !selectedDayKey) return;

  // Pedimos categoría/prioridad rápido (puedo cambiar a inputs si prefieres)
  let category = prompt("Categoría (ej. Trabajo, Rutina, Personal). Dejar vacío = General") || "General";
  let priority = prompt("Prioridad: alta / media / baja (escribe una de ellas). Dejar vacío = media") || "media";
  priority = ['alta','media','baja'].includes(priority.toLowerCase()) ? priority.toLowerCase() : 'media';

  if (!tasks[selectedDayKey]) tasks[selectedDayKey] = [];

  const newTask = {
    id: uid(),
    text: taskText,
    color: taskColorInput.value || '#6699ff',
    category,
    priority,
    completed: false,
    subtasks: [],
    // emotionHistory: [{ date:'2025-12-01', value: 0.0, note: 'init' }]
    emotionHistory: []
  };

  // Initialize emotion with 0 at creation
  newTask.emotionHistory.push({ date: formatDateYMD(new Date()), value: 0, note: 'created' });

  tasks[selectedDayKey].push(newTask);
  taskInput.value = '';
  saveTasks();
  renderTaskListForDay();
  renderCalendarIndicators();
  renderSidebar();
};

// ADD SUBTASK desde input -> añade a última tarea pendiente
addSubTaskBtn.onclick = () => {
  const subText = subTaskInput.value.trim();
  if (!subText || !selectedDayKey) return;
  const list = tasks[selectedDayKey] || [];
  const target = list.slice().reverse().find(t => !t.completed);
  if (!target) {
    alert('No hay tarea pendiente para añadir subtarea.');
    return;
  }
  if (!target.subtasks) target.subtasks = [];
  target.subtasks.push({ id: uid(), text: subText, completed: false });
  registerEmotionChange(target, +0.5, "add_sub_input");
  subTaskInput.value = '';
  saveTasks();
  renderTaskListForDay();
  renderCalendarIndicators();
};

// ========== EDIT TASK MODAL ==========
function openEditModal(dayKey, taskIndex){
  editing.dayKey = dayKey;
  editing.taskIndex = taskIndex;
  const t = tasks[dayKey][taskIndex];
  editText.value = t.text;
  editColor.value = t.color || '#6699ff';
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
    const moved = tasks[editing.dayKey].splice(editing.taskIndex,1)[0];
    if(tasks[editing.dayKey].length === 0) delete tasks[editing.dayKey];
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

// ========== NAV y SPOTIFY ==========
todayBtn.onclick = () => {
  currentDate = new Date();
  renderCalendar();
  updateCharts();
};

nextMonthBtn.onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
  updateCharts();
};

prevMonthBtn.onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
  updateCharts();
};

document.getElementById("currentMonth").addEventListener('click', ()=> {
  currentDate = new Date();
  renderCalendar();
});

// Spotify
loadSpotifyBtn.addEventListener('click', ()=> {
  let url = spotifyInput.value.trim();
  if(!url.includes('spotify')) { alert('Enlace inválido'); return; }
  // normalize and build embed
  url = url.replace('https://open.spotify.com/intl-es/', 'https://open.spotify.com/');
  const embed = url.replace("open.spotify.com/", "open.spotify.com/embed/").split("?")[0];
  spotifyPlayer.innerHTML = `<iframe src="${embed}" frameborder="0" allow="encrypted-media" style="width:100%;height:80px"></iframe>`;
});

// ========== EMOCIÓN / HISTORIAL ==========
function getLatestEmotionValue(task){
  if(!task.emotionHistory || task.emotionHistory.length === 0) return 0;
  return task.emotionHistory[task.emotionHistory.length - 1].value;
}
// delta can be positive/negative/float
function registerEmotionChange(task, delta, note='auto'){
  if(!task.emotionHistory) task.emotionHistory = [];
  const prev = getLatestEmotionValue(task);
  const now = Number((prev + delta).toFixed(2));
  task.emotionHistory.push({ date: formatDateYMD(new Date()), value: now, note });
  // add a simple emoji log (not used in UI directly but stored)
  if(!task.emotionLog) task.emotionLog = [];
  if(delta > 0) task.emotionLog.push({ date: formatDateYMD(new Date()), emoji: '😊', delta });
  else if(delta < 0) task.emotionLog.push({ date: formatDateYMD(new Date()), emoji: '😢', delta });
  else task.emotionLog.push({ date: formatDateYMD(new Date()), emoji: '😐', delta });
}

// ========== STATS MODAL POR TAREA (se crea si no existe) ==========
function ensureStatsModalExists(){
  if(document.getElementById('taskStatsModal')) return;
  const modal = document.createElement('div');
  modal.id = 'taskStatsModal';
  modal.className = 'modal';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="modal-content">
      <button id="closeStats" style="float:right">✕</button>
      <h3 id="statsTaskTitle"></h3>
      <canvas id="taskEmotionChart" style="width:100%;height:220px"></canvas>
      <div style="height:14px"></div>
      <canvas id="taskSubtaskDough" style="width:100%;height:180px"></canvas>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('closeStats').onclick = ()=> { modal.style.display='none'; };
}

ensureStatsModalExists();

let taskEmotionChart = null;
let taskSubtaskDough = null;

function openTaskStatsModal(task){
  ensureStatsModalExists();
  const modal = document.getElementById('taskStatsModal');
  modal.style.display = 'flex';
  document.getElementById('statsTaskTitle').innerText = task.text;

  // Emotion timeline
  const labels = (task.emotionHistory || []).map(e => e.date + (e.note ? ` (${e.note})` : ''));
  const data = (task.emotionHistory || []).map(e => e.value);

  if(taskEmotionChart) taskEmotionChart.destroy();
  const ctx = document.getElementById('taskEmotionChart').getContext('2d');
  taskEmotionChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Índice emocional', data, borderColor: '#ff9f43', tension: 0.3, fill:false }] },
    options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:false } } }
  });

  // Subtasks doughnut
  const subt = task.subtasks || [];
  const completed = subt.filter(s=>s.completed).length;
  const pending = subt.length - completed;
  if(taskSubtaskDough) taskSubtaskDough.destroy();
  const ctx2 = document.getElementById('taskSubtaskDough').getContext('2d');
  taskSubtaskDough = new Chart(ctx2, {
    type: 'doughnut',
    data: { labels: ['Completadas','Pendientes'], datasets: [{ data: [completed, pending], backgroundColor: ['#4CAF50','#e74c3c'] }] },
    options: { responsive:true, maintainAspectRatio:false }
  });
}

// ========== GRÁFICAS GLOBALES (Chart.js) ==========
function updateCharts(){
  // destroy prev
  if(dailyChartInstance) dailyChartInstance.destroy();
  if(monthlyDoughnutInstance) monthlyDoughnutInstance.destroy();
  if(monthlyLineInstance) monthlyLineInstance.destroy();
  if(monthlyBarInstance) monthlyBarInstance.destroy();

  // DAILY: for selectedDayKey or today
  const activeDayKey = selectedDayKey || formatDateYMD(new Date());
  const dayList = tasks[activeDayKey] || [];
  const dayCompleted = dayList.filter(t => t.completed).length;
  const dayPending = dayList.length - dayCompleted;

  const dailyCtx = document.getElementById('dailyProgressChart').getContext('2d');
  dailyChartInstance = new Chart(dailyCtx, {
    type: 'bar',
    data: {
      labels: ['Completadas','Pendientes'],
      datasets: [{ data: [dayCompleted, dayPending], backgroundColor: ['#4CAF50','#F44336'] }]
    },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ title:{ display:true, text:`Progreso del día (${activeDayKey})` } }, scales:{ y:{ beginAtZero:true, precision:0 } } }
  });

  // Monthly aggregate by day
  const agg = aggregateMonthCounts(currentDate);
  const totalCompletedMonth = agg.monthCompletedCount.reduce((a,b)=>a+b,0);
  const totalPendingMonth = agg.monthPendingCount.reduce((a,b)=>a+b,0);

  const doughCtx = document.getElementById('monthlyDoughnutChart').getContext('2d');
  monthlyDoughnutInstance = new Chart(doughCtx, {
    type: 'doughnut',
    data: { labels: ['Completadas','Pendientes'], datasets: [{ data: [totalCompletedMonth, totalPendingMonth], backgroundColor: ['#4CAF50','#F44336'] }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ title:{ display:true, text: 'Resumen mensual' } } }
  });

  const lineCtx = document.getElementById('monthlyLineChart').getContext('2d');
  const percentPerDay = agg.monthLabels.map((label, i) => {
    const total = agg.monthCompletedCount[i] + agg.monthPendingCount[i];
    return total ? Math.round((agg.monthCompletedCount[i]/total)*100) : 0;
  });
  monthlyLineInstance = new Chart(lineCtx, {
    type: 'line',
    data: { labels: agg.monthLabels, datasets: [{ label: '% completado', data: percentPerDay, borderColor: '#6699ff', tension:0.25, fill:false }] },
    options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ min:0, max:100 } }, plugins:{ title:{ display:true, text: 'Tendencia mensual (% completado)' } } }
  });

  const barCtx = document.getElementById('monthlyBarChart').getContext('2d');
  const totalsPerDay = agg.monthLabels.map((_,i) => agg.monthCompletedCount[i] + agg.monthPendingCount[i]);
  monthlyBarInstance = new Chart(barCtx, {
    type: 'bar',
    data: { labels: agg.monthLabels, datasets: [{ label:'Tareas totales', data: totalsPerDay, backgroundColor: '#6699ff' }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ title:{ display:true, text:'Tareas por día (mes actual)' } }, scales:{ y:{ beginAtZero:true, precision:0 } } }
  });
}

// Helper: aggregate counts for the current month
function aggregateMonthCounts(dateRef){
  const year = dateRef.getFullYear();
  const month = dateRef.getMonth() + 1; // 1..12
  const daysInMonth = new Date(year, month, 0).getDate();
  const labels = [];
  const completedCounts = [];
  const pendingCounts = [];

  for(let d=1; d<=daysInMonth; d++){
    const key = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    labels.push(String(d));
    const list = tasks[key] || [];
    const c = list.filter(t=>t.completed).length;
    const p = list.length - c;
    completedCounts.push(c);
    pendingCounts.push(p);
  }
  return { monthLabels: labels, monthCompletedCount: completedCounts, monthPendingCount: pendingCounts };
}

// ========== INICIO ==========
loadTasks();
renderCalendar();
renderSidebar();
setFilter(currentFilter);
updateCharts();

// expose for debug
window.openDayModal = openDayModal;
window.tasks = tasks;
window.saveTasks = saveTasks;
