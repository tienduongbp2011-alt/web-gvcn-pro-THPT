import { Student, TeamInfo, TeamLeaderAccount, CrossGradingSettings } from '../types';

export const DEFAULT_CROSS_SETTINGS: CrossGradingSettings = {
  enabled: true,
  ruleType: 'circular', // 1->2, 2->3, 3->4, 4->1
  requireTeacherApproval: false,
  maxPointsPerRecord: 10,
  allowGradingWholeTeam: true,
  teacherPin: '1234'
};

/**
 * Tạo danh sách tài khoản 4 tổ trưởng mặc định dựa trên danh sách tổ và học sinh
 */
export function buildDefaultLeaderAccounts(teams: TeamInfo[], students: Student[]): TeamLeaderAccount[] {
  const teamNumbers = [1, 2, 3, 4];

  return teamNumbers.map(teamNum => {
    const team = teams.find(t => t.number === teamNum);
    
    // Tìm học sinh là tổ trưởng
    let leaderStudent = students.find(s => s.id === team?.leaderId);
    if (!leaderStudent) {
      leaderStudent = students.find(s => s.teamNumber === teamNum && s.role === 'Tổ trưởng');
    }
    if (!leaderStudent) {
      leaderStudent = students.find(s => s.teamNumber === teamNum);
    }

    // Phân công chấm chéo mặc định vòng tròn: 1->2, 2->3, 3->4, 4->1
    const defaultAssigned = teamNum === 4 ? [1] : [teamNum + 1];

    return {
      teamNumber: teamNum,
      studentId: leaderStudent?.id || '',
      pin: '1234',
      assignedTeamNumbers: defaultAssigned
    };
  });
}

/**
 * Đồng bộ hoặc khởi tạo tài khoản tổ trưởng nếu chưa có hoặc khi danh sách tổ thay đổi
 */
export function ensureLeaderAccounts(
  existingAccounts: TeamLeaderAccount[] | undefined,
  teams: TeamInfo[],
  students: Student[]
): TeamLeaderAccount[] {
  const defaults = buildDefaultLeaderAccounts(teams, students);
  if (!existingAccounts || existingAccounts.length === 0) {
    return defaults;
  }

  // Kết hợp thông tin hiện có (giữ lại mã PIN và cấu hình đã đổi)
  return [1, 2, 3, 4].map(teamNum => {
    const existing = existingAccounts.find(a => a.teamNumber === teamNum);
    const def = defaults.find(d => d.teamNumber === teamNum)!;
    const team = teams.find(t => t.number === teamNum);
    const designatedLeader = students.find(s => s.id === team?.leaderId) || students.find(s => s.id === existing?.studentId);

    return {
      teamNumber: teamNum,
      studentId: designatedLeader?.id || existing?.studentId || def.studentId,
      pin: existing?.pin || '1234',
      assignedTeamNumbers: existing?.assignedTeamNumbers && existing.assignedTeamNumbers.length > 0
        ? existing.assignedTeamNumbers
        : def.assignedTeamNumbers
    };
  });
}

/**
 * Lấy danh sách số thứ tự các tổ mà tổ trưởng được phép chấm chéo theo quy chế
 */
export function getAssignedTeamsForLeader(
  teamNumber: number,
  settings: CrossGradingSettings,
  accounts: TeamLeaderAccount[]
): number[] {
  if (settings.ruleType === 'circular') {
    // 1 -> 2, 2 -> 3, 3 -> 4, 4 -> 1
    return [teamNumber === 4 ? 1 : teamNumber + 1];
  }

  if (settings.ruleType === 'all_others') {
    // Chấm tất cả 3 tổ còn lại (trừ tổ của chính mình)
    return [1, 2, 3, 4].filter(n => n !== teamNumber);
  }

  // Chế độ tùy chỉnh 'custom': Lấy từ tài khoản được gán
  const acc = accounts.find(a => a.teamNumber === teamNumber);
  if (acc && acc.assignedTeamNumbers && acc.assignedTeamNumbers.length > 0) {
    // Không bao giờ cho phép tự chấm tổ mình
    return acc.assignedTeamNumbers.filter(n => n !== teamNumber);
  }

  // Mặc định an toàn
  return [teamNumber === 4 ? 1 : teamNumber + 1];
}

/**
 * Kiểm tra xem một học sinh có thuộc tổ được phân công chấm chéo hay không
 */
export function isStudentCrossGradable(
  targetStudentTeamNum: number,
  leaderTeamNum: number,
  assignedTeams: number[]
): boolean {
  if (targetStudentTeamNum === leaderTeamNum) return false; // Tuyệt đối không tự chấm tổ mình
  return assignedTeams.includes(targetStudentTeamNum);
}
