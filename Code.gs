/**
 * ============================================================
 *  ระบบจัดการรถ - หจก. ไนซ์เซ็นเตอร์ออยล์
 *  Vehicle Management System (Vehicles + Maintenance + Insurance/พรบ + LINE Alerts)
 * ------------------------------------------------------------
 *  วิธีติดตั้ง: ดูไฟล์ SETUP.md
 * ============================================================
 */

// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------
var CONFIG = {
  SHEET_VEHICLES: 'Vehicles',
  SHEET_MAINTENANCE: 'Maintenance',
  SHEET_SETTINGS: 'Settings',
  SHEET_DASHBOARD: 'Dashboard',
  SHEET_USERS: 'Users',
  WEB_APP_URL: 'https://car.nicecenter.co.th', // หน้าเว็บจริง (doGet จะ redirect ไปที่นี่)
  TOKEN_DAYS: 90, // อายุ token ล็อกอิน (วัน)
  DRIVE_ROOT_FOLDER: 'ระบบจัดการรถ - เอกสารแนบ',
  ALERT_THRESHOLDS: [30, 15, 7, 3, 1, 0], // วันล่วงหน้าที่จะแจ้งเตือน (0 = วันหมดอายุ, ค่าติดลบ = เลยกำหนดจะแจ้งทุกวัน)
  VEHICLE_TYPES: ['รถขนส่ง', 'รถพนักงานขาย (DSR)', 'รถส่วนตัวเจ้าของ'],
  INSURANCE_TYPES: ['ชั้น 1', 'ชั้น 2+', 'ชั้น 2', 'ชั้น 3+', 'ชั้น 3', 'ไม่มี/ยังไม่ทำ'],
  STATUS_OPTIONS: ['ใช้งานปกติ', 'ซ่อมบำรุง', 'จอดไม่ใช้งาน', 'ขายแล้ว/ปลดระวาง'],
  MAINTENANCE_TYPES: ['เช็คระยะ/PM', 'ซ่อมทั่วไป', 'เปลี่ยนยาง', 'เปลี่ยนน้ำมันเครื่อง', 'ซ่อมเครื่องยนต์', 'ซ่อมตัวถัง/สี', 'แบตเตอรี่', 'อื่นๆ']
};

var VEHICLE_HEADERS = [
  'ID', 'ประเภทรถ', 'ทะเบียนรถ', 'จังหวัดทะเบียน', 'ยี่ห้อ', 'รุ่น', 'ปี (พ.ศ.)', 'สี',
  'เลขตัวถัง', 'เลขเครื่องยนต์', 'ผู้ใช้งาน/คนขับหลัก', 'แผนก/สาขา',
  'วันที่ พรบ. หมดอายุ', 'บริษัทประกันภัย', 'ประเภทประกัน', 'เลขกรมธรรม์', 'วันประกันหมดอายุ',
  'วันภาษี/ทะเบียนหมดอายุ', 'เลขไมล์ล่าสุด', 'วันที่บันทึกไมล์', 'สถานะรถ',
  'ลิงก์เอกสารแนบ', 'หมายเหตุ', 'แจ้งเตือนล่าสุดเมื่อ', 'อัปเดตล่าสุดโดย', 'อัปเดตล่าสุดเมื่อ'
];

var MAINTENANCE_HEADERS = [
  'ID', 'วันที่บันทึก', 'ทะเบียนรถ', 'ประเภทงาน', 'รายละเอียด', 'เลขไมล์ ณ วันที่ทำ',
  'ค่าใช้จ่าย (บาท)', 'ร้าน/อู่/ศูนย์บริการ', 'รอบถัดไป (วันที่)', 'รอบถัดไป (ไมล์)',
  'ไฟล์แนบ/ใบเสร็จ', 'ผู้บันทึก', 'หมายเหตุ'
];

// ------------------------------------------------------------
// ข้อมูลรถชุดเดิม (ย้ายมาจาก "Vehicle Management รถ.xlsx" — ชีต Summary Trans / รถขนส่ง รถเซลล์ / 9.Accord 2869 / 10.Almera 3608 / 16.Accord ทอง)
// รันเมนู "📥 นำเข้าข้อมูลรถ+ประวัติซ่อมชุดเดิม (ครั้งเดียว)" เพื่อนำเข้า
// หมายเหตุ: ข้อมูลบางคันในไฟล์เดิมไม่ครบ/ไม่ตรงกันระหว่างชีต ได้ระบุไว้ในช่อง "หมายเหตุ" ของแต่ละคัน กรุณาตรวจสอบและแก้ไขในเว็บแอปหลังนำเข้า
// ------------------------------------------------------------
var SEED_VEHICLES = [
  { 'ประเภทรถ': 'รถขนส่ง', 'ทะเบียนรถ': '4869', 'ยี่ห้อ': 'Isuzu', 'รุ่น': 'NLR85', 'ปี (พ.ศ.)': 2560,
    'บริษัทประกันภัย': 'วิริยะ', 'วันที่ พรบ. หมดอายุ': new Date(2027, 0, 4), 'วันประกันหมดอายุ': new Date(2027, 2, 27), 'วันภาษี/ทะเบียนหมดอายุ': new Date(2027, 0, 4),
    'ผู้ใช้งาน/คนขับหลัก': 'หจก.ไนซ์เซ็นเตอร์ออยล์', 'แผนก/สาขา': 'ฝ่ายขนส่ง',
    'หมายเหตุ': 'เครื่องยนต์ 3000cc, กรองน้ำมัน FO-249 กรองกระดาษยาว, ยาง ML 225/75 R14, กรองโซล่า FULL 1-FIS443 | ทะเบียนที่บันทึกไว้เป็นเลขท้ายเท่านั้น กรุณาตรวจสอบเลขทะเบียนเต็ม' },

  { 'ประเภทรถ': 'รถขนส่ง', 'ทะเบียนรถ': '7218', 'ยี่ห้อ': 'Isuzu', 'รุ่น': '',
    'บริษัทประกันภัย': 'IN-SURE', 'วันที่ พรบ. หมดอายุ': new Date(2027, 4, 2), 'วันประกันหมดอายุ': new Date(2027, 4, 2), 'วันภาษี/ทะเบียนหมดอายุ': new Date(2027, 4, 2),
    'ผู้ใช้งาน/คนขับหลัก': 'หจก.ไนซ์เซ็นเตอร์ออยล์', 'แผนก/สาขา': 'ฝ่ายขนส่ง',
    'หมายเหตุ': 'เครื่องยนต์ 3000cc, กรองน้ำมัน FTO-153, พรบ.เดิมระบุบริษัท "วิริยะ" | ทะเบียนที่บันทึกไว้เป็นเลขท้ายเท่านั้น กรุณาตรวจสอบเลขทะเบียนเต็ม' },

  { 'ประเภทรถ': 'รถขนส่ง', 'ทะเบียนรถ': '7711', 'ยี่ห้อ': 'Isuzu', 'รุ่น': 'NLR85', 'ปี (พ.ศ.)': 2553,
    'บริษัทประกันภัย': 'วิริยะ', 'วันที่ พรบ. หมดอายุ': new Date(2027, 0, 11), 'วันประกันหมดอายุ': new Date(2027, 2, 31), 'วันภาษี/ทะเบียนหมดอายุ': new Date(2027, 0, 11),
    'ผู้ใช้งาน/คนขับหลัก': 'หจก.ไนซ์เซ็นเตอร์ออยล์', 'แผนก/สาขา': 'ฝ่ายขนส่ง',
    'หมายเหตุ': 'กรองน้ำมัน FO-249 กรองกระดาษยาว, ยาง ML 225/75 R15, พรบ.เดิมระบุบริษัท "IN-SURE" | ทะเบียนที่บันทึกไว้เป็นเลขท้ายเท่านั้น กรุณาตรวจสอบเลขทะเบียนเต็ม' },

  { 'ประเภทรถ': 'รถขนส่ง', 'ทะเบียนรถ': '3595', 'ยี่ห้อ': 'Toyota', 'รุ่น': 'Hilux', 'ปี (พ.ศ.)': 2553,
    'วันที่ พรบ. หมดอายุ': new Date(2027, 3, 20), 'วันประกันหมดอายุ': new Date(2027, 3, 22), 'วันภาษี/ทะเบียนหมดอายุ': new Date(2027, 3, 20),
    'ผู้ใช้งาน/คนขับหลัก': 'หจก.ไนซ์เซ็นเตอร์ออยล์', 'แผนก/สาขา': 'ฝ่ายขนส่ง',
    'หมายเหตุ': 'เครื่องยนต์ 2700cc, ยาง 205/70 R15, กรองน้ำมัน FMO-234, ติดแก๊ส LPG ต้องตรวจสภาพถัง (ตรอ.ต่อ 19/4/2027) | ทะเบียนที่บันทึกไว้เป็นเลขท้ายเท่านั้น กรุณาตรวจสอบเลขทะเบียนเต็ม' },

  { 'ประเภทรถ': 'รถขนส่ง', 'ทะเบียนรถ': '2687', 'ยี่ห้อ': '', 'รุ่น': '',
    'ผู้ใช้งาน/คนขับหลัก': 'หจก.ไนซ์เซ็นเตอร์ออยล์', 'แผนก/สาขา': 'ฝ่ายขนส่ง',
    'หมายเหตุ': '⚠️ ไฟล์เดิมมีข้อมูลคันนี้น้อยมาก ไม่มียี่ห้อ/รุ่น/พรบ./ประกัน กรุณากรอกข้อมูลเพิ่มเติม | ทะเบียนที่บันทึกไว้เป็นเลขท้ายเท่านั้น' },

  { 'ประเภทรถ': 'รถขนส่ง', 'ทะเบียนรถ': '3720', 'ยี่ห้อ': 'Toyota', 'รุ่น': 'Hilux', 'ปี (พ.ศ.)': 2552,
    'วันภาษี/ทะเบียนหมดอายุ': new Date(2024, 0, 18),
    'ผู้ใช้งาน/คนขับหลัก': 'อำนาจ / หจก.ไนซ์เซ็นเตอร์ออยล์', 'แผนก/สาขา': 'ฝ่ายขนส่ง',
    'หมายเหตุ': '⚠️ วันภาษีที่บันทึกไว้เก่ามาก (18/1/2024) ข้อมูลอาจไม่อัปเดต กรุณาตรวจสอบวันต่อภาษีล่าสุดจริง, เครื่องยนต์ 2700cc, ยาง 205/70 R15 | ทะเบียนที่บันทึกไว้เป็นเลขท้ายเท่านั้น' },

  { 'ประเภทรถ': 'รถพนักงานขาย (DSR)', 'ทะเบียนรถ': 'กบ 3608', 'ยี่ห้อ': 'Nissan', 'รุ่น': 'Almera', 'ปี (พ.ศ.)': 2556,
    'บริษัทประกันภัย': 'IN-SURE', 'วันที่ พรบ. หมดอายุ': new Date(2027, 4, 1), 'วันประกันหมดอายุ': new Date(2027, 4, 1), 'วันภาษี/ทะเบียนหมดอายุ': new Date(2027, 4, 14),
    'ผู้ใช้งาน/คนขับหลัก': 'มัดหมี่', 'แผนก/สาขา': 'DSR',
    'หมายเหตุ': '⚠️ พบเลขทะเบียนอีกแบบ "สห 3608" ในเอกสารเดิมอีกชีตหนึ่ง และคนขับอีกชีตระบุเป็น "นา" กรุณายืนยันทะเบียน/คนขับที่ถูกต้อง | พรบ.บริษัท Falcon, เครื่องยนต์ 1200cc, น้ำมันเครื่อง Ide เก๋ง (เปลี่ยน 3/12/2024), น้ำมันเกียร์ ATF 3L(CT) (เปลี่ยน 3/12/2024)' },

  { 'ประเภทรถ': 'รถพนักงานขาย (DSR)', 'ทะเบียนรถ': 'กร 8273', 'ยี่ห้อ': 'Toyota', 'รุ่น': 'Corolla Altis', 'ปี (พ.ศ.)': 2552,
    'เลขเครื่องยนต์': 'MR053ZEE106154519',
    'บริษัทประกันภัย': 'เทเวศ', 'วันที่ พรบ. หมดอายุ': new Date(2026, 7, 26), 'วันประกันหมดอายุ': new Date(2026, 8, 17), 'วันภาษี/ทะเบียนหมดอายุ': new Date(2026, 7, 26),
    'ผู้ใช้งาน/คนขับหลัก': 'นุช', 'แผนก/สาขา': 'DSR',
    'หมายเหตุ': 'เครื่องยนต์ 1600cc, น้ำมันเครื่อง Ide เก๋ง (เปลี่ยน 3/12/2024), น้ำมันเกียร์ ATF III 4L(CT) (เปลี่ยน 3/12/2024)' },

  { 'ประเภทรถ': 'รถพนักงานขาย (DSR)', 'ทะเบียนรถ': 'กธ 5550', 'ยี่ห้อ': 'Honda', 'รุ่น': 'Accord',
    'บริษัทประกันภัย': 'วิริยะ', 'วันที่ พรบ. หมดอายุ': new Date(2027, 2, 23), 'วันประกันหมดอายุ': new Date(2027, 2, 23), 'วันภาษี/ทะเบียนหมดอายุ': new Date(2027, 2, 25),
    'ผู้ใช้งาน/คนขับหลัก': 'กร', 'แผนก/สาขา': 'DSR',
    'หมายเหตุ': '⚠️ เอกสารอีกชีตระบุคนขับคันนี้เป็น "วรรณ" กรุณายืนยันคนขับปัจจุบัน | พรบ.บริษัท iCare, เครื่องยนต์ 2400cc, กรองน้ำมัน FTO-159' },

  { 'ประเภทรถ': 'รถพนักงานขาย (DSR)', 'ทะเบียนรถ': '7187', 'ยี่ห้อ': 'Toyota', 'รุ่น': 'Avanza',
    'วันที่ พรบ. หมดอายุ': new Date(2027, 1, 21), 'วันภาษี/ทะเบียนหมดอายุ': new Date(2027, 1, 21),
    'ผู้ใช้งาน/คนขับหลัก': 'นุช', 'แผนก/สาขา': 'DSR',
    'หมายเหตุ': '⚠️ อ้างอิงคนขับจากอีกชีตหนึ่ง (ไม่ได้ระบุในชีตหลัก) กรุณายืนยัน | พรบ.บริษัท Falcon, เครื่องยนต์ 1300cc, น้ำมันเครื่อง Ide เก๋ง (เปลี่ยน 3/12/2024), น้ำมันเกียร์ ATF 3L(CT) (เปลี่ยน 3/12/2024) | ทะเบียนที่บันทึกไว้เป็นเลขท้ายเท่านั้น กรุณาตรวจสอบเลขทะเบียนเต็ม' },

  { 'ประเภทรถ': 'รถพนักงานขาย (DSR)', 'ทะเบียนรถ': 'กฉ 9380', 'ยี่ห้อ': '', 'รุ่น': '',
    'ผู้ใช้งาน/คนขับหลัก': 'นิด', 'แผนก/สาขา': 'DSR',
    'หมายเหตุ': '⚠️ พบเฉพาะในชีตรายชื่อคนขับของไฟล์เดิม ไม่มีรายละเอียดยี่ห้อ/รุ่น/พรบ./ประกัน กรุณากรอกข้อมูลเพิ่มเติม' },

  { 'ประเภทรถ': 'รถส่วนตัวเจ้าของ', 'ทะเบียนรถ': 'กย 2869', 'ยี่ห้อ': 'Honda', 'รุ่น': 'Accord G7', 'ปี (พ.ศ.)': 2549,
    'บริษัทประกันภัย': 'วิริยะ', 'วันที่ พรบ. หมดอายุ': new Date(2026, 10, 3), 'วันประกันหมดอายุ': new Date(2027, 3, 11), 'วันภาษี/ทะเบียนหมดอายุ': new Date(2027, 6, 20),
    'ผู้ใช้งาน/คนขับหลัก': 'ณัสวรรณ', 'แผนก/สาขา': 'ส่วนตัวเจ้าของ',
    'หมายเหตุ': 'พรบ.บริษัท IN-SURE, เครื่องยนต์ 2000cc | ประวัติซ่อมสะสมจากไฟล์เดิม 18 ครั้ง รวม 73,295 บาท (นำเข้าประวัติซ่อมละเอียดให้แล้วในแท็บ Maintenance), ยาง 205/60 R16 92V BF Goodrich ปี23 (เปลี่ยน 26/8/2024), แบตเตอรี่ B24L 45แอมป์ 300CCA GS MFX-60L (เปลี่ยน 1/5/2024)' },

  { 'ประเภทรถ': 'รถส่วนตัวเจ้าของ', 'ทะเบียนรถ': 'กร 2079', 'ยี่ห้อ': 'Mazda', 'รุ่น': '2 Elegance (สีขาว)',
    'บริษัทประกันภัย': 'iCare', 'วันที่ พรบ. หมดอายุ': new Date(2027, 3, 11), 'วันประกันหมดอายุ': new Date(2027, 3, 11), 'วันภาษี/ทะเบียนหมดอายุ': new Date(2027, 3, 11),
    'ผู้ใช้งาน/คนขับหลัก': 'ชนิกานต์', 'แผนก/สาขา': 'ส่วนตัวเจ้าของ',
    'หมายเหตุ': 'ตรอ.ต่อแล้วปี 2025, ยาง 195/60 R15 88H (เปลี่ยน 23/5/2024)' },

  { 'ประเภทรถ': 'รถส่วนตัวเจ้าของ', 'ทะเบียนรถ': 'กว 3532', 'ยี่ห้อ': 'Toyota', 'รุ่น': 'Camry',
    'บริษัทประกันภัย': 'TSI', 'วันที่ พรบ. หมดอายุ': new Date(2027, 3, 3), 'วันประกันหมดอายุ': new Date(2026, 6, 24), 'วันภาษี/ทะเบียนหมดอายุ': new Date(2027, 3, 3),
    'ผู้ใช้งาน/คนขับหลัก': 'ชนิกานต์', 'แผนก/สาขา': 'ส่วนตัวเจ้าของ',
    'หมายเหตุ': 'พรบ.บริษัท Falcon' },

  { 'ประเภทรถ': 'รถส่วนตัวเจ้าของ', 'ทะเบียนรถ': 'กฉ 7706', 'ยี่ห้อ': 'Honda', 'รุ่น': 'Accord',
    'บริษัทประกันภัย': 'TSI', 'วันที่ พรบ. หมดอายุ': new Date(2027, 4, 13), 'วันประกันหมดอายุ': new Date(2026, 5, 17),
    'ผู้ใช้งาน/คนขับหลัก': '', 'แผนก/สาขา': 'ส่วนตัวเจ้าของ',
    'หมายเหตุ': '⚠️ ไม่มีข้อมูลวันภาษี/ทะเบียนหมดอายุ และผู้ใช้งานในไฟล์เดิม กรุณาเพิ่มข้อมูล' },

  { 'ประเภทรถ': 'รถส่วนตัวเจ้าของ', 'ทะเบียนรถ': 'กษ 157', 'ยี่ห้อ': 'Mazda', 'รุ่น': '2 Elegance (สีดำ)', 'ปี (พ.ศ.)': 2555,
    'วันที่ พรบ. หมดอายุ': new Date(2026, 11, 23), 'วันประกันหมดอายุ': new Date(2026, 9, 27), 'วันภาษี/ทะเบียนหมดอายุ': new Date(2026, 11, 23),
    'ผู้ใช้งาน/คนขับหลัก': 'ชนิกานต์', 'แผนก/สาขา': 'ส่วนตัวเจ้าของ',
    'หมายเหตุ': 'ตรอ.ต่อแล้วปี 2024, เครื่องยนต์ 1500cc, ยาง 195/60 R15 88H (เปลี่ยน 23/5/2024)' },

  { 'ประเภทรถ': 'รถส่วนตัวเจ้าของ', 'ทะเบียนรถ': 'กร 6444', 'ยี่ห้อ': 'BMW', 'รุ่น': 'X3 xDrive20d M Sport', 'ปี (พ.ศ.)': 2563,
    'บริษัทประกันภัย': 'ทิพยะ', 'วันที่ พรบ. หมดอายุ': new Date(2026, 8, 12), 'วันประกันหมดอายุ': new Date(2026, 10, 30), 'วันภาษี/ทะเบียนหมดอายุ': new Date(2027, 0, 18),
    'ผู้ใช้งาน/คนขับหลัก': 'ณัฐพร', 'แผนก/สาขา': 'ส่วนตัวเจ้าของ',
    'หมายเหตุ': 'เครื่องยนต์ 1995cc' },

  { 'ประเภทรถ': 'รถส่วนตัวเจ้าของ', 'ทะเบียนรถ': 'กน 5890', 'ยี่ห้อ': 'Isuzu', 'รุ่น': 'D-max', 'ปี (พ.ศ.)': 2549,
    'บริษัทประกันภัย': 'IN-SURE', 'วันที่ พรบ. หมดอายุ': new Date(2027, 2, 3), 'วันประกันหมดอายุ': new Date(2027, 2, 29), 'วันภาษี/ทะเบียนหมดอายุ': new Date(2027, 1, 14),
    'ผู้ใช้งาน/คนขับหลัก': 'ชนิกานต์', 'แผนก/สาขา': 'ส่วนตัวเจ้าของ',
    'หมายเหตุ': 'เครื่องยนต์ 3000cc' },

  { 'ประเภทรถ': 'รถส่วนตัวเจ้าของ', 'ทะเบียนรถ': 'ผก 6302', 'ยี่ห้อ': 'Toyota', 'รุ่น': 'รถตู้',
    'บริษัทประกันภัย': 'AXA', 'วันที่ พรบ. หมดอายุ': new Date(2027, 3, 11), 'วันภาษี/ทะเบียนหมดอายุ': new Date(2026, 8, 5),
    'ผู้ใช้งาน/คนขับหลัก': 'ชนิกานต์', 'แผนก/สาขา': 'ส่วนตัวเจ้าของ',
    'หมายเหตุ': 'เครื่องยนต์ 3000cc, ไม่มีข้อมูลบริษัทประกันภัยรถยนต์ (มีเฉพาะพรบ.)' },

  { 'ประเภทรถ': 'รถส่วนตัวเจ้าของ', 'ทะเบียนรถ': 'กท 6313', 'ยี่ห้อ': 'Honda', 'รุ่น': 'Accord',
    'บริษัทประกันภัย': 'IN-SURE', 'วันที่ พรบ. หมดอายุ': new Date(2026, 0, 11), 'วันภาษี/ทะเบียนหมดอายุ': new Date(2025, 11, 4),
    'ผู้ใช้งาน/คนขับหลัก': 'อำนาจ (ป๊า)', 'แผนก/สาขา': 'ส่วนตัวเจ้าของ', 'สถานะรถ': 'จอดไม่ใช้งาน',
    'หมายเหตุ': '⚠️ ไฟล์เดิมระบุ "ยังไม่ต้องต่อทะเบียน" และวันภาษีที่บันทึกไว้ผ่านมาแล้ว (4/12/2025) — ตั้งสถานะเป็น "จอดไม่ใช้งาน" ชั่วคราว กรุณายืนยันสถานะจริงและปรับหากใช้งานอยู่, เครื่องยนต์ 2300cc' },

  { 'ประเภทรถ': 'รถส่วนตัวเจ้าของ', 'ทะเบียนรถ': 'บธ 2384', 'ยี่ห้อ': 'Mitsubishi', 'รุ่น': '', 'ปี (พ.ศ.)': 2548,
    'วันภาษี/ทะเบียนหมดอายุ': new Date(2023, 4, 25),
    'ผู้ใช้งาน/คนขับหลัก': 'หจก.ไนซ์เซ็นเตอร์ออยล์', 'แผนก/สาขา': 'ไม่ระบุ', 'สถานะรถ': 'จอดไม่ใช้งาน',
    'หมายเหตุ': '⚠️ วันภาษีหมดอายุนานมากแล้ว (25/5/2023) สันนิษฐานว่าอาจขายหรือปลดระวางไปแล้ว ตั้งสถานะ "จอดไม่ใช้งาน" ชั่วคราว กรุณายืนยัน/แก้เป็น "ขายแล้ว/ปลดระวาง" ถ้าไม่ได้ใช้แล้ว, เครื่องยนต์ 3000cc' }
];

// รถที่พบในไฟล์เดิมแต่ไม่มีเลขทะเบียนเลย จึงไม่ได้นำเข้าอัตโนมัติ (ต้องกรอกเองผ่านฟอร์ม "+"):
// - "จ่าหมาย" ยี่ห้อ Toyota Altis 2001 (ไม่มีทะเบียนในไฟล์เดิม)
// - รถของ "นัท แก๊ป" ยี่ห้อ Toyota Corolla Altis 1.6G (2012) — อาจซ้ำกับคัน กร 8273 กรุณาตรวจสอบ
// - รถของ "น้อยออย" ยี่ห้อ Mazda 3 โฉมเก่า (ไม่มีทะเบียนในไฟล์เดิม)

var SEED_MAINTENANCE = [
  // กย 2869 (Honda Accord G7) - ประวัติซ่อมละเอียดจากชีต "9.Accord 2869" (รวม 73,295 บาท ตรงกับสรุปในชีต Summary Trans)
  { plate: 'กย 2869', date: new Date(2023, 4, 1), type: 'ซ่อมทั่วไป', detail: 'ไฟเครื่องส้ม เบรคกระตุก / แก้ไข: เปลี่ยนอะไหล่, เจียจานเบรค', vendor: 'ช่างบิ๊ก', cost: 1000 },
  { plate: 'กย 2869', date: new Date(2023, 5, 6), type: 'ซ่อมทั่วไป', detail: 'เบรค / แก้ไข: เปลี่ยนเบรค, เจียจาน, เสียบสายเบรคมือ, ถ่วงล้อ', vendor: 'อู่ยิ้วบริการ', cost: 2300 },
  { plate: 'กย 2869', date: new Date(2023, 6, 6), type: 'ซ่อมทั่วไป', detail: 'สตาร์ทรถไม่ได้ / แก้ไข: ทำความสะอาด Contact Gear', vendor: 'ช่างบิ๊ก', cost: 400 },
  { plate: 'กย 2869', date: new Date(2023, 6, 14), type: 'เช็คระยะ/PM', detail: 'เช็ครถทั่วไปก่อนเดินทาง / แก้ไข: แก้น้ำมันเครื่องรั่ว', vendor: 'อู่สมนึก', cost: 0, note: 'ค่าใช้จ่ายเดิมระบุ "รอสิ้นเดือน" ไม่มีตัวเลขชัดเจน' },
  { plate: 'กย 2869', date: new Date(2023, 8, 7), type: 'เปลี่ยนน้ำมันเครื่อง', detail: 'เปลี่ยนน้ำมันเครื่อง Edge 1L x 4', vendor: 'อู่สมนึก', cost: 0 },
  { plate: 'กย 2869', date: new Date(2024, 0, 24), type: 'เช็คระยะ/PM', detail: 'เปลี่ยนน้ำมันเครื่อง, น้ำมันเบรค, น้ำมันเกียร์, น้ำยาหม้อน้ำ', vendor: 'ช่างบิ๊ก', cost: 800 },
  { plate: 'กย 2869', date: new Date(2024, 4, 1), type: 'แบตเตอรี่', detail: 'แบตเตอรี่หมด / เติมน้ำกลั่น เช็คแล้วแบตหมดอายุ เปลี่ยนแบตใหม่', vendor: 'ร้านแบตข้าง ธ.กรุงเทพ', cost: 0 },
  { plate: 'กย 2869', date: new Date(2024, 7, 26), type: 'เปลี่ยนยาง', detail: 'เปลี่ยนยาง (ยางลมแข็งไปหน่อย รถแอบสั่น แก้แล้ว)', vendor: 'TRC Tyreplus อู่ทอง', cost: 12450 },
  { plate: 'กย 2869', date: new Date(2024, 9, 4), type: 'ซ่อมเครื่องยนต์', detail: 'น้ำมัน Power รั่ว / ซ่อมปั๊ม Power, ปะเก็นฝาเครื่อง, ฝาวาล์ว, ครอบปลั๊ก', vendor: 'ช่างบิ๊ก', cost: 6100 },
  { plate: 'กย 2869', date: new Date(2024, 11, 13), type: 'เช็คระยะ/PM', detail: 'เปลี่ยนน้ำมันเครื่อง, ซ่อมน้ำยาหม้อน้ำรั่ว', vendor: 'อู่สมนึก', cost: 1000 },
  { plate: 'กย 2869', date: new Date(2025, 6, 17), type: 'เช็คระยะ/PM', detail: 'เปลี่ยนน้ำมันเครื่อง, น้ำมันเบรค, น้ำมันเกียร์, น้ำยาหม้อน้ำ (ครั้งหน้าเปลี่ยนผ้าเบรค)', vendor: 'อู่สมนึก', cost: 0 },
  { plate: 'กย 2869', date: new Date(2025, 6, 21), type: 'เปลี่ยนยาง', detail: 'เคลมยางแก้มแตก (ยางขวาหลังแก้มแตกที่ชลบุรี ใช้ iCare เคลมลด 30%)', vendor: 'TRC Tyreplus อู่ทอง', cost: 2345 },
  { plate: 'กย 2869', date: new Date(2025, 8, 15), type: 'ซ่อมทั่วไป', detail: 'ที่ปัดน้ำฝนกระแทกขอบ / เปลี่ยนบูชพลาสติก', vendor: 'ช่างเอี้ยง อ.บริการ', cost: 900 },
  { plate: 'กย 2869', date: new Date(2025, 9, 10), type: 'ซ่อมทั่วไป', detail: 'บูชปีกนกขาด มีเสียงน้ำครุกๆตอนสตาร์ท / ซ่อมบูชปีกนก 2 ข้าง + ซ่อมท่อหม้อน้ำรั่ว', vendor: 'อู่เล้งการช่าง', cost: 5200 },
  { plate: 'กย 2869', date: new Date(2025, 10, 3), type: 'เปลี่ยนยาง', detail: 'ศูนย์เอียงซ้ายนิดๆ / สลับยาง ถ่วงล้อ', vendor: 'TRC Tyreplus อู่ทอง', cost: 800 },
  { plate: 'กย 2869', date: new Date(2025, 10, 10), type: 'เปลี่ยนน้ำมันเครื่อง', detail: 'เปลี่ยนน้ำมันเครื่อง / ผ้าเบรค (Compact สีทอง เซรามิค)', vendor: 'อู่สมนึก', cost: 0 },
  { plate: 'กย 2869', date: new Date(2025, 11, 9), type: 'ซ่อมทั่วไป', detail: 'มีเสียงยาง เบรคแล้วพวงมาลัยสั่น / เจียจานเบรค (ยางทำอะไรไม่ได้ รอดูโช้คอัพประกอบ)', vendor: 'TRC Tyreplus อู่ทอง', cost: 800 },
  { plate: 'กย 2869', date: new Date(2026, 2, 12), type: 'ซ่อมทั่วไป', detail: 'พวงมาลัยมีเสียง / เปลี่ยนแรคพวงมาลัย, ยางแท่นเครื่อง, โช้คอัพ', vendor: 'อู่ยิ้วบริการ', cost: 39200 },

  // กบ 3608 (Nissan Almera) - จากชีต "10.Almera 3608"
  { plate: 'กบ 3608', date: new Date(2023, 10, 15), type: 'ซ่อมทั่วไป', detail: 'เปลี่ยนไฟเบรคหลัง', vendor: 'ตรงข้าม ธ.กรุงเทพ', cost: 30 },

  // กท 6313 (Honda Accord ทอง) - จากชีต "16.Accord ทอง"
  { plate: 'กท 6313', date: new Date(2023, 6, 1), type: 'ซ่อมตัวถัง/สี', detail: 'มือจับประตูหัก / เปลี่ยนอันใหม่', cost: 280 },
  { plate: 'กท 6313', date: new Date(2023, 6, 1), type: 'ซ่อมทั่วไป', detail: 'ปุ่มแก๊สเสีย / เปลี่ยนอันใหม่', vendor: 'BluPower', cost: 1200 },
  { plate: 'กท 6313', date: new Date(2023, 6, 8), type: 'อื่นๆ', detail: 'ลอกฟิล์ม', vendor: 'ชา ออโต้', cost: 0 },
  { plate: 'กท 6313', date: new Date(2023, 6, 24), type: 'ซ่อมตัวถัง/สี', detail: 'รถเฉี่ยวรถบรรทุก แตรไม่ดัง', cost: 0 }
];

/**
 * รันครั้งเดียวหลัง setupSheets() เพื่อนำเข้าข้อมูลรถ+ประวัติซ่อมจากไฟล์ Excel เดิม
 * ข้ามรายการที่ทะเบียนซ้ำอยู่แล้ว ป้องกันการนำเข้าซ้ำถ้ารันมากกว่า 1 ครั้ง
 */
function seedVehiclesFromLegacyData() {
  var sheet = getSheet_(CONFIG.SHEET_VEHICLES);
  var col = headerIndexMap_(VEHICLE_HEADERS);
  var existingPlates = {};
  var lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    sheet.getRange(2, col['ทะเบียนรถ'], lastRow - 1, 1).getValues().forEach(function (r) {
      if (r[0]) existingPlates[String(r[0]).trim()] = true;
    });
  }

  var added = 0, skipped = 0;
  SEED_VEHICLES.forEach(function (v) {
    if (existingPlates[v['ทะเบียนรถ']]) { skipped++; return; }
    addVehicle(v);
    added++;
  });

  var maintResult = seedMaintenanceFromLegacyData_();

  SpreadsheetApp.getUi().alert(
    'นำเข้าข้อมูลชุดเดิมเสร็จแล้ว ✅\n\n' +
    'ข้อมูลรถ: เพิ่มใหม่ ' + added + ' คัน, ข้าม (ทะเบียนซ้ำ) ' + skipped + ' คัน\n' +
    'ประวัติซ่อม: เพิ่มใหม่ ' + maintResult.added + ' รายการ, ข้าม (ซ้ำ) ' + maintResult.skipped + ' รายการ\n\n' +
    '⚠️ สำคัญ: หลายคันมีข้อมูลไม่ครบหรือไม่ตรงกันระหว่างชีตในไฟล์เดิม ได้ทำเครื่องหมาย ⚠️ ไว้ในช่อง "หมายเหตุ" ของแต่ละคัน กรุณาเปิดเว็บแอปแล้วตรวจสอบ/แก้ไขให้ถูกต้องก่อนใช้งานจริง โดยเฉพาะเรื่องเลขทะเบียนเต็มและชื่อคนขับปัจจุบัน'
  );
}

function seedMaintenanceFromLegacyData_() {
  var sheet = getSheet_(CONFIG.SHEET_MAINTENANCE);
  var rows = readAllRows_(sheet, MAINTENANCE_HEADERS);
  var existingKeys = {};
  rows.forEach(function (r) {
    var key = r['ทะเบียนรถ'] + '|' + new Date(r['วันที่บันทึก']).getTime() + '|' + r['รายละเอียด'];
    existingKeys[key] = true;
  });

  var added = 0, skipped = 0;
  SEED_MAINTENANCE.forEach(function (m) {
    var key = m.plate + '|' + m.date.getTime() + '|' + m.detail;
    if (existingKeys[key]) { skipped++; return; }
    addMaintenanceLog({
      'ทะเบียนรถ': m.plate,
      'วันที่บันทึก': m.date,
      'ประเภทงาน': m.type,
      'รายละเอียด': m.detail,
      'ค่าใช้จ่าย (บาท)': m.cost || 0,
      'ร้าน/อู่/ศูนย์บริการ': m.vendor || '',
      'หมายเหตุ': m.note || ''
    });
    added++;
  });
  return { added: added, skipped: skipped };
}

// ------------------------------------------------------------
// MENU / SETUP
// ------------------------------------------------------------
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚗 ระบบจัดการรถ')
    .addItem('⚙️ ตั้งค่าระบบครั้งแรก (Setup)', 'setupSheets')
    .addItem('📥 นำเข้าข้อมูลรถ+ประวัติซ่อมชุดเดิม (ครั้งเดียว)', 'seedVehiclesFromLegacyData')
    .addItem('👤 สร้างชีตผู้ใช้งาน + PIN (Users)', 'setupUsersSheet')
    .addItem('⏰ ตั้งเวลาแจ้งเตือนอัตโนมัติทุกวัน', 'setupDailyTrigger')
    .addItem('📨 ทดสอบส่งแจ้งเตือน LINE ตอนนี้', 'checkExpiryAndNotify')
    .addToUi();
}

/**
 * รันครั้งแรกครั้งเดียว (จากเมนู 🚗 ระบบจัดการรถ > ตั้งค่าระบบครั้งแรก)
 * สร้างชีตทั้งหมด, หัวตาราง, dropdown, การจัดรูปแบบตามเงื่อนไข
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var vehicles = ss.getSheetByName(CONFIG.SHEET_VEHICLES) || ss.insertSheet(CONFIG.SHEET_VEHICLES);
  setupHeaderRow_(vehicles, VEHICLE_HEADERS);
  setupVehicleValidationAndFormatting_(vehicles);

  var maintenance = ss.getSheetByName(CONFIG.SHEET_MAINTENANCE) || ss.insertSheet(CONFIG.SHEET_MAINTENANCE);
  setupHeaderRow_(maintenance, MAINTENANCE_HEADERS);
  setupMaintenanceValidation_(maintenance);

  var settings = ss.getSheetByName(CONFIG.SHEET_SETTINGS) || ss.insertSheet(CONFIG.SHEET_SETTINGS);
  setupSettingsSheet_(settings);

  var dashboard = ss.getSheetByName(CONFIG.SHEET_DASHBOARD) || ss.insertSheet(CONFIG.SHEET_DASHBOARD);
  setupDashboardSheet_(dashboard);

  // ลำดับชีตให้อ่านง่าย
  ss.setActiveSheet(dashboard);
  ss.moveActiveSheet(1);
  ss.setActiveSheet(vehicles);
  ss.moveActiveSheet(2);
  ss.setActiveSheet(maintenance);
  ss.moveActiveSheet(3);
  ss.setActiveSheet(settings);
  ss.moveActiveSheet(4);

  SpreadsheetApp.getUi().alert('ตั้งค่าระบบเรียบร้อย ✅\n\nขั้นตอนถัดไป:\n1. กรอก Script Properties (LINE token) ตามคู่มือ SETUP.md\n2. รันเมนู "ตั้งเวลาแจ้งเตือนอัตโนมัติทุกวัน"\n3. Deploy > New deployment > Web app เพื่อเปิดใช้งานหน้าเว็บ');
}

function setupHeaderRow_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#1a73e8')
    .setFontColor('#ffffff')
    .setWrap(true);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function setupVehicleValidationAndFormatting_(sheet) {
  var maxRows = 500;
  var col = headerIndexMap_(VEHICLE_HEADERS);

  applyDropdown_(sheet, col['ประเภทรถ'], maxRows, CONFIG.VEHICLE_TYPES);
  applyDropdown_(sheet, col['ประเภทประกัน'], maxRows, CONFIG.INSURANCE_TYPES);
  applyDropdown_(sheet, col['สถานะรถ'], maxRows, CONFIG.STATUS_OPTIONS);

  // รูปแบบวันที่
  [col['วันที่ พรบ. หมดอายุ'], col['วันประกันหมดอายุ'], col['วันภาษี/ทะเบียนหมดอายุ'], col['วันที่บันทึกไมล์']].forEach(function (c) {
    sheet.getRange(2, c, maxRows, 1).setNumberFormat('dd/mm/yyyy');
  });

  // Conditional formatting: แดง = เลยกำหนด/ใกล้ 7 วัน, เหลือง = ภายใน 30 วัน
  var rules = sheet.getConditionalFormatRules();
  [col['วันที่ พรบ. หมดอายุ'], col['วันประกันหมดอายุ'], col['วันภาษี/ทะเบียนหมดอายุ']].forEach(function (c) {
    var range = sheet.getRange(2, c, maxRows, 1);
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenDateBefore(SpreadsheetApp.RelativeDate.TODAY)
      .setBackground('#f4c7c3').setFontColor('#a50e0e')
      .setRanges([range]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND(' + range.getA1Notation().split(':')[0] + '<>"",' + range.getA1Notation().split(':')[0] + '-TODAY()<=7,' + range.getA1Notation().split(':')[0] + '-TODAY()>=0)')
      .setBackground('#f9cb9c').setFontColor('#994c00')
      .setRanges([range]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND(' + range.getA1Notation().split(':')[0] + '<>"",' + range.getA1Notation().split(':')[0] + '-TODAY()<=30,' + range.getA1Notation().split(':')[0] + '-TODAY()>7)')
      .setBackground('#fff2cc').setFontColor('#7f6000')
      .setRanges([range]).build());
  });
  sheet.setConditionalFormatRules(rules);
}

function setupMaintenanceValidation_(sheet) {
  var maxRows = 1000;
  var col = headerIndexMap_(MAINTENANCE_HEADERS);
  applyDropdown_(sheet, col['ประเภทงาน'], maxRows, CONFIG.MAINTENANCE_TYPES);
  sheet.getRange(2, col['วันที่บันทึก'], maxRows, 1).setNumberFormat('dd/mm/yyyy');
  sheet.getRange(2, col['รอบถัดไป (วันที่)'], maxRows, 1).setNumberFormat('dd/mm/yyyy');
  sheet.getRange(2, col['ค่าใช้จ่าย (บาท)'], maxRows, 1).setNumberFormat('#,##0.00');
}

function applyDropdown_(sheet, colIndex, maxRows, list) {
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(list, true).setAllowInvalid(false).build();
  sheet.getRange(2, colIndex, maxRows, 1).setDataValidation(rule);
}

function setupSettingsSheet_(sheet) {
  sheet.clear();
  var data = [
    ['ตั้งค่า', 'ค่า', 'หมายเหตุ'],
    ['อีเมลผู้ใช้ที่อนุญาต (คั่นด้วย ,)', 'poomprofile@gmail.com', 'ใส่อีเมล Gmail ของคนที่เข้าใช้ระบบได้ คั่นด้วยจุลภาค'],
    ['แจ้งเตือนล่วงหน้า (วัน)', '30,15,7,3,1,0', 'ระบบจะส่ง LINE แจ้งเตือนเมื่อเหลือวันเท่านี้ก่อนหมดอายุ'],
    ['หมายเหตุ LINE Token', '', 'ตั้งค่าจริงที่ Extensions > Apps Script > Project Settings > Script Properties: LINE_CHANNEL_ACCESS_TOKEN และ LINE_TARGET_ID (ห้ามใส่ในชีตนี้เพื่อความปลอดภัย)']
  ];
  sheet.getRange(1, 1, data.length, 3).setValues(data);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
  sheet.setColumnWidths(1, 1, 220);
  sheet.setColumnWidths(2, 1, 220);
  sheet.setColumnWidths(3, 1, 420);
  sheet.setFrozenRows(1);
}

function setupDashboardSheet_(sheet) {
  sheet.clear();
  sheet.getRange('A1').setValue('📊 แดชบอร์ดสรุปสถานะรถ (เปิดหน้าเว็บแอปเพื่อดูแบบสวยงาม และแก้ไขข้อมูล)');
  sheet.getRange('A1').setFontWeight('bold').setFontSize(13);
  sheet.getRange('A3').setFormula(
    '=IFERROR(QUERY(' + CONFIG.SHEET_VEHICLES + '!A:Z,' +
    '"select C, B, M, Q, R where C is not null",1),"ยังไม่มีข้อมูลรถ")'
  );
}

function headerIndexMap_(headers) {
  var map = {};
  headers.forEach(function (h, i) { map[h] = i + 1; });
  return map;
}

// ------------------------------------------------------------
// WEB APP ENTRY POINT
// ------------------------------------------------------------
function doGet(e) {
  // หน้าเว็บจริงย้ายไปโฮสต์เองแล้ว — เปิดลิงก์ GAS ตรงๆ จะเด้งไปที่ WEB_APP_URL
  return HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html><head><base target="_top">' +
    '<meta http-equiv="refresh" content="0;url=' + CONFIG.WEB_APP_URL + '"></head>' +
    '<body style="font-family:sans-serif;text-align:center;padding-top:60px">' +
    'กำลังพาไปที่ <a href="' + CONFIG.WEB_APP_URL + '">' + CONFIG.WEB_APP_URL + '</a> ...' +
    '<script>try{window.top.location.href="' + CONFIG.WEB_APP_URL + '";}catch(e){}</script>' +
    '</body></html>'
  ).setTitle('ระบบจัดการรถ - ไนซ์เซ็นเตอร์ออยล์')
   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ------------------------------------------------------------
// WEB API — รับ POST (JSON) จากหน้าเว็บบน car.nicecenter.co.th
// Deploy: Execute as: Me / Who has access: Anyone (ทุกคน ไม่ต้องล็อกอิน Google)
// ------------------------------------------------------------
var API_USER_NAME = ''; // ชื่อผู้ใช้ที่ผ่าน token แล้ว (ตั้งค่าโดย handleApi_)

function doPost(e) {
  var out;
  try {
    var req = JSON.parse(e.postData.contents);
    out = handleApi_(req);
  } catch (err) {
    console.error('doPost error:', err);
    out = { success: false, error: 'คำขอไม่ถูกต้อง: ' + err };
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleApi_(req) {
  var args = req.args || [];
  if (req.action === 'login') return apiLogin_(String(args[0] || ''));

  var user = validateToken_(req.token);
  if (!user) return { success: false, error: 'UNAUTHORIZED' };
  API_USER_NAME = user.name;

  var fns = {
    getUserInfo: function () { return { success: true, data: { email: user.name } }; },
    logout: function () { revokeToken_(req.token); return { success: true }; },
    getAllVehicles: getAllVehicles,
    addVehicle: addVehicle,
    updateVehicle: updateVehicle,
    deleteVehicle: deleteVehicle,
    getMaintenanceLogs: getMaintenanceLogs,
    addMaintenanceLog: addMaintenanceLog,
    getDashboardData: getDashboardData,
    uploadAttachment: uploadAttachment
  };
  if (!fns[req.action]) return { success: false, error: 'ไม่รู้จักคำสั่ง: ' + req.action };
  return fns[req.action].apply(null, args);
}

// ---------- PIN LOGIN + TOKEN ----------
function apiLogin_(pin) {
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('pin_fails') || 0);
  if (fails >= 8) return { success: false, error: 'ใส่ PIN ผิดหลายครั้งเกินไป กรุณารอ 10 นาทีแล้วลองใหม่' };

  pin = pin.trim();
  var user = pin ? findUserByPin_(pin) : null;
  if (!user) {
    cache.put('pin_fails', String(fails + 1), 600); // ล็อก 10 นาทีเมื่อครบ 8 ครั้ง
    return { success: false, error: 'PIN ไม่ถูกต้อง' };
  }
  cache.remove('pin_fails');

  var token = Utilities.getUuid();
  var exp = Date.now() + CONFIG.TOKEN_DAYS * 86400000;
  PropertiesService.getScriptProperties().setProperty(
    'tok_' + token, JSON.stringify({ name: user.name, exp: exp })
  );
  pruneExpiredTokens_();
  return { success: true, data: { token: token, name: user.name } };
}

function findUserByPin_(pin) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!sheet) return null;
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    var name = String(rows[i][0] || '').trim();
    var rowPin = String(rows[i][1] || '').trim();
    var status = String(rows[i][2] || '').trim();
    if (name && rowPin && rowPin === pin && status !== 'ปิดใช้งาน') return { name: name };
  }
  return null;
}

function validateToken_(token) {
  if (!token) return null;
  var raw = PropertiesService.getScriptProperties().getProperty('tok_' + token);
  if (!raw) return null;
  try {
    var t = JSON.parse(raw);
    if (t.exp < Date.now()) { revokeToken_(token); return null; }
    if (!isUserActive_(t.name)) { revokeToken_(token); return null; } // ปิดใช้งานในชีต = เตะออกทันที
    return { name: t.name };
  } catch (e) { return null; }
}

function isUserActive_(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_USERS);
  if (!sheet) return false;
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim() === name && String(rows[i][2] || '').trim() !== 'ปิดใช้งาน') return true;
  }
  return false;
}

function revokeToken_(token) {
  if (token) PropertiesService.getScriptProperties().deleteProperty('tok_' + token);
}

function pruneExpiredTokens_() {
  try {
    var props = PropertiesService.getScriptProperties();
    var all = props.getProperties();
    var now = Date.now();
    Object.keys(all).forEach(function (k) {
      if (k.indexOf('tok_') !== 0) return;
      try { if (JSON.parse(all[k]).exp < now) props.deleteProperty(k); }
      catch (e) { props.deleteProperty(k); }
    });
  } catch (e) { /* ไม่สำคัญ */ }
}

/** รันครั้งเดียวจากเมนู: สร้างชีต Users สำหรับกำหนด PIN ต่อคน */
function setupUsersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_USERS);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 3).setValues([['ชื่อผู้ใช้', 'PIN (6 หลัก)', 'สถานะ']])
      .setFontWeight('bold').setBackground('#e8551c').setFontColor('#ffffff');
    sheet.getRange(2, 1, 1, 3).setValues([['ตัวอย่าง สมชาย', '123456', 'ปิดใช้งาน']]);
    sheet.setColumnWidths(1, 3, 160);
    sheet.getRange(2, 3, 50, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(['เปิดใช้งาน', 'ปิดใช้งาน'], true).build()
    );
    sheet.getRange(2, 2, 51, 1).setNumberFormat('@'); // กัน PIN ที่ขึ้นต้นด้วย 0 กลายเป็นตัวเลข
  }
  SpreadsheetApp.getUi().alert('สร้างชีต Users แล้ว\n\nเพิ่มชื่อ + PIN (ห้ามซ้ำกัน) แล้วตั้งสถานะ "เปิดใช้งาน"\nแถวตัวอย่างลบทิ้งได้เลย');
}

function getActiveUserName_() {
  if (API_USER_NAME) return API_USER_NAME;
  try { return Session.getActiveUser().getEmail() || ''; } catch (e) { return ''; }
}

// ------------------------------------------------------------
// AUTH
// ------------------------------------------------------------
function getUserInfo() {
  try {
    var email = (Session.getActiveUser().getEmail() || '').trim().toLowerCase();
    if (!email) {
      return { success: false, error: 'ระบบไม่สามารถระบุบัญชี Google ของคุณได้\n\nวิธีแก้:\n1. ตรวจสอบการ Deploy: "Execute as: Me" + "Who has access: Anyone with Google account"\n2. ถ้าล็อกอินหลายบัญชี Google ในเบราว์เซอร์เดียว ให้เปิดหน้าต่างไม่ระบุตัวตน (Incognito) แล้วล็อกอินเฉพาะบัญชีที่ได้รับสิทธิ์' };
    }
    var allowed = getAllowedEmails_();
    if (allowed.length && allowed.indexOf(email) === -1) {
      return { success: false, error: 'บัญชี ' + email + ' ยังไม่ได้รับสิทธิ์เข้าใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบ' };
    }
    return { success: true, data: { email: email } };
  } catch (e) {
    console.error('getUserInfo error:', e);
    return { success: false, error: e.toString() };
  }
}

function getAllowedEmails_() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_SETTINGS);
    if (!sheet) return [];
    var raw = sheet.getRange(2, 2).getValue().toString();
    if (!raw) return [];
    return raw.split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(String);
  } catch (e) {
    return [];
  }
}

// ------------------------------------------------------------
// VEHICLES CRUD
// ------------------------------------------------------------
function getAllVehicles() {
  try {
    var sheet = getSheet_(CONFIG.SHEET_VEHICLES);
    var rows = readAllRows_(sheet, VEHICLE_HEADERS);
    var today = stripTime_(new Date());
    var result = rows.map(function (row) {
      var plateExpiry = enrichExpiry_(row['วันภาษี/ทะเบียนหมดอายุ'], today);
      var insuranceExpiry = enrichExpiry_(row['วันประกันหมดอายุ'], today);
      var actExpiry = enrichExpiry_(row['วันที่ พรบ. หมดอายุ'], today);
      var worst = [plateExpiry, insuranceExpiry, actExpiry]
        .filter(function (x) { return x.daysLeft !== null; })
        .sort(function (a, b) { return a.daysLeft - b.daysLeft; })[0];
      row._plateExpiry = plateExpiry;
      row._insuranceExpiry = insuranceExpiry;
      row._actExpiry = actExpiry;
      row._urgency = worst ? worst.urgency : 'none';
      row._minDaysLeft = worst ? worst.daysLeft : null;
      return row;
    });
    result.sort(function (a, b) {
      var av = a._minDaysLeft === null ? 99999 : a._minDaysLeft;
      var bv = b._minDaysLeft === null ? 99999 : b._minDaysLeft;
      return av - bv;
    });
    return { success: true, data: serializeDates_(result) };
  } catch (e) {
    console.error('getAllVehicles error:', e);
    return { success: false, error: e.toString() };
  }
}

function addVehicle(data) {
  try {
    var sheet = getSheet_(CONFIG.SHEET_VEHICLES);
    var col = headerIndexMap_(VEHICLE_HEADERS);
    var newId = 'V' + Utilities.formatString('%04d', getNextRowCount_(sheet) + 1);
    var row = new Array(VEHICLE_HEADERS.length).fill('');
    row[col['ID'] - 1] = newId;
    VEHICLE_HEADERS.forEach(function (h) {
      if (h === 'ID') return;
      if (data[h] !== undefined) row[col[h] - 1] = data[h];
    });
    row[col['อัปเดตล่าสุดโดย'] - 1] = getActiveUserName_();
    row[col['อัปเดตล่าสุดเมื่อ'] - 1] = new Date();
    sheet.appendRow(row);
    return { success: true, data: { id: newId } };
  } catch (e) {
    console.error('addVehicle error:', e);
    return { success: false, error: e.toString() };
  }
}

function updateVehicle(id, data) {
  try {
    var sheet = getSheet_(CONFIG.SHEET_VEHICLES);
    var col = headerIndexMap_(VEHICLE_HEADERS);
    var rowIndex = findRowById_(sheet, col['ID'], id);
    if (!rowIndex) return { success: false, error: 'ไม่พบรถรหัส ' + id };
    Object.keys(data).forEach(function (h) {
      if (col[h]) sheet.getRange(rowIndex, col[h]).setValue(data[h]);
    });
    sheet.getRange(rowIndex, col['อัปเดตล่าสุดโดย']).setValue(getActiveUserName_());
    sheet.getRange(rowIndex, col['อัปเดตล่าสุดเมื่อ']).setValue(new Date());
    return { success: true };
  } catch (e) {
    console.error('updateVehicle error:', e);
    return { success: false, error: e.toString() };
  }
}

function deleteVehicle(id) {
  try {
    // ไม่ลบจริง เปลี่ยนสถานะเป็น "ขายแล้ว/ปลดระวาง" เพื่อรักษาประวัติ
    return updateVehicle(id, { 'สถานะรถ': 'ขายแล้ว/ปลดระวาง' });
  } catch (e) {
    console.error('deleteVehicle error:', e);
    return { success: false, error: e.toString() };
  }
}

// ------------------------------------------------------------
// MAINTENANCE
// ------------------------------------------------------------
function getMaintenanceLogs(vehiclePlate) {
  try {
    var sheet = getSheet_(CONFIG.SHEET_MAINTENANCE);
    var rows = readAllRows_(sheet, MAINTENANCE_HEADERS);
    if (vehiclePlate) {
      rows = rows.filter(function (r) { return r['ทะเบียนรถ'] === vehiclePlate; });
    }
    rows.sort(function (a, b) { return new Date(b['วันที่บันทึก']) - new Date(a['วันที่บันทึก']); });
    return { success: true, data: serializeDates_(rows) };
  } catch (e) {
    console.error('getMaintenanceLogs error:', e);
    return { success: false, error: e.toString() };
  }
}

function addMaintenanceLog(data) {
  try {
    var sheet = getSheet_(CONFIG.SHEET_MAINTENANCE);
    var col = headerIndexMap_(MAINTENANCE_HEADERS);
    var newId = 'M' + Utilities.formatString('%05d', getNextRowCount_(sheet) + 1);
    var row = new Array(MAINTENANCE_HEADERS.length).fill('');
    row[col['ID'] - 1] = newId;
    MAINTENANCE_HEADERS.forEach(function (h) {
      if (h === 'ID') return;
      if (data[h] !== undefined) row[col[h] - 1] = data[h];
    });
    row[col['ผู้บันทึก'] - 1] = getActiveUserName_();
    sheet.appendRow(row);

    // อัปเดตเลขไมล์ล่าสุดของรถคันนี้ถ้าข้อมูลใหม่กว่า
    if (data['เลขไมล์ ณ วันที่ทำ'] && data['ทะเบียนรถ']) {
      updateVehicleMileageIfNewer_(data['ทะเบียนรถ'], data['เลขไมล์ ณ วันที่ทำ']);
    }
    return { success: true, data: { id: newId } };
  } catch (e) {
    console.error('addMaintenanceLog error:', e);
    return { success: false, error: e.toString() };
  }
}

function updateVehicleMileageIfNewer_(plate, mileage) {
  var sheet = getSheet_(CONFIG.SHEET_VEHICLES);
  var col = headerIndexMap_(VEHICLE_HEADERS);
  var rowIndex = findRowById_(sheet, col['ทะเบียนรถ'], plate);
  if (!rowIndex) return;
  var current = sheet.getRange(rowIndex, col['เลขไมล์ล่าสุด']).getValue();
  if (!current || Number(mileage) > Number(current)) {
    sheet.getRange(rowIndex, col['เลขไมล์ล่าสุด']).setValue(mileage);
    sheet.getRange(rowIndex, col['วันที่บันทึกไมล์']).setValue(new Date());
  }
}

// ------------------------------------------------------------
// DASHBOARD / COST SUMMARY
// ------------------------------------------------------------
function getDashboardData() {
  var vehiclesResp = getAllVehicles();
  if (!vehiclesResp.success) return vehiclesResp;
  var vehicles = vehiclesResp.data;

  var summary = { red: 0, yellow: 0, green: 0, total: vehicles.length };
  vehicles.forEach(function (v) {
    if (v._urgency === 'red') summary.red++;
    else if (v._urgency === 'yellow') summary.yellow++;
    else summary.green++;
  });

  // จัดกลุ่มรถที่ควรต่อทะเบียน/ประกันพร้อมกัน (หมดอายุเดือนเดียวกัน) เพื่อลดจำนวนรอบไปติดต่อ
  var batchGroups = {};
  vehicles.forEach(function (v) {
    ['_plateExpiry', '_insuranceExpiry', '_actExpiry'].forEach(function (key) {
      var info = v[key];
      if (info && info.date && info.daysLeft !== null && info.daysLeft <= 60) {
        var monthKey = Utilities.formatDate(new Date(info.date), Session.getScriptTimeZone(), 'yyyy-MM');
        if (!batchGroups[monthKey]) batchGroups[monthKey] = [];
        batchGroups[monthKey].push({ plate: v['ทะเบียนรถ'], type: key, daysLeft: info.daysLeft });
      }
    });
  });

  return { success: true, data: { vehicles: vehicles, summary: summary, batchGroups: batchGroups } };
}

function getCostSummary(vehiclePlate) {
  try {
    var sheet = getSheet_(CONFIG.SHEET_MAINTENANCE);
    var rows = readAllRows_(sheet, MAINTENANCE_HEADERS);
    if (vehiclePlate) rows = rows.filter(function (r) { return r['ทะเบียนรถ'] === vehiclePlate; });

    var byVehicle = {};
    var byMonth = {};
    var total = 0;
    rows.forEach(function (r) {
      var cost = Number(r['ค่าใช้จ่าย (บาท)']) || 0;
      total += cost;
      var plate = r['ทะเบียนรถ'] || 'ไม่ระบุ';
      byVehicle[plate] = (byVehicle[plate] || 0) + cost;
      var d = r['วันที่บันทึก'] ? new Date(r['วันที่บันทึก']) : null;
      if (d) {
        var mk = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM');
        byMonth[mk] = (byMonth[mk] || 0) + cost;
      }
    });
    return { success: true, data: { total: total, byVehicle: byVehicle, byMonth: byMonth, records: rows.length } };
  } catch (e) {
    console.error('getCostSummary error:', e);
    return { success: false, error: e.toString() };
  }
}

// ------------------------------------------------------------
// FILE ATTACHMENTS (Drive)
// ------------------------------------------------------------
function uploadAttachment(base64Data, mimeType, filename, vehiclePlate) {
  try {
    var rootFolder = getOrCreateFolder_(CONFIG.DRIVE_ROOT_FOLDER, DriveApp.getRootFolder());
    var vehicleFolder = getOrCreateFolder_(vehiclePlate || 'ไม่ระบุทะเบียน', rootFolder);
    var bytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(bytes, mimeType, filename);
    var file = vehicleFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var url = file.getUrl();

    // ผูกลิงก์เข้ากับแถวรถ (ต่อท้ายลิงก์เดิม)
    var sheet = getSheet_(CONFIG.SHEET_VEHICLES);
    var col = headerIndexMap_(VEHICLE_HEADERS);
    var rowIndex = findRowById_(sheet, col['ทะเบียนรถ'], vehiclePlate);
    if (rowIndex) {
      var cell = sheet.getRange(rowIndex, col['ลิงก์เอกสารแนบ']);
      var existing = cell.getValue();
      cell.setValue(existing ? existing + '\n' + url : url);
    }
    return { success: true, data: { url: url } };
  } catch (e) {
    console.error('uploadAttachment error:', e);
    return { success: false, error: e.toString() };
  }
}

function getOrCreateFolder_(name, parent) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

// ------------------------------------------------------------
// LINE NOTIFICATIONS
// ------------------------------------------------------------
function setupDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'checkExpiryAndNotify') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkExpiryAndNotify').timeBased().everyDays(1).atHour(8).create();
  SpreadsheetApp.getUi().alert('ตั้งเวลาแจ้งเตือนอัตโนมัติเรียบร้อย ✅ ระบบจะตรวจสอบและส่ง LINE ทุกวันเวลาประมาณ 08:00 น.');
}

function checkExpiryAndNotify() {
  try {
    var vehiclesResp = getAllVehicles();
    if (!vehiclesResp.success) { console.error(vehiclesResp.error); return; }
    var thresholds = CONFIG.ALERT_THRESHOLDS;
    var lines = [];

    vehiclesResp.data.forEach(function (v) {
      var items = [
        { label: 'พรบ.', info: v._actExpiry },
        { label: 'ประกันภัย', info: v._insuranceExpiry },
        { label: 'ภาษี/ทะเบียน', info: v._plateExpiry }
      ];
      items.forEach(function (item) {
        var d = item.info.daysLeft;
        if (d === null) return;
        var shouldNotify = d < 0 || thresholds.indexOf(d) !== -1;
        if (shouldNotify) {
          var statusText = d < 0 ? ('เลยกำหนดมาแล้ว ' + Math.abs(d) + ' วัน ⚠️') : ('เหลืออีก ' + d + ' วัน');
          lines.push('🚘 ' + v['ทะเบียนรถ'] + ' (' + v['ประเภทรถ'] + ') - ' + item.label + ' ' + statusText);
        }
      });
    });

    if (lines.length === 0) {
      console.log('checkExpiryAndNotify: ไม่มีรายการที่ต้องแจ้งเตือนวันนี้');
      return;
    }

    var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy');
    var message = '📋 สรุปแจ้งเตือนรถยนต์ วันที่ ' + today + '\n\n' + lines.join('\n') +
      '\n\n💡 เช็ครายละเอียดและจัดกลุ่มต่อพร้อมกันได้ที่หน้าเว็บระบบจัดการรถ';
    sendLineMessage_(message);
  } catch (e) {
    console.error('checkExpiryAndNotify error:', e);
  }
}

function sendLineMessage_(text) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  var targetId = props.getProperty('LINE_TARGET_ID');
  if (!token || !targetId) {
    console.error('sendLineMessage_: ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN / LINE_TARGET_ID ใน Script Properties');
    return;
  }
  var payload = {
    to: targetId,
    messages: [{ type: 'text', text: text }]
  };
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  var resp = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options);
  console.log('LINE push response:', resp.getResponseCode(), resp.getContentText());
}

// ------------------------------------------------------------
// GENERIC SHEET HELPERS
// ------------------------------------------------------------
function getSheet_(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('ไม่พบชีต "' + name + '" กรุณารันเมนู "ตั้งค่าระบบครั้งแรก" ก่อน');
  return sheet;
}

function readAllRows_(sheet, headers) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values
    .filter(function (row) { return row.join('') !== ''; })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = row[i]; });
      return obj;
    });
}

function getNextRowCount_(sheet) {
  return Math.max(0, sheet.getLastRow() - 1);
}

function findRowById_(sheet, idColIndex, idValue) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  var ids = sheet.getRange(2, idColIndex, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === idValue) return i + 2;
  }
  return null;
}

function stripTime_(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * แปลง Date object ทั้งหมดที่ซ่อนอยู่ใน object/array ให้เป็น string ก่อนส่งกลับไปหน้าเว็บ (client)
 * จำเป็นมาก: google.script.run ทำ serialize ค่าที่ส่งกลับแบบพิเศษ ถ้ามี Date object ซ้อนอยู่ลึกๆ
 * ในโครงสร้างข้อมูล (เช่น { date: new Date(), daysLeft: 5 }) บางครั้งจะทำให้ withSuccessHandler
 * ไม่ถูกเรียกเลย (หน้าเว็บค้างที่ "กำลังโหลดข้อมูล..." ทั้งที่ execution log ฝั่ง server ขึ้น Completed)
 */
function serializeDates_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
  }
  if (Array.isArray(value)) {
    return value.map(serializeDates_);
  }
  if (value && typeof value === 'object') {
    var out = {};
    Object.keys(value).forEach(function (k) { out[k] = serializeDates_(value[k]); });
    return out;
  }
  return value;
}

function enrichExpiry_(rawDate, today) {
  if (!rawDate) return { date: null, daysLeft: null, urgency: 'none' };
  var d = stripTime_(new Date(rawDate));
  var daysLeft = Math.round((d - today) / (1000 * 60 * 60 * 24));
  var urgency = 'green';
  if (daysLeft < 0 || daysLeft <= 7) urgency = 'red';
  else if (daysLeft <= 30) urgency = 'yellow';
  return { date: d, daysLeft: daysLeft, urgency: urgency };
}
