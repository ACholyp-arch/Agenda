const calendarElement = document.getElementById("calendar");
const weekViewBtn = document.getElementById("weekViewBtn");
const monthViewBtn = document.getElementById("monthViewBtn");
const todayBtn = document.getElementById("todayBtn");
const nextMonthBtn = document.getElementById("nextMonth");
const prevMonthBtn = document.getElementById("prevMonth");
const currentMonthText = document.getElementById("currentMonth");

const spotifyInput = document.getElementById("spotifyInput");
const loadSpotifyBtn = document.getElementById("loadSpotify");
const spotifyPlayer = document.getElementById("spotifyPlayer");

let currentDate = new Date();

const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function renderCalendar() {
    calendarElement.innerHTML = "";
    monthViewBtn.style.display = "none";
    weekViewBtn.style.display = "inline-block";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    currentMonthText.innerText = `${months[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();

    const daysOfWeek = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    daysOfWeek.forEach(d => {
        const header = document.createElement("div");
        header.className = "day header";
        header.innerText = d;
        calendarElement.appendChild(header);
    });

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        empty.className = "day empty";
        calendarElement.appendChild(empty);
    }

    for (let day = 1; day <= lastDay; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.className = "day";
        dayDiv.innerText = day;
        calendarElement.appendChild(dayDiv);
    }
}

function renderWeekView() {
    calendarElement.innerHTML = "";

    weekViewBtn.style.display = "none";
    monthViewBtn.style.display = "inline-block";

    const weekContainer = document.createElement("div");
    weekContainer.classList.add("week-view");

    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
        const temp = new Date(startOfWeek);
        temp.setDate(startOfWeek.getDate() + i);
        
        const div = document.createElement("div");
        div.className = "week-day";
        div.innerHTML = `<strong>${temp.toDateString().slice(0, 3)}</strong><br>${temp.getDate()}`;
        
        weekContainer.appendChild(div);
    }

    calendarElement.appendChild(weekContainer);
}

weekViewBtn.onclick = () => renderWeekView();
monthViewBtn.onclick = () => renderCalendar();
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

// Spotify
loadSpotifyBtn.onclick = () => {
    const url = spotifyInput.value.trim();

    if (!url.includes("spotify")) {
        alert("Por favor pega un enlace válido de Spotify.");
        return;
    }

    // Convertir URL normal a embed
    const embedUrl = url
        .replace("open.spotify.com/", "open.spotify.com/embed/")
        .split("?")[0];

    spotifyPlayer.innerHTML = `
        <iframe 
            src="${embedUrl}" 
            frameborder="0" 
            allow="encrypted-media">
        </iframe>
    `;
};

renderCalendar();
