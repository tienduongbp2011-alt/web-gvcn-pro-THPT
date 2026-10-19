import { ClassProStore, Student, AttendanceRecord, CompetitionEvent } from '../types';
import { getInitialSampleStore } from './sampleData';

const STORAGE_KEY = 'CLASS_PRO_DATA_V1';

export function loadStore(): ClassProStore {
  if (typeof window === 'undefined') {
    return getInitialSampleStore();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialSampleStore();
      saveStore(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    // basic sanity checks
    if (!parsed.classes || !Array.isArray(parsed.classes) || !parsed.students) {
      const initial = getInitialSampleStore();
      saveStore(initial);
      return initial;
    }
    // ensure finance data is initialized if upgrading from older store
    if (!parsed.financeTransactions) {
      const initial = getInitialSampleStore();
      parsed.financeTransactions = initial.financeTransactions;
      parsed.financeCategories = initial.financeCategories;
      parsed.feePlans = initial.feePlans;
      saveStore(parsed);
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load store from localStorage', e);
    const initial = getInitialSampleStore();
    return initial;
  }
}

export function saveStore(store: ClassProStore): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save store to localStorage', e);
  }
}

export function exportBackupJson(store: ClassProStore): void {
  const currentClass = store.classes.find(c => c.id === store.currentClassId) || store.classes[0];
  const className = currentClass ? currentClass.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'lop';
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `SaoLuu_ClassPro_${className}_${dateStr}.json`;
  
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackupJson(jsonString: string): { success: boolean; data?: ClassProStore; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.classes || !Array.isArray(parsed.classes) || !parsed.students || !Array.isArray(parsed.students)) {
      return { success: false, error: 'File JSON không đúng cấu trúc Class Pro hợp lệ!' };
    }
    return { success: true, data: parsed };
  } catch {
    return { success: false, error: 'Định dạng file JSON bị lỗi cú pháp!' };
  }
}

export function exportStudentsCsv(students: Student[], className = 'Lop'): void {
  const headers = ['Mã HS', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Tổ', 'Chức vụ', 'SĐT học sinh', 'SĐT phụ huynh', 'Ghi chú', 'Điểm thi đua', 'Số xu'];
  const rows = students.map(s => [
    `"${s.code}"`,
    `"${s.fullName}"`,
    `"${s.dob || ''}"`,
    `"${s.gender || 'Nam'}"`,
    `"${s.teamNumber || 1}"`,
    `"${s.role || 'Thành viên'}"`,
    `"${s.contactPhone || ''}"`,
    `"${s.parentPhone || ''}"`,
    `"${(s.notes || '').replace(/"/g, '""')}"`,
    `"${s.points}"`,
    `"${s.coins}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DanhSachHocSinh_${className}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseStudentsCsv(csvText: string, currentStudents: Student[]): { added: Student[]; duplicates: string[]; errors: string[] } {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return { added: [], duplicates: [], errors: ['File CSV trống hoặc không có dòng tiêu đề.'] };
  }

  const existingCodes = new Set(currentStudents.map(s => s.code.toLowerCase()));
  const existingNames = new Set(currentStudents.map(s => s.fullName.toLowerCase()));
  
  const added: Student[] = [];
  const duplicates: string[] = [];
  const errors: string[] = [];

  // Parse lines, skip header (index 0)
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Simple CSV row parser handling quotes
    const cells: string[] = [];
    let inQuotes = false;
    let currentCell = '';
    for (let c = 0; c < rawLine.length; c++) {
      const char = rawLine[c];
      if (char === '"' && (c === 0 || rawLine[c - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

    if (cells.length < 2 || !cells[1]) {
      continue; // Skip invalid or empty row
    }

    const code = cells[0] || `HS${String(currentStudents.length + added.length + 1).padStart(3, '0')}`;
    const fullName = cells[1].trim();

    if (existingCodes.has(code.toLowerCase())) {
      duplicates.push(`Mã HS trùng: ${code} (${fullName})`);
      continue;
    }
    if (existingNames.has(fullName.toLowerCase())) {
      duplicates.push(`Tên trùng với HS hiện có: ${fullName}`);
    }

    const dob = cells[2] || '';
    const gender = (cells[3] && cells[3].toLowerCase() === 'nữ') ? 'Nữ' : 'Nam';
    const teamNum = parseInt(cells[4], 10) || 1;
    const role = (cells[5] as Student['role']) || 'Thành viên';
    const contactPhone = cells[6] || '';
    const parentPhone = cells[7] || '';
    const notes = cells[8] || '';
    const points = parseInt(cells[9], 10) || 0;
    const coins = parseInt(cells[10], 10) || 0;

    const newStudent: Student = {
      id: `hs-import-${Date.now()}-${i}`,
      code,
      fullName,
      dob,
      gender,
      teamNumber: Math.min(Math.max(teamNum, 1), 6),
      role,
      contactPhone,
      parentPhone,
      notes,
      points,
      coins
    };

    existingCodes.add(code.toLowerCase());
    added.push(newStudent);
  }

  return { added, duplicates, errors };
}

export function exportAttendanceReportCsv(attendanceList: AttendanceRecord[], students: Student[], className: string): void {
  const headers = ['Ngày', 'Mã HS', 'Họ và tên', 'Tổ', 'Trạng thái', 'Ghi chú'];
  const statusLabels: Record<string, string> = {
    present: 'Có mặt',
    excused: 'Vắng có phép',
    unexcused: 'Vắng không phép',
    late: 'Đi muộn',
    other: 'Khác'
  };

  const rows: string[][] = [];
  attendanceList.forEach(rec => {
    students.forEach(s => {
      const att = rec.records[s.id];
      if (att) {
        rows.push([
          `"${rec.date}"`,
          `"${s.code}"`,
          `"${s.fullName}"`,
          `"Tổ ${s.teamNumber}"`,
          `"${statusLabels[att.status] || att.status}"`,
          `"${(att.note || '').replace(/"/g, '""')}"`
        ]);
      }
    });
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BaoCaoDiemDanh_${className}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCompetitionReportCsv(events: CompetitionEvent[], className: string): void {
  const headers = ['Thời gian', 'Đối tượng', 'Tên học sinh / Tập thể', 'Tiêu chí thi đua', 'Điểm cộng / trừ', 'Người chấm thi đua', 'Trạng thái duyệt', 'Ghi chú minh chứng'];
  const rows = events.map(ev => [
    `"${ev.date}"`,
    `"${ev.targetType === 'individual' ? 'Cá nhân' : ev.targetType === 'team' ? 'Tổ' : 'Cả lớp'}"`,
    `"${ev.targetName}"`,
    `"${ev.criterionName}"`,
    `"${ev.points > 0 ? `+${ev.points}` : ev.points}"`,
    `"${ev.evaluatorName || (ev.evaluatorRole === 'leader' ? `Tổ trưởng Tổ ${ev.evaluatorTeamNumber}` : 'Giáo viên')}"`,
    `"${ev.status === 'pending' ? 'Chờ duyệt' : ev.status === 'rejected' ? 'Từ chối' : 'Đã duyệt'}"`,
    `"${(ev.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BaoCaoThiDua_${className}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
