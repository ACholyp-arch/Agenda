document.addEventListener("DOMContentLoaded", () => {
    const tasks = document.querySelectorAll(".task");
    
    tasks.forEach((task) => {
        const header = task.querySelector(".task-header");
        const details = task.querySelector(".task-details");

        header.addEventListener("click", () => {
            details.classList.toggle("open");
        });

        const checkbox = header.querySelector(".task-checkbox");
        checkbox.addEventListener("click", (e) => {
            e.stopPropagation(); 
            task.classList.toggle("completed");
        });
    });
});
