import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Plus, 
  Minus, 
  History, 
  Settings2, 
  Trash2, 
  RotateCcw, 
  CheckCircle, 
  Download, 
  Printer, 
  Lock, 
  Unlock,
  AlertCircle,
  Filter,
  Users,
  ShieldCheck,
  UserCheck,
  ArrowRightLeft,
  KeyRound,
  LogOut,
  Sliders,
  Check,
  X,
  Eye,
  Crown,
  FileCheck2,
  ChevronRight,
  TrendingUp,
  Award,
  FileSpreadsheet,
  Calendar,
  CalendarDays,
  Medal,
  Sparkles,
  Star,
  Flame,
  Search
} from 'lucide-react';
import { 
  CompetitionCriterion, 
  CompetitionEvent, 
  Student, 
  TeamInfo,
  ClassProStore,
  TeamLeaderAccount,
  CrossGradingSettings
} from '../types';
import { soundManager } from '../utils/audio';
import { exportCompetitionReportCsv } from '../utils/storage';
import { 
  DEFAULT_CROSS_SETTINGS, 
  ensureLeaderAccounts, 
  getAssignedTeamsForLeader, 
  isStudentCrossGradable 
} from '../utils/crossGrading';
import {
  getCurrentWeekRange,
  getPreviousWeekRange,
  calculateWeeklyRankings,
  exportWeeklyCompetitionToExcel
} from '../utils/competitionExcel';
import { TeamLeaderLoginModal } from '../components/competition/TeamLeaderLoginModal';
import { TeacherPinModal } from '../components/competition/TeacherPinModal';
import { LeaderPinChangeModal } from '../components/competition/LeaderPinChangeModal';

interface CompetitionViewProps {
  store: ClassProStore;
  onUpdateStore: (updater: (prev: ClassProStore) => ClassProStore) => void;
}

export const CompetitionView: React.FC<CompetitionViewProps> = ({
  store,
  onUpdateStore
}) => {
  const currentClass = store.classes.find(c => c.id === store.currentClassId) || store.classes[0];
  const students = store.students;
  const criteria = store.criteria;
  const events = store.competitionEvents;
  const teams = store.teams || [];

  // Cross grading accounts & settings
  const leaderAccounts = useMemo(() => {
    return ensureLeaderAccounts(store.leaderAccounts, teams, students);
  }, [store.leaderAccounts, teams, students]);

  const crossSettings: CrossGradingSettings = store.crossGradingSettings || DEFAULT_CROSS_SETTINGS;

  // Active Role State
  const [activeRole, setActiveRole] = useState<'teacher' | 'leader'>('teacher');
  const [currentLeaderTeam, setCurrentLeaderTeam] = useState<number>(1);
  const [currentLeaderStudent, setCurrentLeaderStudent] = useState<Student | null>(null);

  // Modals state
  const [isLeaderLoginOpen, setIsLeaderLoginOpen] = useState(false);
  const [isTeacherPinModalOpen, setIsTeacherPinModalOpen] = useState(false);
  const [editingAccountTeam, setEditingAccountTeam] = useState<number | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'record' | 'cross_management' | 'history' | 'rankings' | 'criteria'>('record');
  const [crossSubTab, setCrossSubTab] = useState<'matrix' | 'accounts' | 'approvals' | 'stats' | 'rules'>('matrix');

  // Form state
  const [targetType, setTargetType] = useState<'individual' | 'team' | 'class'>('individual');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedTeamNumber, setSelectedTeamNumber] = useState<number>(2);
  const [selectedCriterionId, setSelectedCriterionId] = useState(criteria[0]?.id || '');
  const [customPoints, setCustomPoints] = useState<number | ''>('');
  const [eventNote, setEventNote] = useState('');
  // Multiplier for recording points (click 1 = 1x, click 2 = 2x...)
  const [criterionMultiplier, setCriterionMultiplier] = useState<number>(1);

  // Weekly Rankings State & Timeframe
  const defaultWeekRange = useMemo(() => getCurrentWeekRange(), []);
  const [rankingTimeframe, setRankingTimeframe] = useState<'this_week' | 'last_week' | 'all_time' | 'custom'>('this_week');
  const [customStartDate, setCustomStartDate] = useState(defaultWeekRange.startStr);
  const [customEndDate, setCustomEndDate] = useState(defaultWeekRange.endStr);
  const [rankingTeamFilter, setRankingTeamFilter] = useState<number | 'all'>('all');
  const [rankingSearchTerm, setRankingSearchTerm] = useState('');

  // History filters
  const [historyTargetFilter, setHistoryTargetFilter] = useState<'all' | 'individual' | 'team' | 'class'>('all');
  const [historyEvaluatorFilter, setHistoryEvaluatorFilter] = useState<string>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');

  // Criterion edit/add modal
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [newCritName, setNewCritName] = useState('');
  const [newCritType, setNewCritType] = useState<'bonus' | 'penalty'>('bonus');
  const [newCritPoints, setNewCritPoints] = useState<number>(2);
  const [newCritCategory, setNewCritCategory] = useState('Học tập');

  // Active criterion
  const activeCriterion = criteria.find(c => c.id === selectedCriterionId) || criteria[0];

  // Active timeframe range for rankings
  const activeTimeframeRange = useMemo(() => {
    if (rankingTimeframe === 'this_week') return getCurrentWeekRange();
    if (rankingTimeframe === 'last_week') return getPreviousWeekRange();
    if (rankingTimeframe === 'custom') {
      return {
        startStr: customStartDate,
        endStr: customEndDate,
        label: `Tùy chọn (${customStartDate} đến ${customEndDate})`,
        weekNumber: 0
      };
    }
    return {
      startStr: '2000-01-01',
      endStr: '2099-12-31',
      label: 'Toàn bộ thời gian (Cả kỳ học)',
      weekNumber: 0
    };
  }, [rankingTimeframe, customStartDate, customEndDate]);

  // Weekly Rankings computation
  const weeklyRankingsData = useMemo(() => {
    return calculateWeeklyRankings(
      students,
      teams,
      events,
      activeTimeframeRange.startStr,
      activeTimeframeRange.endStr
    );
  }, [students, teams, events, activeTimeframeRange]);

  // Assigned teams for active leader
  const activeLeaderAssignedTeams = useMemo(() => {
    if (activeRole !== 'leader' || !currentLeaderTeam) return [1, 2, 3, 4];
    return getAssignedTeamsForLeader(currentLeaderTeam, crossSettings, leaderAccounts);
  }, [activeRole, currentLeaderTeam, crossSettings, leaderAccounts]);

  // Eligible students for the current session
  const eligibleStudents = useMemo(() => {
    if (activeRole === 'teacher') return students;
    // Leader can ONLY grade students in assigned teams (strictly cross-grading)
    return students.filter(s => isStudentCrossGradable(s.teamNumber, currentLeaderTeam, activeLeaderAssignedTeams));
  }, [students, activeRole, currentLeaderTeam, activeLeaderAssignedTeams]);

  // Auto-select valid student if current selection is invalid
  React.useEffect(() => {
    if (eligibleStudents.length > 0) {
      if (!selectedStudentId || !eligibleStudents.some(s => s.id === selectedStudentId)) {
        setSelectedStudentId(eligibleStudents[0].id);
      }
    }
  }, [eligibleStudents, selectedStudentId]);

  // Auto-select valid team if in leader mode
  React.useEffect(() => {
    if (activeRole === 'leader') {
      if (!activeLeaderAssignedTeams.includes(selectedTeamNumber)) {
        setSelectedTeamNumber(activeLeaderAssignedTeams[0] || 1);
      }
      if (targetType === 'class') {
        setTargetType('individual');
      }
    }
  }, [activeRole, activeLeaderAssignedTeams, selectedTeamNumber, targetType]);

  // Handle Leader Login
  const handleLoginLeaderSuccess = (teamNum: number, leaderSt: Student) => {
    setActiveRole('leader');
    setCurrentLeaderTeam(teamNum);
    setCurrentLeaderStudent(leaderSt);
    setIsLeaderLoginOpen(false);
    setActiveTab('record');
  };

  // Handle Logout Leader (Return to Teacher)
  const handleRequestReturnToTeacher = () => {
    // Open Teacher PIN verification
    setIsTeacherPinModalOpen(true);
  };

  const handleReturnToTeacherSuccess = () => {
    setActiveRole('teacher');
    setCurrentLeaderStudent(null);
  };

  // Fast switch for Teacher in management view
  const handleQuickLoginAsLeader = (teamNum: number) => {
    const acc = leaderAccounts.find(a => a.teamNumber === teamNum);
    const st = students.find(s => s.id === acc?.studentId);
    if (!st) {
      alert(`Chưa tìm thấy học sinh Tổ trưởng của Tổ ${teamNum}. Vui lòng chỉ định trong bảng tổ.`);
      return;
    }
    soundManager.playSuccess(store.settings.soundEnabled);
    setActiveRole('leader');
    setCurrentLeaderTeam(teamNum);
    setCurrentLeaderStudent(st);
    setActiveTab('record');
  };

  // Record an Event
  const handleRecordEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (store.settings.isPeriodFrozen) {
      alert('Kỳ thi đua hiện đang bị KHÓA. Thầy/Cô vui lòng mở khóa trước khi ghi nhận thêm.');
      return;
    }

    if (!activeCriterion) return;

    const basePts = customPoints !== '' ? Number(customPoints) : (activeCriterion.type === 'penalty' ? -Math.abs(activeCriterion.defaultPoints) : Math.abs(activeCriterion.defaultPoints));
    const effectiveMultiplier = Math.max(1, criterionMultiplier || 1);
    const pts = basePts * effectiveMultiplier;

    // Limit points if in leader mode
    if (activeRole === 'leader') {
      const maxLimit = crossSettings.maxPointsPerRecord || 10;
      if (Math.abs(pts) > maxLimit) {
        alert(`Tổ trưởng chỉ được chấm tối đa ±${maxLimit} điểm cho mỗi sự kiện (Hiện tại: ${pts > 0 ? `+${pts}` : pts}đ do hệ số ${effectiveMultiplier}x). Vui lòng giảm số lần hoặc điểm.`);
        return;
      }
    }

    let targetName = '';
    let targetId: string | undefined = undefined;

    if (targetType === 'individual') {
      const st = eligibleStudents.find(s => s.id === selectedStudentId);
      if (!st) {
        alert('Vui lòng chọn học sinh hợp lệ.');
        return;
      }
      // Safety check: Cannot grade own team when in leader mode
      if (activeRole === 'leader' && st.teamNumber === currentLeaderTeam) {
        alert('Lỗi: Bạn không thể tự chấm điểm cho thành viên trong tổ của mình theo nguyên tắc chấm chéo!');
        return;
      }
      targetName = st.fullName;
      targetId = st.id;
    } else if (targetType === 'team') {
      // Safety check: Cannot grade own team
      if (activeRole === 'leader' && selectedTeamNumber === currentLeaderTeam) {
        alert('Lỗi: Tổ trưởng không được tự chấm tập thể tổ của chính mình!');
        return;
      }
      const tm = store.teams.find(t => t.number === selectedTeamNumber);
      targetName = tm ? tm.name : `Tổ ${selectedTeamNumber}`;
    } else {
      if (activeRole === 'leader') {
        alert('Tổ trưởng không có quyền chấm điểm cả lớp.');
        return;
      }
      targetName = `Tập thể Lớp ${currentClass?.name || '9/1'}`;
    }

    const isPending = activeRole === 'leader' && crossSettings.requireTeacherApproval;

    const autoNote = effectiveMultiplier > 1
      ? (eventNote.trim() ? `${eventNote.trim()} (${effectiveMultiplier}x)` : `${activeCriterion.name} (${effectiveMultiplier} lần)`)
      : eventNote.trim();

    const newEvent: CompetitionEvent = {
      id: `evt-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      targetType,
      targetId,
      targetName,
      criterionId: activeCriterion.id,
      criterionName: effectiveMultiplier > 1 ? `${activeCriterion.name} (${effectiveMultiplier}x)` : activeCriterion.name,
      points: pts,
      note: autoNote,
      timestamp: Date.now(),
      evaluatorRole: activeRole,
      evaluatorName: activeRole === 'leader'
        ? `Tổ trưởng Tổ ${currentLeaderTeam} - ${currentLeaderStudent?.fullName || 'Tổ trưởng'}`
        : 'Giáo viên chủ nhiệm',
      evaluatorTeamNumber: activeRole === 'leader' ? currentLeaderTeam : undefined,
      status: isPending ? 'pending' : 'approved'
    };

    onUpdateStore(prev => {
      let newStudents = [...prev.students];

      // Only modify points if event is approved immediately
      if (!isPending) {
        if (targetType === 'individual' && targetId) {
          newStudents = newStudents.map(s => {
            if (s.id === targetId) {
              const nextPts = s.points + pts;
              const nextCoins = prev.settings.syncPointsAndCoins ? Math.max(0, s.coins + pts) : s.coins;
              return { ...s, points: nextPts, coins: nextCoins };
            }
            return s;
          });
        } else if (targetType === 'team') {
          newStudents = newStudents.map(s => {
            if (s.teamNumber === selectedTeamNumber) {
              return { ...s, points: s.points + pts };
            }
            return s;
          });
        } else if (targetType === 'class') {
          newStudents = newStudents.map(s => ({
            ...s,
            points: s.points + pts
          }));
        }
      }

      return {
        ...prev,
        students: newStudents,
        competitionEvents: [newEvent, ...prev.competitionEvents]
      };
    });

    if (pts >= 0) {
      soundManager.playSuccess(store.settings.soundEnabled);
    } else {
      soundManager.playPenalty(store.settings.soundEnabled);
    }

    setEventNote('');
    setCustomPoints('');
    setCriterionMultiplier(1);

    if (isPending) {
      alert(`Đã ghi nhận phiếu chấm thi đua (${pts > 0 ? `+${pts}` : pts}đ - ${effectiveMultiplier}x cho ${targetName}). Phiếu đã chuyển tới Giáo viên chủ nhiệm chờ phê duyệt.`);
    } else {
      alert(`Đã ghi nhận ${pts > 0 ? `+${pts}` : pts} điểm (${effectiveMultiplier}x) cho ${targetName}!`);
    }
  };

  // Teacher Approvals
  const handleApproveEvent = (event: CompetitionEvent) => {
    onUpdateStore(prev => {
      let newStudents = [...prev.students];
      const pts = event.points;

      if (event.targetType === 'individual' && event.targetId) {
        newStudents = newStudents.map(s => {
          if (s.id === event.targetId) {
            const nextPts = s.points + pts;
            const nextCoins = prev.settings.syncPointsAndCoins ? Math.max(0, s.coins + pts) : s.coins;
            return { ...s, points: nextPts, coins: nextCoins };
          }
          return s;
        });
      } else if (event.targetType === 'team') {
        const team = prev.teams.find(t => t.name === event.targetName);
        const tNum = team ? team.number : 1;
        newStudents = newStudents.map(s => s.teamNumber === tNum ? { ...s, points: s.points + pts } : s);
      } else if (event.targetType === 'class') {
        newStudents = newStudents.map(s => ({ ...s, points: s.points + pts }));
      }

      return {
        ...prev,
        students: newStudents,
        competitionEvents: prev.competitionEvents.map(e => e.id === event.id ? { ...e, status: 'approved' } : e)
      };
    });
    soundManager.playSuccess(store.settings.soundEnabled);
  };

  const handleRejectEvent = (event: CompetitionEvent) => {
    if (confirm(`Thầy/Cô có chắc chắn muốn TỪ CHỐI phiếu chấm "${event.criterionName}" cho ${event.targetName}?`)) {
      onUpdateStore(prev => ({
        ...prev,
        competitionEvents: prev.competitionEvents.map(e => e.id === event.id ? { ...e, status: 'rejected' } : e)
      }));
      soundManager.playPenalty(store.settings.soundEnabled);
    }
  };

  const handleApproveAllPending = () => {
    const pendingEvents = events.filter(e => e.status === 'pending');
    if (pendingEvents.length === 0) return;

    if (confirm(`Duyệt toàn bộ ${pendingEvents.length} phiếu chấm thi đua chờ duyệt?`)) {
      onUpdateStore(prev => {
        let newStudents = [...prev.students];
        pendingEvents.forEach(ev => {
          const pts = ev.points;
          if (ev.targetType === 'individual' && ev.targetId) {
            newStudents = newStudents.map(s => {
              if (s.id === ev.targetId) {
                const nextPts = s.points + pts;
                const nextCoins = prev.settings.syncPointsAndCoins ? Math.max(0, s.coins + pts) : s.coins;
                return { ...s, points: nextPts, coins: nextCoins };
              }
              return s;
            });
          } else if (ev.targetType === 'team') {
            const team = prev.teams.find(t => t.name === ev.targetName);
            const tNum = team ? team.number : 1;
            newStudents = newStudents.map(s => s.teamNumber === tNum ? { ...s, points: s.points + pts } : s);
          } else if (ev.targetType === 'class') {
            newStudents = newStudents.map(s => ({ ...s, points: s.points + pts }));
          }
        });

        return {
          ...prev,
          students: newStudents,
          competitionEvents: prev.competitionEvents.map(e => e.status === 'pending' ? { ...e, status: 'approved' } : e)
        };
      });
      soundManager.playSuccess(store.settings.soundEnabled);
    }
  };

  // Undo / Delete Event
  const handleUndoEvent = (event: CompetitionEvent) => {
    if (confirm(`Thầy/Cô có muốn hoàn tác giao dịch "${event.criterionName}" (${event.points > 0 ? `+${event.points}` : event.points}đ cho ${event.targetName}) không?`)) {
      onUpdateStore(prev => {
        let newStudents = [...prev.students];
        // If it was approved, revert the score
        if (event.status !== 'pending' && event.status !== 'rejected') {
          const revertPts = -event.points;
          if (event.targetType === 'individual' && event.targetId) {
            newStudents = newStudents.map(s => {
              if (s.id === event.targetId) {
                const nextPts = s.points + revertPts;
                const nextCoins = prev.settings.syncPointsAndCoins ? Math.max(0, s.coins + revertPts) : s.coins;
                return { ...s, points: nextPts, coins: nextCoins };
              }
              return s;
            });
          } else if (event.targetType === 'team') {
            const team = prev.teams.find(t => t.name === event.targetName);
            const tNum = team ? team.number : 1;
            newStudents = newStudents.map(s => s.teamNumber === tNum ? { ...s, points: s.points + revertPts } : s);
          } else if (event.targetType === 'class') {
            newStudents = newStudents.map(s => ({ ...s, points: s.points + revertPts }));
          }
        }

        return {
          ...prev,
          students: newStudents,
          competitionEvents: prev.competitionEvents.filter(e => e.id !== event.id)
        };
      });

      soundManager.playClick(store.settings.soundEnabled);
    }
  };

  // Change cross grading rule preset
  const handleSetRulePreset = (preset: 'circular' | 'reverse' | 'paired' | 'all_others') => {
    onUpdateStore(prev => {
      let newAccounts = [...(prev.leaderAccounts || leaderAccounts)];
      let newRuleType: 'circular' | 'all_others' | 'custom' = 'custom';

      if (preset === 'circular') {
        newRuleType = 'circular';
        newAccounts = [1, 2, 3, 4].map(n => ({
          teamNumber: n,
          studentId: newAccounts.find(a => a.teamNumber === n)?.studentId || '',
          pin: newAccounts.find(a => a.teamNumber === n)?.pin || '1234',
          assignedTeamNumbers: [n === 4 ? 1 : n + 1]
        }));
      } else if (preset === 'reverse') {
        newRuleType = 'custom';
        newAccounts = [
          { teamNumber: 1, assignedTeamNumbers: [4] },
          { teamNumber: 2, assignedTeamNumbers: [1] },
          { teamNumber: 3, assignedTeamNumbers: [2] },
          { teamNumber: 4, assignedTeamNumbers: [3] }
        ].map(p => {
          const old = newAccounts.find(a => a.teamNumber === p.teamNumber);
          return {
            teamNumber: p.teamNumber,
            studentId: old?.studentId || '',
            pin: old?.pin || '1234',
            assignedTeamNumbers: p.assignedTeamNumbers
          };
        });
      } else if (preset === 'paired') {
        newRuleType = 'custom';
        newAccounts = [
          { teamNumber: 1, assignedTeamNumbers: [2] },
          { teamNumber: 2, assignedTeamNumbers: [1] },
          { teamNumber: 3, assignedTeamNumbers: [4] },
          { teamNumber: 4, assignedTeamNumbers: [3] }
        ].map(p => {
          const old = newAccounts.find(a => a.teamNumber === p.teamNumber);
          return {
            teamNumber: p.teamNumber,
            studentId: old?.studentId || '',
            pin: old?.pin || '1234',
            assignedTeamNumbers: p.assignedTeamNumbers
          };
        });
      } else if (preset === 'all_others') {
        newRuleType = 'all_others';
        newAccounts = [1, 2, 3, 4].map(n => ({
          teamNumber: n,
          studentId: newAccounts.find(a => a.teamNumber === n)?.studentId || '',
          pin: newAccounts.find(a => a.teamNumber === n)?.pin || '1234',
          assignedTeamNumbers: [1, 2, 3, 4].filter(x => x !== n)
        }));
      }

      return {
        ...prev,
        leaderAccounts: newAccounts,
        crossGradingSettings: {
          ...(prev.crossGradingSettings || DEFAULT_CROSS_SETTINGS),
          ruleType: newRuleType
        }
      };
    });
    soundManager.playSuccess(store.settings.soundEnabled);
  };

  // Toggle specific target in custom matrix
  const handleToggleMatrixAssignment = (leaderTeamNum: number, targetTeamNum: number) => {
    if (leaderTeamNum === targetTeamNum) return; // Cannot self-grade

    onUpdateStore(prev => {
      const currentAccs = prev.leaderAccounts || leaderAccounts;
      const targetAcc = currentAccs.find(a => a.teamNumber === leaderTeamNum);
      const currentAssigned = targetAcc?.assignedTeamNumbers || [];
      const isAlreadyAssigned = currentAssigned.includes(targetTeamNum);

      let nextAssigned: number[];
      if (isAlreadyAssigned) {
        nextAssigned = currentAssigned.filter(n => n !== targetTeamNum);
        if (nextAssigned.length === 0) {
          alert('Mỗi tổ trưởng cần được phân công ít nhất một tổ để chấm chéo!');
          return prev;
        }
      } else {
        nextAssigned = [...currentAssigned, targetTeamNum].sort((a, b) => a - b);
      }

      const nextAccounts = currentAccs.map(a => a.teamNumber === leaderTeamNum ? { ...a, assignedTeamNumbers: nextAssigned } : a);

      return {
        ...prev,
        leaderAccounts: nextAccounts,
        crossGradingSettings: {
          ...(prev.crossGradingSettings || DEFAULT_CROSS_SETTINGS),
          ruleType: 'custom'
        }
      };
    });
    soundManager.playClick(store.settings.soundEnabled);
  };

  // Save leader account edits
  const handleSaveLeaderAccount = (teamNum: number, newPin: string, leaderStudentId: string) => {
    onUpdateStore(prev => {
      const nextAccounts = (prev.leaderAccounts || leaderAccounts).map(a => {
        if (a.teamNumber === teamNum) {
          return { ...a, pin: newPin, studentId: leaderStudentId };
        }
        return a;
      });

      // Update team leader in teams list too
      const nextTeams = prev.teams.map(t => {
        if (t.number === teamNum) {
          return { ...t, leaderId: leaderStudentId };
        }
        return t;
      });

      // Update student role
      const nextStudents = prev.students.map(s => {
        if (s.id === leaderStudentId) {
          return { ...s, role: 'Tổ trưởng' as const };
        }
        return s;
      });

      return {
        ...prev,
        leaderAccounts: nextAccounts,
        teams: nextTeams,
        students: nextStudents
      };
    });
  };

  // Toggle Period Freeze
  const handleToggleFreeze = () => {
    onUpdateStore(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        isPeriodFrozen: !prev.settings.isPeriodFrozen
      }
    }));
    soundManager.playClick(store.settings.soundEnabled);
  };

  // Save new criterion
  const handleSaveNewCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCritName.trim()) return;

    const newCriterion: CompetitionCriterion = {
      id: `crit-${Date.now()}`,
      name: newCritName.trim(),
      type: newCritType,
      defaultPoints: Math.abs(newCritPoints),
      category: newCritCategory
    };

    onUpdateStore(prev => ({
      ...prev,
      criteria: [...prev.criteria, newCriterion]
    }));

    soundManager.playSuccess(store.settings.soundEnabled);
    setIsCriteriaModalOpen(false);
    setNewCritName('');
  };

  const handleDeleteCriterion = (id: string) => {
    if (confirm('Thầy/Cô có chắc chắn muốn xóa tiêu chí thi đua này?')) {
      onUpdateStore(prev => ({
        ...prev,
        criteria: prev.criteria.filter(c => c.id !== id)
      }));
      soundManager.playPenalty(store.settings.soundEnabled);
    }
  };

  // Team rankings
  const teamRankings = useMemo(() => {
    return [1, 2, 3, 4].map(teamNum => {
      const tm = store.teams.find(t => t.number === teamNum);
      const members = students.filter(s => s.teamNumber === teamNum);
      const totalPoints = members.reduce((sum, s) => sum + s.points, 0);
      const avgPoints = members.length > 0 ? (totalPoints / members.length).toFixed(1) : '0';
      return {
        number: teamNum,
        name: tm ? tm.name : `Tổ ${teamNum}`,
        memberCount: members.length,
        totalPoints,
        avgPoints
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [students, store.teams]);

  // Cross grading audit statistics
  const crossGradingStats = useMemo(() => {
    return [1, 2, 3, 4].map(teamNum => {
      const acc = leaderAccounts.find(a => a.teamNumber === teamNum);
      const leaderStudent = students.find(s => s.id === acc?.studentId);
      const team = teams.find(t => t.number === teamNum);
      const leaderEvents = events.filter(e => e.evaluatorTeamNumber === teamNum);
      const totalEvents = leaderEvents.length;
      const bonusEvents = leaderEvents.filter(e => e.points > 0);
      const penaltyEvents = leaderEvents.filter(e => e.points < 0);
      const totalBonusPoints = bonusEvents.reduce((acc, e) => acc + e.points, 0);
      const totalPenaltyPoints = penaltyEvents.reduce((acc, e) => acc + e.points, 0);
      const netPoints = totalBonusPoints + totalPenaltyPoints;

      return {
        teamNum,
        teamName: team?.name || `Tổ ${teamNum}`,
        leaderName: leaderStudent?.fullName || 'Chưa chọn',
        totalEvents,
        bonusCount: bonusEvents.length,
        penaltyCount: penaltyEvents.length,
        totalBonusPoints,
        totalPenaltyPoints,
        netPoints
      };
    });
  }, [leaderAccounts, students, teams, events]);

  // Pending approval events count
  const pendingApprovalsCount = useMemo(() => {
    return events.filter(e => e.status === 'pending').length;
  }, [events]);

  // Filtered history
  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      if (activeRole === 'leader') {
        // Leader only sees their own submitted events
        return ev.evaluatorTeamNumber === currentLeaderTeam;
      }

      if (historyTargetFilter !== 'all' && ev.targetType !== historyTargetFilter) return false;

      if (historyEvaluatorFilter === 'teacher' && ev.evaluatorRole !== 'teacher') return false;
      if (historyEvaluatorFilter.startsWith('leader_')) {
        const teamNum = Number(historyEvaluatorFilter.replace('leader_', ''));
        if (ev.evaluatorTeamNumber !== teamNum) return false;
      }

      if (historyStatusFilter !== 'all' && ev.status !== historyStatusFilter) return false;

      return true;
    });
  }, [events, activeRole, currentLeaderTeam, historyTargetFilter, historyEvaluatorFilter, historyStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Role State Banner */}
      <div className={`p-4 rounded-2xl border transition-all ${
        activeRole === 'leader'
          ? 'bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/5 border-teal-200 shadow-2xs'
          : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              activeRole === 'leader' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
            }`}>
              {activeRole === 'leader' ? <UserCheck className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">
                  {activeRole === 'leader'
                    ? `Phiên làm việc: Tổ trưởng Tổ ${currentLeaderTeam} – ${currentLeaderStudent?.fullName || 'Học sinh'}`
                    : 'Quyền Quản trị: Giáo viên Chủ nhiệm'}
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  activeRole === 'leader' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {activeRole === 'leader' ? 'Chế độ Chấm chéo' : 'Toàn quyền'}
                </span>
              </div>

              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                {activeRole === 'leader' ? (
                  <>
                    <span className="text-teal-700 font-semibold flex items-center gap-1">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      Đang chấm chéo cho: {activeLeaderAssignedTeams.map(n => `Tổ ${n}`).join(', ')}
                    </span>
                    <span>·</span>
                    <span className="text-slate-400">Không thể chấm điểm cho tổ của mình</span>
                  </>
                ) : (
                  <span>
                    Quản lý điểm thi đua, cấu hình phân công chấm chéo 4 tổ và phê duyệt phiếu điểm
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {activeRole === 'leader' ? (
              <button
                type="button"
                onClick={handleRequestReturnToTeacher}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Đăng xuất Tổ trưởng (Về quyền GV)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsLeaderLoginOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-2xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Đăng nhập Tổ trưởng chấm chéo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {activeRole === 'leader' ? 'Chấm Thi đua Chéo Giữa Các Tổ' : 'Thi đua & Nề nếp Lớp'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeRole === 'leader'
              ? 'Theo dõi, động viên và ghi nhận điểm thi đua khách quan cho các bạn tổ khác'
              : 'Ghi nhận điểm thưởng/phạt, phân quyền tổ trưởng chấm chéo và xếp hạng tổ'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('record')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'record' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {activeRole === 'leader' ? 'Chấm điểm chéo' : 'Ghi điểm'}
            </button>

            {activeRole === 'teacher' && (
              <button
                onClick={() => setActiveTab('cross_management')}
                className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'cross_management' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Phân quyền & Chấm chéo</span>
                {pendingApprovalsCount > 0 && (
                  <span className="w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'history' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {activeRole === 'leader' ? 'Lịch sử chấm của tôi' : `Lịch sử (${events.length})`}
            </button>

            <button
              onClick={() => setActiveTab('rankings')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'rankings' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Thứ hạng tuần (Cá nhân & Tổ)</span>
            </button>

            {activeRole === 'teacher' && (
              <button
                onClick={() => setActiveTab('criteria')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'criteria' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tiêu chí
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              soundManager.playSuccess(store.settings.soundEnabled);
              exportWeeklyCompetitionToExcel(
                currentClass,
                activeTimeframeRange.label,
                activeTimeframeRange.startStr,
                activeTimeframeRange.endStr,
                weeklyRankingsData.teamRankings,
                weeklyRankingsData.studentRankings,
                events
              );
            }}
            title="Xuất file Excel xếp hạng thi đua tuần của cá nhân và tổ (.xlsx)"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel Tuần (.xlsx)</span>
          </button>

          {activeRole === 'teacher' && (
            <>
              <button
                onClick={handleToggleFreeze}
                title={store.settings.isPeriodFrozen ? 'Kỳ thi đua đang khóa - bấm để mở' : 'Khóa kỳ thi đua'}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors border shadow-2xs ${
                  store.settings.isPeriodFrozen
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {store.settings.isPeriodFrozen ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Unlock className="w-3.5 h-3.5 text-slate-500" />}
                <span>{store.settings.isPeriodFrozen ? 'Đang khóa kỳ' : 'Khóa kỳ'}</span>
              </button>

              <button
                onClick={() => exportCompetitionReportCsv(events, currentClass?.name || '9_1')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Xuất CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {store.settings.isPeriodFrozen && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Kỳ thi đua này đã được khóa để tổng kết tuần/tháng. Không thể ghi nhận thêm điểm mới cho đến khi mở khóa.</span>
        </div>
      )}

      {/* TAB 1: RECORD COMPETITION POINTS (WITH CROSS-GRADING ENFORCEMENT) */}
      {activeTab === 'record' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeRole === 'leader' ? 'Phiếu Chấm Thi Đua Chéo' : 'Ghi nhận sự kiện thi đua nề nếp'}
                </h3>
                {activeRole === 'leader' && (
                  <p className="text-[11px] text-teal-700 font-medium">
                    Tổ trưởng {currentLeaderStudent?.fullName} phụ trách chấm: {activeLeaderAssignedTeams.map(n => `Tổ ${n}`).join(', ')}
                  </p>
                )}
              </div>

              {activeRole === 'leader' && crossSettings.requireTeacherApproval && (
                <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                  Cần GV phê duyệt
                </span>
              )}
            </div>

            <form onSubmit={handleRecordEvent} className="space-y-4 text-xs">
              {/* Target Type Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Đối tượng áp dụng</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('individual')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      targetType === 'individual'
                        ? 'bg-teal-50 border-teal-500 text-teal-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Học sinh cá nhân
                  </button>

                  {(activeRole === 'teacher' || crossSettings.allowGradingWholeTeam) && (
                    <button
                      type="button"
                      onClick={() => setTargetType('team')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        targetType === 'team'
                          ? 'bg-teal-50 border-teal-500 text-teal-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Tập thể Tổ
                    </button>
                  )}

                  {activeRole === 'teacher' && (
                    <button
                      type="button"
                      onClick={() => setTargetType('class')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        targetType === 'class'
                          ? 'bg-teal-50 border-teal-500 text-teal-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Cả lớp
                    </button>
                  )}
                </div>
              </div>

              {/* Target Chooser */}
              {targetType === 'individual' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">
                      Chọn học sinh được chấm *
                    </label>
                    {activeRole === 'leader' && (
                      <span className="text-[11px] text-slate-400">
                        (Đã lọc {eligibleStudents.length} bạn thuộc tổ được phân công)
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {eligibleStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.code} - Tổ {s.teamNumber}) — Hiện tại: {s.points} điểm
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === 'team' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chọn tổ được chấm *</label>
                  <select
                    value={selectedTeamNumber}
                    onChange={e => setSelectedTeamNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {store.teams
                      .filter(t => activeRole === 'teacher' || activeLeaderAssignedTeams.includes(t.number))
                      .map(t => (
                        <option key={t.number} value={t.number}>{t.name}</option>
                      ))}
                  </select>
                </div>
              )}

              {/* Criterion Chooser with Multi-Click Multiplier */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <label className="font-semibold text-slate-700">
                      Chọn tiêu chí thi đua *
                    </label>
                    <span className="text-[11px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      Nhấn 1 lần: 1x • Nhấn tiếp: 2x, 3x, 4x...
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Đang chọn: <strong className="font-mono text-teal-800">{criterionMultiplier}x</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/40">
                  {criteria.map(crit => {
                    const isSelected = crit.id === selectedCriterionId;
                    return (
                      <div
                        key={crit.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (isSelected) {
                            setCriterionMultiplier(prev => (prev >= 20 ? 1 : prev + 1));
                            soundManager.playClick(store.settings.soundEnabled);
                          } else {
                            setSelectedCriterionId(crit.id);
                            setCriterionMultiplier(1);
                            soundManager.playClick(store.settings.soundEnabled);
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (isSelected) {
                              setCriterionMultiplier(prev => (prev >= 20 ? 1 : prev + 1));
                            } else {
                              setSelectedCriterionId(crit.id);
                              setCriterionMultiplier(1);
                            }
                          }
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative select-none ${
                          isSelected
                            ? crit.type === 'bonus'
                              ? 'bg-emerald-50/95 border-emerald-500 text-emerald-950 font-semibold shadow-2xs ring-2 ring-emerald-500/20'
                              : 'bg-red-50/95 border-red-500 text-red-950 font-semibold shadow-2xs ring-2 ring-red-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate block font-semibold text-xs">{crit.name}</span>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {isSelected && (
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-black font-mono shadow-2xs ${
                                crit.type === 'bonus' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                              }`}>
                                {criterionMultiplier}x
                              </span>
                            )}
                            <span className={`font-mono font-bold tabular-nums text-xs ${crit.type === 'bonus' ? 'text-emerald-700' : 'text-red-600'}`}>
                              {crit.type === 'bonus' ? `+${crit.defaultPoints}` : `-${crit.defaultPoints}`}đ
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px]">
                          <span className="text-slate-400">{crit.category}</span>
                          {isSelected ? (
                            <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                              crit.type === 'bonus' ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                            }`}>
                              Tổng: {crit.type === 'bonus' ? `+${crit.defaultPoints * criterionMultiplier}` : `-${crit.defaultPoints * criterionMultiplier}`}đ (Nhấn tiếp: +1x)
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Nhấn để chọn 1x</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Multiplier / Occurrences Bar */}
                <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 text-xs">Số lần ghi nhận:</span>
                      <span className="font-bold text-teal-800 font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                        {criterionMultiplier} lần ({criterionMultiplier}x)
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCriterionMultiplier(prev => Math.max(1, prev - 1));
                          soundManager.playClick(store.settings.soundEnabled);
                        }}
                        disabled={criterionMultiplier <= 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold disabled:opacity-40"
                        title="Giảm 1 lần (-1x)"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCriterionMultiplier(prev => prev + 1);
                          soundManager.playClick(store.settings.soundEnabled);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold"
                        title="Tăng 1 lần (+1x)"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCriterionMultiplier(1);
                          soundManager.playClick(store.settings.soundEnabled);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                        title="Đặt lại về 1 lần (1x)"
                      >
                        Đặt lại 1x
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[1, 2, 3, 4, 5, 10].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setCriterionMultiplier(val);
                          soundManager.playClick(store.settings.soundEnabled);
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          criterionMultiplier === val
                            ? 'bg-teal-600 text-white shadow-2xs ring-1 ring-teal-500'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {val}x
                      </button>
                    ))}

                    <div className="text-[11px] text-teal-800 ml-auto font-medium">
                      Tổng điểm tính: <strong className="font-mono text-xs tabular-nums">{activeCriterion?.type === 'bonus' ? `+${(customPoints !== '' ? Number(customPoints) : activeCriterion?.defaultPoints || 2) * criterionMultiplier}` : `-${(customPoints !== '' ? Number(customPoints) : activeCriterion?.defaultPoints || 2) * criterionMultiplier}`}đ</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Points & Note */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Điểm điều chỉnh {activeRole === 'leader' ? `(tối đa ±${crossSettings.maxPointsPerRecord})` : '(tùy chọn)'}
                  </label>
                  <input
                    type="number"
                    min={activeRole === 'leader' ? -crossSettings.maxPointsPerRecord : -100}
                    max={activeRole === 'leader' ? crossSettings.maxPointsPerRecord : 100}
                    placeholder={`Mặc định: ${activeCriterion?.type === 'bonus' ? `+${activeCriterion?.defaultPoints}` : `-${activeCriterion?.defaultPoints}`}`}
                    value={customPoints}
                    onChange={e => setCustomPoints(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-1.5 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Minh chứng / Tiết học / Lý do *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Tiết 2 môn Hóa, tích cực xung phong giải bài tập trên bảng..."
                    value={eventNote}
                    onChange={e => setEventNote(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {activeRole === 'leader' ? (
                    <span>Người chấm sẽ được ghi nhận là: <strong>Tổ trưởng Tổ {currentLeaderTeam}</strong></span>
                  ) : (
                    <span>Người chấm: <strong>Giáo viên chủ nhiệm</strong></span>
                  )}
                </span>

                <button
                  type="submit"
                  disabled={store.settings.isPeriodFrozen}
                  className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    Xác nhận ghi điểm ({criterionMultiplier}x • {activeCriterion?.type === 'bonus' ? `+${(customPoints !== '' ? Number(customPoints) : activeCriterion?.defaultPoints || 2) * criterionMultiplier}` : `-${(customPoints !== '' ? Number(customPoints) : activeCriterion?.defaultPoints || 2) * criterionMultiplier}`}đ)
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Side Guide / Recent Events */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Quy chế Chấm thi đua Chéo</span>
              </h3>
              <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
                <li>
                  <strong>Khách quan và công bằng:</strong> 4 Tổ trưởng chấm điểm chéo cho nhau theo phân công của giáo viên, không tự chấm tổ mình.
                </li>
                <li>
                  <strong>Minh chứng rõ ràng:</strong> Luôn ghi rõ môn học, tiết học hoặc hành vi cụ thể khi cộng/trừ điểm.
                </li>
                {activeRole === 'leader' && (
                  <li className="text-teal-700 font-medium">
                    Bạn đang chấm chéo cho <strong>{activeLeaderAssignedTeams.map(n => `Tổ ${n}`).join(', ')}</strong>.
                  </li>
                )}
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-900">Ghi nhận gần nhất</h3>
                {activeRole === 'leader' && (
                  <span className="text-[10px] text-teal-600 font-medium">Của Tổ {currentLeaderTeam}</span>
                )}
              </div>
              <div className="space-y-2">
                {events
                  .filter(e => activeRole === 'teacher' || e.evaluatorTeamNumber === currentLeaderTeam)
                  .slice(0, 5)
                  .map(ev => (
                    <div key={ev.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-slate-800 block truncate">{ev.targetName}</span>
                        <span className="text-[10px] text-slate-500 block truncate">{ev.criterionName}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          bởi: {ev.evaluatorName || 'Giáo viên'}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`font-mono font-bold tabular-nums block ${ev.points >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {ev.points > 0 ? `+${ev.points}` : ev.points}đ
                        </span>
                        {ev.status === 'pending' && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded">Chờ duyệt</span>
                        )}
                      </div>
                    </div>
                  ))}
                {events.length === 0 && (
                  <p className="text-xs text-slate-400 py-4 text-center italic">Chưa có lượt chấm nào.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CROSS-GRADING MANAGEMENT & CONFIG (TEACHER EXCLUSIVE) */}
      {activeTab === 'cross_management' && activeRole === 'teacher' && (
        <div className="space-y-6">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
            <button
              onClick={() => setCrossSubTab('matrix')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                crossSubTab === 'matrix' ? 'bg-teal-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Ma trận Chấm chéo 4 Tổ</span>
            </button>
            <button
              onClick={() => setCrossSubTab('accounts')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                crossSubTab === 'accounts' ? 'bg-teal-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Quản lý 4 Tổ trưởng & Mã PIN</span>
            </button>
            <button
              onClick={() => setCrossSubTab('approvals')}
              className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                crossSubTab === 'approvals' ? 'bg-teal-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Bàn Duyệt Điểm Chấm Chéo</span>
              {pendingApprovalsCount > 0 && (
                <span className="w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setCrossSubTab('stats')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                crossSubTab === 'stats' ? 'bg-teal-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Đối soát & Thống kê Chấm chéo</span>
            </button>
            <button
              onClick={() => setCrossSubTab('rules')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                crossSubTab === 'rules' ? 'bg-teal-600 text-white shadow-2xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Cài đặt Quy chế</span>
            </button>
          </div>

          {/* Sub-tab A: Matrix */}
          {crossSubTab === 'matrix' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ma trận Phân công Chấm chéo 4 Tổ trưởng</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chỉ định cụ thể tổ nào sẽ theo dõi và chấm điểm nề nếp thi đua cho tổ nào
                  </p>
                </div>

                {/* Preset buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-500">Mẫu nhanh:</span>
                  <button
                    type="button"
                    onClick={() => handleSetRulePreset('circular')}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors"
                  >
                    Vòng tròn (1➔2➔3➔4➔1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetRulePreset('reverse')}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors"
                  >
                    Đảo vòng (1➔4➔3➔2➔1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetRulePreset('paired')}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors"
                  >
                    Đan cặp (1↔2, 3↔4)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetRulePreset('all_others')}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors"
                  >
                    Chấm 3 tổ còn lại
                  </button>
                </div>
              </div>

              {/* Matrix Flow Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(leaderTeamNum => {
                  const tm = teams.find(t => t.number === leaderTeamNum);
                  const acc = leaderAccounts.find(a => a.teamNumber === leaderTeamNum);
                  const leaderStudent = students.find(s => s.id === acc?.studentId);
                  const assigned = getAssignedTeamsForLeader(leaderTeamNum, crossSettings, leaderAccounts);

                  return (
                    <div key={leaderTeamNum} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div>
                          <span className="font-bold text-sm text-slate-900 block">{tm?.name || `Tổ ${leaderTeamNum}`}</span>
                          <span className="text-[11px] text-teal-700 font-semibold block">
                            Tổ trưởng: {leaderStudent?.fullName || 'Chưa chỉ định'}
                          </span>
                        </div>
                        <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                          {leaderTeamNum}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-slate-600 block mb-2">
                          Được phân công chấm điểm cho:
                        </span>
                        <div className="space-y-1.5">
                          {[1, 2, 3, 4].map(targetNum => {
                            const isSelf = targetNum === leaderTeamNum;
                            const isChecked = assigned.includes(targetNum);
                            const targetTeam = teams.find(t => t.number === targetNum);

                            return (
                              <button
                                key={targetNum}
                                type="button"
                                disabled={isSelf}
                                onClick={() => handleToggleMatrixAssignment(leaderTeamNum, targetNum)}
                                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                                  isSelf
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                                    : isChecked
                                      ? 'bg-teal-600 text-white shadow-2xs'
                                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <span>{targetTeam?.name || `Tổ ${targetNum}`}</span>
                                {isSelf ? (
                                  <span className="text-[10px]">Tổ mình</span>
                                ) : isChecked ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <span className="text-[10px] text-slate-400">+ Gán</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-tab B: Accounts & PIN Management */}
          {crossSubTab === 'accounts' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Danh sách Tài khoản & Mã PIN 4 Tổ trưởng</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Xem, đổi mã PIN đăng nhập và đăng nhập thử nghiệm trực tiếp từng tổ
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-3">Tổ</th>
                      <th className="py-3 px-3">Tổ trưởng hiện tại</th>
                      <th className="py-3 px-3">Mã học sinh</th>
                      <th className="py-3 px-3">Mã PIN bảo mật</th>
                      <th className="py-3 px-3">Phân công chấm chéo</th>
                      <th className="py-3 px-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[1, 2, 3, 4].map(teamNum => {
                      const tm = teams.find(t => t.number === teamNum);
                      const acc = leaderAccounts.find(a => a.teamNumber === teamNum);
                      const leaderStudent = students.find(s => s.id === acc?.studentId);
                      const assigned = getAssignedTeamsForLeader(teamNum, crossSettings, leaderAccounts);

                      return (
                        <tr key={teamNum} className="hover:bg-slate-50/60">
                          <td className="py-3 px-3 font-bold text-slate-900">{tm?.name || `Tổ ${teamNum}`}</td>
                          <td className="py-3 px-3 font-semibold text-teal-800">
                            {leaderStudent ? leaderStudent.fullName : <span className="text-amber-600">Chưa chỉ định</span>}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-500">{leaderStudent?.code || '—'}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700 tracking-wider">
                            {acc?.pin || '1234'}
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            Chấm: <strong>{assigned.map(n => `Tổ ${n}`).join(', ')}</strong>
                          </td>
                          <td className="py-3 px-3 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => setEditingAccountTeam(teamNum)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              Đổi PIN / Tổ trưởng
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickLoginAsLeader(teamNum)}
                              className="px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                            >
                              Đăng nhập thử quyền này
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab C: Teacher Approval Desk */}
          {crossSubTab === 'approvals' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bàn Duyệt Điểm Thi Đua do Tổ trưởng Chấm</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kiểm tra các phiếu chấm chéo từ 4 tổ trưởng trước hoặc sau khi áp dụng vào sổ điểm
                  </p>
                </div>

                {pendingApprovalsCount > 0 && (
                  <button
                    type="button"
                    onClick={handleApproveAllPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Duyệt tất cả {pendingApprovalsCount} phiếu chờ</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-3">Thời gian</th>
                      <th className="py-3 px-3">Người chấm</th>
                      <th className="py-3 px-3">Học sinh / Tổ được chấm</th>
                      <th className="py-3 px-3">Tiêu chí thi đua</th>
                      <th className="py-3 px-3 text-right">Điểm</th>
                      <th className="py-3 px-3">Minh chứng</th>
                      <th className="py-3 px-3">Trạng thái</th>
                      <th className="py-3 px-3 text-center">Thao tác duyệt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {events
                      .filter(e => e.evaluatorRole === 'leader')
                      .map(ev => (
                        <tr key={ev.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-3 font-mono text-slate-500">{ev.date}</td>
                          <td className="py-3 px-3 font-medium text-slate-800">{ev.evaluatorName}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{ev.targetName}</td>
                          <td className="py-3 px-3 text-slate-700">{ev.criterionName}</td>
                          <td className={`py-3 px-3 text-right font-mono font-bold tabular-nums ${ev.points >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                            {ev.points > 0 ? `+${ev.points}` : ev.points}đ
                          </td>
                          <td className="py-3 px-3 text-slate-600 italic">{ev.note || '—'}</td>
                          <td className="py-3 px-3">
                            {ev.status === 'pending' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Chờ duyệt
                              </span>
                            ) : ev.status === 'rejected' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                                Đã từ chối
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Đã duyệt
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {ev.status === 'pending' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApproveEvent(ev)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold"
                                >
                                  Duyệt
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectEvent(ev)}
                                  className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[11px] font-semibold"
                                >
                                  Từ chối
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUndoEvent(ev)}
                                className="p-1 text-slate-400 hover:text-red-600"
                                title="Hủy bỏ / Xóa giao dịch này"
                              >
                                <RotateCcw className="w-3.5 h-3.5 inline" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    {events.filter(e => e.evaluatorRole === 'leader').length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Chưa có phiếu chấm thi đua nào từ 4 tổ trưởng.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab D: Cross-grading Stats */}
          {crossSubTab === 'stats' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Thống kê Tính Khách quan trong Chấm chéo</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm tra xem tổ trưởng nào chấm tích cực, tổ trưởng nào chấm khắt khe hoặc chưa thực hiện nhiệm vụ
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {crossGradingStats.map(stat => (
                  <div key={stat.teamNum} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <span className="font-bold text-sm text-slate-900 block">{stat.teamName}</span>
                        <span className="text-[11px] text-teal-700 font-semibold block">Tổ trưởng: {stat.leaderName}</span>
                      </div>
                      <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                        {stat.totalEvents} lượt
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-emerald-700">
                        <span>Lượt cộng điểm (+):</span>
                        <span className="font-mono font-bold">+{stat.totalBonusPoints}đ ({stat.bonusCount} lần)</span>
                      </div>
                      <div className="flex items-center justify-between text-red-600">
                        <span>Lượt trừ điểm (-):</span>
                        <span className="font-mono font-bold">{stat.totalPenaltyPoints}đ ({stat.penaltyCount} lần)</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-slate-800">
                        <span>Điểm ròng đã chấm:</span>
                        <span className={`font-mono ${stat.netPoints >= 0 ? 'text-teal-700' : 'text-amber-700'}`}>
                          {stat.netPoints > 0 ? `+${stat.netPoints}` : stat.netPoints}đ
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-tab E: Cross-grading Rules Settings */}
          {crossSubTab === 'rules' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cấu hình Quy chế Phân quyền & Chấm chéo</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thiết lập giới hạn quyền hạn của tổ trưởng và quy trình kiểm duyệt
                </p>
              </div>

              <div className="space-y-3.5 text-xs divide-y divide-slate-100">
                {/* Rule: Enable */}
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 block">Kích hoạt Chức năng Chấm thi đua chéo</span>
                    <span className="text-slate-400 block text-[11px]">
                      Cho phép 4 tổ trưởng đăng nhập tài khoản riêng để chấm điểm cho các bạn tổ khác
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={crossSettings.enabled}
                    onChange={e => {
                      onUpdateStore(prev => ({
                        ...prev,
                        crossGradingSettings: {
                          ...(prev.crossGradingSettings || DEFAULT_CROSS_SETTINGS),
                          enabled: e.target.checked
                        }
                      }));
                    }}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                </div>

                {/* Rule: Require teacher approval */}
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 block">Yêu cầu Giáo viên phê duyệt trước khi tính điểm</span>
                    <span className="text-slate-400 block text-[11px]">
                      Khi bật, điểm tổ trưởng chấm sẽ ở trạng thái Chờ duyệt; giáo viên bấm Duyệt thì học sinh mới được nhận điểm
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={crossSettings.requireTeacherApproval}
                    onChange={e => {
                      onUpdateStore(prev => ({
                        ...prev,
                        crossGradingSettings: {
                          ...(prev.crossGradingSettings || DEFAULT_CROSS_SETTINGS),
                          requireTeacherApproval: e.target.checked
                        }
                      }));
                    }}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                </div>

                {/* Rule: Allow grading whole team */}
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 block">Cho phép Tổ trưởng chấm điểm cho cả Tập thể Tổ</span>
                    <span className="text-slate-400 block text-[11px]">
                      Nếu tắt, tổ trưởng chỉ được chấm điểm cho từng cá nhân học sinh
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={crossSettings.allowGradingWholeTeam}
                    onChange={e => {
                      onUpdateStore(prev => ({
                        ...prev,
                        crossGradingSettings: {
                          ...(prev.crossGradingSettings || DEFAULT_CROSS_SETTINGS),
                          allowGradingWholeTeam: e.target.checked
                        }
                      }));
                    }}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                </div>

                {/* Rule: Max points */}
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 block">Điểm tối đa mỗi lần chấm của Tổ trưởng</span>
                    <span className="text-slate-400 block text-[11px]">
                      Ngăn chặn tổ trưởng bấm nhầm hoặc nhập điểm quá lớn (ví dụ: tối đa ±10 điểm)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={crossSettings.maxPointsPerRecord || 10}
                      onChange={e => {
                        const val = Math.max(1, Number(e.target.value));
                        onUpdateStore(prev => ({
                          ...prev,
                          crossGradingSettings: {
                            ...(prev.crossGradingSettings || DEFAULT_CROSS_SETTINGS),
                            maxPointsPerRecord: val
                          }
                        }));
                      }}
                      className="w-16 px-2 py-1 font-mono text-center border border-slate-200 rounded-lg"
                    />
                    <span className="text-slate-500">điểm</span>
                  </div>
                </div>

                {/* Teacher PIN */}
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 block">Mã PIN Giáo viên Chủ nhiệm</span>
                    <span className="text-slate-400 block text-[11px]">
                      Dùng để chuyển quyền từ màn hình Tổ trưởng quay trở lại Giáo viên
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={crossSettings.teacherPin || '1234'}
                    onChange={e => {
                      const val = e.target.value.trim();
                      onUpdateStore(prev => ({
                        ...prev,
                        crossGradingSettings: {
                          ...(prev.crossGradingSettings || DEFAULT_CROSS_SETTINGS),
                          teacherPin: val || '1234'
                        }
                      }));
                    }}
                    className="w-20 px-2 py-1 font-mono text-center tracking-widest border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* History Filters */}
          {activeRole === 'teacher' && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-600 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  Lọc theo người chấm:
                </span>
                <select
                  value={historyEvaluatorFilter}
                  onChange={e => setHistoryEvaluatorFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="all">Tất cả người chấm</option>
                  <option value="teacher">Chỉ Giáo viên chủ nhiệm</option>
                  <option value="leader_1">Tổ trưởng Tổ 1</option>
                  <option value="leader_2">Tổ trưởng Tổ 2</option>
                  <option value="leader_3">Tổ trưởng Tổ 3</option>
                  <option value="leader_4">Tổ trưởng Tổ 4</option>
                </select>

                <select
                  value={historyTargetFilter}
                  onChange={e => setHistoryTargetFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="all">Mọi đối tượng</option>
                  <option value="individual">Chỉ cá nhân</option>
                  <option value="team">Chỉ tập thể tổ</option>
                  <option value="class">Chỉ cả lớp</option>
                </select>

                <select
                  value={historyStatusFilter}
                  onChange={e => setHistoryStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
                >
                  <option value="all">Mọi trạng thái</option>
                  <option value="approved">Đã duyệt / Hợp lệ</option>
                  <option value="pending">Chờ duyệt</option>
                </select>
              </div>

              <span className="text-slate-400 font-mono">
                Hiển thị {filteredEvents.length} / {events.length} sự kiện
              </span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs printable-area">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Thời gian</th>
                    <th className="py-3 px-3">Người chấm</th>
                    <th className="py-3 px-3">Đối tượng</th>
                    <th className="py-3 px-3">Học sinh / Tập thể</th>
                    <th className="py-3 px-3">Tiêu chí thi đua</th>
                    <th className="py-3 px-3 text-right">Điểm</th>
                    <th className="py-3 px-3">Minh chứng</th>
                    {activeRole === 'teacher' && (
                      <th className="py-3 px-3 text-center no-print">Thao tác</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvents.map(ev => (
                    <tr key={ev.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-mono text-slate-500">{ev.date}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 block">
                          {ev.evaluatorName || (ev.evaluatorRole === 'leader' ? `Tổ trưởng Tổ ${ev.evaluatorTeamNumber}` : 'Giáo viên')}
                        </span>
                        {ev.status === 'pending' && (
                          <span className="text-[10px] text-amber-600 font-medium block">Đang chờ GV duyệt</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {ev.targetType === 'individual' ? 'Cá nhân' : ev.targetType === 'team' ? 'Tổ' : 'Cả lớp'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{ev.targetName}</td>
                      <td className="py-3 px-3 text-slate-700">{ev.criterionName}</td>
                      <td className={`py-3 px-3 text-right font-mono font-bold tabular-nums ${ev.points >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {ev.points > 0 ? `+${ev.points}` : ev.points}
                      </td>
                      <td className="py-3 px-3 text-slate-500 italic">{ev.note || '—'}</td>
                      {activeRole === 'teacher' && (
                        <td className="py-3 px-3 text-center no-print">
                          <button
                            onClick={() => handleUndoEvent(ev)}
                            title="Hoàn tác sự kiện này"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg inline-flex items-center gap-1 text-[11px]"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Hủy</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={activeRole === 'teacher' ? 8 : 7} className="py-8 text-center text-slate-400">
                        Chưa có ghi nhận thi đua nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RANKINGS (WEEKLY & ALL-TIME WITH EXCEL EXPORT) */}
      {activeTab === 'rankings' && (
        <div className="space-y-6">
          {/* Timeframe & Export Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Bảng Xếp Hạng Thi Đua: {activeTimeframeRange.label}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cập nhật tự động dựa trên các sự kiện thi đua và nề nếp hợp lệ trong tuần
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Timeframe Segmented Control */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setRankingTimeframe('this_week');
                    soundManager.playClick(store.settings.soundEnabled);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    rankingTimeframe === 'this_week'
                      ? 'bg-white text-teal-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tuần này
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRankingTimeframe('last_week');
                    soundManager.playClick(store.settings.soundEnabled);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    rankingTimeframe === 'last_week'
                      ? 'bg-white text-teal-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tuần trước
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRankingTimeframe('all_time');
                    soundManager.playClick(store.settings.soundEnabled);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    rankingTimeframe === 'all_time'
                      ? 'bg-white text-teal-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cả kỳ (Tổng)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRankingTimeframe('custom');
                    soundManager.playClick(store.settings.soundEnabled);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    rankingTimeframe === 'custom'
                      ? 'bg-white text-teal-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tùy chọn ngày
                </button>
              </div>

              {/* Export Weekly Excel Button */}
              <button
                type="button"
                onClick={() => {
                  soundManager.playSuccess(store.settings.soundEnabled);
                  exportWeeklyCompetitionToExcel(
                    currentClass,
                    activeTimeframeRange.label,
                    activeTimeframeRange.startStr,
                    activeTimeframeRange.endStr,
                    weeklyRankingsData.teamRankings,
                    weeklyRankingsData.studentRankings,
                    events
                  );
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-2xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Xuất Excel Báo cáo Tuần (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Custom Date Pickers if custom timeframe selected */}
          {rankingTimeframe === 'custom' && (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3 text-xs flex-wrap">
              <span className="font-semibold text-slate-700">Chọn khoảng ngày xếp hạng:</span>
              <div className="flex items-center gap-2">
                <span>Từ:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1 font-mono border border-slate-200 rounded-lg bg-white"
                />
                <span>Đến:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1 font-mono border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>
          )}

          {/* 1. TEAM RANKINGS (THỨ HẠNG TỔ TRONG TUẦN) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Bảng Xếp Hạng Thi Đua Các Tổ ({activeTimeframeRange.label})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xếp hạng dựa trên điểm thi đua đạt được trong thời gian chọn
                </p>
              </div>
              <span className="text-xs text-slate-400">
                Gồm {weeklyRankingsData.teamRankings.length} tổ thi đua
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {weeklyRankingsData.teamRankings.map(rank => (
                <div
                  key={rank.teamNumber}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    rank.rank === 1
                      ? 'border-amber-400/80 bg-gradient-to-b from-amber-50/50 to-amber-50/10 shadow-xs'
                      : rank.rank === 2
                        ? 'border-slate-300 bg-slate-50/70 shadow-2xs'
                        : rank.rank === 3
                          ? 'border-amber-700/30 bg-amber-50/20 shadow-2xs'
                          : 'border-slate-200 bg-white shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full font-bold text-xs ${
                        rank.rank === 1 ? 'bg-amber-400 text-amber-950 font-black' :
                        rank.rank === 2 ? 'bg-slate-300 text-slate-800' :
                        rank.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {rank.rank === 1 ? '★ HẠNG 1' : `HẠNG ${rank.rank}`}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">{rank.memberCount} thành viên</span>
                    </div>

                    <div className="font-bold text-slate-900 text-base mt-2.5">{rank.teamName}</div>
                    <div className="text-xs text-teal-700 font-medium mt-0.5">
                      Tổ trưởng: {rank.leaderName}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="text-emerald-700 font-medium">+{rank.bonusPoints}đ</span>
                      <span className="text-red-600 font-medium">{rank.penaltyPoints}đ</span>
                      <span>TB: <strong className="font-mono text-slate-700">{rank.avgWeeklyPoints}đ/HS</strong></span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Điểm trong kỳ</span>
                      <span className={`text-xl font-bold font-mono tabular-nums ${rank.totalWeeklyPoints >= 0 ? 'text-teal-700' : 'text-red-600'}`}>
                        {rank.totalWeeklyPoints > 0 ? `+${rank.totalWeeklyPoints}` : rank.totalWeeklyPoints}đ
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">Tổng cả kỳ</span>
                      <span className="text-xs font-semibold text-slate-600 font-mono tabular-nums">{rank.allTimePoints}đ</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. INDIVIDUAL RANKINGS (THỨ HẠNG CÁ NHÂN TRONG TUẦN) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-teal-600" />
                  <span>Bảng Xếp Hạng Cá Nhân Học Sinh ({activeTimeframeRange.label})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thứ tự học sinh theo điểm thi đua tích lũy trong kỳ báo cáo
                </p>
              </div>

              {/* Top 3 Podium Badges */}
              <div className="flex items-center gap-2">
                {weeklyRankingsData.studentRankings.slice(0, 3).map((topSt, idx) => (
                  <div
                    key={topSt.studentId}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-[11px] flex items-center gap-1.5 shadow-2xs"
                  >
                    <span className="text-sm">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                    <span className="font-bold text-slate-900 truncate max-w-[90px]">{topSt.fullName}</span>
                    <span className="font-mono font-bold text-teal-700">+{topSt.weeklyPoints}đ</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter toolbar inside individual rankings */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc mã HS..."
                    value={rankingSearchTerm}
                    onChange={e => setRankingSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 w-44"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setRankingTeamFilter('all')}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      rankingTeamFilter === 'all' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tất cả tổ
                  </button>
                  {[1, 2, 3, 4].map(tNum => (
                    <button
                      key={tNum}
                      type="button"
                      onClick={() => setRankingTeamFilter(tNum)}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                        rankingTeamFilter === tNum ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tổ {tNum}
                    </button>
                  ))}
                </div>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                {weeklyRankingsData.studentRankings
                  .filter(s => (rankingTeamFilter === 'all' || s.teamNumber === rankingTeamFilter) && (!rankingSearchTerm.trim() || s.fullName.toLowerCase().includes(rankingSearchTerm.toLowerCase()) || s.code.toLowerCase().includes(rankingSearchTerm.toLowerCase()))).length} / {students.length} học sinh
              </span>
            </div>

            {/* Individual Ranking Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 text-center">Hạng</th>
                    <th className="py-2.5 px-3">Mã HS</th>
                    <th className="py-2.5 px-3">Họ và tên</th>
                    <th className="py-2.5 px-3">Tổ</th>
                    <th className="py-2.5 px-3">Chức vụ</th>
                    <th className="py-2.5 px-3 text-right">Điểm trong kỳ</th>
                    <th className="py-2.5 px-3 text-center">Lượt khen / nhắc</th>
                    <th className="py-2.5 px-3 text-right">Tổng cả kỳ</th>
                    <th className="py-2.5 px-3 text-center">Danh hiệu tuần</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weeklyRankingsData.studentRankings
                    .filter(s => {
                      const matchTeam = rankingTeamFilter === 'all' || s.teamNumber === rankingTeamFilter;
                      const matchSearch = !rankingSearchTerm.trim() || 
                        s.fullName.toLowerCase().includes(rankingSearchTerm.toLowerCase()) ||
                        s.code.toLowerCase().includes(rankingSearchTerm.toLowerCase());
                      return matchTeam && matchSearch;
                    })
                    .map(st => (
                      <tr key={st.studentId} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 text-center font-bold">
                          {st.rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-400 text-amber-950 rounded-full font-black text-[11px]">
                              1
                            </span>
                          ) : st.rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-slate-300 text-slate-800 rounded-full font-bold text-[11px]">
                              2
                            </span>
                          ) : st.rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-700 text-white rounded-full font-bold text-[11px]">
                              3
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono">#{st.rank}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{st.code}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{st.fullName}</td>
                        <td className="py-2.5 px-3 text-slate-700">Tổ {st.teamNumber}</td>
                        <td className="py-2.5 px-3 text-slate-600">{st.role}</td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold tabular-nums ${st.weeklyPoints > 0 ? 'text-teal-700 font-extrabold' : st.weeklyPoints < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                          {st.weeklyPoints > 0 ? `+${st.weeklyPoints}` : st.weeklyPoints}đ
                        </td>
                        <td className="py-2.5 px-3 text-center text-[11px]">
                          <span className="text-emerald-700 font-medium">+{st.bonusCount}</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className="text-red-600 font-medium">-{st.penaltyCount}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-600 tabular-nums">
                          {st.allTimePoints}đ
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {st.rank === 1 ? (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              Hoa tiêu Tuần #1
                            </span>
                          ) : st.rank <= 3 ? (
                            <span className="text-[10px] font-semibold bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full">
                              Top 3 Xuất Sắc
                            </span>
                          ) : st.weeklyPoints >= 6 ? (
                            <span className="text-[10px] font-medium text-emerald-700">
                              Tích cực
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Đạt chuẩn
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CRITERIA (TEACHER EXCLUSIVE) */}
      {activeTab === 'criteria' && activeRole === 'teacher' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Danh mục tiêu chí thi đua</h3>
            <button
              onClick={() => {
                soundManager.playClick(store.settings.soundEnabled);
                setIsCriteriaModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm tiêu chí</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {criteria.map(crit => (
              <div key={crit.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900">{crit.name}</span>
                  <span className="text-[11px] text-slate-400 block">Nhóm: {crit.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold ${crit.type === 'bonus' ? 'text-emerald-700' : 'text-red-600'}`}>
                    {crit.type === 'bonus' ? `+${crit.defaultPoints}` : `-${crit.defaultPoints}`} điểm
                  </span>
                  <button
                    onClick={() => handleDeleteCriterion(crit.id)}
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: TEAM LEADER LOGIN */}
      <TeamLeaderLoginModal
        isOpen={isLeaderLoginOpen}
        onClose={() => setIsLeaderLoginOpen(false)}
        leaderAccounts={leaderAccounts}
        teams={teams}
        students={students}
        crossSettings={crossSettings}
        onLoginSuccess={handleLoginLeaderSuccess}
        soundEnabled={store.settings.soundEnabled}
      />

      {/* MODAL: VERIFY TEACHER PIN */}
      <TeacherPinModal
        isOpen={isTeacherPinModalOpen}
        onClose={() => setIsTeacherPinModalOpen(false)}
        correctPin={crossSettings.teacherPin || '1234'}
        onSuccess={handleReturnToTeacherSuccess}
        soundEnabled={store.settings.soundEnabled}
      />

      {/* MODAL: EDIT LEADER ACCOUNT / PIN */}
      {editingAccountTeam && (
        <LeaderPinChangeModal
          isOpen={true}
          onClose={() => setEditingAccountTeam(null)}
          team={teams.find(t => t.number === editingAccountTeam) || { number: editingAccountTeam, name: `Tổ ${editingAccountTeam}` }}
          account={leaderAccounts.find(a => a.teamNumber === editingAccountTeam) || { teamNumber: editingAccountTeam, studentId: '', pin: '1234', assignedTeamNumbers: [] }}
          students={students}
          onSave={handleSaveLeaderAccount}
          soundEnabled={store.settings.soundEnabled}
        />
      )}

      {/* MODAL: ADD CRITERION */}
      {isCriteriaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Thêm tiêu chí thi đua mới</h3>
            <form onSubmit={handleSaveNewCriterion} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên tiêu chí *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giữ trật tự giờ tự quản"
                  value={newCritName}
                  onChange={e => setNewCritName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại tiêu chí</label>
                  <select
                    value={newCritType}
                    onChange={e => setNewCritType(e.target.value as 'bonus' | 'penalty')}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="bonus">Cộng điểm (+)</option>
                    <option value="penalty">Trừ điểm (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức điểm</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newCritPoints}
                    onChange={e => setNewCritPoints(Number(e.target.value))}
                    className="w-full px-3 py-1.5 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nhóm lĩnh vực</label>
                <input
                  type="text"
                  placeholder="Học tập, Nề nếp, Lao động, Phong trào..."
                  value={newCritCategory}
                  onChange={e => setNewCritCategory(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCriteriaModalOpen(false)}
                  className="px-3.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Lưu tiêu chí
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
