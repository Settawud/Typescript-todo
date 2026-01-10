// 1 สร้าง Priority
enum Priority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}
// 2 สร้าง Status
enum Status {
    TODO = 'todo',
    DOING = 'doing',
    DONE = 'done',
}
// 3 Interface สำหรับ Task
interface Task {
    id: string;
    title: string;
    description: string;
    priority: Priority;
    status: Status;
    createdAt: Date;
}
// 4 Class TaskManager ตัวจัดการงานทั้งหมด
class TaskManager {
    private tasks: Task[] = []; // เก็บงานทั้งหมดไว้ในนี้

    constructor() {
        this.loadFromStorage(); //เปิดมาให้โหลดข้อมูลเก่าก่อนเลย
    }

    // function เพิ่มงานใหม่
    public addTask(title: string, description: string, priority: Priority): void {
        const newTask: Task = {
            id: Date.now().toString(), // สร้าง ID จากเวลาปัจจุบัน
            title: title,
            description: description,
            priority: priority,
            status: Status.TODO, //งานใหม่ต้องเริ่มที่ TODO
            createdAt: new Date()
        };
        this.tasks.push(newTask);  //ยัดลง Task
        this.saveToStorage(); // บันทึกทันที
        console.log("เพิ่มงานแล้ว", newTask);
    }

    // functionดึงงานทั้งหมด (เอาไว้ให้ UI ไปแสดงผล)
    public getAllTask(): Task[] {
        return this.tasks;
    }

    // function update status ของงาน (ใช้ตอนลาก-วาง)
    public updateTaskStatus(id: string, newStatus: Status): void {
        const taskIndex = this.tasks.findIndex(t => t.id === id);

        if (taskIndex !== -1) {
            this.tasks[taskIndex].status = newStatus; // เปลี่ยนสถานะ
            this.saveToStorage(); // บันทึกใหม่
            console.log("อัปเดตสถานะเรียบร้อย", this.tasks[taskIndex]);
        }
    }

    // --- ส่วนจัดการ LocalStorage (บันทึกลง Browser) ---
    private saveToStorage(): void {
        localStorage.setItem('my-kanban-tasks',
            JSON.stringify(this.tasks));
    }

    private loadFromStorage(): void {
        const data = localStorage.getItem('my-kanban-tasks');
        if (data) {
            this.tasks = JSON.parse(data);
        }
    }

    public deleteTask(id: string): void {
        this.tasks = this.tasks.filter(t => t.id !== id); // กรองเอาเฉพาะอันที่ไม่ใช่ออก
        this.saveToStorage(); // บันทึกใหม่
        console.log('ลบงานแล้ว ID:', id);
    }
}

// 5 Test Logic
const manager = new TaskManager();
// manager.addTask("เขียนโค้ด", "สนุกจังเลย", Priority.HIGH);

// 6 UI Class: ตัวเชื่อมระหว่าง Logic กับ HTML
class KanbanUI {
    private taskManager: TaskManager;
    private modal: HTMLElement | null; // กล่อง Popup

    constructor() {
        this.taskManager = new TaskManager();
        this.modal = document.getElementById('task-modal');

        this.init(); // เริ่มทำงาน
        this.render(); //วาดหน้าจอครั้งแรก
    }

    private init(): void {
        // จัดการปุ่ม "เพิ่ม Task"

        const addBtn = document.getElementById('add-task-btn');
        addBtn?.addEventListener('click', () => {
            if (this.modal) this.modal.style.display = 'flex';
        });

        // จัดการปุ่มปิด Modal
        this.setupDragDrop();
        const closeBtn = document.querySelector('.close-btn');
        closeBtn?.addEventListener('click', () => {
            if (this.modal) this.modal.style.display = 'none';
        });

        // จัดการ "ฟอร์ม" เวลา Submit
        const form = document.getElementById('task-form') as HTMLFormElement;
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // กันหน้าเว็บ refresh

            // ดึงค่าจากช่อง Input
            const titleInput = document.getElementById('task-title') as HTMLInputElement;
            const descInput = document.getElementById('task-desc') as HTMLTextAreaElement;
            const priorityInput = document.getElementById('task-priority') as HTMLSelectElement;

            // เรียกใช้ Logic เพื่อเพิ่มงานจริงๆ
            this.taskManager.addTask(
                titleInput.value,
                descInput.value,
                priorityInput.value as Priority // แปลง string เป็น Enum
            );

            // ปิด Modal และวาดหน้าจอใหม่
            if (this.modal) this.modal.style.display = 'none';
            form.reset(); //ล้างช่องกรอก
            this.render(); // สั่งวาดการ์ดใหม่
        });
    }

    // function วาดการ์ดงาน (จะมาเติมทีหลัง)
    private render(): void {
        console.log("Rendering tasks...", this.taskManager.getAllTask());

        // 1 ดึงกล่องทั้ง 3 ช่องมาเตรียมไว้
        const todoList = document.getElementById('todo-list');
        const doingList = document.getElementById('doing-list');
        const doneList = document.getElementById('done-list');

        // 2 ล้างข้อมูลเก่าทิ้งก่อน (เพื่อไม่ให้แสดงซ้ำ)
        if (todoList) todoList.innerHTML = '';
        if (doingList) doingList.innerHTML = '';
        if (doneList) doneList.innerHTML = '';

        // 3 ดึงข้อมูลทั้งหมดมาวาด
        this.taskManager.getAllTask().forEach(task => {
            // สร้าง Element <div> เป็นการ์ด
            const card = document.createElement('div');
            card.className = 'task-card'; // ใส่ class ให้ CSS

            card.draggable = true;
            card.addEventListener('dragstart', (e: DragEvent) => {
                // ส่ง ID ของงานแนบไปกับการลาก
                e.dataTransfer?.setData('text/plain', task.id);
                card.classList.add('dragging'); // 
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
                    <small>${new Date(task.createdAt).toLocaleDateString()}</small>
                </div>
            `;

            // ดักจับการกดปุ่มลบ 
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn?.addEventListener('click', () => {
                if (confirm("ต้องการลบงานนี้จริงไหม?")) {
                    this.taskManager.deleteTask(task.id); // สั่งลบ
                    this.render(); // สั่งวาดหน้าจอใหม่
                }
            });

            // 4 เช็ค status แล้วหยอดลงช่องที่ถูกต้อง
            if (task.status === Status.TODO && todoList) {
                todoList.appendChild(card);
            } else if (task.status === Status.DOING && doingList) {
                doingList.appendChild(card);
            } else if (task.status === Status.DONE && doneList) {
                doneList.appendChild(card);
            }
        });
    }

    private setupDragDrop(): void {
        const columns = document.querySelectorAll('.column');

        columns.forEach(col => {
            // 1 เมื่อลากของมาจ่อเหนือช่อง
            col.addEventListener('dragover', (e: any) => {
                e.preventDefault(); // ใส่บรรทัดนี้เพื่อให้วางได้!
                col.classList.add('drag-over'); // ใส่ Effect ไฮไลท์
            });

            // 2 เมื่อลากของหนีไป (Drag Leave)
            col.addEventListener('dragleave', () => {
                col.classList.remove('drag-over');
            });

            //3 เมื่อปล่อย drop ลงช่อง
            col.addEventListener('drop', (e: any) => {
                e.preventDefault();
                col.classList.remove('drag-over');

                //1 ดึง ID ที่แนบมา
                const taskId = e.dataTransfer.getData('text/plain');

                //2 ดูว่าตอนนี้ status อะไร (ดึงมาจาก data-status)
                const status = col.getAttribute('data-status') as Status;

                // 3 สั่ง update และวาดใหม่
                if (taskId && status) {
                    this.taskManager.updateTaskStatus(taskId, status);
                    this.render();
                }
            });
        });
    }
}

// 7. เริ่มต้นแอพ
new KanbanUI();
