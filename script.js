// ------------------------------------------------------
// VARIABLES BASE
// ------------------------------------------------------
const calendar = document.getElementById("calendar");
const monthTitle = document.getElementById("monthTitle");
const weekView = document.getElementById("weekView");

const modal = document.getElementById("eventModal");
const modalDate = document.getElementById("modalDate");
const eventText = document.getElementById("eventText");
const eventColor = document.getElementById("eventColor");
const isTask = document.getElementById("isTask");
const eventReminder = document.getElementById("eventReminder");

let selectedDate = null;

let events = JSON.parse(localStorage.getItem("events")) || {};


// ------------------------------------------------------
// GENERAR CALENDARIO MENSUAL
// ------------------------------------------------------
function generateCalendar() {
    calendar.innerHTML = "";
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    monthTitle.textContent = today.toLocaleString("es", { month: "long", year: "numeric" });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        calendar.innerHTML += `<div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const key = `${year}-${month+1}-${day}`;

        let html = `<div class="day" onclick="openModal('${key}')">${day}`;

        if (events[key]) {
            events[key].forEach(e => {
                html += `<div class="eventBubble" style="background:${e.color}">${e.text}</div>`;
            });
        }

        html += `</div>`;
        calendar.innerHTML += html;
    }
}

generateCalendar();


// ------------------------------------------------------
// MODAL PARA EVENTOS
// ------------------------------------------------------
function openModal(dateKey) {
    selectedDate = dateKey;
    modalDate.textContent = `Evento para: ${dateKey}`;
    eventText.value = "";
    eventColor.value = "#4287f5";
    isTask.checked = false;
    modal.classList.remove("hidden");
}

function closeModal() {
    modal.classList.add("hidden");
}


// ------------------------------------------------------
// GUARDAR EVENTO
// ------------------------------------------------------
function saveEvent() {
    if (!events[selectedDate]) events[selectedDate] = [];

    const newEvent = {
        text: eventText.value,
        color: eventColor.value,
        task: isTask.checked,
        done: false,
        reminder: eventReminder.value
    };

    events[selectedDate].push(newEvent);

    localStorage.setItem("events", JSON.stringify(events));

    // Notificación interna
    if (newEvent.reminder) {
        scheduleReminder(newEvent.text, newEvent.reminder);
    }

    closeModal();
    generateCalendar();
    showWeekly();
}


// ------------------------------------------------------
// VISTA SEMANAL
// ------------------------------------------------------
function showWeekly() {
    weekView.classList.remove("hidden");
    calendar.classList.add("hidden");
    monthTitle.textContent = "Vista Semanal";

    weekView.innerHTML = "";

    const today = new Date();
    const week = [];

    const first = today.getDate() - today.getDay();

    for (let i = 0; i < 7; i++) {
        const date = new Date(today.setDate(first + i));
        const key = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;

        let html = `<div class="weekDay"><strong>${date.toLocaleString("es", { weekday:"short" })}</strong>`;

        if (events[key]) {
            events[key].forEach((ev, index) => {
                html += `
                    <div class="eventBubble ${ev.done ? "taskDone":""}" 
                         style="background:${ev.color}" 
                         onclick="toggleTask('${key}', ${index})">
                         ${ev.text}
                    </div>`;
            });
        }

        html += `</div>`;
        weekView.innerHTML += html;
    }
}


// ------------------------------------------------------
// MARCAR / DESMARCAR TAREAS
// ------------------------------------------------------
function toggleTask(dateKey, index) {
    events[dateKey][index].done = !events[dateKey][index].done;
    localStorage.setItem("events", JSON.stringify(events));
    showWeekly();
    generateCalendar();
}


// ------------------------------------------------------
// RECORDATORIOS INTERNOS
// ------------------------------------------------------
function scheduleReminder(text, dateTime) {
    const time = new Date(dateTime).getTime();
    const now = Date.now();

    const diff = time - now;
    if (diff > 0) {
        setTimeout(() => {
            alert("Recordatorio: " + text);
        }, diff);
    }
}


// ------------------------------------------------------
// CAMBIAR FONDO
// ------------------------------------------------------
const bgInput = document.getElementById("bgInput");

bgInput.addEventListener("change", event => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        document.body.style.backgroundImage = `url(${e.target.result})`;
        localStorage.setItem("background", e.target.result);
    };

    reader.readAsDataURL(file);
});

// Cargar fondo guardado
const savedBg = localStorage.getItem("background");
if (savedBg) {
    document.body.style.backgroundImage = `url(${savedBg})`;
}


// ------------------------------------------------------
// SPOTIFY EMBED
// ------------------------------------------------------
function loadSpotify() {
    const url = document.getElementById("spotifyInput").value;
    document.getElementById("spotifyPlayer").innerHTML = `
        <iframe src="${url}" frameborder="0" allow="encrypted-media"></iframe>
    `;
}
