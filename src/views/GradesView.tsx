import React, { useState, useMemo } from 'react';
import { 
  BookMarked, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Download, 
  Printer,
  TrendingUp,
  Award,
  Calendar
} from 'lucide-react';
import { GradeEntry, ScoreType, ClassProStore } from '../types';
import { soundManager } from '../utils/audio';

const SUBJECTS = [
  'Toán',
  'Ngữ văn',
  'Tiếng Anh',
  'KHTN (Khoa học tự nhiên)',
  'Lịch sử & Địa lí',
  'Giáo dục công dân',
  'Tin học',
  'Công nghệ',
  'Giáo dục thể chất',
  'Nghệ thuật (Âm nhạc - Mỹ thuật)',
  'Hoạt động trải nghiệm, hướng nghiệp'
];

const SCORE_TYPES: ScoreType[] = ['Miệng', '15 phút', 'Giữa kì', 'Cuối kì', 'Thường xuyên'];

interface GradesViewProps {
  store: ClassProStore;
  onUpdateStore: (updater: (prev: ClassProStore) => ClassProStore) => void;
}

export const GradesView: React.FC<GradesViewProps> = ({
  store,
  onUpdateStore
}) => {
  const currentClass = store.classes.find(c => c.id === store.currentClassId) || store.classes[0];
  const students = store.students;
  const grades = store.grades || [];

  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeEntry | null>(null);

  // Form states
  const [formStudentId, setFormStudentId] = useState(students[0]?.id || '');
  const [formSubject, setFormSubject] = useState(SUBJECTS[0]);
  const [formScoreType, setFormScoreType] = useState<ScoreType>('15 phút');
  const [formScore, setFormScore] = useState<string>('8.5');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNote, setFormNote] = useState('');

  const filteredGrades = useMemo(() => {
    return grades.filter(g => {
      const matchSub = subjectFilter === 'all' || g.subject === subjectFilter;
      const matchSt = studentFilter === 'all' || g.studentId === studentFilter;
      return matchSub && matchSt;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [grades, subjectFilter, studentFilter]);

  const handleOpenAdd = () => {
    soundManager.playClick(store.settings.soundEnabled);
    setEditingGrade(null);
    setFormStudentId(students[0]?.id || '');
    setFormSubject(SUBJECTS[0]);
    setFormScoreType('15 phút');
    setFormScore('8.0');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormNote('');
    setIsAddModalOpen(true);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === formStudentId);
    if (!st) return;

    const numScore = parseFloat(formScore);
    if (isNaN(numScore) || numScore < 0 || numScore > 10) {
      alert('Vui lòng nhập điểm từ 0.0 đến 10.0');
      return;
    }

    if (editingGrade) {
      onUpdateStore(prev => ({
        ...prev,
        grades: prev.grades.map(g => 
          g.id === editingGrade.id
            ? {
                ...g,
                studentId: st.id,
                studentName: st.fullName,
                subject: formSubject,
                scoreType: formScoreType,
                score: numScore,
                date: formDate,
                note: formNote.trim()
              }
            : g
        )
      }));
    } else {
      const newGrade: GradeEntry = {
        id: `grd-${Date.now()}`,
        studentId: st.id,
        studentName: st.fullName,
        subject: formSubject,
        scoreType: formScoreType,
        score: numScore,
        date: formDate,
        note: formNote.trim()
      };
      onUpdateStore(prev => ({
        ...prev,
        grades: [newGrade, ...prev.grades]
      }));
    }

    soundManager.playSuccess(store.settings.soundEnabled);
    setIsAddModalOpen(false);
  };

  const handleDeleteGrade = (id: string) => {
    if (confirm('Thầy/Cô có muốn xóa cột điểm này?')) {
      onUpdateStore(prev => ({
        ...prev,
        grades: prev.grades.filter(g => g.id !== id)
      }));
      soundManager.playPenalty(store.settings.soundEnabled);
    }
  };

  const exportGradesCsv = () => {
    const headers = ['Mã HS', 'Họ và tên', 'Môn học', 'Loại điểm', 'Điểm số', 'Ngày ghi', 'Ghi chú'];
    const rows = filteredGrades.map(g => {
      const st = students.find(s => s.id === g.studentId);
      return [
        `"${st ? st.code : ''}"`,
        `"${g.studentName}"`,
        `"${g.subject}"`,
        `"${g.scoreType}"`,
        `"${g.score}"`,
        `"${g.date}"`,
        `"${(g.note || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SoDiem_${currentClass?.name || '9_1'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sổ Điểm Cá Nhân</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sổ theo dõi kết quả kiểm tra thường xuyên và định kỳ của học sinh theo từng môn
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportGradesCsv}
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
            <span>In sổ điểm</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Vào điểm mới</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Lọc môn:</span>
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Tất cả môn học</option>
              {SUBJECTS.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Lọc học sinh:</span>
            <select
              value={studentFilter}
              onChange={e => setStudentFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Toàn bộ lớp</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.fullName} ({s.code})</option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500">
          Tìm thấy <strong className="text-slate-800">{filteredGrades.length}</strong> kết quả điểm
        </span>
      </div>

      {/* Table list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs printable-area">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-3">Ngày ghi</th>
                <th className="py-3 px-3">Học sinh</th>
                <th className="py-3 px-3">Môn học</th>
                <th className="py-3 px-3">Loại điểm</th>
                <th className="py-3 px-3 text-right">Điểm số</th>
                <th className="py-3 px-3">Đánh giá / Ghi chú</th>
                <th className="py-3 px-3 text-center no-print">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGrades.map(g => (
                <tr key={g.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3 font-mono text-slate-500">{g.date}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{g.studentName}</td>
                  <td className="py-3 px-3 text-slate-700 font-medium">{g.subject}</td>
                  <td className="py-3 px-3 text-slate-600">{g.scoreType}</td>
                  <td className="py-3 px-3 text-right">
                    <span className={`font-mono font-bold text-sm tabular-nums px-2 py-0.5 rounded ${
                      g.score >= 8.0 ? 'bg-emerald-50 text-emerald-700' :
                      g.score >= 6.5 ? 'bg-blue-50 text-blue-700' :
                      g.score >= 5.0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {g.score.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 italic">{g.note || '—'}</td>
                  <td className="py-3 px-3 text-center no-print">
                    <button
                      onClick={() => handleDeleteGrade(g.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredGrades.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Chưa có đầu điểm nào. Bấm "Vào điểm mới" để ghi nhận!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Grade */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Vào điểm số học sinh</h3>
            <form onSubmit={handleSaveGrade} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Học sinh *</label>
                <select
                  value={formStudentId}
                  onChange={e => setFormStudentId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.code} - Tổ {s.teamNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Môn học *</label>
                <select
                  value={formSubject}
                  onChange={e => setFormSubject(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {SUBJECTS.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại kiểm tra</label>
                  <select
                    value={formScoreType}
                    onChange={e => setFormScoreType(e.target.value as ScoreType)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {SCORE_TYPES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Điểm (thang 10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    required
                    value={formScore}
                    onChange={e => setFormScore(e.target.value)}
                    className="w-full px-3 py-1.5 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ngày kiểm tra</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3 py-1.5 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú nhận xét</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Rất tốt, cần rèn thêm bài hình học..."
                  value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Lưu điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
