import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  KeyRound, 
  ArrowRightLeft, 
  UserCheck, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Student, TeamInfo, TeamLeaderAccount, CrossGradingSettings } from '../../types';
import { soundManager } from '../../utils/audio';
import { getAssignedTeamsForLeader } from '../../utils/crossGrading';

interface TeamLeaderLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderAccounts: TeamLeaderAccount[];
  teams: TeamInfo[];
  students: Student[];
  crossSettings: CrossGradingSettings;
  onLoginSuccess: (leaderTeamNumber: number, leaderStudent: Student) => void;
  soundEnabled: boolean;
}

export const TeamLeaderLoginModal: React.FC<TeamLeaderLoginModalProps> = ({
  isOpen,
  onClose,
  leaderAccounts,
  teams,
  students,
  crossSettings,
  onLoginSuccess,
  soundEnabled
}) => {
  const [selectedTeamNum, setSelectedTeamNum] = useState<number>(1);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Tìm tài khoản và thông tin học sinh tổ trưởng được chọn
  const currentAccount = leaderAccounts.find(a => a.teamNumber === selectedTeamNum);
  const currentTeam = teams.find(t => t.number === selectedTeamNum);
  const currentLeaderStudent = students.find(s => s.id === currentAccount?.studentId);
  const assignedTeamNumbers = getAssignedTeamsForLeader(selectedTeamNum, crossSettings, leaderAccounts);

  const assignedTeamNames = assignedTeamNumbers.map(num => {
    const tm = teams.find(t => t.number === num);
    return tm ? tm.name : `Tổ ${num}`;
  }).join(', ');

  const handleSelectTeam = (teamNum: number) => {
    soundManager.playClick(soundEnabled);
    setSelectedTeamNum(teamNum);
    setPin('');
    setErrorMsg('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) {
      setErrorMsg('Chưa tìm thấy thông tin tài khoản tổ này.');
      return;
    }

    // Kiểm tra PIN
    const requiredPin = currentAccount.pin || '1234';
    if (pin.trim() !== requiredPin) {
      setErrorMsg('Mã PIN chưa chính xác. Vui lòng kiểm tra lại (mặc định: 1234).');
      soundManager.playPenalty(soundEnabled);
      return;
    }

    if (!currentLeaderStudent) {
      setErrorMsg('Chưa xác định được học sinh Tổ trưởng của tổ này.');
      return;
    }

    soundManager.playSuccess(soundEnabled);
    onLoginSuccess(selectedTeamNum, currentLeaderStudent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-slate-800 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Đăng nhập Tổ trưởng Chấm thi đua</h3>
              <p className="text-xs text-slate-500">Phân quyền chấm chéo công bằng giữa 4 tổ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Chọn Tổ trưởng */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            1. Chọn tổ trưởng đăng nhập:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map(num => {
              const tm = teams.find(t => t.number === num);
              const acc = leaderAccounts.find(a => a.teamNumber === num);
              const st = students.find(s => s.id === acc?.studentId);
              const isSelected = selectedTeamNum === num;
              const crossTargets = getAssignedTeamsForLeader(num, crossSettings, leaderAccounts);

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSelectTeam(num)}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{tm ? tm.name : `Tổ ${num}`}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-teal-800 mt-1 truncate">
                    {st ? st.fullName : 'Chưa chỉ định'}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1.5">
                    <ArrowRightLeft className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">Chấm: Tổ {crossTargets.join(', ')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Nhập PIN */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <div className="text-xs text-slate-600 flex items-center justify-between">
              <span>Đang chọn: <strong>{currentTeam?.name}</strong></span>
              <span className="text-[11px] text-teal-700 font-semibold">{currentLeaderStudent?.fullName}</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="text-slate-400">Nhiệm vụ phân công:</span>
              <span className="font-medium text-slate-700">Chấm thi đua cho {assignedTeamNames}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              2. Nhập mã PIN bảo mật của Tổ trưởng *
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="Nhập mã PIN (mặc định: 1234)"
                value={pin}
                onChange={e => {
                  setPin(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-widest border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
              <span>* Mã PIN mặc định ban đầu là: <strong>1234</strong></span>
              <button
                type="button"
                onClick={() => setPin('1234')}
                className="text-teal-600 hover:underline"
              >
                Điền nhanh 1234
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Đăng nhập quyền Tổ {selectedTeamNum}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
