// --- NUEVOS ELEMENTOS ---
const taskColorInput = document.getElementById("taskColorInput");
const subTaskInput = document.getElementById("subTaskInput");
const addSubTaskBtn = document.getElementById("addSubTaskBtn");
const dailyProgressChartCanvas = document.getElementById("dailyProgressChart");
const monthlyProgressChartCanvas = document.getElementById("monthlyProgressChart");

// Variables globales para las instancias de Chart.js
let dailyChart, monthlyChart;

let currentDate = new Date();
let selectedDay = null;

// Guardar tareas: 
/* tasks: { 
        "2025-12-03": [
            { 
                text: "Hacer tarea", 
                color: "#6699ff", 
                completed: false, 
                subtasks: [{text: "Leer capítulo 3", completed: true}]
            }
        ] 
    }
*/
let tasks = JSON.parse(localStorage.getItem("tasks")) || {};

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    // Asegurarse de que las gráficas se actualicen al guardar
    updateCharts();
}

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

        // Clave de fecha para buscar tareas
        const dateKey = `${year}-${month+1}-${day}`;
        if (tasks[dateKey] && tasks[dateKey].length > 0) {
            // Mostrar un indicador de tarea si hay tareas
            const indicator = document.createElement('div');
            indicator.className = 'task-indicator';
            // Usa el color de la primera tarea como indicador
            indicator.style.backgroundColor = tasks[dateKey][0].color || '#aaa'; 
            dayDiv.appendChild(indicator);
            
            // Opcional: Resaltar día si todas las tareas están completas
            const allCompleted = tasks[dateKey].every(t => t.completed);
            if (allCompleted) {
                dayDiv.style.backgroundColor = '#e6ffe6'; // Fondo verde suave
            }
        }

        dayDiv.onclick = () => openDayModal(year, month, day);

        calendarElement.appendChild(dayDiv);
    }
    updateCharts(); // Actualizar gráficas al cambiar de mes
}

/* -------------------------- MODAL DE TAREAS --------------------------- */

function renderTaskList(list, dateKey) {
    taskListForDay.innerHTML = "";
    
    list.forEach((task, index) => {
        const li = document.createElement("li");
        li.style.borderLeftColor = task.color || "#aaa";
        
        // Checkbox principal
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = task.completed;
        
        checkbox.onchange = () => {
            task.completed = checkbox.checked;
            saveTasks();
            renderTaskList(list, dateKey); // Re-renderizar para aplicar estilos
            renderCalendar(); // Actualizar indicador en el calendario
            updateSidebar();
        };

        const taskTextSpan = document.createElement("span");
        taskTextSpan.className = `task-text ${task.completed ? 'completed' : ''}`;
        taskTextSpan.innerText = task.text;

        li.appendChild(checkbox);
        li.appendChild(taskTextSpan);
        
        // Botón para eliminar tarea (simple)
        const deleteBtn = document.createElement("button");
        deleteBtn.innerText = "✕";
        deleteBtn.onclick = () => {
            list.splice(index, 1);
            tasks[dateKey] = list;
            saveTasks();
            renderTaskList(list, dateKey);
            renderCalendar();
            updateSidebar();
        };
        li.appendChild(deleteBtn);

        // Renderizar Subtareas
        if (task.subtasks && task.subtasks.length > 0) {
            const subList = document.createElement("ul");
            subList.className = "subtask-list";
            task.subtasks.forEach((sub, subIndex) => {
                const subLi = document.createElement("li");
                const subCheckbox = document.createElement("input");
                subCheckbox.type = "checkbox";
                subCheckbox.checked = sub.completed;
                
                subCheckbox.onchange = () => {
                    sub.completed = subCheckbox.checked;
                    saveTasks();
                    renderTaskList(list, dateKey);
                };

                subLi.appendChild(subCheckbox);
                subLi.innerHTML += `<span class="${sub.completed ? 'completed' : ''}">${sub.text}</span>`;
                subList.appendChild(subLi);
            });
            li.appendChild(subList);
        }
        
        taskListForDay.appendChild(li);
    });
    
    // Habilitar/Deshabilitar entrada de subtarea
    const hasPendingTask = list.some(t => !t.completed);
    subTaskInput.disabled = !hasPendingTask;
    addSubTaskBtn.disabled = !hasPendingTask;
}

function openDayModal(year, month, day) {
    selectedDay = `${year}-${month+1}-${day}`;
    modalDateTitle.innerText = `Tareas del ${day} de ${months[month]}`;

    // Limpiar entradas
    taskInput.value = "";
    subTaskInput.value = "";
    taskListForDay.innerHTML = "";

    const list = tasks[selectedDay] || [];
    renderTaskList(list, selectedDay);

    taskModal.style.display = "flex";
}

// Lógica para agregar tarea principal
addTaskBtn.onclick = () => {
    const taskText = taskInput.value.trim();
    if (!taskText) return;

    if (!tasks[selectedDay]) tasks[selectedDay] = [];

    const newTask = {
        text: taskText,
        color: taskColorInput.value,
        completed: false,
        subtasks: []
    };

    tasks[selectedDay].push(newTask);
    saveTasks();

    taskInput.value = "";
    // Volver a abrir el modal para refrescar la lista
    openDayModal(...selectedDay.split("-").map(Number));  
    renderCalendar();
};

// Lógica para agregar subtarea (se añade a la ÚLTIMA tarea principal)
addSubTaskBtn.onclick = () => {
    const subTaskText = subTaskInput.value.trim();
    const list = tasks[selectedDay];
    if (!subTaskText || !list || list.length === 0) return;

    // Encuentra la última tarea sin completar para agregar la subtarea
    const lastPendingTask = list.slice().reverse().find(t => !t.completed);
    
    if (lastPendingTask) {
        if (!lastPendingTask.subtasks) lastPendingTask.subtasks = [];
        lastPendingTask.subtasks.push({ text: subTaskText, completed: false });
        saveTasks();
        subTaskInput.value = "";
        renderTaskList(list, selectedDay);
    } else {
        alert("No hay tareas principales pendientes para agregar subtareas.");
    }
};


closeModal.onclick = () => taskModal.style.display = "none";

/* -------------------------- SIDEBAR --------------------------- */

function updateSidebar() {
    const today = new Date();
    const key = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;

    sidebarList.innerHTML = "";

    const todaysTasks = tasks[key] || [];

    todaysTasks.forEach(task => {
        const li = document.createElement("li");
        // Muestra solo las tareas pendientes
        if (!task.completed) {
            li.innerText = task.text;
            li.style.borderLeftColor = task.color || "#aaa";
            sidebarList.appendChild(li);
        }
    });
}

/* -------------------------- GRÁFICAS (Chart.js) --------------------------- */

function updateCharts() {
    // 1. Gráfica de Progreso Diario (Ej. Progreso Total del Mes)
    const allTasks = Object.values(tasks).flat();
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.completed).length;
    const pending = total - completed;

    // Destruir instancias anteriores para evitar errores de Chart.js
    if (dailyChart) dailyChart.destroy();
    
    dailyChart = new Chart(dailyProgressChartCanvas, {
        type: 'doughnut', // Gráfica tipo rosquilla
        data: {
            labels: ['Completadas', 'Pendientes'],
            datasets: [{
                data: [completed, pending],
                backgroundColor: ['#4CAF50', '#F44336'], // Verde y Rojo
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                title: {
                    display: true,
                    text: 'Progreso Mensual Total'
                }
            }
        }
    });

    // 2. Gráfica de Tendencia (Ej. % de Completado por día de la semana)
    const dayData = calculateWeeklyCompletionRate();

    if (monthlyChart) monthlyChart.destroy();
    
    monthlyChart = new Chart(monthlyProgressChartCanvas, {
        type: 'line', // Gráfica tipo línea para tendencia
        data: {
            labels: dayData.labels,
            datasets: [{
                label: '% Tareas Completadas',
                data: dayData.data,
                borderColor: '#6699ff',
                tension: 0.3,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Tendencia Semanal'
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    title: { display: true, text: 'Porcentaje (%)' }
                }
            }
        }
    });
}

// Función auxiliar para calcular el porcentaje de finalización
function calculateWeeklyCompletionRate() {
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const completionByDay = {}; // { 0: {total: 5, completed: 3}, ...}

    // Inicializar contadores
    dayNames.forEach((_, index) => {
        completionByDay[index] = { total: 0, completed: 0 };
    });

    // Filtrar tareas del mes actual
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // Mes de 1 a 12

    Object.entries(tasks).forEach(([key, taskList]) => {
        const [taskYear, taskMonth, taskDay] = key.split('-').map(Number);
        
        if (taskYear === year && taskMonth === month) {
            const date = new Date(taskYear, taskMonth - 1, taskDay);
            const dayOfWeek = date.getDay(); // 0=Domingo, 6=Sábado

            taskList.forEach(task => {
                completionByDay[dayOfWeek].total++;
                if (task.completed) {
                    completionByDay[dayOfWeek].completed++;
                }
            });
        }
    });

    // Calcular porcentajes
    const percentages = dayNames.map((_, index) => {
        const { total, completed } = completionByDay[index];
        return total > 0 ? (completed / total) * 100 : 0;
    });

    return { labels: dayNames, data: percentages };
}


/* -------------------------- NAV y SPOTIFY --------------------------- */

// ... (El código de navegación y Spotify sigue siendo el mismo) ...

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
updateCharts(); // Llamada inicial para cargar las gráficas
