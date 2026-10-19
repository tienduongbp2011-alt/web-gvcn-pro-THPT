import * as XLSX from 'xlsx';
import { FinanceTransaction, ClassFeePlan, ClassInfo, Student } from '../types';

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

/**
 * Xuất file Excel Báo cáo Tài chính Quỹ Lớp (Thu/Chi & Đóng quỹ học sinh)
 */
export function exportFinanceToExcel(
  classInfo: ClassInfo,
  transactions: FinanceTransaction[],
  feePlan: ClassFeePlan | undefined,
  students: Student[],
  dateRangeLabel = 'Toàn bộ năm học'
): void {
  const wb = XLSX.utils.book_new();

  // Tính toán số liệu tổng hợp
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // SHEET 1: Tổng quan Quỹ Lớp
  const summaryRows = [
    { 'Mục': 'THÔNG TIN BÁO CÁO TÀI CHÍNH QUỸ LỚP', 'Giá trị': '' },
    { 'Mục': 'Lớp học', 'Giá trị': classInfo?.name || '9/1' },
    { 'Mục': 'Năm học', 'Giá trị': classInfo?.schoolYear || '2024 - 2025' },
    { 'Mục': 'Giáo viên chủ nhiệm', 'Giá trị': classInfo?.teacherName || 'Cô Nguyễn Mai Anh' },
    { 'Mục': 'Khoảng thời gian báo cáo', 'Giá trị': dateRangeLabel },
    { 'Mục': 'Ngày xuất báo cáo', 'Giá trị': new Date().toLocaleDateString('vi-VN') },
    { 'Mục': '', 'Giá trị': '' },
    { 'Mục': 'CÂN ĐỐI THU CHI HIỆN TẠI', 'Giá trị': '' },
    { 'Mục': 'TỔNG CÁC KHOẢN THU (+)', 'Giá trị': `${formatNumber(totalIncome)} đ` },
    { 'Mục': 'TỔNG CÁC KHOẢN CHI (-)', 'Giá trị': `${formatNumber(totalExpense)} đ` },
    { 'Mục': 'SỐ DƯ QUỸ HIỆN TẠI', 'Giá trị': `${formatNumber(balance)} đ` },
    { 'Mục': 'Trạng thái quỹ', 'Giá trị': balance >= 0 ? 'Dư quỹ an toàn' : 'Quỹ bị âm / Thâm hụt' },
    { 'Mục': 'Tổng số giao dịch', 'Giá trị': `${transactions.length} khoản thu/chi` }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows, { skipHeader: true });
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'TongKet_QuyLop');

  // SHEET 2: Sổ Nhật Ký Thu / Chi Chi Tiết
  const sortedTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const transactionRows = [
    {
      'STT': 'STT',
      'Ngày': 'NGÀY GIAO DỊCH',
      'Loại': 'LOẠI',
      'Khoản mục': 'NỘI DUNG THU / CHI',
      'Danh mục': 'DANH MỤC',
      'Người giao dịch': 'NGƯỜI NỘP / NGƯỜI NHẬN',
      'Số tiền (VNĐ)': 'SỐ TIỀN (VNĐ)',
      'Chứng từ': 'SỐ CHỨNG TỪ / HÓA ĐƠN',
      'Ghi chú': 'GHI CHÚ / MINH CHỨNG'
    },
    ...sortedTransactions.map((t, idx) => ({
      'STT': idx + 1,
      'Ngày': t.date,
      'Loại': t.type === 'income' ? 'THU (+)' : 'CHI (-)',
      'Khoản mục': t.title,
      'Danh mục': t.categoryName,
      'Người giao dịch': t.payerOrReceiver,
      'Số tiền (VNĐ)': t.type === 'income' ? `+${formatNumber(t.amount)}` : `-${formatNumber(t.amount)}`,
      'Chứng từ': t.invoiceNumber || '—',
      'Ghi chú': t.note || '—'
    }))
  ];

  const wsTransactions = XLSX.utils.json_to_sheet(transactionRows, { skipHeader: true });
  wsTransactions['!cols'] = [
    { wch: 8 },  // STT
    { wch: 14 }, // Ngày
    { wch: 12 }, // Loại
    { wch: 35 }, // Khoản mục
    { wch: 22 }, // Danh mục
    { wch: 25 }, // Người nộp/nhận
    { wch: 18 }, // Số tiền
    { wch: 20 }, // Chứng từ
    { wch: 35 }  // Ghi chú
  ];
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'SoThuChi_ChiTiet');

  // SHEET 3: Danh Sách Đóng Quỹ Của Học Sinh
  if (feePlan) {
    const contributionRows = [
      {
        'STT': 'STT',
        'Mã HS': 'MÃ HỌC SINH',
        'Họ và tên': 'HỌ VÀ TÊN',
        'Tổ': 'TỔ',
        'Mức quy định': 'MỨC QUY ĐỊNH (VNĐ)',
        'Đã nộp': 'ĐÃ NỘP (VNĐ)',
        'Còn thiếu': 'CÒN THIẾU (VNĐ)',
        'Trạng thái': 'TRẠNG THÁI',
        'Ngày nộp': 'NGÀY NỘP',
        'Ghi chú': 'GHI CHÚ'
      },
      ...feePlan.contributions.map((c, idx) => {
        const student = students.find(s => s.id === c.studentId);
        const remaining = Math.max(0, c.expectedAmount - c.paidAmount);
        const statusText = 
          c.status === 'paid' ? 'Đã nộp đủ' :
          c.status === 'partial' ? 'Nộp một phần' :
          c.status === 'exempt' ? 'Miễn giảm' : 'Chưa nộp';

        return {
          'STT': idx + 1,
          'Mã HS': student?.code || `HS-${idx + 1}`,
          'Họ và tên': c.studentName,
          'Tổ': `Tổ ${c.teamNumber || 1}`,
          'Mức quy định': `${formatNumber(c.expectedAmount)} đ`,
          'Đã nộp': `${formatNumber(c.paidAmount)} đ`,
          'Còn thiếu': c.status === 'exempt' ? '0 đ (Miễn)' : `${formatNumber(remaining)} đ`,
          'Trạng thái': statusText,
          'Ngày nộp': c.paidDate || '—',
          'Ghi chú': c.note || '—'
        };
      })
    ];

    const wsContributions = XLSX.utils.json_to_sheet(contributionRows, { skipHeader: true });
    wsContributions['!cols'] = [
      { wch: 8 },  // STT
      { wch: 14 }, // Mã HS
      { wch: 25 }, // Họ tên
      { wch: 10 }, // Tổ
      { wch: 20 }, // Mức quy định
      { wch: 18 }, // Đã nộp
      { wch: 18 }, // Còn thiếu
      { wch: 16 }, // Trạng thái
      { wch: 14 }, // Ngày nộp
      { wch: 30 }  // Ghi chú
    ];
    XLSX.utils.book_append_sheet(wb, wsContributions, 'TheoDoi_DongQuy');
  }

  const cleanClassName = (classInfo?.name || '9_1').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `TaiChinh_QuyLop_${cleanClassName}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
