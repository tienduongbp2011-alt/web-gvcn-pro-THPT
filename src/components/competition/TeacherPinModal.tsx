import React, { useState } from 'react';
import { X, Lock, KeyRound, AlertCircle, Shield } from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface TeacherPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  correctPin: string;
  onSuccess: () => void;
  soundEnabled: boolean;
  title?: string;
  description?: string;
}

export const TeacherPinModal: React.FC<TeacherPinModalProps> = ({
  isOpen,
  onClose,
  correctPin,
  onSuccess,
  soundEnabled,
  title = 'Xác thực Quyền Giáo Viên Chủ Nhiệm',
  description = 'Vui lòng nhập mã PIN bảo mật của Giáo viên để chuyển quyền quản trị hoặc thay đổi cài đặt.'
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = correctPin || '1234';
    if (pin.trim() !== target) {
      setErrorMsg('Mã PIN Giáo viên chưa đúng (mặc định: 1234).');
      soundManager.playPenalty(soundEnabled);
      return;
    }

    soundManager.playSuccess(soundEnabled);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-teal-700">
            <Shield className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500">{description}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mã PIN Giáo viên
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="Nhập PIN (mặc định: 1234)"
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
              <span>Mặc định: <strong>1234</strong></span>
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
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
            >
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
