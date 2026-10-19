import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  UserPlus, 
  FileCheck,
  AlertCircle,
  Eye,
  ArrowRight
} from 'lucide-react';
import { Student } from '../../types';
import { soundManager } from '../../utils/audio';
import { 
  parseStudentsFromExcelBuffer, 
  downloadStudentExcelTemplate, 
  ExcelImportResult 
} from '../../utils/excelImport';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudents: Student[];
  className?: string;
  onConfirmImport: (newStudents: Student[], mode: 'add_new' | 'update_existing' | 'replace_all') => void;
  soundEnabled: boolean;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  currentStudents,
  className = '9_1',
  onConfirmImport,
  soundEnabled
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'add_new' | 'update_existing' | 'replace_all'>('add_new');
  const [parseResult, setParseResult] = useState<ExcelImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPreviewTable, setShowPreviewTable] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File, mode: 'add_new' | 'update_existing' | 'replace_all') => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const buffer = await file.arrayBuffer();
      const result = parseStudentsFromExcelBuffer(buffer, currentStudents, mode);
      setParseResult(result);
      if (result.errors.length > 0 && result.added.length === 0 && result.updated.length === 0) {
        setErrorMsg(result.errors[0]);
        soundManager.playPenalty(soundEnabled);
      } else {
        soundManager.playClick(soundEnabled);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Không thể đọc file Excel. Vui lòng kiểm tra định dạng file (.xlsx, .xls, .csv).');
      soundManager.playPenalty(soundEnabled);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    handleProcessFile(file, importMode);
  };

  const handleModeChange = (newMode: 'add_new' | 'update_existing' | 'replace_all') => {
    setImportMode(newMode);
    if (selectedFile) {
      handleProcessFile(selectedFile, newMode);
    }
  };

  const handleDownloadTemplate = () => {
    soundManager.playSuccess(soundEnabled);
    downloadStudentExcelTemplate(className);
  };

  const handleConfirm = () => {
    if (!parseResult) return;

    let finalStudents: Student[] = [];

    if (importMode === 'replace_all') {
      finalStudents = parseResult.added;
    } else if (importMode === 'update_existing') {
      // Map existing students, replacing those that were updated, and appending new ones
      const updatedMap = new Map<string, Student>();
      parseResult.updated.forEach(s => updatedMap.set(s.id, s));

      const updatedList = currentStudents.map(s => updatedMap.get(s.id) || s);
      finalStudents = [...updatedList, ...parseResult.added];
    } else {
      // Add new only
      finalStudents = [...currentStudents, ...parseResult.added];
    }

    soundManager.playSuccess(soundEnabled);
    onConfirmImport(finalStudents, importMode);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setParseResult(null);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const totalAffected = parseResult
    ? (importMode === 'replace_all'
        ? parseResult.added.length
        : parseResult.added.length + parseResult.updated.length)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 text-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Nhập Danh Sách Học Sinh Từ File Excel</h3>
              <p className="text-xs text-slate-500">Hỗ trợ các định dạng file .xlsx, .xls và .csv phổ biến của trường học</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Top Actions: Template Download & Format Info */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 block text-xs">Mẫu file Excel chuẩn</span>
              <p className="text-slate-500 text-[11px]">
                Tải file Excel mẫu gồm các cột: <em>Mã HS, Họ và tên, Ngày sinh, Giới tính, Tổ, Chức vụ, SĐT HS, SĐT PH, Ghi chú</em>
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-xl transition-colors shadow-2xs shrink-0 self-start sm:self-center"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Tải file Excel mẫu (.xlsx)</span>
            </button>
          </div>

          {/* Import Mode Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-2">
              Chọn phương thức xử lý dữ liệu:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleModeChange('add_new')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  importMode === 'add_new'
                    ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20 text-teal-900 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>1. Thêm mới danh sách</span>
                  {importMode === 'add_new' && <CheckCircle className="w-4 h-4 text-teal-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Chỉ thêm các học sinh mới. Bỏ qua học sinh đã trùng mã HS có trong lớp.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('update_existing')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  importMode === 'update_existing'
                    ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20 text-teal-900 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>2. Cập nhật / Ghi đè</span>
                  {importMode === 'update_existing' && <CheckCircle className="w-4 h-4 text-teal-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Thêm mới học sinh chưa có, cập nhật thông tin nếu trùng mã HS cũ.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('replace_all')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  importMode === 'replace_all'
                    ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 text-amber-900 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>3. Thay thế toàn bộ</span>
                  {importMode === 'replace_all' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Xóa danh sách hiện tại và nhập toàn bộ danh sách mới từ file Excel.
                </p>
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Chọn hoặc kéo thả file Excel / CSV vào đây:
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
            >
              <div className="p-3 bg-slate-100 group-hover:bg-teal-100 text-slate-600 group-hover:text-teal-700 rounded-2xl transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 text-sm group-hover:text-teal-800">
                  {selectedFile ? selectedFile.name : 'Bấm vào đây để tải file lên'}
                </span>
                <p className="text-slate-400 text-xs">
                  Hỗ trợ định dạng: <strong>.xlsx, .xls, .csv</strong> (tối đa 15MB)
                </p>
              </div>
              {selectedFile && (
                <div className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Dung lượng: {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Summary Cards */}
          {parseResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block">Tổng số dòng đọc được</span>
                  <span className="text-lg font-bold text-slate-800 font-mono tabular-nums">{parseResult.totalRows}</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] text-emerald-700 block">Học sinh mới</span>
                  <span className="text-lg font-bold text-emerald-800 font-mono tabular-nums">+{parseResult.added.length}</span>
                </div>

                {importMode === 'update_existing' && (
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                    <span className="text-[11px] text-teal-700 block">Cập nhật thông tin</span>
                    <span className="text-lg font-bold text-teal-800 font-mono tabular-nums">{parseResult.updated.length}</span>
                  </div>
                )}

                {importMode === 'add_new' && parseResult.duplicates.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[11px] text-amber-700 block">Bỏ qua trùng lặp</span>
                    <span className="text-lg font-bold text-amber-800 font-mono tabular-nums">{parseResult.duplicates.length}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[11px] text-blue-700 block">Sĩ số lớp sau nhập</span>
                  <span className="text-lg font-bold text-blue-800 font-mono tabular-nums">
                    {importMode === 'replace_all'
                      ? parseResult.added.length
                      : currentStudents.length + parseResult.added.length} học sinh
                  </span>
                </div>
              </div>

              {/* Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    Bảng xem trước dữ liệu trích xuất ({parseResult.previewRows.length} học sinh):
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPreviewTable(!showPreviewTable)}
                    className="text-[11px] font-semibold text-teal-700 hover:underline"
                  >
                    {showPreviewTable ? 'Thu gọn bảng' : 'Mở rộng bảng'}
                  </button>
                </div>

                {showPreviewTable && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] sticky top-0">
                        <tr>
                          <th className="py-2.5 px-2.5">Mã HS</th>
                          <th className="py-2.5 px-2.5">Họ và tên</th>
                          <th className="py-2.5 px-2.5">Ngày sinh</th>
                          <th className="py-2.5 px-2.5">Giới tính</th>
                          <th className="py-2.5 px-2.5">Tổ</th>
                          <th className="py-2.5 px-2.5">Chức vụ</th>
                          <th className="py-2.5 px-2.5">SĐT PH</th>
                          <th className="py-2.5 px-2.5 text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parseResult.previewRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2 px-2.5 font-mono text-slate-500 font-medium">{row.code}</td>
                            <td className="py-2 px-2.5 font-bold text-slate-900">{row.fullName}</td>
                            <td className="py-2 px-2.5 font-mono text-slate-600">{row.dob || '—'}</td>
                            <td className="py-2 px-2.5 text-slate-700">{row.gender}</td>
                            <td className="py-2 px-2.5 text-slate-700">Tổ {row.teamNumber}</td>
                            <td className="py-2 px-2.5 text-slate-700">{row.role}</td>
                            <td className="py-2 px-2.5 font-mono text-slate-500">{row.parentPhone || '—'}</td>
                            <td className="py-2 px-2.5 text-right">
                              {row.status === 'new' && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                  Mới
                                </span>
                              )}
                              {row.status === 'update' && (
                                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded">
                                  Cập nhật
                                </span>
                              )}
                              {row.status === 'duplicate' && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                                  Trùng lặp
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-slate-500 text-[11px]">
            {parseResult ? (
              <span>
                Sẵn sàng xử lý <strong>{totalAffected}</strong> học sinh vào lớp {className}
              </span>
            ) : (
              <span>Vui lòng tải lên file Excel hoặc CSV để bắt đầu</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!parseResult || totalAffected === 0 || isLoading}
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Xác nhận nhập dữ liệu ({totalAffected})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
