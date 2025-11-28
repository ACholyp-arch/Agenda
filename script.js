const calendarElement = document.getElementById("calendar");
const weekViewBtn = document.getElementById("weekViewBtn");
const monthViewBtn = document.getElementById("monthViewBtn");
const todayBtn = document.getElementById("todayBtn");
const nextMonthBtn = document.getElementById("nextMonth");
const prevMonthBtn = document.getElementById("prevMonth");
const currentMonthText = document.getElementById("currentMonth");

const sidebarList = document.getElementById("taskListToday");

const taskModal = document.getElementById("taskModal");
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskListForDay = document.getElementById("taskListForDay");
const modalDateTitle = document.getElementById("modalDateTitle");
const closeModal = document.getElementById("closeModal");

let currentDate = new Date();
let selectedDay = null;

// Guardar tareas: { "2025-02-28": ["Hacer tarea", "Ir al gym"] }
let tasks = JSON.parse(localStorage.getItem("tasks")) || {};

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

const months = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

/* -------------------------- RENDER CALENDARIO -------------------------- */

function renderCalendar() {
    calendarElement.innerHTML = "";
    monthViewBtn.style.display = "none";
    weekViewBtn.style.display = "inline-block";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    currentMonthText.innerText = `${months[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Días semana
    const daysOfWeek = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
    daysOfWeek.forEach(d => {
        const header = document.createElement("div");
        header.className = "day header";
        header.innerText = d;
        calendarElement.appendChild(header);
    });

    // Espacios vacíos
    for (let i = 0; i < firstDay; i++) {
        calendarElement.appendChild(document.createElement("div"));
    }

    // Días
    for (let day = 1; day <= lastDay; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.className = "day";
        dayDiv.innerText = day;

        dayDiv.onclick = () => openDayModal(year, month, day);

        calendarElement.appendChild(dayDiv);
    }
}

/* -------------------------- MODAL DE TAREAS --------------------------- */

function openDayModal(year, month, day) {
    selectedDay = `${year}-${month+1}-${day}`;

    modalDateTitle.innerText = `Tareas del ${day} de ${months[month]}`;
    taskInput.value = "";
    taskListForDay.innerHTML = "";

    const list = tasks[selectedDay] || [];

    list.forEach((t, index) => {
        const li = document.createElement("li");
        li.innerText = t;

        li.onclick = () => {
            list.splice(index, 1);
            tasks[selectedDay] = list;
            saveTasks();
            openDayModal(year, month, day);
            updateSidebar();
        };

        taskListForDay.appendChild(li);
    });

    taskModal.style.display = "flex";
}

addTaskBtn.onclick = () => {
    if (!taskInput.value.trim()) return;

    if (!tasks[selectedDay]) tasks[selectedDay] = [];

    tasks[selectedDay].push(taskInput.value.trim());
    saveTasks();

    taskInput.value = "";
    openDayModal(...selectedDay.split("-").map(Number)); 
    updateSidebar();
};

closeModal.onclick = () => taskModal.style.display = "none";

/* -------------------------- SIDEBAR --------------------------- */

function updateSidebar() {
    const today = new Date();
    const key = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;

    sidebarList.innerHTML = "";

    if (!tasks[key]) return;

    tasks[key].forEach(t => {
        const li = document.createElement("li");
        li.innerText = t;
        sidebarList.appendChild(li);
    });
}

/* -------------------------- NAV --------------------------- */

todayBtn.onclick = () => {
    currentDate = new Date();
    renderCalendar();
};

nextMonthBtn.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
};

prevMonthBtn.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
};

/* -------------------------- SPOTIFY --------------------------- */

document.getElementById("loadSpotify").onclick = () => {
    let url = document.getElementById("spotifyInput").value.trim();

    if (!url.includes("spotify")) {
        alert("Enlace inválido");
        return;
    }

    url = url.replace("https://open.spotify.com/intl-es/", "https://open.spotify.com/");
    const embed = url.replace("open.spotify.com/", "open.spotify.com/embed/").split("?")[0];

    document.getElementById("spotifyPlayer").innerHTML = `
        <iframe src="${embed}" frameborder="0" allow="encrypted-media"></iframe>
    `;
};

/* -------------------------- INICIO --------------------------- */

renderCalendar();
updateSidebar();
