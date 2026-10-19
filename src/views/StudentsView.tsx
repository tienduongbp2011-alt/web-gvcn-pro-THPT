import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  Upload, 
  Edit3, 
  Trash2, 
  Eye, 
  X, 
  Check, 
  AlertCircle,
  Phone,
  Calendar,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { Student, ClassProStore } from '../types';
import { exportStudentsCsv } from '../utils/storage';
import { exportStudentsToExcelFile, downloadStudentExcelTemplate } from '../utils/excelImport';
import { ExcelImportModal } from '../components/students/ExcelImportModal';
import { soundManager } from '../utils/audio';

interface StudentsViewProps {
  store: ClassProStore;
  onUpdateStore: (updater: (prev: ClassProStore) => ClassProStore) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  store,
  onUpdateStore
}) => {
  const currentClass = store.classes.find(c => c.id === store.currentClassId) || store.classes[0];
  const students = store.students;

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState<number | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'points' | 'team'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Student>>({
    code: '',
    fullName: '',
    dob: '',
    gender: 'Nam',
    teamNumber: 1,
    role: 'Thành viên',
    contactPhone: '',
    parentPhone: '',
    notes: '',
    points: 0,
    coins: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered & Sorted list
  const filteredStudents = useMemo(() => {
    return students
      .filter(s => {
        const matchSearch =
          s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchTeam = teamFilter === 'all' || s.teamNumber === teamFilter;
        const matchRole = roleFilter === 'all' || s.role === roleFilter;
        return matchSearch && matchTeam && matchRole;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'name') {
          // Compare Vietnamese names by last name/first name
          comp = a.fullName.localeCompare(b.fullName, 'vi');
        } else if (sortBy === 'code') {
          comp = a.code.localeCompare(b.code);
        } else if (sortBy === 'points') {
          comp = a.points - b.points;
        } else if (sortBy === 'team') {
          comp = a.teamNumber - b.teamNumber;
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [students, searchTerm, teamFilter, roleFilter, sortBy, sortOrder]);

  const handleOpenAdd = () => {
    soundManager.playClick(store.settings.soundEnabled);
    const nextCode = `HS${String(students.length + 1).padStart(3, '0')}`;
    setFormData({
      code: nextCode,
      fullName: '',
      dob: '2010-01-01',
      gender: 'Nam',
      teamNumber: 1,
      role: 'Thành viên',
      contactPhone: '',
      parentPhone: '',
      notes: '',
      points: 0,
      coins: 0
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    soundManager.playClick(store.settings.soundEnabled);
    setEditingStudent(s);
    setFormData({ ...s });
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.code) return;

    if (editingStudent) {
      // Update
      onUpdateStore(prev => ({
        ...prev,
        students: prev.students.map(s => s.id === editingStudent.id ? { ...s, ...(formData as Student) } : s)
      }));
      setEditingStudent(null);
    } else {
      // Add new
      const newStudent: Student = {
        id: `hs-${Date.now()}`,
        code: formData.code.trim().toUpperCase(),
        fullName: formData.fullName.trim(),
        dob: formData.dob || '',
        gender: formData.gender || 'Nam',
        teamNumber: formData.teamNumber || 1,
        role: formData.role || 'Thành viên',
        contactPhone: formData.contactPhone || '',
        parentPhone: formData.parentPhone || '',
        notes: formData.notes || '',
        points: Number(formData.points) || 0,
        coins: Number(formData.coins) || 0
      };

      onUpdateStore(prev => ({
        ...prev,
        students: [...prev.students, newStudent]
      }));
      setIsAddModalOpen(false);
    }

    soundManager.playSuccess(store.settings.soundEnabled);
  };

  const handleDeleteStudent = (s: Student) => {
    if (confirm(`Thầy/Cô có chắc chắn muốn xóa học sinh "${s.fullName}" (${s.code}) khỏi lớp không?`)) {
      onUpdateStore(prev => ({
        ...prev,
        students: prev.students.filter(item => item.id !== s.id),
        // remove from seats if placed
        seatingChart: {
          ...prev.seatingChart,
          seats: prev.seatingChart.seats.map(seat => seat.studentId === s.id ? { ...seat, studentId: undefined } : seat)
        }
      }));
      soundManager.playPenalty(store.settings.soundEnabled);
      if (viewingStudent?.id === s.id) setViewingStudent(null);
    }
  };

  const handleConfirmImportExcel = (newStudents: Student[], mode: 'add_new' | 'update_existing' | 'replace_all') => {
    onUpdateStore(prev => {
      let nextSeating = prev.seatingChart;
      if (mode === 'replace_all') {
        const newIds = new Set(newStudents.map(s => s.id));
        nextSeating = {
          ...prev.seatingChart,
          seats: prev.seatingChart.seats.map(seat => seat.studentId && !newIds.has(seat.studentId) ? { ...seat, studentId: undefined } : seat)
        };
      }
      return {
        ...prev,
        students: newStudents,
        seatingChart: nextSeating
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hồ sơ Học sinh</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý danh sách lớp {currentClass?.name || '9/1'} · Tổng số {students.length} học sinh
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportStudentsToExcelFile(students, currentClass?.name || '9_1')}
            title="Xuất file Excel (.xlsx)"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => exportStudentsCsv(students, currentClass?.name || '9_1')}
            title="Xuất file định dạng CSV"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick(store.settings.soundEnabled);
              setIsExcelModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-teal-600" />
            <span>Nhập từ Excel / CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm học sinh</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo họ tên hoặc mã học sinh..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Tất cả các tổ</option>
            <option value="1">Tổ 1</option>
            <option value="2">Tổ 2</option>
            <option value="3">Tổ 3</option>
            <option value="4">Tổ 4</option>
          </select>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Tất cả chức vụ</option>
            <option value="Lớp trưởng">Lớp trưởng</option>
            <option value="Lớp phó học tập">Lớp phó học tập</option>
            <option value="Lớp phó lao động">Lớp phó lao động</option>
            <option value="Tổ trưởng">Tổ trưởng</option>
            <option value="Tổ phó">Tổ phó</option>
            <option value="Thành viên">Thành viên</option>
          </select>

          <button
            onClick={() => {
              setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
            }}
            title="Đảo thứ tự sắp xếp"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}</span>
          </button>
        </div>
      </div>

      {/* Table list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-12 text-center">STT</th>
                <th className="py-3 px-3 cursor-pointer hover:text-teal-700" onClick={() => setSortBy('code')}>
                  Mã HS
                </th>
                <th className="py-3 px-3 cursor-pointer hover:text-teal-700" onClick={() => setSortBy('name')}>
                  Họ và tên
                </th>
                <th className="py-3 px-3">Ngày sinh</th>
                <th className="py-3 px-3">Giới tính</th>
                <th className="py-3 px-3 cursor-pointer hover:text-teal-700" onClick={() => setSortBy('team')}>
                  Tổ
                </th>
                <th className="py-3 px-3">Chức vụ</th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-teal-700" onClick={() => setSortBy('points')}>
                  Điểm T.Đua
                </th>
                <th className="py-3 px-3 text-right">Xu</th>
                <th className="py-3 px-3 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-center text-slate-400 font-mono tabular-nums">{idx + 1}</td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-700">{s.code}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <button
                      onClick={() => {
                        soundManager.playClick(store.settings.soundEnabled);
                        setViewingStudent(s);
                      }}
                      className="hover:text-teal-600 hover:underline text-left"
                    >
                      {s.fullName}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono tabular-nums">{s.dob || '—'}</td>
                  <td className="py-3 px-3 text-slate-600">{s.gender}</td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-slate-700">Tổ {s.teamNumber}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {s.role !== 'Thành viên' ? (
                      <span className="font-semibold text-teal-800">{s.role}</span>
                    ) : (
                      <span className="text-slate-500">Thành viên</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-teal-700 tabular-nums">
                    {s.points}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-amber-600 tabular-nums">
                    {s.coins}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          soundManager.playClick(store.settings.soundEnabled);
                          setViewingStudent(s);
                        }}
                        title="Xem hồ sơ"
                        className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(s)}
                        title="Sửa thông tin"
                        className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(s)}
                        title="Xóa học sinh"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    {searchTerm ? 'Không tìm thấy học sinh phù hợp.' : 'Chưa có học sinh nào. Bấm "Thêm học sinh" hoặc "Nhập từ CSV"!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add or Edit Student */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingStudent ? 'Chỉnh sửa thông tin học sinh' : 'Thêm học sinh mới'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3.5 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã học sinh *</label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={formData.gender || 'Nam'}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as 'Nam' | 'Nữ' })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên học sinh *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={formData.fullName || ''}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={formData.dob || ''}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tổ sinh hoạt</label>
                  <select
                    value={formData.teamNumber || 1}
                    onChange={e => setFormData({ ...formData, teamNumber: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value={1}>Tổ 1</option>
                    <option value={2}>Tổ 2</option>
                    <option value={3}>Tổ 3</option>
                    <option value={4}>Tổ 4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chức vụ trong lớp</label>
                <select
                  value={formData.role || 'Thành viên'}
                  onChange={e => setFormData({ ...formData, role: e.target.value as Student['role'] })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="Thành viên">Thành viên</option>
                  <option value="Lớp trưởng">Lớp trưởng</option>
                  <option value="Lớp phó học tập">Lớp phó học tập</option>
                  <option value="Lớp phó lao động">Lớp phó lao động</option>
                  <option value="Tổ trưởng">Tổ trưởng</option>
                  <option value="Tổ phó">Tổ phó</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SĐT học sinh (nếu có)</label>
                  <input
                    type="text"
                    placeholder="0912..."
                    value={formData.contactPhone || ''}
                    onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SĐT phụ huynh</label>
                  <input
                    type="text"
                    placeholder="0987..."
                    value={formData.parentPhone || ''}
                    onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Điểm thi đua ban đầu</label>
                  <input
                    type="number"
                    value={formData.points ?? 0}
                    onChange={e => setFormData({ ...formData, points: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số xu đổi quà</label>
                  <input
                    type="number"
                    value={formData.coins ?? 0}
                    onChange={e => setFormData({ ...formData, coins: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú của GVCN</label>
                <textarea
                  rows={2}
                  placeholder="Tính cách, hoàn cảnh, lưu ý sư phạm..."
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  {editingStudent ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Student Details */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono text-teal-600 font-semibold">{viewingStudent.code}</span>
                <h3 className="text-lg font-bold text-slate-900">{viewingStudent.fullName}</h3>
                <p className="text-xs text-slate-500">Tổ {viewingStudent.teamNumber} · {viewingStudent.role}</p>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block">Điểm thi đua:</span>
                  <span className="text-base font-bold text-teal-700 font-mono tabular-nums">{viewingStudent.points} điểm</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Số xu thưởng:</span>
                  <span className="text-base font-bold text-amber-600 font-mono tabular-nums">{viewingStudent.coins} xu</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Ngày sinh:</span>
                  <span className="font-medium text-slate-800 font-mono">{viewingStudent.dob || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Giới tính:</span>
                  <span className="font-medium text-slate-800">{viewingStudent.gender}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>SĐT học sinh:</span>
                  <span className="font-medium text-slate-800 font-mono">{viewingStudent.contactPhone || 'Không có'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>SĐT phụ huynh:</span>
                  <span className="font-medium text-slate-800 font-mono">{viewingStudent.parentPhone || 'Chưa cập nhật'}</span>
                </div>
              </div>

              {viewingStudent.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1">Ghi chú của giáo viên:</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                    "{viewingStudent.notes}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  handleOpenEdit(viewingStudent);
                  setViewingStudent(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Chỉnh sửa
              </button>
              <button
                onClick={() => setViewingStudent(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Import Excel & CSV */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        currentStudents={students}
        className={currentClass?.name || '9_1'}
        onConfirmImport={handleConfirmImportExcel}
        soundEnabled={store.settings.soundEnabled}
      />
    </div>
  );
};
