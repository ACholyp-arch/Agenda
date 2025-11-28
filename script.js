/* ================================
   CALENDARIO, TAREAS y SPOTIFY
   Archivo unificado y corregido
   ================================ */

/* -------------------------- SELECTORES -------------------------- */
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

// elementos opcionales (si existen en tu HTML se usarán)
const taskColorInput = document.getElementById("taskColor"); // puede no existir
const addSubtaskBtn = document.getElementById("addSubtaskBtn"); // puede no existir
const subtaskList = document.getElementById("subtaskList"); // puede no existir

let currentDate = new Date();
let selectedDay = null;

// Estructura: tasks["YYYY-M-D"] = [{ text, color, subtasks:[{text,done}] }, ...]
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
    if (!calendarElement) return;
    calendarElement.innerHTML = "";
    if (monthViewBtn) monthViewBtn.style.display = "none";
    if (weekViewBtn) weekViewBtn.style.display = "inline-block";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (currentMonthText) currentMonthText.innerText = `${months[month]} ${year}`;

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
        const blank = document.createElement("div");
        blank.className = "day blank";
        calendarElement.appendChild(blank);
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

function formatDateKey(year, monthZeroBased, day) {
    // llamamos con monthZeroBased para consistencia interna
    return `${year}-${monthZeroBased + 1}-${day}`;
}

function openDayModal(year, monthZeroBased, day) {
    selectedDay = formatDateKey(year, monthZeroBased, day);

    if (modalDateTitle) modalDateTitle.innerText = `Tareas del ${day} de ${months[monthZeroBased]}`;
    if (taskInput) taskInput.value = "";
    if (taskListForDay) taskListForDay.innerHTML = "";
    if (subtaskList) subtaskList.innerHTML = "";

    renderTaskModal(selectedDay);
}

function renderTaskModal(dateKey) {
    if (!taskListForDay || !modalDateTitle) return;

    const [year, monthStr, dayStr] = dateKey.split("-").map(Number);
    const monthIndex = monthStr - 1;
    modalDateTitle.innerText = `Tareas del ${dayStr} de ${months[monthIndex]}`;
    if (taskInput) taskInput.value = "";
    taskListForDay.innerHTML = "";
    if (subtaskList) subtaskList.innerHTML = "";

    const list = tasks[dateKey] || [];

    list.forEach((task, taskIndex) => {
        const li = document.createElement("li");
        li.classList.add("task-item");
        li.style.backgroundColor = task.color || "#eee";
        li.style.cursor = "default";

        // Título + eliminar pequeño botón
        const titleWrap = document.createElement("div");
        titleWrap.style.display = "flex";
        titleWrap.style.justifyContent = "space-between";
        titleWrap.style.alignItems = "center";

        const title = document.createElement("strong");
        title.innerText = task.text;
        titleWrap.appendChild(title);

        const delBtn = document.createElement("button");
        delBtn.innerText = "Eliminar";
        delBtn.style.marginLeft = "8px";
        delBtn.onclick = (e) => {
            e.stopPropagation();
            tasks[dateKey].splice(taskIndex, 1);
            if (tasks[dateKey].length === 0) delete tasks[dateKey];
            saveTasks();
            renderTaskModal(dateKey);
            updateSidebar();
        };
        titleWrap.appendChild(delBtn);

        li.appendChild(titleWrap);

        // Contenedor de subtareas
        const ulSub = document.createElement("ul");
        if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.forEach((sub, subIndex) => {
                const subLi = document.createElement("li");
                subLi.className = "subtask";

                const chk = document.createElement("input");
                chk.type = "checkbox";
                chk.checked = !!sub.done;

                chk.onchange = (ev) => {
                    ev.stopPropagation();
                    task.subtasks[subIndex].done = chk.checked;
                    saveTasks();
                    checkTaskCompleted(task, li, dateKey, taskIndex);
                    updateSidebar();
                };

                subLi.appendChild(chk);

                const span = document.createElement("span");
                span.innerText = sub.text;
                span.style.marginLeft = "8px";
                subLi.appendChild(span);

                ulSub.appendChild(subLi);
            });
        }

        li.appendChild(ulSub);

        checkTaskCompleted(task, li, dateKey, taskIndex);
        taskListForDay.appendChild(li);
    });

    if (taskModal) taskModal.style.display = "flex";
}

function checkTaskCompleted(task, element, dateKey, taskIndex) {
    if (!task || !element) return;
    const allDone = task.subtasks && task.subtasks.length > 0 && task.subtasks.every(s => s.done);
    if (allDone) {
        element.classList.add("task-completed");
        // opcional: hacer menos visible en sidebar (no eliminamos automáticamente, solo marcamos)
        // si querés eliminarla completamente, descomenta:
        // tasks[dateKey].splice(taskIndex, 1); saveTasks(); renderTaskModal(dateKey); updateSidebar();
    } else {
        element.classList.remove("task-completed");
    }
}

/* -------------------------- BOTONES TAREAS --------------------------- */

if (addTaskBtn) {
    addTaskBtn.onclick = () => {
        if (!selectedDay) return alert("Seleccioná primero un día en el calendario.");
        if (!taskInput.value.trim()) return;

        if (!tasks[selectedDay]) tasks[selectedDay] = [];

        const color = taskColorInput ? taskColorInput.value : randomPastelColor();

        const newTask = {
            text: taskInput.value.trim(),
            color: color,
            subtasks: []
        };

        tasks[selectedDay].push(newTask);
        saveTasks();

        taskInput.value = "";
        renderTaskModal(selectedDay);
        updateSidebar();
    };
}

if (addSubtaskBtn) {
    addSubtaskBtn.onclick = () => {
        if (!selectedDay) return alert("Seleccioná primero un día.");
        const text = prompt("Escribe una subtarea:");
        if (!text) return;

        if (!tasks[selectedDay] || tasks[selectedDay].length === 0) {
            // si no hay tareas, crea una tarea vacía para añadir la subtarea
            const color = taskColorInput ? taskColorInput.value : randomPastelColor();
            tasks[selectedDay] = [{ text: "Nueva tarea", color, subtasks: [] }];
        }

        const lastTaskIndex = tasks[selectedDay].length - 1;
        tasks[selectedDay][lastTaskIndex].subtasks.push({ text, done: false });
        saveTasks();
        renderTaskModal(selectedDay);
        updateSidebar();
    };
}

if (closeModal) {
    closeModal.onclick = () => taskModal.style.display = "none";
}

/* -------------------------- SIDEBAR --------------------------- */

function updateSidebar() {
    if (!sidebarList) return;

    const today = new Date();
    const key = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;

    sidebarList.innerHTML = "";

    if (!tasks[key]) return;

    tasks[key].forEach(t => {
        const li = document.createElement("li");
        li.innerText = t.text || t; // si estructura antigua, mostrar texto directamente
        sidebarList.appendChild(li);
    });
}

/* -------------------------- NAV --------------------------- */

if (todayBtn) todayBtn.onclick = () => { currentDate = new Date(); renderCalendar(); };
if (nextMonthBtn) nextMonthBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); };
if (prevMonthBtn) prevMonthBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); };

/* -------------------------- UTILIDADES --------------------------- */

function randomPastelColor() {
    // genera un color pastel simple
    const r = Math.round((Math.random() * 127) + 120);
    const g = Math.round((Math.random() * 127) + 120);
    const b = Math.round((Math.random() * 127) + 120);
    return `rgb(${r}, ${g}, ${b})`;
}

/* -------------------------- SPOTIFY (PKCE) --------------------------- */

/*
  Nota:
  - callback real en tu repo ahora: /Agenda/callback.html
  - clientId ya lo tenés: 767b285b46a5456bb19d3e9e04052285
  - la función handleSpotifyCallback obtiene el code, pide el token y guarda access_token en localStorage (key: access_token)
*/

const clientId = "767b285b46a5456bb19d3e9e04052285";
const redirectUri = "https://acholyp-arch.github.io/Agenda/callback.html"; // coincide con Spotify Dashboard

// Generadores PKCE
function generateRandomString(length = 64) {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let text = "";
    for (let i = 0; i < length; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(hash);
}

function base64urlencode(buffer) {
    // Convertimos a base64 URL-safe
    let str = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function buildCodeChallenge(verifier) {
    const hashed = await sha256(verifier);
    return base64urlencode(hashed);
}

// Lanzar login (adjuntar a botón)
async function loginWithSpotify() {
    const codeVerifier = generateRandomString(128);
    localStorage.setItem("spotify_code_verifier", codeVerifier);
    const codeChallenge = await buildCodeChallenge(codeVerifier);

    const scope = ["user-read-currently-playing", "user-read-playback-state"].join(" ");

    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("code_challenge_method", "S256");
    authUrl.searchParams.append("code_challenge", codeChallenge);
    authUrl.searchParams.append("scope", scope);

    window.location.href = authUrl.toString();
}

window.loginWithSpotify = loginWithSpotify; // accesible si usás onclick en HTML

// Intercambiar code por token (esto corre en callback.html)
async function exchangeCodeForToken(code) {
    const codeVerifier = localStorage.getItem("spotify_code_verifier");
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier
    });

    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
    });

    return res.json();
}

// Manejar callback (si estás en callback.html, se ejecutará desde ahí)
// Para evitar error si se ejecuta en index, protegemos:
async function handleSpotifyCallbackInThisPage() {
    try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (!code) return;
        // intercambiar por token
        const tokenData = await exchangeCodeForToken(code);
        if (tokenData.error) {
            console.error("Error token:", tokenData);
            return;
        }
        localStorage.setItem("access_token", tokenData.access_token);
        // redirigir a la raíz del proyecto (subir un nivel)
        window.location.href = "../";
    } catch (err) {
        console.error("Callback error:", err);
    }
}

// Si estamos en callback.html ejecutamos el handler
if (location.pathname.endsWith("/callback.html")) {
    // Ejecutar para intercambiar code -> token
    handleSpotifyCallbackInThisPage();
}

/* -------------------------- SPOTIFY: NOW PLAYING --------------------------- */

function getStoredAccessToken() {
    return localStorage.getItem("access_token") || null;
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

async function fetchNowPlaying() {
    const token = getStoredAccessToken();
    if (!token) {
        // opcional: mostrar botón conectar si existe
        const infoEl = document.getElementById("spotify-info") || document.getElementById("spotifyPlayer");
        if (infoEl) infoEl.innerHTML = `<p>Conectar Spotify para ver lo que escuchas.</p><button id="connectSpotifyInline">Conectar Spotify</button>`;
        // attach listener si existe el botón dinámico
        const btn = document.getElementById("connectSpotifyInline");
        if (btn) btn.onclick = () => loginWithSpotify();
        return;
    }

    try {
        const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const infoEl = document.getElementById("spotify-info") || document.getElementById("spotifyPlayer");
        if (!infoEl) return;

        if (response.status === 204) {
            infoEl.innerHTML = "<p>No estás escuchando nada ahorita.</p>";
            return;
        }

        if (!response.ok) {
            // token inválido/expirado: limpiarlo
            console.warn("Spotify no OK", response.status);
            if (response.status === 401) {
                localStorage.removeItem("access_token");
            }
            infoEl.innerHTML = `<p>Error al recuperar música (status ${response.status}).</p>`;
            return;
        }

        const data = await response.json();
        if (!data || !data.item) {
            infoEl.innerHTML = "<p>No hay información de reproducción.</p>";
            return;
        }

        const track = data.item;
        const progress = data.progress_ms || 0;
        const duration = track.duration_ms || 1;
        const percentage = Math.min(100, Math.max(0, (progress / duration) * 100));

        infoEl.innerHTML = `
            <div class="now-playing-container">
                <img src="${track.album.images[0].url}" class="album-cover">
                <div class="track-info">
                    <h3>${track.name}</h3>
                    <p>${track.artists.map(a => a.name).join(", ")}</p>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${percentage}%"></div>
                        </div>
                        <div class="progress-times">
                            <span>${formatTime(progress)}</span>
                            <span>${formatTime(duration)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error("Error fetchNowPlaying:", err);
    }
}

// arrancar actualización periódica (si estamos en index.html)
if (!location.pathname.endsWith("/callback.html")) {
    // intentar inmediatamente y luego cada 1s para barra fluida
    fetchNowPlaying();
    setInterval(fetchNowPlaying, 1000);
}

/* -------------------------- INICIO --------------------------- */

renderCalendar();
updateSidebar();
