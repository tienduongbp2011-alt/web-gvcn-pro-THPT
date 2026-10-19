import React, { useState } from 'react';
import { 
  Layers, 
  UserCheck, 
  Printer, 
  ArrowRightLeft, 
  Crown, 
  ShieldAlert, 
  Plus, 
  Edit2, 
  Check, 
  Users 
} from 'lucide-react';
import { Student, TeamInfo, ClassProStore } from '../types';
import { soundManager } from '../utils/audio';

interface TeamsViewProps {
  store: ClassProStore;
  onUpdateStore: (updater: (prev: ClassProStore) => ClassProStore) => void;
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  store,
  onUpdateStore
}) => {
  const students = store.students;
  const teams = store.teams || [];

  const [editingTeamNumber, setEditingTeamNumber] = useState<number | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [movingStudent, setMovingStudent] = useState<Student | null>(null);

  // Check unassigned students (teamNumber not in 1..teams.length)
  const unassignedStudents = students.filter(s => !s.teamNumber || s.teamNumber < 1 || s.teamNumber > teams.length);

  const handleStartRenameTeam = (team: TeamInfo) => {
    soundManager.playClick(store.settings.soundEnabled);
    setEditingTeamNumber(team.number);
    setEditingTeamName(team.name);
  };

  const handleSaveRenameTeam = (teamNumber: number) => {
    if (!editingTeamName.trim()) return;
    onUpdateStore(prev => ({
      ...prev,
      teams: prev.teams.map(t => t.number === teamNumber ? { ...t, name: editingTeamName.trim() } : t)
    }));
    soundManager.playSuccess(store.settings.soundEnabled);
    setEditingTeamNumber(null);
  };

  const handleAssignLeader = (teamNumber: number, roleType: 'leader' | 'deputy', studentId: string) => {
    soundManager.playSuccess(store.settings.soundEnabled);
    onUpdateStore(prev => {
      // update team info
      const newTeams = prev.teams.map(t => {
        if (t.number === teamNumber) {
          return {
            ...t,
            leaderId: roleType === 'leader' ? studentId : t.leaderId,
            deputyId: roleType === 'deputy' ? studentId : t.deputyId
          };
        }
        return t;
      });

      // update student role label
      const newStudents = prev.students.map(s => {
        if (s.id === studentId) {
          return { ...s, role: roleType === 'leader' ? 'Tổ trưởng' : 'Tổ phó' } as Student;
        }
        return s;
      });

      // update leaderAccounts if assigning leader
      const newLeaderAccounts = prev.leaderAccounts?.map(a => {
        if (roleType === 'leader' && a.teamNumber === teamNumber) {
          return { ...a, studentId };
        }
        return a;
      });

      return {
        ...prev,
        teams: newTeams,
        students: newStudents,
        leaderAccounts: newLeaderAccounts || prev.leaderAccounts
      };
    });
  };

  const handleMoveStudentToTeam = (student: Student, targetTeamNum: number) => {
    soundManager.playSuccess(store.settings.soundEnabled);
    onUpdateStore(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === student.id ? { ...s, teamNumber: targetTeamNum } : s)
    }));
    setMovingStudent(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chia tổ Học sinh</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý cơ cấu các tổ, bổ nhiệm Tổ trưởng, Tổ phó và điều chuyển thành viên
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>In danh sách tổ</span>
        </button>
      </div>

      {/* Unassigned Warning Banner if any */}
      {unassignedStudents.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Có <strong>{unassignedStudents.length} học sinh</strong> chưa được phân tổ chính thức.</span>
          </div>
          <div className="flex gap-2">
            {unassignedStudents.map(s => (
              <button
                key={s.id}
                onClick={() => setMovingStudent(s)}
                className="px-2 py-1 bg-white text-amber-900 text-xs font-semibold rounded border border-amber-300"
              >
                Gán {s.fullName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Moving Notification */}
      {movingStudent && (
        <div className="bg-teal-50 border border-teal-200 p-3 rounded-xl text-xs text-teal-800 flex items-center justify-between">
          <span>
            Đang chuyển học sinh <strong>{movingStudent.fullName}</strong>. Chọn tổ bên dưới để chuyển vào:
          </span>
          <button onClick={() => setMovingStudent(null)} className="font-bold underline">
            Hủy
          </button>
        </div>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 printable-area">
        {teams.map(team => {
          const members = students.filter(s => s.teamNumber === team.number);
          const totalPoints = members.reduce((sum, s) => sum + s.points, 0);
          const leader = students.find(s => s.id === team.leaderId);
          const deputy = students.find(s => s.id === team.deputyId);

          return (
            <div key={team.number} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                {/* Team Header */}
                <div className="pb-3 border-b border-slate-100 mb-3">
                  {editingTeamNumber === team.number ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingTeamName}
                        onChange={e => setEditingTeamName(e.target.value)}
                        className="text-xs font-bold border border-teal-500 rounded px-2 py-1 w-full"
                      />
                      <button
                        onClick={() => handleSaveRenameTeam(team.number)}
                        className="p-1 bg-teal-600 text-white rounded"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm">{team.name}</h3>
                      <button
                        onClick={() => handleStartRenameTeam(team)}
                        className="p-1 text-slate-400 hover:text-teal-600"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{members.length} thành viên</span>
                    <span className="font-mono font-bold text-teal-700 tabular-nums">Tổng {totalPoints} điểm</span>
                  </div>
                </div>

                {/* Team Leadership */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5 text-xs mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-500" />
                      Tổ trưởng:
                    </span>
                    <select
                      value={team.leaderId || ''}
                      onChange={e => handleAssignLeader(team.number, 'leader', e.target.value)}
                      className="text-[11px] font-semibold text-slate-800 bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none"
                    >
                      <option value="">Chưa chọn</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>{m.fullName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-blue-500" />
                      Tổ phó:
                    </span>
                    <select
                      value={team.deputyId || ''}
                      onChange={e => handleAssignLeader(team.number, 'deputy', e.target.value)}
                      className="text-[11px] font-semibold text-slate-800 bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none"
                    >
                      <option value="">Chưa chọn</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>{m.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Member Roster */}
                <div className="space-y-1.5">
                  {members.map(m => (
                    <div
                      key={m.id}
                      className="p-2 rounded-lg bg-white border border-slate-100 hover:border-slate-200 text-xs flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{m.fullName}</div>
                        <div className="text-[10px] text-slate-400">
                          {m.code} · <span className="font-mono text-teal-700">{m.points}đ</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          soundManager.playClick(store.settings.soundEnabled);
                          setMovingStudent(m);
                        }}
                        title="Đổi tổ cho học sinh"
                        className="p-1 text-slate-400 hover:text-teal-600 rounded"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <p className="text-xs text-slate-400 py-4 text-center italic">Chưa có thành viên nào.</p>
                  )}
                </div>
              </div>

              {/* Move button if in moving mode */}
              {movingStudent && movingStudent.teamNumber !== team.number && (
                <button
                  type="button"
                  onClick={() => handleMoveStudentToTeam(movingStudent, team.number)}
                  className="mt-3 w-full py-1.5 text-xs font-semibold text-teal-700 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors"
                >
                  Chuyển vào {team.name}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
