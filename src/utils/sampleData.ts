import {
  ClassInfo,
  Student,
  TeamInfo,
  CompetitionCriterion,
  CompetitionEvent,
  AttendanceRecord,
  Announcement,
  StudentComment,
  SeatingChartData,
  DayTimetable,
  FinanceTransaction,
  FinanceCategory,
  ClassFeePlan,
  StudyGroupPlan,
  ClassProStore
} from '../types';

export const DEFAULT_CRITERIA: CompetitionCriterion[] = [
  { id: 'crit-1', name: 'Phát biểu sôi nổi xây dựng bài', type: 'bonus', defaultPoints: 2, category: 'Học tập' },
  { id: 'crit-2', name: 'Chuẩn bị bài và đồ dùng học tập tốt', type: 'bonus', defaultPoints: 2, category: 'Học tập' },
  { id: 'crit-3', name: 'Đạt điểm tốt (9 - 10) trong bài kiểm tra', type: 'bonus', defaultPoints: 5, category: 'Học tập' },
  { id: 'crit-4', name: 'Chủ động hỗ trợ bạn cùng tiến', type: 'bonus', defaultPoints: 3, category: 'Nề nếp' },
  { id: 'crit-5', name: 'Trực nhật lớp sạch sẽ, trách nhiệm', type: 'bonus', defaultPoints: 3, category: 'Lao động' },
  { id: 'crit-6', name: 'Tích cực tham gia hoạt động phong trào', type: 'bonus', defaultPoints: 4, category: 'Phong trào' },
  { id: 'crit-7', name: 'Đi học muộn không lý do chính đáng', type: 'penalty', defaultPoints: 2, category: 'Chuyên cần' },
  { id: 'crit-8', name: 'Chưa làm bài tập về nhà', type: 'penalty', defaultPoints: 3, category: 'Học tập' },
  { id: 'crit-9', name: 'Mất trật tự trong giờ học', type: 'penalty', defaultPoints: 2, category: 'Nề nếp' },
  { id: 'crit-10', name: 'Vệ sinh khu vực ngồi chưa gọn gàng', type: 'penalty', defaultPoints: 2, category: 'Lao động' }
];

export const INITIAL_SAMPLE_STUDENTS: Student[] = [
  {
    id: 'hs-1',
    code: 'HS001',
    fullName: 'Nguyễn Hoàng Nam',
    dob: '2010-03-15',
    gender: 'Nam',
    teamNumber: 1,
    role: 'Lớp trưởng',
    contactPhone: '0912345601',
    parentPhone: '0987654301',
    notes: 'Có tinh thần trách nhiệm cao, quản lý lớp tốt',
    points: 48,
    coins: 35
  },
  {
    id: 'hs-2',
    code: 'HS002',
    fullName: 'Trần Bảo Châu',
    dob: '2010-07-22',
    gender: 'Nữ',
    teamNumber: 2,
    role: 'Lớp phó học tập',
    contactPhone: '0912345602',
    parentPhone: '0987654302',
    notes: 'Học đều các môn, hay kèm các bạn học yếu',
    points: 52,
    coins: 40
  },
  {
    id: 'hs-3',
    code: 'HS003',
    fullName: 'Lê Minh Khôi',
    dob: '2010-01-10',
    gender: 'Nam',
    teamNumber: 3,
    role: 'Lớp phó lao động',
    contactPhone: '0912345603',
    parentPhone: '0987654303',
    notes: 'Nhiệt tình phụ trách nề nếp và vệ sinh lớp',
    points: 44,
    coins: 30
  },
  {
    id: 'hs-4',
    code: 'HS004',
    fullName: 'Phạm Gia Hân',
    dob: '2010-11-05',
    gender: 'Nữ',
    teamNumber: 1,
    role: 'Tổ trưởng',
    contactPhone: '0912345604',
    parentPhone: '0987654304',
    notes: 'Ghi sổ thi đua tổ đầy đủ, cẩn thận',
    points: 46,
    coins: 32
  },
  {
    id: 'hs-5',
    code: 'HS005',
    fullName: 'Đặng Quang Huy',
    dob: '2010-09-18',
    gender: 'Nam',
    teamNumber: 1,
    role: 'Tổ phó',
    contactPhone: '0912345605',
    parentPhone: '0987654305',
    notes: 'Tập trung tốt, môn Toán rất nhanh nhẹn',
    points: 40,
    coins: 25
  },
  {
    id: 'hs-6',
    code: 'HS006',
    fullName: 'Vũ Thùy Linh',
    dob: '2010-04-12',
    gender: 'Nữ',
    teamNumber: 2,
    role: 'Tổ trưởng',
    contactPhone: '0912345606',
    parentPhone: '0987654306',
    notes: 'Chữ viết đẹp, hay giúp trang trí bảng lớp',
    points: 42,
    coins: 28
  },
  {
    id: 'hs-7',
    code: 'HS007',
    fullName: 'Hoàng Tuấn Kiệt',
    dob: '2010-06-30',
    gender: 'Nam',
    teamNumber: 2,
    role: 'Tổ phó',
    contactPhone: '0912345607',
    parentPhone: '0987654307',
    notes: 'Yêu thích môn Khoa học tự nhiên, năng nổ',
    points: 38,
    coins: 20
  },
  {
    id: 'hs-8',
    code: 'HS008',
    fullName: 'Bùi Khánh An',
    dob: '2010-12-08',
    gender: 'Nữ',
    teamNumber: 3,
    role: 'Tổ trưởng',
    contactPhone: '0912345608',
    parentPhone: '0987654308',
    notes: 'Nghiêm túc, lễ phép với thầy cô',
    points: 45,
    coins: 30
  },
  {
    id: 'hs-9',
    code: 'HS009',
    fullName: 'Đỗ Minh Nhật',
    dob: '2010-05-14',
    gender: 'Nam',
    teamNumber: 3,
    role: 'Tổ phó',
    contactPhone: '0912345609',
    parentPhone: '0987654309',
    notes: 'Hát hay, tích cực sinh hoạt văn nghệ',
    points: 36,
    coins: 18
  },
  {
    id: 'hs-10',
    code: 'HS010',
    fullName: 'Phan Thanh Trúc',
    dob: '2010-08-25',
    gender: 'Nữ',
    teamNumber: 4,
    role: 'Tổ trưởng',
    contactPhone: '0912345610',
    parentPhone: '0987654310',
    notes: 'Có khả năng tổ chức trò chơi tập thể',
    points: 43,
    coins: 28
  },
  {
    id: 'hs-11',
    code: 'HS011',
    fullName: 'Ngô Gia Bảo',
    dob: '2010-02-19',
    gender: 'Nam',
    teamNumber: 4,
    role: 'Tổ phó',
    contactPhone: '0912345611',
    parentPhone: '0987654311',
    notes: 'Khá hiếu động, cần nhắc nhở trật tự lúc đầu giờ',
    points: 31,
    coins: 15
  },
  {
    id: 'hs-12',
    code: 'HS012',
    fullName: 'Dương Phương Anh',
    dob: '2010-10-02',
    gender: 'Nữ',
    teamNumber: 1,
    role: 'Thành viên',
    contactPhone: '0912345612',
    parentPhone: '0987654312',
    notes: 'Hơi rụt rè khi phát biểu, cần động viên nhiều hơn',
    points: 37,
    coins: 22
  },
  {
    id: 'hs-13',
    code: 'HS013',
    fullName: 'Trịnh Quốc Hưng',
    dob: '2010-03-28',
    gender: 'Nam',
    teamNumber: 2,
    role: 'Thành viên',
    contactPhone: '0912345613',
    parentPhone: '0987654313',
    notes: 'Tiến bộ rõ môn Tiếng Anh trong tháng này',
    points: 39,
    coins: 24
  },
  {
    id: 'hs-14',
    code: 'HS014',
    fullName: 'Mai Thảo My',
    dob: '2010-09-09',
    gender: 'Nữ',
    teamNumber: 3,
    role: 'Thành viên',
    contactPhone: '0912345614',
    parentPhone: '0987654314',
    notes: 'Chuẩn bị bài chu đáo, nộp bài đúng hạn',
    points: 41,
    coins: 26
  },
  {
    id: 'hs-15',
    code: 'HS015',
    fullName: 'Võ Đức Thắng',
    dob: '2010-07-04',
    gender: 'Nam',
    teamNumber: 4,
    role: 'Thành viên',
    contactPhone: '0912345615',
    parentPhone: '0987654315',
    notes: 'Thể thao tốt, tham gia đội bóng rổ của trường',
    points: 35,
    coins: 20
  }
];

export const INITIAL_TEAMS: TeamInfo[] = [
  { number: 1, name: 'Tổ 1 – Tia Chớp', leaderId: 'hs-4', deputyId: 'hs-5' },
  { number: 2, name: 'Tổ 2 – Đoàn Kết', leaderId: 'hs-6', deputyId: 'hs-7' },
  { number: 3, name: 'Tổ 3 – Bứt Phá', leaderId: 'hs-8', deputyId: 'hs-9' },
  { number: 4, name: 'Tổ 4 – Sáng Tạo', leaderId: 'hs-10', deputyId: 'hs-11' }
];

export const INITIAL_FINANCE_CATEGORIES: FinanceCategory[] = [
  // Khoản Thu
  { id: 'cat-in-1', name: 'Đóng quỹ lớp (Kỳ I / Kỳ II)', type: 'income', color: 'emerald' },
  { id: 'cat-in-2', name: 'Quỹ Hội Cha Mẹ Học Sinh tài trợ', type: 'income', color: 'teal' },
  { id: 'cat-in-3', name: 'Tiền thưởng phong trào / Nhà trường', type: 'income', color: 'blue' },
  { id: 'cat-in-4', name: 'Ủng hộ / Thu khác', type: 'income', color: 'indigo' },
  // Khoản Chi
  { id: 'cat-out-1', name: 'Văn phòng phẩm & Bút phấn', type: 'expense', color: 'amber' },
  { id: 'cat-out-2', name: 'Nước uống & Dụng cụ vệ sinh lớp', type: 'expense', color: 'cyan' },
  { id: 'cat-out-3', name: 'Photo tài liệu, đề thi, bài tập', type: 'expense', color: 'purple' },
  { id: 'cat-out-4', name: 'Khen thưởng thi đua tuần / tháng', type: 'expense', color: 'yellow' },
  { id: 'cat-out-5', name: 'Liên hoan Trung thu / Lễ 20-11 / Sinh nhật', type: 'expense', color: 'rose' },
  { id: 'cat-out-6', name: 'Hoạt động ngoại khóa / Trải nghiệm', type: 'expense', color: 'orange' },
  { id: 'cat-out-7', name: 'Thăm hỏi ốm đau / Tương trợ', type: 'expense', color: 'red' }
];

export const INITIAL_FINANCE_TRANSACTIONS: FinanceTransaction[] = [
  {
    id: 'tx-1',
    date: '2026-09-08',
    type: 'income',
    amount: 3800000,
    categoryId: 'cat-in-1',
    categoryName: 'Đóng quỹ lớp (Kỳ I / Kỳ II)',
    title: 'Thu Quỹ Lớp Học Kỳ I (Đợt 1 - 38 học sinh x 100.000đ)',
    payerOrReceiver: 'Ban đại diện CMHS / Thủ quỹ lớp',
    note: 'Đã thu của 38 bạn, còn 2 bạn xin gia hạn nộp sau',
    invoiceNumber: 'PT-01-HK1',
    createdAt: '2026-09-08T08:30:00.000Z'
  },
  {
    id: 'tx-2',
    date: '2026-09-12',
    type: 'income',
    amount: 1500000,
    categoryId: 'cat-in-2',
    categoryName: 'Quỹ Hội Cha Mẹ Học Sinh tài trợ',
    title: 'Hội Phụ huynh trích quỹ tài trợ hoạt động học tập & phong trào',
    payerOrReceiver: 'Bác Trần Văn Hùng (Trưởng ban CMHS)',
    note: 'Hỗ trợ lớp mua sắm cơ sở vật chất đầu năm và nước uống',
    invoiceNumber: 'PT-02-CMHS',
    createdAt: '2026-09-12T09:00:00.000Z'
  },
  {
    id: 'tx-3',
    date: '2026-09-15',
    type: 'expense',
    amount: 185000,
    categoryId: 'cat-out-1',
    categoryName: 'Văn phòng phẩm & Bút phấn',
    title: 'Mua hộp bút dạ bảng Thiên Long (10 cây) + 2 bông lau bảng',
    payerOrReceiver: 'Nhà sách Fahasa Quận',
    note: 'Có hóa đơn bán lẻ kèm theo, phục vụ giáo viên bộ môn giảng dạy',
    invoiceNumber: 'PC-01-VPP',
    createdAt: '2026-09-15T15:20:00.000Z'
  },
  {
    id: 'tx-4',
    date: '2026-09-22',
    type: 'expense',
    amount: 240000,
    categoryId: 'cat-out-2',
    categoryName: 'Nước uống & Dụng cụ vệ sinh lớp',
    title: 'Đổi 4 bình nước khoáng Lavie 19L + 1 lốc cốc giấy dùng một lần',
    payerOrReceiver: 'Đại lý nước uống Hòa Phát',
    note: 'Tiền nước uống tháng 9 cho cả lớp',
    invoiceNumber: 'PC-02-NUOC',
    createdAt: '2026-09-22T10:15:00.000Z'
  },
  {
    id: 'tx-5',
    date: '2026-09-28',
    type: 'expense',
    amount: 1150000,
    categoryId: 'cat-out-5',
    categoryName: 'Liên hoan Trung thu / Lễ 20-11 / Sinh nhật',
    title: 'Tổ chức tiệc Vui Tết Trung Thu ấm áp cho cả lớp',
    payerOrReceiver: 'Siêu thị Co.opmart (Ban phụ huynh mua)',
    note: 'Mua bánh nướng, bánh dẻo, trái cây ngũ quả và trà sữa cho 40 em',
    invoiceNumber: 'PC-03-TRUNGTHU',
    createdAt: '2026-09-28T16:00:00.000Z'
  },
  {
    id: 'tx-6',
    date: '2026-10-05',
    type: 'income',
    amount: 500000,
    categoryId: 'cat-in-3',
    categoryName: 'Tiền thưởng phong trào / Nhà trường',
    title: 'Tiền thưởng Giải Nhì Hội thao Kéo co Chào mừng năm học mới',
    payerOrReceiver: 'Ban Chấp hành Đoàn Đội nhà trường',
    note: 'Lớp 9/1 đạt giải Nhì toàn trường khối 8-9',
    invoiceNumber: 'PT-03-GIAITHUONG',
    createdAt: '2026-10-05T07:45:00.000Z'
  },
  {
    id: 'tx-7',
    date: '2026-10-10',
    type: 'expense',
    amount: 320000,
    categoryId: 'cat-out-3',
    categoryName: 'Photo tài liệu, đề thi, bài tập',
    title: 'In ấn photo Đề cương ôn tập Giữa học kỳ I (Toán, Văn, KHTN)',
    payerOrReceiver: 'Tiệm in photocopy Tuấn Anh trước cổng trường',
    note: 'Photo cho 40 học sinh lớp 9/1 (mỗi bạn 1 tập 16 trang)',
    invoiceNumber: 'PC-04-PHOTO',
    createdAt: '2026-10-10T11:30:00.000Z'
  },
  {
    id: 'tx-8',
    date: '2026-10-14',
    type: 'expense',
    amount: 280000,
    categoryId: 'cat-out-4',
    categoryName: 'Khen thưởng thi đua tuần / tháng',
    title: 'Mua phần thưởng vinh danh 5 học sinh tiêu biểu tháng 9',
    payerOrReceiver: 'Nhà sách Trí Tuệ',
    note: '5 cuốn sổ tay bìa da pastel + bộ bút gel xinh xắn',
    invoiceNumber: 'PC-05-KHENTHUONG',
    createdAt: '2026-10-14T14:10:00.000Z'
  }
];

export const INITIAL_FEE_PLAN: ClassFeePlan = {
  id: 'fee-plan-hk1',
  title: 'Thu Quỹ Lớp Học Kỳ I (Năm học 2024 - 2025)',
  term: 'HK1',
  amountPerStudent: 100000,
  startDate: '2026-09-05',
  dueDate: '2026-09-25',
  description: 'Dùng chi tiêu nước uống hằng ngày, photo tài liệu đề cương ôn tập, khen thưởng tuần/tháng và các hoạt động chung của lớp.',
  contributions: [
    { studentId: 'hs-1', studentName: 'Nguyễn Hoàng Nam', teamNumber: 1, expectedAmount: 100000, paidAmount: 100000, status: 'paid', paidDate: '2026-09-06' },
    { studentId: 'hs-2', studentName: 'Trần Bảo Châu', teamNumber: 1, expectedAmount: 100000, paidAmount: 100000, status: 'paid', paidDate: '2026-09-06' },
    { studentId: 'hs-3', studentName: 'Lê Minh Khôi', teamNumber: 1, expectedAmount: 100000, paidAmount: 100000, status: 'paid', paidDate: '2026-09-07' },
    { studentId: 'hs-4', studentName: 'Phạm Gia Hân', teamNumber: 1, expectedAmount: 100000, paidAmount: 100000, status: 'paid', paidDate: '2026-09-06' },
    { studentId: 'hs-5', studentName: 'Đặng Quang Huy', teamNumber: 2, expectedAmount: 100000, paidAmount: 100000, status: 'paid', paidDate: '2026-09-08' },
    { studentId: 'hs-6', studentName: 'Vũ Thùy Linh', teamNumber: 2, expectedAmount: 100000, paidAmount: 100000, status: 'paid', paidDate: '2026-09-08' },
    { studentId: 'hs-7', studentName: 'Bùi Anh Tuấn', teamNumber: 2, expectedAmount: 100000, paidAmount: 100000, status: 'paid', paidDate: '2026-09-08' },
    { studentId: 'hs-8', studentName: 'Hoàng Minh Châu', teamNumber: 3, expectedAmount: 100000, paidAmount: 100000, status: 'paid', paidDate: '2026-09-07' },
    { studentId: 'hs-9', studentName: 'Đỗ Tuấn Kiệt', teamNumber: 3, expectedAmount: 100000, paidAmount: 50000, status: 'partial', paidDate: '2026-09-10', note: 'Xin nộp trước 50k, đợt 2 nộp nốt' },
    { studentId: 'hs-10', studentName: 'Phan Thanh Trúc', teamNumber: 4, expectedAmount: 100000, paidAmount: 100000, status: 'paid', paidDate: '2026-09-06' },
    { studentId: 'hs-11', studentName: 'Ngô Gia Bảo', teamNumber: 4, expectedAmount: 100000, paidAmount: 0, status: 'unpaid', note: 'Phụ huynh hẹn cuối tuần nộp qua chuyển khoản' },
    { studentId: 'hs-12', studentName: 'Dương Phương Anh', teamNumber: 4, expectedAmount: 100000, paidAmount: 100000, status: 'paid', paidDate: '2026-09-09' },
    { studentId: 'hs-13', studentName: 'Võ Minh Khang', teamNumber: 2, expectedAmount: 100000, paidAmount: 100000, status: 'paid', paidDate: '2026-09-07' },
    { studentId: 'hs-14', studentName: 'Lý Thảo My', teamNumber: 3, expectedAmount: 100000, paidAmount: 100000, status: 'paid', paidDate: '2026-09-07' },
    { studentId: 'hs-15', studentName: 'Đinh Tiến Đạt', teamNumber: 3, expectedAmount: 100000, paidAmount: 0, status: 'exempt', note: 'Gia đình diện con thương binh - được lớp miễn đóng quỹ' },
    { studentId: 'hs-16', studentName: 'Mai Tuệ Mẫn', teamNumber: 1, expectedAmount: 100000, paidAmount: 100000, status: 'paid', paidDate: '2026-09-08' }
  ]
};


export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Kế hoạch sinh hoạt chuyên đề: An toàn trên không gian mạng',
    content: 'Thứ 6 tuần này lớp sẽ có 1 tiết sinh hoạt chuyên đề do Tổ 2 và Tổ 3 cùng điều hành. Các bạn chuẩn bị video clip ngắn và 5 câu hỏi đố vui nhé!',
    date: '2026-10-15',
    type: 'meeting',
    isPinned: true
  },
  {
    id: 'ann-2',
    title: 'Nhắc nhở ôn tập kiểm tra giữa học kỳ I',
    content: 'Các tổ trưởng đôn đốc thành viên trong tổ ôn tập các môn Toán, Văn, KHTN và Tiếng Anh. Lớp mình cố gắng giữ vững danh hiệu Chi đội mạnh!',
    date: '2026-10-12',
    type: 'general',
    isPinned: false
  },
  {
    id: 'ann-3',
    title: 'Đăng ký tham gia Giải Bóng đá THCS cấp trường',
    content: 'Hạn chót gửi danh sách cầu thủ cho bạn Lê Minh Khôi (Lớp phó) vào chiều thứ 5. Khuyến khích cả lớp cổ vũ nhiệt tình.',
    date: '2026-10-10',
    type: 'activity',
    isPinned: false
  }
];

export const INITIAL_COMMENTS: StudentComment[] = [
  {
    id: 'comm-1',
    studentId: 'hs-2',
    studentName: 'Trần Bảo Châu',
    date: '2026-10-14',
    category: 'praise',
    strengths: 'Rất chủ động giúp đỡ bạn Dương Phương Anh ôn tập môn Toán',
    needsImprovement: 'Cần giữ gìn sức khỏe, tránh thức khuya làm bài',
    supportAction: 'Cô biểu dương trước giờ sinh hoạt lớp và tặng 5 điểm thi đua',
    isResolved: true
  },
  {
    id: 'comm-2',
    studentId: 'hs-11',
    studentName: 'Ngô Gia Bảo',
    date: '2026-10-16',
    category: 'reminder',
    strengths: 'Thông minh, tiếp thu bài học rất nhanh khi tập trung',
    needsImprovement: 'Đầu giờ thỉnh thoảng còn nói chuyện tự do với bạn bên cạnh',
    supportAction: 'Đã trao đổi riêng để em đăng ký làm tổ phó quản nề nếp tổ 4',
    isResolved: false
  },
  {
    id: 'comm-3',
    studentId: 'hs-12',
    studentName: 'Dương Phương Anh',
    date: '2026-10-11',
    category: 'progress',
    strengths: 'Tuần này đã tự tin giơ tay phát biểu môn Ngữ Văn 2 lần',
    needsImprovement: 'Cần nói to hơn khi đứng lên trả lời',
    supportAction: 'Khích lệ bằng tràng pháo tay của cả lớp và ghi điểm cộng',
    isResolved: true
  }
];

export const INITIAL_TIMETABLE: DayTimetable[] = [
  {
    dayOfWeek: 2, // Thứ 2
    morning: [
      { period: 1, subject: 'Chào cờ', room: 'Sân trường' },
      { period: 2, subject: 'Toán', teacher: 'Thầy Dũng', room: 'Phòng 204' },
      { period: 3, subject: 'Toán', teacher: 'Thầy Dũng', room: 'Phòng 204' },
      { period: 4, subject: 'Ngữ văn', teacher: 'Cô Mai Anh', room: 'Phòng 204' },
      { period: 5, subject: 'Tiếng Anh', teacher: 'Cô Thu', room: 'Phòng 204' }
    ],
    afternoon: [
      { period: 1, subject: 'KHTN (Lý)', teacher: 'Thầy Hưng', room: 'Phòng Lab 1' },
      { period: 2, subject: 'KHTN (Hóa)', teacher: 'Cô Nga', room: 'Phòng Lab 2' }
    ]
  },
  {
    dayOfWeek: 3, // Thứ 3
    morning: [
      { period: 1, subject: 'Ngữ văn', teacher: 'Cô Mai Anh', room: 'Phòng 204' },
      { period: 2, subject: 'Ngữ văn', teacher: 'Cô Mai Anh', room: 'Phòng 204' },
      { period: 3, subject: 'KHTN (Sinh)', teacher: 'Cô Lan', room: 'Phòng 204' },
      { period: 4, subject: 'Lịch sử & Địa lí', teacher: 'Thầy Tuấn', room: 'Phòng 204' },
      { period: 5, subject: 'GDTC (Thể dục)', teacher: 'Thầy Bình', room: 'Nhà đa năng' }
    ],
    afternoon: []
  },
  {
    dayOfWeek: 4, // Thứ 4
    morning: [
      { period: 1, subject: 'Toán', teacher: 'Thầy Dũng', room: 'Phòng 204' },
      { period: 2, subject: 'Tin học', teacher: 'Thầy Minh', room: 'Phòng Máy 2' },
      { period: 3, subject: 'Tiếng Anh', teacher: 'Cô Thu', room: 'Phòng 204' },
      { period: 4, subject: 'KHTN (Lý)', teacher: 'Thầy Hưng', room: 'Phòng 204' },
      { period: 5, subject: 'Công nghệ', teacher: 'Cô Hạnh', room: 'Phòng 204' }
    ],
    afternoon: [
      { period: 1, subject: 'Bồi dưỡng Toán', teacher: 'Thầy Dũng', room: 'Phòng 204' },
      { period: 2, subject: 'Bồi dưỡng Văn', teacher: 'Cô Mai Anh', room: 'Phòng 204' }
    ]
  },
  {
    dayOfWeek: 5, // Thứ 5
    morning: [
      { period: 1, subject: 'Tiếng Anh', teacher: 'Cô Thu', room: 'Phòng 204' },
      { period: 2, subject: 'GDCD', teacher: 'Cô Mai Anh', room: 'Phòng 204' },
      { period: 3, subject: 'Lịch sử & Địa lí', teacher: 'Thầy Tuấn', room: 'Phòng 204' },
      { period: 4, subject: 'Nghệ thuật (Âm nhạc)', teacher: 'Cô Oanh', room: 'Phòng 204' },
      { period: 5, subject: 'GDTC (Thể dục)', teacher: 'Thầy Bình', room: 'Sân cỏ' }
    ],
    afternoon: []
  },
  {
    dayOfWeek: 6, // Thứ 6
    morning: [
      { period: 1, subject: 'Toán', teacher: 'Thầy Dũng', room: 'Phòng 204' },
      { period: 2, subject: 'Ngữ văn', teacher: 'Cô Mai Anh', room: 'Phòng 204' },
      { period: 3, subject: 'KHTN (Hóa)', teacher: 'Cô Nga', room: 'Phòng 204' },
      { period: 4, subject: 'HĐTN, HN', teacher: 'Cô Mai Anh', room: 'Phòng 204' },
      { period: 5, subject: 'Sinh hoạt lớp', teacher: 'Cô Mai Anh', room: 'Phòng 204' }
    ],
    afternoon: []
  },
  {
    dayOfWeek: 7, // Thứ 7
    morning: [
      { period: 1, subject: 'Ôn tập chung', teacher: 'Giáo viên bộ môn', room: 'Phòng 204' },
      { period: 2, subject: 'Sinh hoạt CLB', teacher: 'Đoàn Đội', room: 'Hội trường' }
    ],
    afternoon: []
  }
];

export function getInitialSampleStore(): ClassProStore {
  const sampleClass: ClassInfo = {
    id: 'class-demo-9-1',
    name: '9/1',
    grade: 'Khối 9',
    schoolYear: '2024 - 2025',
    teacherName: 'Cô Nguyễn Mai Anh',
    isSampleData: true,
    createdAt: new Date().toISOString()
  };

  // Seating chart 4 rows x 4 cols
  const seats = [];
  const students = INITIAL_SAMPLE_STUDENTS;
  let sIndex = 0;
  for (let r = 1; r <= 4; r++) {
    for (let c = 1; c <= 4; c++) {
      seats.push({
        row: r,
        col: c,
        studentId: sIndex < students.length ? students[sIndex].id : undefined
      });
      sIndex++;
    }
  }

  // Today attendance
  const todayStr = new Date().toISOString().split('T')[0];
  const attendanceToday: Record<string, { status: 'present' | 'excused' | 'unexcused' | 'late' | 'other'; note?: string }> = {};
  students.forEach((s, idx) => {
    if (idx === 4) {
      attendanceToday[s.id] = { status: 'late', note: 'Hỏng xe, đến muộn 10 phút' };
    } else if (idx === 10) {
      attendanceToday[s.id] = { status: 'excused', note: 'Gia đình có đơn xin phép đi khám bệnh' };
    } else {
      attendanceToday[s.id] = { status: 'present' };
    }
  });

  const sampleEvents: CompetitionEvent[] = [
    {
      id: 'evt-1',
      date: todayStr,
      targetType: 'individual',
      targetId: 'hs-2',
      targetName: 'Trần Bảo Châu',
      criterionId: 'crit-1',
      criterionName: 'Phát biểu sôi nổi xây dựng bài',
      points: 2,
      note: 'Tiết Ngữ văn, tích cực trả lời câu hỏi',
      timestamp: Date.now() - 3600000 * 3,
      evaluatorRole: 'leader',
      evaluatorName: 'Tổ trưởng Tổ 1 - Phạm Gia Hân',
      evaluatorTeamNumber: 1,
      status: 'approved'
    },
    {
      id: 'evt-2',
      date: todayStr,
      targetType: 'team',
      targetName: 'Tổ 1 – Tia Chớp',
      criterionId: 'crit-5',
      criterionName: 'Trực nhật lớp sạch sẽ, trách nhiệm',
      points: 3,
      note: 'Lau bảng và dọn bục giảng rất sạch',
      timestamp: Date.now() - 3600000 * 5,
      evaluatorRole: 'teacher',
      evaluatorName: 'Cô Nguyễn Mai Anh (GVCN)',
      status: 'approved'
    },
    {
      id: 'evt-3',
      date: todayStr,
      targetType: 'individual',
      targetId: 'hs-5',
      targetName: 'Đặng Quang Huy',
      criterionId: 'crit-7',
      criterionName: 'Đi học muộn không lý do chính đáng',
      points: -2,
      note: 'Đến lớp sau hiệu lệnh trống 10 phút',
      timestamp: Date.now() - 3600000 * 6,
      evaluatorRole: 'leader',
      evaluatorName: 'Tổ trưởng Tổ 4 - Phan Thanh Trúc',
      evaluatorTeamNumber: 4,
      status: 'approved'
    },
    {
      id: 'evt-4',
      date: todayStr,
      targetType: 'individual',
      targetId: 'hs-1',
      targetName: 'Nguyễn Hoàng Nam',
      criterionId: 'crit-4',
      criterionName: 'Chủ động hỗ trợ bạn cùng tiến',
      points: 3,
      note: 'Hướng dẫn bạn hoàn thành phiếu bài tập KHTN',
      timestamp: Date.now() - 3600000 * 7,
      evaluatorRole: 'teacher',
      evaluatorName: 'Cô Nguyễn Mai Anh (GVCN)',
      status: 'approved'
    }
  ];

  const sampleGroupPlan: StudyGroupPlan = {
    id: 'grp-plan-1',
    name: 'Dự án STEM: Khám phá hệ sinh thái địa phương',
    createdAt: new Date().toISOString(),
    groups: [
      { id: 'g1', name: 'Nhóm 1: Rừng ngập mặn', studentIds: ['hs-1', 'hs-2', 'hs-3', 'hs-4'] },
      { id: 'g2', name: 'Nhóm 2: Đồi cát & Ven biển', studentIds: ['hs-5', 'hs-6', 'hs-7', 'hs-8'] },
      { id: 'g3', name: 'Nhóm 3: Đồng bằng sông nước', studentIds: ['hs-9', 'hs-10', 'hs-11', 'hs-12'] },
      { id: 'g4', name: 'Nhóm 4: Nông nghiệp công nghệ cao', studentIds: ['hs-13', 'hs-14', 'hs-15'] }
    ]
  };

  return {
    classes: [sampleClass],
    currentClassId: sampleClass.id,
    students: INITIAL_SAMPLE_STUDENTS,
    attendance: [
      {
        date: todayStr,
        records: attendanceToday,
        updatedAt: new Date().toISOString()
      }
    ],
    announcements: INITIAL_ANNOUNCEMENTS,
    comments: INITIAL_COMMENTS,
    groupPlans: [sampleGroupPlan],
    teams: INITIAL_TEAMS,
    criteria: DEFAULT_CRITERIA,
    competitionEvents: sampleEvents,
    grades: [
      { id: 'grd-1', studentId: 'hs-1', studentName: 'Nguyễn Hoàng Nam', subject: 'Toán', scoreType: '15 phút', score: 9.0, date: todayStr, note: 'Làm bài nhanh và chính xác' },
      { id: 'grd-2', studentId: 'hs-2', studentName: 'Trần Bảo Châu', subject: 'Ngữ văn', scoreType: 'Miệng', score: 9.5, date: todayStr, note: 'Đọc diễn cảm, phân tích sâu sắc' },
      { id: 'grd-3', studentId: 'hs-5', studentName: 'Đặng Quang Huy', subject: 'Toán', scoreType: '15 phút', score: 8.5, date: todayStr, note: 'Tốt' },
      { id: 'grd-4', studentId: 'hs-11', studentName: 'Ngô Gia Bảo', subject: 'Tiếng Anh', scoreType: 'Miệng', score: 7.5, date: todayStr, note: 'Cần chú ý phát âm âm đuôi' }
    ],
    seatingChart: {
      rows: 4,
      cols: 4,
      seats,
      updatedAt: new Date().toISOString()
    },
    timetable: INITIAL_TIMETABLE,
    financeTransactions: INITIAL_FINANCE_TRANSACTIONS,
    financeCategories: INITIAL_FINANCE_CATEGORIES,
    feePlans: [INITIAL_FEE_PLAN],
    settings: {
      soundEnabled: true,
      syncPointsAndCoins: false,
      isPeriodFrozen: false
    },
    leaderAccounts: [
      { teamNumber: 1, studentId: 'hs-4', pin: '1234', assignedTeamNumbers: [2] },
      { teamNumber: 2, studentId: 'hs-6', pin: '1234', assignedTeamNumbers: [3] },
      { teamNumber: 3, studentId: 'hs-8', pin: '1234', assignedTeamNumbers: [4] },
      { teamNumber: 4, studentId: 'hs-10', pin: '1234', assignedTeamNumbers: [1] }
    ],
    crossGradingSettings: {
      enabled: true,
      ruleType: 'circular',
      requireTeacherApproval: false,
      maxPointsPerRecord: 10,
      allowGradingWholeTeam: true,
      teacherPin: '1234'
    }
  };
}
