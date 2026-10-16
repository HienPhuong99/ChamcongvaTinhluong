import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  ShieldCheck,
  X,
  Trash2,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { ROLE_DEFINITIONS } from '../data/seedData';
import { DepartmentName, RoleId } from '../types';
import { canManageSettings, getInitials, matchesSearch } from '../utils/helpers';

export const PermissionsView: React.FC = () => {
  const {
    accounts,
    currentAccount,
    switchAccount,
    addAccount,
    deleteAccount,
    toggleAccountStatus,
    employees,
  } = useHRM();

  const [expandedRoleId, setExpandedRoleId] = useState<RoleId | null>(null);
  const [searchAcc, setSearchAcc] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isNewAccModalOpen, setIsNewAccModalOpen] = useState(false);
  const [newEmpId, setNewEmpId] = useState('NV0002');
  const [newRoleId, setNewRoleId] = useState<RoleId>('manager');
  const [newDept, setNewDept] = useState<DepartmentName>('Kỹ thuật');

  const canManage = canManageSettings(currentAccount.roleId);
  const activeCount = accounts.filter((a) => a.active).length;
  const lockedCount = accounts.filter((a) => !a.active).length;

  const filteredAccounts = accounts.filter((acc) => {
    if (roleFilter !== 'ALL' && acc.roleId !== roleFilter) return false;
    if (
      searchAcc.trim() &&
      !matchesSearch(acc.name, searchAcc) &&
      !matchesSearch(acc.username, searchAcc) &&
      !matchesSearch(acc.email, searchAcc)
    ) {
      return false;
    }
    return true;
  });

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((item) => item.id === newEmpId);
    const scope =
      newRoleId === 'super_admin' || newRoleId === 'hr' || newRoleId === 'accountant'
        ? 'Toàn hệ thống'
        : newRoleId === 'manager'
        ? 'Chỉ phòng ban mình'
        : newRoleId === 'door_kiosk'
        ? 'Chỉ mở mã QR tại cửa'
        : 'Của bản thân';

    addAccount({
      employeeId: newEmpId,
      name: emp?.name || 'Tài khoản Mới',
      username: `@${(emp?.code || 'nv').toLowerCase()}`,
      email: emp?.email || 'user@phuonghihi.vn',
      roleId: newRoleId,
      dataScope: scope,
      department: newRoleId === 'manager' ? newDept : emp?.department,
      active: true,
    });
    setIsNewAccModalOpen(false);
  };

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header (Matches 01:00 in video) */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          PHUONGHIHI / HỆ THỐNG
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
          Phân quyền truy cập
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tài khoản, vai trò và phạm vi dữ liệu.
        </p>
      </div>

      {/* 4 Summary KPI Cards (Matches 01:00 in video) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Tổng tài khoản</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {accounts.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Đã được cấp quyền</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Đang hoạt động</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {activeCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Có thể đăng nhập</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Tạm khoá</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {lockedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Không thể đăng nhập</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Vai trò mẫu</div>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">
            {ROLE_DEFINITIONS.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Bộ quyền dựng sẵn</div>
        </div>
      </div>

      {/* 6 Built-in Roles Grid (Exact match to 01:00 - 01:02 in video) */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Vai trò</h2>
          <p className="text-xs text-slate-500">
            Mỗi vai trò là một bộ quyền theo công việc. Một người mang nhiều vai
            trò sẽ thấy dữ liệu của tất cả phạm vi được giao.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLE_DEFINITIONS.map((role) => {
            const assignedCount = accounts.filter(
              (a) => a.roleId === role.id
            ).length;
            const isExpanded = expandedRoleId === role.id;

            return (
              <div
                key={role.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-2xs hover:border-blue-200 transition"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {role.name}
                      </h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Vai trò có sẵn · {role.permissionCount} quyền
                      </div>
                    </div>
                  </div>

                  {/* Module Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    {role.modules.map((mod) => (
                      <span
                        key={mod}
                        className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>

                  {isExpanded && (
                    <ul className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      {role.permissionsDetail.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {assignedCount > 0 ? `${assignedCount} người` : 'Chưa ai mang'}
                  </span>
                  <button
                    onClick={() =>
                      setExpandedRoleId(isExpanded ? null : role.id)
                    }
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    <span>Xem quyền</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accounts Table (Matches bottom half of 01:00 - 01:02 in video) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tài khoản</h3>
            <p className="text-xs text-slate-500">
              Ai đăng nhập được, mang vai trò nào và được xem dữ liệu của những
              phòng ban nào.
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => setIsNewAccModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cấp tài khoản</span>
            </button>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchAcc}
              onChange={(e) => setSearchAcc(e.target.value)}
              placeholder="Tìm tên, email hoặc tên đăng nhập..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium"
          >
            <option value="ALL">Tất cả vai trò</option>
            {ROLE_DEFINITIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/40">
                <th className="py-3.5 px-5">Người dùng</th>
                <th className="py-3.5 px-4">Vai trò</th>
                <th className="py-3.5 px-4">Được xem dữ liệu của</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-5 text-right">Thao tác kiểm thử</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAccounts.map((acc) => {
                const roleDef = ROLE_DEFINITIONS.find(
                  (r) => r.id === acc.roleId
                );
                const isCurrent = currentAccount.id === acc.id;
                return (
                  <tr key={acc.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          {getInitials(acc.name)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {acc.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {acc.username} · {acc.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px]">
                        {roleDef?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {acc.dataScope}
                      {acc.department ? ` (${acc.department})` : ''}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleAccountStatus(acc.id)}
                        disabled={!canManage}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer ${
                          acc.active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {acc.active ? 'Đang hoạt động' : 'Tạm khoá'}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Đang đăng nhập
                          </span>
                        ) : (
                          <button
                            onClick={() => switchAccount(acc.id)}
                            disabled={!acc.active}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-40 disabled:pointer-events-none font-semibold text-slate-700 transition cursor-pointer"
                          >
                            {acc.active
                              ? 'Chuyển sang vai trò này'
                              : 'Tài khoản đang khoá'}
                          </button>
                        )}
                        {canManage && !isCurrent && (
                          <button
                            onClick={() => deleteAccount(acc.id)}
                            title="Thu hồi tài khoản"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Account Modal */}
      {isNewAccModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsNewAccModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Cấp tài khoản &amp; Phân quyền mới
              </h3>
              <button
                onClick={() => setIsNewAccModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Chọn nhân viên
                </label>
                <select
                  value={newEmpId}
                  onChange={(e) => setNewEmpId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.code} · {e.department})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Vai trò
                </label>
                <select
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value as RoleId)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {ROLE_DEFINITIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              {newRoleId === 'manager' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Phòng ban được xem dữ liệu
                  </label>
                  <select
                    value={newDept}
                    onChange={(e) =>
                      setNewDept(e.target.value as DepartmentName)
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    {[
                      'Kỹ thuật',
                      'Kinh doanh',
                      'Nhân sự',
                      'Kế toán',
                      'Marketing',
                      'Vận hành',
                      'Phòng ban chung',
                    ].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewAccModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  Cấp quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

