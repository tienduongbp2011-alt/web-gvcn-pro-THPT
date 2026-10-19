import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Volume2, 
  VolumeX, 
  FileCode, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { ClassProStore, ClassInfo } from '../types';
import { exportBackupJson, importBackupJson } from '../utils/storage';
import { getInitialSampleStore } from '../utils/sampleData';
import { downloadStandaloneSingleHtml } from '../utils/exportSingleHtml';
import { soundManager } from '../utils/audio';

interface SettingsViewProps {
  store: ClassProStore;
  onUpdateStore: (updater: (prev: ClassProStore) => ClassProStore) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  store,
  onUpdateStore
}) => {
  const currentClass = store.classes.find(c => c.id === store.currentClassId) || store.classes[0];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable fields
  const [className, setClassName] = useState(currentClass?.name || '9/1');
  const [grade, setGrade] = useState(currentClass?.grade || 'Khối 9');
  const [schoolYear, setSchoolYear] = useState(currentClass?.schoolYear || '2024 - 2025');
  const [teacherName, setTeacherName] = useState(currentClass?.teacherName || 'Cô Mai Anh');

  // Confirmation modals
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const handleSaveClassInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStore(prev => ({
      ...prev,
      classes: prev.classes.map(c => 
        c.id === prev.currentClassId
          ? {
              ...c,
              name: className.trim(),
              grade,
              schoolYear: schoolYear.trim(),
              teacherName: teacherName.trim(),
              isSampleData: false
            }
          : c
      )
    }));

    soundManager.playSuccess(store.settings.soundEnabled);
    alert('Đã cập nhật thông tin lớp học thành công!');
  };

  const handleToggleSound = () => {
    const nextVal = !store.settings.soundEnabled;
    soundManager.playClick(nextVal);
    onUpdateStore(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        soundEnabled: nextVal
      }
    }));
  };

  const handleToggleSyncCoins = () => {
    soundManager.playClick(store.settings.soundEnabled);
    onUpdateStore(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        syncPointsAndCoins: !prev.settings.syncPointsAndCoins
      }
    }));
  };

  const handleRestoreSample = () => {
    if (confirm('Thầy/Cô có chắc chắn muốn khôi phục lại dữ liệu mẫu lớp 9/1 không?')) {
      const sample = getInitialSampleStore();
      onUpdateStore(() => sample);
      soundManager.playSuccess(store.settings.soundEnabled);
      alert('Đã khôi phục dữ liệu mẫu thành công!');
    }
  };

  const handleJsonFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = importBackupJson(text);
      if (res.success && res.data) {
        if (confirm('Thầy/Cô có muốn nạp bản sao lưu này không? Toàn bộ dữ liệu hiện tại sẽ được thay thế bằng dữ liệu trong file sao lưu.')) {
          onUpdateStore(() => res.data as ClassProStore);
          soundManager.playSuccess(store.settings.soundEnabled);
          alert('Khôi phục bản sao lưu JSON thành công!');
        }
      } else {
        alert(res.error || 'Lỗi khi đọc file sao lưu JSON!');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearAllConfirm = () => {
    if (confirmInput.trim().toUpperCase() !== 'XÓA') {
      alert('Vui lòng gõ chữ "XÓA" để xác nhận hành động này.');
      return;
    }

    const blankClass: ClassInfo = {
      id: `class-${Date.now()}`,
      name: 'Lớp mới',
      grade: 'Khối 6',
      schoolYear: '2024 - 2025',
      teacherName: 'Giáo viên',
      isSampleData: false,
      createdAt: new Date().toISOString()
    };

    onUpdateStore(() => ({
      classes: [blankClass],
      currentClassId: blankClass.id,
      students: [],
      attendance: [],
      announcements: [],
      comments: [],
      groupPlans: [],
      teams: [
        { number: 1, name: 'Tổ 1' },
        { number: 2, name: 'Tổ 2' },
        { number: 3, name: 'Tổ 3' },
        { number: 4, name: 'Tổ 4' }
      ],
      criteria: store.criteria,
      competitionEvents: [],
      grades: [],
      seatingChart: {
        rows: 4,
        cols: 4,
        seats: [],
        updatedAt: new Date().toISOString()
      },
      timetable: store.timetable,
      financeTransactions: [],
      financeCategories: store.financeCategories,
      feePlans: [],
      settings: store.settings
    }));

    soundManager.playPenalty(store.settings.soundEnabled);
    setShowClearConfirm(false);
    setConfirmInput('');
    alert('Đã xóa trắng dữ liệu và tạo lớp học trống mới!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cài Đặt & Quản Lý Dữ Liệu</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tùy chỉnh thông số lớp học, quản lý âm thanh, xuất file offline và sao lưu an toàn
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Class Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Thông tin Lớp & Giáo viên</h3>

          <form onSubmit={handleSaveClassInfo} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên lớp</label>
              <input
                type="text"
                required
                value={className}
                onChange={e => setClassName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khối lớp</label>
                <select
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Khối 6">Khối 6</option>
                  <option value="Khối 7">Khối 7</option>
                  <option value="Khối 8">Khối 8</option>
                  <option value="Khối 9">Khối 9</option>
                  <option value="Khối 10">Khối 10</option>
                  <option value="Khối 11">Khối 11</option>
                  <option value="Khối 12">Khối 12</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Năm học</label>
                <input
                  type="text"
                  value={schoolYear}
                  onChange={e => setSchoolYear(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên giáo viên chủ nhiệm</label>
              <input
                type="text"
                value={teacherName}
                onChange={e => setTeacherName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
              >
                Cập nhật thông tin
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: App Preferences */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Tùy chọn Hệ thống</h3>

          <div className="space-y-3 text-xs">
            {/* Audio Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <span className="font-semibold text-slate-800 block">Âm thanh hiệu ứng</span>
                <span className="text-[11px] text-slate-500">Phát âm thanh vui tươi khi quay thưởng hoặc thao tác</span>
              </div>
              <button
                type="button"
                onClick={handleToggleSound}
                className={`p-2 rounded-lg transition-colors ${
                  store.settings.soundEnabled
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {store.settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Sync points and coins */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div>
                <span className="font-semibold text-slate-800 block">Tự động tăng xu khi cộng điểm thi đua</span>
                <span className="text-[11px] text-slate-500">
                  {store.settings.syncPointsAndCoins
                    ? 'Đang bật: Mỗi khi cộng/trừ điểm thi đua, số xu đổi quà cũng thay đổi theo'
                    : 'Đang tắt: Điểm thi đua và số xu đổi quà hoạt động độc lập'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={store.settings.syncPointsAndCoins}
                onChange={handleToggleSyncCoins}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
            </div>

            {/* Offline single-file HTML Export */}
            <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 space-y-2">
              <div className="flex items-start gap-2">
                <FileCode className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-teal-900 block">Xuất file HTML đơn lẻ (Chạy offline)</span>
                  <p className="text-[11px] text-teal-800 mt-0.5">
                    Tải về 1 file .html duy nhất chứa đầy đủ giao diện và dữ liệu lớp học. Quý thầy cô có thể lưu vào USB và mở trực tiếp trên máy chiếu lớp mà không cần mạng Internet.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  soundManager.playSuccess(store.settings.soundEnabled);
                  downloadStandaloneSingleHtml(store);
                }}
                className="w-full py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file HTML độc lập ngay</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backup and Restore Data */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Sao Lưu & Khôi Phục Dữ Liệu</h3>
        <p className="text-xs text-slate-500">
          Dữ liệu được lưu trữ an toàn trong bộ nhớ trình duyệt (localStorage) trên thiết bị của quý thầy cô. Để đề phòng trường hợp xóa lịch sử duyệt web hoặc đổi máy tính, vui lòng tải bản sao lưu định kỳ.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => exportBackupJson(store)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Tải bản sao lưu JSON</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Khôi phục từ file JSON</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleJsonFileSelect}
              className="hidden"
            />
          </label>

          <button
            onClick={handleRestoreSample}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Nạp lại Dữ liệu mẫu (Lớp 9/1)</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Clear Data */}
      <div className="bg-white rounded-xl border border-red-200 p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-red-700 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span>Vùng Nguy Hiểm: Khởi Tạo Lớp Trống</span>
        </h3>
        <p className="text-xs text-slate-600">
          Xóa toàn bộ học sinh, lịch sử điểm danh và sự kiện thi đua để bắt đầu với một lớp học hoàn toàn mới.
        </p>

        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 border border-red-300 rounded-xl transition-colors"
          >
            Xóa trắng và tạo lớp mới
          </button>
        ) : (
          <div className="p-3 bg-red-50 border border-red-300 rounded-xl space-y-3 max-w-md">
            <span className="text-xs font-semibold text-red-800 block">
              Xác nhận xóa: Hãy gõ chữ "XÓA" vào ô dưới đây để đồng ý:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder='Gõ chữ "XÓA"'
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono uppercase border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              />
              <button
                onClick={handleClearAllConfirm}
                className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Xác nhận
              </button>
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  setConfirmInput('');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
