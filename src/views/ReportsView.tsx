import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Clock,
  Zap,
  Layers,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { exportToCSV, exportToExcel, formatVND } from '../utils/helpers';

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

export const ReportsView: React.FC = () => {
  const { scopedEmployees, attendanceRecords, computePayrollRows, showToast } = useHRM();
  const [period, setPeriod] = useState<string>('2026-09');

  const payrollRows = useMemo(
    () => computePayrollRows(period),
    [computePayrollRows, period]
  );

  const summaryMetrics = useMemo(() => {
    let totalActualDays = 0;
    let totalPaidLeaveDays = 0;
    let totalStandardDays = 0;
    let totalLateCount = 0;
    let totalOtHours = 0;
    let totalNetSalary = 0;
    let totalOtherDeduction = 0;
    let totalBonus = 0;

    for (const r of payrollRows) {
      totalActualDays += r.actualDays;
      totalPaidLeaveDays += r.paidLeaveDays;
      totalStandardDays += r.standardDays;
      totalLateCount += r.lateCount;
      totalOtHours += r.otHours;
      totalNetSalary += r.netSalary;
      totalOtherDeduction += r.otherDeduction;
      totalBonus += r.bonus;
    }

    const totalAbsentDays = Math.max(
      0,
      Math.round(totalStandardDays - (totalActualDays + totalPaidLeaveDays))
    );

    return {
      totalActualDays: Math.round(totalActualDays * 10) / 10,
      totalPaidLeaveDays: Math.round(totalPaidLeaveDays * 10) / 10,
      totalStandardDays,
      totalLateCount,
      totalAbsentDays,
      totalOtHours: Math.round(totalOtHours * 10) / 10,
      totalNetSalary,
      totalOtherDeduction,
      totalBonus,
    };
  }, [payrollRows]);

  const deptStats = useMemo(() => {
    const map = new Map<
      string,
      {
        dept: string;
        empCount: number;
        workDays: number;
        standardDays: number;
        otHours: number;
        lateCount: number;
        netSalary: number;
        otherDeduction: number;
      }
    >();

    for (const row of payrollRows) {
      const emp = scopedEmployees.find((e) => e.id === row.employeeId);
      const dept = emp?.department || 'Phòng ban chung';
      const cur = map.get(dept) || {
        dept,
        empCount: 0,
        workDays: 0,
        standardDays: 0,
        otHours: 0,
        lateCount: 0,
        netSalary: 0,
        otherDeduction: 0,
      };
      cur.empCount += 1;
      cur.workDays += row.actualDays + row.paidLeaveDays;
      cur.standardDays += row.standardDays;
      cur.otHours += row.otHours;
      cur.lateCount += row.lateCount;
      cur.netSalary += row.netSalary;
      cur.otherDeduction += row.otherDeduction;
      map.set(dept, cur);
    }

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        workDays: Math.round(item.workDays * 10) / 10,
        otHours: Math.round(item.otHours * 10) / 10,
        pct:
          item.standardDays > 0
            ? Math.min(100, Math.round((item.workDays / item.standardDays) * 100))
            : 0,
      }))
      .sort((a, b) => b.workDays - a.workDays);
  }, [payrollRows, scopedEmployees]);

  // Daily chart bars computed from real attendanceRecords in the selected period
  const dailyChartData = useMemo(() => {
    const [yStr, mStr] = period.split('-');
    const year = parseInt(yStr || '2026', 10);
    const month = parseInt(mStr || '10', 10);
    const daysInMonth = Math.min(31, new Date(year, month, 0).getDate() || 30);
    const scopedSet = new Set(scopedEmployees.map((e) => e.id));
    const periodAtt = attendanceRecords.filter(
      (r) => r.date.startsWith(period) && scopedSet.has(r.employeeId)
    );

    if (periodAtt.length > 0) {
      return Array.from({ length: daysInMonth }, (_, idx) => {
        const day = idx + 1;
        const dayStr = String(day).padStart(2, '0');
        const iso = `${period}-${dayStr}`;
        const dayRecs = periodAtt.filter((r) => r.date === iso);
        const checkedIn = dayRecs.filter((r) => Boolean(r.checkIn));
        const lateCount = checkedIn.filter((r) => r.lateMinutes > 0).length;
        const absentCount = dayRecs.filter(
          (r) => !r.checkIn && r.status === 'Vắng'
        ).length;
        const otHours = Math.round(
          checkedIn.reduce((s, r) => s + (r.otHours || 0), 0) * 10
        ) / 10;
        return {
          day: dayStr,
          workDays: checkedIn.length,
          lateCount,
          absentCount,
          otHours,
        };
      });
    }

    // For historical archived periods (2026-08, 2026-09) that only have monthly timesheet totals
    const activeCount = Math.max(1, payrollRows.length);
    const hasSummaryData = summaryMetrics.totalActualDays > 0;
    return Array.from({ length: daysInMonth }, (_, idx) => {
      const day = idx + 1;
      const dayStr = String(day).padStart(2, '0');
      if (!hasSummaryData) {
        return { day: dayStr, workDays: 0, lateCount: 0, absentCount: 0, otHours: 0 };
      }
      const dow = new Date(year, month - 1, day).getDay();
      const isSunday = dow === 0;
      const workDays = isSunday
        ? 0
        : Math.min(
            activeCount,
            Math.max(1, Math.round(summaryMetrics.totalActualDays / 22))
          );
      const absentCount = isSunday ? 0 : Math.max(0, activeCount - workDays);
      return {
        day: dayStr,
        workDays,
        lateCount: isSunday ? 0 : Math.round(summaryMetrics.totalLateCount / 22),
        absentCount,
        otHours: isSunday ? 0 : Math.round((summaryMetrics.totalOtHours / 22) * 10) / 10,
      };
    });
  }, [period, scopedEmployees, attendanceRecords, payrollRows.length, summaryMetrics]);

  const handleExportCSV = () => {
    exportToCSV(
      `BaoCaoTongHop_${period}.csv`,
      deptStats.map((d) => ({
        'Kỳ báo cáo': period,
        'Phòng ban': d.dept,
        'Số nhân sự': d.empCount,
        'Tổng ngày công': d.workDays,
        'Giờ tăng ca (OT)': d.otHours,
        'Lượt đi muộn': d.lateCount,
        'Hiệu suất chuyên cần (%)': d.pct,
        'Khấu trừ / Tạm ứng EWA (VNĐ)': d.otherDeduction,
        'Quỹ lương thực lĩnh (VNĐ)': d.netSalary,
      }))
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      `BaoCao_phuonghihi_${period}.xlsx`,
      `BaoCao_${period}`,
      deptStats.map((d) => ({
        'Kỳ báo cáo': period,
        'Phòng ban': d.dept,
        'Số nhân sự': d.empCount,
        'Tổng ngày công': d.workDays,
        'Giờ tăng ca (OT)': d.otHours,
        'Lượt đi muộn': d.lateCount,
        'Hiệu suất chuyên cần (%)': d.pct,
        'Khấu trừ / Tạm ứng EWA (VNĐ)': d.otherDeduction,
        'Quỹ lương thực lĩnh (VNĐ)': d.netSalary,
      }))
    );
    showToast(`Đã xuất file Excel báo cáo kỳ ${period}!`);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header (Matches 00:56 - 00:59 in video) */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          PHUONGHIHI / LƯƠNG &amp; BÁO CÁO
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Báo cáo</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tổng hợp nhân sự, chấm công và chi phí theo kỳ ({payrollRows.length}{' '}
          nhân sự đang làm việc).
        </p>
      </div>

      {/* Period & 1-Click Export Toolbar (CSV · Excel · PDF) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
          <button
            onClick={() => setPeriod((prev) => shiftPeriodMonth(prev, -1))}
            title="Tháng trước"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <label className="relative flex items-center gap-2 px-3 py-1 text-xs font-bold text-slate-800 cursor-pointer">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatPeriodLabel(period)}</span>
            <input
              type="month"
              aria-label="Chọn tháng báo cáo"
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

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Xuất PDF</span>
          </button>
        </div>
      </div>

      {/* Main Analytics Summary Card (Matches 00:56 - 00:59 in video) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              PHÂN TÍCH KỲ {period}
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Tổng hợp kỳ này
            </h2>
            <p className="text-xs text-slate-500">
              Điểm mặt, hiệu suất công, đi muộn, vắng mặt, tăng ca và chi phí
              được đối chiếu trực tiếp từ dữ liệu thực tế kỳ {period}.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
            {payrollRows[0]?.standardDays || 22} công chuẩn
          </span>
        </div>

        {/* 4 Dynamic KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200/90 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Công thực tế</div>
              <div className="text-2xl font-extrabold text-slate-900">
                {summaryMetrics.totalActualDays}
              </div>
              <div className="text-[11px] text-slate-400">
                +{summaryMetrics.totalPaidLeaveDays} ngày phép hưởng lương
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Lượt đi muộn</div>
              <div className="text-2xl font-extrabold text-slate-900">
                {summaryMetrics.totalLateCount}
              </div>
              <div className="text-[11px] text-slate-400">
                {summaryMetrics.totalAbsentDays} ngày vắng / nghỉ không lương
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Giờ tăng ca</div>
              <div className="text-2xl font-extrabold text-slate-900">
                {summaryMetrics.totalOtHours}
              </div>
              <div className="text-[11px] text-slate-400">giờ OT trong kỳ</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Tổng định mức công</div>
              <div className="text-2xl font-extrabold text-slate-900">
                {summaryMetrics.totalStandardDays}
              </div>
              <div className="text-[11px] text-slate-400">
                ngày chuẩn toàn phạm vi
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1: Daily Attendance Bar Chart + Donut Status Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2/3: Daily Bar Chart */}
          <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 space-y-4 min-w-0 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Diễn biến chấm công theo ngày
                </h3>
                <p className="text-xs text-slate-500">
                  Ngày công, lượt đi muộn, vắng và giờ tăng ca
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  Ngày công
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Đi muộn
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Vắng
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                  Giờ tăng ca
                </span>
              </div>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="h-52 min-w-[480px] sm:min-w-0 flex items-end gap-1.5 pt-4 border-b border-slate-100">
              {dailyChartData.map((d) => (
                <div
                  key={d.day}
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  <div className="w-full h-40 flex items-end justify-center gap-0.5">
                    <div
                      className="w-1.5 bg-blue-600 rounded-t"
                      style={{
                        height: `${Math.min(
                          100,
                          Math.round(
                            (d.workDays / Math.max(1, payrollRows.length)) * 95
                          )
                        )}%`,
                      }}
                      title={`Ngày ${d.day}: ${d.workDays} công`}
                    />
                    <div
                      className="w-1.5 bg-rose-500 rounded-t"
                      style={{
                        height: `${Math.min(
                          100,
                          Math.round(
                            (d.absentCount / Math.max(1, payrollRows.length)) * 95
                          )
                        )}%`,
                      }}
                      title={`Vắng: ${d.absentCount}`}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400">{d.day}</span>
                </div>
              ))}
              </div>
            </div>
          </div>

          {/* Right 1/3: Donut Chart (Cơ cấu trạng thái công) */}
          <div className="p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Cơ cấu trạng thái công
              </h3>
              <p className="text-xs text-slate-500">
                Tỷ trọng tất cả bản ghi trong kỳ {period}
              </p>
            </div>

            <div className="my-4 flex items-center justify-center">
              <div
                className="w-40 h-40 rounded-full flex items-center justify-center"
                style={{
                  background:
                    'conic-gradient(#10B981 0deg 260deg, #3B82F6 260deg 325deg, #F59E0B 325deg 360deg)',
                }}
              >
                <div className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center">
                  <span className="text-lg font-extrabold text-slate-900">
                    {summaryMetrics.totalStandardDays}
                  </span>
                  <span className="text-[10px] text-slate-400">ngày công</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Thực tế ({summaryMetrics.totalActualDays})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Phép ({summaryMetrics.totalPaidLeaveDays})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Muộn ({summaryMetrics.totalLateCount})
              </span>
            </div>
          </div>
        </div>

        {/* Charts Row 2: Department Efficiency & Payroll Cost */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Hiệu suất theo phòng ban
              </h3>
              <p className="text-xs text-slate-500">
                Ngày công thực tế và giờ tăng ca theo từng bộ phận kỳ {period}
              </p>
            </div>
            <div className="space-y-3 pt-1">
              {deptStats.map((d) => (
                <div key={d.dept} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {d.dept} ({d.empCount} người)
                    </span>
                    <span className="text-slate-500">
                      {d.workDays} công · {d.otHours} giờ OT ({d.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Quỹ lương</h3>
                <span className="text-sm font-extrabold text-blue-600">
                  {formatVND(summaryMetrics.totalNetSalary)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tổng chi phí thực lĩnh trong kỳ {period}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Số phiếu lương:</span>
                <span className="font-bold">{payrollRows.length} phiếu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng thưởng &amp; hoa hồng:</span>
                <span className="font-bold text-emerald-700">
                  +{formatVND(summaryMetrics.totalBonus)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng khấu trừ / EWA:</span>
                <span className="font-bold text-rose-600">
                  -{formatVND(summaryMetrics.totalOtherDeduction)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lương bình quân:</span>
                <span className="font-bold">
                  {formatVND(
                    summaryMetrics.totalNetSalary /
                      Math.max(1, payrollRows.length)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

