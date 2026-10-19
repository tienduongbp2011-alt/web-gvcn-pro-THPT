import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Printer, 
  Download, 
  Users, 
  CalendarCheck, 
  Trophy, 
  WalletCards, 
  MessageSquare,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { ClassProStore } from '../types';
import { exportAttendanceReportCsv, exportCompetitionReportCsv, exportStudentsCsv } from '../utils/storage';

interface ReportsViewProps {
  store: ClassProStore;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ store }) => {
  const currentClass = store.classes.find(c => c.id === store.currentClassId) || store.classes[0];
  const students = store.students;

  // Attendance metrics
  const attendanceStats = useMemo(() => {
    let totalPresent = 0;
    let totalExcused = 0;
    let totalUnexcused = 0;
    let totalLate = 0;

    store.attendance.forEach(rec => {
      Object.values(rec.records).forEach(item => {
        if (item.status === 'present') totalPresent++;
        else if (item.status === 'excused') totalExcused++;
        else if (item.status === 'unexcused') totalUnexcused++;
        else if (item.status === 'late') totalLate++;
      });
    });

    const totalMarked = totalPresent + totalExcused + totalUnexcused + totalLate;
    const rate = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 100;
    return { totalPresent, totalExcused, totalUnexcused, totalLate, rate, daysCount: store.attendance.length };
  }, [store.attendance]);

  // Competition summary
  const competitionStats = useMemo(() => {
    const totalEvents = store.competitionEvents.length;
    const bonusEvents = store.competitionEvents.filter(e => e.points > 0).length;
    const penaltyEvents = store.competitionEvents.filter(e => e.points < 0).length;
    const totalPointsAwarded = store.competitionEvents.reduce((acc, e) => acc + e.points, 0);

    return { totalEvents, bonusEvents, penaltyEvents, totalPointsAwarded };
  }, [store.competitionEvents]);

  // Team rankings
  const teamRankings = useMemo(() => {
    return [1, 2, 3, 4].map(teamNum => {
      const tm = store.teams.find(t => t.number === teamNum);
      const members = students.filter(s => s.teamNumber === teamNum);
      const totalPoints = members.reduce((sum, s) => sum + s.points, 0);
      return {
        teamNum,
        name: tm ? tm.name : `Tổ ${teamNum}`,
        memberCount: members.length,
        totalPoints
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [students, store.teams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Báo Cáo & Thống Kê Tổng Hợp</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Báo cáo toàn diện tình hình chuyên cần, thi đua nề nếp và khen thưởng Lớp {currentClass?.name || '9/1'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportStudentsCsv(students, currentClass?.name || '9_1')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất toàn bộ HS</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>In báo cáo tổng kết</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 printable-area">
        {/* Report Official Heading */}
        <div className="text-center pb-4 border-b border-slate-200">
          <div className="text-xs uppercase font-semibold text-slate-500">TRƯỜNG THCS QUẬN / HUYỆN</div>
          <h1 className="text-lg font-bold text-slate-900 mt-1">BÁO CÁO CÔNG TÁC CHỦ NHIỆM LỚP HỌC</h1>
          <p className="text-xs text-slate-600 mt-1">
            Lớp: <strong>{currentClass?.name || '9/1'}</strong> · Khối: <strong>{currentClass?.grade || 'Khối 9'}</strong> · Năm học: <strong>{currentClass?.schoolYear || '2024 - 2025'}</strong>
          </p>
          <p className="text-xs text-slate-500">Giáo viên chủ nhiệm: <strong>{currentClass?.teacherName || 'Cô Mai Anh'}</strong></p>
        </div>

        {/* Section 1: Overview KPIs */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            I. Các chỉ số tổng quan lớp học
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Sĩ số học sinh:</span>
              <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">{students.length} em</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Tỷ lệ chuyên cần:</span>
              <span className="text-xl font-bold text-teal-700 font-mono tabular-nums">{attendanceStats.rate}%</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Số lượt thi đua:</span>
              <span className="text-xl font-bold text-amber-600 font-mono tabular-nums">{competitionStats.totalEvents} lượt</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Số dư Quỹ Lớp:</span>
              <span className="text-xl font-bold text-teal-700 font-mono tabular-nums">
                {new Intl.NumberFormat('vi-VN').format(
                  (store.financeTransactions || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) -
                  (store.financeTransactions || []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
                )} đ
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Attendance Details */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            II. Tình hình chuyên cần học tập
          </h3>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Tổng số buổi đã tổ chức điểm danh:</span>
              <span className="font-semibold text-slate-900 font-mono">{attendanceStats.daysCount} buổi</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Tổng lượt học sinh có mặt đúng giờ:</span>
              <span className="font-semibold text-emerald-700 font-mono">{attendanceStats.totalPresent} lượt</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Tổng lượt nghỉ học có phép (được gia đình xác nhận):</span>
              <span className="font-semibold text-blue-700 font-mono">{attendanceStats.totalExcused} lượt</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Tổng lượt nghỉ không phép:</span>
              <span className="font-semibold text-red-600 font-mono">{attendanceStats.totalUnexcused} lượt</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Tổng lượt đi học muộn:</span>
              <span className="font-semibold text-amber-700 font-mono">{attendanceStats.totalLate} lượt</span>
            </div>
          </div>
        </div>

        {/* Section 3: Competition & Team Ranking */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            III. Kết quả phong trào thi đua các Tổ
          </h3>
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 font-semibold text-slate-700">
              <tr>
                <th className="py-2.5 px-3">Xếp hạng</th>
                <th className="py-2.5 px-3">Tên Tổ sinh hoạt</th>
                <th className="py-2.5 px-3">Sĩ số</th>
                <th className="py-2.5 px-3 text-right">Tổng điểm thi đua</th>
                <th className="py-2.5 px-3 text-right">Trung bình / HS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamRankings.map((t, idx) => (
                <tr key={t.teamNum}>
                  <td className="py-2.5 px-3 font-bold font-mono">Hạng {idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{t.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{t.memberCount} em</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-700 tabular-nums">{t.totalPoints}đ</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 tabular-nums">
                    {t.memberCount > 0 ? (t.totalPoints / t.memberCount).toFixed(1) : 0}đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 4: Individual Top Performers */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            IV. Danh sách học sinh tiêu biểu xuất sắc
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[...students].sort((a, b) => b.points - a.points).slice(0, 3).map((s, idx) => (
              <div key={s.id} className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-xs">
                <div className="font-bold text-slate-900 text-sm">{s.fullName}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">Tổ {s.teamNumber} · {s.role}</div>
                <div className="mt-2 font-mono font-bold text-amber-700">
                  {s.points} điểm thi đua · {s.coins} xu thưởng
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signature Box for Print */}
        <div className="pt-8 border-t border-slate-200 flex items-start justify-between text-xs text-center">
          <div className="w-48">
            <span className="font-bold text-slate-800 block">LỚP TRƯỞNG</span>
            <span className="text-slate-400 text-[11px] italic block mt-0.5">(Ký và ghi rõ họ tên)</span>
            <div className="h-16"></div>
            <span className="font-semibold text-slate-800">
              {students.find(s => s.role === 'Lớp trưởng')?.fullName || 'Nguyễn Hoàng Nam'}
            </span>
          </div>

          <div className="w-56">
            <span className="text-slate-500 text-[11px] block italic">
              ..., ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
            </span>
            <span className="font-bold text-slate-800 block mt-1">GIÁO VIÊN CHỦ NHIỆM</span>
            <span className="text-slate-400 text-[11px] italic block mt-0.5">(Ký và ghi rõ họ tên)</span>
            <div className="h-16"></div>
            <span className="font-semibold text-slate-800">
              {currentClass?.teacherName || 'Cô Nguyễn Mai Anh'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
