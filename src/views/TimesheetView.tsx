import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { exportToCSV, matchesSearch } from '../utils/helpers';

export const TimesheetView: React.FC = () => {
  const {
    scopedEmployees,
    timesheets,
    aggregateTimesheet,
    toggleConfirmTimesheet,
    lockTimesheetPeriod,
  } = useHRM();

  const [period, setPeriod] = useState<'2026-10' | '2026-09'>('2026-10');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [confirmFilter, setConfirmFilter] = useState<'ALL' | 'CONFIRMED' | 'PENDING'>('ALL');

  const rows = useMemo(() => {
    return scopedEmployees
      .filter((e) => e.status !== 'Đã nghỉ')
      .map((emp) => {
        const ts = timesheets.find(
          (t) => t.employeeId === emp.id && t.period === period
        ) || {
          employeeId: emp.id,
          period,
          standardDays: 22,
          actualDays: 20,
          paidLeaveDays: 1,
          absentDays: 0,
          lateCount: 1,
          lateMinutes: 10,
          otHours: 0,
          confirmed: true,
        };
        return { emp, ts };
      })
      .filter(({ emp, ts }) => {
        if (deptFilter !== 'ALL' && emp.department !== deptFilter) return false;
        if (confirmFilter === 'CONFIRMED' && !ts.confirmed) return false;
        if (confirmFilter === 'PENDING' && ts.confirmed) return false;
        if (
          searchQuery.trim() &&
          !matchesSearch(emp.name, searchQuery) &&
          !matchesSearch(emp.code, searchQuery)
        ) {
          return false;
        }
        return true;
      });
  }, [scopedEmployees, timesheets, period, deptFilter, confirmFilter, searchQuery]);

  const handleExportCSV = () => {
    exportToCSV(
      `BangCong_${period}.csv`,
      rows.map(({ emp, ts }) => ({
        'Mã NV': emp.code,
        'Nhân viên': emp.name,
        'Phòng ban': emp.department,
        'Công chuẩn': ts.standardDays,
        'Công thực tế': ts.actualDays,
        Phép: ts.paidLeaveDays,
        Vắng: ts.absentDays,
        'Đi muộn': `${ts.lateCount} lần · ${ts.lateMinutes} phút`,
        'OT (giờ)': ts.otHours,
        'Xác nhận': ts.confirmed ? 'Đã xác nhận' : 'Chờ xác nhận',
      }))
    );
  };

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header (Matches 00:44 in video) */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          PHUONGHIHI / LƯƠNG &amp; BÁO CÁO
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Bảng công</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tổng hợp công ngày, công tháng, điều chỉnh và chốt kỳ.
        </p>
      </div>

      {/* Period & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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
              {period === '2026-10' ? 'Tháng 10/2026' : 'Tháng 9/2026'}
            </span>
          </div>
          <button
            onClick={() => setPeriod('2026-10')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>
          <button
            onClick={() => lockTimesheetPeriod(period)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition"
          >
            <span>Chốt kỳ công</span>
          </button>
          <button
            onClick={() => aggregateTimesheet(period)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tổng hợp</span>
          </button>
        </div>
      </div>

      {/* Main Timesheet Card (Exact match to 00:44 - 00:47 in video) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhân viên..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            >
              <option value="ALL">Phòng ban</option>
              <option value="Nhân sự">Nhân sự</option>
              <option value="Kỹ thuật">Kỹ thuật</option>
              <option value="Kinh doanh">Kinh doanh</option>
              <option value="Kế toán">Kế toán</option>
              <option value="Marketing">Marketing</option>
              <option value="Vận hành">Vận hành</option>
            </select>

            <select
              value={confirmFilter}
              onChange={(e) => setConfirmFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
            >
              <option value="ALL">Xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="PENDING">Chờ xác nhận</option>
            </select>
          </div>
        </div>

        <div className="px-5 py-2 bg-slate-50/60 border-b border-slate-100 text-xs text-slate-500">
          {rows.length} người
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/40">
                <th className="py-3.5 px-5">Nhân viên</th>
                <th className="py-3.5 px-3 text-center">Công chuẩn</th>
                <th className="py-3.5 px-3 text-center">Công thực tế</th>
                <th className="py-3.5 px-3 text-center">Phép</th>
                <th className="py-3.5 px-3 text-center">Vắng</th>
                <th className="py-3.5 px-4">Đi muộn</th>
                <th className="py-3.5 px-3 text-center">OT</th>
                <th className="py-3.5 px-5 text-right">Xác nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {rows.map(({ emp, ts }) => (
                <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-5 font-semibold text-slate-900">
                    {emp.name}
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-600">
                    {ts.standardDays}
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-900">
                    {ts.actualDays}
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-600">
                    {ts.paidLeaveDays}
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-600">
                    {ts.absentDays}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {ts.lateCount} lần · {ts.lateMinutes} phút
                  </td>
                  <td className="py-3.5 px-3 text-center font-medium text-slate-700">
                    {ts.otHours} giờ
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => toggleConfirmTimesheet(emp.id, period)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                        ts.confirmed
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      {ts.confirmed ? 'Đã xác nhận' : 'Chờ xác nhận'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
