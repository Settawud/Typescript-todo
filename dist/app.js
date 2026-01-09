var Priority;
(function (Priority) {
    Priority["LOW"] = "low";
    Priority["MEDIUM"] = "medium";
    Priority["HIGH"] = "high";
})(Priority || (Priority = {}));
var Status;
(function (Status) {
    Status["TODO"] = "todo";
    Status["DOING"] = "doing";
    Status["DONE"] = "done";
})(Status || (Status = {}));
class TaskManager {
    constructor() {
        this.tasks = [];
        this.loadFromStorage();
    }
    addTask(title, description, priority) {
        const newTask = {
            id: Date.now().toString(),
            title: title,
            description: description,
            priority: priority,
            status: Status.TODO,
            createdAt: new Date()
        };
        this.tasks.push(newTask);
        this.saveToStorage();
        console.log("เพิ่มงานแล้ว", newTask);
    }
    getAllTask() {
        return this.tasks;
    }
    saveToStorage() {
        localStorage.setItem('my-kanban-tasks', JSON.stringify(this.tasks));
    }
    loadFromStorage() {
        const data = localStorage.getItem('my-kanban-tasks');
        if (data) {
            this.tasks = JSON.parse(data);
        }
    }
}
const manager = new TaskManager();
manager.addTask("เขียนโค้ด", "สนุกจังเลย", Priority.HIGH);
class KanbanUI {
    constructor() {
        this.taskManager = new TaskManager();
        this.modal = document.getElementById('task-modal');
        this.init();
        this.render();
    }
    init() {
        const addBtn = document.getElementById('add-task-btn');
        addBtn === null || addBtn === void 0 ? void 0 : addBtn.addEventListener('click', () => {
            if (this.modal)
                this.modal.style.display = 'flex';
        });
        const closeBtn = document.querySelector('.close-btn');
        closeBtn === null || closeBtn === void 0 ? void 0 : closeBtn.addEventListener('click', () => {
            if (this.modal)
                this.modal.style.display = 'none';
        });
        const form = document.getElementById('task-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('task-title');
            const descInput = document.getElementById('task-desc');
            const priorityInput = document.getElementById('task-priority');
            this.taskManager.addTask(titleInput.value, descInput.value, priorityInput.value);
            if (this.modal)
                this.modal.style.display = 'none';
            form.reset();
            this.render();
        });
    }
    render() {
        console.log("Rendering tasks...", this.taskManager.getAllTask());
        const todoList = document.getElementById('todo-list');
        const doingList = document.getElementById('doing-list');
        const doneList = document.getElementById('done-list');
        if (todoList)
            todoList.innerHTML = '';
        if (doingList)
            doingList.innerHTML = '';
        if (doneList)
            doneList.innerHTML = '';
        const tasks = this.taskManager.getAllTask().forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.innerHTML = `
                <h3>${task.title}</h3>
                <p>${task.description}</p>
                <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                    <small>Priority: <b>${task.priority}</b></small>
                    <small>${new Date(task.createdAt).toLocaleDateString()}</small>
                </div>
            `;
            if (task.status === Status.TODO && todoList) {
                todoList.appendChild(card);
            }
            else if (task.status === Status.DOING && doingList) {
                doingList.appendChild(card);
            }
            else if (task.status === Status.DONE && doneList) {
                doneList.appendChild(card);
            }
        });
    }
}
new KanbanUI();
//# sourceMappingURL=app.js.map