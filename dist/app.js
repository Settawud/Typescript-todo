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
    updateTaskStatus(id, newStatus) {
        const taskIndex = this.tasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex].status = newStatus;
            this.saveToStorage();
            console.log("อัปเดตสถานะเรียบร้อย", this.tasks[taskIndex]);
        }
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
    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveToStorage();
        console.log('ลบงานแล้ว ID:', id);
    }
}
const manager = new TaskManager();
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
        this.setupDragDrop();
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
        this.taskManager.getAllTask().forEach(task => {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.draggable = true;
            card.addEventListener('dragstart', (e) => {
                var _a;
                (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData('text/plain', task.id);
                card.classList.add('dragging');
            });
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between;">
                    <h3>${task.title}</h3>
                    <button class="delete-btn">❌</button>
                </div>
                <p>${task.description}</p>
                <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                    <small>Priority: <b>${task.priority}</b></small>
                    <small>${new Date(task.createdAt).toLocaleDateString()}</small>
                </div>
            `;
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn === null || deleteBtn === void 0 ? void 0 : deleteBtn.addEventListener('click', () => {
                if (confirm("ต้องการลบงานนี้จริงไหม?")) {
                    this.taskManager.deleteTask(task.id);
                    this.render();
                }
            });
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
    setupDragDrop() {
        const columns = document.querySelectorAll('.column');
        columns.forEach(col => {
            col.addEventListener('dragover', (e) => {
                e.preventDefault();
                col.classList.add('drag-over');
            });
            col.addEventListener('dragleave', () => {
                col.classList.remove('drag-over');
            });
            col.addEventListener('drop', (e) => {
                e.preventDefault();
                col.classList.remove('drag-over');
                const taskId = e.dataTransfer.getData('text/plain');
                const status = col.getAttribute('data-status');
                if (taskId && status) {
                    this.taskManager.updateTaskStatus(taskId, status);
                    this.render();
                }
            });
        });
    }
}
new KanbanUI();
//# sourceMappingURL=app.js.map