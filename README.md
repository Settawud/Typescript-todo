# 📋 TypeScript Cloud Kanban Board

Web Application สำหรับบริหารจัดการงานแบบ **Kanban Board** (To Do / Doing / Done) ที่พัฒนาด้วย **TypeScript** และเชื่อมต่อข้อมูลจริงบน Cloud ด้วย **Supabase**

![Project Preview](https://typescript-todo-fawn.vercel.app/)


---

## ✨ Features (ฟีเจอร์หลัก)

*   **⚡️ TypeScript Powered:** เขียนด้วย TypeScript 100% เน้น Type Safety และ OOP Design Pattern (Class-based)
*   **☁️ Cloud Real-time Database:** เชื่อมต่อกับ **Supabase** ทำให้ข้อมูลไม่หายเมื่อ Refresh หรือปิดหน้าเว็บ
*   **🖱️ Drag & Drop Interface:** สามารถลากย้ายงานข้าม Column ได้ลื่นไหล (Todo -> Doing -> Done)
*   **📱 Fully Responsive:** รองรับการใช้งานบนมือถือ (iPhone 15 Pro Max Ready) ด้วย UI แบบ Adaptive
*   **✏️ CRUD Operations:** สามารถ เพิ่ม (Add), แก้ไข (Edit), และ ลบ (Delete) งานได้ครบวงจร
*   **🎨 Glassmorphism & Modern UI:** ดีไซน์ทันสมัย สะอาดตา ใช้งานง่าย

---

## 🛠️ Tech Stack (เทคโนโลยีที่ใช้)

*   **Frontend:** HTML5, CSS3 (Flexbox/Grid), TypeScript
*   **Backend / Database:** Supabase (PostgreSQL)
*   **Build Tool:** TypeScript Compiler (`tsc`), Live Server

---

## 🚀 How to Run (วิธีรันโปรเจกต์)

1.  **Clone Repository**
    ```bash
    git clone https://github.com/Settawud/Typescript-todo.git
    cd Typescript-todo
    ```

2.  **Install Dependencies** (ถ้ามี)
    ```bash
    npm install
    ```

3.  **Run Application**
    *   เนื่องจากเป็น Static Web สามารถเปิดไฟล์ `index.html` หรือใช้ Live Server ได้เลย
    *   **Development Mode:**
        ```bash
        npx live-server .
        ```
    *   **Watch TypeScript:**
        ```bash
        tsc -w
        ```

---

## 📂 Project Structure

```
Typescript-todo/
├── src/
│   └── app.ts       # Logic หลักทั้งหมด (Controller, Model, View)
├── dist/
│   └── app.js       # ไฟล์ JS ที่ Compile แล้ว
├── style.css        # ไฟล์ตกแต่งหน้าตา (Responsive)
├── index.html       # โครงสร้างหน้าเว็บ
└── tsconfig.json    # การตั้งค่า TypeScript
```

---

## 👨‍💻 Developer

**Developed by:** [Best Settawud]
**Github:** [Settawud](https://github.com/Settawud)
