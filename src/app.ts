const STORAGE_KEY = 'typescript-kanban-tasks-v1';
const LEGACY_STORAGE_KEY = 'my-kanban-tasks';

enum Priority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

enum Status {
    TODO = 'todo',
    DOING = 'doing',
    DONE = 'done',
}

interface Task {
    id: string;
    title: string;
    description: string;
    priority: Priority;
    status: Status;
    created_at: string;
}

interface TaskUpdates {
    title: string;
    description: string;
    priority: Priority;
}

const priorityLabels: Record<Priority, string> = {
    [Priority.LOW]: 'ต่ำ',
    [Priority.MEDIUM]: 'กลาง',
    [Priority.HIGH]: 'สูง',
};

const statusLabels: Record<Status, string> = {
    [Status.TODO]: 'รอทำ',
    [Status.DOING]: 'กำลังทำ',
    [Status.DONE]: 'เสร็จแล้ว',
};

function createTaskId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isPriority(value: unknown): value is Priority {
    return Object.values(Priority).includes(value as Priority);
}

function isStatus(value: unknown): value is Status {
    return Object.values(Status).includes(value as Status);
}

function normalizeTask(value: unknown): Task | null {
    if (typeof value !== 'object' || value === null) {
        return null;
    }

    const item = value as Record<string, unknown>;
    if (typeof item.title !== 'string' || !item.title.trim()) {
        return null;
    }

    const rawDate = item.created_at ?? item.createdAt;
    const parsedDate = typeof rawDate === 'string' ? new Date(rawDate) : new Date();
    const createdAt = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    return {
        id: typeof item.id === 'string' && item.id ? item.id : createTaskId(),
        title: item.title.trim(),
        description: typeof item.description === 'string' ? item.description : '',
        priority: isPriority(item.priority) ? item.priority : Priority.LOW,
        status: isStatus(item.status) ? item.status : Status.TODO,
        created_at: createdAt.toISOString(),
    };
}

class TaskManager {
    private tasks: Task[] = [];
    private lastError: string | null = null;

    constructor() {
        this.loadTasks();
    }

    public getAllTasks(): readonly Task[] {
        return this.tasks;
    }

    public getLastError(): string | null {
        return this.lastError;
    }

    public addTask(title: string, description: string, priority: Priority): boolean {
        const task: Task = {
            id: createTaskId(),
            title: title.trim(),
            description: description.trim(),
            priority,
            status: Status.TODO,
            created_at: new Date().toISOString(),
        };

        this.tasks.push(task);
        if (!this.persistTasks()) {
            this.tasks.pop();
            return false;
        }

        return true;
    }

    public updateTaskStatus(id: string, newStatus: Status): boolean {
        const task = this.tasks.find(item => item.id === id);
        if (!task || task.status === newStatus) {
            return true;
        }

        const previousStatus = task.status;
        task.status = newStatus;

        if (!this.persistTasks()) {
            task.status = previousStatus;
            return false;
        }

        return true;
    }

    public editTask(id: string, updates: TaskUpdates): boolean {
        const task = this.tasks.find(item => item.id === id);
        if (!task) {
            this.lastError = 'ไม่พบงานที่ต้องการแก้ไข';
            return false;
        }

        const previousTask = { ...task };
        task.title = updates.title.trim();
        task.description = updates.description.trim();
        task.priority = updates.priority;

        if (!this.persistTasks()) {
            Object.assign(task, previousTask);
            return false;
        }

        return true;
    }

    public deleteTask(id: string): boolean {
        const previousTasks = this.tasks;
        this.tasks = this.tasks.filter(task => task.id !== id);

        if (!this.persistTasks()) {
            this.tasks = previousTasks;
            return false;
        }

        return true;
    }

    private loadTasks(): void {
        try {
            const currentData = localStorage.getItem(STORAGE_KEY);
            const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
            const rawData = currentData ?? legacyData;

            if (!rawData) {
                return;
            }

            const parsedData: unknown = JSON.parse(rawData);
            if (!Array.isArray(parsedData)) {
                throw new Error('Stored Kanban data is not an array');
            }

            this.tasks = parsedData
                .map(normalizeTask)
                .filter((task): task is Task => task !== null)
                .sort((a, b) => a.created_at.localeCompare(b.created_at));

            if (!currentData) {
                this.persistTasks();
            }
        } catch (error) {
            console.error('Unable to load Kanban tasks:', error);
            this.lastError = 'อ่านข้อมูลงานเดิมไม่สำเร็จ แต่ยังสามารถสร้างบอร์ดใหม่ได้';
            this.tasks = [];
        }
    }

    private persistTasks(): boolean {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
            this.lastError = null;
            return true;
        } catch (error) {
            console.error('Unable to save Kanban tasks:', error);
            this.lastError = 'บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์';
            return false;
        }
    }
}

class KanbanUI {
    private readonly taskManager = new TaskManager();
    private readonly modal = this.getElement<HTMLElement>('task-modal');
    private readonly form = this.getElement<HTMLFormElement>('task-form');
    private readonly titleInput = this.getElement<HTMLInputElement>('task-title');
    private readonly descriptionInput = this.getElement<HTMLTextAreaElement>('task-desc');
    private readonly priorityInput = this.getElement<HTMLSelectElement>('task-priority');
    private readonly message = this.getElement<HTMLElement>('app-message');
    private currentEditId: string | null = null;
    private messageTimer: number | null = null;

    constructor() {
        this.setupEventListeners();
        this.setupDragDrop();
        this.render();

        const loadError = this.taskManager.getLastError();
        if (loadError) {
            this.showMessage(loadError, 'error');
        }
    }

    private getElement<T extends HTMLElement>(id: string): T {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Missing required element: #${id}`);
        }

        return element as T;
    }

    private setupEventListeners(): void {
        this.getElement<HTMLButtonElement>('add-task-btn').addEventListener('click', () => {
            this.openAddModal();
        });

        this.getElement<HTMLButtonElement>('close-modal-btn').addEventListener('click', () => {
            this.closeModal();
        });

        this.modal.addEventListener('click', event => {
            if (event.target === this.modal) {
                this.closeModal();
            }
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && this.modal.getAttribute('aria-hidden') === 'false') {
                this.closeModal();
            }
        });

        this.form.addEventListener('submit', event => {
            event.preventDefault();
            this.saveForm();
        });
    }

    private openAddModal(): void {
        this.currentEditId = null;
        this.form.reset();
        this.openModal('เพิ่มงาน');
    }

    private openEditModal(task: Task): void {
        this.currentEditId = task.id;
        this.titleInput.value = task.title;
        this.descriptionInput.value = task.description;
        this.priorityInput.value = task.priority;
        this.openModal('แก้ไขงาน');
    }

    private openModal(title: string): void {
        this.getElement<HTMLElement>('modal-title').textContent = title;
        this.modal.style.display = 'flex';
        this.modal.setAttribute('aria-hidden', 'false');
        this.titleInput.focus();
    }

    private closeModal(): void {
        this.modal.style.display = 'none';
        this.modal.setAttribute('aria-hidden', 'true');
        this.currentEditId = null;
        this.form.reset();
    }

    private saveForm(): void {
        const title = this.titleInput.value.trim();
        if (!title) {
            this.titleInput.focus();
            return;
        }

        const updates: TaskUpdates = {
            title,
            description: this.descriptionInput.value,
            priority: this.priorityInput.value as Priority,
        };

        const saved = this.currentEditId
            ? this.taskManager.editTask(this.currentEditId, updates)
            : this.taskManager.addTask(updates.title, updates.description, updates.priority);

        if (!saved) {
            this.showMessage(this.taskManager.getLastError() ?? 'บันทึกงานไม่สำเร็จ', 'error');
            return;
        }

        this.closeModal();
        this.render();
        this.showMessage('บันทึกงานเรียบร้อยแล้ว', 'success');
    }

    private formatDate(isoString: string): string {
        return new Date(isoString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    private render(): void {
        const lists: Record<Status, HTMLElement> = {
            [Status.TODO]: this.getElement<HTMLElement>('todo-list'),
            [Status.DOING]: this.getElement<HTMLElement>('doing-list'),
            [Status.DONE]: this.getElement<HTMLElement>('done-list'),
        };

        Object.values(lists).forEach(list => list.replaceChildren());

        const counts: Record<Status, number> = {
            [Status.TODO]: 0,
            [Status.DOING]: 0,
            [Status.DONE]: 0,
        };

        this.taskManager.getAllTasks().forEach(task => {
            lists[task.status].appendChild(this.createTaskCard(task));
            counts[task.status] += 1;
        });

        Object.values(Status).forEach(status => {
            this.getElement<HTMLElement>(`${status}-count`).textContent = String(counts[status]);

            if (counts[status] === 0) {
                const emptyState = document.createElement('p');
                emptyState.className = 'empty-state';
                emptyState.textContent = status === Status.TODO
                    ? 'ยังไม่มีงาน กด “เพิ่มงานใหม่” เพื่อเริ่มต้น'
                    : 'ยังไม่มีงานในสถานะนี้';
                lists[status].appendChild(emptyState);
            }
        });
    }

    private createTaskCard(task: Task): HTMLElement {
        const card = document.createElement('article');
        card.className = 'task-card';
        card.draggable = true;

        card.addEventListener('dragstart', event => {
            event.dataTransfer?.setData('text/plain', task.id);
            event.dataTransfer?.setData('application/x-kanban-task', task.id);
            card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });

        const header = document.createElement('div');
        header.className = 'task-card-header';

        const title = document.createElement('h3');
        title.textContent = task.title;
        header.appendChild(title);

        const actions = document.createElement('div');
        actions.className = 'actions';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'edit-btn';
        editButton.setAttribute('aria-label', `แก้ไขงาน ${task.title}`);
        editButton.textContent = '✏️';
        editButton.addEventListener('click', () => this.openEditModal(task));

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'delete-btn';
        deleteButton.setAttribute('aria-label', `ลบงาน ${task.title}`);
        deleteButton.textContent = '🗑️';
        deleteButton.addEventListener('click', () => {
            if (!confirm(`ต้องการลบงาน “${task.title}” ใช่ไหม?`)) {
                return;
            }

            if (!this.taskManager.deleteTask(task.id)) {
                this.showMessage(this.taskManager.getLastError() ?? 'ลบงานไม่สำเร็จ', 'error');
                return;
            }

            this.render();
            this.showMessage('ลบงานเรียบร้อยแล้ว', 'success');
        });

        actions.append(editButton, deleteButton);
        header.appendChild(actions);

        const description = document.createElement('p');
        description.className = 'task-description';
        description.textContent = task.description || 'ไม่มีรายละเอียด';

        const meta = document.createElement('div');
        meta.className = 'task-meta';

        const priority = document.createElement('span');
        priority.className = `priority-badge priority-${task.priority}`;
        priority.textContent = `ความสำคัญ${priorityLabels[task.priority]}`;

        const date = document.createElement('time');
        date.dateTime = task.created_at;
        date.textContent = this.formatDate(task.created_at);

        meta.append(priority, date);

        const statusLabel = document.createElement('label');
        statusLabel.className = 'status-control';
        statusLabel.textContent = 'สถานะ';

        const statusSelect = document.createElement('select');
        statusSelect.setAttribute('aria-label', `สถานะของงาน ${task.title}`);
        Object.values(Status).forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = statusLabels[status];
            option.selected = status === task.status;
            statusSelect.appendChild(option);
        });

        statusSelect.addEventListener('change', () => {
            const updated = this.taskManager.updateTaskStatus(task.id, statusSelect.value as Status);
            if (!updated) {
                this.showMessage(this.taskManager.getLastError() ?? 'เปลี่ยนสถานะไม่สำเร็จ', 'error');
            }
            this.render();
        });

        statusLabel.appendChild(statusSelect);
        card.append(header, description, meta, statusLabel);
        return card;
    }

    private setupDragDrop(): void {
        const columns = document.querySelectorAll<HTMLElement>('.column');

        columns.forEach(column => {
            column.addEventListener('dragover', event => {
                event.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', event => {
                if (!column.contains(event.relatedTarget as Node | null)) {
                    column.classList.remove('drag-over');
                }
            });

            column.addEventListener('drop', event => {
                event.preventDefault();
                column.classList.remove('drag-over');

                const taskId = event.dataTransfer?.getData('application/x-kanban-task')
                    || event.dataTransfer?.getData('text/plain');
                const status = column.dataset.status;

                if (!taskId || !isStatus(status)) {
                    return;
                }

                if (!this.taskManager.updateTaskStatus(taskId, status)) {
                    this.showMessage(this.taskManager.getLastError() ?? 'ย้ายงานไม่สำเร็จ', 'error');
                }
                this.render();
            });
        });
    }

    private showMessage(text: string, type: 'success' | 'error'): void {
        if (this.messageTimer !== null) {
            window.clearTimeout(this.messageTimer);
        }

        this.message.textContent = text;
        this.message.className = `app-message app-message-${type}`;
        this.message.hidden = false;

        this.messageTimer = window.setTimeout(() => {
            this.message.hidden = true;
            this.messageTimer = null;
        }, 3500);
    }
}

new KanbanUI();
