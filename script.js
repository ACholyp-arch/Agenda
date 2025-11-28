document.addEventListener("DOMContentLoaded", () => {
    const tasks = document.querySelectorAll(".task");
    
    tasks.forEach((task) => {
        const header = task.querySelector(".task-header");
        const details = task.querySelector(".task-details");

        // Alternar despliegue de subtareas
        header.addEventListener("click", () => {
            details.classList.toggle("open");
        });

        // Checkbox funcional
        const checkbox = header.querySelector(".task-checkbox");
        checkbox.addEventListener("click", (e) => {
            e.stopPropagation(); 
            task.classList.toggle("completed");
        });
    });
});
