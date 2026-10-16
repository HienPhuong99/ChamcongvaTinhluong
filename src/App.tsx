import React from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
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
import { PayrollView } from './views/PayrollView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { PermissionsView } from './views/PermissionsView';
import { AuditLogView } from './views/AuditLogView';
import { InternalNewsView } from './views/InternalNewsView';
import { DashboardView } from './views/DashboardView';
import { MyProfileView } from './views/MyProfileView';
import { MobileAppView } from './views/MobileAppView';

const MainShell: React.FC = () => {
  const { activeTab, toasts, dismissToast } = useHRM();

  const renderActiveView = () => {
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
        <main className="flex-1 overflow-y-auto">{renderActiveView()}</main>
      </div>

      {/* Global Modals */}
      <CommandPaletteModal />
      <DoorQrKioskModal />
      <EmployeeProfileModal />

      {/* Global Toast Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
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
