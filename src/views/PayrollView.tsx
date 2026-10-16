import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { PayrollRow } from '../types';
import { exportToCSV, exportToExcel, formatVND } from '../utils/helpers';

export const PayrollView: React.FC = () => {
  const {
    scopedEmployees,
    payrollPeriods,
    computePayrollRows,
    declareBaseSalary,
    calculatePayrollForPeriod,
    publishPayslipsForPeriod,
    toggleLockPayrollPeriod,
    addBonusDeduction,
    setActiveTab,
  } = useHRM();

  const [period, setPeriod] = useState<'2026-09' | '2026-10'>('2026-09');
  const [isDeclareModalOpen, setIsDeclareModalOpen] = useState(false);
  const [declareAmount, setDeclareAmount] = useState(28000000);
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [bonusEmpId, setBonusEmpId] = useState('NV0001');
  const [bonusType, setBonusType] = useState<'Thưởng' | 'Khấu trừ'>('Thưởng');
  const [bonusTitle, setBonusTitle] = useState('Thưởng hiệu suất công việc tháng');
  const [bonusAmount, setBonusAmount] = useState(1500000);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRow | null>(null);

  const periodState = useMemo(
    () =>
      payrollPeriods.find((p) => p.period === period) || {
        period,
        step1TimesheetAggregated: true,
        step2TimesheetLocked: true,
        step3SalariesDeclared: false,
        step4PayrollCalculated: true,
        step5PayslipsPublished: true,
        locked: false,
      },
    [payrollPeriods, period]
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
          'BHXH (10.5%)': row.insuranceAmount,
          'Thuế TNCN': row.taxAmount,
          'Thực lĩnh': row.netSalary,
        };
      })
    );
  };

  const handleDeclareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = missingSalaryEmps[0];
    if (targetEmp) {
      declareBaseSalary(targetEmp.id, declareAmount, 3000000);
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

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header (Matches 00:48 in video) */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          PHUONGHIHI / LƯƠNG &amp; BÁO CÁO
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Bảng lương</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Lương theo công, bảo hiểm, thuế và phiếu lương.
        </p>
      </div>

      {/* Top Toolbar (Matches 00:48 - 00:51 in video) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              onClick={() => setPeriod('2026-09')}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1 text-xs font-bold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {period === '2026-09' ? 'Tháng 9/2026' : 'Tháng 10/2026'}
              </span>
            </div>
            <button
              onClick={() => setPeriod('2026-10')}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => toggleLockPayrollPeriod(period)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition shadow-2xs ${
              periodState.locked
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {periodState.locked ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Mở khoá bảng lương</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Khoá bảng lương</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Cấu hình lương</span>
          </button>
          <button
            onClick={() => calculatePayrollForPeriod(period)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Tính lương</span>
          </button>
        </div>
      </div>

      {/* 5-Step Payroll Workflow Card (Exact match to 00:49 - 00:52 in video) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Làm lương kỳ {period}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Làm lần lượt theo đúng 5 bước. Bước nào chưa xong thì nói rõ còn
              thiếu gì.
            </p>
          </div>
          <button
            onClick={() => calculatePayrollForPeriod(period)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Kiểm tra lại</span>
          </button>
        </div>

        {/* 5 Steps List */}
        <div className="space-y-2.5">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Tổng hợp bảng công tháng
                </div>
                <div className="text-[11px] text-slate-500">
                  {payrollRows.length} / {payrollRows.length} đã xong
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
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Chốt kỳ công
                </div>
                <div className="text-[11px] text-slate-500">
                  Nên chốt kỳ công trước khi tính lương, để công không đổi sau
                  lưng bảng lương.
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
                    ? `${missingSalaryEmps.length} người chưa có lương cơ bản: ${missingSalaryEmps
                        .map((e) => e.name)
                        .join(', ')}`
                    : `Tất cả ${payrollRows.length} nhân sự đã có lương cơ bản`}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsDeclareModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700"
            >
              Khai lương
            </button>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Tính bảng lương
                </div>
                <div className="text-[11px] text-slate-500">
                  {payrollRows.length} / {payrollRows.length} đã tính
                </div>
              </div>
            </div>
            <button
              onClick={() => calculatePayrollForPeriod(period)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              Tính lương
            </button>
          </div>

          {/* Step 5 */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
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
            <button
              onClick={() => publishPayslipsForPeriod(period)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              Chốt kỳ
            </button>
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
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsBonusModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thưởng &amp; khấu trừ</span>
            </button>
            <button
              onClick={() => publishPayslipsForPeriod(period)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Phát hành phiếu lương</span>
            </button>
          </div>
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
                <th className="py-3 px-3 text-right">BHXH + Thuế</th>
                <th className="py-3 px-4 text-right">Thực lĩnh</th>
                <th className="py-3 px-4 text-right">Phiếu lương</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {payrollRows.slice(0, 20).map((row) => {
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
                        <span className="text-amber-600 font-semibold">
                          Chưa khai
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
      </div>

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
              Khai lương cơ bản còn thiếu
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Cập nhật mức lương cơ bản cho{' '}
              <strong>{missingSalaryEmps[0]?.name || 'Quản lý cửa hàng (phuonghihi)'}</strong>{' '}
              để hoàn tất Bước 3.
            </p>
            <form onSubmit={handleDeclareSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Mức lương cơ bản (VNĐ/tháng)
                </label>
                <input
                  type="number"
                  value={declareAmount}
                  onChange={(e) =>
                    setDeclareAmount(Number(e.target.value) || 25000000)
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
                    {formatVND(selectedPayslip.baseSalary || 25000000)}
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
                  <span className="text-slate-500">Thưởng trong kỳ:</span>
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
                    Bảo hiểm bắt buộc (BHXH/BHYT/BHTN 10.5%):
                  </span>
                  <span className="font-semibold text-rose-600">
                    -{formatVND(selectedPayslip.insuranceAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thuế TNCN tạm khấu trừ:</span>
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

              <div className="pt-4 flex justify-end gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
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
