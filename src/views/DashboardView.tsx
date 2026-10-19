import React, { useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  Trophy, 
  Coins, 
  Bell, 
  Award,
  ArrowRight,
  Sparkles,
  CalendarCheck,
  UserPlus,
  MessageSquarePlus,
  UsersRound,
  TrendingUp,
  Disc,
  WalletCards
} from 'lucide-react';
import { ClassProStore } from '../types';
import { NavTabId } from '../components/Sidebar';
import { soundManager } from '../utils/audio';

interface DashboardViewProps {
  store: ClassProStore;
  onNavigate: (tab: NavTabId) => void;
  onQuickAction: (action: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  store,
  onNavigate,
  onQuickAction
}) => {
  const currentClass = store.classes.find(c => c.id === store.currentClassId) || store.classes[0];
  const students = store.students;
  const todayStr = new Date().toISOString().split('T')[0];

  // Real Attendance metrics for today
  const attendanceToday = useMemo(() => {
    const record = store.attendance.find(a => a.date === todayStr);
    let present = 0;
    let excused = 0;
    let unexcused = 0;
    let late = 0;
    let other = 0;

    if (record) {
      students.forEach(s => {
        const att = record.records[s.id];
        if (att) {
          if (att.status === 'present') present++;
          else if (att.status === 'excused') excused++;
          else if (att.status === 'unexcused') unexcused++;
          else if (att.status === 'late') late++;
          else if (att.status === 'other') other++;
        }
      });
    } else {
      // If not yet marked today
      present = 0;
    }
    return { record, present, excused, unexcused, late, other, hasMarkedToday: !!record };
  }, [store.attendance, students, todayStr]);

  // Points & Coins
  const totalPoints = useMemo(() => students.reduce((acc, s) => acc + s.points, 0), [students]);
  const totalCoins = useMemo(() => students.reduce((acc, s) => acc + s.coins, 0), [students]);

  // Praised students
  const praisedCount = useMemo(() => {
    return store.comments.filter(c => c.category === 'praise').length;
  }, [store.comments]);

  // Top students by points
  const topStudents = useMemo(() => {
    return [...students].sort((a, b) => b.points - a.points).slice(0, 5);
  }, [students]);

  // Recent announcements
  const recentAnnouncements = useMemo(() => {
    return [...store.announcements].slice(0, 3);
  }, [store.announcements]);

  // Recent competition events
  const recentEvents = useMemo(() => {
    return [...store.competitionEvents].sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);
  }, [store.competitionEvents]);

  // Calculate team point breakdown
  const teamScores = useMemo(() => {
    const scores: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    students.forEach(s => {
      scores[s.teamNumber] = (scores[s.teamNumber] || 0) + s.points;
    });
    return scores;
  }, [students]);

  const maxTeamScore = Math.max(...Object.values(teamScores), 10);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-200 text-xs font-semibold mb-1">
            <span>BẢNG ĐIỀU KHIỂN CHỦ NHIỆM</span>
            <span>·</span>
            <span>LỚP {currentClass?.name || '9/1'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Chào mừng {currentClass?.teacherName || 'Quý Thầy/Cô'}!
          </h1>
          <p className="text-sm text-teal-100/90 mt-1 max-w-xl">
            Quản lý hồ sơ học sinh, điểm danh buổi sáng, cộng điểm thi đua nề nếp và vòng quay may mắn trong giờ sinh hoạt lớp.
          </p>
        </div>

        {/* Quick action bar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              soundManager.playClick(store.settings.soundEnabled);
              onNavigate('attendance');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-teal-800 font-semibold text-xs rounded-xl shadow-xs hover:bg-teal-50 transition-colors"
          >
            <CalendarCheck className="w-4 h-4 text-teal-600" />
            <span>Điểm danh ngay</span>
          </button>
          <button
            onClick={() => {
              soundManager.playClick(store.settings.soundEnabled);
              onNavigate('wheel');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 text-white font-semibold text-xs rounded-xl hover:bg-teal-500 transition-colors border border-teal-500/50"
          >
            <Disc className="w-4 h-4 text-amber-300" />
            <span>Quay may mắn</span>
          </button>
          <button
            onClick={() => {
              soundManager.playClick(store.settings.soundEnabled);
              onNavigate('finance');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-xl hover:bg-emerald-500 transition-colors border border-emerald-500/50"
          >
            <WalletCards className="w-4 h-4 text-emerald-200" />
            <span>Sổ Quỹ lớp</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {/* Card 1: Students */}
        <div 
          onClick={() => onNavigate('students')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-teal-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Sĩ số lớp</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {students.length} <span className="text-xs font-normal text-slate-500 font-sans">học sinh</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>{students.filter(s => s.gender === 'Nữ').length} nữ / {students.filter(s => s.gender === 'Nam').length} nam</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Card 2: Attendance Today */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-teal-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Có mặt hôm nay</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {attendanceToday.hasMarkedToday ? attendanceToday.present : 'Chưa điểm danh'}
            {attendanceToday.hasMarkedToday && (
              <span className="text-xs font-normal text-slate-500 font-sans ml-1">/{students.length}</span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {attendanceToday.hasMarkedToday ? (
              <span>Vắng phép: {attendanceToday.excused} · K.phép: {attendanceToday.unexcused}</span>
            ) : (
              <span className="text-amber-600 font-medium">Bấm để điểm danh</span>
            )}
          </div>
        </div>

        {/* Card 3: Total Competition Points */}
        <div 
          onClick={() => onNavigate('competition')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-teal-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tổng điểm thi đua</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalPoints} <span className="text-xs font-normal text-slate-500 font-sans">điểm</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>{store.competitionEvents.length} sự kiện ghi nhận</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Card 4: Praises & Rewards */}
        <div 
          onClick={() => onNavigate('comments')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-teal-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tuyên dương & Góp ý</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {praisedCount} <span className="text-xs font-normal text-slate-500 font-sans">lượt khen</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>{store.comments.length} nhận xét lưu trữ</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Main Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols wide on desktop): Charts & Top Students */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Thi đua các Tổ */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Điểm thi đua theo Tổ</h3>
                <p className="text-xs text-slate-500">Tổng điểm tích lũy của các thành viên trong 4 tổ</p>
              </div>
              <button
                onClick={() => onNavigate('teams')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <span>Xem chi tiết tổ</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {[1, 2, 3, 4].map(teamNum => {
                const teamInfo = store.teams.find(t => t.number === teamNum);
                const score = teamScores[teamNum] || 0;
                const percent = Math.min(Math.round((score / maxTeamScore) * 100), 100);
                const memberCount = students.filter(s => s.teamNumber === teamNum).length;

                return (
                  <div key={teamNum} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-800 font-semibold">
                        {teamInfo ? teamInfo.name : `Tổ ${teamNum}`} ({memberCount} HS)
                      </span>
                      <span className="font-mono tabular-nums font-bold text-teal-700">
                        {score} điểm
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Top 5 Học sinh tiêu biểu */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Bảng vàng vinh danh học sinh</h3>
                <p className="text-xs text-slate-500">Các bạn dẫn đầu điểm thi đua tích cực của lớp</p>
              </div>
              <button
                onClick={() => onNavigate('students')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <span>Toàn bộ danh sách</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-2 pl-2">Hạng</th>
                    <th className="pb-2">Học sinh</th>
                    <th className="pb-2">Tổ</th>
                    <th className="pb-2">Chức vụ</th>
                    <th className="pb-2 text-right">Điểm thi đua</th>
                    <th className="pb-2 text-right pr-2">Số xu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topStudents.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 pl-2">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-bold text-[11px] ${
                          idx === 0 ? 'bg-amber-100 text-amber-800' :
                          idx === 1 ? 'bg-slate-200 text-slate-700' :
                          idx === 2 ? 'bg-amber-50 text-amber-700' : 'text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold text-slate-900">{s.fullName}</td>
                      <td className="py-2.5 text-slate-600">Tổ {s.teamNumber}</td>
                      <td className="py-2.5 text-slate-500">{s.role}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-teal-700 tabular-nums">
                        {s.points}
                      </td>
                      <td className="py-2.5 text-right pr-2 font-mono font-medium text-amber-600 tabular-nums">
                        {s.coins}
                      </td>
                    </tr>
                  ))}
                  {topStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        Chưa có học sinh nào trong lớp. Bấm "Thêm học sinh" để bắt đầu!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Live Feed */}
        <div className="space-y-6">
          {/* Quick Actions Shortcuts */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Thao tác nhanh</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  soundManager.playClick(store.settings.soundEnabled);
                  onNavigate('attendance');
                }}
                className="p-3 text-left rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all"
              >
                <CalendarCheck className="w-5 h-5 text-teal-600 mb-1.5" />
                <div className="text-xs font-bold text-slate-800">Điểm danh</div>
                <div className="text-[11px] text-slate-500">Chuyên cần hôm nay</div>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick(store.settings.soundEnabled);
                  onNavigate('competition');
                }}
                className="p-3 text-left rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all"
              >
                <Trophy className="w-5 h-5 text-amber-500 mb-1.5" />
                <div className="text-xs font-bold text-slate-800">Cộng/Trừ điểm</div>
                <div className="text-[11px] text-slate-500">Ghi nhận thi đua</div>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick(store.settings.soundEnabled);
                  onNavigate('groups');
                }}
                className="p-3 text-left rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all"
              >
                <UsersRound className="w-5 h-5 text-blue-500 mb-1.5" />
                <div className="text-xs font-bold text-slate-800">Chia nhóm</div>
                <div className="text-[11px] text-slate-500">Thảo luận bài tập</div>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick(store.settings.soundEnabled);
                  onNavigate('wheel');
                }}
                className="p-3 text-left rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all"
              >
                <Disc className="w-5 h-5 text-purple-500 mb-1.5" />
                <div className="text-xs font-bold text-slate-800">Vòng quay</div>
                <div className="text-[11px] text-slate-500">Gọi trả bài ngẫu nhiên</div>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick(store.settings.soundEnabled);
                  onNavigate('finance');
                }}
                className="col-span-2 p-3 text-left rounded-xl border border-emerald-200 bg-emerald-50/40 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <WalletCards className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Quản lý Thu / Chi (Tài chính Quỹ lớp)</div>
                    <div className="text-[11px] text-slate-500">Theo dõi thu quỹ, chi tiêu và xuất báo cáo phụ huynh</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 font-mono">
                  Chi tiết →
                </span>
              </button>
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-teal-600" />
                <span>Thông báo lớp</span>
              </h3>
              <button
                onClick={() => onNavigate('comments')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700"
              >
                Tất cả
              </button>
            </div>

            <div className="space-y-3">
              {recentAnnouncements.map(ann => (
                <div key={ann.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-900 line-clamp-1">{ann.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{ann.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{ann.content}</p>
                </div>
              ))}
              {recentAnnouncements.length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">Chưa có thông báo nào.</p>
              )}
            </div>
          </div>

          {/* Recent Competition Feed */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Hoạt động thi đua mới</span>
              </h3>
              <button
                onClick={() => onNavigate('competition')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700"
              >
                Xem sổ
              </button>
            </div>

            <div className="space-y-2.5">
              {recentEvents.map(ev => (
                <div key={ev.id} className="flex items-start justify-between text-xs pb-2 border-b border-slate-100 last:border-b-0">
                  <div>
                    <span className="font-semibold text-slate-900">{ev.targetName}</span>
                    <p className="text-[11px] text-slate-500">{ev.criterionName}</p>
                  </div>
                  <span className={`font-mono font-bold tabular-nums shrink-0 ml-2 ${ev.points >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {ev.points > 0 ? `+${ev.points}` : ev.points}
                  </span>
                </div>
              ))}
              {recentEvents.length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">Chưa có ghi nhận thi đua nào.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
