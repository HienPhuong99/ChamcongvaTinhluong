import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Announcement,
  AttendanceRecord,
  AuditLogEntry,
  BonusDeductionItem,
  DepartmentName,
  Employee,
  EmployeeStatus,
  LeaveBalance,
  LeaveOrOtRequest,
  MonthlyTimesheetRow,
  NavTabId,
  PayrollPeriodState,
  PayrollRow,
  RequestStatus,
  ShiftAssignment,
  ShiftCode,
  ShiftTemplate,
  SystemSettings,
  UserAccount,
} from '../types';
import {
  DEFAULT_OFFBOARDING_TEMPLATE,
  DEFAULT_ONBOARDING_TEMPLATE,
  INITIAL_ACCOUNTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_AUDIT_LOGS,
  INITIAL_BONUS_DEDUCTIONS,
  INITIAL_EMPLOYEES,
  INITIAL_LEAVE_BALANCES,
  INITIAL_PAYROLL_PERIODS,
  INITIAL_REQUESTS,
  INITIAL_SETTINGS,
  INITIAL_SHIFT_ASSIGNMENTS,
  INITIAL_TIMESHEETS,
  SHIFT_TEMPLATES,
} from '../data/seedData';
import {
  calculateCheckInLateAndOt,
  calculateInclusiveDays,
  calculateProgressivePIT,
  canAccessTab,
  canApproveRequests,
  canManageHR,
  canManagePayroll,
  canManageSchedules,
  canManageSettings,
  derivePeriodFromDate,
  formatIsoToVN,
  getTodayIsoDate,
  normalizePeriodKey,
  normalizeToIsoDate,
  sanitizeTextInput,
} from '../utils/helpers';

export { normalizeToIsoDate };

export function isDateInLeaveRange(isoDate: string, startStr: string, endStr: string): boolean {
  const startIso = normalizeToIsoDate(startStr);
  const endIso = normalizeToIsoDate(endStr || startStr);
  if (!startIso) return false;
  return isoDate >= startIso && isoDate <= (endIso || startIso);
}

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'warning';
}

const VALID_DEPARTMENTS: DepartmentName[] = [
  'Kỹ thuật',
  'Kinh doanh',
  'Nhân sự',
  'Kế toán',
  'Marketing',
  'Vận hành',
  'Phòng ban chung',
];

const VALID_STATUSES: EmployeeStatus[] = ['Chính thức', 'Thử việc', 'Tạm nghỉ', 'Đã nghỉ'];

export interface HRMContextType {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  employees: Employee[];
  scopedEmployees: Employee[];
  shiftTemplates: ShiftTemplate[];
  shiftAssignments: ShiftAssignment[];
  attendanceRecords: AttendanceRecord[];
  selectedAttendanceDate: string;
  setSelectedAttendanceDate: (date: string) => void;
  requests: LeaveOrOtRequest[];
  leaveBalances: LeaveBalance[];
  timesheets: MonthlyTimesheetRow[];
  payrollPeriods: PayrollPeriodState[];
  bonusDeductions: BonusDeductionItem[];
  settings: SystemSettings;
  accounts: UserAccount[];
  currentAccount: UserAccount;
  auditLogs: AuditLogEntry[];
  announcements: Announcement[];
  toasts: ToastMessage[];
  showToast: (title: string, description?: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
  // Sync state
  isSyncingBackend: boolean;
  lastSyncedAt: string | null;
  syncNowWithBackend: () => Promise<boolean>;
  pullStateFromBackend: () => Promise<boolean>;
  // Modals & Responsive Drawer
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isDoorQrModalOpen: boolean;
  setIsDoorQrModalOpen: (open: boolean) => void;
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;
  pendingAuthAccountId: string | null;
  setPendingAuthAccountId: (id: string | null) => void;
  // Actions
  switchAccount: (accountId: string, pinOrPassword?: string) => boolean;
  assignShift: (employeeId: string, date: string, shiftCode: ShiftCode | null) => void;
  bulkAssignShifts: (employeeIds: string[], dates: string[], shiftCode: ShiftCode | null) => void;
  autoScheduleWeekWithAI: (dates: string[]) => { assignedCount: number; skippedLeaveCount: number };
  hasApprovedLeaveOnDate: (employeeId: string, isoDate: string) => LeaveOrOtRequest | undefined;
  checkInOrOut: (params: {
    employeeId: string;
    method: NonNullable<AttendanceRecord['method']>;
    distanceMeters?: number;
    gpsAccuracy?: number;
    photoUrl?: string;
    note?: string;
    date?: string;
  }) => void;
  proxyCheckIn: (params: {
    employeeId: string;
    shiftCode: ShiftCode;
    checkIn: string;
    checkOut: string;
    reason: string;
    date?: string;
  }) => void;
  remindUncheckedEmployees: (date?: string) => number;
  approveOrRejectRequest: (requestId: string, status: RequestStatus) => void;
  createRequest: (req: Omit<LeaveOrOtRequest, 'id' | 'status' | 'createdAt'>) => boolean;
  allocateAnnualLeave: (year: number) => void;
  saveEmployee: (emp: Employee) => void;
  deleteEmployee: (employeeId: string) => void;
  importEmployees: (newEmps: Partial<Employee>[]) => number;
  generateChecklistTasks: (employeeId: string, type: 'Nhận người mới' | 'Tiễn người nghỉ') => void;
  toggleChecklistTask: (employeeId: string, taskId: string) => void;
  aggregateTimesheet: (period: string) => void;
  toggleConfirmTimesheet: (employeeId: string, period: string) => void;
  lockTimesheetPeriod: (period: string) => void;
  unlockTimesheetPeriod: (period: string) => void;
  declareBaseSalary: (employeeId: string, baseSalary: number, allowance?: number) => void;
  calculatePayrollForPeriod: (period: string) => void;
  publishPayslipsForPeriod: (period: string) => void;
  toggleLockPayrollPeriod: (period: string) => void;
  addBonusDeduction: (item: Omit<BonusDeductionItem, 'id'>) => void;
  addSalesCommissionBatch: (
    period: string,
    items: {
      employeeId: string;
      iphoneCount: number;
      appleCareCount: number;
      installmentCount: number;
    }[]
  ) => number;
  computePayrollRows: (period: string) => PayrollRow[];
  updateSettings: (newSettings: SystemSettings) => void;
  saveAnnouncement: (ann: Omit<Announcement, 'id' | 'createdAt'> & { id?: string }) => void;
  deleteAnnouncement: (id: string) => void;
  togglePinAnnouncement: (id: string) => void;
  addAccount: (acc: Omit<UserAccount, 'id'>) => void;
  updateAccount: (acc: UserAccount) => void;
  deleteAccount: (id: string) => void;
  toggleAccountStatus: (id: string) => void;
  addAuditLog: (action: string, targetType: string, targetDetail: string, actor?: string) => void;
  resetDemoData: () => void;
}

export const STORAGE_KEY = 'phuonghihi_hrm_state_v2';
const SYNC_CHANNEL_NAME = 'phuonghihi_hrm_sync_channel_v2';

function getConfiguredApiToken(settingsToken?: string): string {
  if (settingsToken && settingsToken.trim()) return settingsToken.trim();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('phuonghihi_api_secret_token') || '';
    }
  } catch {
    // ignore storage errors
  }
  return '';
}

const HRMContext = createContext<HRMContextType | undefined>(undefined);

function loadPersisted<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function savePersisted<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

export const HRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialTab = useMemo<NavTabId>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'mobile') return 'mobile_app';
    return 'shifts';
  }, []);

  const [activeTab, setActiveTabState] = useState<NavTabId>(initialTab);
  const [employees, setEmployees] = useState<Employee[]>(() =>
    loadPersisted('employees', INITIAL_EMPLOYEES)
  );
  const [shiftTemplates] = useState<ShiftTemplate[]>(SHIFT_TEMPLATES);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>(() =>
    loadPersisted('shiftAssignments', INITIAL_SHIFT_ASSIGNMENTS)
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    loadPersisted('attendanceRecords', INITIAL_ATTENDANCE_RECORDS)
  );
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>(() =>
    getTodayIsoDate()
  );
  const [requests, setRequests] = useState<LeaveOrOtRequest[]>(() =>
    loadPersisted('requests', INITIAL_REQUESTS)
  );
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(() =>
    loadPersisted('leaveBalances', INITIAL_LEAVE_BALANCES)
  );
  const [timesheets, setTimesheets] = useState<MonthlyTimesheetRow[]>(() =>
    loadPersisted('timesheets', INITIAL_TIMESHEETS)
  );
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriodState[]>(() =>
    loadPersisted('payrollPeriods', INITIAL_PAYROLL_PERIODS)
  );
  const [bonusDeductions, setBonusDeductions] = useState<BonusDeductionItem[]>(() =>
    loadPersisted('bonusDeductions', INITIAL_BONUS_DEDUCTIONS)
  );
  const [settings, setSettings] = useState<SystemSettings>(() =>
    loadPersisted('settings', INITIAL_SETTINGS)
  );
  const [accounts, setAccounts] = useState<UserAccount[]>(() =>
    loadPersisted('accounts', INITIAL_ACCOUNTS)
  );
  const [currentAccountId, setCurrentAccountId] = useState<string>(() =>
    loadPersisted('currentAccountId', INITIAL_ACCOUNTS[0].id)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    loadPersisted('auditLogs', INITIAL_AUDIT_LOGS)
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    loadPersisted('announcements', INITIAL_ANNOUNCEMENTS)
  );

  // Sync states
  const [isSyncingBackend, setIsSyncingBackend] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() =>
    loadPersisted<string | null>('lastSyncedAt', null)
  );
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isApplyingRemoteUpdate = useRef(false);

  // Global UI states
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isDoorQrModalOpen, setIsDoorQrModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [pendingAuthAccountId, setPendingAuthAccountId] = useState<string | null>(null);

  // Safe fallback (Issue D5): if currentAccountId is locked, fall back to a least-privilege active account, NEVER escalating to super_admin
  const currentAccount = useMemo(
    () =>
      accounts.find((a) => a.id === currentAccountId && a.active) ||
      accounts.find((a) => a.active && a.roleId === 'employee') ||
      accounts.find((a) => a.active && a.roleId !== 'super_admin') ||
      accounts[0],
    [accounts, currentAccountId]
  );

  const showToast = useCallback(
    (title: string, description?: string, type: ToastMessage['type'] = 'success') => {
      const id = `TOAST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, description, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3800);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Guard activeTab by RBAC permissions
  const setActiveTab = useCallback(
    (tab: NavTabId) => {
      if (currentAccount.roleId === 'door_kiosk') {
        setIsDoorQrModalOpen(true);
        return;
      }
      if (!canAccessTab(currentAccount.roleId, tab)) {
        showToast(
          'Không có quyền truy cập mục này',
          `Vai trò "${currentAccount.dataScope}" không được phép mở trang này.`,
          'warning'
        );
        return;
      }
      setActiveTabState(tab);
    },
    [currentAccount, showToast]
  );

  // Ensure activeTab is valid when role changes
  useEffect(() => {
    if (currentAccount.roleId === 'door_kiosk') {
      setIsDoorQrModalOpen(true);
      return;
    }
    if (!canAccessTab(currentAccount.roleId, activeTab)) {
      if (currentAccount.roleId === 'accountant') {
        setActiveTabState('timesheet');
      } else if (currentAccount.roleId === 'employee') {
        setActiveTabState('shifts');
      } else {
        setActiveTabState('shifts');
      }
    }
  }, [currentAccount, activeTab]);

  // Ensure attendanceRecords exist for selectedAttendanceDate based on shiftAssignments & approved leaves
  useEffect(() => {
    if (!selectedAttendanceDate) return;
    setAttendanceRecords((prev) => {
      const hasAnyForDate = prev.some((r) => r.date === selectedAttendanceDate);
      if (hasAnyForDate) return prev;
      const generated: AttendanceRecord[] = employees.map((emp) => {
        const leave = requests.find(
          (r) =>
            r.employeeId === emp.id &&
            r.status === 'Đã duyệt' &&
            (r.type === 'Nghỉ phép năm' || r.type === 'Nghỉ ốm') &&
            isDateInLeaveRange(selectedAttendanceDate, r.startDate, r.endDate)
        );
        const assigned = shiftAssignments.find(
          (a) => a.employeeId === emp.id && a.date === selectedAttendanceDate
        );
        if (leave) {
          return {
            id: `ATT-${selectedAttendanceDate}-${emp.code}`,
            employeeId: emp.id,
            date: selectedAttendanceDate,
            shiftCode: assigned?.shiftCode,
            status: 'Nghỉ phép',
            lateMinutes: 0,
            otHours: 0,
          };
        }
        if (assigned) {
          return {
            id: `ATT-${selectedAttendanceDate}-${emp.code}`,
            employeeId: emp.id,
            date: selectedAttendanceDate,
            shiftCode: assigned.shiftCode,
            status: 'Chưa chấm',
            lateMinutes: 0,
            otHours: 0,
          };
        }
        return {
          id: `ATT-${selectedAttendanceDate}-${emp.code}`,
          employeeId: emp.id,
          date: selectedAttendanceDate,
          status: 'Không có ca',
          lateMinutes: 0,
          otHours: 0,
        };
      });
      return [...prev, ...generated];
    });
  }, [selectedAttendanceDate, employees, shiftAssignments, requests]);

  // Multi-tab BroadcastChannel & storage event listener
  useEffect(() => {
    const applyKeyUpdate = (key: string, val: unknown) => {
      if (!val) return;
      isApplyingRemoteUpdate.current = true;
      try {
        switch (key) {
          case 'employees':
            setEmployees(val as Employee[]);
            break;
          case 'shiftAssignments':
            setShiftAssignments(val as ShiftAssignment[]);
            break;
          case 'attendanceRecords':
            setAttendanceRecords(val as AttendanceRecord[]);
            break;
          case 'requests':
            setRequests(val as LeaveOrOtRequest[]);
            break;
          case 'leaveBalances':
            setLeaveBalances(val as LeaveBalance[]);
            break;
          case 'timesheets':
            setTimesheets(val as MonthlyTimesheetRow[]);
            break;
          case 'payrollPeriods':
            setPayrollPeriods(val as PayrollPeriodState[]);
            break;
          case 'bonusDeductions':
            setBonusDeductions(val as BonusDeductionItem[]);
            break;
          case 'settings':
            setSettings(val as SystemSettings);
            break;
          case 'accounts':
            setAccounts(val as UserAccount[]);
            break;
          case 'auditLogs':
            setAuditLogs(val as AuditLogEntry[]);
            break;
          case 'announcements':
            setAnnouncements(val as Announcement[]);
            break;
        }
      } finally {
        setTimeout(() => {
          isApplyingRemoteUpdate.current = false;
        }, 20);
      }
    };

    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channelRef.current = bc;
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.key) {
          applyKeyUpdate(ev.data.key, ev.data.value);
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || !e.key.startsWith(`${STORAGE_KEY}_`) || !e.newValue) return;
      const shortKey = e.key.slice(`${STORAGE_KEY}_`.length);
      try {
        const parsed = JSON.parse(e.newValue);
        applyKeyUpdate(shortKey, parsed);
      } catch {
        // ignore parse error
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
    };
  }, []);

  const broadcastAndPersist = useCallback(<T,>(key: string, value: T) => {
    savePersisted(key, value);
    if (!isApplyingRemoteUpdate.current && channelRef.current) {
      try {
        channelRef.current.postMessage({ key, value });
      } catch {
        // ignore channel post error
      }
    }
  }, []);

  // Persist changes
  useEffect(() => broadcastAndPersist('employees', employees), [employees, broadcastAndPersist]);
  useEffect(() => broadcastAndPersist('shiftAssignments', shiftAssignments), [shiftAssignments, broadcastAndPersist]);
  useEffect(() => broadcastAndPersist('attendanceRecords', attendanceRecords), [attendanceRecords, broadcastAndPersist]);
  useEffect(() => broadcastAndPersist('requests', requests), [requests, broadcastAndPersist]);
  useEffect(() => broadcastAndPersist('leaveBalances', leaveBalances), [leaveBalances, broadcastAndPersist]);
  useEffect(() => broadcastAndPersist('timesheets', timesheets), [timesheets, broadcastAndPersist]);
  useEffect(() => broadcastAndPersist('payrollPeriods', payrollPeriods), [payrollPeriods, broadcastAndPersist]);
  useEffect(() => broadcastAndPersist('bonusDeductions', bonusDeductions), [bonusDeductions, broadcastAndPersist]);
  useEffect(() => broadcastAndPersist('settings', settings), [settings, broadcastAndPersist]);
  useEffect(() => broadcastAndPersist('accounts', accounts), [accounts, broadcastAndPersist]);
  useEffect(() => savePersisted('currentAccountId', currentAccountId), [currentAccountId]);
  useEffect(() => broadcastAndPersist('auditLogs', auditLogs), [auditLogs, broadcastAndPersist]);
  useEffect(() => broadcastAndPersist('announcements', announcements), [announcements, broadcastAndPersist]);
  useEffect(() => savePersisted('lastSyncedAt', lastSyncedAt), [lastSyncedAt]);

  // Push state to backend REST API (/api/state) or Google Sheets Web App
  const syncNowWithBackend = useCallback(async (): Promise<boolean> => {
    setIsSyncingBackend(true);
    const apiToken = getConfiguredApiToken(settings.apiSecretToken);
    const payload = {
      employees,
      shiftAssignments,
      attendanceRecords,
      requests,
      leaveBalances,
      timesheets,
      payrollPeriods,
      bonusDeductions,
      settings,
      accounts,
      auditLogs: auditLogs.slice(0, 100),
      announcements,
      exportedAt: new Date().toISOString(),
    };

    let syncedOk = false;
    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiToken ? { 'X-Phuonghihi-Token': apiToken } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        syncedOk = true;
      }
    } catch {
      // Local Node server not running or unreachable; fallback to Google Sheets if configured
    }

    if (
      settings.googleSheetsWebAppUrl &&
      settings.googleSheetsWebAppUrl.startsWith('https://script.google.com/')
    ) {
      try {
        const gsRes = await fetch(settings.googleSheetsWebAppUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            action: 'SYNC_FULL_STATE',
            token: apiToken,
            state: payload,
          }),
        });
        if (gsRes.ok) {
          syncedOk = true;
        }
      } catch {
        // ignore network error in offline environment
      }
    }

    const nowStamp = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    if (syncedOk) {
      setLastSyncedAt(`${nowStamp} ${formatIsoToVN(getTodayIsoDate())}`);
    }
    setIsSyncingBackend(false);
    return syncedOk;
  }, [
    employees,
    shiftAssignments,
    attendanceRecords,
    requests,
    leaveBalances,
    timesheets,
    payrollPeriods,
    bonusDeductions,
    settings,
    accounts,
    auditLogs,
    announcements,
  ]);

  // Pull state from backend REST API (/api/state) to synchronize across devices (Issue C1)
  const pullStateFromBackend = useCallback(async (): Promise<boolean> => {
    setIsSyncingBackend(true);
    const apiToken = getConfiguredApiToken(settings.apiSecretToken);
    let pulledOk = false;
    try {
      const res = await fetch('/api/state', {
        method: 'GET',
        headers: {
          ...(apiToken ? { 'X-Phuonghihi-Token': apiToken } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        const remote = data && typeof data === 'object' && data.state ? data.state : data;
        if (remote && typeof remote === 'object') {
          isApplyingRemoteUpdate.current = true;
          if (Array.isArray(remote.employees) && remote.employees.length > 0) {
            setEmployees(remote.employees);
          }
          if (Array.isArray(remote.shiftAssignments)) {
            setShiftAssignments(remote.shiftAssignments);
          }
          if (Array.isArray(remote.attendanceRecords)) {
            setAttendanceRecords(remote.attendanceRecords);
          }
          if (Array.isArray(remote.requests)) {
            setRequests(remote.requests);
          }
          if (Array.isArray(remote.leaveBalances)) {
            setLeaveBalances(remote.leaveBalances);
          }
          if (Array.isArray(remote.timesheets)) {
            setTimesheets(remote.timesheets);
          }
          const remotePeriods = remote.payrollPeriods || remote.payrollPeriodStates;
          if (Array.isArray(remotePeriods)) {
            setPayrollPeriods(remotePeriods);
          }
          const remoteBonuses = remote.bonusDeductions || remote.payrollOverrides;
          if (Array.isArray(remoteBonuses)) {
            setBonusDeductions(remoteBonuses);
          }
          if (remote.settings && typeof remote.settings === 'object') {
            setSettings((prev) => ({ ...prev, ...remote.settings }));
          }
          const remoteAccounts = remote.accounts || remote.systemUsers;
          if (Array.isArray(remoteAccounts) && remoteAccounts.length > 0) {
            setAccounts(remoteAccounts);
          }
          if (Array.isArray(remote.auditLogs)) {
            setAuditLogs(remote.auditLogs);
          }
          if (Array.isArray(remote.announcements)) {
            setAnnouncements(remote.announcements);
          }
          setTimeout(() => {
            isApplyingRemoteUpdate.current = false;
          }, 50);
          pulledOk = true;
        }
      }
    } catch {
      // Server unreachable
    }
    const nowStamp = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    if (pulledOk) {
      setLastSyncedAt(`${nowStamp} ${formatIsoToVN(getTodayIsoDate())}`);
      showToast('Đã tải dữ liệu mới nhất từ Server!', `Đồng bộ lúc ${nowStamp}`);
    } else {
      showToast(
        'Không thể tải dữ liệu từ Server!',
        'Vui lòng kiểm tra kết nối máy chủ hoặc khoá API Token trong mục Cài đặt.',
        'warning'
      );
    }
    setIsSyncingBackend(false);
    return pulledOk;
  }, [settings.apiSecretToken, showToast]);

  // Global Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scoped employees based on RBAC role & department
  const scopedEmployees = useMemo(() => {
    if (currentAccount.roleId === 'door_kiosk' || currentAccount.dataScope === 'Chỉ mở mã QR tại cửa') {
      return [];
    }
    if (currentAccount.dataScope === 'Toàn hệ thống') {
      return employees;
    }
    if (currentAccount.dataScope === 'Chỉ phòng ban mình' && currentAccount.department) {
      return employees.filter((e) => e.department === currentAccount.department);
    }
    if (currentAccount.dataScope === 'Của bản thân') {
      return employees.filter((e) => e.id === currentAccount.employeeId);
    }
    return employees.filter((e) => e.id === currentAccount.employeeId);
  }, [employees, currentAccount]);

  const formatNowTimestamp = useCallback(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm} ${formatIsoToVN(getTodayIsoDate())}`;
  }, []);

  const addAuditLog = useCallback(
    (action: string, targetType: string, targetDetail: string, actor?: string) => {
      const newEntry: AuditLogEntry = {
        id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: formatNowTimestamp(),
        actor: actor || currentAccount.email || 'admin@phuonghihi.vn',
        action,
        targetType,
        targetDetail,
      };
      setAuditLogs((prev) => [newEntry, ...prev].slice(0, 500));
    },
    [formatNowTimestamp, currentAccount.email]
  );

  // Authenticated account switching (Issue B1): require PIN/password when switching accounts
  const switchAccount = (accountId: string, pinOrPassword?: string): boolean => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return false;
    if (!target.active) {
      showToast(
        `Tài khoản ${target.name} đang bị khoá!`,
        'Vui lòng mở khoá tài khoản trong mục Phân quyền trước khi chuyển đổi.',
        'warning'
      );
      return false;
    }
    if (accountId === currentAccount.id) {
      setPendingAuthAccountId(null);
      return true;
    }
    const expectedPin = target.pin || '123456';
    const cleanInput = (pinOrPassword || '').trim();
    if (!cleanInput) {
      setPendingAuthAccountId(accountId);
      return false;
    }
    if (cleanInput !== expectedPin && cleanInput !== target.username) {
      showToast(
        'Mật khẩu / Mã PIN xác thực không đúng!',
        `Không thể chuyển sang tài khoản ${target.name}.`,
        'warning'
      );
      return false;
    }

    setPendingAuthAccountId(null);
    setCurrentAccountId(accountId);
    if (target.roleId === 'door_kiosk') {
      setIsDoorQrModalOpen(true);
    }
    addAuditLog('Đăng nhập / Chuyển tài khoản', 'Phân quyền', `${target.name} (${target.username})`);
    showToast(
      `Đã xác thực & chuyển sang: ${target.name}`,
      `Phạm vi dữ liệu: ${target.dataScope}${target.department ? ` (${target.department})` : ''}`,
      'info'
    );
    return true;
  };

  const hasApprovedLeaveOnDate = useCallback(
    (employeeId: string, isoDate: string): LeaveOrOtRequest | undefined => {
      return requests.find(
        (r) =>
          r.employeeId === employeeId &&
          r.status === 'Đã duyệt' &&
          (r.type === 'Nghỉ phép năm' || r.type === 'Nghỉ ốm') &&
          isDateInLeaveRange(isoDate, r.startDate, r.endDate)
      );
    },
    [requests]
  );

  const assignShift = (employeeId: string, date: string, shiftCode: ShiftCode | null) => {
    if (!canManageSchedules(currentAccount.roleId)) {
      showToast('Không có quyền phân ca!', 'Chỉ Quản trị viên, Nhân sự hoặc Quản lý mới được xếp ca.', 'warning');
      return;
    }
    const existing = shiftAssignments.find((a) => a.employeeId === employeeId && a.date === date);
    if ((existing?.shiftCode || null) === (shiftCode || null)) {
      return; // Skip no-op assignment to avoid polluting audit log
    }

    setShiftAssignments((prev) => {
      const filtered = prev.filter((a) => !(a.employeeId === employeeId && a.date === date));
      if (!shiftCode) return filtered;
      return [...filtered, { employeeId, date, shiftCode }];
    });

    // Keep un-checked attendance record for that date in sync with shift change
    setAttendanceRecords((prev) =>
      prev.map((r) => {
        if (r.employeeId === employeeId && r.date === date && !r.checkIn) {
          if (!shiftCode) {
            return { ...r, shiftCode: undefined, status: 'Không có ca' };
          }
          return { ...r, shiftCode, status: r.status === 'Không có ca' ? 'Chưa chấm' : r.status };
        }
        return r;
      })
    );

    const emp = employees.find((e) => e.id === employeeId);
    addAuditLog(
      'Phân ca',
      'Phân ca',
      `${emp?.name || employeeId} · ${date} (${shiftCode || 'Xoá ca'})`
    );
  };

  const bulkAssignShifts = (
    employeeIds: string[],
    dates: string[],
    shiftCode: ShiftCode | null
  ) => {
    if (!canManageSchedules(currentAccount.roleId)) {
      showToast('Không có quyền phân ca hàng loạt!', undefined, 'warning');
      return;
    }
    const empSet = new Set(employeeIds);
    const dateSet = new Set(dates);
    setShiftAssignments((prev) => {
      const filtered = prev.filter((a) => !(empSet.has(a.employeeId) && dateSet.has(a.date)));
      if (!shiftCode) return filtered;
      const additions: ShiftAssignment[] = [];
      employeeIds.forEach((empId) => {
        dates.forEach((d) => {
          additions.push({ employeeId: empId, date: d, shiftCode });
        });
      });
      return [...filtered, ...additions];
    });

    // Sync attendanceRecords for unchecked dates
    setAttendanceRecords((prev) =>
      prev.map((r) => {
        if (empSet.has(r.employeeId) && dateSet.has(r.date) && !r.checkIn) {
          if (!shiftCode) return { ...r, shiftCode: undefined, status: 'Không có ca' };
          return { ...r, shiftCode, status: r.status === 'Không có ca' ? 'Chưa chấm' : r.status };
        }
        return r;
      })
    );

    addAuditLog(
      'Phân ca hàng loạt',
      'Phân ca',
      `${employeeIds.length} nhân viên · ${dates.length} ngày`
    );
    showToast(
      'Đã cập nhật lịch phân ca',
      `Áp dụng cho ${employeeIds.length} nhân viên trong ${dates.length} ngày.`
    );
  };

  const autoScheduleWeekWithAI = (dates: string[]) => {
    if (!canManageSchedules(currentAccount.roleId)) {
      showToast('Không có quyền chạy AI xếp ca!', undefined, 'warning');
      return { assignedCount: 0, skippedLeaveCount: 0 };
    }
    const activeScoped = scopedEmployees.filter((e) => e.status !== 'Đã nghỉ');
    const empSet = new Set(activeScoped.map((e) => e.id));
    const dateSet = new Set(dates);

    let assignedCount = 0;
    let skippedLeaveCount = 0;
    const additions: ShiftAssignment[] = [];

    activeScoped.forEach((emp, empIdx) => {
      dates.forEach((isoDate, dayIdx) => {
        const leaveConflict = hasApprovedLeaveOnDate(emp.id, isoDate);
        if (leaveConflict) {
          skippedLeaveCount++;
          return;
        }
        const [y, m, d] = isoDate.split('-').map(Number);
        const dayOfWeek = new Date(y, (m || 1) - 1, d || 1).getDay(); // 0 = Sunday, 6 = Saturday
        const isOfficeDept =
          emp.department === 'Nhân sự' ||
          emp.department === 'Kế toán' ||
          emp.department === 'Marketing';

        if (isOfficeDept) {
          if (dayOfWeek === 0) return; // Sunday off
          if (dayOfWeek === 6) {
            if (empIdx % 2 === 0) {
              additions.push({ employeeId: emp.id, date: isoDate, shiftCode: 'sang' });
              assignedCount++;
            }
            return;
          }
          additions.push({ employeeId: emp.id, date: isoDate, shiftCode: 'hanh_chinh' });
          assignedCount++;
        } else {
          // Retail Store & Tech departments (Kinh doanh, Kỹ thuật, Vận hành): 7-day coverage with rotating shifts
          if (dayOfWeek === 0 && (empIdx + dayIdx) % 3 === 0) {
            return; // Rotating day off on Sunday for 1/3 of retail staff
          }
          const retailRotation: ShiftCode[] = ['sang', 'chieu', 'hanh_chinh', 'ca_gay'];
          const chosenShift = retailRotation[(empIdx + dayIdx) % retailRotation.length];
          additions.push({ employeeId: emp.id, date: isoDate, shiftCode: chosenShift });
          assignedCount++;
        }
      });
    });

    setShiftAssignments((prev) => {
      const filtered = prev.filter((a) => !(empSet.has(a.employeeId) && dateSet.has(a.date)));
      return [...filtered, ...additions];
    });

    addAuditLog(
      'AI Xếp ca tối ưu',
      'Phân ca',
      `Tự động xếp ${assignedCount} ca trực · Tự tránh ${skippedLeaveCount} ngày trùng lịch nghỉ phép`
    );
    showToast(
      `✨ AI đã xếp tối ưu ${assignedCount} ca làm việc!`,
      skippedLeaveCount > 0
        ? `Đã tự động bỏ qua ${skippedLeaveCount} ca trùng ngày nghỉ phép đã duyệt và cân bằng nhân sự quầy iPhone.`
        : 'Đã cân bằng đủ nhân sự Ca Sáng, Ca Chiều, Hành chính & Ca gãy cho cửa hàng.'
    );
    return { assignedCount, skippedLeaveCount };
  };

  const checkInOrOut = ({
    employeeId,
    method,
    distanceMeters = 27,
    gpsAccuracy = 12,
    photoUrl,
    note,
    date,
  }: {
    employeeId: string;
    method: NonNullable<AttendanceRecord['method']>;
    distanceMeters?: number;
    gpsAccuracy?: number;
    photoUrl?: string;
    note?: string;
    date?: string;
  }) => {
    const emp = employees.find((e) => e.id === employeeId);
    const targetDate = date || getTodayIsoDate();

    // Validate attendance method against system settings (Issues B3, C8)
    if (method === 'GPS') {
      if (!settings.gpsEnabled) {
        showToast('Chấm công GPS đang tạm tắt!', 'Quản trị viên đã tắt hình thức chấm công GPS trong Cài đặt.', 'warning');
        return;
      }
      if (settings.requirePhotoOnGps && !photoUrl) {
        showToast(
          'Bắt buộc chụp ảnh selfie khi chấm công GPS!',
          'Vui lòng chụp ảnh xác thực khuôn mặt tại quầy trước khi bấm Chấm công GPS.',
          'warning'
        );
        return;
      }
    }
    if (method === 'QR tại cửa' && !settings.qrEnabled) {
      showToast('Chấm công Mã QR đang tạm tắt!', 'Quản trị viên đã tắt hình thức chấm công QR trong Cài đặt.', 'warning');
      return;
    }
    if (method === 'Máy vân tay' && !settings.biometricEnabled) {
      showToast('Đồng bộ Máy chấm công vân tay đang tắt!', 'Vui lòng bật tích hợp máy vân tay trong mục Cài đặt.', 'warning');
      return;
    }
    if (method === 'Từ xa') {
      if (!settings.remoteEnabled) {
        showToast('Chấm công từ xa đang tắt!', 'Hệ thống hiện không cho phép chấm công ngoài vùng văn phòng.', 'warning');
        return;
      }
      if (emp && !emp.allowRemote) {
        showToast(
          'Chưa được cấp quyền chấm công từ xa!',
          `Nhân viên ${emp.name} cần có mặt trong bán kính ${settings.allowedRadiusMeters}m tại cửa hàng.`,
          'warning'
        );
        return;
      }
    }

    const existingForDate = attendanceRecords.find(
      (r) => r.employeeId === employeeId && r.date === targetDate
    );
    if (existingForDate?.checkIn && existingForDate?.checkOut) {
      showToast(
        'Đã hoàn tất chấm công trong ngày!',
        `${emp?.name || employeeId} đã chấm vào (${existingForDate.checkIn}) và chấm ra (${existingForDate.checkOut}).`,
        'info'
      );
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const cleanNote = note ? sanitizeTextInput(note, 300) : undefined;

    // Issue D3: Check if employee actually has a scheduled shift on targetDate
    const scheduledAssignment = shiftAssignments.find(
      (a) => a.employeeId === employeeId && a.date === targetDate
    );
    const hasScheduledShift = Boolean(existingForDate?.shiftCode || scheduledAssignment?.shiftCode);
    const assignedShift =
      existingForDate?.shiftCode || scheduledAssignment?.shiftCode || 'hanh_chinh';
    const shiftTpl = shiftTemplates.find((s) => s.code === assignedShift) || shiftTemplates[0];

    const isCheckingOut = Boolean(existingForDate?.checkIn && !existingForDate?.checkOut);
    const nextCheckIn = existingForDate?.checkIn || timeStr;
    const nextCheckOut = isCheckingOut ? timeStr : existingForDate?.checkOut;

    const calcResult = calculateCheckInLateAndOt({
      checkIn: nextCheckIn,
      checkOut: nextCheckOut,
      shiftStart: shiftTpl.startTime,
      shiftEnd: shiftTpl.endTime,
      graceMinutes: 0,
    });

    // If employee had no scheduled shift on this date (e.g. weekend extra shift), do NOT penalize as late (Issue D3)
    const lateMinutes = hasScheduledShift ? calcResult.lateMinutes : 0;
    const otHours = calcResult.otHours;
    const status: AttendanceRecord['status'] = hasScheduledShift ? calcResult.status : 'Đúng giờ';

    setAttendanceRecords((prev) => {
      const existing = prev.find((r) => r.employeeId === employeeId && r.date === targetDate);
      if (existing) {
        return prev.map((r) =>
          r.id === existing.id
            ? {
                ...r,
                shiftCode: assignedShift,
                checkIn: nextCheckIn,
                checkOut: nextCheckOut,
                status,
                lateMinutes,
                otHours,
                method,
                distanceMeters,
                gpsAccuracy,
                photoUrl: photoUrl || r.photoUrl,
                note:
                  cleanNote ||
                  r.note ||
                  (!hasScheduledShift ? 'Làm thêm ngoài lịch phân ca' : undefined),
              }
            : r
        );
      }
      return [
        ...prev,
        {
          id: `ATT-${targetDate}-${employeeId}`,
          employeeId,
          date: targetDate,
          shiftCode: assignedShift,
          checkIn: nextCheckIn,
          checkOut: nextCheckOut,
          status,
          lateMinutes,
          otHours,
          method,
          distanceMeters,
          gpsAccuracy,
          photoUrl,
          note: cleanNote || (!hasScheduledShift ? 'Làm thêm ngoài lịch phân ca' : undefined),
        },
      ];
    });

    addAuditLog(
      isCheckingOut ? 'Chấm công ra' : 'Chấm công vào',
      'Điểm danh',
      `${emp?.name || employeeId} · ${method} (${distanceMeters}m) · ${targetDate}`
    );
    showToast(
      `${isCheckingOut ? 'Chấm công ra' : 'Chấm công vào'} thành công lúc ${timeStr}!`,
      `${emp?.name || employeeId} · ${method} (${distanceMeters}m)${
        !hasScheduledShift
          ? ' · Ngoài lịch phân ca (Không tính muộn)'
          : lateMinutes > 0
          ? ` · Đi muộn ${lateMinutes} phút`
          : ' · Đúng giờ'
      }`
    );
  };

  const proxyCheckIn = ({
    employeeId,
    shiftCode,
    checkIn,
    checkOut,
    reason,
    date,
  }: {
    employeeId: string;
    shiftCode: ShiftCode;
    checkIn: string;
    checkOut: string;
    reason: string;
    date?: string;
  }) => {
    if (!settings.manualProxyEnabled) {
      showToast('Chấm công hộ đang tắt!', 'Vui lòng bật cho phép chấm công hộ trong Cài đặt.', 'warning');
      return;
    }
    if (!canManageSchedules(currentAccount.roleId)) {
      showToast('Không có quyền chấm công hộ!', undefined, 'warning');
      return;
    }
    if (shiftCode !== 'dem' && checkIn && checkOut && checkIn >= checkOut) {
      showToast('Giờ chấm công không hợp lệ!', 'Giờ ra phải lớn hơn giờ vào ca trực.', 'warning');
      return;
    }

    const targetDate = date || selectedAttendanceDate || getTodayIsoDate();
    const cleanReason = sanitizeTextInput(reason, 300);
    const emp = employees.find((e) => e.id === employeeId);
    const shiftTpl = shiftTemplates.find((s) => s.code === shiftCode) || shiftTemplates[0];
    const { lateMinutes, otHours, status } = calculateCheckInLateAndOt({
      checkIn,
      checkOut,
      shiftStart: shiftTpl.startTime,
      shiftEnd: shiftTpl.endTime,
      graceMinutes: 0,
    });

    setAttendanceRecords((prev) => {
      const exists = prev.some((r) => r.employeeId === employeeId && r.date === targetDate);
      if (exists) {
        return prev.map((r) =>
          r.employeeId === employeeId && r.date === targetDate
            ? {
                ...r,
                shiftCode,
                checkIn,
                checkOut,
                status,
                lateMinutes,
                otHours,
                method: 'Chấm hộ',
                note: cleanReason,
              }
            : r
        );
      }
      return [
        ...prev,
        {
          id: `ATT-${targetDate}-${employeeId}`,
          employeeId,
          date: targetDate,
          shiftCode,
          checkIn,
          checkOut,
          status,
          lateMinutes,
          otHours,
          method: 'Chấm hộ',
          note: cleanReason,
        },
      ];
    });

    addAuditLog(
      'Chấm công hộ',
      'Điểm danh',
      `${emp?.name || employeeId} (${checkIn} - ${checkOut}) · Ngày ${targetDate} · Lý do: ${cleanReason}`
    );
    showToast(
      `Đã chấm công hộ cho ${emp?.name || employeeId}`,
      `Giờ vào/ra: ${checkIn} - ${checkOut} (${formatIsoToVN(targetDate)}) · Đã ghi nhật ký hệ thống.`
    );
  };

  const remindUncheckedEmployees = (date?: string) => {
    const targetDate = date || selectedAttendanceDate || getTodayIsoDate();
    const scopedIds = new Set(scopedEmployees.map((e) => e.id));
    const unchecked = attendanceRecords.filter(
      (r) => r.date === targetDate && r.status === 'Chưa chấm' && scopedIds.has(r.employeeId)
    );
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setAttendanceRecords((prev) =>
      prev.map((r) =>
        r.date === targetDate && r.status === 'Chưa chấm' && scopedIds.has(r.employeeId)
          ? { ...r, remindedAt: nowTime }
          : r
      )
    );
    addAuditLog(
      'Gửi nhắc chấm công',
      'Điểm danh',
      `Đã nhắc ${unchecked.length} nhân viên chưa chấm công ngày ${formatIsoToVN(targetDate)}`
    );
    showToast(
      `Đã gửi nhắc nhở tới ${unchecked.length} nhân viên chưa chấm công!`,
      `Ngày ${formatIsoToVN(targetDate)}: Thông báo đẩy trên App và Email nhắc chấm công đã được gửi đi.`
    );
    return unchecked.length;
  };

  const approveOrRejectRequest = (requestId: string, status: RequestStatus) => {
    if (!canApproveRequests(currentAccount.roleId)) {
      showToast('Không có quyền duyệt đơn!', 'Vai trò hiện tại không có quyền phê duyệt hoặc từ chối đơn từ.', 'warning');
      return;
    }

    const target = requests.find((r) => r.id === requestId);
    if (!target) return;

    if (target.status !== 'Đang chờ') {
      showToast('Đơn từ đã được xử lý!', `Đơn này đã ở trạng thái "${target.status}".`, 'info');
      return;
    }

    if (target.employeeId === currentAccount.employeeId && currentAccount.roleId !== 'super_admin') {
      showToast(
        'Không thể tự phê duyệt đơn của chính mình!',
        'Đơn từ cá nhân cần được Quản lý cấp trên hoặc phòng Nhân sự phê duyệt.',
        'warning'
      );
      return;
    }

    const emp = employees.find((e) => e.id === target.employeeId);
    if (
      currentAccount.roleId === 'manager' &&
      currentAccount.department &&
      emp &&
      emp.department !== currentAccount.department
    ) {
      showToast('Ngoài phạm vi quản lý!', 'Bạn chỉ được duyệt đơn của nhân viên thuộc bộ phận mình.', 'warning');
      return;
    }

    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status } : r)));

    const days = target.days || calculateInclusiveDays(target.startDate, target.endDate);

    if (status === 'Từ chối') {
      if (target.type === 'Nghỉ phép năm') {
        setLeaveBalances((prev) =>
          prev.map((lb) =>
            lb.employeeId === target.employeeId
              ? { ...lb, pending: Math.max(0, lb.pending - days) }
              : lb
          )
        );
      }
    } else if (status === 'Đã duyệt') {
      if (target.type === 'Nghỉ phép năm') {
        setLeaveBalances((prev) =>
          prev.map((lb) =>
            lb.employeeId === target.employeeId
              ? {
                  ...lb,
                  used: lb.used + days,
                  pending: Math.max(0, lb.pending - days),
                }
              : lb
          )
        );
        // Remove conflicting shift assignments on approved leave dates
        setShiftAssignments((prev) =>
          prev.filter(
            (a) =>
              !(
                a.employeeId === target.employeeId &&
                isDateInLeaveRange(a.date, target.startDate, target.endDate)
              )
          )
        );
        // Update attendance records on approved leave dates
        setAttendanceRecords((prev) =>
          prev.map((r) =>
            r.employeeId === target.employeeId &&
            isDateInLeaveRange(r.date, target.startDate, target.endDate)
              ? { ...r, status: 'Nghỉ phép', lateMinutes: 0 }
              : r
          )
        );
      } else if (target.type === 'Nghỉ ốm') {
        setShiftAssignments((prev) =>
          prev.filter(
            (a) =>
              !(
                a.employeeId === target.employeeId &&
                isDateInLeaveRange(a.date, target.startDate, target.endDate)
              )
          )
        );
        setAttendanceRecords((prev) =>
          prev.map((r) =>
            r.employeeId === target.employeeId &&
            isDateInLeaveRange(r.date, target.startDate, target.endDate)
              ? { ...r, status: 'Nghỉ phép', lateMinutes: 0 }
              : r
          )
        );
      } else if (target.type === 'Đổi ca trực') {
        const isoDate = normalizeToIsoDate(target.startDate) || getTodayIsoDate();
        const nextShift: ShiftCode = target.targetShiftCode || 'chieu';
        setShiftAssignments((prev) => {
          const originalRequesterAssignment = prev.find(
            (a) => a.employeeId === target.employeeId && a.date === isoDate
          );
          const originalShiftCode: ShiftCode = originalRequesterAssignment?.shiftCode || 'chieu';
          let updated = prev.filter(
            (a) => !(a.employeeId === target.employeeId && a.date === isoDate)
          );
          updated.push({ employeeId: target.employeeId, date: isoDate, shiftCode: nextShift });

          // Also swap shift for swapWithEmployeeId if specified
          if (target.swapWithEmployeeId) {
            updated = updated.filter(
              (a) => !(a.employeeId === target.swapWithEmployeeId && a.date === isoDate)
            );
            updated.push({
              employeeId: target.swapWithEmployeeId,
              date: isoDate,
              shiftCode: originalShiftCode,
            });
          }
          return updated;
        });
      } else if (target.type === 'Bổ sung chấm công') {
        const isoDate = normalizeToIsoDate(target.startDate) || getTodayIsoDate();
        const cIn = target.checkInTime || '08:00';
        const cOut = target.checkOutTime || '17:30';
        setAttendanceRecords((prev) => {
          const exists = prev.some((r) => r.employeeId === target.employeeId && r.date === isoDate);
          if (exists) {
            return prev.map((r) =>
              r.employeeId === target.employeeId && r.date === isoDate
                ? {
                    ...r,
                    checkIn: cIn,
                    checkOut: cOut,
                    status: 'Đúng giờ',
                    lateMinutes: 0,
                    note: `Đã duyệt bổ sung công: ${target.reason}`,
                  }
                : r
            );
          }
          return [
            ...prev,
            {
              id: `ATT-${isoDate}-${target.employeeId}`,
              employeeId: target.employeeId,
              date: isoDate,
              shiftCode: 'hanh_chinh',
              checkIn: cIn,
              checkOut: cOut,
              status: 'Đúng giờ',
              lateMinutes: 0,
              otHours: 0,
              method: 'Chấm hộ',
              note: `Đã duyệt bổ sung công: ${target.reason}`,
            },
          ];
        });
      } else if (target.type === 'Đăng ký tăng ca') {
        const isoDate = normalizeToIsoDate(target.startDate) || getTodayIsoDate();
        const addedOt = target.otHours || 0;
        if (addedOt > 0) {
          setAttendanceRecords((prev) =>
            prev.map((r) =>
              r.employeeId === target.employeeId && r.date === isoDate
                ? { ...r, otHours: (r.otHours || 0) + addedOt }
                : r
            )
          );
        }
      } else if (target.type === 'Ứng lương nhanh') {
        const advanceAmt = Math.max(0, target.advanceAmount || 3000000);
        const targetPeriod = derivePeriodFromDate(target.startDate, '2026-10');
        const deductionItem: BonusDeductionItem = {
          id: `BD-ADV-${requestId}`,
          employeeId: target.employeeId,
          period: targetPeriod,
          type: 'Khấu trừ',
          title: `Tạm ứng lương nhanh qua App (${advanceAmt.toLocaleString('vi-VN')}đ)`,
          amount: advanceAmt,
          date: formatIsoToVN(getTodayIsoDate()),
        };
        setBonusDeductions((prev) => {
          const filtered = prev.filter((b) => b.id !== deductionItem.id);
          return [deductionItem, ...filtered];
        });
      }
    }

    addAuditLog(
      status === 'Đã duyệt' ? 'Duyệt đơn' : 'Từ chối đơn',
      'Đơn từ',
      `${target.type} · ${emp?.name || target.employeeId}`
    );
    showToast(
      `${status === 'Đã duyệt' ? 'Đã phê duyệt' : 'Đã từ chối'} đơn ${target.type}`,
      status === 'Đã duyệt' && target.type === 'Ứng lương nhanh'
        ? `Nhân viên: ${emp?.name} · Đã tự động ghi nhận khoản khấu trừ tạm ứng vào kỳ lương ${derivePeriodFromDate(target.startDate, '2026-10')}.`
        : status === 'Đã duyệt' && target.type === 'Đổi ca trực'
        ? `Nhân viên: ${emp?.name} · Đã tự động cập nhật ca trực mới trên Bảng phân ca.`
        : `Nhân viên: ${emp?.name || target.employeeId}`
    );
  };

  const createRequest = (req: Omit<LeaveOrOtRequest, 'id' | 'status' | 'createdAt'>): boolean => {
    const startIso = normalizeToIsoDate(req.startDate);
    const endIso = normalizeToIsoDate(req.endDate || req.startDate);
    if (startIso && endIso && startIso > endIso) {
      showToast(
        'Ngày kết thúc không hợp lệ!',
        'Ngày kết thúc đơn phải lớn hơn hoặc bằng ngày bắt đầu.',
        'warning'
      );
      return false;
    }

    const emp = employees.find((e) => e.id === req.employeeId);
    const computedDays = req.days ?? calculateInclusiveDays(req.startDate, req.endDate || req.startDate);

    if (req.type === 'Nghỉ phép năm') {
      const lb = leaveBalances.find((l) => l.employeeId === req.employeeId);
      if (lb) {
        const remaining = lb.annualQuota + lb.carriedOver - lb.used - lb.pending;
        if (!lb.allocated) {
          showToast(
            'Chưa được cấp phép năm!',
            'Nhân viên này chưa được cấp hạn mức phép năm 2026.',
            'warning'
          );
          return false;
        }
        if (computedDays > remaining) {
          showToast(
            'Vượt quá số dư phép năm khả dụng!',
            `Bạn yêu cầu nghỉ ${computedDays} ngày nhưng chỉ còn ${remaining} ngày phép khả dụng.`,
            'warning'
          );
          return false;
        }
      }
    }

    if (req.type === 'Ứng lương nhanh') {
      const amt = Number(req.advanceAmount) || 0;
      if (amt <= 0) {
        showToast('Số tiền ứng không hợp lệ!', 'Vui lòng nhập số tiền ứng lớn hơn 0đ.', 'warning');
        return false;
      }
      const maxAdvance = Math.round((emp?.baseSalary || 15000000) * 0.3);
      if (amt > maxAdvance) {
        showToast(
          'Vượt hạn mức ứng lương nhanh (EWA 30%)!',
          `Hạn mức ứng tối đa (30% lương cơ bản) là ${maxAdvance.toLocaleString('vi-VN')} ₫.`,
          'warning'
        );
        return false;
      }
    }

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const createdStamp = `${formatIsoToVN(getTodayIsoDate())} ${hh}:${mm}`;

    const newReq: LeaveOrOtRequest = {
      ...req,
      days:
        req.type === 'Nghỉ phép năm' || req.type === 'Nghỉ ốm' || req.type === 'Công tác'
          ? computedDays
          : req.days,
      reason: sanitizeTextInput(req.reason, 400),
      id: `REQ-${Date.now()}`,
      status: 'Đang chờ',
      createdAt: createdStamp,
    };

    setRequests((prev) => [newReq, ...prev]);

    if (req.type === 'Nghỉ phép năm') {
      setLeaveBalances((prev) =>
        prev.map((lb) =>
          lb.employeeId === req.employeeId
            ? { ...lb, pending: lb.pending + computedDays }
            : lb
        )
      );
    }

    addAuditLog('Tạo đơn từ', 'Đơn từ', `${req.type} · ${emp?.name || req.employeeId}`);
    showToast('Đã gửi đơn thành công!', `Loại đơn: ${req.type} · Đang chờ quản lý phê duyệt.`);
    return true;
  };

  const allocateAnnualLeave = (year: number) => {
    if (!canManageHR(currentAccount.roleId)) {
      showToast('Không có quyền cấp phép năm!', undefined, 'warning');
      return;
    }
    setLeaveBalances((prev) => {
      const existingIds = new Set(prev.filter((lb) => lb.year === year).map((lb) => lb.employeeId));
      const updated = prev.map((lb) =>
        lb.year === year ? { ...lb, carriedOver: Math.min(5, lb.carriedOver), allocated: true } : lb
      );
      const missingBalances: LeaveBalance[] = employees
        .filter((e) => !existingIds.has(e.id))
        .map((emp) => {
          const joinYear = parseInt(emp.joinDate.split('/')[2] || String(year), 10);
          const yearsWorked = Math.max(0, year - joinYear);
          const seniorityBonus = Math.floor(yearsWorked / 5);
          return {
            employeeId: emp.id,
            year,
            annualQuota: 12 + seniorityBonus,
            carriedOver: 0,
            used: 0,
            pending: 0,
            allocated: true,
          };
        });
      return [...updated, ...missingBalances];
    });
    addAuditLog('Cấp phép năm', 'Số dư phép', `Cấp phép năm ${year} cho toàn bộ nhân sự`);
    showToast(
      `Đã tính và cấp số dư phép năm ${year}!`,
      'Tự động cộng thêm phép thâm niên (5 năm +1 ngày) và chuyển phép tồn tối đa 5 ngày.'
    );
  };

  const saveEmployee = (emp: Employee) => {
    const existingEmp = employees.find((e) => e.id === emp.id);

    // RBAC protection: regular employees can only update their own contact details
    if (!canManageHR(currentAccount.roleId)) {
      if (emp.id !== currentAccount.employeeId || !existingEmp) {
        showToast('Không có quyền chỉnh sửa nhân sự!', 'Chỉ bộ phận Nhân sự hoặc Quản trị viên mới được thêm/sửa hồ sơ.', 'warning');
        return;
      }
    }

    if (emp.id === 'NV0000' && emp.status === 'Đã nghỉ') {
      showToast(
        'Không thể cho nghỉ việc Quản trị tối cao (NV0000)!',
        'Tài khoản Chủ chuỗi cửa hàng phuonghihi luôn phải ở trạng thái Đang làm việc.',
        'warning'
      );
      return;
    }

    const isSelfLimitedEdit = !canManageHR(currentAccount.roleId) && existingEmp;

    const sanitizedEmp: Employee = {
      ...emp,
      name: sanitizeTextInput(emp.name, 120),
      code: isSelfLimitedEdit ? existingEmp.code : sanitizeTextInput(emp.code, 30),
      email: sanitizeTextInput(emp.email, 120),
      phone: sanitizeTextInput(emp.phone, 30),
      notes: emp.notes ? sanitizeTextInput(emp.notes, 500) : emp.notes,
      department: isSelfLimitedEdit ? existingEmp.department : emp.department,
      position: isSelfLimitedEdit ? existingEmp.position : emp.position,
      status: isSelfLimitedEdit ? existingEmp.status : emp.status,
      allowRemote: isSelfLimitedEdit ? existingEmp.allowRemote : emp.allowRemote,
      baseSalary: isSelfLimitedEdit ? existingEmp.baseSalary : emp.baseSalary,
      allowance: isSelfLimitedEdit ? existingEmp.allowance : emp.allowance,
      dependents: isSelfLimitedEdit ? existingEmp.dependents : Math.max(0, Number(emp.dependents) || 0),
      contracts: isSelfLimitedEdit ? existingEmp.contracts : emp.contracts,
    };

    setEmployees((prev) => {
      const exists = prev.some((e) => e.id === sanitizedEmp.id);
      if (exists) {
        return prev.map((e) => (e.id === sanitizedEmp.id ? sanitizedEmp : e));
      }
      return [sanitizedEmp, ...prev];
    });

    if (sanitizedEmp.status === 'Đã nghỉ') {
      setAccounts((prev) =>
        prev.map((a) => (a.employeeId === sanitizedEmp.id ? { ...a, active: false } : a))
      );
    }

    // Ensure new employee gets a leave balance entry
    if (!existingEmp) {
      setLeaveBalances((prev) => {
        if (prev.some((lb) => lb.employeeId === sanitizedEmp.id)) return prev;
        return [
          ...prev,
          {
            employeeId: sanitizedEmp.id,
            year: 2026,
            annualQuota: 12,
            carriedOver: 0,
            used: 0,
            pending: 0,
            allocated: true,
          },
        ];
      });
    }

    addAuditLog('Cập nhật hồ sơ', 'Nhân sự', `${sanitizedEmp.name} (${sanitizedEmp.code})`);
    showToast(
      `Đã lưu hồ sơ nhân viên: ${sanitizedEmp.name}`,
      `Mã NV: ${sanitizedEmp.code} · Phòng ${sanitizedEmp.department}`
    );
  };

  const deleteEmployee = (employeeId: string) => {
    if (!canManageHR(currentAccount.roleId)) {
      showToast('Không có quyền xoá/cho nghỉ việc nhân sự!', undefined, 'warning');
      return;
    }
    const target = employees.find((e) => e.id === employeeId);
    if (!target) return;
    if (employeeId === 'NV0000') {
      showToast('Không thể chuyển trạng thái Đã nghỉ cho Chủ chuỗi / Quản trị tối cao (NV0000)!', undefined, 'warning');
      return;
    }
    if (employeeId === currentAccount.employeeId) {
      showToast('Không thể xoá hồ sơ của tài khoản đang đăng nhập!', undefined, 'warning');
      return;
    }
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { ...e, status: 'Đã nghỉ' } : e))
    );
    setAccounts((prev) =>
      prev.map((a) => (a.employeeId === employeeId ? { ...a, active: false } : a))
    );
    addAuditLog('Chuyển trạng thái Đã nghỉ', 'Nhân sự', `${target.name} (${target.code})`);
    showToast(
      `Đã chuyển trạng thái "${target.name}" sang Đã nghỉ`,
      'Đã tự động vô hiệu hoá tài khoản đăng nhập liên kết.'
    );
  };

  const importEmployees = (newEmps: Partial<Employee>[]) => {
    if (!canManageHR(currentAccount.roleId)) {
      showToast('Không có quyền nhập Excel nhân sự!', undefined, 'warning');
      return 0;
    }

    let addedCount = 0;
    const createdList: Employee[] = [];
    const existingCodes = new Set(employees.map((e) => e.code.toUpperCase()));
    let maxCodeNum = employees.reduce((max, e) => {
      const num = parseInt(e.code.replace(/\D/g, ''), 10);
      return Number.isFinite(num) && num > max ? num : max;
    }, 0);

    newEmps.forEach((raw, idx) => {
      let candidateCode = raw.code ? sanitizeTextInput(raw.code, 20).toUpperCase() : '';
      if (!candidateCode || existingCodes.has(candidateCode)) {
        maxCodeNum += 1;
        candidateCode = `NV${String(maxCodeNum).padStart(4, '0')}`;
      }
      existingCodes.add(candidateCode);

      const name = sanitizeTextInput(raw.name || `Nhân viên Mới ${idx + 1}`, 120);
      const joinDate = raw.joinDate || formatIsoToVN(getTodayIsoDate());
      const dept = VALID_DEPARTMENTS.includes(raw.department as DepartmentName)
        ? (raw.department as DepartmentName)
        : 'Kinh doanh';
      const status = VALID_STATUSES.includes(raw.status as EmployeeStatus)
        ? (raw.status as EmployeeStatus)
        : 'Thử việc';
      const baseSalary = Math.max(0, Number(raw.baseSalary) || 14000000);
      const allowance = Math.max(0, Number(raw.allowance) || 1200000);

      createdList.push({
        id: candidateCode,
        code: candidateCode,
        name,
        email: raw.email
          ? sanitizeTextInput(raw.email, 120)
          : `${candidateCode.toLowerCase()}@phuonghihi.vn`,
        phone: raw.phone ? sanitizeTextInput(String(raw.phone), 30) : '0901234567',
        dob: raw.dob || '15/05/1998',
        department: dept,
        position: (raw.position as Employee['position']) || 'Nhân viên',
        status,
        joinDate,
        allowRemote: Boolean(raw.allowRemote),
        avatarColor: 'bg-blue-100 text-blue-700',
        baseSalary,
        allowance,
        dependents: Math.max(0, Number(raw.dependents) || 0),
        bankAccount: raw.bankAccount || '',
        bankName: raw.bankName || 'Vietcombank',
        contracts: [
          {
            id: `HD-${candidateCode}`,
            contractNumber: `HĐLĐ-PH/${candidateCode}/2026`,
            contractType:
              status === 'Thử việc'
                ? 'Hợp đồng thử việc 2 tháng'
                : 'Hợp đồng không xác định thời hạn',
            startDate: joinDate,
            endDate: status === 'Thử việc' ? '31/12/2026' : 'Không thời hạn',
            baseSalary,
            allowance,
            dependents: 0,
            status: 'Còn hiệu lực',
          },
        ],
        documents: [],
        tasks: DEFAULT_ONBOARDING_TEMPLATE.map((t, tIdx) => ({
          id: `TASK-${candidateCode}-${tIdx}`,
          title: t,
          type: 'Nhận người mới',
          dueDate: joinDate,
          assignee: 'Đặng Thu Trang',
          completed: false,
        })),
        notes: 'Nhập từ danh sách file Excel.',
      });
      addedCount++;
    });

    if (createdList.length > 0) {
      setEmployees((prev) => [...createdList, ...prev]);
      setLeaveBalances((prev) => [
        ...prev,
        ...createdList.map((emp) => ({
          employeeId: emp.id,
          year: 2026,
          annualQuota: 12,
          carriedOver: 0,
          used: 0,
          pending: 0,
          allocated: true,
        })),
      ]);
      addAuditLog('Nhập Excel nhân sự', 'Nhân sự', `Đã nhập ${addedCount} nhân viên từ file Excel`);
      showToast(
        `Đã nhập thành công ${addedCount} nhân viên từ Excel!`,
        'Danh sách công việc nhận người mới và hạn mức phép đã được tự động khởi tạo.'
      );
    }
    return addedCount;
  };

  const generateChecklistTasks = (
    employeeId: string,
    type: 'Nhận người mới' | 'Tiễn người nghỉ'
  ) => {
    const templates =
      type === 'Nhận người mới' ? DEFAULT_ONBOARDING_TEMPLATE : DEFAULT_OFFBOARDING_TEMPLATE;
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const newTasks = templates.map((title, idx) => ({
      id: `TASK-${employeeId}-${Date.now()}-${idx}`,
      title,
      type,
      dueDate: emp.joinDate || formatIsoToVN(getTodayIsoDate()),
      assignee: 'Đặng Thu Trang',
      completed: false,
    }));

    setEmployees((prev) =>
      prev.map((e) =>
        e.id === employeeId ? { ...e, tasks: [...newTasks, ...e.tasks] } : e
      )
    );
    addAuditLog('Tạo danh sách việc', 'Nhân sự', `${type} · ${emp.name}`);
    showToast(
      `Đã dựng sẵn danh sách việc: ${type}`,
      `Giao tự động cho người phụ trách: Đặng Thu Trang (Nhân sự)`
    );
  };

  const toggleChecklistTask = (employeeId: string, taskId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    const task = emp?.tasks.find((t) => t.id === taskId);
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === employeeId
          ? {
              ...e,
              tasks: e.tasks.map((t) =>
                t.id === taskId ? { ...t, completed: !t.completed } : t
              ),
            }
          : e
      )
    );
    if (emp && task) {
      addAuditLog(
        task.completed ? 'Mở lại đầu việc' : 'Hoàn thành đầu việc',
        'Nhân sự',
        `${emp.name} · ${task.title}`
      );
    }
  };

  const computeEmployeeTimesheetRow = useCallback(
    (
      employeeId: string,
      period: string,
      existingRow?: MonthlyTimesheetRow,
      confirmedOverride?: boolean
    ): MonthlyTimesheetRow => {
      const standardDays = settings.standardWorkDays || 22;
      const periodAtt = attendanceRecords.filter(
        (r) => r.employeeId === employeeId && r.date.startsWith(period)
      );
      const checkedInRecords = periodAtt.filter((r) => Boolean(r.checkIn));
      const absentRecords = periodAtt.filter((r) => !r.checkIn && r.status === 'Vắng');
      const liveLateRecords = checkedInRecords.filter((r) => r.lateMinutes > 0);
      const liveLateMins = liveLateRecords.reduce((s, r) => s + r.lateMinutes, 0);
      const liveOtFromAtt = checkedInRecords.reduce((s, r) => s + (r.otHours || 0), 0);

      const approvedLeaves = requests.filter(
        (r) =>
          r.employeeId === employeeId &&
          r.status === 'Đã duyệt' &&
          (r.type === 'Nghỉ phép năm' || r.type === 'Nghỉ ốm') &&
          derivePeriodFromDate(r.startDate, period) === period
      );
      const approvedLeaveDays = approvedLeaves.reduce(
        (s, r) => s + (r.days || calculateInclusiveDays(r.startDate, r.endDate)),
        0
      );

      const approvedOtReqs = requests.filter(
        (r) =>
          r.employeeId === employeeId &&
          r.status === 'Đã duyệt' &&
          r.type === 'Đăng ký tăng ca' &&
          derivePeriodFromDate(r.startDate, period) === period
      );
      const approvedOtHours = approvedOtReqs.reduce((s, r) => s + (r.otHours || 0), 0);

      // If there are daily attendance records in this period (or no historical snapshot exists),
      // compute strictly from real attendanceRecords and approved requests.
      if (periodAtt.length > 0 || !existingRow) {
        const actualDays = checkedInRecords.reduce((sum, r) => {
          const tpl = shiftTemplates.find((s) => s.code === r.shiftCode);
          return sum + (tpl ? tpl.workDays : 1);
        }, 0);
        return {
          employeeId,
          period,
          standardDays,
          actualDays,
          paidLeaveDays: approvedLeaveDays,
          absentDays: absentRecords.length,
          lateCount: liveLateRecords.length,
          lateMinutes: liveLateMins,
          otHours: Math.max(liveOtFromAtt, approvedOtHours),
          confirmed: confirmedOverride ?? existingRow?.confirmed ?? false,
        };
      }

      // Historical closed periods (e.g. 2026-08, 2026-09) that only have monthly summary rows
      return {
        ...existingRow,
        standardDays,
        paidLeaveDays: Math.max(existingRow.paidLeaveDays, approvedLeaveDays),
        otHours: Math.max(existingRow.otHours, approvedOtHours),
        confirmed: confirmedOverride ?? existingRow.confirmed,
      };
    },
    [attendanceRecords, requests, settings.standardWorkDays, shiftTemplates]
  );

  const aggregateTimesheet = (period: string) => {
    const periodState = payrollPeriods.find((p) => p.period === period);
    if (periodState?.step2TimesheetLocked || periodState?.locked) {
      showToast(
        `Kỳ công ${period} đã chốt khoá!`,
        'Vui lòng mở khoá kỳ công trước khi chạy tổng hợp lại.',
        'warning'
      );
      return;
    }

    setTimesheets((prev) => {
      const updatedRows: MonthlyTimesheetRow[] = [];
      const existingMap = new Map(
        prev.filter((r) => r.period === period).map((r) => [r.employeeId, r])
      );

      employees.forEach((emp) => {
        if (emp.status === 'Đã nghỉ') return;
        const currentRow = existingMap.get(emp.id);
        updatedRows.push(computeEmployeeTimesheetRow(emp.id, period, currentRow));
      });

      const otherPeriods = prev.filter((r) => r.period !== period);
      return [...otherPeriods, ...updatedRows];
    });

    setPayrollPeriods((prev) => {
      const exists = prev.some((p) => p.period === period);
      if (exists) {
        return prev.map((p) => (p.period === period ? { ...p, step1TimesheetAggregated: true } : p));
      }
      return [
        ...prev,
        {
          period,
          step1TimesheetAggregated: true,
          step2TimesheetLocked: false,
          step3SalariesDeclared: !employees.some((e) => e.status !== 'Đã nghỉ' && e.baseSalary <= 0),
          step4PayrollCalculated: false,
          step5PayslipsPublished: false,
          locked: false,
        },
      ];
    });

    addAuditLog('Tổng hợp công', 'Bảng công', `Kỳ ${period}`);
    showToast(
      `Đã tổng hợp bảng công kỳ ${period}!`,
      'Tự động đối chiếu ngày công thực tế từ dữ liệu chấm công, phép năm đã duyệt, đi muộn và giờ tăng ca (OT).'
    );
  };

  const toggleConfirmTimesheet = (employeeId: string, period: string) => {
    const periodState = payrollPeriods.find((p) => p.period === period);
    if (periodState?.step2TimesheetLocked || periodState?.locked) {
      showToast(
        `Bảng công kỳ ${period} đã chốt khoá!`,
        'Không thể thay đổi trạng thái xác nhận khi kỳ công đã khoá.',
        'warning'
      );
      return;
    }

    const emp = employees.find((e) => e.id === employeeId);
    const existingRow = timesheets.find((r) => r.employeeId === employeeId && r.period === period);
    const nextConfirmed = existingRow ? !existingRow.confirmed : true;

    setTimesheets((prev) => {
      const exists = prev.some((r) => r.employeeId === employeeId && r.period === period);
      if (exists) {
        return prev.map((row) =>
          row.employeeId === employeeId && row.period === period
            ? { ...row, confirmed: !row.confirmed }
            : row
        );
      }
      return [
        ...prev,
        computeEmployeeTimesheetRow(employeeId, period, undefined, true),
      ];
    });

    addAuditLog(
      nextConfirmed ? 'Xác nhận bảng công' : 'Huỷ xác nhận công',
      'Bảng công',
      `${emp?.name || employeeId} · Kỳ ${period}`
    );
  };

  const lockTimesheetPeriod = (period: string) => {
    if (!canManageHR(currentAccount.roleId) && !canManagePayroll(currentAccount.roleId)) {
      showToast('Không có quyền chốt kỳ công!', undefined, 'warning');
      return;
    }
    setTimesheets((prev) =>
      prev.map((row) => (row.period === period ? { ...row, confirmed: true } : row))
    );
    setPayrollPeriods((prev) =>
      prev.map((p) =>
        p.period === period
          ? { ...p, step1TimesheetAggregated: true, step2TimesheetLocked: true }
          : p
      )
    );
    addAuditLog('Chốt kỳ công', 'Bảng công', `Chốt toàn bộ bảng công kỳ ${period}`);
    showToast(`Đã chốt kỳ công ${period}!`, 'Số liệu công đã được khoá để phục vụ tính lương.');
  };

  const unlockTimesheetPeriod = (period: string) => {
    if (!canManageHR(currentAccount.roleId) && currentAccount.roleId !== 'super_admin') {
      showToast('Chỉ Quản trị viên hoặc Nhân sự mới được mở khoá kỳ công!', undefined, 'warning');
      return;
    }
    const periodState = payrollPeriods.find((p) => p.period === period);
    if (periodState?.locked) {
      showToast(
        'Bảng lương kỳ này đang khoá!',
        'Vui lòng mở khoá bảng lương trước khi mở khoá kỳ công.',
        'warning'
      );
      return;
    }
    setPayrollPeriods((prev) =>
      prev.map((p) => (p.period === period ? { ...p, step2TimesheetLocked: false } : p))
    );
    addAuditLog('Mở khoá kỳ công', 'Bảng công', `Kỳ ${period}`);
    showToast(`Đã mở khoá kỳ công ${period}`, 'Bạn có thể điều chỉnh xác nhận và tổng hợp lại công.');
  };

  const declareBaseSalary = (employeeId: string, baseSalary: number, allowance?: number) => {
    if (!canManagePayroll(currentAccount.roleId) && !canManageHR(currentAccount.roleId)) {
      showToast('Không có quyền khai lương cơ bản!', undefined, 'warning');
      return;
    }
    const cleanSalary = Math.max(0, Number(baseSalary) || 0);
    if (cleanSalary <= 0) {
      showToast('Mức lương cơ bản phải lớn hơn 0đ!', undefined, 'warning');
      return;
    }

    const updatedList = employees.map((e) => {
      if (e.id !== employeeId) return e;
      const nextAllowance = allowance !== undefined ? Math.max(0, allowance) : e.allowance;
      return {
        ...e,
        baseSalary: cleanSalary,
        allowance: nextAllowance,
        contracts: e.contracts.map((c, idx) =>
          idx === 0 ? { ...c, baseSalary: cleanSalary, allowance: nextAllowance } : c
        ),
      };
    });

    setEmployees(updatedList);

    const anyMissing = updatedList.some((e) => e.status !== 'Đã nghỉ' && e.baseSalary <= 0);
    if (!anyMissing) {
      setPayrollPeriods((pp) => pp.map((p) => ({ ...p, step3SalariesDeclared: true })));
    }

    const emp = employees.find((e) => e.id === employeeId);
    addAuditLog(
      'Khai lương cơ bản',
      'Bảng lương',
      `${emp?.name || employeeId}: ${cleanSalary.toLocaleString('vi-VN')}đ`
    );
    showToast(
      `Đã khai lương cơ bản cho ${emp?.name || employeeId}!`,
      anyMissing
        ? 'Đã cập nhật mức lương cơ bản vào hồ sơ & hợp đồng.'
        : 'Tất cả nhân viên trong kỳ đã có đủ mức lương cơ bản.'
    );
  };

  const computePayrollRows = useCallback(
    (period: string): PayrollRow[] => {
      const activeEmps = scopedEmployees.filter((e) => e.status !== 'Đã nghỉ');
      const periodState = payrollPeriods.find((p) => p.period === period);
      const normalizedPeriod = normalizePeriodKey(period);

      return activeEmps.map((emp) => {
        const existingTs = timesheets.find((t) => t.employeeId === emp.id && t.period === period);
        const ts = computeEmployeeTimesheetRow(emp.id, period, existingTs);

        const hasDeclaredSalary = emp.baseSalary > 0;
        const baseSalary = hasDeclaredSalary ? emp.baseSalary : 0;
        const allowance = hasDeclaredSalary ? Math.max(0, emp.allowance || 0) : 0;
        const standardDays = Math.max(1, ts.standardDays || settings.standardWorkDays || 22);
        const dailySalary = baseSalary / standardDays;
        const hourlySalary = dailySalary / 8;

        // Evaluate tiered late penalties
        let latePenaltyAmount = 0;
        let lateDeductedDays = 0;
        const effectiveLateCount = Math.max(0, ts.lateCount - settings.graceLateCountPerMonth);

        if (
          hasDeclaredSalary &&
          settings.autoProcessLate &&
          effectiveLateCount > 0 &&
          ts.lateMinutes > 0
        ) {
          const avgMins = Math.max(1, Math.round(ts.lateMinutes / Math.max(1, ts.lateCount)));
          const matchedTier =
            settings.lateTiers.find(
              (tier) =>
                avgMins >= tier.fromMinutes &&
                (tier.toMinutes === null || avgMins <= tier.toMinutes)
            ) || settings.lateTiers[settings.lateTiers.length - 1];

          if (matchedTier) {
            if (matchedTier.action === 'Trừ tiền') {
              latePenaltyAmount = matchedTier.value * effectiveLateCount;
            } else if (matchedTier.action === 'Trừ công') {
              lateDeductedDays = matchedTier.value * effectiveLateCount;
              latePenaltyAmount = Math.round(dailySalary * lateDeductedDays);
            }
          }
        }

        // Split OT hours into Weekend OT vs Weekday OT
        const weekendAttOt = attendanceRecords
          .filter((r) => {
            if (r.employeeId !== emp.id || !r.date.startsWith(period) || !r.otHours) return false;
            const d = new Date(`${r.date}T00:00:00`);
            const dow = d.getDay();
            return dow === 0 || dow === 6;
          })
          .reduce((s, r) => s + r.otHours, 0);

        const weekendReqOt = requests
          .filter((r) => {
            if (
              r.employeeId !== emp.id ||
              r.status !== 'Đã duyệt' ||
              r.type !== 'Đăng ký tăng ca' ||
              derivePeriodFromDate(r.startDate, period) !== period ||
              !r.otHours
            ) {
              return false;
            }
            const iso = normalizeToIsoDate(r.startDate);
            if (!iso) return false;
            const dow = new Date(`${iso}T00:00:00`).getDay();
            return dow === 0 || dow === 6;
          })
          .reduce((s, r) => s + (r.otHours || 0), 0);

        const weekendOtHours = Math.min(ts.otHours, Math.max(weekendAttOt, weekendReqOt));
        const weekdayOtHours = Math.max(0, ts.otHours - weekendOtHours);

        const payableDays = Math.min(standardDays, Math.max(0, ts.actualDays + ts.paidLeaveDays));
        const proRatedSalary = hasDeclaredSalary ? Math.round(dailySalary * payableDays) : 0;
        const otAmount = hasDeclaredSalary
          ? Math.round(
              hourlySalary *
                (weekdayOtHours * settings.otMultiplierWeekday +
                  weekendOtHours * settings.otMultiplierWeekend)
            )
          : 0;

        const empBonuses = bonusDeductions
          .filter(
            (b) =>
              b.employeeId === emp.id &&
              normalizePeriodKey(b.period) === normalizedPeriod &&
              b.type === 'Thưởng'
          )
          .reduce((sum, b) => sum + b.amount, 0);

        const empDeductions = bonusDeductions
          .filter(
            (b) =>
              b.employeeId === emp.id &&
              normalizePeriodKey(b.period) === normalizedPeriod &&
              b.type === 'Khấu trừ'
          )
          .reduce((sum, b) => sum + b.amount, 0);

        const grossIncome = proRatedSalary + allowance + otAmount + empBonuses;
        const maxInsSalary = settings.maxInsuranceSalary || 46800000;
        const insurableSalary = Math.min(baseSalary, maxInsSalary);
        const insuranceAmount = hasDeclaredSalary
          ? Math.round((insurableSalary * settings.insuranceRateEmployee) / 100)
          : 0;

        // Personal Income Tax (Thuế TNCN lũy tiến 7 bậc)
        const familyDeduction =
          settings.personalTaxDeduction + (emp.dependents || 0) * settings.dependentTaxDeduction;
        const taxableIncome = Math.max(0, grossIncome - insuranceAmount - familyDeduction);
        const taxAmount = hasDeclaredSalary ? calculateProgressivePIT(taxableIncome) : 0;

        const netSalary = hasDeclaredSalary
          ? Math.max(
              0,
              grossIncome - insuranceAmount - taxAmount - latePenaltyAmount - empDeductions
            )
          : 0;

        return {
          employeeId: emp.id,
          period,
          baseSalary: emp.baseSalary,
          allowance,
          standardDays,
          actualDays: ts.actualDays,
          paidLeaveDays: ts.paidLeaveDays,
          otHours: ts.otHours,
          otAmount,
          proRatedSalary,
          bonus: empBonuses,
          lateCount: ts.lateCount,
          lateMinutes: ts.lateMinutes,
          latePenaltyAmount,
          lateDeductedDays,
          otherDeduction: empDeductions,
          insuranceAmount,
          taxAmount,
          netSalary,
          payslipPublished: Boolean(periodState?.step5PayslipsPublished),
          emailSent: Boolean(periodState?.step5PayslipsPublished && settings.autoSendPayslipEmail),
        };
      });
    },
    [
      scopedEmployees,
      payrollPeriods,
      timesheets,
      settings,
      bonusDeductions,
      attendanceRecords,
      requests,
      computeEmployeeTimesheetRow,
    ]
  );

  const calculatePayrollForPeriod = (period: string) => {
    if (!canManagePayroll(currentAccount.roleId)) {
      showToast('Không có quyền chạy tính lương!', undefined, 'warning');
      return;
    }
    const periodState = payrollPeriods.find((p) => p.period === period);
    if (periodState?.locked) {
      showToast('Bảng lương kỳ này đã khoá!', 'Vui lòng mở khoá bảng lương trước khi tính lại.', 'warning');
      return;
    }
    const missingSalaryEmps = employees.filter((e) => e.status !== 'Đã nghỉ' && e.baseSalary <= 0);
    if (missingSalaryEmps.length > 0) {
      showToast(
        `Còn ${missingSalaryEmps.length} nhân sự chưa khai lương cơ bản!`,
        `Vui lòng khai lương cho "${missingSalaryEmps[0].name}" ở Bước 3 trước khi tính lương.`,
        'warning'
      );
      return;
    }

    setPayrollPeriods((prev) => {
      const exists = prev.some((p) => p.period === period);
      if (exists) {
        return prev.map((p) =>
          p.period === period
            ? { ...p, step3SalariesDeclared: true, step4PayrollCalculated: true }
            : p
        );
      }
      return [
        ...prev,
        {
          period,
          step1TimesheetAggregated: true,
          step2TimesheetLocked: false,
          step3SalariesDeclared: true,
          step4PayrollCalculated: true,
          step5PayslipsPublished: false,
          locked: false,
        },
      ];
    });
    addAuditLog('Tính lương', 'Bảng lương', `${period}`);
    showToast(
      `Đã tính xong bảng lương kỳ ${period}!`,
      'Đã tự động tính BHXH (10.5%), Thuế TNCN 7 bậc, Tăng ca (ngày thường/cuối tuần) và Khấu trừ đi muộn.'
    );
  };

  const publishPayslipsForPeriod = (period: string) => {
    if (!canManagePayroll(currentAccount.roleId)) {
      showToast('Không có quyền phát hành phiếu lương!', undefined, 'warning');
      return;
    }
    const periodState = payrollPeriods.find((p) => p.period === period);
    if (periodState?.locked) {
      showToast('Bảng lương kỳ này đã khoá!', 'Vui lòng mở khoá bảng lương trước khi phát hành lại.', 'warning');
      return;
    }
    const missingSalaryEmps = employees.filter((e) => e.status !== 'Đã nghỉ' && e.baseSalary <= 0);
    if (missingSalaryEmps.length > 0) {
      showToast(
        `Còn ${missingSalaryEmps.length} nhân sự chưa khai lương cơ bản!`,
        `Vui lòng hoàn tất khai lương cho "${missingSalaryEmps[0].name}" ở Bước 3 trước khi chốt phát hành phiếu lương.`,
        'warning'
      );
      return;
    }

    const activeCount = employees.filter((e) => e.status !== 'Đã nghỉ').length;
    setPayrollPeriods((prev) =>
      prev.map((p) =>
        p.period === period
          ? {
              ...p,
              step3SalariesDeclared: true,
              step4PayrollCalculated: true,
              step5PayslipsPublished: true,
            }
          : p
      )
    );
    addAuditLog('Phát hành phiếu lương', 'Bảng lương', `Kỳ ${period} (${activeCount} phiếu)`);
    showToast(
      `Đã chốt & phát hành ${activeCount} phiếu lương kỳ ${period}!`,
      settings.autoSendPayslipEmail
        ? 'Đã tạo PDF phiếu lương và gửi email tự động tới từng nhân viên.'
        : 'Phiếu lương đã được xuất bản lên cổng thông tin của từng nhân viên.'
    );
  };

  const toggleLockPayrollPeriod = (period: string) => {
    if (!canManagePayroll(currentAccount.roleId)) {
      showToast('Không có quyền khoá/mở khoá bảng lương!', undefined, 'warning');
      return;
    }
    const target = payrollPeriods.find((p) => p.period === period);
    const nextLocked = !target?.locked;
    setPayrollPeriods((prev) =>
      prev.map((p) => (p.period === period ? { ...p, locked: nextLocked } : p))
    );
    addAuditLog(
      nextLocked ? 'Khoá bảng lương' : 'Mở khoá bảng lương',
      'Bảng lương',
      period
    );
    showToast(
      nextLocked ? `Đã khoá bảng lương kỳ ${period}` : `Đã mở khoá bảng lương kỳ ${period}`,
      nextLocked
        ? 'Số liệu lương đã được bảo vệ, không thể chỉnh sửa.'
        : 'Bạn có thể cập nhật và tính lại bảng lương.'
    );
  };

  const addBonusDeduction = (item: Omit<BonusDeductionItem, 'id'>) => {
    if (!canManagePayroll(currentAccount.roleId)) {
      showToast('Không có quyền thêm thưởng/khấu trừ!', undefined, 'warning');
      return;
    }
    const normalizedPeriod = normalizePeriodKey(item.period);
    const periodState = payrollPeriods.find((p) => p.period === normalizedPeriod);
    if (periodState?.locked) {
      showToast(
        `Bảng lương kỳ ${normalizedPeriod} đang khoá!`,
        'Vui lòng mở khoá bảng lương trước khi thêm khoản thưởng/khấu trừ.',
        'warning'
      );
      return;
    }
    const cleanTitle = sanitizeTextInput(item.title, 200);
    const newItem: BonusDeductionItem = {
      ...item,
      period: normalizedPeriod,
      title: cleanTitle,
      id: `BD-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    };
    setBonusDeductions((prev) => [newItem, ...prev]);
    const emp = employees.find((e) => e.id === item.employeeId);
    addAuditLog(
      `Thêm ${item.type.toLowerCase()}`,
      'Bảng lương',
      `${emp?.name || item.employeeId} · ${cleanTitle}`
    );
    showToast(`Đã thêm khoản ${item.type}`, `${emp?.name}: ${cleanTitle}`);
  };

  const addSalesCommissionBatch = (
    period: string,
    items: {
      employeeId: string;
      iphoneCount: number;
      appleCareCount: number;
      installmentCount: number;
    }[]
  ): number => {
    if (!canManagePayroll(currentAccount.roleId)) {
      showToast('Không có quyền áp dụng hoa hồng doanh số!', undefined, 'warning');
      return 0;
    }
    const normalizedPeriod = normalizePeriodKey(period);
    const periodState = payrollPeriods.find((p) => p.period === normalizedPeriod);
    if (periodState?.locked) {
      showToast(
        `Bảng lương kỳ ${normalizedPeriod} đang khoá!`,
        'Vui lòng mở khoá bảng lương trước khi áp dụng hoa hồng.',
        'warning'
      );
      return 0;
    }

    const newRecords: BonusDeductionItem[] = [];
    const updatedEmpIds = new Set<string>();
    let totalCommission = 0;

    items.forEach((entry, idx) => {
      const iphoneAmt = Math.max(0, entry.iphoneCount) * 150000;
      const appleCareAmt = Math.max(0, entry.appleCareCount) * 200000;
      const installmentAmt = Math.max(0, entry.installmentCount) * 80000;
      const sum = iphoneAmt + appleCareAmt + installmentAmt;
      if (sum <= 0) return;

      updatedEmpIds.add(entry.employeeId);
      totalCommission += sum;
      newRecords.push({
        id: `BD-COMM-${normalizedPeriod}-${entry.employeeId}-${idx}`,
        employeeId: entry.employeeId,
        period: normalizedPeriod,
        type: 'Thưởng',
        title: `Hoa hồng bán lẻ: ${entry.iphoneCount} máy iPhone + ${entry.appleCareCount} gói AppleCare+ + ${entry.installmentCount} HS trả góp`,
        amount: sum,
        date: formatIsoToVN(getTodayIsoDate()),
      });
    });

    if (newRecords.length > 0) {
      setBonusDeductions((prev) => {
        // Remove previous retail commission batch for the same employee + period to avoid duplicate stacking
        const withoutOldComm = prev.filter(
          (b) =>
            !(
              normalizePeriodKey(b.period) === normalizedPeriod &&
              updatedEmpIds.has(b.employeeId) &&
              (b.id.startsWith('BD-COMM-') || b.title.startsWith('Hoa hồng bán lẻ:'))
            )
        );
        return [...newRecords, ...withoutOldComm];
      });
      addAuditLog(
        'Tính hoa hồng bán iPhone',
        'Bảng lương',
        `Kỳ ${normalizedPeriod} · ${newRecords.length} nhân sự kinh doanh/kỹ thuật · Tổng ${totalCommission.toLocaleString('vi-VN')}đ`
      );
      showToast(
        `Đã áp dụng hoa hồng bán iPhone cho ${newRecords.length} nhân viên!`,
        `Tổng thưởng hoa hồng: ${totalCommission.toLocaleString('vi-VN')} ₫ đã cập nhật vào Bước 4.`
      );
    }
    return newRecords.length;
  };

  const updateSettings = (newSettings: SystemSettings) => {
    if (!canManageSettings(currentAccount.roleId)) {
      showToast('Không có quyền thay đổi cài đặt hệ thống!', undefined, 'warning');
      return;
    }
    setSettings(newSettings);
    addAuditLog('Đổi cấu hình', 'Cài đặt', 'attendance & payroll');
    showToast(
      'Đã lưu thay đổi cài đặt hệ thống!',
      'Quy tắc chấm công, địa điểm GPS, bậc phạt đi muộn và tham số lương đã được cập nhật.'
    );
  };

  const saveAnnouncement = (ann: Omit<Announcement, 'id' | 'createdAt'> & { id?: string }) => {
    const cleanTitle = sanitizeTextInput(ann.title, 200);
    const cleanContent = sanitizeTextInput(ann.content, 2000);
    if (ann.id) {
      setAnnouncements((prev) =>
        prev.map((item) =>
          item.id === ann.id ? { ...item, ...ann, title: cleanTitle, content: cleanContent } : item
        )
      );
      addAuditLog('Sửa thông báo', 'Bản tin nội bộ', cleanTitle);
      showToast('Đã cập nhật thông báo nội bộ', cleanTitle);
    } else {
      const newAnn: Announcement = {
        ...ann,
        title: cleanTitle,
        content: cleanContent,
        id: `NEWS-${Date.now()}`,
        createdAt: formatIsoToVN(getTodayIsoDate()),
      };
      setAnnouncements((prev) => [newAnn, ...prev]);
      addAuditLog('Đăng thông báo', 'Bản tin nội bộ', cleanTitle);
      showToast('Đã đăng thông báo lên Bản tin nội bộ!', cleanTitle);
    }
  };

  const deleteAnnouncement = (id: string) => {
    const target = announcements.find((a) => a.id === id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    if (target) {
      addAuditLog('Gỡ thông báo', 'Bản tin nội bộ', target.title);
      showToast('Đã gỡ thông báo khỏi bản tin', target.title, 'info');
    }
  };

  const togglePinAnnouncement = (id: string) => {
    const target = announcements.find((a) => a.id === id);
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a))
    );
    if (target) {
      addAuditLog(
        target.pinned ? 'Bỏ ghim thông báo' : 'Ghim thông báo',
        'Bản tin nội bộ',
        target.title
      );
    }
  };

  const addAccount = (acc: Omit<UserAccount, 'id'>) => {
    if (!canManageSettings(currentAccount.roleId)) {
      showToast('Chỉ Quản trị cao nhất mới được cấp tài khoản!', undefined, 'warning');
      return;
    }
    const cleanName = sanitizeTextInput(acc.name, 100);
    const cleanUsername = sanitizeTextInput(acc.username, 60);
    const newAcc: UserAccount = {
      ...acc,
      name: cleanName,
      username: cleanUsername.startsWith('@') ? cleanUsername : `@${cleanUsername}`,
      pin: acc.pin?.trim() || '123456',
      id: `ACC-${Date.now()}`,
    };
    setAccounts((prev) => [...prev, newAcc]);
    addAuditLog('Cấp tài khoản', 'Phân quyền', `${cleanName} (${newAcc.username})`);
    showToast(`Đã cấp tài khoản cho ${cleanName}`, `Vai trò: ${acc.dataScope}`);
  };

  const updateAccount = (acc: UserAccount) => {
    if (!canManageSettings(currentAccount.roleId)) {
      showToast('Chỉ Quản trị cao nhất mới được sửa quyền tài khoản!', undefined, 'warning');
      return;
    }
    const cleanName = sanitizeTextInput(acc.name, 100);
    const cleanUsername = sanitizeTextInput(acc.username, 60);
    const updated: UserAccount = {
      ...acc,
      name: cleanName,
      username: cleanUsername.startsWith('@') ? cleanUsername : `@${cleanUsername}`,
    };
    setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    addAuditLog('Cập nhật tài khoản', 'Phân quyền', `${cleanName} (${updated.dataScope})`);
    showToast(`Đã cập nhật tài khoản ${cleanName}`, `Phạm vi: ${updated.dataScope}`);
  };

  const deleteAccount = (id: string) => {
    if (!canManageSettings(currentAccount.roleId)) {
      showToast('Chỉ Quản trị cao nhất mới được xoá tài khoản!', undefined, 'warning');
      return;
    }
    if (id === currentAccount.id) {
      showToast('Không thể xoá tài khoản đang đăng nhập!', undefined, 'warning');
      return;
    }
    const target = accounts.find((a) => a.id === id);
    if (!target) return;
    if (target.roleId === 'super_admin') {
      const activeAdmins = accounts.filter((a) => a.roleId === 'super_admin' && a.active);
      if (activeAdmins.length <= 1) {
        showToast('Không thể xoá tài khoản Quản trị cao nhất duy nhất!', undefined, 'warning');
        return;
      }
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    addAuditLog('Xoá tài khoản', 'Phân quyền', `${target.name} (${target.username})`);
    showToast(`Đã xoá tài khoản ${target.name}`, undefined, 'info');
  };

  const toggleAccountStatus = (id: string) => {
    if (!canManageSettings(currentAccount.roleId)) {
      showToast('Chỉ Quản trị cao nhất mới được khoá/mở khoá tài khoản!', undefined, 'warning');
      return;
    }
    if (id === currentAccount.id) {
      showToast(
        'Không thể tự khoá tài khoản đang đăng nhập!',
        'Vui lòng dùng tài khoản quản trị khác nếu cần vô hiệu hoá tài khoản này.',
        'warning'
      );
      return;
    }
    const target = accounts.find((a) => a.id === id);
    if (!target) return;
    const nextActive = !target.active;
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: nextActive } : a))
    );
    addAuditLog(
      nextActive ? 'Mở khoá tài khoản' : 'Khoá tài khoản',
      'Phân quyền',
      `${target.name} (${target.username})`
    );
    showToast(
      nextActive ? `Đã kích hoạt lại tài khoản ${target.name}` : `Đã khoá tài khoản ${target.name}`,
      target.username,
      nextActive ? 'success' : 'info'
    );
  };

  const resetDemoData = () => {
    if (!canManageSettings(currentAccount.roleId)) {
      showToast('Chỉ Quản trị viên hệ thống mới được khôi phục dữ liệu mẫu!', undefined, 'warning');
      return;
    }
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore storage errors
    }
    setEmployees(INITIAL_EMPLOYEES);
    setShiftAssignments(INITIAL_SHIFT_ASSIGNMENTS);
    setAttendanceRecords(INITIAL_ATTENDANCE_RECORDS);
    setRequests(INITIAL_REQUESTS);
    setLeaveBalances(INITIAL_LEAVE_BALANCES);
    setTimesheets(INITIAL_TIMESHEETS);
    setPayrollPeriods(INITIAL_PAYROLL_PERIODS);
    setBonusDeductions(INITIAL_BONUS_DEDUCTIONS);
    setSettings(INITIAL_SETTINGS);
    setAccounts(INITIAL_ACCOUNTS);
    setCurrentAccountId(INITIAL_ACCOUNTS[0].id);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    showToast('Đã khôi phục dữ liệu mẫu ban đầu!', 'Toàn bộ 51 nhân sự và cấu hình đã về mặc định.');
  };

  return (
    <HRMContext.Provider
      value={{
        activeTab,
        setActiveTab,
        employees,
        scopedEmployees,
        shiftTemplates,
        shiftAssignments,
        attendanceRecords,
        selectedAttendanceDate,
        setSelectedAttendanceDate,
        requests,
        leaveBalances,
        timesheets,
        payrollPeriods,
        bonusDeductions,
        settings,
        accounts,
        currentAccount,
        auditLogs,
        announcements,
        toasts,
        showToast,
        dismissToast,
        isSyncingBackend,
        lastSyncedAt,
        syncNowWithBackend,
        pullStateFromBackend,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isDoorQrModalOpen,
        setIsDoorQrModalOpen,
        selectedEmployeeId,
        setSelectedEmployeeId,
        pendingAuthAccountId,
        setPendingAuthAccountId,
        switchAccount,
        assignShift,
        bulkAssignShifts,
        autoScheduleWeekWithAI,
        hasApprovedLeaveOnDate,
        checkInOrOut,
        proxyCheckIn,
        remindUncheckedEmployees,
        approveOrRejectRequest,
        createRequest,
        allocateAnnualLeave,
        saveEmployee,
        deleteEmployee,
        importEmployees,
        generateChecklistTasks,
        toggleChecklistTask,
        aggregateTimesheet,
        toggleConfirmTimesheet,
        lockTimesheetPeriod,
        unlockTimesheetPeriod,
        declareBaseSalary,
        calculatePayrollForPeriod,
        publishPayslipsForPeriod,
        toggleLockPayrollPeriod,
        addBonusDeduction,
        addSalesCommissionBatch,
        computePayrollRows,
        updateSettings,
        saveAnnouncement,
        deleteAnnouncement,
        togglePinAnnouncement,
        addAccount,
        updateAccount,
        deleteAccount,
        toggleAccountStatus,
        addAuditLog,
        resetDemoData,
      }}
    >
      {children}
    </HRMContext.Provider>
  );
};

export function useHRM(): HRMContextType {
  const ctx = useContext(HRMContext);
  if (!ctx) throw new Error('useHRM must be used within an HRMProvider');
  return ctx;
}
