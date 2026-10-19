import React, { useState, useMemo } from 'react';
import { 
  CalendarCheck, 
  CheckCircle2, 
  Clock, 
  UserX, 
  HelpCircle, 
  Download, 
  Printer, 
  Save, 
  History,
  Calendar,
  Users
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus, ClassProStore } from '../types';
import { soundManager } from '../utils/audio';
import { exportAttendanceReportCsv } from '../utils/storage';

interface AttendanceViewProps {
  store: ClassProStore;
  onUpdateStore: (updater: (prev: ClassProStore) => ClassProStore) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  store,
  onUpdateStore
}) => {
  const currentClass = store.classes.find(c => c.id === store.currentClassId) || store.classes[0];
  const students = store.students;

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeTab, setActiveTab] = useState<'daily' | 'history' | 'stats'>('daily');
  const [savedNotice, setSavedNotice] = useState(false);

  // Current working day attendance state
  const currentAttendance = useMemo(() => {
    return store.attendance.find(a => a.date === selectedDate);
  }, [store.attendance, selectedDate]);

  // Local editing records for this date
  const [localRecords, setLocalRecords] = useState<Record<string, { status: AttendanceStatus; note?: string }>>(() => {
    if (currentAttendance) return { ...currentAttendance.records };
    const initial: Record<string, { status: AttendanceStatus; note?: string }> = {};
    students.forEach(s => {
      initial[s.id] = { status: 'present' };
    });
    return initial;
  });

  // When selectedDate changes, reload local records
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const existing = store.attendance.find(a => a.date === newDate);
    if (existing) {
      setLocalRecords({ ...existing.records });
    } else {
      const initial: Record<string, { status: AttendanceStatus; note?: string }> = {};
      students.forEach(s => {
        initial[s.id] = { status: 'present' };
      });
      setLocalRecords(initial);
    }
  };

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    soundManager.playClick(store.settings.soundEnabled);
    setLocalRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleSetNote = (studentId: string, note: string) => {
    setLocalRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note
      }
    }));
  };

  const handleMarkAllPresent = () => {
    soundManager.playSuccess(store.settings.soundEnabled);
    const updated: Record<string, { status: AttendanceStatus; note?: string }> = {};
    students.forEach(s => {
      updated[s.id] = { status: 'present', note: localRecords[s.id]?.note };
    });
    setLocalRecords(updated);
  };

  const handleSaveAttendance = () => {
    onUpdateStore(prev => {
      const existingIdx = prev.attendance.findIndex(a => a.date === selectedDate);
      const newRecord: AttendanceRecord = {
        date: selectedDate,
        records: localRecords,
        updatedAt: new Date().toISOString()
      };

      let newAttendanceList: AttendanceRecord[];
      if (existingIdx >= 0) {
        newAttendanceList = [...prev.attendance];
        newAttendanceList[existingIdx] = newRecord;
      } else {
        newAttendanceList = [newRecord, ...prev.attendance];
      }

      return {
        ...prev,
        attendance: newAttendanceList
      };
    });

    soundManager.playSuccess(store.settings.soundEnabled);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Summary counts for current selectedDate
  const dailySummary = useMemo(() => {
    let present = 0, excused = 0, unexcused = 0, late = 0, other = 0;
    students.forEach(s => {
      const st = localRecords[s.id]?.status || 'present';
      if (st === 'present') present++;
      else if (st === 'excused') excused++;
      else if (st === 'unexcused') unexcused++;
      else if (st === 'late') late++;
      else if (st === 'other') other++;
    });
    const total = students.length || 1;
    const rate = Math.round((present / total) * 100);
    return { present, excused, unexcused, late, other, rate };
  }, [students, localRecords]);

  // Overall attendance statistics
  const overallStats = useMemo(() => {
    const totalDaysRecorded = store.attendance.length;
    let totalPresent = 0;
    let totalExcused = 0;
    let totalUnexcused = 0;
    let totalLate = 0;
    let totalExpected = totalDaysRecorded * (students.length || 1);

    store.attendance.forEach(rec => {
      Object.values(rec.records).forEach(item => {
        if (item.status === 'present') totalPresent++;
        else if (item.status === 'excused') totalExcused++;
        else if (item.status === 'unexcused') totalUnexcused++;
        else if (item.status === 'late') totalLate++;
      });
    });

    const averageRate = totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 100;
    return { totalDaysRecorded, totalPresent, totalExcused, totalUnexcused, totalLate, averageRate };
  }, [store.attendance, students]);

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Điểm danh Chuyên cần</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi hiện diện hằng ngày, quản lý học sinh đi muộn hoặc xin phép
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'daily' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Điểm danh hôm nay
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'history' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lịch sử các ngày
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'stats' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thống kê tổng hợp
            </button>
          </div>

          <button
            onClick={() => exportAttendanceReportCsv(store.attendance, students, currentClass?.name || '9_1')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In sổ điểm danh</span>
          </button>
        </div>
      </div>

      {activeTab === 'daily' && (
        <>
          {/* Date Picker Bar & Quick Action */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Ngày điểm danh:</span>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={e => handleDateChange(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
              />
              {selectedDate === todayStr && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  Hôm nay
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllPresent}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Cả lớp có mặt</span>
              </button>

              <button
                onClick={handleSaveAttendance}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Lưu điểm danh</span>
              </button>
            </div>
          </div>

          {savedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã lưu thành công dữ liệu điểm danh ngày <strong>{selectedDate}</strong> vào bộ nhớ máy.</span>
            </div>
          )}

          {/* Quick Summary Pill Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-emerald-50/70 border border-emerald-200/60 p-3 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase block">Có mặt</span>
              <span className="text-xl font-bold text-emerald-700 font-mono tabular-nums">{dailySummary.present}</span>
            </div>
            <div className="bg-blue-50/70 border border-blue-200/60 p-3 rounded-xl">
              <span className="text-[11px] font-semibold text-blue-800 uppercase block">Vắng có phép</span>
              <span className="text-xl font-bold text-blue-700 font-mono tabular-nums">{dailySummary.excused}</span>
            </div>
            <div className="bg-red-50/70 border border-red-200/60 p-3 rounded-xl">
              <span className="text-[11px] font-semibold text-red-800 uppercase block">Vắng không phép</span>
              <span className="text-xl font-bold text-red-700 font-mono tabular-nums">{dailySummary.unexcused}</span>
            </div>
            <div className="bg-amber-50/70 border border-amber-200/60 p-3 rounded-xl">
              <span className="text-[11px] font-semibold text-amber-800 uppercase block">Đi muộn</span>
              <span className="text-xl font-bold text-amber-700 font-mono tabular-nums">{dailySummary.late}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-600 uppercase block">Tỷ lệ chuyên cần</span>
              <span className="text-xl font-bold text-slate-800 font-mono tabular-nums">{dailySummary.rate}%</span>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs printable-area">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-3 w-24">Mã HS</th>
                    <th className="py-3 px-3">Họ và tên</th>
                    <th className="py-3 px-3 w-20">Tổ</th>
                    <th className="py-3 px-3">Trạng thái điểm danh</th>
                    <th className="py-3 px-3">Lý do / Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s, idx) => {
                    const status = localRecords[s.id]?.status || 'present';
                    const note = localRecords[s.id]?.note || '';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono tabular-nums">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{s.code}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{s.fullName}</td>
                        <td className="py-2.5 px-3 text-slate-600">Tổ {s.teamNumber}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleSetStatus(s.id, 'present')}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                                status === 'present'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Có mặt
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStatus(s.id, 'excused')}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                                status === 'excused'
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Có phép
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStatus(s.id, 'unexcused')}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                                status === 'unexcused'
                                  ? 'bg-red-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Không phép
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStatus(s.id, 'late')}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                                status === 'late'
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Đi muộn
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            placeholder="Nhập lý do nếu vắng..."
                            value={note}
                            onChange={e => handleSetNote(s.id, e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        Chưa có học sinh trong danh sách lớp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Lịch sử các buổi điểm danh đã lưu</h3>
          <div className="divide-y divide-slate-100">
            {store.attendance.map(rec => {
              let p = 0, e = 0, u = 0, l = 0;
              Object.values(rec.records).forEach(item => {
                if (item.status === 'present') p++;
                else if (item.status === 'excused') e++;
                else if (item.status === 'unexcused') u++;
                else if (item.status === 'late') l++;
              });

              return (
                <div key={rec.date} className="py-3 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-semibold text-slate-900 font-mono text-xs">{rec.date}</span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Có mặt: <span className="text-emerald-700 font-semibold">{p}</span> · 
                      Vắng phép: <span className="text-blue-700 font-semibold">{e}</span> · 
                      Vắng K.phép: <span className="text-red-700 font-semibold">{u}</span> · 
                      Đi muộn: <span className="text-amber-700 font-semibold">{l}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleDateChange(rec.date);
                      setActiveTab('daily');
                    }}
                    className="px-3 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                  >
                    Xem & Chỉnh sửa
                  </button>
                </div>
              );
            })}
            {store.attendance.length === 0 && (
              <p className="py-6 text-center text-slate-400 text-xs">Chưa có lịch sử điểm danh nào.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 block">Số buổi đã điểm danh</span>
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1 block">
                {overallStats.totalDaysRecorded} buổi
              </span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 block">Tỷ lệ chuyên cần trung bình</span>
              <span className="text-2xl font-bold text-teal-700 font-mono tabular-nums mt-1 block">
                {overallStats.averageRate}%
              </span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 block">Tổng số lượt đi muộn</span>
              <span className="text-2xl font-bold text-amber-600 font-mono tabular-nums mt-1 block">
                {overallStats.totalLate} lượt
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
