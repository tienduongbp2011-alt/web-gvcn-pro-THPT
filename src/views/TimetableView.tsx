import React, { useState } from 'react';
import { 
  CalendarDays, 
  Printer, 
  Edit3, 
  Plus, 
  Save, 
  Trash2, 
  Sun, 
  Moon,
  Clock
} from 'lucide-react';
import { DayTimetable, TimetablePeriod, ClassProStore } from '../types';
import { soundManager } from '../utils/audio';

const DAYS = [
  { day: 2, label: 'Thứ Hai' },
  { day: 3, label: 'Thứ Ba' },
  { day: 4, label: 'Thứ Tư' },
  { day: 5, label: 'Thứ Năm' },
  { day: 6, label: 'Thứ Sáu' },
  { day: 7, label: 'Thứ Bảy' }
];

interface TimetableViewProps {
  store: ClassProStore;
  onUpdateStore: (updater: (prev: ClassProStore) => ClassProStore) => void;
}

export const TimetableView: React.FC<TimetableViewProps> = ({
  store,
  onUpdateStore
}) => {
  const currentClass = store.classes.find(c => c.id === store.currentClassId) || store.classes[0];
  const timetable = store.timetable || [];

  const [editingPeriod, setEditingPeriod] = useState<{
    dayOfWeek: number;
    session: 'morning' | 'afternoon';
    period: number;
    subject: string;
    teacher?: string;
    room?: string;
  } | null>(null);

  const handleOpenEdit = (dayOfWeek: number, session: 'morning' | 'afternoon', periodNum: number) => {
    soundManager.playClick(store.settings.soundEnabled);
    const day = timetable.find(d => d.dayOfWeek === dayOfWeek);
    const existing = day ? (session === 'morning' ? day.morning : day.afternoon).find(p => p.period === periodNum) : undefined;

    setEditingPeriod({
      dayOfWeek,
      session,
      period: periodNum,
      subject: existing ? existing.subject : '',
      teacher: existing ? existing.teacher : '',
      room: existing ? existing.room : 'Phòng 204'
    });
  };

  const handleSavePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeriod) return;

    onUpdateStore(prev => {
      const newTimetable = [...prev.timetable];
      let dayIdx = newTimetable.findIndex(d => d.dayOfWeek === editingPeriod.dayOfWeek);

      if (dayIdx === -1) {
        newTimetable.push({
          dayOfWeek: editingPeriod.dayOfWeek,
          morning: [],
          afternoon: []
        });
        dayIdx = newTimetable.length - 1;
      }

      const dayObj = { ...newTimetable[dayIdx] };
      const sessionList = editingPeriod.session === 'morning' ? [...dayObj.morning] : [...dayObj.afternoon];
      const pIdx = sessionList.findIndex(p => p.period === editingPeriod.period);

      if (editingPeriod.subject.trim() === '') {
        // Delete
        if (pIdx >= 0) sessionList.splice(pIdx, 1);
      } else {
        const periodData: TimetablePeriod = {
          period: editingPeriod.period,
          subject: editingPeriod.subject.trim(),
          teacher: editingPeriod.teacher?.trim(),
          room: editingPeriod.room?.trim()
        };
        if (pIdx >= 0) {
          sessionList[pIdx] = periodData;
        } else {
          sessionList.push(periodData);
        }
      }

      if (editingPeriod.session === 'morning') {
        dayObj.morning = sessionList;
      } else {
        dayObj.afternoon = sessionList;
      }
      newTimetable[dayIdx] = dayObj;

      return {
        ...prev,
        timetable: newTimetable
      };
    });

    soundManager.playSuccess(store.settings.soundEnabled);
    setEditingPeriod(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Thời Khóa Biểu</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lịch học các môn trong tuần của Lớp {currentClass?.name || '9/1'} · Nhấn vào ô để chỉnh sửa môn và giáo viên
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>In thời khóa biểu</span>
        </button>
      </div>

      {/* Timetable Weekly Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs printable-area">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white font-semibold text-center text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3 border border-slate-700 w-24">Buổi / Tiết</th>
                {DAYS.map(d => (
                  <th key={d.day} className="py-3 px-3 border border-slate-700 w-44">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Morning Session Header */}
              <tr className="bg-teal-50/80 font-bold text-teal-900 border-b border-teal-200">
                <td colSpan={7} className="py-1.5 px-4 flex items-center gap-1.5 text-xs">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>BUỔI SÁNG (Tiết 1 - 5)</span>
                </td>
              </tr>

              {/* 5 Morning periods */}
              {[1, 2, 3, 4, 5].map(periodNum => (
                <tr key={`m-${periodNum}`} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 border border-slate-200 text-center font-mono font-semibold text-slate-600 bg-slate-50">
                    Tiết {periodNum}
                  </td>
                  {DAYS.map(d => {
                    const dayObj = timetable.find(item => item.dayOfWeek === d.day);
                    const period = dayObj?.morning.find(p => p.period === periodNum);

                    return (
                      <td
                        key={d.day}
                        onClick={() => handleOpenEdit(d.day, 'morning', periodNum)}
                        className="py-2 px-3 border border-slate-200 cursor-pointer hover:bg-teal-50/50 transition-colors"
                      >
                        {period ? (
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">{period.subject}</span>
                            <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                              <span>{period.teacher || '—'}</span>
                              <span className="font-mono text-slate-400">{period.room || ''}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[11px] italic block text-center no-print">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Afternoon Session Header */}
              <tr className="bg-blue-50/80 font-bold text-blue-900 border-y border-blue-200">
                <td colSpan={7} className="py-1.5 px-4 flex items-center gap-1.5 text-xs">
                  <Moon className="w-3.5 h-3.5 text-blue-500" />
                  <span>BUỔI CHIỀU (Bồi dưỡng & Hoạt động chuyên đề)</span>
                </td>
              </tr>

              {/* 3 Afternoon periods */}
              {[1, 2, 3].map(periodNum => (
                <tr key={`a-${periodNum}`} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 border border-slate-200 text-center font-mono font-semibold text-slate-600 bg-slate-50">
                    Tiết {periodNum}
                  </td>
                  {DAYS.map(d => {
                    const dayObj = timetable.find(item => item.dayOfWeek === d.day);
                    const period = dayObj?.afternoon.find(p => p.period === periodNum);

                    return (
                      <td
                        key={d.day}
                        onClick={() => handleOpenEdit(d.day, 'afternoon', periodNum)}
                        className="py-2 px-3 border border-slate-200 cursor-pointer hover:bg-blue-50/50 transition-colors"
                      >
                        {period ? (
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">{period.subject}</span>
                            <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                              <span>{period.teacher || '—'}</span>
                              <span className="font-mono text-slate-400">{period.room || ''}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[11px] italic block text-center no-print">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Period Modal */}
      {editingPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Chỉnh sửa Tiết {editingPeriod.period} ({editingPeriod.session === 'morning' ? 'Buổi sáng' : 'Buổi chiều'})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Thứ {editingPeriod.dayOfWeek} · Để trống tên môn nếu muốn xóa tiết này
            </p>

            <form onSubmit={handleSavePeriod} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên môn học</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Toán, Ngữ văn, KHTN..."
                  value={editingPeriod.subject}
                  onChange={e => setEditingPeriod({ ...editingPeriod, subject: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Giáo viên bộ môn (tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Thầy Dũng, Cô Nga..."
                  value={editingPeriod.teacher || ''}
                  onChange={e => setEditingPeriod({ ...editingPeriod, teacher: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phòng học (tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Phòng 204, Phòng Lab 1, Sân bóng..."
                  value={editingPeriod.room || ''}
                  onChange={e => setEditingPeriod({ ...editingPeriod, room: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPeriod(null)}
                  className="px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Lưu tiết học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
