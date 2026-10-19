import React, { useState } from 'react';
import { 
  GraduationCap, 
  Volume2, 
  VolumeX, 
  Download, 
  Settings, 
  CheckCircle2, 
  Menu,
  ChevronDown,
  Plus
} from 'lucide-react';
import { ClassInfo } from '../types';
import { soundManager } from '../utils/audio';
import { downloadStandaloneSingleHtml } from '../utils/exportSingleHtml';
import { ClassProStore } from '../types';

interface HeaderProps {
  currentClass: ClassInfo;
  allClasses: ClassInfo[];
  studentCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelectClass: (classId: string) => void;
  onCreateClass: () => void;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  fullStore: ClassProStore;
}

export const Header: React.FC<HeaderProps> = ({
  currentClass,
  allClasses,
  studentCount,
  soundEnabled,
  onToggleSound,
  onSelectClass,
  onCreateClass,
  onOpenSettings,
  onToggleSidebar,
  fullStore
}) => {
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const todayFormatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-white border-b border-slate-200 no-print">
      {/* Zone 1: Mobile toggle & Class brand lockup */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Mở menu điều hướng"
          className="p-2 -ml-2 text-slate-600 rounded-lg hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-600 text-white font-bold text-lg shadow-xs">
            CP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">CLASS PRO</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                Lớp {currentClass.name}
              </span>
            </div>
            <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
              <span>{currentClass.teacherName}</span>
              <span aria-hidden="true">·</span>
              <span>Năm học {currentClass.schoolYear}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone 2: Contextual Class Switcher & Metadata */}
      <div className="relative flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => {
              soundManager.playClick(soundEnabled);
              setClassDropdownOpen(!classDropdownOpen);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
            <span className="max-w-[120px] truncate">{currentClass.name} ({studentCount} HS)</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {classDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40">
              <div className="px-3 py-1 text-xs font-semibold text-slate-400">CHỌN LỚP HỌC</div>
              {allClasses.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    soundManager.playClick(soundEnabled);
                    onSelectClass(c.id);
                    setClassDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${c.id === currentClass.id ? 'font-bold text-teal-700 bg-teal-50/50' : 'text-slate-700'}`}
                >
                  <span>Lớp {c.name} ({c.grade})</span>
                  {c.id === currentClass.id && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                </button>
              ))}
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={() => {
                  soundManager.playClick(soundEnabled);
                  setClassDropdownOpen(false);
                  onCreateClass();
                }}
                className="w-full text-left px-3 py-2 text-xs text-teal-700 font-medium hover:bg-teal-50 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo lớp học mới</span>
              </button>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 pl-2 border-l border-slate-200">
          <span className="capitalize">{todayFormatted}</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-700 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Đã lưu cục bộ
          </span>
        </div>
      </div>

      {/* Zone 3: Quick Utilities (Audio toggle, Offline HTML download, Settings) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => {
            soundManager.playClick(true);
            onToggleSound();
          }}
          title={soundEnabled ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
          className={`p-2 rounded-lg text-xs transition-colors ${soundEnabled ? 'text-teal-700 bg-teal-50 hover:bg-teal-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={() => {
            soundManager.playSuccess(soundEnabled);
            downloadStandaloneSingleHtml(fullStore);
          }}
          title="Tải file HTML đơn lẻ (mở offline không cần internet)"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Lưu file HTML</span>
        </button>

        <button
          onClick={() => {
            soundManager.playClick(soundEnabled);
            onOpenSettings();
          }}
          title="Cài đặt hệ thống & Sao lưu"
          className="p-2 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
