import React from 'react';
import {
  Users,
  CalendarClock,
  UserCheck,
  FileText,
  Wallet,
  Smartphone,
  Pin,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { formatVND } from '../utils/helpers';

export const DashboardView: React.FC = () => {
  const {
    scopedEmployees,
    attendanceRecords,
    requests,
    announcements,
    computePayrollRows,
    setActiveTab,
    approveOrRejectRequest,
  } = useHRM();

  const activeEmps = scopedEmployees.filter((e) => e.status !== 'Đã nghỉ');
  const pendingRequests = requests.filter((r) => r.status === 'Đang chờ');
  const uncheckedToday = attendanceRecords.filter(
    (r) => r.status === 'Chưa chấm'
  ).length;
  const payrollSep = computePayrollRows('2026-09');
  const totalNet = payrollSep.reduce((sum, r) => sum + r.netSalary, 0);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            PHUONGHIHI / TỔNG QUAN
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Bảng điều khiển quản trị
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng quan nhân sự, chấm công hôm nay, đơn chờ duyệt và quỹ lương
            công ty.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('mobile_app')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>Mở App Chấm Công Điện Thoại</span>
          </button>
          <button
            onClick={() => setActiveTab('shifts')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
          >
            <CalendarClock className="w-4 h-4 text-blue-600" />
            <span>Xếp ca nhanh</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('employees')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-blue-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Nhân sự trong phạm vi
            </span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {scopedEmployees.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {activeEmps.length} đang làm việc · Bấm xem hồ sơ
          </div>
        </div>

        <div
          onClick={() => setActiveTab('attendance')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-blue-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Chưa chấm công hôm nay
            </span>
            <UserCheck className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-2">
            {uncheckedToday}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Bấm để mở Điểm danh &amp; gửi nhắc 1 nút
          </div>
        </div>

        <div
          onClick={() => setActiveTab('requests')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-blue-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Đơn từ chờ tôi duyệt
            </span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">
            {pendingRequests.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Công tác, nghỉ phép, tăng ca, bổ sung công
          </div>
        </div>

        <div
          onClick={() => setActiveTab('payroll')}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-blue-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Quỹ lương thực lĩnh (2026-09)
            </span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatVND(totalNet)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {payrollSep.length} phiếu lương đã tính tự động
          </div>
        </div>
      </div>

      {/* Two Column Section: Pending Requests + Internal Bulletin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests Quick Approve */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Đơn từ chờ duyệt ({pendingRequests.length})
              </h2>
              <p className="text-xs text-slate-500">
                Duyệt nhanh một chạm ngay trên bảng điều khiển
              </p>
            </div>
            <button
              onClick={() => setActiveTab('requests')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingRequests.slice(0, 5).map((req) => {
              const emp = scopedEmployees.find((e) => e.id === req.employeeId);
              return (
                <div
                  key={req.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900">
                      {req.type} · {emp?.name || req.employeeId}
                    </div>
                    <div className="text-slate-500 truncate mt-0.5">
                      {req.startDate} · {req.reason}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => approveOrRejectRequest(req.id, 'Đã duyệt')}
                      className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 flex items-center justify-center transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => approveOrRejectRequest(req.id, 'Từ chối')}
                      className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 flex items-center justify-center transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pinned Announcements */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Bản tin nội bộ mới nhất
              </h2>
              <p className="text-xs text-slate-500">
                Thông báo ghim cho toàn công ty
              </p>
            </div>
            <button
              onClick={() => setActiveTab('news')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
            >
              <span>Mở bản tin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {announcements.slice(0, 3).map((ann) => (
              <div
                key={ann.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    {ann.title}
                  </span>
                  {ann.pinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                      <Pin className="w-2.5 h-2.5" />
                      Ghim
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
