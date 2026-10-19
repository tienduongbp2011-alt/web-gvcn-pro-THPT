import React, { useState, useEffect, useRef } from 'react';
import { 
  Disc, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  History, 
  UserCheck, 
  Trash2, 
  Sparkles,
  Trophy,
  Users
} from 'lucide-react';
import { Student, ClassProStore } from '../types';
import { soundManager } from '../utils/audio';

interface LuckyWheelViewProps {
  store: ClassProStore;
  onUpdateStore: (updater: (prev: ClassProStore) => ClassProStore) => void;
}

const DEFAULT_WHEEL_GIFTS = [
  'Cộng +5 điểm thi đua',
  'Miễn trực nhật 1 buổi',
  'Tràng pháo tay cổ vũ',
  'Bút bi may mắn',
  'Chọn bài hát sinh hoạt',
  'Đổi chỗ ngồi 1 tiết',
  'Một lời khen từ GVCN',
  'Cộng +10 điểm thi đua'
];

export const LuckyWheelView: React.FC<LuckyWheelViewProps> = ({
  store,
  onUpdateStore
}) => {
  const students = store.students;

  const [mode, setMode] = useState<'students' | 'teams' | 'gifts'>('students');
  const [teamFilter, setTeamFilter] = useState<number | 'all'>('all');
  const [removeAfterPick, setRemoveAfterPick] = useState(false);

  // Active items in the wheel pool
  const [activeItems, setActiveItems] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string; name: string; time: string }[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef<number>(0);
  const spinSpeedRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickAngleRef = useRef<number>(0);

  // Re-populate activeItems when mode or filter changes
  useEffect(() => {
    if (mode === 'students') {
      const filtered = students
        .filter(s => teamFilter === 'all' || s.teamNumber === teamFilter)
        .map(s => s.fullName);
      setActiveItems(filtered.length > 0 ? filtered : ['Chưa có học sinh']);
    } else if (mode === 'teams') {
      setActiveItems(store.teams.map(t => t.name));
    } else {
      setActiveItems(DEFAULT_WHEEL_GIFTS);
    }
  }, [mode, teamFilter, students, store.teams]);

  // Color palette for slices
  const sliceColors = [
    '#0d9488', '#0891b2', '#0284c7', '#2563eb', 
    '#4f46e5', '#7c3aed', '#9333ea', '#c026d3', 
    '#db2777', '#e11d48', '#ea580c', '#d97706', '#16a34a'
  ];

  // Draw the wheel onto canvas
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;

    ctx.clearRect(0, 0, width, height);

    const numItems = activeItems.length || 1;
    const arcAngle = (2 * Math.PI) / numItems;

    // Draw wheel outer ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();
    ctx.restore();

    // Draw slices
    activeItems.forEach((item, index) => {
      const startAngle = currentAngleRef.current + index * arcAngle;
      const endAngle = startAngle + arcAngle;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = sliceColors[index % sliceColors.length];
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Text label
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + arcAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 4;

      // Truncate text if needed
      const maxTextLen = 14;
      const displayLabel = item.length > maxTextLen ? item.substring(0, maxTextLen) + '...' : item;
      ctx.fillText(displayLabel, radius - 20, 4);
      ctx.restore();
      ctx.restore();
    });

    // Draw center peg
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#0d9488';
    ctx.fill();
    ctx.restore();
  };

  useEffect(() => {
    drawWheel();
  }, [activeItems]);

  const handleStartSpin = () => {
    if (isSpinning || activeItems.length === 0) return;

    soundManager.playClick(store.settings.soundEnabled);
    setIsSpinning(true);
    setWinner(null);

    // Initial random speed
    spinSpeedRef.current = 0.25 + Math.random() * 0.15;
    const deceleration = 0.988 + Math.random() * 0.003; // smooth slowing down

    const animate = () => {
      currentAngleRef.current = (currentAngleRef.current + spinSpeedRef.current) % (2 * Math.PI);
      spinSpeedRef.current *= deceleration;

      // Check if we passed a slice border to trigger audio tick
      const arcAngle = (2 * Math.PI) / activeItems.length;
      const currentSliceIdx = Math.floor(currentAngleRef.current / arcAngle);
      if (currentSliceIdx !== lastTickAngleRef.current) {
        soundManager.playTick(store.settings.soundEnabled);
        lastTickAngleRef.current = currentSliceIdx;
      }

      drawWheel();

      if (spinSpeedRef.current > 0.002) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Spin finished!
        setIsSpinning(false);
        spinSpeedRef.current = 0;

        // Calculate winning slice (at top pointer, 3 * PI / 2 or 0 depending on coordinate)
        // Pointer is at the right or top. Let's assume pointer is at the TOP (angle = 3*PI/2)
        // Angle pointing to top is (3*PI/2 - currentAngle) % 2PI
        let normalizedAngle = (3 * Math.PI / 2 - currentAngleRef.current) % (2 * Math.PI);
        if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;

        const winningIdx = Math.floor(normalizedAngle / arcAngle) % activeItems.length;
        const selectedWinner = activeItems[winningIdx];

        setWinner(selectedWinner);
        soundManager.playFanfare(store.settings.soundEnabled);

        // Record history
        setHistory(prev => [
          {
            id: `spin-${Date.now()}`,
            name: selectedWinner,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          },
          ...prev
        ]);

        // Remove after pick if enabled
        if (removeAfterPick && activeItems.length > 1) {
          setActiveItems(prev => prev.filter((_, idx) => idx !== winningIdx));
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handleResetList = () => {
    soundManager.playClick(store.settings.soundEnabled);
    if (mode === 'students') {
      const filtered = students
        .filter(s => teamFilter === 'all' || s.teamNumber === teamFilter)
        .map(s => s.fullName);
      setActiveItems(filtered);
    } else if (mode === 'teams') {
      setActiveItems(store.teams.map(t => t.name));
    } else {
      setActiveItems(store.rewards.map(r => r.name));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Vòng Quay May Mắn</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Công cụ gọi trả bài, chọn người phát biểu ngẫu nhiên hoặc bốc thăm trúng thưởng trong giờ sinh hoạt lớp
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => {
                soundManager.playClick(store.settings.soundEnabled);
                setMode('students');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'students' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Học sinh
            </button>
            <button
              onClick={() => {
                soundManager.playClick(store.settings.soundEnabled);
                setMode('teams');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'teams' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Các Tổ
            </button>
            <button
              onClick={() => {
                soundManager.playClick(store.settings.soundEnabled);
                setMode('rewards');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                mode === 'rewards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Phần quà
            </button>
          </div>
        </div>
      </div>

      {/* Main Wheel Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wheel Canvas Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col items-center justify-center relative overflow-hidden">
          {/* Top Pointer Indicator */}
          <div className="absolute top-8 z-10 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-red-600 drop-shadow-md" />
          </div>

          <div className="relative my-4">
            <canvas
              ref={canvasRef}
              width={380}
              height={380}
              className="max-w-full h-auto drop-shadow-lg"
            />
          </div>

          {/* Spin controls */}
          <div className="mt-4 flex items-center gap-3 flex-wrap justify-center">
            <button
              disabled={isSpinning || activeItems.length === 0}
              onClick={handleStartSpin}
              className="px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 rounded-2xl shadow-md transition-all transform active:scale-95 flex items-center gap-2"
            >
              <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'Đang quay...' : 'QUAY NGAY!'}</span>
            </button>

            <button
              onClick={handleResetList}
              disabled={isSpinning}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Khôi phục danh sách
            </button>
          </div>

          {/* Options toggle */}
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-600 flex-wrap justify-center">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={removeAfterPick}
                onChange={e => setRemoveAfterPick(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Loại người đã trúng khỏi lượt sau</span>
            </label>

            {mode === 'students' && (
              <div className="flex items-center gap-1">
                <span>Lọc theo:</span>
                <select
                  value={teamFilter}
                  onChange={e => setTeamFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-2 py-0.5 border border-slate-200 rounded text-xs bg-white"
                >
                  <option value="all">Cả lớp ({students.length})</option>
                  <option value="1">Tổ 1</option>
                  <option value="2">Tổ 2</option>
                  <option value="3">Tổ 3</option>
                  <option value="4">Tổ 4</option>
                </select>
              </div>
            )}
          </div>

          {/* Winner Celebratory Modal / Banner */}
          {winner && (
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg text-center max-w-md w-full animate-bounce">
              <div className="text-xs uppercase font-bold tracking-wider text-amber-100 flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>KẾT QUẢ QUAY MAY MẮN</span>
                <Sparkles className="w-4 h-4 text-amber-200" />
              </div>
              <div className="text-2xl font-extrabold mt-1 tracking-tight">
                {winner}
              </div>
              <p className="text-xs text-amber-100 mt-1">Xin chúc mừng! Cả lớp hãy cho một tràng pháo tay!</p>
            </div>
          )}
        </div>

        {/* Sidebar: Current Items & Spin History */}
        <div className="space-y-6">
          {/* Active Pool */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900">
                Danh sách trong vòng quay ({activeItems.length})
              </h3>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
              {activeItems.map((item, i) => (
                <div key={i} className="px-2.5 py-1.5 rounded-lg bg-slate-50 flex items-center justify-between text-slate-700">
                  <span className="truncate">{item}</span>
                  <span className="text-[10px] text-slate-400 font-mono">#{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Spin History */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-teal-600" />
                <span>Lịch sử các lượt quay</span>
              </h3>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-[10px] text-slate-400 hover:text-red-500"
                >
                  Xóa lịch sử
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {history.map((h, i) => (
                <div key={h.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{h.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{h.time}</span>
                  </div>
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center italic">Chưa có lượt quay nào.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
