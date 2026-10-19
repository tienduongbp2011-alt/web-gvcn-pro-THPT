import React, { useState } from 'react';
import { 
  Grid3X3, 
  Save, 
  Printer, 
  Plus, 
  Minus, 
  Search, 
  UserCheck, 
  RotateCcw,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { Student, SeatingChartData, SeatPosition, ClassProStore } from '../types';
import { soundManager } from '../utils/audio';

interface SeatingViewProps {
  store: ClassProStore;
  onUpdateStore: (updater: (prev: ClassProStore) => ClassProStore) => void;
}

export const SeatingView: React.FC<SeatingViewProps> = ({
  store,
  onUpdateStore
}) => {
  const currentClass = store.classes.find(c => c.id === store.currentClassId) || store.classes[0];
  const students = store.students;

  // Seating grid configuration
  const [rows, setRows] = useState(store.seatingChart.rows || 4);
  const [cols, setCols] = useState(store.seatingChart.cols || 4);
  const [seats, setSeats] = useState<SeatPosition[]>(store.seatingChart.seats || []);

  // Click-to-swap selection
  const [selectedSeat, setSelectedSeat] = useState<SeatPosition | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Unseated students
  const seatedStudentIds = new Set(seats.map(s => s.studentId).filter(Boolean));
  const unseatedStudents = students.filter(s => !seatedStudentIds.has(s.id));

  const handleUpdateDimensions = (newRows: number, newCols: number) => {
    soundManager.playClick(store.settings.soundEnabled);
    const updatedRows = Math.max(2, Math.min(newRows, 8));
    const updatedCols = Math.max(2, Math.min(newCols, 8));
    setRows(updatedRows);
    setCols(updatedCols);

    // Build or keep existing seats
    const newSeats: SeatPosition[] = [];
    for (let r = 1; r <= updatedRows; r++) {
      for (let c = 1; c <= updatedCols; c++) {
        const existing = seats.find(s => s.row === r && s.col === c);
        newSeats.push({
          row: r,
          col: c,
          studentId: existing ? existing.studentId : undefined
        });
      }
    }
    setSeats(newSeats);
  };

  const handleSeatClick = (seat: SeatPosition) => {
    soundManager.playClick(store.settings.soundEnabled);
    if (!selectedSeat) {
      // First click: select this seat
      setSelectedSeat(seat);
    } else {
      // Second click: swap student IDs between selectedSeat and clicked seat!
      soundManager.playSuccess(store.settings.soundEnabled);
      const student1 = selectedSeat.studentId;
      const student2 = seat.studentId;

      setSeats(prev => prev.map(s => {
        if (s.row === selectedSeat.row && s.col === selectedSeat.col) {
          return { ...s, studentId: student2 };
        }
        if (s.row === seat.row && s.col === seat.col) {
          return { ...s, studentId: student1 };
        }
        return s;
      }));

      setSelectedSeat(null);
    }
  };

  const handlePlaceUnseatedStudent = (studentId: string) => {
    soundManager.playClick(store.settings.soundEnabled);
    if (selectedSeat) {
      // Place student in selected seat
      setSeats(prev => prev.map(s => 
        s.row === selectedSeat.row && s.col === selectedSeat.col ? { ...s, studentId } : s
      ));
      setSelectedSeat(null);
      soundManager.playSuccess(store.settings.soundEnabled);
    } else {
      // Find first empty seat
      const firstEmpty = seats.find(s => !s.studentId);
      if (firstEmpty) {
        setSeats(prev => prev.map(s => 
          s.row === firstEmpty.row && s.col === firstEmpty.col ? { ...s, studentId } : s
        ));
        soundManager.playSuccess(store.settings.soundEnabled);
      } else {
        alert('Không còn chỗ trống trên sơ đồ. Thầy/Cô vui lòng tăng số hàng hoặc số cột.');
      }
    }
  };

  const handleRemoveFromSeat = (seat: SeatPosition, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playPenalty(store.settings.soundEnabled);
    setSeats(prev => prev.map(s => 
      s.row === seat.row && s.col === seat.col ? { ...s, studentId: undefined } : s
    ));
    if (selectedSeat && selectedSeat.row === seat.row && selectedSeat.col === seat.col) {
      setSelectedSeat(null);
    }
  };

  const handleSaveSeating = () => {
    onUpdateStore(prev => ({
      ...prev,
      seatingChart: {
        rows,
        cols,
        seats,
        updatedAt: new Date().toISOString()
      }
    }));
    soundManager.playSuccess(store.settings.soundEnabled);
    alert('Đã lưu sơ đồ chỗ ngồi thành công!');
  };

  const handleAutoArrange = () => {
    soundManager.playSuccess(store.settings.soundEnabled);
    // Auto arrange students sequentially by team or alphabetically
    const sorted = [...students].sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));
    const newSeats: SeatPosition[] = [];
    let idx = 0;
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        newSeats.push({
          row: r,
          col: c,
          studentId: idx < sorted.length ? sorted[idx].id : undefined
        });
        idx++;
      }
    }
    setSeats(newSeats);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sơ đồ Chỗ ngồi Lớp học</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sắp xếp vị trí bàn học trực quan, hỗ trợ kéo đổi chỗ và in ấn treo tường
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In sơ đồ lớp</span>
          </button>

          <button
            onClick={handleSaveSeating}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Lưu sơ đồ</span>
          </button>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between no-print">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Số hàng:</span>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
              <button
                onClick={() => handleUpdateDimensions(rows - 1, cols)}
                className="px-2 py-1 text-slate-600 hover:bg-slate-200"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2 font-mono font-bold text-slate-800">{rows}</span>
              <button
                onClick={() => handleUpdateDimensions(rows + 1, cols)}
                className="px-2 py-1 text-slate-600 hover:bg-slate-200"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Số dãy bàn:</span>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
              <button
                onClick={() => handleUpdateDimensions(rows, cols - 1)}
                className="px-2 py-1 text-slate-600 hover:bg-slate-200"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2 font-mono font-bold text-slate-800">{cols}</span>
              <button
                onClick={() => handleUpdateDimensions(rows, cols + 1)}
                className="px-2 py-1 text-slate-600 hover:bg-slate-200"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <button
            onClick={handleAutoArrange}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Xếp tự động A-Z</span>
          </button>
        </div>

        {/* Search highlight */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm vị trí học sinh..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {selectedSeat && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-center justify-between no-print">
          <span>
            Đang chọn vị trí <strong>Hàng {selectedSeat.row}, Bàn {selectedSeat.col}</strong>.
            Nhấn vào một vị trí khác để <strong>hoán đổi chỗ</strong>, hoặc chọn học sinh chưa xếp bàn bên dưới.
          </span>
          <button onClick={() => setSelectedSeat(null)} className="font-bold underline">
            Hủy chọn
          </button>
        </div>
      )}

      {/* Seating Layout Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 printable-area">
        {/* Blackboard & Teacher Desk */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="bg-slate-800 text-slate-200 py-2 rounded-lg text-center font-bold text-xs uppercase tracking-wider shadow-inner">
            BẢNG LỚP HỌC
          </div>
          <div className="flex justify-center">
            <div className="bg-amber-100 border border-amber-300 text-amber-900 px-6 py-1.5 rounded-lg text-xs font-semibold shadow-xs">
              Bục Giảng & Bàn Giáo Viên
            </div>
          </div>
        </div>

        {/* Seat Grid */}
        <div
          className="grid gap-3 max-w-4xl mx-auto"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: rows }).map((_, rIdx) => {
            const rowNum = rIdx + 1;
            return Array.from({ length: cols }).map((_, cIdx) => {
              const colNum = cIdx + 1;
              const seat = seats.find(s => s.row === rowNum && s.col === colNum) || { row: rowNum, col: colNum };
              const student = students.find(s => s.id === seat.studentId);
              const isSelected = selectedSeat && selectedSeat.row === rowNum && selectedSeat.col === colNum;
              const isHighlighted = searchTerm && student && student.fullName.toLowerCase().includes(searchTerm.toLowerCase());

              return (
                <div
                  key={`${rowNum}-${colNum}`}
                  onClick={() => handleSeatClick(seat)}
                  className={`min-h-[85px] p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-400 shadow-sm'
                      : isHighlighted
                      ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400'
                      : student
                      ? 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                      : 'border-dashed border-slate-200 bg-slate-50/50 hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>H{rowNum}-B{colNum}</span>
                    {student && (
                      <span className="font-semibold text-teal-700">T{student.teamNumber}</span>
                    )}
                  </div>

                  {student ? (
                    <div className="my-1">
                      <span className="font-bold text-xs text-slate-900 block truncate leading-tight">
                        {student.fullName}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {student.code} · {student.role}
                      </span>
                    </div>
                  ) : (
                    <div className="my-auto text-center text-slate-400 text-[11px] italic">
                      Chỗ trống
                    </div>
                  )}

                  {student && (
                    <div className="flex justify-end no-print">
                      <button
                        onClick={(e) => handleRemoveFromSeat(seat, e)}
                        className="text-[10px] text-slate-400 hover:text-red-500"
                        title="Bỏ học sinh khỏi chỗ"
                      >
                        Bỏ chỗ
                      </button>
                    </div>
                  )}
                </div>
              );
            });
          })}
        </div>

        {/* Door and back indication */}
        <div className="max-w-4xl mx-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>← Cửa ra vào phía trước</span>
          <span>Cuối lớp học ↓</span>
        </div>
      </div>

      {/* Unseated students pool */}
      {unseatedStudents.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs no-print">
          <h3 className="text-xs font-bold text-slate-900 mb-2">
            Học sinh chưa được xếp chỗ ({unseatedStudents.length} em)
          </h3>
          <p className="text-[11px] text-slate-500 mb-3">
            Bấm vào học sinh bên dưới để xếp vào ô ghế đang chọn (hoặc ô trống đầu tiên)
          </p>

          <div className="flex flex-wrap gap-2">
            {unseatedStudents.map(s => (
              <button
                key={s.id}
                onClick={() => handlePlaceUnseatedStudent(s.id)}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 transition-colors flex items-center gap-1.5"
              >
                <span>{s.fullName}</span>
                <span className="text-[10px] text-slate-400">({s.code})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
