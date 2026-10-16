import React, { useMemo, useState } from 'react';
import { Pin, Plus, Cake, Award, X } from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { Announcement, DepartmentName } from '../types';
import {
  canApproveRequests,
  canManageHR,
  isDateExpired,
} from '../utils/helpers';

export const InternalNewsView: React.FC = () => {
  const {
    announcements,
    saveAnnouncement,
    deleteAnnouncement,
    togglePinAnnouncement,
    scopedEmployees,
    currentAccount,
  } = useHRM();

  const [editingItem, setEditingItem] = useState<
    (Omit<Announcement, 'id' | 'createdAt'> & { id?: string }) | null
  >(null);
  const [showExpired, setShowExpired] = useState(false);

  const canManageNews =
    canManageHR(currentAccount.roleId) ||
    canApproveRequests(currentAccount.roleId);

  const sortedAnnouncements = useMemo(() => {
    const scopedDepts = new Set(scopedEmployees.map((e) => e.department));
    return [...announcements]
      .filter((item) => {
        if (!showExpired && isDateExpired(item.expiresAt)) return false;
        if (
          !canManageHR(currentAccount.roleId) &&
          item.scope === 'Một phòng ban' &&
          item.department &&
          !scopedDepts.has(item.department)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));
  }, [announcements, scopedEmployees, showExpired, currentAccount.roleId]);

  const handleOpenCompose = () => {
    setEditingItem({
      title: '',
      content: '',
      scope: 'Toàn công ty',
      department: 'Kinh doanh',
      pinned: false,
      author: currentAccount.name || 'Quản lý cửa hàng (phuonghihi)',
      expiresAt: '31/12/2026',
    });
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title.trim()) return;
    saveAnnouncement({
      ...editingItem,
      department:
        editingItem.scope === 'Một phòng ban'
          ? editingItem.department || 'Kinh doanh'
          : undefined,
    });
    setEditingItem(null);
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header (Exact match to 01:09 - 01:11 in video) */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          PHUONGHIHI / TỔNG QUAN
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
          Bản tin nội bộ
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Thông báo của công ty và ngày vui trong tháng.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2/3: Announcements Card (Matches 01:09 - 01:11 in video) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Thông báo nội bộ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tin ghim nằm trên cùng. Tin quá ngày hết hạn tự rụng khỏi bản
                tin của nhân viên.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {canManageNews && (
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer mr-1">
                  <input
                    type="checkbox"
                    checked={showExpired}
                    onChange={(e) => setShowExpired(e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-600 rounded"
                  />
                  <span>Hiện tin hết hạn</span>
                </label>
              )}
              {canManageNews && (
                <button
                  onClick={handleOpenCompose}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Soạn thông báo</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {sortedAnnouncements.map((item) => {
              const expired = isDateExpired(item.expiresAt);
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition ${
                    expired
                      ? 'bg-slate-100/70 border-slate-200 opacity-75'
                      : item.pinned
                      ? 'bg-amber-50/35 border-amber-300/90'
                      : 'bg-slate-50/60 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {expired && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                          Hết hạn
                        </span>
                      )}
                      {item.pinned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">
                          <Pin className="w-3 h-3" />
                          Ghim
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.scope === 'Toàn công ty'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {item.scope === 'Toàn công ty'
                          ? 'Toàn công ty'
                          : `Một phòng ban (${item.department || 'Kinh doanh'})`}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mt-2">
                    {item.content}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                    <div>
                      <span>{item.author}</span> ·{' '}
                      <span>
                        {item.createdAt}
                        {item.expiresAt ? ` đến ${item.expiresAt}` : ''}
                      </span>
                    </div>
                    {canManageNews && (
                      <div className="flex items-center gap-3 font-semibold">
                        <button
                          onClick={() => togglePinAnnouncement(item.id)}
                          className="text-amber-600 hover:underline cursor-pointer"
                        >
                          {item.pinned ? 'Bỏ ghim' : 'Ghim'}
                        </button>
                        <button
                          onClick={() => setEditingItem({ ...item })}
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => deleteAnnouncement(item.id)}
                          className="text-rose-600 hover:underline cursor-pointer"
                        >
                          Gỡ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1/3: Celebrations & Birthdays in Month */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <Cake className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Sinh nhật tháng 10
              </h3>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {scopedEmployees.slice(0, 5).map((emp, idx) => (
                <div
                  key={emp.id}
                  className="py-2.5 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-800">
                      {emp.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {emp.department}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold text-[11px]">
                    {10 + idx * 3}/10
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Kỷ niệm thâm niên làm việc
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Nhân sự đủ mốc 5 năm được cộng thêm +1 ngày phép năm tự động.
            </p>
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs">
              <div className="font-bold text-slate-900">
                Nguyễn Minh Anh · 5 năm
              </div>
              <div className="text-[11px] text-slate-500">
                Phòng Nhân sự · Đã cộng +1 ngày phép thâm niên
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compose / Edit Modal */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem.id ? 'Sửa thông báo nội bộ' : 'Soạn thông báo mới'}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tiêu đề thông báo
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, title: e.target.value })
                  }
                  placeholder="Nhập tiêu đề..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Phạm vi hiển thị
                  </label>
                  <select
                    value={editingItem.scope}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        scope: e.target.value as any,
                        department:
                          e.target.value === 'Một phòng ban'
                            ? editingItem.department || 'Kinh doanh'
                            : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Toàn công ty">Toàn công ty</option>
                    <option value="Một phòng ban">Một phòng ban</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Ngày hết hạn (tuỳ chọn)
                  </label>
                  <input
                    type="text"
                    value={editingItem.expiresAt || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        expiresAt: e.target.value,
                      })
                    }
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>
              {editingItem.scope === 'Một phòng ban' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Chọn phòng ban áp dụng
                  </label>
                  <select
                    value={editingItem.department || 'Kinh doanh'}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        department: e.target.value as DepartmentName,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {[
                      'Kinh doanh',
                      'Kỹ thuật',
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
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nội dung thông báo
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingItem.content}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, content: e.target.value })
                  }
                  placeholder="Nhập nội dung thông báo..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingItem.pinned}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      pinned: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Ghim thông báo lên đầu Bản tin nội bộ
                </span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  Đăng bản tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

