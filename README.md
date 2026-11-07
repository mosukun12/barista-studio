# BARISTA STUDIO ☕
### Personal Barista Recipe Management & Training Platform

**Barista Studio** เป็นระบบจัดการสูตรกาแฟและเครื่องดื่มส่วนตัว (Personal Knowledge Management & Training Workbench) ออกแบบสำหรับบาริสต้า เจ้าของร้านกาแฟ และผู้ฝึกฝนสาย Specialty Coffee โดยให้ความสำคัญกับความเป็นเจ้าของข้อมูล (Data Ownership) ความถูกต้องปลอดภัยของข้อมูล และการนำข้อมูลจริงไปใช้ในการฝึกฝนจำลองสถานการณ์

---

## ✦ Key Features

### 1. Recipe Management (หัวใจหลักของระบบ)
- **Recipe Editor แบ่ง 6 Section ตามมาตรฐานบาริสต้า:**
  - **Section A: General Information** — ชื่อไทย, ชื่ออังกฤษ, รูปภาพหน้าปก, หมวดหมู่, แท็ก, สถานะสูตร
  - **Section B: Serving & Container** — ขนาดแก้ว (12oz, 16oz, 22oz), ประเภทเครื่องดื่ม (ร้อน, เย็น, ปั่น), แก้ว/ฝา/หลอด
  - **Section C: Ingredients & Measurements** — บันทึกส่วนผสม ปริมาณ หน่วยวัด (ml, oz, g, pump, scoop, shot) โน้ตเฉพาะตัว
  - **Section D: Preparation Steps** — ขั้นตอนการชงแบบละเอียด จับเวลา (Extraction seconds), อุปกรณ์, รูปภาพขั้นตอน, จัดเรียงลำดับ
  - **Section E: Techniques & Notes** — โน้ตเทคนิคเฉพาะ (Tip, ข้อควรระวัง, จุดมักผิดพลาด, การปรับรสหวาน/เปรี้ยว, สิ่งที่ห้ามทำ)
  - **Section F: Variations** — จัดการสูตรย่อย (เช่น หวาน 50%, Extra Shot, นมพืช) โดยไม่ต้องสร้างสูตรใหม่ทั้งหมด
  - **Section G: Version History** — บันทึก Snapshot ทุกครั้งที่มีการแก้ไข สามารถดูย้อนหลังและกู้คืน (Restore) สู่เวอร์ชันใหม่โดยไม่ลบประวัติเดิม
- **Autosave Engine:** บันทึกอัตโนมัติแบบ Debounce (1.5s) พร้อมสถานะชัดเจน (`Saving...`, `Saved`, `Save Failed`)
- **Card View & List View:** สลับมุมมองการแสดงผล ค้นหา กรองตามสถานะ/หมวดหมู่/ประเภทเครื่องดื่ม และจัดเรียงข้อมูล

### 2. Ingredient Management (คลังวัตถุดิบ)
- จัดการวัตถุดิบแยกจากสูตร เชื่อมโยงด้วย `ingredient_id`
- มีระบบตรวจสอบการใช้งาน (**Dependency Usage Check**) แจ้งเตือนและป้องกันการลบวัตถุดิบที่กำลังถูกใช้งานอยู่ในสูตร

### 3. Training Guide (คู่มือบาริสต้า)
- จัดเก็บคู่มือการ Dial-in กาแฟ, การสตรีมนม, การทำความสะอาดเครื่องชง, และเกณฑ์การประเมิน Perfect Shot

### 4. Practice Mode (ระบบฝึกจำสูตร)
- ดึงคำถามจากสูตรที่มีสถานะ **`Verified`** เท่านั้น
- ทดสอบความจำส่วนผสม สัดส่วน และลำดับขั้นตอน พร้อมจับเวลาและสรุปผลคะแนน

### 5. Barista Simulator (เกมจำลองสถานการณ์)
- สุ่มออร์เดอร์ลูกค้าจากคลังสูตรที่ยืนยันแล้ว
- ผู้ใช้ต้องเลือกขนาดแก้ว ชนิดเครื่องดื่ม และตรวจสอบความถูกต้องตามสูตรจริง

### 6. Settings & Data Backup
- ส่งออกไฟล์สำรองทั้งระบบเป็น JSON (`Export Complete Backup`)
- กู้คืนข้อมูลจากไฟล์ JSON (`Import JSON Backup`)
- สลับธีม **Warm Café Light** และ **Espresso Roast Dark**

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v6
- **Backend & Database:** Supabase (PostgreSQL with Row Level Security, Supabase Auth, Storage)
- **Deployment:** Vercel-ready

---

## 🚀 Getting Started

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รันโหมด Development
```bash
npm run dev
```
เปิดบราวเซอร์ที่ `http://localhost:3000`

### 3. การเชื่อมต่อ Supabase Cloud (สำหรับ Production)
1. สร้างโปรเจกต์ใหม่บน [Supabase Dashboard](https://supabase.com)
2. คัดลอก Project URL และ Anon Key มาใส่ในไฟล์ `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
3. ไปที่ **Supabase Dashboard > SQL Editor** แล้วนำเนื้อหาในไฟล์ `supabase/migrations/001_initial_schema.sql` ไปวางแล้วกด **Run**
4. ระบบจะเชื่อมต่อกับ Cloud Database อัตโนมัติ พร้อมสิทธิ์ Row Level Security (RLS)

> **หมายเหตุ:** หากยังไม่ได้ใส่คีย์ Supabase ระบบจะทำงานในโหมด **Local Storage Mode** อัตโนมัติ ทำให้สามารถทดสอบ เพิ่มสูตร และใช้งานทุกฟังก์ชันได้ทันที

---

## 📦 Deployment on Vercel

1. Push โค้ดขึ้น GitHub Repository
2. Import โปรเจกต์ใน Vercel
3. ตั้งค่า Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
4. สั่ง Deploy
