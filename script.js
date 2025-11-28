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
// Nueva forma:
// tasks["2025-02-28"] = [
//    { text:"Ir al gym", color:"#aabbcc", subtasks:[{text:"meter ropa", done:false}] }
// ]

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

    const newTask = {
        text: taskInput.value.trim(),
        color: document.getElementById("taskColor").value,
        subtasks: []
    };

    tasks[selectedDay].push(newTask);
    saveTasks();

    taskInput.value = "";
    renderTaskModal(selectedDay);
    updateSidebar();
};

function renderTaskModal(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    modalDateTitle.innerText = `Tareas del ${day} de ${months[month - 1]}`;
    taskInput.value = "";
    taskListForDay.innerHTML = "";
    subtaskList.innerHTML = "";

    const list = tasks[dateKey] || [];

    list.forEach((task, taskIndex) => {
        const li = document.createElement("li");
        li.classList.add("task-item");
        li.style.backgroundColor = task.color;
        li.innerHTML = `<strong>${task.text}</strong>`;
        
        // Contenedor de subtareas
        const ulSub = document.createElement("ul");

        task.subtasks.forEach((sub, subIndex) => {
            const subLi = document.createElement("li");
            subLi.className = "subtask";

            const chk = document.createElement("input");
            chk.type = "checkbox";
            chk.checked = sub.done;

            chk.onchange = () => {
                task.subtasks[subIndex].done = chk.checked;
                saveTasks();
                checkTaskCompleted(task, li);
                updateSidebar();
            };

            subLi.appendChild(chk);
            subLi.appendChild(document.createTextNode(sub.text));
            ulSub.appendChild(subLi);
        });

        li.appendChild(ulSub);

        li.onclick = () => {
            tasks[dateKey].splice(taskIndex, 1);
            saveTasks();
            renderTaskModal(dateKey);
            updateSidebar();
        };

        checkTaskCompleted(task, li);
        taskListForDay.appendChild(li);
    });

    taskModal.style.display = "flex";
}

function checkTaskCompleted(task, element) {
    if (task.subtasks.length > 0 && task.subtasks.every(s => s.done)) {
        element.classList.add("task-completed");
    } else {
        element.classList.remove("task-completed");
    }
}

addSubtaskBtn.onclick = () => {
    const text = prompt("Escribe una subtarea:");
    if (!text) return;

    if (!tasks[selectedDay]) return;

    const lastTask = tasks[selectedDay][tasks[selectedDay].length - 1];
    lastTask.subtasks.push({ text, done:false });

    saveTasks();
    renderTaskModal(selectedDay);
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

async function updateCurrentSpotify() {
    const token = "AQUÍ TU TOKEN"; // ← reemplazar

    const resp = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { "Authorization": "Bearer " + token }
    });

    if (!resp.ok) return;

    const data = await resp.json();

    const track = data.item;

    document.getElementById("spotifyPlayer").innerHTML = `
        <p><strong>Reproduciendo ahora:</strong></p>
        <p>${track.name} — ${track.artists[0].name}</p>
        <img src="${track.album.images[0].url}" width="200" style="border-radius:12px;">
    `;
}

// Actualizar cada 20s
setInterval(updateCurrentSpotify, 20000);
updateCurrentSpotify();

// ================================
//    SPOTIFY AUTH (PKCE FLOW)
// ================================

const clientId = "767b285b46a5456bb19d3e9e04052285";
const redirectUri = "https://acholyp-arch.github.io/Agenda/callback.html";


async function generateCodeVerifier(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return base64;
}

async function redirectToSpotifyAuth() {
    const codeVerifier = await generateCodeVerifier(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    localStorage.setItem("code_verifier", codeVerifier);

    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("code_challenge_method", "S256");
    authUrl.searchParams.append("code_challenge", codeChallenge);
    authUrl.searchParams.append("scope", "user-read-currently-playing user-read-playback-state");

    window.location.href = authUrl.toString();
}

window.spotifyLogin = redirectToSpotifyAuth;

// ======================================
//    SPOTIFY NOW PLAYING (REAL TIME)
// ======================================

async function getAccessToken() {
    return localStorage.getItem("access_token");
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

async function fetchNowPlaying() {
    const token = await getAccessToken();
    if (!token) return;

    try {
        const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status === 204) {
            document.getElementById("spotify-info").innerHTML =
                "<p>No estás escuchando nada ahorita.</p>";
            return;
        }

        const data = await response.json();
        const track = data.item;

        const progress = data.progress_ms;
        const duration = track.duration_ms;
        const percentage = (progress / duration) * 100;

        document.getElementById("spotify-info").innerHTML = `
            <div class="now-playing-container">
                <img src="${track.album.images[0].url}" class="album-cover">

                <div class="track-info">
                    <h3>${track.name}</h3>
                    <p>${track.artists.map(a => a.name).join(", ")}</p>

                    <div class="progress-container">
                        <div class="progress-bar">
                            <div 
                                class="progress-fill" 
                                style="width:${percentage}%">
                            </div>
                        </div>

                        <div class="progress-times">
                            <span>${formatTime(progress)}</span>
                            <span>${formatTime(duration)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error("Error obteniendo Spotify Now Playing:", error);
    }
}

// Actualizar más frecuente para animar la barra
setInterval(fetchNowPlaying, 1000);

// Ejecutar si hay callback
handleSpotifyCallback();

// Actualizar si ya hay token
if (localStorage.getItem("spotify_access_token")) {
    refreshNowPlaying();
    setInterval(refreshNowPlaying, 5000);
}

document.getElementById("connectSpotify").onclick = () => {
    loginWithSpotify();
};

renderCalendar();
updateSidebar();
