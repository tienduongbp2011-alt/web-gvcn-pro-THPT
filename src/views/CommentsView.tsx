import React, { useState, useMemo } from 'react';
import { 
  MessageSquareText, 
  Bell, 
  Plus, 
  Search, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Edit3, 
  X, 
  Printer, 
  Heart, 
  Sparkles, 
  Pin,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Announcement, StudentComment, CommentCategory, ClassProStore } from '../types';
import { soundManager } from '../utils/audio';

interface CommentsViewProps {
  store: ClassProStore;
  onUpdateStore: (updater: (prev: ClassProStore) => ClassProStore) => void;
}

export const CommentsView: React.FC<CommentsViewProps> = ({
  store,
  onUpdateStore
}) => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'comments'>('comments');
  const students = store.students;

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
  const [isAddCommentOpen, setIsAddCommentOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<StudentComment | null>(null);

  // Announcement Form
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<Announcement['type']>('general');
  const [annPinned, setAnnPinned] = useState(false);

  // Comment Form
  const [commentStudentId, setCommentStudentId] = useState(students[0]?.id || '');
  const [commentCategory, setCommentCategory] = useState<CommentCategory>('praise');
  const [commentStrengths, setCommentStrengths] = useState('');
  const [commentNeedsImp, setCommentNeedsImp] = useState('');
  const [commentSupport, setCommentSupport] = useState('');

  // Sample constructive template suggestion helper
  const handleApplyTemplate = (type: CommentCategory) => {
    soundManager.playClick(store.settings.soundEnabled);
    if (type === 'praise') {
      setCommentCategory('praise');
      setCommentStrengths('Rất tích cực phát biểu xây dựng bài, tinh thần tự giác cao.');
      setCommentNeedsImp('Tiếp tục duy trì phong độ và chia sẻ phương pháp học với các bạn.');
      setCommentSupport('Biểu dương trước lớp trong giờ sinh hoạt và cộng điểm thi đua.');
    } else if (type === 'progress') {
      setCommentCategory('progress');
      setCommentStrengths('Có nhiều tiến bộ rõ rệt trong việc làm bài tập về nhà đầy đủ.');
      setCommentNeedsImp('Cần chú ý cẩn thận hơn trong các phép tính chi tiết.');
      setCommentSupport('Động viên kịp thời và giao bạn cán sự bộ môn kèm thêm khi làm bài.');
    } else if (type === 'support') {
      setCommentCategory('support');
      setCommentStrengths('Có năng khiếu và ý thức giữ gìn vệ sinh lớp rất tốt.');
      setCommentNeedsImp('Môn Toán/Anh còn nắm chưa vững kiến thức cơ bản ở phần đại số.');
      setCommentSupport('Phân công học nhóm đôi bạn cùng tiến và theo dõi phiếu học tập mỗi tuần.');
    } else {
      setCommentCategory('reminder');
      setCommentStrengths('Hoạt bát, nhanh nhẹn, hòa đồng với bạn bè.');
      setCommentNeedsImp('Đôi lúc còn nói chuyện riêng trong giờ học, chưa tập trung nghe giảng.');
      setCommentSupport('Nhắc nhở riêng sau tiết học và trao đổi phối hợp với phụ huynh hỗ trợ rèn nề nếp.');
    }
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: annTitle.trim(),
      content: annContent.trim(),
      date: new Date().toISOString().split('T')[0],
      type: annType,
      isPinned: annPinned
    };

    onUpdateStore(prev => ({
      ...prev,
      announcements: [newAnn, ...prev.announcements]
    }));

    soundManager.playSuccess(store.settings.soundEnabled);
    setIsAddAnnouncementOpen(false);
    setAnnTitle('');
    setAnnContent('');
    setAnnPinned(false);
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm('Thầy/Cô có chắc muốn xóa thông báo này?')) {
      onUpdateStore(prev => ({
        ...prev,
        announcements: prev.announcements.filter(a => a.id !== id)
      }));
      soundManager.playPenalty(store.settings.soundEnabled);
    }
  };

  const handleOpenAddComment = () => {
    soundManager.playClick(store.settings.soundEnabled);
    setEditingComment(null);
    setCommentStudentId(students[0]?.id || '');
    setCommentCategory('praise');
    setCommentStrengths('');
    setCommentNeedsImp('');
    setCommentSupport('');
    setIsAddCommentOpen(true);
  };

  const handleOpenEditComment = (c: StudentComment) => {
    soundManager.playClick(store.settings.soundEnabled);
    setEditingComment(c);
    setCommentStudentId(c.studentId);
    setCommentCategory(c.category);
    setCommentStrengths(c.strengths);
    setCommentNeedsImp(c.needsImprovement);
    setCommentSupport(c.supportAction);
    setIsAddCommentOpen(true);
  };

  const handleSaveComment = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find(s => s.id === commentStudentId);
    if (!st) return;

    if (editingComment) {
      onUpdateStore(prev => ({
        ...prev,
        comments: prev.comments.map(c => 
          c.id === editingComment.id
            ? {
                ...c,
                studentId: st.id,
                studentName: st.fullName,
                category: commentCategory,
                strengths: commentStrengths,
                needsImprovement: commentNeedsImp,
                supportAction: commentSupport
              }
            : c
        )
      }));
    } else {
      const newComment: StudentComment = {
        id: `comm-${Date.now()}`,
        studentId: st.id,
        studentName: st.fullName,
        date: new Date().toISOString().split('T')[0],
        category: commentCategory,
        strengths: commentStrengths,
        needsImprovement: commentNeedsImp,
        supportAction: commentSupport,
        isResolved: false
      };
      onUpdateStore(prev => ({
        ...prev,
        comments: [newComment, ...prev.comments]
      }));
    }

    soundManager.playSuccess(store.settings.soundEnabled);
    setIsAddCommentOpen(false);
  };

  const handleToggleResolved = (commentId: string) => {
    soundManager.playClick(store.settings.soundEnabled);
    onUpdateStore(prev => ({
      ...prev,
      comments: prev.comments.map(c => c.id === commentId ? { ...c, isResolved: !c.isResolved } : c)
    }));
  };

  const handleDeleteComment = (id: string) => {
    if (confirm('Thầy/Cô có muốn xóa nhận xét này không?')) {
      onUpdateStore(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== id)
      }));
      soundManager.playPenalty(store.settings.soundEnabled);
    }
  };

  const filteredComments = useMemo(() => {
    return store.comments.filter(c => {
      const matchSearch = c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.strengths.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.needsImprovement.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === 'all' || c.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [store.comments, searchTerm, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Thông báo & Nhận xét</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sổ ghi chép thông báo chung và theo dõi nhận xét mang tính xây dựng cho từng học sinh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'comments' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nhận xét học sinh ({store.comments.length})
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'announcements' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thông báo lớp ({store.announcements.length})
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In sổ</span>
          </button>
        </div>
      </div>

      {activeTab === 'comments' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm nhận xét theo tên học sinh, nội dung..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">Tất cả loại nhận xét</option>
                <option value="praise">Tuyên dương / Khen ngợi</option>
                <option value="progress">Tiến bộ vượt bậc</option>
                <option value="support">Cần hỗ trợ học tập</option>
                <option value="reminder">Nhắc nhở nề nếp</option>
              </select>

              <button
                onClick={handleOpenAddComment}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Viết nhận xét mới</span>
              </button>
            </div>
          </div>

          {/* Comments list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 printable-area">
            {filteredComments.map(c => {
              const categoryDetails: Record<CommentCategory, { label: string; bg: string; text: string; icon: any }> = {
                praise: { label: 'Tuyên dương', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: Sparkles },
                progress: { label: 'Tiến bộ', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: TrendingUp },
                support: { label: 'Cần hỗ trợ', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', icon: Heart },
                reminder: { label: 'Nhắc nhở', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: AlertTriangle }
              };
              const meta = categoryDetails[c.category] || categoryDetails.praise;
              const IconComp = meta.icon;

              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-xl border p-4 shadow-2xs space-y-3 transition-all ${
                    c.isResolved ? 'opacity-75 border-slate-200' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{c.studentName}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${meta.bg} ${meta.text}`}>
                          <IconComp className="w-3 h-3" />
                          {meta.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">{c.date}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleResolved(c.id)}
                        title={c.isResolved ? 'Đánh dấu chưa xử lý' : 'Đánh dấu đã hỗ trợ xong'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          c.isResolved ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditComment(c)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    {c.strengths && (
                      <div className="bg-emerald-50/40 p-2 rounded-lg border border-emerald-100/60">
                        <span className="font-semibold text-emerald-800 block text-[11px]">Ưu điểm / Điểm mạnh:</span>
                        <p className="text-slate-700 mt-0.5">{c.strengths}</p>
                      </div>
                    )}
                    {c.needsImprovement && (
                      <div className="bg-amber-50/40 p-2 rounded-lg border border-amber-100/60">
                        <span className="font-semibold text-amber-800 block text-[11px]">Nội dung cần cải thiện:</span>
                        <p className="text-slate-700 mt-0.5">{c.needsImprovement}</p>
                      </div>
                    )}
                    {c.supportAction && (
                      <div className="bg-blue-50/40 p-2 rounded-lg border border-blue-100/60">
                        <span className="font-semibold text-blue-800 block text-[11px]">Kế hoạch hỗ trợ của GVCN:</span>
                        <p className="text-slate-700 mt-0.5">{c.supportAction}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredComments.length === 0 && (
              <div className="col-span-2 py-10 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                Chưa có nhận xét nào phù hợp. Bấm "Viết nhận xét mới" để tạo ghi chú sư phạm!
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                soundManager.playClick(store.settings.soundEnabled);
                setIsAddAnnouncementOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo thông báo mới</span>
            </button>
          </div>

          <div className="space-y-3">
            {store.announcements.map(ann => (
              <div
                key={ann.id}
                className={`bg-white rounded-xl border p-4 shadow-2xs space-y-2 ${
                  ann.isPinned ? 'border-teal-400 bg-teal-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {ann.isPinned && <Pin className="w-3.5 h-3.5 text-teal-600" />}
                    <h3 className="font-bold text-slate-900 text-sm">{ann.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">{ann.date}</span>
                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
              </div>
            ))}
            {store.announcements.length === 0 && (
              <div className="py-10 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                Chưa có thông báo nào trong lớp.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Write or Edit Comment */}
      {isAddCommentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingComment ? 'Chỉnh sửa nhận xét sư phạm' : 'Ghi nhận xét học sinh'}
              </h3>
              <button onClick={() => setIsAddCommentOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick template buttons */}
            <div className="mt-3">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Mẫu nhanh sư phạm:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('praise')}
                  className="px-2 py-1 text-[11px] rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                >
                  Khen ngợi
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('progress')}
                  className="px-2 py-1 text-[11px] rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                >
                  Tiến bộ
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('support')}
                  className="px-2 py-1 text-[11px] rounded bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                >
                  Hỗ trợ
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('reminder')}
                  className="px-2 py-1 text-[11px] rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                >
                  Nhắc nhở
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveComment} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Học sinh được nhận xét *</label>
                <select
                  value={commentStudentId}
                  onChange={e => setCommentStudentId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.code} - Tổ {s.teamNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Loại nhận xét</label>
                <select
                  value={commentCategory}
                  onChange={e => setCommentCategory(e.target.value as CommentCategory)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="praise">Tuyên dương / Khen ngợi</option>
                  <option value="progress">Ghi nhận tiến bộ</option>
                  <option value="support">Cần hỗ trợ học tập</option>
                  <option value="reminder">Nhắc nhở nề nếp</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Điểm mạnh / Ưu điểm</label>
                <textarea
                  rows={2}
                  placeholder="Ghi nhận cụ thể việc làm tốt của em..."
                  value={commentStrengths}
                  onChange={e => setCommentStrengths(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Việc cần cải thiện</label>
                <textarea
                  rows={2}
                  placeholder="Điểm cần điều chỉnh nhẹ nhàng, tôn trọng..."
                  value={commentNeedsImp}
                  onChange={e => setCommentNeedsImp(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hướng hỗ trợ & Giải pháp của GVCN</label>
                <textarea
                  rows={2}
                  placeholder="Kế hoạch kèm cặp, phối hợp gia đình..."
                  value={commentSupport}
                  onChange={e => setCommentSupport(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCommentOpen(false)}
                  className="px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Lưu nhận xét
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Announcement */}
      {isAddAnnouncementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tạo thông báo mới</h3>
              <button onClick={() => setIsAddAnnouncementOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tiêu đề thông báo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kế hoạch kiểm tra định kỳ tuần sau"
                  value={annTitle}
                  onChange={e => setAnnTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nội dung chi tiết *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ghi rõ nội dung thông báo cho học sinh..."
                  value={annContent}
                  onChange={e => setAnnContent(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={annPinned}
                  onChange={e => setAnnPinned(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="pinCheck" className="text-slate-700 font-medium">
                  Ghim lên đầu bảng tin
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddAnnouncementOpen(false)}
                  className="px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Đăng thông báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
