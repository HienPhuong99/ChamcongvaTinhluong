import React, { Suspense, lazy } from 'react';
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  X,
  CalendarClock,
  UserCheck,
  Smartphone,
  FileText,
  Wallet,
} from 'lucide-react';
import { HRMProvider, useHRM } from './context/HRMContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { DoorQrKioskModal } from './components/DoorQrKioskModal';
import { EmployeeProfileModal } from './components/EmployeeProfileModal';
import { ShiftScheduleView } from './views/ShiftScheduleView';
import { AttendanceView } from './views/AttendanceView';
import { RequestsView } from './views/RequestsView';
import { EmployeesView } from './views/EmployeesView';
import { TimesheetView } from './views/TimesheetView';
import { InternalNewsView } from './views/InternalNewsView';
import { DashboardView } from './views/DashboardView';
import { MyProfileView } from './views/MyProfileView';

const PayrollView = lazy(() =>
  import('./views/PayrollView').then((m) => ({ default: m.PayrollView }))
);
const ReportsView = lazy(() =>
  import('./views/ReportsView').then((m) => ({ default: m.ReportsView }))
);
const SettingsView = lazy(() =>
  import('./views/SettingsView').then((m) => ({ default: m.SettingsView }))
);
const PermissionsView = lazy(() =>
  import('./views/PermissionsView').then((m) => ({ default: m.PermissionsView }))
);
const AuditLogView = lazy(() =>
  import('./views/AuditLogView').then((m) => ({ default: m.AuditLogView }))
);
const MobileAppView = lazy(() =>
  import('./views/MobileAppView').then((m) => ({ default: m.MobileAppView }))
);

const MainShell: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    toasts,
    dismissToast,
    requests,
    scopedEmployees,
    currentAccount,
    isLoggedOut,
    accounts,
    switchAccount,
  } = useHRM();
  const scopedIds = new Set(scopedEmployees.map((e) => e.id));
  const pendingCount = requests.filter(
    (r) => r.status === 'Đang chờ' && scopedIds.has(r.employeeId)
  ).length;

  const renderActiveView = () => {
    if (isLoggedOut) {
      const activeAccounts = accounts.filter((a) => a.active);
      return (
        <div className="min-h-full flex items-center justify-center p-4 sm:p-8 bg-slate-50">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Phiên làm việc đã đăng xuất hoặc tài khoản bị khoá
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Để bảo mật dữ liệu lương & nhân sự, hệ thống không tự động chuyển sang tài khoản của người khác. Vui lòng chọn tài khoản bên dưới để đăng nhập.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Chọn tài khoản đang hoạt động ({activeAccounts.length})
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {activeAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => switchAccount(acc.id)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50/70 transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {acc.name}{' '}
                        <span className="font-mono font-normal text-blue-600">({acc.username})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {acc.dataScope}
                        {acc.department ? ` · Phòng ${acc.department}` : ''}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-semibold shrink-0">
                      Đăng nhập
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'news':
        return <InternalNewsView />;
      case 'employees':
        return <EmployeesView />;
      case 'shifts':
        return <ShiftScheduleView />;
      case 'attendance':
        return <AttendanceView />;
      case 'requests':
        return <RequestsView />;
      case 'timesheet':
        return <TimesheetView />;
      case 'payroll':
        return <PayrollView />;
      case 'reports':
        return <ReportsView />;
      case 'my_profile':
        return <MyProfileView />;
      case 'settings':
        return <SettingsView />;
      case 'permissions':
        return <PermissionsView />;
      case 'audit_log':
        return <AuditLogView />;
      case 'mobile_app':
        return <MobileAppView />;
      default:
        return <ShiftScheduleView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <Suspense
            fallback={
              <div className="p-8 flex items-center justify-center text-xs font-semibold text-slate-400">
                Đang tải phân hệ phuonghihi...
              </div>
            }
          >
            {renderActiveView()}
          </Suspense>
        </main>

        {/* Mobile Quick Bottom Navigation Bar (< 1024px) */}
        <nav className="lg:hidden h-14 bg-white border-t border-slate-200 px-2 grid grid-cols-5 gap-1 items-center shrink-0 z-20">
          {[
            { id: 'shifts' as const, label: 'Ca trực', icon: CalendarClock },
            {
              id: (currentAccount.roleId === 'employee' ? 'timesheet' : 'attendance') as
                | 'timesheet'
                | 'attendance',
              label: currentAccount.roleId === 'employee' ? 'Bảng công' : 'Điểm danh',
              icon: UserCheck,
            },
            { id: 'mobile_app' as const, label: 'Chấm công', icon: Smartphone, highlight: true },
            { id: 'requests' as const, label: 'Đơn từ', icon: FileText, badge: pendingCount },
            { id: 'payroll' as const, label: 'Bảng lương', icon: Wallet },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 rounded-xl text-[10.5px] font-semibold transition ${
                  item.highlight
                    ? active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-50 text-blue-700'
                    : active
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="mt-0.5 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-0.5 right-3 min-w-[14px] h-3.5 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Global Modals */}
      <CommandPaletteModal />
      <DoorQrKioskModal />
      <EmployeeProfileModal />

      {/* Global Toast Stack */}
      <div className="fixed bottom-16 lg:bottom-5 right-4 lg:right-5 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-200"
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : t.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900">{t.title}</div>
              {t.description && (
                <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {t.description}
                </div>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export function App() {
  return (
    <HRMProvider>
      <MainShell />
    </HRMProvider>
  );
}

export default App;
