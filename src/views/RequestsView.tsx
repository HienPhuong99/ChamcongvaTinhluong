import React, { useMemo, useState } from 'react';
import {
  Check,
  X,
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { RequestType } from '../types';
import { getInitials } from '../utils/helpers';

type RequestSubTab = 'mine' | 'pending' | 'calendar' | 'balance';

export const RequestsView: React.FC = () => {
  const {
    scopedEmployees,
    requests,
    leaveBalances,
    currentAccount,
    approveOrRejectRequest,
    createRequest,
    allocateAnnualLeave,
  } = useHRM();

  const [subTab, setSubTab] = useState<RequestSubTab>('pending');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newType, setNewType] = useState<RequestType>('Nghỉ phép năm');
  const [newEmpId, setNewEmpId] = useState<string>('NV0009');
  const [newStart, setNewStart] = useState('12/10/2026');
  const [newEnd, setNewEnd] = useState('13/10/2026');
  const [newReason, setNewReason] = useState('');

  const scopedRequests = useMemo(() => {
    const empSet = new Set(scopedEmployees.map((e) => e.id));
    return requests.filter((r) => empSet.has(r.employeeId));
  }, [requests, scopedEmployees]);

  const pendingCount = scopedRequests.filter((r) => r.status === 'Đang chờ').length;

  const myRequests = useMemo(
    () =>
      scopedRequests.filter(
        (r) =>
          r.employeeId === currentAccount.employeeId ||
          r.employeeId === 'NV0009' ||
          r.employeeId === 'NV0001'
      ),
    [scopedRequests, currentAccount.employeeId]
  );

  const unallocatedCount = useMemo(
    () => leaveBalances.filter((lb) => !lb.allocated).length,
    [leaveBalances]
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReason.trim()) return;
    createRequest({
      employeeId: newEmpId,
      type: newType,
      startDate: newStart,
      endDate: newEnd,
      reason: newReason,
      days: 1,
    });
    setNewReason('');
    setIsNewModalOpen(false);
  };

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header (Matches 00:27 in video) */}
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

      {/* 4 Sub-tabs (Exact match to 00:27 - 00:34 in video) */}
      <div className="flex items-center gap-6 border-b border-slate-200">
        {[
          { id: 'mine' as const, label: 'Đơn của tôi' },
          {
            id: 'pending' as const,
            label: 'Chờ tôi duyệt',
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
              className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
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

      {/* Tab 1 & 2: Pending / My Requests Table (Matches 00:27 - 00:30 in video) */}
      {(subTab === 'pending' || subTab === 'mine') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/50">
                  <th className="py-3.5 px-5">Loại đơn</th>
                  <th className="py-3.5 px-4">Nhân viên</th>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Lý do</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-5 text-right">Duyệt nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {(subTab === 'pending' ? scopedRequests : myRequests).map(
                  (req) => {
                    const emp = scopedEmployees.find(
                      (e) => e.id === req.employeeId
                    );
                    return (
                      <tr
                        key={req.id}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          {req.type}
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
                          {req.startDate} → {req.endDate}
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
                        <td className="py-3.5 px-5 text-right">
                          {req.status === 'Đang chờ' ? (
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
                              Đã xử lý
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Company Leave Calendar (Lịch nghỉ công ty - Matches 00:33 - 00:34 in video) */}
      {subTab === 'calendar' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Lịch nghỉ toàn công ty
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                01/10/2026 - 01/11/2026 · 3 đơn nghỉ &amp; công tác trong tháng
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2.5">
            {[
              { label: 'T5 8', items: [] },
              {
                label: 'T6 9',
                items: [
                  { name: 'Trần Quang An 32', type: 'Công tác', color: 'amber' },
                ],
              },
              {
                label: 'T7 10',
                items: [
                  { name: 'Trần Quang An 32', type: 'Công tác', color: 'amber' },
                  {
                    name: 'Phạm Quang An 34',
                    type: 'Nghỉ phép năm',
                    color: 'emerald',
                  },
                ],
              },
              {
                label: 'CN 11',
                isSun: true,
                items: [
                  {
                    name: 'Phạm Quang An 34',
                    type: 'Nghỉ phép năm',
                    color: 'emerald',
                  },
                ],
              },
              { label: 'T2 12', items: [] },
              { label: 'T3 13', items: [] },
              { label: 'T4 14', items: [] },
              {
                label: 'T5 15',
                items: [
                  { name: 'Lê Ngọc Mai', type: 'Nghỉ phép năm', color: 'emerald' },
                ],
              },
              { label: 'T6 16', items: [] },
              { label: 'T7 17', items: [] },
              { label: 'CN 18', isSun: true, items: [] },
              { label: 'T2 19', items: [] },
              { label: 'T3 20', items: [] },
              { label: 'T4 21', items: [] },
            ].map((day, idx) => (
              <div
                key={idx}
                className="min-h-[110px] p-3 rounded-xl border border-slate-200/90 bg-slate-50/30 flex flex-col justify-between"
              >
                <div
                  className={`text-xs font-bold ${
                    day.isSun ? 'text-rose-600' : 'text-slate-700'
                  }`}
                >
                  {day.label}
                </div>
                <div className="space-y-1.5 mt-2">
                  {day.items.map((it, i) => (
                    <div
                      key={i}
                      className={`p-1.5 rounded-lg text-[11px] leading-tight border ${
                        it.color === 'amber'
                          ? 'bg-amber-50/80 border-amber-200 text-amber-800'
                          : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      <div className="font-bold truncate">{it.name}</div>
                      <div className="text-[10px] opacity-80">{it.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Annual Leave Balances (Số dư phép - Matches 00:31 - 00:32 in video) */}
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
              <button
                onClick={() => allocateAnnualLeave(2026)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cấp phép năm</span>
              </button>
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
              <button
                onClick={() => allocateAnnualLeave(2026)}
                className="font-bold text-amber-800 underline shrink-0"
              >
                Cấp ngay
              </button>
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
                {scopedEmployees.slice(0, 18).map((emp) => {
                  const lb = leaveBalances.find(
                    (b) => b.employeeId === emp.id
                  ) || {
                    annualQuota: 12,
                    carriedOver: 1,
                    used: 2,
                    pending: 0,
                  };
                  const remaining =
                    lb.annualQuota + lb.carriedOver - lb.used - lb.pending;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {emp.name}
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
        </div>
      )}

      {/* New Request Modal */}
      {isNewModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsNewModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6"
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Từ ngày
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
                    Đến ngày
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
