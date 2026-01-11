// 0 เชื่อมต่อ Supabase
declare const supabase: any;

const SUPABASE_URL = 'https://ynfaxtwmrmpomwqhzlrm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluZmF4dHdtcm1wb213cWh6bHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNTcxMTQsImV4cCI6MjA4MzYzMzExNH0.c8RmSQMGRqvpMuaTSYeXjU6zWzIEV5HRIOf3qJtgeBI';

// สร้างตัวเชื่อมต่อ database เก็บไว้ในตัวแปร db
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
    created_at: string;
}
// 4 Class TaskManager ตัวจัดการงานทั้งหมด
class TaskManager {
    private tasks: Task[] = [];

    // 1 โหลดข้อมูลจาก Cloud (Async: ต้องรอเน็ต)

    public async fetchTasks(): Promise<void> {
        // สั่ง Database: "ขอ tasks ทั้งหมด เรียงตามวันที่สร้าง"
        const { data, error } = await db.from('tasks').select('*').order('created_at', { ascending: true }); // เรียงตามเวลา
        if (error) {
            console.error('โหลดข้อมูลไม่สำเร็จ:', error);
            return;
        }

        this.tasks = data || []; // เอาของที่ได้มาใส่ตัวแปร
        console.log("โหลดงานจาก Cloud แล้ว", this.tasks);
    }

    // 2 function เพิ่มงานใหม่
    public async addTask(title: string, description: string, priority: Priority): Promise<void> {
        const { data, error } = await db.from('tasks').insert([
            {
                title:title,
                description: description,
                priority: priority,
                status: Status.TODO,
            }
        ]).select(); // สำคํญ!: สร้างเสร็จแล้วขอข้อมูลที่เพิ่งสร้างกลับมาด้วย (จะได้ ID)

        if (error) {
            console.log("เพิ่มงานไม่สำเร็จ", error);
            return;
        }

        if (data) {
            // เพิ่มลงในตัวแปร local ของเราด้วย UI จะได้เด้งทันที
            this.tasks.push(data[0]);
            console.log("Task added:", data[0]);
        }
    }

    // functionดึงงานทั้งหมด (เอาไว้ให้ UI ไปแสดงผล)
    public getAllTask(): Task[] {
        return this.tasks;
    }

    //  อัปเดตสถานะ (ลาก-วาง)
    public async updateTaskStatus(id: string, newStatus: Status): Promise<void> {
        // อัปเดตในตัวแปร local ก่อน (Trick: เพื่อให้ UI ลื่น ไม่ต้องรอ SErver ตอบกลับ)
        const task = this.tasks.find(t => t.id === id);
        if (task) task.status = newStatus;

        // ส่งไปอัปเดตที่ cloud จริงๆ (ถ้าเน็ตหลุดค่อยมา rollback ทีหลัง)
        const { error } = await db.from('tasks').update({ status: newStatus}).eq('id', id);
        if (error) {
            console.log('Error updating:', error);
            // ให้ดีถ้่าพัง return ค่าด้วย เดี๋ยวค่อยทำ
        }else {
            console.log('Status updated:', id, newStatus);
        }
    }

    // 3 ลบงาน 
    public async deleteTask(id: string): Promise<void> {
        // ลบ row ที่มี id ตรงกัน
        const { error } = await db.from('tasks').delete().eq('id', id);

        if (!error) {
            // ถ้าลบใน Cloud ผ่าน ค่อยมาลบในตัวแปร local
            this.tasks = this.tasks.filter(t => t.id !== id);
            console.log("Task deleted:", id);
        }else {
            console.log("Error deleting", error);
        }
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

    private async init(): Promise<void> {
        // 1 โหลดข้อมูลจาก Cloud
        console.log('Loading tasks from Supabase...');
        await this.taskManager.fetchTasks();
        this.render();  // โหลดเสร็จค่อยวาด

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
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // กันหน้าเว็บ refresh

            // ดึงค่าจากช่อง Input
            const titleInput = document.getElementById('task-title') as HTMLInputElement;
            const descInput = document.getElementById('task-desc') as HTMLTextAreaElement;
            const priorityInput = document.getElementById('task-priority') as HTMLSelectElement;

            // เรียกใช้ Logic เพื่อเพิ่มงานจริงๆ
            await this.taskManager.addTask(
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
                    <small>${new Date(task.created_at).toLocaleDateString()}</small>
                </div>
            `;

            // ดักจับการกดปุ่มลบ 
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn?.addEventListener('click', async () => {
                if (confirm("ต้องการลบงานนี้จริงไหม?")) {
                    await this.taskManager.deleteTask(task.id); // สั่งลบ
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
            col.addEventListener('drop', async(e: any) => {
                e.preventDefault();
                col.classList.remove('drag-over');

                //1 ดึง ID ที่แนบมา
                const taskId = e.dataTransfer.getData('text/plain');

                //2 ดูว่าตอนนี้ status อะไร (ดึงมาจาก data-status)
                const status = col.getAttribute('data-status') as Status;

                // 3 สั่ง update และวาดใหม่
                if (taskId && status) {
                    await this.taskManager.updateTaskStatus(taskId, status);
                    this.render();
                }
            });
        });
    }
}

// 7. เริ่มต้นแอพ
new KanbanUI();
