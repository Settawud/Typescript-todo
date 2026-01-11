const SUPABASE_URL = 'https://ynfaxtwmrmpomwqhzlrm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluZmF4dHdtcm1wb213cWh6bHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNTcxMTQsImV4cCI6MjA4MzYzMzExNH0.c8RmSQMGRqvpMuaTSYeXjU6zWzIEV5HRIOf3qJtgeBI';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
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
    }
    async fetchTasks() {
        const { data, error } = await db.from('tasks').select('*').order('created_at', { ascending: true });
        if (error) {
            console.error('โหลดข้อมูลไม่สำเร็จ:', error);
            return;
        }
        this.tasks = data || [];
        console.log("โหลดงานจาก Cloud แล้ว", this.tasks);
    }
    async addTask(title, description, priority) {
        const { data, error } = await db.from('tasks').insert([
            {
                title: title,
                description: description,
                priority: priority,
                status: Status.TODO,
            }
        ]).select();
        if (error) {
            console.log("เพิ่มงานไม่สำเร็จ", error);
            return;
        }
        if (data) {
            this.tasks.push(data[0]);
            console.log("Task added:", data[0]);
        }
    }
    getAllTask() {
        return this.tasks;
    }
    async updateTaskStatus(id, newStatus) {
        const task = this.tasks.find(t => t.id === id);
        if (task)
            task.status = newStatus;
        const { error } = await db.from('tasks').update({ status: newStatus }).eq('id', id);
        if (error) {
            console.log('Error updating:', error);
        }
        else {
            console.log('Status updated:', id, newStatus);
        }
    }
    async deleteTask(id) {
        const { error } = await db.from('tasks').delete().eq('id', id);
        if (!error) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            console.log("Task deleted:", id);
        }
        else {
            console.log("Error deleting", error);
        }
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
    async init() {
        console.log('Loading tasks from Supabase...');
        await this.taskManager.fetchTasks();
        this.render();
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
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('task-title');
            const descInput = document.getElementById('task-desc');
            const priorityInput = document.getElementById('task-priority');
            await this.taskManager.addTask(titleInput.value, descInput.value, priorityInput.value);
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
                    <small>
                        Priority: 
                        <span class="priority-badge priority-${task.priority}">
                            ${task.priority}
                        </span>
                    </small>
                    <small>${new Date(task.created_at).toLocaleDateString()}</small>
                </div>
            `;
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn === null || deleteBtn === void 0 ? void 0 : deleteBtn.addEventListener('click', async () => {
                if (confirm("ต้องการลบงานนี้จริงไหม?")) {
                    await this.taskManager.deleteTask(task.id);
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
            col.addEventListener('drop', async (e) => {
                e.preventDefault();
                col.classList.remove('drag-over');
                const taskId = e.dataTransfer.getData('text/plain');
                const status = col.getAttribute('data-status');
                if (taskId && status) {
                    await this.taskManager.updateTaskStatus(taskId, status);
                    this.render();
                }
            });
        });
    }
}
new KanbanUI();
//# sourceMappingURL=app.js.map