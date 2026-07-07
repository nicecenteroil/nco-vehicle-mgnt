# คู่มือย้ายระบบขึ้น car.nicecenter.co.th

สถาปัตยกรรมใหม่: หน้าเว็บ (โฟลเดอร์ `web/`) โฮสต์บนเซิร์ฟเวอร์ของเราเอง → เรียกข้อมูลผ่าน API ไปที่ Google Apps Script → Google Sheets เหมือนเดิม ล็อกอินด้วย PIN แทนบัญชี Google

## ขั้นที่ 1 — ฝั่ง Google Apps Script

1. เปิด Apps Script editor แล้ววางโค้ด `Code.gs` เวอร์ชันใหม่ทับของเดิม (ไฟล์ `index.html` ใน GAS ไม่ต้องใช้แล้ว จะลบหรือเก็บไว้ก็ได้)
2. รีเฟรช Google Sheet → เมนู **🚗 ระบบจัดการรถ → 👤 สร้างชีตผู้ใช้งาน + PIN (Users)**
3. ในชีต `Users` ใส่รายชื่อพนักงาน:
   - **ชื่อผู้ใช้** — ชื่อที่จะแสดงในระบบและบันทึกว่าใครแก้ข้อมูล
   - **PIN (6 หลัก)** — ห้ามซ้ำกันเด็ดขาด (ระบบใช้ PIN ระบุตัวคน)
   - **สถานะ** — `เปิดใช้งาน` / `ปิดใช้งาน` (ปิดปุ๊บโดนเตะออกจากระบบทันที)
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** ← สำคัญ! ต้องเป็น "ทุกคน" ไม่ใช่ "Anyone with Google account"
5. คัดลอกลิงก์ **/exec** เก็บไว้

> เปลี่ยนโค้ดครั้งถัดไป ให้ Deploy → Manage deployments → แก้ deployment เดิม (ลิงก์ /exec จะได้ไม่เปลี่ยน)

## ขั้นที่ 2 — ฝั่งเว็บ (โฮสต์ของเรา)

1. เปิด `web/index.html` หาบรรทัด (อยู่ช่วงบนของ `<script>` แรก):
   ```js
   var API_URL = 'PASTE_GAS_EXEC_URL_HERE';
   ```
   วางลิงก์ /exec จากขั้นที่ 1 แทน
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์ `web/` ขึ้น root ของ car.nicecenter.co.th:
   - `index.html`
   - `favicon.png`, `apple-touch-icon.png`, `app-icon-192.png`, `app-icon-512.png`
   - `manifest.webmanifest`
3. ตั้ง DNS ให้ `car.nicecenter.co.th` ชี้ไปที่โฮสต์ และเปิด **HTTPS** (จำเป็น — PWA และ Add to Home Screen ต้องใช้ https)

## ขั้นที่ 3 — ทดสอบ

1. เปิด https://car.nicecenter.co.th → เจอหน้าใส่ PIN → ใส่ PIN ตัวเอง → เข้าแอปได้
2. เพิ่มงานซ่อม 1 รายการ → เช็คในชีต Maintenance ว่าคอลัมน์ "ผู้บันทึก" เป็นชื่อจากชีต Users
3. iPhone: เปิดใน Safari → ปุ่ม Share → **Add to Home Screen** → ได้ไอคอนโลโก้ส้ม เปิดแล้วเต็มจอไม่มีแถบ Safari

## เรื่องที่ควรรู้

- **ลิงก์ GAS เดิม** — ใครเปิดลิงก์ /exec เดิมจะถูก redirect มาที่ car.nicecenter.co.th อัตโนมัติ
- **อายุล็อกอิน** — ใส่ PIN ครั้งเดียวอยู่ได้ 90 วันต่อเครื่อง (แก้ได้ที่ `CONFIG.TOKEN_DAYS`)
- **ออกจากระบบ** — แตะวงกลมชื่อมุมขวาบน
- **กันเดา PIN** — ใส่ผิดครบ 8 ครั้ง ระบบล็อก 10 นาที
- **ความปลอดภัย** — API เปิด public แต่ทุกคำสั่ง (ยกเว้น login) ต้องมี token ที่ได้จาก PIN เท่านั้น
- **พนักงานลาออก** — เปลี่ยนสถานะเป็น `ปิดใช้งาน` ในชีต Users พอ ไม่ต้องลบแถว
