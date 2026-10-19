import React, { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Check, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Users, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { ClassInfo, ClassProStore } from '../types';
import { soundManager } from '../utils/audio';

interface ClassViewProps {
  store: ClassProStore;
  onUpdateStore: (updater: (prev: ClassProStore) => ClassProStore) => void;
  onSelectClass: (classId: string) => void;
}

export const ClassView: React.FC<ClassViewProps> = ({
  store,
  onUpdateStore,
  onSelectClass
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formGrade, setFormGrade] = useState('Khối 9');
  const [formYear, setFormYear] = useState('2024 - 2025');
  const [formTeacher, setFormTeacher] = useState('');

  const currentClass = store.classes.find(c => c.id === store.currentClassId) || store.classes[0];

  const handleOpenCreate = () => {
    soundManager.playClick(store.settings.soundEnabled);
    setFormName('');
    setFormGrade('Khối 9');
    setFormYear('2024 - 2025');
    setFormTeacher(currentClass?.teacherName || 'Cô Mai Anh');
    setShowCreateModal(true);
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newClass: ClassInfo = {
      id: `class-${Date.now()}`,
      name: formName.trim(),
      grade: formGrade,
      schoolYear: formYear.trim(),
      teacherName: formTeacher.trim() || 'Giáo viên Chủ nhiệm',
      isSampleData: false,
      createdAt: new Date().toISOString()
    };

    onUpdateStore(prev => ({
      ...prev,
      classes: [...prev.classes, newClass],
      currentClassId: newClass.id
    }));

    soundManager.playSuccess(store.settings.soundEnabled);
    setShowCreateModal(false);
  };

  const handleStartEdit = (c: ClassInfo) => {
    soundManager.playClick(store.settings.soundEnabled);
    setEditingClass(c);
    setFormName(c.name);
    setFormGrade(c.grade);
    setFormYear(c.schoolYear);
    setFormTeacher(c.teacherName);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass || !formName.trim()) return;

    onUpdateStore(prev => ({
      ...prev,
      classes: prev.classes.map(c => 
        c.id === editingClass.id 
          ? {
              ...c,
              name: formName.trim(),
              grade: formGrade,
              schoolYear: formYear.trim(),
              teacherName: formTeacher.trim(),
              isSampleData: false
            }
          : c
      )
    }));

    soundManager.playSuccess(store.settings.soundEnabled);
    setEditingClass(null);
  };

  const handleDeleteClass = (classId: string, className: string) => {
    if (store.classes.length <= 1) {
      alert('Không thể xóa lớp duy nhất. Thầy/Cô vui lòng tạo một lớp mới trước khi xóa.');
      return;
    }
    if (confirm(`Thầy/Cô có chắc chắn muốn xóa lớp "${className}"? Tất cả thông tin của lớp này sẽ bị xóa.`)) {
      onUpdateStore(prev => {
        const remaining = prev.classes.filter(c => c.id !== classId);
        return {
          ...prev,
          classes: remaining,
          currentClassId: prev.currentClassId === classId ? remaining[0].id : prev.currentClassId
        };
      });
      soundManager.playPenalty(store.settings.soundEnabled);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Quản lý Lớp học</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem và chuyển đổi giữa các lớp đang phụ trách hoặc cập nhật thông tin niên khóa
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo lớp học mới</span>
        </button>
      </div>

      {/* Grid of classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {store.classes.map((cls) => {
          const isSelected = cls.id === store.currentClassId;
          const count = isSelected ? store.students.length : 0; // count for current

          return (
            <div
              key={cls.id}
              className={`bg-white rounded-xl border p-5 transition-all relative ${
                isSelected 
                  ? 'border-teal-500 shadow-sm ring-1 ring-teal-500/20' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {cls.isSampleData && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-2">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Dữ liệu mẫu trải nghiệm</span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Lớp {cls.name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {cls.grade} · Năm học {cls.schoolYear}
                  </div>
                </div>
                {isSelected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                    <Check className="w-3.5 h-3.5" />
                    Đang chọn
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      soundManager.playClick(store.settings.soundEnabled);
                      onSelectClass(cls.id);
                    }}
                    className="px-3 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Chọn lớp này
                  </button>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Giáo viên chủ nhiệm:</span>
                  <span className="font-semibold text-slate-800">{cls.teacherName}</span>
                </div>
                {isSelected && (
                  <div className="flex items-center justify-between">
                    <span>Sĩ số hiện tại:</span>
                    <span className="font-mono font-bold text-teal-700">{count} học sinh</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleStartEdit(cls)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-teal-600 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa</span>
                </button>

                {store.classes.length > 1 && (
                  <button
                    onClick={() => handleDeleteClass(cls.id, cls.name)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa lớp</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Class */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Tạo lớp học mới</h3>
            <p className="text-xs text-slate-500 mb-4">Nhập thông tin cơ bản để bắt đầu quản lý</p>

            <form onSubmit={handleSaveCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên lớp *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 9/2 hoặc 8A1"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={formGrade}
                    onChange={e => setFormGrade(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Khối 6">Khối 6</option>
                    <option value="Khối 7">Khối 7</option>
                    <option value="Khối 8">Khối 8</option>
                    <option value="Khối 9">Khối 9</option>
                    <option value="Khối 10">Khối 10</option>
                    <option value="Khối 11">Khối 11</option>
                    <option value="Khối 12">Khối 12</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Năm học</label>
                  <input
                    type="text"
                    value={formYear}
                    onChange={e => setFormYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Giáo viên chủ nhiệm</label>
                <input
                  type="text"
                  value={formTeacher}
                  onChange={e => setFormTeacher(e.target.value)}
                  placeholder="Thầy/Cô Nguyễn Văn A"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Tạo lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Class */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Chỉnh sửa thông tin lớp</h3>
            <p className="text-xs text-slate-500 mb-4">Cập nhật tên lớp, khối hoặc giáo viên chủ nhiệm</p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên lớp *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={formGrade}
                    onChange={e => setFormGrade(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Khối 6">Khối 6</option>
                    <option value="Khối 7">Khối 7</option>
                    <option value="Khối 8">Khối 8</option>
                    <option value="Khối 9">Khối 9</option>
                    <option value="Khối 10">Khối 10</option>
                    <option value="Khối 11">Khối 11</option>
                    <option value="Khối 12">Khối 12</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Năm học</label>
                  <input
                    type="text"
                    value={formYear}
                    onChange={e => setFormYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Giáo viên chủ nhiệm</label>
                <input
                  type="text"
                  value={formTeacher}
                  onChange={e => setFormTeacher(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
