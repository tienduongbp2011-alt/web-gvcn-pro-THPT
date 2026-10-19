import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarCheck,
  MessageSquareText,
  UsersRound,
  Layers,
  Trophy,
  BookMarked,
  Grid3X3,
  CalendarDays,
  WalletCards,
  Disc,
  BarChart3,
  Settings,
  X
} from 'lucide-react';
import { soundManager } from '../utils/audio';

export type NavTabId =
  | 'dashboard'
  | 'classes'
  | 'students'
  | 'attendance'
  | 'comments'
  | 'groups'
  | 'teams'
  | 'competition'
  | 'grades'
  | 'seating'
  | 'timetable'
  | 'finance'
  | 'wheel'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  isSampleData?: boolean;
}

interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard },
  { id: 'classes', label: 'Quản lý Lớp học', icon: GraduationCap },
  { id: 'students', label: 'Hồ sơ Học sinh', icon: Users },
  { id: 'attendance', label: 'Điểm danh hằng ngày', icon: CalendarCheck },
  { id: 'comments', label: 'Thông báo & Nhận xét', icon: MessageSquareText },
  { id: 'groups', label: 'Chia nhóm học tập', icon: UsersRound },
  { id: 'teams', label: 'Chia tổ học sinh', icon: Layers },
  { id: 'competition', label: 'Thi đua & Nề nếp', icon: Trophy },
  { id: 'grades', label: 'Sổ điểm cá nhân', icon: BookMarked },
  { id: 'seating', label: 'Sơ đồ lớp học', icon: Grid3X3 },
  { id: 'timetable', label: 'Thời khóa biểu', icon: CalendarDays },
  { id: 'finance', label: 'Quản lý Thu / Chi (Tài chính)', icon: WalletCards },
  { id: 'wheel', label: 'Vòng quay may mắn', icon: Disc, badge: 'Hot' },
  { id: 'reports', label: 'Báo cáo & Thống kê', icon: BarChart3 },
  { id: 'settings', label: 'Cài đặt & Dữ liệu', icon: Settings }
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  soundEnabled,
  isSampleData
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } no-print`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white font-extrabold text-base">
              CP
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-tight">CLASS PRO</div>
              <div className="text-[11px] text-teal-400 font-medium">Trợ Lý Giáo Viên</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sample data banner */}
        {isSampleData && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs">
            <span className="font-semibold block text-amber-300">Dữ liệu mẫu thử nghiệm</span>
            <span>Thầy cô có thể xóa hoặc sửa bất kỳ lúc nào trong Cài đặt.</span>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  soundManager.playClick(soundEnabled);
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-teal-500 text-slate-900 ml-1">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-4 py-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Phiên bản v2.5 THCS</span>
          <span>Offline 100%</span>
        </div>
      </aside>
    </>
  );
};
