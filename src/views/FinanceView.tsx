import React, { useState, useMemo } from 'react';
import {
  WalletCards,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit3,
  Trash2,
  X,
  FileSpreadsheet,
  Users,
  Check,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileText
} from 'lucide-react';
import {
  FinanceTransaction,
  FinanceCategory,
  ClassFeePlan,
  ClassFeeContribution,
  Student,
  ClassProStore
} from '../types';
import { soundManager } from '../utils/audio';
import { exportFinanceToExcel, formatNumber, formatVnd } from '../utils/financeExcel';
import { INITIAL_FINANCE_CATEGORIES } from '../utils/sampleData';

interface FinanceViewProps {
  store: ClassProStore;
  onUpdateStore: (updater: (prev: ClassProStore) => ClassProStore) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  store,
  onUpdateStore
}) => {
  const currentClass = store.classes.find(c => c.id === store.currentClassId) || store.classes[0];
  const students = store.students;
  const transactions = store.financeTransactions || [];
  const categories = store.financeCategories || INITIAL_FINANCE_CATEGORIES;
  const feePlans = store.feePlans || [];

  // Active Tab
  const [activeTab, setActiveTab] = useState<'transactions' | 'contributions' | 'statement'>('transactions');

  // Transactions Filter State
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('all');
  const [txSearchTerm, setTxSearchTerm] = useState('');
  const [txMonthFilter, setTxMonthFilter] = useState<string>('all');

  // Active Fee Plan
  const [activePlanId, setActivePlanId] = useState<string>(feePlans[0]?.id || '');
  const activePlan = useMemo(() => {
    return feePlans.find(p => p.id === activePlanId) || feePlans[0];
  }, [feePlans, activePlanId]);

  // Contribution filters
  const [contribStatusFilter, setContribStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid' | 'exempt'>('all');
  const [contribTeamFilter, setContribTeamFilter] = useState<number | 'all'>('all');
  const [contribSearchTerm, setContribSearchTerm] = useState('');

  // Transaction Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);
  const [formType, setFormType] = useState<'income' | 'expense'>('income');
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPayerReceiver, setFormPayerReceiver] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');

  // Fee Plan Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [planTerm, setPlanTerm] = useState<'HK1' | 'HK2' | 'Cả năm' | 'Đột xuất'>('HK1');
  const [planAmount, setPlanAmount] = useState<number>(100000);
  const [planDueDate, setPlanDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [planDesc, setPlanDesc] = useState('');

  // Financial Calculations
  const { totalIncome, totalExpense, balance, incomeCount, expenseCount } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    let incCount = 0;
    let expCount = 0;

    transactions.forEach(t => {
      if (t.type === 'income') {
        inc += t.amount;
        incCount++;
      } else {
        exp += t.amount;
        expCount++;
      }
    });

    return {
      totalIncome: inc,
      totalExpense: exp,
      balance: inc - exp,
      incomeCount: incCount,
      expenseCount: expCount
    };
  }, [transactions]);

  // Expense by category breakdown
  const expenseByCategory = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; count: number; color?: string }>();
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const existing = map.get(t.categoryId) || {
        name: t.categoryName,
        amount: 0,
        count: 0
      };
      existing.amount += t.amount;
      existing.count++;
      map.set(t.categoryId, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (txTypeFilter !== 'all' && t.type !== txTypeFilter) return false;
      if (txCategoryFilter !== 'all' && t.categoryId !== txCategoryFilter) return false;
      if (txMonthFilter !== 'all' && !t.date.startsWith(txMonthFilter)) return false;
      if (txSearchTerm.trim()) {
        const query = txSearchTerm.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(query);
        const matchPerson = t.payerOrReceiver.toLowerCase().includes(query);
        const matchCat = t.categoryName.toLowerCase().includes(query);
        const matchNote = (t.note || '').toLowerCase().includes(query);
        const matchInvoice = (t.invoiceNumber || '').toLowerCase().includes(query);
        return matchTitle || matchPerson || matchCat || matchNote || matchInvoice;
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, txTypeFilter, txCategoryFilter, txMonthFilter, txSearchTerm]);

  // Distinct months in transactions for filter
  const transactionMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Contribution Progress Metrics for active plan
  const planMetrics = useMemo(() => {
    if (!activePlan) return { totalExpected: 0, totalPaid: 0, paidCount: 0, partialCount: 0, unpaidCount: 0, exemptCount: 0, rate: 0 };

    const totalStudents = activePlan.contributions.length;
    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;
    let exemptCount = 0;
    let totalPaid = 0;
    let totalExpected = 0;

    activePlan.contributions.forEach(c => {
      totalPaid += c.paidAmount;
      if (c.status !== 'exempt') {
        totalExpected += c.expectedAmount;
      }
      if (c.status === 'paid') paidCount++;
      else if (c.status === 'partial') partialCount++;
      else if (c.status === 'unpaid') unpaidCount++;
      else if (c.status === 'exempt') exemptCount++;
    });

    const rate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

    return {
      totalStudents,
      totalExpected,
      totalPaid,
      paidCount,
      partialCount,
      unpaidCount,
      exemptCount,
      rate
    };
  }, [activePlan]);

  // Filtered Contributions
  const filteredContributions = useMemo(() => {
    if (!activePlan) return [];
    return activePlan.contributions.filter(c => {
      if (contribStatusFilter !== 'all' && c.status !== contribStatusFilter) return false;
      if (contribTeamFilter !== 'all' && c.teamNumber !== contribTeamFilter) return false;
      if (contribSearchTerm.trim()) {
        const query = contribSearchTerm.toLowerCase();
        const student = students.find(s => s.id === c.studentId);
        const matchName = c.studentName.toLowerCase().includes(query);
        const matchCode = (student?.code || '').toLowerCase().includes(query);
        return matchName || matchCode;
      }
      return true;
    });
  }, [activePlan, contribStatusFilter, contribTeamFilter, contribSearchTerm, students]);

  // Open Modal to Add Transaction
  const handleOpenAddTx = (type: 'income' | 'expense') => {
    soundManager.playClick(store.settings.soundEnabled);
    setEditingTx(null);
    setFormType(type);
    setFormTitle('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPayerReceiver(type === 'income' ? 'Thủ quỹ lớp / Đại diện CMHS' : '');
    setFormNote('');
    setFormInvoiceNumber('');

    const defaultCats = categories.filter(c => c.type === type);
    setFormCategoryId(defaultCats[0]?.id || '');

    setIsTxModalOpen(true);
  };

  // Open Modal to Edit Transaction
  const handleOpenEditTx = (tx: FinanceTransaction) => {
    soundManager.playClick(store.settings.soundEnabled);
    setEditingTx(tx);
    setFormType(tx.type);
    setFormTitle(tx.title);
    setFormAmount(tx.amount);
    setFormCategoryId(tx.categoryId);
    setFormDate(tx.date);
    setFormPayerReceiver(tx.payerOrReceiver);
    setFormNote(tx.note || '');
    setFormInvoiceNumber(tx.invoiceNumber || '');
    setIsTxModalOpen(true);
  };

  // Save Transaction
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formAmount || Number(formAmount) <= 0) {
      alert('Vui lòng nhập tên khoản mục và số tiền hợp lệ lớn hơn 0.');
      return;
    }

    const cat = categories.find(c => c.id === formCategoryId) || categories.find(c => c.type === formType);
    const categoryName = cat ? cat.name : (formType === 'income' ? 'Khoản thu khác' : 'Khoản chi khác');

    if (editingTx) {
      onUpdateStore(prev => ({
        ...prev,
        financeTransactions: (prev.financeTransactions || []).map(t =>
          t.id === editingTx.id
            ? {
                ...t,
                type: formType,
                title: formTitle.trim(),
                amount: Number(formAmount),
                categoryId: cat?.id || formCategoryId,
                categoryName,
                date: formDate,
                payerOrReceiver: formPayerReceiver.trim() || (formType === 'income' ? 'Thủ quỹ lớp' : 'Người nhận'),
                note: formNote.trim(),
                invoiceNumber: formInvoiceNumber.trim()
              }
            : t
        )
      }));
    } else {
      const newTx: FinanceTransaction = {
        id: `tx-${Date.now()}`,
        type: formType,
        title: formTitle.trim(),
        amount: Number(formAmount),
        categoryId: cat?.id || `cat-${Date.now()}`,
        categoryName,
        date: formDate,
        payerOrReceiver: formPayerReceiver.trim() || (formType === 'income' ? 'Thủ quỹ lớp' : 'Người nhận'),
        note: formNote.trim(),
        invoiceNumber: formInvoiceNumber.trim(),
        createdAt: new Date().toISOString()
      };

      onUpdateStore(prev => ({
        ...prev,
        financeTransactions: [newTx, ...(prev.financeTransactions || [])]
      }));
    }

    soundManager.playSuccess(store.settings.soundEnabled);
    setIsTxModalOpen(false);
  };

  // Delete Transaction
  const handleDeleteTransaction = (tx: FinanceTransaction) => {
    if (confirm(`Thầy/Cô có chắc chắn muốn xóa giao dịch "${tx.title}" (${formatVnd(tx.amount)}) không?`)) {
      onUpdateStore(prev => ({
        ...prev,
        financeTransactions: (prev.financeTransactions || []).filter(t => t.id !== tx.id)
      }));
      soundManager.playClick(store.settings.soundEnabled);
    }
  };

  // Update Individual Student Contribution
  const handleUpdateStudentPayment = (
    studentId: string,
    paidAmount: number,
    status: 'paid' | 'partial' | 'unpaid' | 'exempt',
    note?: string
  ) => {
    if (!activePlan) return;

    onUpdateStore(prev => {
      const updatedPlans = (prev.feePlans || []).map(p => {
        if (p.id !== activePlan.id) return p;

        const updatedContributions = p.contributions.map(c => {
          if (c.studentId !== studentId) return c;
          return {
            ...c,
            paidAmount,
            status,
            paidDate: paidAmount > 0 ? (c.paidDate || new Date().toISOString().split('T')[0]) : undefined,
            note: note !== undefined ? note : c.note
          };
        });

        return { ...p, contributions: updatedContributions };
      });

      return { ...prev, feePlans: updatedPlans };
    });

    soundManager.playClick(store.settings.soundEnabled);
  };

  // Batch Mark Team / All as Paid
  const handleBatchMarkPaid = (target: 'all' | number) => {
    if (!activePlan) return;
    const targetLabel = target === 'all' ? 'TẤT CẢ học sinh trong lớp' : `toàn bộ học sinh Tổ ${target}`;
    if (!confirm(`Xác nhận đánh dấu ĐÃ NỘP ĐỦ quỹ cho ${targetLabel} (${formatNumber(activePlan.amountPerStudent)} đ/em)?`)) {
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    onUpdateStore(prev => {
      const updatedPlans = (prev.feePlans || []).map(p => {
        if (p.id !== activePlan.id) return p;

        const updatedContributions = p.contributions.map(c => {
          if (c.status === 'exempt') return c; // keep exempt
          if (target === 'all' || c.teamNumber === target) {
            return {
              ...c,
              paidAmount: p.amountPerStudent,
              status: 'paid' as const,
              paidDate: todayStr
            };
          }
          return c;
        });

        return { ...p, contributions: updatedContributions };
      });

      return { ...prev, feePlans: updatedPlans };
    });

    soundManager.playSuccess(store.settings.soundEnabled);
  };

  // Create New Fee Plan
  const handleCreateFeePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle.trim() || planAmount <= 0) {
      alert('Vui lòng nhập tên đợt thu và số tiền quy định.');
      return;
    }

    const initialContributions: ClassFeeContribution[] = students.map(s => ({
      studentId: s.id,
      studentName: s.fullName,
      teamNumber: s.teamNumber,
      expectedAmount: planAmount,
      paidAmount: 0,
      status: 'unpaid'
    }));

    const newPlan: ClassFeePlan = {
      id: `fee-plan-${Date.now()}`,
      title: planTitle.trim(),
      term: planTerm,
      amountPerStudent: planAmount,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: planDueDate,
      description: planDesc.trim(),
      contributions: initialContributions
    };

    onUpdateStore(prev => ({
      ...prev,
      feePlans: [...(prev.feePlans || []), newPlan]
    }));

    setActivePlanId(newPlan.id);
    setIsPlanModalOpen(false);
    soundManager.playSuccess(store.settings.soundEnabled);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-semibold mb-1">
            <WalletCards className="w-4 h-4 text-teal-600" />
            <span>QUẢN LÝ TÀI CHÍNH & QUỸ LỚP</span>
            <span>·</span>
            <span>LỚP {currentClass?.name || '9/1'}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Sổ Quỹ Thu & Chi Lớp Học
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi chi tiết các khoản thu, khoản chi, tình hình đóng quỹ của từng học sinh và xuất báo cáo minh bạch cho phụ huynh.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenAddTx('income')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm khoản Thu (+)</span>
          </button>

          <button
            onClick={() => handleOpenAddTx('expense')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-2xs"
          >
            <Minus className="w-4 h-4" />
            <span>Thêm khoản Chi (-)</span>
          </button>

          <button
            onClick={() => {
              soundManager.playSuccess(store.settings.soundEnabled);
              exportFinanceToExcel(
                currentClass,
                transactions,
                activePlan,
                students,
                `Lớp ${currentClass?.name || '9/1'} - Năm học ${currentClass?.schoolYear || '2024 - 2025'}`
              );
            }}
            title="Xuất sổ quỹ thu chi và danh sách đóng tiền ra file Excel (.xlsx)"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => window.print()}
            title="In báo cáo quyết toán quỹ lớp"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs no-print"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>In báo cáo</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current Balance */}
        <div className={`p-4 rounded-xl border shadow-2xs transition-all ${
          balance >= 0 
            ? 'bg-gradient-to-br from-teal-50/60 to-white border-teal-200' 
            : 'bg-gradient-to-br from-rose-50/60 to-white border-rose-300'
        }`}>
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Số dư Quỹ hiện tại</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              balance >= 0 ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {balance >= 0 ? 'Dư an toàn' : 'Quỹ bị âm'}
            </span>
          </div>
          <div className={`mt-2 text-2xl font-black font-mono tabular-nums ${
            balance >= 0 ? 'text-teal-700' : 'text-rose-600'
          }`}>
            {formatVnd(balance)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Tổng giao dịch: {transactions.length} khoản</span>
            <span className="font-semibold text-slate-700">{currentClass?.name || '9/1'}</span>
          </div>
        </div>

        {/* Card 2: Total Inflow */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Tổng các khoản Thu</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            +{formatVnd(totalIncome)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{incomeCount} phiếu thu vào quỹ</span>
            <span className="text-emerald-700 font-medium">Tiền vào</span>
          </div>
        </div>

        {/* Card 3: Total Outflow */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Tổng các khoản Chi</span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 font-mono tabular-nums">
            -{formatVnd(totalExpense)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{expenseCount} phiếu chi ra</span>
            <span className="text-rose-600 font-medium">Chi tiêu</span>
          </div>
        </div>

        {/* Card 4: Fee Contribution Progress */}
        <div 
          onClick={() => setActiveTab('contributions')}
          className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs cursor-pointer hover:border-teal-300 transition-all"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Tiến độ Đóng Quỹ Lớp</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums flex items-baseline gap-1.5">
            <span>{planMetrics.rate}%</span>
            <span className="text-xs font-normal text-slate-500 font-sans">
              ({planMetrics.paidCount}/{planMetrics.totalStudents} em)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Thu được: {formatNumber(planMetrics.totalPaid)} đ</span>
            <span className="text-teal-700 font-semibold underline">Xem chi tiết</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold max-w-xl no-print">
        <button
          onClick={() => {
            soundManager.playClick(store.settings.soundEnabled);
            setActiveTab('transactions');
          }}
          className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'transactions' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Sổ Thu / Chi ({transactions.length})</span>
        </button>

        <button
          onClick={() => {
            soundManager.playClick(store.settings.soundEnabled);
            setActiveTab('contributions');
          }}
          className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'contributions' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Theo dõi Đóng Quỹ ({students.length} HS)</span>
        </button>

        <button
          onClick={() => {
            soundManager.playClick(store.settings.soundEnabled);
            setActiveTab('statement');
          }}
          className={`flex-1 py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'statement' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Báo Cáo Công Khai</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SỔ THU / CHI (TRANSACTIONS)                                         */}
      {/* ========================================================================= */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Spend Category Breakdown (Visual Cards) */}
          {expenseByCategory.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  <span>Cơ cấu Chi tiêu Quỹ lớp ({formatVnd(totalExpense)})</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  {expenseByCategory.length} danh mục chi
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {expenseByCategory.slice(0, 4).map((item, idx) => {
                  const percentage = totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0;
                  return (
                    <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span className="truncate pr-1 font-medium">{item.name}</span>
                        <span className="font-bold font-mono text-rose-600">{percentage}%</span>
                      </div>
                      <div className="text-base font-bold text-slate-900 font-mono tabular-nums">
                        {formatNumber(item.amount)} đ
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Filter */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 font-semibold text-xs">
                <button
                  onClick={() => setTxTypeFilter('all')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    txTypeFilter === 'all' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({transactions.length})
                </button>
                <button
                  onClick={() => setTxTypeFilter('income')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    txTypeFilter === 'income' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Thu ({incomeCount})
                </button>
                <button
                  onClick={() => setTxTypeFilter('expense')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    txTypeFilter === 'expense' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chi ({expenseCount})
                </button>
              </div>

              {/* Category Filter */}
              <select
                value={txCategoryFilter}
                onChange={e => setTxCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="all">Mọi danh mục</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.type === 'income' ? '[Thu]' : '[Chi]'} {c.name}
                  </option>
                ))}
              </select>

              {/* Month Filter */}
              {transactionMonths.length > 0 && (
                <select
                  value={txMonthFilter}
                  onChange={e => setTxMonthFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                >
                  <option value="all">Mọi tháng</option>
                  {transactionMonths.map(m => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm khoản thu chi, người nộp/nhận..."
                value={txSearchTerm}
                onChange={e => setTxSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 w-full sm:w-64"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Ngày</th>
                    <th className="py-3 px-3">Loại</th>
                    <th className="py-3 px-3">Nội dung thu / chi</th>
                    <th className="py-3 px-3">Danh mục</th>
                    <th className="py-3 px-3">Người nộp / nhận</th>
                    <th className="py-3 px-3 text-right">Số tiền</th>
                    <th className="py-3 px-3">Chứng từ / Ghi chú</th>
                    <th className="py-3 px-3 text-center no-print">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === 'income' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {tx.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {tx.type === 'income' ? 'THU' : 'CHI'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                        <span className="block">{tx.title}</span>
                        {tx.invoiceNumber && (
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            Số CT: {tx.invoiceNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {tx.categoryName}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-medium whitespace-nowrap">
                        {tx.payerOrReceiver}
                      </td>
                      <td className={`py-3 px-3 text-right font-mono font-bold tabular-nums whitespace-nowrap text-sm ${
                        tx.type === 'income' ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {tx.type === 'income' ? `+${formatNumber(tx.amount)}` : `-${formatNumber(tx.amount)}`} đ
                      </td>
                      <td className="py-3 px-3 text-slate-500 italic text-[11px] max-w-xs">
                        {tx.note || '—'}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditTx(tx)}
                            title="Chỉnh sửa giao dịch"
                            className="p-1 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(tx)}
                            title="Xóa giao dịch"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <WalletCards className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <span>Không tìm thấy giao dịch thu chi nào phù hợp với bộ lọc.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: THEO DÕI ĐÓNG QUỸ TỪNG HỌC SINH (CONTRIBUTIONS)                     */}
      {/* ========================================================================= */}
      {activeTab === 'contributions' && (
        <div className="space-y-6">
          {/* Plan Selector & Action Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block">Đang xem đợt thu quỹ:</label>
                <div className="flex items-center gap-2 mt-0.5">
                  <select
                    value={activePlanId}
                    onChange={e => setActivePlanId(e.target.value)}
                    className="font-bold text-sm text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {feePlans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({formatNumber(p.amountPerStudent)} đ/HS)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {activePlan && (
                <div className="hidden sm:block border-l border-slate-200 pl-3">
                  <span className="text-[11px] text-slate-500 block">Hạn thu:</span>
                  <span className="font-mono text-xs font-semibold text-slate-700">{activePlan.dueDate}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick(store.settings.soundEnabled);
                  setPlanTitle(`Thu Quỹ Lớp Học Kỳ II (${currentClass?.schoolYear || '2024 - 2025'})`);
                  setPlanTerm('HK2');
                  setPlanAmount(100000);
                  setIsPlanModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-teal-600" />
                <span>Tạo đợt thu mới</span>
              </button>

              <button
                type="button"
                onClick={() => handleBatchMarkPaid('all')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đánh dấu cả lớp đã nộp đủ</span>
              </button>
            </div>
          </div>

          {/* Progress Overview Bar */}
          {activePlan && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">Tiến độ thu tiền: </span>
                  <span className="font-mono font-bold text-teal-700 text-sm">
                    {formatNumber(planMetrics.totalPaid)} đ / {formatNumber(planMetrics.totalExpected)} đ
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-emerald-700 font-semibold">● Đã nộp đủ: {planMetrics.paidCount}</span>
                  <span className="text-amber-600 font-semibold">● Nộp một phần: {planMetrics.partialCount}</span>
                  <span className="text-rose-600 font-semibold">● Chưa nộp: {planMetrics.unpaidCount}</span>
                  <span className="text-slate-500">● Miễn giảm: {planMetrics.exemptCount}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${(planMetrics.paidCount / (planMetrics.totalStudents || 1)) * 100}%` }}
                  title={`Đã nộp: ${planMetrics.paidCount} em`}
                />
                <div
                  className="bg-amber-400 h-full transition-all"
                  style={{ width: `${(planMetrics.partialCount / (planMetrics.totalStudents || 1)) * 100}%` }}
                  title={`Nộp 1 phần: ${planMetrics.partialCount} em`}
                />
                <div
                  className="bg-slate-300 h-full transition-all"
                  style={{ width: `${(planMetrics.exemptCount / (planMetrics.totalStudents || 1)) * 100}%` }}
                  title={`Miễn giảm: ${planMetrics.exemptCount} em`}
                />
              </div>
            </div>
          )}

          {/* Student Filter Toolbar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setContribStatusFilter('all')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    contribStatusFilter === 'all' ? 'bg-white text-teal-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({activePlan?.contributions.length || 0})
                </button>
                <button
                  onClick={() => setContribStatusFilter('paid')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    contribStatusFilter === 'paid' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Đã nộp đủ ({planMetrics.paidCount})
                </button>
                <button
                  onClick={() => setContribStatusFilter('unpaid')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    contribStatusFilter === 'unpaid' ? 'bg-rose-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chưa nộp ({planMetrics.unpaidCount})
                </button>
              </div>

              {/* Team Filter */}
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setContribTeamFilter('all')}
                  className={`px-2 py-1 rounded ${
                    contribTeamFilter === 'all' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cả lớp
                </button>
                {[1, 2, 3, 4].map(tNum => (
                  <button
                    key={tNum}
                    onClick={() => setContribTeamFilter(tNum)}
                    className={`px-2 py-1 rounded ${
                      contribTeamFilter === tNum ? 'bg-teal-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tổ {tNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên hoặc mã học sinh..."
                value={contribSearchTerm}
                onChange={e => setContribSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 w-full sm:w-60"
              />
            </div>
          </div>

          {/* Student Contributions Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 text-center">STT</th>
                    <th className="py-2.5 px-3">Học sinh</th>
                    <th className="py-2.5 px-3">Tổ</th>
                    <th className="py-2.5 px-3 text-right">Mức quy định</th>
                    <th className="py-2.5 px-3 text-right">Đã nộp</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                    <th className="py-2.5 px-3">Ngày nộp</th>
                    <th className="py-2.5 px-3">Ghi chú</th>
                    <th className="py-2.5 px-3 text-center no-print">Thao tác nhanh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContributions.map((c, idx) => {
                    const student = students.find(s => s.id === c.studentId);
                    return (
                      <tr key={c.studentId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block">{c.studentName}</span>
                          <span className="text-[10px] font-mono text-slate-400 block">{student?.code || `HS-${idx + 1}`}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          Tổ {c.teamNumber || 1}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700 tabular-nums">
                          {formatNumber(c.expectedAmount)} đ
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-700 tabular-nums text-sm">
                          {formatNumber(c.paidAmount)} đ
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            c.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                            c.status === 'exempt' ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {c.status === 'paid' ? 'Đã nộp đủ' :
                             c.status === 'partial' ? 'Nộp 1 phần' :
                             c.status === 'exempt' ? 'Miễn giảm' : 'Chưa nộp'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                          {c.paidDate || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 italic text-[11px] max-w-xs truncate">
                          {c.note || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center no-print">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateStudentPayment(c.studentId, c.expectedAmount, 'paid')}
                              title="Đánh dấu đã nộp đủ"
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                c.status === 'paid' 
                                  ? 'bg-emerald-600 text-white shadow-2xs' 
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              Đủ 100k
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStudentPayment(c.studentId, Math.round(c.expectedAmount / 2), 'partial')}
                              title="Đánh dấu nộp trước 50k"
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                c.status === 'partial' 
                                  ? 'bg-amber-500 text-white shadow-2xs' 
                                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              50k
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStudentPayment(c.studentId, 0, 'unpaid')}
                              title="Đánh dấu chưa nộp"
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                c.status === 'unpaid' 
                                  ? 'bg-rose-600 text-white shadow-2xs' 
                                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              0đ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStudentPayment(c.studentId, 0, 'exempt', 'Thuộc diện chính sách miễn nộp')}
                              title="Miễn giảm quỹ"
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                c.status === 'exempt' 
                                  ? 'bg-slate-700 text-white shadow-2xs' 
                                  : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              Miễn
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BÁO CÁO CÔNG KHAI QUỸ (STATEMENT / PRINTABLE DOCUMENT)              */}
      {/* ========================================================================= */}
      {activeTab === 'statement' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-2xs space-y-6 printable-area">
          {/* Official Letterhead */}
          <div className="text-center pb-4 border-b border-slate-200">
            <div className="text-xs uppercase font-semibold text-slate-500">
              TRƯỜNG THCS QUẬN / HUYỆN · BAN ĐẠI DIỆN CHA MẸ HỌC SINH
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 mt-1 uppercase tracking-tight">
              BẢNG CÔNG KHAI THU CHI QUỸ LỚP VÀ KẾ HOẠCH TÀI CHÍNH
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Lớp: <strong>{currentClass?.name || '9/1'}</strong> · Năm học: <strong>{currentClass?.schoolYear || '2024 - 2025'}</strong>
            </p>
            <p className="text-xs text-slate-500">
              Giáo viên chủ nhiệm: <strong>{currentClass?.teacherName || 'Cô Nguyễn Mai Anh'}</strong>
            </p>
          </div>

          {/* Section 1: Financial Balance Sheet */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              I. Báo cáo cân đối tổng hợp quỹ lớp
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-semibold block uppercase">1. Tổng số tiền thu vào:</span>
                <span className="text-xl font-black font-mono text-emerald-700 mt-1 block">
                  +{formatVnd(totalIncome)}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">{incomeCount} khoản thu đã thực hiện</span>
              </div>

              <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200">
                <span className="text-[11px] text-rose-800 font-semibold block uppercase">2. Tổng số tiền đã chi:</span>
                <span className="text-xl font-black font-mono text-rose-600 mt-1 block">
                  -{formatVnd(totalExpense)}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">{expenseCount} khoản chi tiêu có chứng từ</span>
              </div>

              <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-300">
                <span className="text-[11px] text-teal-800 font-bold block uppercase">3. Số dư quỹ hiện hữu:</span>
                <span className="text-xl font-black font-mono text-teal-800 mt-1 block">
                  {formatVnd(balance)}
                </span>
                <span className="text-[11px] text-teal-700 font-medium mt-1 block">Tồn quỹ an toàn để chi tiếp</span>
              </div>
            </div>
          </div>

          {/* Section 2: Expense Breakdown Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              II. Danh mục chi tiêu chi tiết
            </h3>
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 font-semibold text-slate-700">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Nội dung chi</th>
                  <th className="py-2.5 px-3">Ngày chi</th>
                  <th className="py-2.5 px-3">Người nhận / Cửa hàng</th>
                  <th className="py-2.5 px-3 text-right">Số tiền</th>
                  <th className="py-2.5 px-3">Số chứng từ / Minh chứng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions
                  .filter(t => t.type === 'expense')
                  .map((t, idx) => (
                    <tr key={t.id}>
                      <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{t.title}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{t.date}</td>
                      <td className="py-2 px-3 text-slate-700">{t.payerOrReceiver}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                        -{formatNumber(t.amount)} đ
                      </td>
                      <td className="py-2 px-3 text-slate-500 italic text-[11px]">
                        {t.invoiceNumber ? `HĐ: ${t.invoiceNumber}` : ''} {t.note ? `(${t.note})` : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Signatures Footer */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-3 text-center text-xs gap-4">
            <div>
              <span className="font-bold text-slate-900 block">THỦ QUỸ LỚP</span>
              <span className="text-[11px] text-slate-400 italic block mt-0.5">(Ký và ghi rõ họ tên)</span>
              <div className="h-16"></div>
              <span className="font-semibold text-slate-800">Phạm Gia Hân</span>
            </div>

            <div>
              <span className="font-bold text-slate-900 block">TRƯỞNG BAN ĐẠI DIỆN CMHS</span>
              <span className="text-[11px] text-slate-400 italic block mt-0.5">(Ký và ghi rõ họ tên)</span>
              <div className="h-16"></div>
              <span className="font-semibold text-slate-800">Trần Văn Hùng</span>
            </div>

            <div>
              <span className="text-slate-500 text-[11px] italic block">
                ..., ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
              </span>
              <span className="font-bold text-slate-900 block mt-0.5">GIÁO VIÊN CHỦ NHIỆM</span>
              <span className="text-[11px] text-slate-400 italic block mt-0.5">(Ký và ghi rõ họ tên)</span>
              <div className="h-16"></div>
              <span className="font-semibold text-slate-800">
                {currentClass?.teacherName || 'Cô Nguyễn Mai Anh'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM / SỬA GIAO DỊCH (TRANSACTION MODAL)                            */}
      {/* ========================================================================= */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                {formType === 'income' ? (
                  <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="p-1 rounded-lg bg-rose-100 text-rose-800">
                    <ArrowDownRight className="w-4 h-4" />
                  </span>
                )}
                <span>{editingTx ? 'Chỉnh Sửa Khoản Thu / Chi' : formType === 'income' ? 'Thêm Khoản Thu Mới (+)' : 'Thêm Khoản Chi Mới (-)'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTxModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-3.5 text-xs">
              {/* Type Switcher */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Loại giao dịch *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('income');
                      const inCats = categories.filter(c => c.type === 'income');
                      setFormCategoryId(inCats[0]?.id || '');
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                      formType === 'income'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span>Khoản Thu (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormType('expense');
                      const outCats = categories.filter(c => c.type === 'expense');
                      setFormCategoryId(outCats[0]?.id || '');
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                      formType === 'expense'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4 text-rose-600" />
                    <span>Khoản Chi (-)</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nội dung khoản thu / chi *</label>
                <input
                  type="text"
                  required
                  placeholder={formType === 'income' ? 'Ví dụ: Thu quỹ lớp HK1, Thưởng thi đua...' : 'Ví dụ: Mua bút dạ bảng, Photo đề thi, Mua nước Lavie...'}
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Amount & Quick amount chips */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số tiền (VNĐ) *</label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  placeholder="Ví dụ: 150000"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {[50000, 100000, 200000, 500000, 1000000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormAmount(val)}
                      className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      {formatNumber(val)} đ
                    </button>
                  ))}
                </div>
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Danh mục phân loại *</label>
                  <select
                    value={formCategoryId}
                    onChange={e => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {categories
                      .filter(c => c.type === formType)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày giao dịch *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Payer / Receiver & Invoice Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {formType === 'income' ? 'Người nộp tiền' : 'Người nhận / Cửa hàng mua'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={formType === 'income' ? 'Thủ quỹ lớp / Bác Hùng CMHS...' : 'Nhà sách Fahasa / Đại lý nước...'}
                    value={formPayerReceiver}
                    onChange={e => setFormPayerReceiver(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số phiếu thu / Hóa đơn</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: PT-01 hoặc PC-02"
                    value={formInvoiceNumber}
                    onChange={e => setFormInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú / Diễn giải minh chứng</label>
                <textarea
                  rows={2}
                  placeholder="Ghi rõ chi tiết mục đích, quy cách, số lượng sản phẩm..."
                  value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 font-semibold text-white rounded-lg transition-colors shadow-2xs ${
                    formType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {editingTx ? 'Lưu thay đổi' : formType === 'income' ? 'Xác nhận Thu (+)' : 'Xác nhận Chi (-)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TẠO ĐỢT THU QUỸ MỚI (FEE PLAN MODAL)                                */}
      {/* ========================================================================= */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Tạo Đợt Thu Quỹ Lớp Mới</h3>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFeePlan} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên đợt thu quỹ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thu Quỹ lớp Học kỳ II (2024 - 2025)"
                  value={planTitle}
                  onChange={e => setPlanTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kỳ áp dụng *</label>
                  <select
                    value={planTerm}
                    onChange={e => setPlanTerm(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="HK1">Học kỳ 1</option>
                    <option value="HK2">Học kỳ 2</option>
                    <option value="Cả năm">Cả năm học</option>
                    <option value="Đột xuất">Khoản đột xuất / Dã ngoại</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số tiền / 1 học sinh *</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    step={10000}
                    value={planAmount}
                    onChange={e => setPlanAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hạn nộp tiền</label>
                <input
                  type="date"
                  value={planDueDate}
                  onChange={e => setPlanDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mục đích sử dụng quỹ</label>
                <textarea
                  rows={2}
                  placeholder="Dùng để chi tiền nước uống, photo tài liệu, sinh hoạt lớp..."
                  value={planDesc}
                  onChange={e => setPlanDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-800">
                Hệ thống sẽ tự động tạo danh sách theo dõi đóng tiền cho toàn bộ <strong>{students.length} học sinh</strong> trong lớp.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-2xs"
                >
                  Tạo đợt thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
