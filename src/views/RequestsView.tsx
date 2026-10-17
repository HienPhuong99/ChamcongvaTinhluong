import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  X,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { isDateInLeaveRange, useHRM } from '../context/HRMContext';
import { RequestType, ShiftCode } from '../types';
import {
  addDaysToIsoDate,
  calculateInclusiveDays,
  canApproveRequests,
  canManageHR,
  formatIsoToVN,
  formatVND,
  getInitials,
} from '../utils/helpers';

type RequestSubTab = 'mine' | 'pending' | 'calendar' | 'balance';

const DAY_NAMES_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function build14DayWindow(startIso: string) {
  return Array.from({ length: 14 }, (_, i) => {
    const iso = addDaysToIsoDate(startIso, i);
    const d = new Date(`${iso}T00:00:00`);
    const dow = d.getDay();
    return {
      iso,
      label: `${DAY_NAMES_SHORT[dow]} ${d.getDate()}/${d.getMonth() + 1}`,
      isSun: dow === 0,
    };
  });
}

export const RequestsView: React.FC = () => {
  const {
    employees,
    scopedEmployees,
    requests,
    leaveBalances,
    currentAccount,
    approveOrRejectRequest,
    createRequest,
    allocateAnnualLeave,
  } = useHRM();

  const canApprove = canApproveRequests(currentAccount.roleId);
  const canAllocateLeave = canManageHR(currentAccount.roleId);

  const [subTab, setSubTab] = useState<RequestSubTab>(
    canApprove ? 'pending' : 'mine'
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Đang chờ' | 'Đã duyệt' | 'Từ chối'>('ALL');
  const [calendarStartIso, setCalendarStartIso] = useState('2026-10-08');
  const [showAllBalances, setShowAllBalances] = useState(false);

  // New request modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newType, setNewType] = useState<RequestType>('Nghỉ phép năm');
  const [newEmpId, setNewEmpId] = useState<string>(currentAccount.employeeId);
  const [newStart, setNewStart] = useState('16/10/2026');
  const [newEnd, setNewEnd] = useState('17/10/2026');
  const [newReason, setNewReason] = useState('');
  const [newTargetShift, setNewTargetShift] = useState<ShiftCode>('sang');
  const [newSwapWithEmpId, setNewSwapWithEmpId] = useState<string>('');
  const [newAdvanceAmount, setNewAdvanceAmount] = useState<number>(3000000);
  const [newOtHours, setNewOtHours] = useState<number>(2);
  const [newCheckInTime, setNewCheckInTime] = useState<string>('08:00');
  const [newCheckOutTime, setNewCheckOutTime] = useState<string>('17:30');

  useEffect(() => {
    if (scopedEmployees.some((e) => e.id === currentAccount.employeeId)) {
      setNewEmpId(currentAccount.employeeId);
    } else if (scopedEmployees.length > 0) {
      setNewEmpId(scopedEmployees[0].id);
    }
  }, [currentAccount.employeeId, scopedEmployees]);

  const scopedRequests = useMemo(() => {
    const empSet = new Set(scopedEmployees.map((e) => e.id));
    return requests.filter((r) => empSet.has(r.employeeId));
  }, [requests, scopedEmployees]);

  const pendingCount = scopedRequests.filter((r) => r.status === 'Đang chờ').length;

  const myRequests = useMemo(
    () => requests.filter((r) => r.employeeId === currentAccount.employeeId),
    [requests, currentAccount.employeeId]
  );

  const displayedRequests = useMemo(() => {
    const base = subTab === 'mine' ? myRequests : scopedRequests;
    if (statusFilter === 'ALL') return base;
    return base.filter((r) => r.status === statusFilter);
  }, [subTab, myRequests, scopedRequests, statusFilter]);

  const unallocatedCount = useMemo(() => {
    const scopedSet = new Set(scopedEmployees.map((e) => e.id));
    return leaveBalances.filter(
      (lb) => scopedSet.has(lb.employeeId) && !lb.allocated
    ).length;
  }, [leaveBalances, scopedEmployees]);

  // Dynamic Company Leave Calendar items computed from requests
  const calendarDaysWithItems = useMemo(() => {
    const windowDays = build14DayWindow(calendarStartIso);
    const leaveAndTripReqs = scopedRequests.filter(
      (r) =>
        r.status !== 'Từ chối' &&
        (r.type === 'Nghỉ phép năm' || r.type === 'Nghỉ ốm' || r.type === 'Công tác')
    );

    return windowDays.map((day) => {
      const matching = leaveAndTripReqs
        .filter((r) => isDateInLeaveRange(day.iso, r.startDate, r.endDate))
        .map((r) => {
          const emp = employees.find((e) => e.id === r.employeeId);
          return {
            id: r.id,
            name: emp?.name || r.employeeId,
            type: r.type,
            status: r.status,
            color: r.type === 'Công tác' ? ('amber' as const) : ('emerald' as const),
          };
        });
      return {
        ...day,
        items: matching,
      };
    });
  }, [calendarStartIso, scopedRequests, employees]);

  const totalCalendarRequestsCount = useMemo(
    () =>
      scopedRequests.filter(
        (r) =>
          r.status !== 'Từ chối' &&
          (r.type === 'Nghỉ phép năm' || r.type === 'Nghỉ ốm' || r.type === 'Công tác')
      ).length,
    [scopedRequests]
  );

  const computedDaysPreview = useMemo(
    () => calculateInclusiveDays(newStart, newEnd),
    [newStart, newEnd]
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReason.trim()) return;
    const ok = createRequest({
      employeeId: newEmpId,
      type: newType,
      startDate: newStart,
      endDate:
        newType === 'Đổi ca trực' ||
        newType === 'Ứng lương nhanh' ||
        newType === 'Đăng ký tăng ca' ||
        newType === 'Bổ sung chấm công'
          ? newStart
          : newEnd,
      reason: newReason,
      days: computedDaysPreview,
      targetShiftCode: newType === 'Đổi ca trực' ? newTargetShift : undefined,
      swapWithEmployeeId:
        newType === 'Đổi ca trực' && newSwapWithEmpId ? newSwapWithEmpId : undefined,
      advanceAmount: newType === 'Ứng lương nhanh' ? newAdvanceAmount : undefined,
      otHours: newType === 'Đăng ký tăng ca' ? newOtHours : undefined,
      checkInTime: newType === 'Bổ sung chấm công' ? newCheckInTime : undefined,
      checkOutTime: newType === 'Bổ sung chấm công' ? newCheckOutTime : undefined,
    });
    if (ok) {
      setNewReason('');
      setIsNewModalOpen(false);
    }
  };

  const displayedBalanceEmps = showAllBalances
    ? scopedEmployees
    : scopedEmployees.slice(0, 20);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            PHUONGHIHI / CHẤM CÔNG
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Đơn từ</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gửi đơn và duyệt đơn theo luồng nhiều cấp.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo đơn mới</span>
        </button>
      </div>

      {/* 4 Sub-tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'mine' as const, label: `Đơn của tôi (${myRequests.length})` },
          {
            id: 'pending' as const,
            label: canApprove ? 'Danh sách duyệt đơn' : 'Đơn trong phạm vi',
            badge: pendingCount,
          },
          { id: 'calendar' as const, label: 'Lịch nghỉ công ty' },
          { id: 'balance' as const, label: 'Số dư phép' },
        ].map((t) => {
          const isActive = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{t.label}</span>
              {t.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1 & 2: Pending / My Requests Table */}
      {(subTab === 'pending' || subTab === 'mine') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'Đang chờ', 'Đã duyệt', 'Từ chối'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'Tất cả trạng thái' : st}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400">
              Hiển thị {displayedRequests.length} đơn từ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/50">
                  <th className="py-3.5 px-5">Loại đơn</th>
                  <th className="py-3.5 px-4">Nhân viên</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Lý do</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  {canApprove && (
                    <th className="py-3.5 px-5 text-right">Duyệt nhanh</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayedRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canApprove ? 6 : 5}
                      className="py-10 text-center text-slate-400"
                    >
                      Không có đơn từ nào trong mục này.
                    </td>
                  </tr>
                ) : (
                  displayedRequests.map((req) => {
                    const emp = employees.find((e) => e.id === req.employeeId);
                    const swapEmp = req.swapWithEmployeeId
                      ? employees.find((e) => e.id === req.swapWithEmployeeId)
                      : null;
                    const canApproveThisRow =
                      canApprove &&
                      req.status === 'Đang chờ' &&
                      (req.employeeId !== currentAccount.employeeId ||
                        currentAccount.roleId === 'super_admin');

                    return (
                      <tr
                        key={req.id}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          <div>{req.type}</div>
                          {req.type === 'Đổi ca trực' && req.targetShiftCode && (
                            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
                              🔄 Đổi sang ca: {req.targetShiftCode.toUpperCase()}
                              {swapEmp ? ` (với ${swapEmp.name})` : ''}
                            </span>
                          )}
                          {req.type === 'Ứng lương nhanh' && req.advanceAmount && (
                            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              💸 Tạm ứng: {req.advanceAmount.toLocaleString('vi-VN')} ₫
                            </span>
                          )}
                          {req.type === 'Đăng ký tăng ca' && req.otHours && (
                            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
                              ⏱️ Tăng ca: +{req.otHours} giờ
                            </span>
                          )}
                          {req.type === 'Bổ sung chấm công' && req.checkInTime && (
                            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono">
                              🕒 {req.checkInTime} - {req.checkOutTime || '17:30'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                emp?.avatarColor || 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {getInitials(emp?.name || 'NV')}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">
                                {emp?.name || req.employeeId}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {emp?.code || req.employeeId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">
                          <div>
                            {req.startDate} → {req.endDate}
                          </div>
                          {req.days && (
                            <div className="text-[10.5px] text-slate-400">
                              {req.days} ngày
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-md">
                          {req.reason}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              req.status === 'Đã duyệt'
                                ? 'bg-emerald-50 text-emerald-700'
                                : req.status === 'Từ chối'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        {canApprove && (
                          <td className="py-3.5 px-5 text-right">
                            {canApproveThisRow ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    approveOrRejectRequest(req.id, 'Đã duyệt')
                                  }
                                  title="Duyệt đơn một chạm"
                                  className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 flex items-center justify-center transition cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    approveOrRejectRequest(req.id, 'Từ chối')
                                  }
                                  title="Từ chối đơn"
                                  className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 flex items-center justify-center transition cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                {req.status === 'Đang chờ' ? 'Đơn cá nhân' : 'Đã xử lý'}
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Dynamic Company Leave Calendar */}
      {subTab === 'calendar' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Lịch nghỉ toàn công ty (Đồng bộ tự động từ đơn từ)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatIsoToVN(calendarStartIso)} -{' '}
                {formatIsoToVN(addDaysToIsoDate(calendarStartIso, 13))} ·{' '}
                {totalCalendarRequestsCount} đơn nghỉ phép, nghỉ ốm &amp; công tác trong phạm vi
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  setCalendarStartIso((prev) => addDaysToIsoDate(prev, -14))
                }
                title="14 ngày trước"
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCalendarStartIso('2026-10-08')}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                Hiện tại
              </button>
              <button
                onClick={() =>
                  setCalendarStartIso((prev) => addDaysToIsoDate(prev, 14))
                }
                title="14 ngày tiếp theo"
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {calendarDaysWithItems.map((day) => (
              <div
                key={day.iso}
                className="min-h-[115px] p-3 rounded-xl border border-slate-200/90 bg-slate-50/30 flex flex-col justify-between"
              >
                <div
                  className={`text-xs font-bold ${
                    day.isSun ? 'text-rose-600' : 'text-slate-700'
                  }`}
                >
                  {day.label}
                </div>
                <div className="space-y-1.5 mt-2">
                  {day.items.map((it) => (
                    <div
                      key={it.id}
                      className={`p-1.5 rounded-lg text-[11px] leading-tight border ${
                        it.color === 'amber'
                          ? 'bg-amber-50/80 border-amber-200 text-amber-800'
                          : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      <div className="font-bold truncate">{it.name}</div>
                      <div className="text-[10px] opacity-80">
                        {it.type} ({it.status})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Annual Leave Balances */}
      {subTab === 'balance' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Phép năm 2026
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mỗi năm 12 ngày, cứ 5 năm làm việc cộng thêm 1 ngày. Phép tồn
                chuyển tối đa 5 ngày.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50">
                <option value="2026">2026</option>
              </select>
              {canAllocateLeave && (
                <button
                  onClick={() => allocateAnnualLeave(2026)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cấp phép năm</span>
                </button>
              )}
            </div>
          </div>

          {unallocatedCount > 0 && (
            <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {unallocatedCount} người chưa được cấp phép năm 2026. Bấm{' '}
                  <strong>Cấp phép năm</strong> để tính và ghi số dư cho cả danh
                  sách.
                </span>
              </div>
              {canAllocateLeave && (
                <button
                  onClick={() => allocateAnnualLeave(2026)}
                  className="font-bold text-amber-800 underline shrink-0"
                >
                  Cấp ngay
                </button>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/50">
                  <th className="py-3 px-4">Nhân viên</th>
                  <th className="py-3 px-3 text-center">Phép năm</th>
                  <th className="py-3 px-3 text-center">
                    Chuyển từ năm trước
                  </th>
                  <th className="py-3 px-3 text-center">Đã dùng</th>
                  <th className="py-3 px-3 text-center">Đang chờ</th>
                  <th className="py-3 px-4 text-right">Còn lại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayedBalanceEmps.map((emp) => {
                  const lb = leaveBalances.find(
                    (b) => b.employeeId === emp.id
                  ) || {
                    annualQuota: 12,
                    carriedOver: 0,
                    used: 0,
                    pending: 0,
                    allocated: true,
                  };
                  const remaining =
                    lb.annualQuota + lb.carriedOver - lb.used - lb.pending;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {emp.name}{' '}
                        <span className="text-[11px] font-normal text-slate-400">
                          ({emp.code})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-slate-700">
                        {lb.annualQuota}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500">
                        {lb.carriedOver || '—'}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">
                        {lb.used}
                      </td>
                      <td className="py-3 px-3 text-center text-amber-600">
                        {lb.pending}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {remaining} ngày
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {scopedEmployees.length > 20 && (
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
              <span>
                Đang hiển thị <strong>{displayedBalanceEmps.length}</strong> /{' '}
                <strong>{scopedEmployees.length}</strong> nhân sự
              </span>
              <button
                onClick={() => setShowAllBalances((p) => !p)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
              >
                {showAllBalances
                  ? 'Thu gọn (20 dòng đầu)'
                  : `Xem toàn bộ ${scopedEmployees.length} nhân sự`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* New Request Modal */}
      {isNewModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsNewModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Tạo đơn từ mới
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nhân viên gửi đơn
                </label>
                <select
                  value={newEmpId}
                  onChange={(e) => setNewEmpId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50"
                >
                  {scopedEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Loại đơn
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as RequestType)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {[
                    'Nghỉ phép năm',
                    'Đổi ca trực',
                    'Ứng lương nhanh',
                    'Công tác',
                    'Nghỉ ốm',
                    'Đăng ký tăng ca',
                    'Bổ sung chấm công',
                    'Đi muộn / về sớm',
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              {newType === 'Đổi ca trực' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Ca muốn đổi sang
                    </label>
                    <select
                      value={newTargetShift}
                      onChange={(e) =>
                        setNewTargetShift(e.target.value as ShiftCode)
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-indigo-50/50 text-indigo-900"
                    >
                      <option value="sang">Ca Sáng (06:00 - 14:00)</option>
                      <option value="chieu">Ca Chiều (14:00 - 22:00)</option>
                      <option value="hanh_chinh">Hành chính (08:00 - 17:30)</option>
                      <option value="ca_gay">Ca gãy (08:00 - 21:00)</option>
                      <option value="dem">Ca Đêm (22:00 - 06:00)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Nhân viên đổi ca cùng (Tuỳ chọn)
                    </label>
                    <select
                      value={newSwapWithEmpId}
                      onChange={(e) => setNewSwapWithEmpId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    >
                      <option value="">-- Không đổi chéo (Chỉ đổi ca của tôi) --</option>
                      {employees
                        .filter((e) => e.id !== newEmpId && e.status !== 'Đã nghỉ')
                        .map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name} ({e.code} · {e.department})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
              {newType === 'Ứng lương nhanh' && (() => {
                const selectedEmpSalary = Math.max(
                  0,
                  Number(employees.find((e) => e.id === newEmpId)?.baseSalary) || 0
                );
                const maxAdvanceLimit =
                  selectedEmpSalary > 0 ? Math.round(selectedEmpSalary * 0.3) : 0;
                return (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Số tiền tạm ứng trước (Tối đa 30% lương cơ bản:{' '}
                      {formatVND(maxAdvanceLimit)})
                    </label>
                    {maxAdvanceLimit <= 0 ? (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
                        Nhân viên này chưa được khai lương cơ bản (0đ) nên hạn mức ứng lương là 0 ₫.
                      </div>
                    ) : (
                      <input
                        type="number"
                        step={500000}
                        min={0}
                        max={maxAdvanceLimit}
                        value={newAdvanceAmount}
                        onChange={(e) => setNewAdvanceAmount(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50/40 text-xs font-bold text-emerald-800"
                      />
                    )}
                  </div>
                );
              })()}
              {newType === 'Đăng ký tăng ca' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Số giờ tăng ca (OT)
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    min={0.5}
                    max={12}
                    value={newOtHours}
                    onChange={(e) => setNewOtHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
              )}
              {newType === 'Bổ sung chấm công' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Giờ vào thực tế
                    </label>
                    <input
                      type="time"
                      value={newCheckInTime}
                      onChange={(e) => setNewCheckInTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Giờ ra thực tế
                    </label>
                    <input
                      type="time"
                      value={newCheckOutTime}
                      onChange={(e) => setNewCheckOutTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Từ ngày (DD/MM/YYYY)
                  </label>
                  <input
                    type="text"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Đến ngày ({computedDaysPreview} ngày)
                  </label>
                  <input
                    type="text"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Lý do
                </label>
                <textarea
                  rows={3}
                  required
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  Gửi đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
