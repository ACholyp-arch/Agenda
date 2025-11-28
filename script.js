let currentDate = new Date();
let selectedDay = new Date();
let tasks = JSON.parse(localStorage.getItem("tasks")) || {};

// ------------------ CALENDARIO ------------------

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    document.getElementById("currentMonth").textContent =
        currentDate.toLocaleString("es", { month: "long", year: "numeric" });

    document.getElementById("selectedDate").textContent =
        selectedDay.toLocaleDateString("es");

    const firstDay = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();

    const calendar = document.getElementById("calendar");
    calendar.innerHTML = "";

    for (let i = 0; i < firstDay; i++) {
        calendar.innerHTML += `<div></div>`;
    }

    for (let day = 1; day <= numDays; day++) {
        const dateKey = `${year}-${month + 1}-${day}`;

        const hasTask = tasks[dateKey] && tasks[dateKey].length > 0;

        calendar.innerHTML += `
            <div class="calendar-day ${hasTask ? "hasTask" : ""}"
                onclick="selectDay(${day})">
                <strong>${day}</strong>
            </div>
        `;
    }

    renderTodayTasks();
    renderTasksForDay();
}

function selectDay(day) {
    selectedDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    renderCalendar();
}

function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function goToday() {
    currentDate = new Date();
    selectedDay = new Date();
    renderCalendar();
}

function showMonthView() {
    document.getElementById("calendar").classList.remove("hidden");
    document.getElementById("weekView").classList.add("hidden");
}

function showWeekView() {
    document.getElementById("calendar").classList.add("hidden");
    document.getElementById("weekView").classList.remove("hidden");
}


// ------------------ TAREAS ------------------

function openTaskModal() {
    document.getElementById("taskModal").classList.remove("hidden");
    document.getElementById("subtaskContainer").innerHTML = "";
}

function closeTaskModal() {
    document.getElementById("taskModal").classList.add("hidden");
}

function addSubtask() {
    const div = document.createElement("div");
    div.className = "subtask-item";
    div.innerHTML = `
        <input type="checkbox" class="subCheck">
        <input type="text" class="subInput" placeholder="Subtarea...">
    `;
    document.getElementById("subtaskContainer").appendChild(div);
}

function saveTask() {
    const title = document.getElementById("taskTitle").value;
    const color = document.getElementById("taskColor").value;

    const dateKey = selectedDay.toISOString().split("T")[0];
    if (!tasks[dateKey]) tasks[dateKey] = [];

    const subtasks = [];
    document.querySelectorAll(".subtask-item").forEach(st => {
        subtasks.push({
            done: st.querySelector(".subCheck").checked,
            text: st.querySelector(".subInput").value
        });
    });

    tasks[dateKey].push({
        title,
        color,
        subtasks
    });

    localStorage.setItem("tasks", JSON.stringify(tasks));
    closeTaskModal();
    renderCalendar();
}


// ------------------ MOSTRAR TAREAS ------------------

function renderTasksForDay() {
    const dateKey = selectedDay.toISOString().split("T")[0];
    const area = document.getElementById("taskList");
    area.innerHTML = "";

    if (!tasks[dateKey]) return;

    tasks[dateKey].forEach((task, i) => {
        const li = document.createElement("li");
        li.style.borderLeftColor = task.color;

        li.innerHTML = `
            <strong>${task.title}</strong>
            <button onclick="toggleSubtasks(${i})">▼</button>
            <ul id="sub_${i}" class="subtasks hidden">
                ${task.subtasks.map(st => `
                    <li>
                        <input type="checkbox" ${st.done ? "checked" : ""}>
                        ${st.text}
                    </li>`).join("")}
            </ul>
        `;

        area.appendChild(li);
    });
}

function toggleSubtasks(i) {
    const el = document.getElementById("sub_" + i);
    el.classList.toggle("hidden");
}


// ------------------ TAREAS DEL DÍA (sidebar) ------------------

function renderTodayTasks() {
    const todayKey = new Date().toISOString().split("T")[0];
    const ul = document.getElementById("todayTasks");
    ul.innerHTML = "";

    if (!tasks[todayKey]) return;

    tasks[todayKey].forEach(t => {
        const li = document.createElement("li");
        li.style.borderLeftColor = t.color;
        li.textContent = t.title;
        ul.appendChild(li);
    });
}


// ------------------ SPOTIFY ------------------

function loadSpotify() {
    const url = document.getElementById("spotifyInput").value;

    // Convertir automáticamente el link normal en embed
    let embed = url.replace("open.spotify.com/", "open.spotify.com/embed/");

    document.getElementById("spotifyPlayer").innerHTML = `
        <iframe 
            src="${embed}"
            width="100%" height="80" frameborder="0" allow="encrypted-media">
        </iframe>
    `;
}


// ------------------ INICIO ------------------

renderCalendar();
