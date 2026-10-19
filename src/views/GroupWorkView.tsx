import React, { useState } from 'react';
import { 
  UsersRound, 
  Shuffle, 
  Save, 
  Printer, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowRightLeft,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Student, StudyGroup, StudyGroupPlan, ClassProStore } from '../types';
import { soundManager } from '../utils/audio';

interface GroupWorkViewProps {
  store: ClassProStore;
  onUpdateStore: (updater: (prev: ClassProStore) => ClassProStore) => void;
}

export const GroupWorkView: React.FC<GroupWorkViewProps> = ({
  store,
  onUpdateStore
}) => {
  const students = store.students;

  // Configuration
  const [splitMode, setSplitMode] = useState<'byCount' | 'bySize'>('byCount');
  const [targetNumber, setTargetNumber] = useState<number>(4);
  const [method, setMethod] = useState<'random' | 'roundRobin'>('random');
  const [planTitle, setPlanTitle] = useState('Thảo luận nhóm bài học mới');

  // Active working groups state
  const [currentGroups, setCurrentGroups] = useState<StudyGroup[]>(() => {
    if (store.groupPlans.length > 0) {
      return store.groupPlans[0].groups;
    }
    return [];
  });

  // Selected student for moving
  const [selectedStudentToMove, setSelectedStudentToMove] = useState<{ studentId: string; fromGroupId: string } | null>(null);

  // Auto group algorithm
  const handleGenerateGroups = () => {
    soundManager.playSuccess(store.settings.soundEnabled);
    if (students.length === 0) return;

    let numGroups = 4;
    if (splitMode === 'byCount') {
      numGroups = Math.max(1, Math.min(targetNumber, students.length));
    } else {
      // By size
      const size = Math.max(1, targetNumber);
      numGroups = Math.max(1, Math.ceil(students.length / size));
    }

    const groups: StudyGroup[] = Array.from({ length: numGroups }, (_, i) => ({
      id: `g-${Date.now()}-${i}`,
      name: `Nhóm ${i + 1}`,
      studentIds: []
    }));

    let studentPool = [...students];

    if (method === 'random') {
      // Fisher-Yates shuffle
      for (let i = studentPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [studentPool[i], studentPool[j]] = [studentPool[j], studentPool[i]];
      }
      // Distribute evenly
      studentPool.forEach((student, idx) => {
        const gIdx = idx % numGroups;
        groups[gIdx].studentIds.push(student.id);
      });
    } else {
      // Round robin sorting by team to mix teams
      studentPool.sort((a, b) => a.teamNumber - b.teamNumber);
      studentPool.forEach((student, idx) => {
        const gIdx = idx % numGroups;
        groups[gIdx].studentIds.push(student.id);
      });
    }

    setCurrentGroups(groups);
    setSelectedStudentToMove(null);
  };

  const handleSavePlan = () => {
    if (currentGroups.length === 0) return;
    const newPlan: StudyGroupPlan = {
      id: `plan-${Date.now()}`,
      name: planTitle.trim() || 'Phương án chia nhóm',
      createdAt: new Date().toISOString(),
      groups: currentGroups
    };

    onUpdateStore(prev => ({
      ...prev,
      groupPlans: [newPlan, ...prev.groupPlans]
    }));

    soundManager.playSuccess(store.settings.soundEnabled);
    alert('Đã lưu phương án chia nhóm thành công!');
  };

  const handleRenameGroup = (groupId: string, newName: string) => {
    setCurrentGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));
  };

  const handleSelectStudentForMove = (studentId: string, fromGroupId: string) => {
    soundManager.playClick(store.settings.soundEnabled);
    if (selectedStudentToMove && selectedStudentToMove.studentId === studentId) {
      setSelectedStudentToMove(null); // toggle off
    } else {
      setSelectedStudentToMove({ studentId, fromGroupId });
    }
  };

  const handleMoveToGroup = (targetGroupId: string) => {
    if (!selectedStudentToMove || selectedStudentToMove.fromGroupId === targetGroupId) {
      return;
    }
    soundManager.playSuccess(store.settings.soundEnabled);
    const { studentId, fromGroupId } = selectedStudentToMove;

    setCurrentGroups(prev => {
      return prev.map(g => {
        if (g.id === fromGroupId) {
          return { ...g, studentIds: g.studentIds.filter(id => id !== studentId) };
        }
        if (g.id === targetGroupId) {
          return { ...g, studentIds: [...g.studentIds, studentId] };
        }
        return g;
      });
    });

    setSelectedStudentToMove(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chia nhóm Học tập</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự động chia nhóm thảo luận, ngẫu nhiên hoặc trộn đều theo tổ và dễ dàng chuyển đổi học sinh
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In danh sách nhóm</span>
          </button>

          <button
            onClick={handleSavePlan}
            disabled={currentGroups.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Lưu phương án</span>
          </button>
        </div>
      </div>

      {/* Generator Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tên chủ đề thảo luận</label>
            <input
              type="text"
              value={planTitle}
              onChange={e => setPlanTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cách chia nhóm</label>
            <select
              value={splitMode}
              onChange={e => setSplitMode(e.target.value as 'byCount' | 'bySize')}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="byCount">Chia cố định theo số lượng nhóm</option>
              <option value="bySize">Chia theo số học sinh / nhóm</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {splitMode === 'byCount' ? 'Số nhóm mong muốn' : 'Số học sinh mỗi nhóm'}
            </label>
            <input
              type="number"
              min={2}
              max={20}
              value={targetNumber}
              onChange={e => setTargetNumber(Math.max(2, Number(e.target.value)))}
              className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quy luật chia</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value as 'random' | 'roundRobin')}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="random">Ngẫu nhiên hoàn toàn (Random)</option>
              <option value="roundRobin">Trộn đều các tổ (Round-robin)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
          <div className="text-xs text-slate-500">
            Sĩ số: <strong className="text-slate-800">{students.length} học sinh</strong>
            {currentGroups.length > 0 && (
              <span> · Đang chia làm <strong>{currentGroups.length} nhóm</strong></span>
            )}
          </div>

          <button
            onClick={handleGenerateGroups}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            <span>Tạo nhóm / Trộn lại ngẫu nhiên</span>
          </button>
        </div>
      </div>

      {/* Moving Helper Notification */}
      {selectedStudentToMove && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800 flex items-center justify-between">
          <span>
            Đang chọn học sinh: <strong>{students.find(s => s.id === selectedStudentToMove.studentId)?.fullName}</strong>.
            Nhấn nút <strong>"Chuyển vào đây"</strong> ở nhóm bạn muốn chuyển sang.
          </span>
          <button
            onClick={() => setSelectedStudentToMove(null)}
            className="text-amber-700 font-bold hover:underline"
          >
            Hủy chuyển
          </button>
        </div>
      )}

      {/* Display Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 printable-area">
        {currentGroups.map((group) => {
          const isTarget = selectedStudentToMove && selectedStudentToMove.fromGroupId !== group.id;

          return (
            <div
              key={group.id}
              className={`bg-white rounded-xl border p-4 shadow-2xs flex flex-col justify-between transition-all ${
                isTarget ? 'border-dashed border-teal-400 bg-teal-50/20' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Group Title */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                  <input
                    type="text"
                    value={group.name}
                    onChange={e => handleRenameGroup(group.id, e.target.value)}
                    className="font-bold text-slate-900 text-sm bg-transparent hover:bg-slate-50 focus:bg-white px-1.5 py-0.5 rounded border border-transparent focus:border-slate-200 focus:outline-none w-4/5"
                  />
                  <span className="text-[11px] font-mono font-semibold text-slate-500">
                    {group.studentIds.length} HS
                  </span>
                </div>

                {/* Member List */}
                <div className="space-y-1.5">
                  {group.studentIds.map(stId => {
                    const st = students.find(s => s.id === stId);
                    if (!st) return null;
                    const isSelected = selectedStudentToMove?.studentId === st.id;

                    return (
                      <div
                        key={st.id}
                        onClick={() => handleSelectStudentForMove(st.id, group.id)}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-100 border border-amber-300 text-amber-900 font-semibold'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                        title="Bấm để chọn và chuyển học sinh sang nhóm khác"
                      >
                        <div className="truncate">
                          <span className="font-semibold block truncate">{st.fullName}</span>
                          <span className="text-[10px] text-slate-400">Tổ {st.teamNumber} · {st.code}</span>
                        </div>
                        <ArrowRightLeft className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-700' : 'text-slate-400'}`} />
                      </div>
                    );
                  })}
                  {group.studentIds.length === 0 && (
                    <div className="py-4 text-center text-slate-400 text-xs italic">
                      Nhóm chưa có học sinh
                    </div>
                  )}
                </div>
              </div>

              {/* Move here button */}
              {isTarget && (
                <button
                  type="button"
                  onClick={() => handleMoveToGroup(group.id)}
                  className="mt-3 w-full py-1.5 text-xs font-semibold text-teal-700 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors"
                >
                  Chuyển vào {group.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {currentGroups.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 text-xs">
          Chưa tạo nhóm. Hãy chọn số nhóm và bấm <strong>"Tạo nhóm / Trộn lại ngẫu nhiên"</strong> ở trên!
        </div>
      )}
    </div>
  );
};
