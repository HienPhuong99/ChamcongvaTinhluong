import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Lock,
  Unlock,
  Download,
  FileSpreadsheet,
  Settings,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Plus,
  Mail,
  RefreshCw,
  Printer,
  X,
  Smartphone,
  Landmark,
  MessageSquareWarning,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { PayrollRow } from '../types';
import {
  canManagePayroll,
  exportPayslipToPDF,
  exportToCSV,
  exportToExcel,
  formatVND,
  getPreviousMonthPeriod,
} from '../utils/helpers';

function shiftPeriodMonth(period: string, delta: number): string {
  const [yStr, mStr] = period.split('-');
  const y = parseInt(yStr || '2026', 10);
  const m = parseInt(mStr || '10', 10);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatPeriodLabel(period: string): string {
  const [yStr, mStr] = period.split('-');
  return `Tháng ${parseInt(mStr || '10', 10)}/${yStr || '2026'}`;
}

export const PayrollView: React.FC = () => {
  const {
    scopedEmployees,
    payrollPeriods,
    currentAccount,
    computePayrollRows,
    declareBaseSalary,
    calculatePayrollForPeriod,
    publishPayslipsForPeriod,
    toggleLockPayrollPeriod,
    addBonusDeduction,
    addSalesCommissionBatch,
    addAuditLog,
    showToast,
    setActiveTab,
  } = useHRM();

  const [period, setPeriod] = useState<string>(() => getPreviousMonthPeriod());
  const [isDeclareModalOpen, setIsDeclareModalOpen] = useState(false);
  const [declareEmpId, setDeclareEmpId] = useState('');
  const [declareAmount, setDeclareAmount] = useState(28000000);
  const [declareAllowance, setDeclareAllowance] = useState(3000000);
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [bonusEmpId, setBonusEmpId] = useState('NV0001');
  const [bonusType, setBonusType] = useState<'Thưởng' | 'Khấu trừ'>('Thưởng');
  const [bonusTitle, setBonusTitle] = useState('Thưởng hiệu suất công việc tháng');
  const [bonusAmount, setBonusAmount] = useState(1500000);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRow | null>(null);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);

  const canManage = canManagePayroll(currentAccount.roleId);

  const retailStaff = useMemo(
    () =>
      scopedEmployees
        .filter(
          (e) =>
            e.status !== 'Đã nghỉ' &&
            (e.department === 'Kinh doanh' || e.department === 'Kỹ thuật')
        )
        .slice(0, 8),
    [scopedEmployees]
  );

  const [commissionRows, setCommissionRows] = useState<
    Record<string, { iphoneCount: number; appleCareCount: number; installmentCount: number }>
  >(() => ({
    NV0003: { iphoneCount: 18, appleCareCount: 9, installmentCount: 7 },
    NV0004: { iphoneCount: 14, appleCareCount: 6, installmentCount: 5 },
    NV0005: { iphoneCount: 22, appleCareCount: 11, installmentCount: 9 },
    NV0008: { iphoneCount: 12, appleCareCount: 5, installmentCount: 4 },
    NV0009: { iphoneCount: 25, appleCareCount: 14, installmentCount: 10 },
  }));

  const periodState = useMemo(
    () =>
      payrollPeriods.find((p) => p.period === period) || {
        period,
        step1TimesheetAggregated: false,
        step2TimesheetLocked: false,
        step3SalariesDeclared: !scopedEmployees.some(
          (e) => e.status !== 'Đã nghỉ' && (!e.baseSalary || e.baseSalary <= 0)
        ),
        step4PayrollCalculated: false,
        step5PayslipsPublished: false,
        locked: false,
      },
    [payrollPeriods, period, scopedEmployees]
  );

  const payrollRows = useMemo(
    () => computePayrollRows(period),
    [computePayrollRows, period]
  );

  const missingSalaryEmps = useMemo(
    () =>
      scopedEmployees.filter(
        (e) => e.status !== 'Đã nghỉ' && (!e.baseSalary || e.baseSalary <= 0)
      ),
    [scopedEmployees]
  );

  useEffect(() => {
    const candidate =
      missingSalaryEmps[0]?.id ||
      scopedEmployees.find((e) => e.status !== 'Đã nghỉ')?.id ||
      '';
    if (candidate && (!declareEmpId || !scopedEmployees.some((e) => e.id === declareEmpId))) {
      setDeclareEmpId(candidate);
    } else if (missingSalaryEmps.length > 0 && !missingSalaryEmps.some((e) => e.id === declareEmpId)) {
      setDeclareEmpId(missingSalaryEmps[0].id);
    }
  }, [missingSalaryEmps, scopedEmployees, declareEmpId]);

  const handleExportCSV = () => {
    exportToCSV(
      `BangLuong_${period}.csv`,
      payrollRows.map((row) => {
        const emp = scopedEmployees.find((e) => e.id === row.employeeId);
        return {
          'Mã NV': emp?.code || row.employeeId,
          'Họ tên': emp?.name || row.employeeId,
          'Phòng ban': emp?.department || '',
          'Lương cơ bản': row.baseSalary,
          'Ngày công': row.actualDays + row.paidLeaveDays,
          'Lương theo công': row.proRatedSalary,
          'Phụ cấp': row.allowance,
          'Lương OT': row.otAmount,
          Thưởng: row.bonus,
          'Phạt đi muộn': row.latePenaltyAmount,
          'Khấu trừ khác / Tạm ứng EWA': row.otherDeduction,
          'BHXH (10.5%)': row.insuranceAmount,
          'Thuế TNCN': row.taxAmount,
          'Thực lĩnh (VNĐ)': row.netSalary,
        };
      })
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      `BangLuong_phuonghihi_${period}.xlsx`,
      `BangLuong_${period}`,
      payrollRows.map((row) => {
        const emp = scopedEmployees.find((e) => e.id === row.employeeId);
        return {
          'Mã NV': emp?.code || row.employeeId,
          'Họ tên': emp?.name || row.employeeId,
          'Phòng ban': emp?.department || '',
          'Lương cơ bản': row.baseSalary,
          'Ngày công tính lương': row.actualDays + row.paidLeaveDays,
          'Lương theo công': row.proRatedSalary,
          'Phụ cấp': row.allowance,
          'Lương tăng ca (OT)': row.otAmount,
          Thưởng: row.bonus,
          'Phạt đi muộn': row.latePenaltyAmount,
          'Khấu trừ khác / Tạm ứng EWA': row.otherDeduction,
          'BHXH (10.5%)': row.insuranceAmount,
          'Thuế TNCN': row.taxAmount,
          'Thực lĩnh': row.netSalary,
        };
      })
    );
  };

  const handleExportVietcombankBatch = () => {
    const missingBankEmps: string[] = [];
    const validTransferRows = payrollRows
      .filter((row) => {
        const emp = scopedEmployees.find((e) => e.id === row.employeeId);
        const cleanAcc = emp?.bankAccount?.trim() || '';
        if (!cleanAcc) {
          missingBankEmps.push(emp?.name ? `${emp.name} (${emp.code})` : row.employeeId);
          return false;
        }
        return row.netSalary > 0;
      })
      .map((row, idx) => {
        const emp = scopedEmployees.find((e) => e.id === row.employeeId);
        return {
          STT: idx + 1,
          'Mã NV': emp?.code || row.employeeId,
          'Chủ tài khoản thụ hưởng': (emp?.name || row.employeeId).toUpperCase(),
          'Số tài khoản nhận': emp!.bankAccount!.trim(),
          'Ngân hàng thụ hưởng': emp?.bankName || 'Vietcombank - CN TP.HCM',
          'Số tiền chuyển khoản (VNĐ)': row.netSalary,
          'Nội dung chuyển khoản': `PHUONGHIHI THANH TOAN LUONG KY ${period} NV ${emp?.code || row.employeeId}`,
        };
      });

    if (validTransferRows.length === 0) {
      showToast(
        'Không có tài khoản ngân hàng hợp lệ để xuất lệnh chi!',
        'Vui lòng cập nhật Số tài khoản ngân hàng trong Hồ sơ Nhân sự trước khi xuất Ủy nhiệm chi.',
        'warning'
      );
      return;
    }

    exportToExcel(
      `Vietcombank_ChuyenKhoanLuong_phuonghihi_${period}.xlsx`,
      `VCB_Payroll_${period}`,
      validTransferRows
    );
    addAuditLog(
      'Xuất lệnh chi lương Vietcombank',
      'Bảng lương',
      `Kỳ ${period} · ${validTransferRows.length} tài khoản thụ hưởng${
        missingBankEmps.length > 0 ? ` (Bỏ qua ${missingBankEmps.length} NV chưa khai STK)` : ''
      }`
    );
    if (missingBankEmps.length > 0) {
      showToast(
        `Đã xuất ${validTransferRows.length} lệnh chi · Bỏ qua ${missingBankEmps.length} NV thiếu STK!`,
        `Nhân sự chưa khai Số tài khoản: ${missingBankEmps.slice(0, 3).join(', ')}. Vui lòng bổ sung trong mục Nhân sự.`,
        'warning'
      );
    } else {
      showToast(
        `Đã xuất bảng kê chuyển khoản Vietcombank kỳ ${period}!`,
        `File Excel chuẩn lô uỷ nhiệm chi cho ${validTransferRows.length} nhân viên.`
      );
    }
  };

  const handleApplyCommissionBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = retailStaff.map((emp, idx) => {
      const entry = commissionRows[emp.id] || {
        iphoneCount: 10 + (idx % 5) * 2,
        appleCareCount: 4 + (idx % 3),
        installmentCount: 3 + (idx % 4),
      };
      return {
        employeeId: emp.id,
        ...entry,
      };
    });
    addSalesCommissionBatch(period, payload);
    setIsCommissionModalOpen(false);
  };

  const handleDeclareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = declareEmpId || missingSalaryEmps[0]?.id;
    if (targetId) {
      declareBaseSalary(targetId, declareAmount, declareAllowance);
    }
    setIsDeclareModalOpen(false);
  };

  const handleBonusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBonusDeduction({
      employeeId: bonusEmpId,
      period,
      type: bonusType,
      title: bonusTitle,
      amount: bonusAmount,
    });
    setIsBonusModalOpen(false);
  };

  const displayedPayrollRows = showAllRows ? payrollRows : payrollRows.slice(0, 20);

  return (
    <div className="p-3.5 sm:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header (Matches 00:48 in video) */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          PHUONGHIHI / LƯƠNG &amp; BÁO CÁO
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Bảng lương</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Lương theo công, hoa hồng bán lẻ iPhone, bảo hiểm, thuế lũy tiến 7 bậc, tạm ứng EWA và phiếu lương.
        </p>
      </div>

      {/* Top Toolbar (Matches 00:48 - 00:51 in video) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs shrink-0">
            <button
              onClick={() => setPeriod((prev) => shiftPeriodMonth(prev, -1))}
              title="Tháng trước"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <label className="relative flex items-center gap-2 px-3 py-1 text-xs font-bold text-slate-800 whitespace-nowrap cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{formatPeriodLabel(period)}</span>
              <input
                type="month"
                aria-label="Chọn tháng kỳ lương"
                value={period}
                onChange={(e) => {
                  if (e.target.value) setPeriod(e.target.value);
                }}
                className="sr-only"
              />
            </label>
            <button
              onClick={() => setPeriod((prev) => shiftPeriodMonth(prev, 1))}
              title="Tháng tiếp theo"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {canManage && (
            <button
              onClick={() => toggleLockPayrollPeriod(period)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition shadow-2xs whitespace-nowrap shrink-0 cursor-pointer ${
                periodState.locked
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {periodState.locked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 shrink-0" />
                  <span>Mở khoá bảng lương</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>Khoá bảng lương</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <button
              onClick={() => setIsCommissionModalOpen(true)}
              disabled={periodState.locked}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50 text-xs font-bold text-indigo-700 shadow-2xs transition cursor-pointer whitespace-nowrap"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Tính hoa hồng bán iPhone</span>
            </button>
          )}
          <button
            onClick={handleExportVietcombankBatch}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold text-emerald-800 shadow-2xs transition cursor-pointer whitespace-nowrap"
          >
            <Landmark className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Xuất ủy nhiệm chi Vietcombank</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Xuất CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Xuất Excel</span>
          </button>
          {canManage && (
            <>
              <button
                onClick={() => setActiveTab('settings')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs whitespace-nowrap"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Cấu hình lương</span>
              </button>
              <button
                onClick={() => calculatePayrollForPeriod(period)}
                disabled={periodState.locked}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Calculator className="w-3.5 h-3.5 shrink-0" />
                <span>Tính lương</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 5-Step Payroll Workflow Card (Exact match to 00:49 - 00:52 in video) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Làm lương kỳ {period}
              </h2>
              {periodState.locked && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                  <Lock className="w-3 h-3" />
                  Đã khoá sổ
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Làm lần lượt theo đúng 5 bước. Bước nào chưa xong thì nói rõ còn
              thiếu gì.
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => calculatePayrollForPeriod(period)}
              disabled={periodState.locked}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-xs font-semibold text-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Kiểm tra lại</span>
            </button>
          )}
        </div>

        {/* 5 Steps List */}
        <div className="space-y-2.5">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {periodState.step1TimesheetAggregated ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Tổng hợp bảng công tháng
                </div>
                <div className="text-[11px] text-slate-500">
                  {periodState.step1TimesheetAggregated
                    ? `${payrollRows.length} / ${payrollRows.length} đã xong`
                    : 'Chưa tổng hợp bảng công kỳ này'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('timesheet')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700"
            >
              Mở bảng công
            </button>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {periodState.step2TimesheetLocked ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Chốt kỳ công
                </div>
                <div className="text-[11px] text-slate-500">
                  {periodState.step2TimesheetLocked
                    ? 'Kỳ công đã chốt khoá an toàn trước khi tính lương.'
                    : 'Nên chốt kỳ công trước khi tính lương, để công không đổi sau lưng bảng lương.'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('timesheet')}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700"
            >
              Mở bảng công
            </button>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {missingSalaryEmps.length === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Khai lương cơ bản
                </div>
                <div className="text-[11px] text-slate-500">
                  {missingSalaryEmps.length > 0
                    ? `${missingSalaryEmps.length} người chưa có lương cơ bản (đang tính 0đ): ${missingSalaryEmps
                        .map((e) => e.name)
                        .join(', ')}`
                    : `Tất cả ${payrollRows.length} nhân sự đã có lương cơ bản`}
                </div>
              </div>
            </div>
            {canManage && (
              <button
                onClick={() => setIsDeclareModalOpen(true)}
                disabled={periodState.locked}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 text-xs font-semibold text-slate-700"
              >
                Khai lương
              </button>
            )}
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {periodState.step4PayrollCalculated ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Tính bảng lương
                </div>
                <div className="text-[11px] text-slate-500">
                  {payrollRows.length} / {payrollRows.length} đã tính
                </div>
              </div>
            </div>
            {canManage && (
              <button
                onClick={() => calculatePayrollForPeriod(period)}
                disabled={periodState.locked}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold"
              >
                Tính lương
              </button>
            )}
          </div>

          {/* Step 5 */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {periodState.step5PayslipsPublished ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Chốt và phát hành phiếu lương
                </div>
                <div className="text-[11px] text-slate-500">
                  {periodState.step5PayslipsPublished
                    ? `${payrollRows.length} / ${payrollRows.length} đã phát hành`
                    : 'Chưa phát hành phiếu lương kỳ này'}
                </div>
              </div>
            </div>
            {canManage && (
              <button
                onClick={() => publishPayslipsForPeriod(period)}
                disabled={periodState.locked}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold"
              >
                Chốt kỳ
              </button>
            )}
          </div>
        </div>

        {/* Payslip Dispatch Bar (Exact match to 00:51 - 00:52 in video) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-slate-900">
              Phát hành phiếu lương
            </div>
            <div className="text-[11px] text-slate-500">
              Tạo PDF cho từng người và gửi email nếu bật tuỳ chọn gửi phiếu qua
              email trong Cài đặt &gt; Tính lương.
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsBonusModalOpen(true)}
                disabled={periodState.locked}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-xs font-semibold text-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thưởng &amp; khấu trừ</span>
              </button>
              <button
                onClick={() => publishPayslipsForPeriod(period)}
                disabled={periodState.locked}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Phát hành phiếu lương</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">
            Bảng tính lương chi tiết kỳ {period} ({payrollRows.length} nhân sự)
          </span>
          <span className="text-xs text-slate-500">
            Bấm vào từng dòng để xem &amp; in Phiếu lương PDF
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/50">
                <th className="py-3 px-4">Nhân viên</th>
                <th className="py-3 px-3 text-right">Lương cơ bản</th>
                <th className="py-3 px-2 text-center">Công</th>
                <th className="py-3 px-3 text-right">Lương theo công</th>
                <th className="py-3 px-3 text-right">Phụ cấp + OT + Thưởng</th>
                <th className="py-3 px-3 text-right">Phạt muộn</th>
                <th className="py-3 px-3 text-right">Khấu trừ / Tạm ứng</th>
                <th className="py-3 px-3 text-right">BHXH + Thuế</th>
                <th className="py-3 px-4 text-right">Thực lĩnh</th>
                <th className="py-3 px-4 text-right">Phiếu lương</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayedPayrollRows.map((row) => {
                const emp = scopedEmployees.find(
                  (e) => e.id === row.employeeId
                );
                return (
                  <tr
                    key={row.employeeId}
                    onClick={() => setSelectedPayslip(row)}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {emp?.name || row.employeeId}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {emp?.code} · {emp?.department}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {row.baseSalary > 0 ? (
                        formatVND(row.baseSalary)
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold">
                          Chưa khai (0đ)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center text-slate-600">
                      {row.actualDays + row.paidLeaveDays}/{row.standardDays}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700">
                      {formatVND(row.proRatedSalary)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-medium">
                      +{formatVND(row.allowance + row.otAmount + row.bonus)}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-600">
                      {row.latePenaltyAmount > 0
                        ? `-${formatVND(row.latePenaltyAmount)}`
                        : '0 đ'}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-600 font-medium">
                      {row.otherDeduction > 0
                        ? `-${formatVND(row.otherDeduction)}`
                        : '0 đ'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-500">
                      -{formatVND(row.insuranceAmount + row.taxAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-blue-600">
                      {formatVND(row.netSalary)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                        Xem phiếu
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {payrollRows.length > 20 && (
          <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Đang hiển thị <strong>{displayedPayrollRows.length}</strong> /{' '}
              <strong>{payrollRows.length}</strong> phiếu lương nhân sự
            </span>
            <button
              onClick={() => setShowAllRows((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold transition"
            >
              {showAllRows
                ? 'Thu gọn (20 dòng đầu)'
                : `Xem toàn bộ ${payrollRows.length} phiếu lương`}
            </button>
          </div>
        )}
      </div>

      {/* Retail iPhone Commission Calculator Modal */}
      {isCommissionModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsCommissionModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Tính hoa hồng bán lẻ iPhone &amp; IMEI — Kỳ {period}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Đơn giá chuẩn Cửa hàng phuonghihi: 150.000đ/máy iPhone · 200.000đ/gói AppleCare+ · 80.000đ/HS trả góp
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCommissionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyCommissionBatch} className="space-y-4 mt-4">
              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                      <th className="py-2.5 px-3">Nhân viên KD / Kỹ thuật</th>
                      <th className="py-2.5 px-2 text-center">Máy iPhone</th>
                      <th className="py-2.5 px-2 text-center">Gói AppleCare+</th>
                      <th className="py-2.5 px-2 text-center">HS Trả góp</th>
                      <th className="py-2.5 px-3 text-right">Thành tiền hoa hồng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {retailStaff.map((emp, idx) => {
                      const val = commissionRows[emp.id] || {
                        iphoneCount: 10 + (idx % 5) * 2,
                        appleCareCount: 4 + (idx % 3),
                        installmentCount: 3 + (idx % 4),
                      };
                      const total =
                        val.iphoneCount * 150000 +
                        val.appleCareCount * 200000 +
                        val.installmentCount * 80000;
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-800">{emp.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {emp.code} · {emp.department}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              value={val.iphoneCount}
                              onChange={(e) =>
                                setCommissionRows((prev) => ({
                                  ...prev,
                                  [emp.id]: {
                                    ...val,
                                    iphoneCount: Number(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="w-16 px-2 py-1 text-center rounded-lg border border-slate-200 text-xs font-semibold"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              value={val.appleCareCount}
                              onChange={(e) =>
                                setCommissionRows((prev) => ({
                                  ...prev,
                                  [emp.id]: {
                                    ...val,
                                    appleCareCount: Number(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="w-16 px-2 py-1 text-center rounded-lg border border-slate-200 text-xs font-semibold"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min={0}
                              value={val.installmentCount}
                              onChange={(e) =>
                                setCommissionRows((prev) => ({
                                  ...prev,
                                  [emp.id]: {
                                    ...val,
                                    installmentCount: Number(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="w-16 px-2 py-1 text-center rounded-lg border border-slate-200 text-xs font-semibold"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700">
                            +{formatVND(total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCommissionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                >
                  Áp dụng hoa hồng vào Bảng lương
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Declare Base Salary Modal */}
      {isDeclareModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsDeclareModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Khai lương cơ bản &amp; phụ cấp
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Cập nhật mức lương cơ bản hợp đồng và phụ cấp cố định để hoàn tất Bước 3.
            </p>
            <form onSubmit={handleDeclareSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Chọn nhân sự
                </label>
                <select
                  value={declareEmpId}
                  onChange={(e) => setDeclareEmpId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50"
                >
                  {(missingSalaryEmps.length > 0 ? missingSalaryEmps : scopedEmployees).map(
                    (emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.code}) — Hiện tại:{' '}
                        {emp.baseSalary > 0 ? formatVND(emp.baseSalary) : 'Chưa khai'}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Mức lương cơ bản (VNĐ/tháng)
                </label>
                <input
                  type="number"
                  min={0}
                  value={declareAmount}
                  onChange={(e) =>
                    setDeclareAmount(Number(e.target.value) || 0)
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Phụ cấp cố định (VNĐ/tháng)
                </label>
                <input
                  type="number"
                  min={0}
                  value={declareAllowance}
                  onChange={(e) =>
                    setDeclareAllowance(Number(e.target.value) || 0)
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeclareModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  Lưu lương cơ bản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bonus & Deduction Modal */}
      {isBonusModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsBonusModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Thêm khoản Thưởng &amp; Khấu trừ kỳ {period}
            </h3>
            <form onSubmit={handleBonusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nhân viên
                </label>
                <select
                  value={bonusEmpId}
                  onChange={(e) => setBonusEmpId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50"
                >
                  {scopedEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Loại khoản
                  </label>
                  <select
                    value={bonusType}
                    onChange={(e) => setBonusType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="Thưởng">Thưởng (+)</option>
                    <option value="Khấu trừ">Khấu trừ (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Số tiền (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nội dung
                </label>
                <input
                  type="text"
                  required
                  value={bonusTitle}
                  onChange={(e) => setBonusTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBonusModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  Lưu khoản mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable PDF Payslip Modal */}
      {selectedPayslip && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPayslip(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-blue-100 font-semibold">
                  PHIẾU LƯƠNG CÁ NHÂN — CỬA HÀNG PHUONGHIHI (123 LÊ LỢI, Q.1)
                </div>
                <h3 className="text-base font-bold mt-0.5">
                  Kỳ lương {selectedPayslip.period}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              {(() => {
                const emp = scopedEmployees.find(
                  (e) => e.id === selectedPayslip.employeeId
                );
                return (
                  <div className="pb-3 border-b border-slate-100 flex justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900">
                        {emp?.name}
                      </div>
                      <div className="text-slate-500">
                        {emp?.code} · Phòng {emp?.department}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400">Công tính lương</div>
                      <div className="font-bold text-slate-800">
                        {selectedPayslip.actualDays + selectedPayslip.paidLeaveDays} /{' '}
                        {selectedPayslip.standardDays} ngày
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Lương cơ bản hợp đồng:</span>
                  <span className="font-semibold">
                    {selectedPayslip.baseSalary > 0
                      ? formatVND(selectedPayslip.baseSalary)
                      : 'Chưa khai lương (0 đ)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lương theo ngày công:</span>
                  <span className="font-semibold">
                    {formatVND(selectedPayslip.proRatedSalary)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phụ cấp cố định:</span>
                  <span className="font-semibold text-emerald-700">
                    +{formatVND(selectedPayslip.allowance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Lương làm thêm giờ ({selectedPayslip.otHours} giờ OT):
                  </span>
                  <span className="font-semibold text-emerald-700">
                    +{formatVND(selectedPayslip.otAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thưởng &amp; Hoa hồng bán iPhone:</span>
                  <span className="font-semibold text-emerald-700">
                    +{formatVND(selectedPayslip.bonus)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Khấu trừ đi muộn ({selectedPayslip.lateCount} lần ·{' '}
                    {selectedPayslip.lateMinutes} phút):
                  </span>
                  <span className="font-semibold text-rose-600">
                    -{formatVND(selectedPayslip.latePenaltyAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Khấu trừ khác &amp; Tạm ứng lương (EWA):
                  </span>
                  <span className="font-semibold text-rose-600">
                    -{formatVND(selectedPayslip.otherDeduction)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Bảo hiểm bắt buộc (BHXH/BHYT/BHTN):
                  </span>
                  <span className="font-semibold text-rose-600">
                    -{formatVND(selectedPayslip.insuranceAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thuế TNCN lũy tiến 7 bậc:</span>
                  <span className="font-semibold text-rose-600">
                    -{formatVND(selectedPayslip.taxAmount)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">
                  THỰC LĨNH CHUYỂN KHOẢN:
                </span>
                <span className="text-lg font-extrabold text-blue-600">
                  {formatVND(selectedPayslip.netSalary)}
                </span>
              </div>

              <div className="pt-4 flex flex-wrap justify-between gap-2">
                <button
                  onClick={() => {
                    const emp = scopedEmployees.find(
                      (e) => e.id === selectedPayslip.employeeId
                    );
                    addAuditLog(
                      'Phản hồi phiếu lương',
                      'Bảng lương',
                      `${emp?.name || selectedPayslip.employeeId} gửi yêu cầu đối soát phiếu lương kỳ ${selectedPayslip.period}`
                    );
                    showToast(
                      'Đã gửi phản hồi phiếu lương!',
                      `Bộ phận Kế toán & Nhân sự đã nhận yêu cầu đối soát kỳ ${selectedPayslip.period}.`
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  <MessageSquareWarning className="w-3.5 h-3.5 text-amber-600" />
                  <span>Gửi thắc mắc / Đối soát</span>
                </button>
                <button
                  onClick={() => {
                    const emp = scopedEmployees.find(
                      (e) => e.id === selectedPayslip.employeeId
                    );
                    exportPayslipToPDF(selectedPayslip, emp);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In / Xuất PDF Phiếu lương</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

