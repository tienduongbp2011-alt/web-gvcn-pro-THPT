export interface Student {
  id: string;
  code: string; // e.g. "HS001"
  fullName: string;
  dob: string; // YYYY-MM-DD
  gender: 'Nam' | 'Nữ';
  teamNumber: number; // 1, 2, 3, 4
  role: 'Lớp trưởng' | 'Lớp phó học tập' | 'Lớp phó lao động' | 'Tổ trưởng' | 'Tổ phó' | 'Thành viên';
  contactPhone?: string;
  parentPhone?: string;
  notes?: string;
  points: number; // Điểm thi đua
  coins: number; // Xu đổi quà
}

export interface ClassInfo {
  id: string;
  name: string; // e.g. "9/1"
  grade: string; // e.g. "Khối 9"
  schoolYear: string; // e.g. "2024 - 2025"
  teacherName: string; // e.g. "Cô Nguyễn Mai Anh"
  isSampleData: boolean;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'late' | 'other';

export interface StudentAttendance {
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  records: Record<string, StudentAttendance>; // studentId -> StudentAttendance
  updatedAt: string;
}

export type AnnouncementType = 'general' | 'urgent' | 'activity' | 'meeting';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: AnnouncementType;
  isPinned: boolean;
}

export type CommentCategory = 'praise' | 'progress' | 'support' | 'reminder';

export interface StudentComment {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  category: CommentCategory;
  strengths: string;
  needsImprovement: string;
  supportAction: string;
  isResolved: boolean;
}

export interface StudyGroup {
  id: string;
  name: string;
  studentIds: string[];
}

export interface StudyGroupPlan {
  id: string;
  name: string;
  createdAt: string;
  groups: StudyGroup[];
}

export interface TeamInfo {
  number: number;
  name: string;
  leaderId?: string;
  deputyId?: string;
}

export interface CompetitionCriterion {
  id: string;
  name: string;
  type: 'bonus' | 'penalty';
  defaultPoints: number;
  category: string;
}

export interface CompetitionEvent {
  id: string;
  date: string; // YYYY-MM-DD
  targetType: 'individual' | 'team' | 'class';
  targetId?: string;
  targetName: string;
  criterionId: string;
  criterionName: string;
  points: number;
  note?: string;
  timestamp: number;
  evaluatorRole?: 'teacher' | 'leader'; // Giáo viên hay Tổ trưởng
  evaluatorName?: string; // Tên hiển thị người chấm
  evaluatorTeamNumber?: number; // Tổ của người chấm (1, 2, 3, 4)
  status?: 'approved' | 'pending' | 'rejected'; // Trạng thái phê duyệt của GV
}

export interface TeamLeaderAccount {
  teamNumber: number; // 1, 2, 3, 4
  studentId: string; // ID học sinh tổ trưởng
  pin: string; // Mã PIN đăng nhập (mặc định '1234')
  assignedTeamNumbers: number[]; // Các tổ được phân công chấm chéo
}

export interface CrossGradingSettings {
  enabled: boolean;
  ruleType: 'circular' | 'all_others' | 'custom'; // circular: 1->2, 2->3, 3->4, 4->1; all_others: 3 tổ còn lại; custom: ma trận tùy chọn
  requireTeacherApproval: boolean; // Nếu true: điểm cần GV duyệt mới tính vào học sinh
  maxPointsPerRecord: number; // Giới hạn điểm mỗi lần chấm (mặc định 10)
  allowGradingWholeTeam: boolean; // Tổ trưởng có được chấm cả tổ không hay chỉ từng học sinh
  teacherPin: string; // Mã PIN của giáo viên (mặc định '1234')
}

export type ScoreType = 'Miệng' | '15 phút' | 'Giữa kì' | 'Cuối kì' | 'Thường xuyên';

export interface GradeEntry {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  scoreType: ScoreType;
  score: number; // 0 - 10
  date: string;
  note?: string;
}

export interface SeatPosition {
  row: number;
  col: number;
  studentId?: string;
}

export interface SeatingChartData {
  rows: number;
  cols: number;
  seats: SeatPosition[];
  updatedAt: string;
}

export interface TimetablePeriod {
  period: number; // 1 - 5
  subject: string;
  teacher?: string;
  room?: string;
}

export interface DayTimetable {
  dayOfWeek: number; // 2 (Thứ 2) to 7 (Thứ 7)
  morning: TimetablePeriod[];
  afternoon: TimetablePeriod[];
}

export type TransactionType = 'income' | 'expense';

export interface FinanceCategory {
  id: string;
  name: string;
  type: TransactionType;
  color?: string;
}

export interface FinanceTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType; // 'income' (Thu) | 'expense' (Chi)
  amount: number; // VNĐ
  categoryId: string;
  categoryName: string;
  title: string; // Nội dung khoản thu / chi
  payerOrReceiver: string; // Người nộp / Người nhận tiền
  note?: string; // Ghi chú, diễn giải, hóa đơn
  invoiceNumber?: string; // Số hóa đơn / phiếu thu chi
  createdAt: string;
}

export interface ClassFeeContribution {
  studentId: string;
  studentName: string;
  teamNumber: number;
  expectedAmount: number; // Mức thu theo kế hoạch (VNĐ)
  paidAmount: number; // Số tiền thực tế đã nộp (VNĐ)
  status: 'paid' | 'partial' | 'unpaid' | 'exempt'; // Đã nộp đủ, Nộp một phần, Chưa nộp, Miễn giảm
  paidDate?: string;
  note?: string;
}

export interface ClassFeePlan {
  id: string;
  title: string; // Tên đợt thu (ví dụ: Thu Quỹ lớp Học kỳ I)
  term: 'HK1' | 'HK2' | 'Cả năm' | 'Đột xuất';
  amountPerStudent: number; // Số tiền / học sinh
  startDate: string;
  dueDate: string;
  description?: string;
  contributions: ClassFeeContribution[];
}

export interface AppSettings {
  soundEnabled: boolean;
  syncPointsAndCoins: boolean;
  isPeriodFrozen: boolean;
}

export interface ClassProStore {
  classes: ClassInfo[];
  currentClassId: string;
  students: Student[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  comments: StudentComment[];
  groupPlans: StudyGroupPlan[];
  teams: TeamInfo[];
  criteria: CompetitionCriterion[];
  competitionEvents: CompetitionEvent[];
  grades: GradeEntry[];
  seatingChart: SeatingChartData;
  timetable: DayTimetable[];
  financeTransactions?: FinanceTransaction[];
  financeCategories?: FinanceCategory[];
  feePlans?: ClassFeePlan[];
  settings: AppSettings;
  leaderAccounts?: TeamLeaderAccount[];
  crossGradingSettings?: CrossGradingSettings;
}

