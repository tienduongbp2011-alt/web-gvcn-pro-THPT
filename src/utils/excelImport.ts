import * as XLSX from 'xlsx';
import { Student } from '../types';

export interface ExcelImportResult {
  added: Student[];
  updated: Student[];
  duplicates: string[];
  errors: string[];
  totalRows: number;
  previewRows: Array<{
    code: string;
    fullName: string;
    dob: string;
    gender: 'Nam' | 'Nữ';
    teamNumber: number;
    role: string;
    contactPhone?: string;
    parentPhone?: string;
    status: 'new' | 'update' | 'duplicate';
  }>;
}

/**
 * Chuẩn hóa ngày sinh từ chuỗi hoặc số serial của Excel sang dạng YYYY-MM-DD
 */
export function normalizeExcelDate(val: any): string {
  if (val === undefined || val === null || val === '') return '';

  // Nếu là Date object (do XLSX cellDates: true)
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // Nếu là số serial của Excel (thường > 20000)
  if (typeof val === 'number') {
    try {
      const parsedDate = XLSX.SSF.parse_date_code(val);
      if (parsedDate) {
        const y = parsedDate.y;
        const m = String(parsedDate.m).padStart(2, '0');
        const d = String(parsedDate.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {
      // fallback
    }
  }

  const str = String(val).trim();

  // Dạng YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const parts = str.split('-');
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }

  // Dạng DD/MM/YYYY hoặc DD-MM-YYYY (phổ biến tại Việt Nam)
  const slashMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) {
    const d = slashMatch[1].padStart(2, '0');
    const m = slashMatch[2].padStart(2, '0');
    const y = slashMatch[3];
    return `${y}-${m}-${d}`;
  }

  return str;
}

/**
 * Trích xuất số tổ (1, 2, 3, 4) từ chuỗi như "Tổ 1", "Tổ 2", "1", "2"...
 */
export function normalizeTeamNumber(val: any): number {
  if (!val) return 1;
  const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  if (num >= 1 && num <= 4) return num;
  return 1;
}

/**
 * Chuẩn hóa giới tính thành 'Nam' hoặc 'Nữ'
 */
export function normalizeGender(val: any): 'Nam' | 'Nữ' {
  if (!val) return 'Nam';
  const str = String(val).trim().toLowerCase();
  if (str === 'nữ' || str === 'nu' || str === 'female' || str === 'f') return 'Nữ';
  return 'Nam';
}

/**
 * Chuẩn hóa chức vụ
 */
export function normalizeRole(val: any): Student['role'] {
  if (!val) return 'Thành viên';
  const str = String(val).trim().toLowerCase();
  if (str.includes('lớp trưởng') || str.includes('lop truong')) return 'Lớp trưởng';
  if (str.includes('học tập') || str.includes('hoc tap')) return 'Lớp phó học tập';
  if (str.includes('lao động') || str.includes('lao dong') || str.includes('kỷ luật')) return 'Lớp phó lao động';
  if (str.includes('tổ trưởng') || str.includes('to truong')) return 'Tổ trưởng';
  if (str.includes('tổ phó') || str.includes('to pho')) return 'Tổ phó';
  return 'Thành viên';
}

/**
 * Đọc file Excel (.xlsx, .xls) hoặc CSV và chuyển thành danh sách học sinh
 */
export function parseStudentsFromExcelBuffer(
  buffer: ArrayBuffer,
  currentStudents: Student[],
  importMode: 'add_new' | 'update_existing' | 'replace_all' = 'add_new'
): ExcelImportResult {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Chuyển sang mảng các object hoặc mảng dòng
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rawRows.length < 2) {
    return {
      added: [],
      updated: [],
      duplicates: [],
      errors: ['File Excel không có dữ liệu hoặc thiếu dòng tiêu đề cột.'],
      totalRows: 0,
      previewRows: []
    };
  }

  // Tìm dòng tiêu đề (Header row): dòng chứa các từ khóa như "Họ và tên", "Họ tên", "Tên", "Mã HS", "STT"...
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const rowStr = rawRows[i].map((c: any) => String(c).toLowerCase()).join(' ');
    if (
      rowStr.includes('họ') ||
      rowStr.includes('tên') ||
      rowStr.includes('mã') ||
      rowStr.includes('name') ||
      rowStr.includes('stt')
    ) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    headerIndex = 0;
  }

  const headers: string[] = rawRows[headerIndex].map((c: any) => String(c).trim());

  // Tìm index của các cột tương ứng
  const findCol = (...keywords: string[]): number => {
    return headers.findIndex(h => {
      const lower = h.toLowerCase();
      return keywords.some(k => lower.includes(k.toLowerCase()));
    });
  };

  const colCode = findCol('mã hs', 'mã học sinh', 'mã', 'code', 'stt');
  const colFullName = findCol('họ và tên', 'họ tên', 'họ và tên học sinh', 'tên học sinh', 'fullname', 'họ tên hs');
  const colFirstName = findCol('họ đệm', 'họ lót', 'họ');
  const colLastName = findCol('tên', 'tên gọi');
  const colDob = findCol('ngày sinh', 'năm sinh', 'dob', 'sinh');
  const colGender = findCol('giới tính', 'nam/nữ', 'phái', 'gender');
  const colTeam = findCol('tổ', 'tổ sinh hoạt', 'nhóm', 'team');
  const colRole = findCol('chức vụ', 'vai trò', 'chức danh', 'role');
  const colContactPhone = findCol('sđt học sinh', 'sđt hs', 'điện thoại hs', 'sđt', 'phone');
  const colParentPhone = findCol('sđt phụ huynh', 'sđt ph', 'cha mẹ', 'ba mẹ', 'phụ huynh', 'parent');
  const colNotes = findCol('ghi chú', 'nhận xét', 'notes', 'lưu ý');
  const colPoints = findCol('điểm thi đua', 'điểm', 'points');
  const colCoins = findCol('xu', 'số xu', 'coins');

  const added: Student[] = [];
  const updated: Student[] = [];
  const duplicates: string[] = [];
  const errors: string[] = [];
  const previewRows: ExcelImportResult['previewRows'] = [];

  const existingCodeMap = new Map<string, Student>();
  const existingNameMap = new Map<string, Student>();

  if (importMode !== 'replace_all') {
    currentStudents.forEach(s => {
      if (s.code) existingCodeMap.set(s.code.trim().toUpperCase(), s);
      if (s.fullName) existingNameMap.set(s.fullName.trim().toLowerCase(), s);
    });
  }

  let codeCounter = currentStudents.length + 1;

  for (let i = headerIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    // Lấy họ và tên
    let fullName = '';
    if (colFullName !== -1 && row[colFullName]) {
      fullName = String(row[colFullName]).trim();
    } else if (colFirstName !== -1 && colLastName !== -1 && (row[colFirstName] || row[colLastName])) {
      fullName = `${String(row[colFirstName] || '').trim()} ${String(row[colLastName] || '').trim()}`.trim();
    } else if (colLastName !== -1 && row[colLastName]) {
      fullName = String(row[colLastName]).trim();
    }

    // Nếu dòng này không có tên (dòng trống hoặc tổng kết ở cuối file excel)
    if (!fullName) continue;

    // Lấy hoặc tự sinh mã học sinh
    let code = '';
    if (colCode !== -1 && row[colCode]) {
      const rawCode = String(row[colCode]).trim();
      // Nếu mã là số STT thuần như 1, 2, 3 -> chuyển thành HS001, HS002
      if (/^\d+$/.test(rawCode)) {
        code = `HS${rawCode.padStart(3, '0')}`;
      } else {
        code = rawCode.toUpperCase();
      }
    }
    if (!code) {
      code = `HS${String(codeCounter++).padStart(3, '0')}`;
    }

    const dob = colDob !== -1 ? normalizeExcelDate(row[colDob]) : '';
    const gender = colGender !== -1 ? normalizeGender(row[colGender]) : 'Nam';
    const teamNumber = colTeam !== -1 ? normalizeTeamNumber(row[colTeam]) : 1;
    const role = colRole !== -1 ? normalizeRole(row[colRole]) : 'Thành viên';
    const contactPhone = colContactPhone !== -1 ? String(row[colContactPhone] || '').trim() : '';
    const parentPhone = colParentPhone !== -1 ? String(row[colParentPhone] || '').trim() : '';
    const notes = colNotes !== -1 ? String(row[colNotes] || '').trim() : '';
    const points = colPoints !== -1 && !isNaN(Number(row[colPoints])) ? Number(row[colPoints]) : 0;
    const coins = colCoins !== -1 && !isNaN(Number(row[colCoins])) ? Number(row[colCoins]) : 0;

    const existingStudentByCode = existingCodeMap.get(code);

    if (existingStudentByCode) {
      if (importMode === 'update_existing') {
        const updatedStudent: Student = {
          ...existingStudentByCode,
          fullName: fullName || existingStudentByCode.fullName,
          dob: dob || existingStudentByCode.dob,
          gender: gender || existingStudentByCode.gender,
          teamNumber: teamNumber || existingStudentByCode.teamNumber,
          role: role || existingStudentByCode.role,
          contactPhone: contactPhone || existingStudentByCode.contactPhone,
          parentPhone: parentPhone || existingStudentByCode.parentPhone,
          notes: notes || existingStudentByCode.notes
        };
        updated.push(updatedStudent);
        previewRows.push({
          code,
          fullName,
          dob,
          gender,
          teamNumber,
          role,
          contactPhone,
          parentPhone,
          status: 'update'
        });
      } else {
        duplicates.push(`${fullName} (${code})`);
        previewRows.push({
          code,
          fullName,
          dob,
          gender,
          teamNumber,
          role,
          contactPhone,
          parentPhone,
          status: 'duplicate'
        });
      }
      continue;
    }

    // Học sinh mới hoàn toàn
    const newStudent: Student = {
      id: `hs-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      code,
      fullName,
      dob,
      gender,
      teamNumber,
      role,
      contactPhone,
      parentPhone,
      notes,
      points,
      coins
    };

    added.push(newStudent);
    existingCodeMap.set(code, newStudent);
    previewRows.push({
      code,
      fullName,
      dob,
      gender,
      teamNumber,
      role,
      contactPhone,
      parentPhone,
      status: 'new'
    });
  }

  return {
    added,
    updated,
    duplicates,
    errors,
    totalRows: previewRows.length,
    previewRows
  };
}

/**
 * Tải file Excel mẫu chuẩn dành cho giáo viên điền thông tin học sinh
 */
export function downloadStudentExcelTemplate(className: string = '9_1'): void {
  const sampleData = [
    {
      'Mã HS': 'HS001',
      'Họ và tên': 'Nguyễn Hoàng Nam',
      'Ngày sinh': '15/03/2010',
      'Giới tính': 'Nam',
      'Tổ': 'Tổ 1',
      'Chức vụ': 'Lớp trưởng',
      'SĐT học sinh': '0912345601',
      'SĐT phụ huynh': '0987654301',
      'Ghi chú': 'Chăm chỉ, gương mẫu, hỗ trợ bạn bè tốt'
    },
    {
      'Mã HS': 'HS002',
      'Họ và tên': 'Trần Bảo Châu',
      'Ngày sinh': '22/07/2010',
      'Giới tính': 'Nữ',
      'Tổ': 'Tổ 2',
      'Chức vụ': 'Lớp phó học tập',
      'SĐT học sinh': '0912345602',
      'SĐT phụ huynh': '0987654302',
      'Ghi chú': 'Học giỏi đều các môn'
    },
    {
      'Mã HS': 'HS003',
      'Họ và tên': 'Lê Minh Khôi',
      'Ngày sinh': '10/01/2010',
      'Giới tính': 'Nam',
      'Tổ': 'Tổ 3',
      'Chức vụ': 'Lớp phó lao động',
      'SĐT học sinh': '0912345603',
      'SĐT phụ huynh': '0987654303',
      'Ghi chú': 'Tích cực hoạt động nề nếp'
    },
    {
      'Mã HS': 'HS004',
      'Họ và tên': 'Phạm Gia Hân',
      'Ngày sinh': '05/11/2010',
      'Giới tính': 'Nữ',
      'Tổ': 'Tổ 1',
      'Chức vụ': 'Tổ trưởng',
      'SĐT học sinh': '0912345604',
      'SĐT phụ huynh': '0987654304',
      'Ghi chú': 'Ghi chép sổ thi đua cẩn thận'
    },
    {
      'Mã HS': 'HS005',
      'Họ và tên': 'Đặng Quang Huy',
      'Ngày sinh': '18/09/2010',
      'Giới tính': 'Nam',
      'Tổ': 'Tổ 1',
      'Chức vụ': 'Thành viên',
      'SĐT học sinh': '0912345605',
      'SĐT phụ huynh': '0987654305',
      'Ghi chú': 'Nhanh nhẹn môn Toán'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Đặt độ rộng cột đẹp mắt
  ws['!cols'] = [
    { wch: 10 }, // Mã HS
    { wch: 24 }, // Họ và tên
    { wch: 14 }, // Ngày sinh
    { wch: 10 }, // Giới tính
    { wch: 10 }, // Tổ
    { wch: 18 }, // Chức vụ
    { wch: 15 }, // SĐT HS
    { wch: 15 }, // SĐT PH
    { wch: 35 }  // Ghi chú
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DanhSachHocSinh');

  XLSX.writeFile(wb, `Mau_DanhSachHocSinh_${className}.xlsx`);
}

/**
 * Xuất danh sách học sinh hiện tại ra file Excel (.xlsx) thật sự
 */
export function exportStudentsToExcelFile(students: Student[], className: string = '9_1'): void {
  const data = students.map((s, index) => ({
    'STT': index + 1,
    'Mã HS': s.code,
    'Họ và tên': s.fullName,
    'Ngày sinh': s.dob || '',
    'Giới tính': s.gender || 'Nam',
    'Tổ': `Tổ ${s.teamNumber || 1}`,
    'Chức vụ': s.role || 'Thành viên',
    'SĐT học sinh': s.contactPhone || '',
    'SĐT phụ huynh': s.parentPhone || '',
    'Điểm thi đua': s.points,
    'Số xu thưởng': s.coins,
    'Ghi chú': s.notes || ''
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 10 }, // Mã HS
    { wch: 24 }, // Họ và tên
    { wch: 14 }, // Ngày sinh
    { wch: 10 }, // Giới tính
    { wch: 10 }, // Tổ
    { wch: 18 }, // Chức vụ
    { wch: 15 }, // SĐT HS
    { wch: 15 }, // SĐT PH
    { wch: 14 }, // Điểm thi đua
    { wch: 14 }, // Số xu
    { wch: 35 }  // Ghi chú
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DanhSachHocSinh');

  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `DanhSachHocSinh_${className}_${dateStr}.xlsx`);
}
