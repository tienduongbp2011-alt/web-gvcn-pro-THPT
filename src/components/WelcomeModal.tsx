import React, { useState } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  UserPlus, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  CalendarCheck, 
  Trophy, 
  Disc,
  X
} from 'lucide-react';
import { ClassInfo, ClassProStore } from '../types';
import { getInitialSampleStore } from '../utils/sampleData';
import { soundManager } from '../utils/audio';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateStore: (updater: (prev: ClassProStore) => ClassProStore) => void;
  soundEnabled: boolean;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onUpdateStore,
  soundEnabled
}) => {
  const [step, setStep] = useState<'welcome' | 'create_custom' | 'guide'>('welcome');

  // Custom class form
  const [className, setClassName] = useState('9/1');
  const [grade, setGrade] = useState('Khối 9');
  const [schoolYear, setSchoolYear] = useState('2024 - 2025');
  const [teacherName, setTeacherName] = useState('Cô Nguyễn Mai Anh');

  if (!isOpen) return null;

  const handleUseSample = () => {
    soundManager.playSuccess(soundEnabled);
    const sample = getInitialSampleStore();
    onUpdateStore(() => sample);
    setStep('guide');
  };

  const handleStartCustomClass = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playSuccess(soundEnabled);

    const newClass: ClassInfo = {
      id: `class-${Date.now()}`,
      name: className.trim() || 'Lớp mới',
      grade,
      schoolYear: schoolYear.trim() || '2024 - 2025',
      teacherName: teacherName.trim() || 'Giáo viên',
      isSampleData: false,
      createdAt: new Date().toISOString()
    };

    onUpdateStore(prev => ({
      ...prev,
      classes: [newClass],
      currentClassId: newClass.id,
      students: [],
      attendance: [],
      comments: [],
      competitionEvents: [],
      grades: []
    }));

    setStep('guide');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden">
        {/* Step 1: Welcome & Choice */}
        {step === 'welcome' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white font-black text-2xl shadow-md">
                CP
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Chào mừng Quý Thầy/Cô đến với CLASS PRO!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Trợ lý số toàn diện cho giáo viên chủ nhiệm THCS: Điểm danh, quản lý nề nếp thi đua, sơ đồ lớp, sổ điểm và vòng quay may mắn.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Sample Data */}
              <button
                type="button"
                onClick={handleUseSample}
                className="p-5 rounded-2xl border-2 border-teal-500 bg-teal-50/40 hover:bg-teal-50 text-left transition-all group shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-600 text-white text-[11px] font-bold mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Khuyên dùng</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                    Trải nghiệm Lớp 9/1 mẫu
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Đã chuẩn bị sẵn 15 học sinh, 4 tổ, sơ đồ lớp, thời khóa biểu và điểm danh để thử ngay các tính năng.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-teal-700">
                  <span>Bắt đầu ngay</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option B: Create Blank Class */}
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick(soundEnabled);
                  setStep('create_custom');
                }}
                className="p-5 rounded-2xl border-2 border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-left transition-all group shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold mb-3">
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Lớp thực tế</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-slate-700 transition-colors">
                    Khởi tạo lớp mới của tôi
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Bắt đầu với danh sách trống, nhập thông tin lớp học và tải file danh sách học sinh từ file CSV của trường.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-slate-700">
                  <span>Tự thiết lập</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Custom Class Form */}
        {step === 'create_custom' && (
          <form onSubmit={handleStartCustomClass} className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Thiết lập Lớp học của Quý Thầy/Cô</h3>
              <p className="text-xs text-slate-500">Nhập các thông số cơ bản của lớp chủ nhiệm</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên lớp học *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 9/2, 8A1, 7C..."
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên Giáo viên chủ nhiệm</label>
                <input
                  type="text"
                  placeholder="Cô Nguyễn Mai Anh"
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Quay lại
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
              >
                Tiếp tục đến hướng dẫn
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Quick 1-minute Feature Guide */}
        {step === 'guide' && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Sẵn sàng sử dụng CLASS PRO!</h3>
              <p className="text-xs text-slate-500">3 tính năng nổi bật quý thầy cô nên thử đầu tiên:</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <CalendarCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">1. Điểm danh đầu buổi</span>
                  <p className="text-slate-600 mt-0.5">Bấm nút "Cả lớp có mặt" nhanh chóng chỉ với 1 click hoặc đánh dấu học sinh đi muộn, xin phép.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Trophy className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">2. Ghi điểm thi đua & Đổi quà</span>
                  <p className="text-slate-600 mt-0.5">Cộng điểm phát biểu, trực nhật cho học sinh hoặc tổ, tích lũy xu để đổi những phần quà khích lệ.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Disc className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">3. Vòng quay may mắn giờ sinh hoạt</span>
                  <p className="text-slate-600 mt-0.5">Quay ngẫu nhiên gọi học sinh trả bài hoặc bốc thăm người chiến thắng với hiệu ứng âm thanh sống động.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition-colors"
              >
                Vào Bảng Điều Khiển ngay
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
