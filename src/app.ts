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
}

// 5 Test Logic
const manager = new TaskManager();
manager.addTask("เขียนโค้ด", "สนุกจังเลย", Priority.HIGH);

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
        addBtn?.addEventListener('click', ()=> {
            if(this.modal)this.modal.style.display = 'flex';
        });

        // จัดการปุ่มปิด Modal
        const closeBtn = document.querySelector('.close-btn');
        closeBtn?.addEventListener('click', ()=> {
            if(this.modal) this.modal.style.display = 'none';
        });

        // จัดการ "ฟอร์ม" เวลา Submit
        const form = document.getElementById('task-form') as HTMLFormElement;
        form.addEventListener('submit', (e)=> {
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
            if(this.modal) this.modal.style.display = 'none';
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
        if(todoList) todoList.innerHTML = '';
        if(doingList) doingList.innerHTML = '';
        if(doneList) doneList.innerHTML = '';

        // 3 ดึงข้อมูลทั้งหมดมาวาด
        const tasks = this.taskManager.getAllTask().forEach(task => {
            // สร้าง Element <div> เป็นการ์ด
            const card = document.createElement('div');
            card.className = 'task-card'; // ใส่ class ให้ CSS

             card.innerHTML = `
                <h3>${task.title}</h3>
                <p>${task.description}</p>
                <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                    <small>Priority: <b>${task.priority}</b></small>
                    <small>${new Date(task.createdAt).toLocaleDateString()}</small>
                </div>
            `;

            // 4 เช็ค status แล้วหยอดลงช่องที่ถูกต้อง
            if(task.status === Status.TODO && todoList) {
                todoList.appendChild(card);
            } else if (task.status === Status.DOING && doingList) {
                doingList.appendChild(card);
            } else if (task.status === Status.DONE && doneList) {
                doneList.appendChild(card);
            }
        });
        
    }
}

// 7. เริ่มต้นแอพ
new KanbanUI();
