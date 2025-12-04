// =====================
// Variables globales y utilidades
// =====================
const months=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const calendarElement=document.getElementById("calendar");
const currentMonthText=document.getElementById("currentMonth");
const taskModal=document.getElementById("taskModal");
const modalDateTitle=document.getElementById("modalDateTitle");
const taskInput=document.getElementById("taskInput");
const addTaskBtn=document.getElementById("addTaskBtn");
const subTaskInput=document.getElementById("subTaskInput");
const addSubTaskBtn=document.getElementById("addSubTaskBtn");
const taskListForDay=document.getElementById("taskListForDay");
const closeModal=document.getElementById("closeModal");
const taskColorInput=document.getElementById("taskColorInput");
const sidebarList=document.getElementById("taskListToday");

const prevMonthBtn=document.getElementById("prevMonth");
const nextMonthBtn=document.getElementById("nextMonth");
const todayBtn=document.getElementById("todayBtn");

const filterAllBtn=document.getElementById("filterAll");
const filterPendingBtn=document.getElementById("filterPending");
const filterCompletedBtn=document.getElementById("filterCompleted");

const editModal=document.getElementById("editModal");
const editText=document.getElementById("editText");
const editColor=document.getElementById("editColor");
const editDate=document.getElementById("editDate");
const editCompleted=document.getElementById("editCompleted");
const cancelEdit=document.getElementById("cancelEdit");
const saveEdit=document.getElementById("saveEdit");

let currentDate=new Date();
let selectedDayKey=null;
let tasks=JSON.parse(localStorage.getItem("tasks_v3"))||{};
let currentFilter="all";
let editing={dayKey:null,taskIndex:null};

// Chart instances
let dailyChartInstance=null;
let monthlyDoughnutInstance=null;
let monthlyLineInstance=null;
let monthlyBarInstance=null;

function formatDateYMD(date){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function parseYMD(y,m,d){ return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;}

function saveTasks(){ localStorage.setItem("tasks_v3",JSON.stringify(tasks)); renderCalendarIndicators(); renderSidebar(); updateCharts(); }

// =====================
// RENDER CALENDARIO
// =====================
function renderCalendar(){
  calendarElement.innerHTML="";
  const y=currentDate.getFullYear(),m=currentDate.getMonth();
  currentMonthText.innerText=`${months[m]} ${y}`;

  const firstDay=new Date(y,m,1).getDay();
  const lastDay=new Date(y,m+1,0).getDate();

  ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].forEach(n=>{
    let h=document.createElement("div");
    h.className="day header"; h.innerText=n;
    calendarElement.appendChild(h);
  });

  for(let i=0;i<firstDay;i++){
    let e=document.createElement("div");
    e.className="day empty"; calendarElement.appendChild(e);
  }

  for(let d=1;d<=lastDay;d++){
    const dateKey=parseYMD(y,m+1,d);
    let cell=document.createElement("div");
    cell.className="day";
    cell.dataset.date=dateKey;
    cell.innerHTML=`<span class="num">${d}</span>`;
    cell.onclick=()=>openDayModal(dateKey);
    calendarElement.appendChild(cell);
  }

  renderCalendarIndicators();
}

function renderCalendarIndicators(){
  document.querySelectorAll("#calendar .day").forEach(cell=>{
    const key=cell.dataset.date;
    cell.querySelectorAll(".task-indicator").forEach(x=>x.remove());
    cell.style.background="";
    if(!key||!tasks[key]) return;

    let list=tasks[key];
    if(list.length>0){
      const dot=document.createElement("div");
      dot.className="task-indicator";
      dot.style.background=list[0].color||"#999";
      cell.appendChild(dot);
    }

    if(list.every(t=>t.completed)) cell.style.background="#dfffe1";
  });
}

// =====================
// SIDEBAR HOY
// =====================
function renderSidebar(){
  sidebarList.innerHTML="";
  let today=formatDateYMD(new Date());
  let list=tasks[today]||[];

  let filtered=list.filter(t=>currentFilter=="all"|| (currentFilter=="pending"&&!t.completed) || (currentFilter=="completed"&&t.completed));

  if(filtered.length===0){
    sidebarList.innerHTML=`<p class="empty-text">No hay tareas para hoy</p>`;
    return;
  }

  filtered.forEach(t=>{
    let li=document.createElement("li");
    li.innerText=t.text;
    li.style.borderLeft=`4px solid ${t.color}`;
    if(t.completed) li.classList.add("completed");
    li.onclick=()=>openDayModal(today);
    sidebarList.appendChild(li);
  });
}

// filtros
filterAllBtn.onclick=()=>setFilter("all");
filterPendingBtn.onclick=()=>setFilter("pending");
filterCompletedBtn.onclick=()=>setFilter("completed");
function setFilter(f){ currentFilter=f; document.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active"));
  if(f=="all")filterAllBtn.classList.add("active");
  if(f=="pending")filterPendingBtn.classList.add("active");
  if(f=="completed")filterCompletedBtn.classList.add("active");
  renderSidebar();
}

// =====================
// MODAL DÍA
// =====================
function openDayModal(key){
  selectedDayKey=key;
  const [y,m,d]=key.split("-");
  modalDateTitle.innerHTML=`${d} ${months[m-1]} ${y}`;
  taskModal.style.display="flex";
  renderTaskListForDay();
}
closeModal.onclick=()=>taskModal.style.display="none";

function renderTaskListForDay(){
  taskListForDay.innerHTML="";
  let list=tasks[selectedDayKey]||[];

  list.forEach((task,i)=>{
    let el=document.createElement("li");
    el.style.borderLeft=`4px solid ${task.color}`;

    let cb=document.createElement("input");
    cb.type="checkbox"; cb.checked=task.completed;
    cb.onchange=()=>{ task.completed=cb.checked; saveTasks(); renderTaskListForDay(); renderSidebar(); };
    el.append(cb);

    let text=document.createElement("span");
    text.innerText=task.text;
    if(task.completed)text.classList.add("completed");
    el.append(text);

    let actions=document.createElement("div");
    actions.className="task-actions";

    let edit=document.createElement("button"); edit.innerText="✎"; edit.onclick=()=>openEditModal(selectedDayKey,i);
    let sub=document.createElement("button"); sub.innerText="+sub"; sub.onclick=()=>addSubManual(i);
    let del=document.createElement("button"); del.innerText="✕"; del.onclick=()=>deleteTask(i);

    actions.append(edit,sub,del); el.append(actions);
    if(task.subtasks) renderSubtasks(el,task,i);

    taskListForDay.append(el);
  });
}

function addSubManual(i){
  let text=prompt("Subtarea:");
  if(!text)return;
  if(!tasks[selectedDayKey][i].subtasks)tasks[selectedDayKey][i].subtasks=[];
  tasks[selectedDayKey][i].subtasks.push({text,completed:false});
  saveTasks(); renderTaskListForDay();
}

function deleteTask(i){
  if(confirm("Eliminar tarea?")){
    tasks[selectedDayKey].splice(i,1);
    if(tasks[selectedDayKey].length===0) delete tasks[selectedDayKey];
    saveTasks(); renderTaskListForDay(); renderCalendar();
  }
}

function renderSubtasks(base,task,i){
  let ul=document.createElement("ul");
  task.subtasks.forEach((s,n)=>{
    let li=document.createElement("li");

    let cb=document.createElement("input");
    cb.type="checkbox"; cb.checked=s.completed;
    cb.onchange=()=>{ s.completed=cb.checked; saveTasks(); renderTaskListForDay(); };
    li.append(cb);

    let text=document.createElement("span");
    text.innerText=s.text; if(s.completed)text.classList.add("completed");
    li.append(text);

    let del=document.createElement("button");
    del.innerText="✕"; del.onclick=()=>{ task.subtasks.splice(n,1); saveTasks(); renderTaskListForDay(); };
    li.append(del);
    ul.append(li);
  });
  base.append(ul);
}

// =====================
// AÑADIR TAREAS
// =====================
addTaskBtn.onclick=()=>{
  let text=taskInput.value.trim(); if(!text)return;
  if(!tasks[selectedDayKey])tasks[selectedDayKey]=[];
  tasks[selectedDayKey].push({text,color:taskColorInput.value,completed:false,subtasks:[]});
  taskInput.value=""; saveTasks(); renderTaskListForDay(); renderCalendar();
};

// =====================
// EDITAR TAREA
// =====================
function openEditModal(key,i){
  editing={dayKey:key,taskIndex:i};
  let t=tasks[key][i];
  editText.value=t.text;
  editColor.value=t.color;
  editDate.value=key;
  editCompleted.checked=t.completed;
  editModal.style.display="flex";
}
cancelEdit.onclick=()=>editModal.style.display="none";

saveEdit.onclick=()=>{
  let d=editing.dayKey,i=editing.taskIndex;
  let t=tasks[d][i];
  t.text=editText.value.trim();
  t.color=editColor.value;
  t.completed=editCompleted.checked;
  let newDate=editDate.value;

  if(newDate!==d){
    let m=tasks[d].splice(i,1)[0];
    if(tasks[d].length===0)delete tasks[d];
    if(!tasks[newDate])tasks[newDate]=[];
    tasks[newDate].push(m);
  }

  saveTasks(); renderCalendar(); renderSidebar(); editModal.style.display="none";
};

// navegación calendario
prevMonthBtn.onclick=()=>{currentDate.setMonth(currentDate.getMonth()-1),renderCalendar()};
nextMonthBtn.onclick=()=>{currentDate.setMonth(currentDate.getMonth()+1),renderCalendar()};
todayBtn.onclick=()=>{currentDate=new Date(),renderCalendar()};


// =====================
// SPOTIFY
// =====================
document.getElementById("loadSpotify").onclick=()=>{
  let link=document.getElementById("spotifyInput").value.trim();
  if(!link.includes("spotify"))return alert("Enlace no válido");
  link=link.replace("open.spotify.com/","open.spotify.com/embed/");
  document.getElementById("spotifyPlayer").innerHTML=`<iframe src="${link}" width="100%" height="95" frameborder="0" allow="encrypted-media"></iframe>`;
};


// =====================
// GRÁFICAS Chart.js
// =====================
function updateCharts(){
  if(dailyChartInstance)dailyChartInstance.destroy();
  if(monthlyDoughnutInstance)monthlyDoughnutInstance.destroy();
  if(monthlyLineInstance)monthlyLineInstance.destroy();
  if(monthlyBarInstance)monthlyBarInstance.destroy();

  let activeDay=selectedDayKey||formatDateYMD(new Date());
  let list=tasks[activeDay]||[];
  let comp=list.filter(t=>t.completed).length;
  let pend=list.length-comp;

  // Día gráfico barra
  dailyChartInstance=new Chart(document.getElementById("dailyProgressChart"),{
    type:"bar",
    data:{labels:["Completadas","Pendientes"],datasets:[{data:[comp,pend],backgroundColor:["#4caf50","#ff9c32"]}]},
    options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}
  });

  // Porcentaje mensual Aquí: 👇 Resume todas las tareas del mes visible
  let y=currentDate.getFullYear(),m=currentDate.getMonth()+1;
  let total=0,done=0;

  Object.keys(tasks).forEach(k=>{
    if(k.startsWith(`${y}-${String(m).padStart(2,"0")}`)){
      total+=tasks[k].length;
      done+=tasks[k].filter(x=>x.completed).length;
    }
  });

  monthlyDoughnutInstance=new Chart(document.getElementById("monthlyDoughnutChart"),{
    type:"doughnut",
    data:{labels:["Completadas","No completadas"],datasets:[{data:[done,total-done],backgroundColor:["#4caf50","#ce4444"]}]},
    options:{responsive:true}
  });

}
updateCharts();
renderCalendar();
renderSidebar();
