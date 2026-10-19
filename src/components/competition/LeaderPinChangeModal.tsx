import React, { useState } from 'react';
import { X, KeyRound, Check, RotateCcw, User } from 'lucide-react';
import { Student, TeamInfo, TeamLeaderAccount } from '../../types';
import { soundManager } from '../../utils/audio';

interface LeaderPinChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamInfo;
  account: TeamLeaderAccount;
  students: Student[];
  onSave: (teamNumber: number, newPin: string, leaderStudentId: string) => void;
  soundEnabled: boolean;
}

export const LeaderPinChangeModal: React.FC<LeaderPinChangeModalProps> = ({
  isOpen,
  onClose,
  team,
  account,
  students,
  onSave,
  soundEnabled
}) => {
  const [pin, setPin] = useState(account.pin || '1234');
  const [selectedLeaderId, setSelectedLeaderId] = useState(account.studentId || '');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const teamMembers = students.filter(s => s.teamNumber === team.number);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setErrorMsg('Mã PIN cần có ít nhất 4 ký tự số.');
      return;
    }

    soundManager.playSuccess(soundEnabled);
    onSave(team.number, pin.trim(), selectedLeaderId);
    onClose();
  };

  const handleResetDefault = () => {
    setPin('1234');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900">Thiết lập tài khoản {team.name}</h3>
            <p className="text-xs text-slate-500">Cập nhật mã PIN và chỉ định học sinh Tổ trưởng</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Học sinh giữ chức vụ Tổ trưởng *
            </label>
            <select
              value={selectedLeaderId}
              onChange={e => setSelectedLeaderId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Chọn thành viên trong tổ --</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.code}) {m.role === 'Tổ trưởng' ? '★ Tổ trưởng' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Mã PIN đăng nhập *</label>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-[11px] text-teal-600 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại 1234</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={e => {
                  setPin(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full pl-9 pr-3 py-2 font-mono tracking-widest text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Ví dụ: 1234"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Mã PIN 4–6 ký tự số giúp tổ trưởng đăng nhập nhanh khi được bàn giao máy chấm thi đua.
            </span>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
