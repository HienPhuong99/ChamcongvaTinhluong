import React from 'react';
import {
  LayoutDashboard,
  Newspaper,
  Users,
  CalendarClock,
  UserCheck,
  FileText,
  Table2,
  Wallet,
  BarChart3,
  UserCircle,
  Settings,
  ShieldCheck,
  History,
  Smartphone,
  LogOut,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { NavTabId } from '../types';
import { getInitials } from '../utils/helpers';

interface NavGroup {
  title: string;
  items: {
    id: NavTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[];
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    requests,
    attendanceRecords,
    employees,
    currentAccount,
    accounts,
    switchAccount,
  } = useHRM();

  const pendingRequestsCount = requests.filter((r) => r.status === 'Đang chờ').length;
  const activeEmployeeCount = employees.filter((e) => e.status !== 'Đã nghỉ').length;
  const presentTodayCount = attendanceRecords.filter(
    (r) => r.status === 'Đúng giờ' || r.status === 'Đi muộn'
  ).length;

  const navGroups: NavGroup[] = [
    {
      title: 'TỔNG QUAN',
      items: [
        { id: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
        { id: 'news', label: 'Bản tin nội bộ', icon: Newspaper },
      ],
    },
    {
      title: 'NHÂN SỰ',
      items: [{ id: 'employees', label: 'Nhân viên', icon: Users }],
    },
    {
      title: 'CHẤM CÔNG',
      items: [
        { id: 'shifts', label: 'Ca & lịch làm việc', icon: CalendarClock },
        { id: 'attendance', label: 'Điểm danh', icon: UserCheck },
        {
          id: 'requests',
          label: 'Đơn từ',
          icon: FileText,
          badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
        },
      ],
    },
    {
      title: 'LƯƠNG & BÁO CÁO',
      items: [
        { id: 'timesheet', label: 'Bảng công', icon: Table2 },
        { id: 'payroll', label: 'Bảng lương', icon: Wallet },
        { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
      ],
    },
    {
      title: 'HỆ THỐNG',
      items: [
        { id: 'my_profile', label: 'Hồ sơ của tôi', icon: UserCircle },
        { id: 'settings', label: 'Cài đặt', icon: Settings },
        { id: 'permissions', label: 'Phân quyền', icon: ShieldCheck },
        { id: 'audit_log', label: 'Nhật ký', icon: History },
      ],
    },
  ];

  const handleNextAccount = () => {
    const idx = accounts.findIndex((a) => a.id === currentAccount.id);
    const next = accounts[(idx + 1) % accounts.length];
    switchAccount(next.id);
  };

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="px-4 py-3.5 flex items-center justify-between border-b border-slate-100">
        <div
          onClick={() => setActiveTab('shifts')}
          className="flex items-center gap-2.5 cursor-pointer group min-w-0"
        >
          <svg
            className="w-8 h-8 shrink-0 rounded-lg shadow-xs"
            viewBox="0 0 40 40"
            aria-hidden="true"
          >
            <rect width="40" height="40" rx="11" fill="#0B4174" />
            <rect x="13" y="10" width="5" height="23" rx="2.5" fill="#FF6B4A" />
            <rect x="15" y="13" width="15" height="15" rx="7.5" fill="#FF6B4A" />
            <circle cx="25" cy="20.5" r="4.3" fill="#0B4174" />
          </svg>
          <div className="min-w-0 leading-tight">
            <div className="font-bold text-base tracking-tight text-slate-900 truncate">
              phuonghihi
            </div>
            <div className="text-[10.5px] text-slate-500 truncate">
              iPhone chính hãng · 123 Lê Lợi
            </div>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('mobile_app')}
          title="Mở giao diện App Chấm Công Điện Thoại"
          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border transition ${
            activeTab === 'mobile_app'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>App</span>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="px-2.5 mb-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Attendance Status Widget (Matches video 00:00 bottom-left) */}
      <div className="px-3 pb-2">
        <div
          onClick={() => setActiveTab('attendance')}
          className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:border-blue-200 transition"
        >
          <div className="text-[11px] text-slate-500 font-medium">
            Hôm nay, 09/10/2026
          </div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">
            {presentTodayCount} / {activeEmployeeCount}
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Nhân viên có mặt</span>
            </div>
            <span className="text-[11px] font-medium text-blue-600">
              {Math.round((presentTodayCount / Math.max(1, activeEmployeeCount)) * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  Math.round((presentTodayCount / Math.max(1, activeEmployeeCount)) * 100)
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* User Account Footer */}
      <div className="p-3 border-t border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center shrink-0">
            {getInitials(currentAccount.name)}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-800 truncate">
              {currentAccount.name}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {currentAccount.username} · {currentAccount.dataScope}
            </div>
          </div>
        </div>
        <button
          onClick={handleNextAccount}
          title="Đổi tài khoản / Chuyển vai trò xem thử"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
