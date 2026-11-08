# Barista Studio - Development Rules & Guidelines

## 1. Automated Git Commit Rule
- **ทุกครั้งที่ทำงานเสร็จสิ้นหรือมีการแก้ไขฟีเจอร์/โค้ด (Task Completion)**:
  - ต้องทำการทดสอบ build (`npm run build`) ให้ผ่าน 100% ปราศจาก error
  - ต้องทำการ **Git Commit** และ **Git Push** ขึ้น branch หลัก (`origin master` หรือ `origin main`) ทันทีเสมอ เพื่อให้ระบบ CI/CD ทำการ Deploy อัตโนมัติ

## 2. Mobile-First & Responsive Design Rule (บังคับสำหรับทุกหน้าจอ)
- **การออกแบบและการเขียนโค้ดทุกฟังก์ชันต้องคำนึงถึงอุปกรณ์เคลื่อนที่ (Mobile & iPad / Tablet) เป็นอันดับแรกเสมอ**:
  - **ห้ามเกิดปัญหาปุ่มตกหล่นหรือหายบนจอมือถือ**: ปุ่มการทำงานสำคัญ จะต้องมองเห็นและแตะใช้งานได้ง่ายเสมอ (Touch-friendly ขนาดไม่ต่ำกว่า 40-44px)
  - **Modal / Popups**: ส่วนหัว (Header) และปุ่มกดบันทึก/ยืนยัน (Footer Action Buttons) จะต้องเป็น Sticky หรือตรึงไว้ให้มองเห็นเสมอ แม้จะมีฟอร์มยาวหรือเปิดคีย์บอร์ดบนมือถือ
  - **No Horizontal Overflow**: ห้ามมี element ที่กว้างเกินความกว้างหน้าจอ ใช้ `truncate`, `min-w-0`, `flex-wrap` และ Tailwind responsive breakpoints อย่างรัดกุม
  - **Smooth Search & Inputs**: การพิมพ์ค้นหาหรือกรอกข้อความต้องไม่ทำให้เกิด layout shift, skeleton flash หรือ scrollbar jitter
