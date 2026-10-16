import React, { useState } from 'react';
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

export const ReportsView: React.FC = () => {
  const { scopedEmployees, computePayrollRows, showToast } = useHRM();
  const [period, setPeriod] = useState<'2026-09' | '2026-08'>('2026-09');

  const payrollRows = computePayrollRows(period);
  const totalNetSalary = payrollRows.reduce((s, r) => s + r.netSalary, 0);

  // Daily chart bars (Days 01..29 matching 00:56 - 00:59 in video)
  const dailyChartData = Array.from({ length: 29 }, (_, idx) => {
    const day = idx + 1;
    const isSunday = day % 7 === 0;
    return {
      day: String(day).padStart(2, '0'),
      workDays: isSunday ? 4 : 38 + (day % 8),
      lateCount: isSunday ? 0 : (day % 5) + 1,
      absentCount: isSunday ? 42 : 4 + (day % 3),
      otHours: day % 4 === 0 ? 5 : 2,
    };
  });

  const deptStats = [
    { dept: 'Kỹ thuật', workDays: 142, otHours: 18, pct: 88 },
    { dept: 'Kinh doanh', workDays: 118, otHours: 12, pct: 82 },
    { dept: 'Nhân sự', workDays: 76, otHours: 5, pct: 92 },
    { dept: 'Marketing', workDays: 68, otHours: 4, pct: 79 },
    { dept: 'Vận hành', workDays: 55, otHours: 4, pct: 75 },
    { dept: 'Kế toán', workDays: 40, otHours: 0, pct: 95 },
  ];

  const handleExportCSV = () => {
    exportToCSV(
      `BaoCaoTongHop_${period}.csv`,
      deptStats.map((d) => ({
        'Kỳ báo cáo': period,
        'Phòng ban': d.dept,
        'Tổng ngày công': d.workDays,
        'Giờ tăng ca (OT)': d.otHours,
        'Hiệu suất chuyên cần (%)': d.pct,
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
        'Tổng ngày công': d.workDays,
        'Giờ tăng ca (OT)': d.otHours,
        'Hiệu suất chuyên cần (%)': d.pct,
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
          Tổng hợp nhân sự, chấm công và chi phí theo kỳ ({scopedEmployees.length}{' '}
          nhân sự).
        </p>
      </div>

      {/* Period & 1-Click Export Toolbar (CSV · Excel · PDF) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
          <button
            onClick={() => setPeriod('2026-08')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1 text-xs font-bold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {period === '2026-09' ? 'Tháng 9/2026' : 'Tháng 8/2026'}
            </span>
          </div>
          <button
            onClick={() => setPeriod('2026-09')}
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
              được đối chiếu cùng kỳ.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
            29 ngày
          </span>
        </div>

        {/* 4 KPI Cards (499 / 67 / 43 / 524) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200/90 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Công thực tế</div>
              <div className="text-2xl font-extrabold text-slate-900">499</div>
              <div className="text-[11px] text-slate-400">kỳ {period}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Lượt đi muộn</div>
              <div className="text-2xl font-extrabold text-slate-900">67</div>
              <div className="text-[11px] text-slate-400">840 lượt vắng</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Giờ tăng ca</div>
              <div className="text-2xl font-extrabold text-slate-900">43</div>
              <div className="text-[11px] text-slate-400">giờ trong kỳ</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Phiên hiện tại</div>
              <div className="text-2xl font-extrabold text-slate-900">524</div>
              <div className="text-[11px] text-slate-400">
                ngày toàn phạm vi
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1: Daily Attendance Bar Chart + Donut Status Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2/3: Daily Bar Chart */}
          <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Diễn biến chấm công theo ngày
                </h3>
                <p className="text-xs text-slate-500">
                  Ngày công, lượt đi muộn, vắng và giờ tăng ca
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
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

            <div className="h-52 flex items-end gap-1.5 pt-4 border-b border-slate-100">
              {dailyChartData.map((d) => (
                <div
                  key={d.day}
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  <div className="w-full h-40 flex items-end justify-center gap-0.5">
                    <div
                      className="w-1.5 bg-blue-600 rounded-t"
                      style={{ height: `${Math.min(100, d.workDays * 2)}%` }}
                      title={`Ngày ${d.day}: ${d.workDays} công`}
                    />
                    <div
                      className="w-1.5 bg-rose-500 rounded-t"
                      style={{ height: `${Math.min(100, d.absentCount * 2)}%` }}
                      title={`Vắng: ${d.absentCount}`}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right 1/3: Donut Chart (Cơ cấu trạng thái công) */}
          <div className="p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Cơ cấu trạng thái công
              </h3>
              <p className="text-xs text-slate-500">
                Tỷ trọng tất cả bản ghi trong kỳ
              </p>
            </div>

            <div className="my-4 flex items-center justify-center">
              <div
                className="w-40 h-40 rounded-full flex items-center justify-center"
                style={{
                  background:
                    'conic-gradient(#10B981 0deg 230deg, #3B82F6 230deg 325deg, #F59E0B 325deg 360deg)',
                }}
              >
                <div className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center">
                  <span className="text-lg font-extrabold text-slate-900">
                    524
                  </span>
                  <span className="text-[10px] text-slate-400">bản ghi</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Đúng giờ
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Vắng
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Nghỉ phép
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
                Ngày công và giờ tăng ca theo bộ phận
              </p>
            </div>
            <div className="space-y-3 pt-1">
              {deptStats.map((d) => (
                <div key={d.dept} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {d.dept}
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
                  {formatVND(totalNetSalary)}
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
                <span className="text-slate-500">Lương bình quân:</span>
                <span className="font-bold">
                  {formatVND(
                    totalNetSalary / Math.max(1, payrollRows.length)
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
