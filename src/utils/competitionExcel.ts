import * as XLSX from 'xlsx';
import { Student, TeamInfo, CompetitionEvent, ClassInfo } from '../types';

export interface WeeklyTeamRankingItem {
  rank: number;
  teamNumber: number;
  teamName: string;
  leaderName: string;
  memberCount: number;
  totalWeeklyPoints: number;
  avgWeeklyPoints: string;
  bonusPoints: number;
  penaltyPoints: number;
  allTimePoints: number;
}

export interface WeeklyStudentRankingItem {
  rank: number;
  studentId: string;
  code: string;
  fullName: string;
  gender: 'Nam' | 'Nữ';
  teamNumber: number;
  role: string;
  weeklyPoints: number;
  bonusCount: number;
  penaltyCount: number;
  allTimePoints: number;
}

export function getCurrentWeekRange(referenceDate: Date = new Date()): {
  startStr: string;
  endStr: string;
  label: string;
  weekNumber: number;
} {
  const d = new Date(referenceDate);
  const day = d.getDay();
  // Thứ 2 là ngày bắt đầu tuần. Nếu Chủ nhật (day === 0), trừ 6 ngày
  const diffToMonday = d.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(d.setDate(diffToMonday));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const format = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
  };

  const startStr = format(monday);
  const endStr = format(sunday);

  const firstJan = new Date(monday.getFullYear(), 0, 1);
  const days = Math.floor((monday.getTime() - firstJan.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.max(1, Math.ceil((days + firstJan.getDay() + 1) / 7));

  const displayFormat = (date: Date) => {
    const dayStr = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${dayStr}/${m}`;
  };

  return {
    startStr,
    endStr,
    label: `Tuần ${weekNumber} (${displayFormat(monday)} – ${displayFormat(sunday)})`,
    weekNumber
  };
}

export function getPreviousWeekRange(referenceDate: Date = new Date()): {
  startStr: string;
  endStr: string;
  label: string;
  weekNumber: number;
} {
  const prev = new Date(referenceDate);
  prev.setDate(prev.getDate() - 7);
  return getCurrentWeekRange(prev);
}

/**
 * Tính toán xếp hạng cá nhân và tổ trong khoảng thời gian (tuần)
 */
export function calculateWeeklyRankings(
  students: Student[],
  teams: TeamInfo[],
  events: CompetitionEvent[],
  startDate: string,
  endDate: string
): {
  teamRankings: WeeklyTeamRankingItem[];
  studentRankings: WeeklyStudentRankingItem[];
  weeklyEventsCount: number;
} {
  // Lọc các sự kiện hợp lệ trong khoảng thời gian (đã được duyệt)
  const validEvents = events.filter(e => {
    if (e.status === 'pending' || e.status === 'rejected') return false;
    return e.date >= startDate && e.date <= endDate;
  });

  // Tính điểm tuần cho từng học sinh
  const studentWeeklyMap = new Map<string, { weeklyPoints: number; bonusCount: number; penaltyCount: number }>();
  students.forEach(s => {
    studentWeeklyMap.set(s.id, { weeklyPoints: 0, bonusCount: 0, penaltyCount: 0 });
  });

  // Điểm cộng dồn trực tiếp cho cả tổ trong tuần
  const teamDirectWeeklyMap = new Map<number, { bonusPoints: number; penaltyPoints: number; totalDirect: number }>();
  [1, 2, 3, 4].forEach(n => {
    teamDirectWeeklyMap.set(n, { bonusPoints: 0, penaltyPoints: 0, totalDirect: 0 });
  });

  validEvents.forEach(ev => {
    const pts = ev.points;

    if (ev.targetType === 'individual' && ev.targetId) {
      const current = studentWeeklyMap.get(ev.targetId);
      if (current) {
        current.weeklyPoints += pts;
        if (pts > 0) current.bonusCount++;
        else if (pts < 0) current.penaltyCount++;
      }
    } else if (ev.targetType === 'team') {
      const team = teams.find(t => t.name === ev.targetName);
      const tNum = team ? team.number : 1;
      const tData = teamDirectWeeklyMap.get(tNum);
      if (tData) {
        tData.totalDirect += pts;
        if (pts > 0) tData.bonusPoints += pts;
        else if (pts < 0) tData.penaltyPoints += pts;
      }
      // Điểm tập thể tổ cũng chia cho các thành viên trong tổ
      students.filter(s => s.teamNumber === tNum).forEach(s => {
        const current = studentWeeklyMap.get(s.id);
        if (current) current.weeklyPoints += pts;
      });
    } else if (ev.targetType === 'class') {
      // Cả lớp
      students.forEach(s => {
        const current = studentWeeklyMap.get(s.id);
        if (current) current.weeklyPoints += pts;
      });
    }
  });

  // Tạo danh sách xếp hạng cá nhân trong tuần
  const studentRankings: WeeklyStudentRankingItem[] = students.map(s => {
    const wData = studentWeeklyMap.get(s.id) || { weeklyPoints: 0, bonusCount: 0, penaltyCount: 0 };
    return {
      rank: 1,
      studentId: s.id,
      code: s.code,
      fullName: s.fullName,
      gender: s.gender,
      teamNumber: s.teamNumber,
      role: s.role,
      weeklyPoints: wData.weeklyPoints,
      bonusCount: wData.bonusCount,
      penaltyCount: wData.penaltyCount,
      allTimePoints: s.points
    };
  }).sort((a, b) => {
    if (b.weeklyPoints !== a.weeklyPoints) return b.weeklyPoints - a.weeklyPoints;
    return b.allTimePoints - a.allTimePoints;
  });

  // Gán thứ hạng cá nhân
  studentRankings.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  // Tạo danh sách xếp hạng tổ trong tuần
  const teamRankings: WeeklyTeamRankingItem[] = [1, 2, 3, 4].map(teamNum => {
    const tm = teams.find(t => t.number === teamNum);
    const leaderStudent = students.find(s => s.id === tm?.leaderId);
    const members = students.filter(s => s.teamNumber === teamNum);
    const memberCount = members.length;

    // Tổng điểm của các thành viên trong tuần
    const membersWeeklyTotal = members.reduce((sum, m) => {
      const wData = studentWeeklyMap.get(m.id);
      return sum + (wData ? wData.weeklyPoints : 0);
    }, 0);

    const allTimePoints = members.reduce((sum, m) => sum + m.points, 0);

    const bonusPoints = validEvents
      .filter(e => {
        if (e.points <= 0) return false;
        if (e.targetType === 'individual' && e.targetId) {
          const st = students.find(s => s.id === e.targetId);
          return st?.teamNumber === teamNum;
        }
        if (e.targetType === 'team') {
          return e.targetName === tm?.name;
        }
        return false;
      })
      .reduce((sum, e) => sum + e.points, 0);

    const penaltyPoints = validEvents
      .filter(e => {
        if (e.points >= 0) return false;
        if (e.targetType === 'individual' && e.targetId) {
          const st = students.find(s => s.id === e.targetId);
          return st?.teamNumber === teamNum;
        }
        if (e.targetType === 'team') {
          return e.targetName === tm?.name;
        }
        return false;
      })
      .reduce((sum, e) => sum + e.points, 0);

    const avgWeeklyPoints = memberCount > 0 ? (membersWeeklyTotal / memberCount).toFixed(1) : '0';

    return {
      rank: 1,
      teamNumber: teamNum,
      teamName: tm?.name || `Tổ ${teamNum}`,
      leaderName: leaderStudent?.fullName || 'Chưa chỉ định',
      memberCount,
      totalWeeklyPoints: membersWeeklyTotal,
      avgWeeklyPoints,
      bonusPoints,
      penaltyPoints,
      allTimePoints
    };
  }).sort((a, b) => b.totalWeeklyPoints - a.totalWeeklyPoints);

  // Gán thứ hạng tổ
  teamRankings.forEach((t, idx) => {
    t.rank = idx + 1;
  });

  return {
    teamRankings,
    studentRankings,
    weeklyEventsCount: validEvents.length
  };
}

/**
 * Xuất file Excel Báo cáo Thi đua Tuần gồm nhiều Sheet chuyên nghiệp
 */
export function exportWeeklyCompetitionToExcel(
  classInfo: ClassInfo,
  weekLabel: string,
  startDate: string,
  endDate: string,
  teamRankings: WeeklyTeamRankingItem[],
  studentRankings: WeeklyStudentRankingItem[],
  events: CompetitionEvent[]
): void {
  const wb = XLSX.utils.book_new();

  // SHEET 1: Xếp hạng Tổ trong tuần
  const teamRows = [
    {
      'Thứ hạng': 'HẠNG',
      'Tên Tổ': 'TÊN TỔ SINH HOẠT',
      'Tổ trưởng': 'TỔ TRƯỞNG',
      'Sĩ số': 'SỐ HỌC SINH',
      'Tổng điểm tuần': 'TỔNG ĐIỂM TUẦN',
      'Điểm TB / HS': 'ĐIỂM TB / HS',
      'Điểm cộng (+)': 'ĐIỂM CỘNG (+)',
      'Điểm trừ (-)': 'ĐIỂM TRỪ (-)',
      'Tổng tích lũy cả kỳ': 'TỔNG ĐIỂM CẢ KỲ',
      'Đánh giá / Danh hiệu': 'DANH HIỆU THI ĐUA'
    },
    ...teamRankings.map(t => ({
      'Thứ hạng': `Hạng ${t.rank}`,
      'Tên Tổ': t.teamName,
      'Tổ trưởng': t.leaderName,
      'Sĩ số': `${t.memberCount} học sinh`,
      'Tổng điểm tuần': t.totalWeeklyPoints,
      'Điểm TB / HS': `${t.avgWeeklyPoints}đ`,
      'Điểm cộng (+)': `+${t.bonusPoints}đ`,
      'Điểm trừ (-)': `${t.penaltyPoints}đ`,
      'Tổng tích lũy cả kỳ': `${t.allTimePoints}đ`,
      'Đánh giá / Danh hiệu': t.rank === 1 ? 'Xuất Sắc Nhất Tuần (Tổ Dẫn Đầu)' : t.rank === 2 ? 'Tổ Thi Đua Tốt' : t.rank === 3 ? 'Đạt Tiêu Chuẩn' : 'Cần Nâng Cao Kỷ Luật'
    }))
  ];

  const wsTeams = XLSX.utils.json_to_sheet(teamRows, { skipHeader: true });
  wsTeams['!cols'] = [
    { wch: 12 }, // Thứ hạng
    { wch: 22 }, // Tên Tổ
    { wch: 22 }, // Tổ trưởng
    { wch: 14 }, // Sĩ số
    { wch: 18 }, // Tổng điểm tuần
    { wch: 14 }, // Điểm TB
    { wch: 14 }, // Điểm cộng
    { wch: 14 }, // Điểm trừ
    { wch: 18 }, // Cả kỳ
    { wch: 32 }  // Danh hiệu
  ];
  XLSX.utils.book_append_sheet(wb, wsTeams, 'XepHang_To_Tuan');

  // SHEET 2: Xếp hạng Cá nhân Học sinh trong tuần
  const studentRows = [
    {
      'Hạng': 'THỨ HẠNG',
      'Mã HS': 'MÃ HỌC SINH',
      'Họ và tên': 'HỌ VÀ TÊN',
      'Giới tính': 'GIỚI TÍNH',
      'Tổ': 'TỔ',
      'Chức vụ': 'CHỨC VỤ',
      'Điểm tuần': 'ĐIỂM TRONG TUẦN',
      'Lượt khen (+)': 'SỐ LƯỢT KHEN (+)',
      'Lượt nhắc (-)': 'SỐ LƯỢT NHẮC (-)',
      'Tổng điểm cả kỳ': 'TỔNG TÍCH LŨY CẢ KỲ',
      'Khen thưởng tuần': 'KHEN THƯỞNG TUẦN'
    },
    ...studentRankings.map(s => ({
      'Hạng': s.rank,
      'Mã HS': s.code,
      'Họ và tên': s.fullName,
      'Giới tính': s.gender,
      'Tổ': `Tổ ${s.teamNumber}`,
      'Chức vụ': s.role,
      'Điểm tuần': s.weeklyPoints,
      'Lượt khen (+)': s.bonusCount,
      'Lượt nhắc (-)': s.penaltyCount,
      'Tổng điểm cả kỳ': s.allTimePoints,
      'Khen thưởng tuần': s.rank === 1 ? 'Hoa tiêu Thi đua Tuần (Top 1)' : s.rank <= 3 ? 'Top 3 Xuất Sắc Tuần' : s.weeklyPoints >= 10 ? 'Tích cực' : 'Đạt yêu cầu'
    }))
  ];

  const wsStudents = XLSX.utils.json_to_sheet(studentRows, { skipHeader: true });
  wsStudents['!cols'] = [
    { wch: 8 },  // Hạng
    { wch: 12 }, // Mã HS
    { wch: 24 }, // Họ và tên
    { wch: 10 }, // Giới tính
    { wch: 10 }, // Tổ
    { wch: 18 }, // Chức vụ
    { wch: 16 }, // Điểm tuần
    { wch: 16 }, // Lượt khen
    { wch: 16 }, // Lượt nhắc
    { wch: 18 }, // Cả kỳ
    { wch: 30 }  // Khen thưởng
  ];
  XLSX.utils.book_append_sheet(wb, wsStudents, 'XepHang_CaNhan_Tuan');

  // SHEET 3: Nhật ký ghi nhận thi đua trong tuần
  const weeklyEvents = events.filter(e => e.date >= startDate && e.date <= endDate);
  const eventRows = [
    {
      'Ngày': 'NGÀY GHI NHẬN',
      'Người chấm': 'NGƯỜI CHẤM THI ĐUA',
      'Đối tượng': 'ĐỐI TƯỢNG',
      'Tên học sinh / Tổ': 'HỌC SINH / TẬP THỂ',
      'Tiêu chí': 'TIÊU CHÍ THI ĐUA',
      'Điểm': 'ĐIỂM CỘNG/TRỪ',
      'Trạng thái': 'TRẠNG THÁI DUYỆT',
      'Minh chứng / Ghi chú': 'MINH CHỨNG / TIẾT HỌC'
    },
    ...weeklyEvents.map(ev => ({
      'Ngày': ev.date,
      'Người chấm': ev.evaluatorName || 'Giáo viên',
      'Đối tượng': ev.targetType === 'individual' ? 'Cá nhân' : ev.targetType === 'team' ? 'Tổ' : 'Cả lớp',
      'Tên học sinh / Tổ': ev.targetName,
      'Tiêu chí': ev.criterionName,
      'Điểm': ev.points > 0 ? `+${ev.points}` : ev.points,
      'Trạng thái': ev.status === 'pending' ? 'Chờ duyệt' : ev.status === 'rejected' ? 'Từ chối' : 'Đã duyệt',
      'Minh chứng / Ghi chú': ev.note || '—'
    }))
  ];

  const wsEvents = XLSX.utils.json_to_sheet(eventRows, { skipHeader: true });
  wsEvents['!cols'] = [
    { wch: 14 }, // Ngày
    { wch: 26 }, // Người chấm
    { wch: 12 }, // Đối tượng
    { wch: 22 }, // Tên học sinh/tổ
    { wch: 32 }, // Tiêu chí
    { wch: 14 }, // Điểm
    { wch: 14 }, // Trạng thái
    { wch: 35 }  // Minh chứng
  ];
  XLSX.utils.book_append_sheet(wb, wsEvents, 'NhatKy_GhiNhan_Tuan');

  // Tải file về máy tính người dùng
  const classNameClean = (classInfo?.name || '9_1').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `ThiDua_Tuan_${classNameClean}_${startDate}_den_${endDate}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
