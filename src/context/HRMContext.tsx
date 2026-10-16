import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Announcement,
  AttendanceRecord,
  AuditLogEntry,
  BonusDeductionItem,
  Employee,
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

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'warning';
}

interface HRMContextType {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  employees: Employee[];
  scopedEmployees: Employee[];
  shiftTemplates: ShiftTemplate[];
  shiftAssignments: ShiftAssignment[];
  attendanceRecords: AttendanceRecord[];
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
  // Modals
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isDoorQrModalOpen: boolean;
  setIsDoorQrModalOpen: (open: boolean) => void;
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;
  // Actions
  switchAccount: (accountId: string) => void;
  assignShift: (employeeId: string, date: string, shiftCode: ShiftCode | null) => void;
  bulkAssignShifts: (employeeIds: string[], dates: string[], shiftCode: ShiftCode | null) => void;
  checkInOrOut: (params: {
    employeeId: string;
    method: NonNullable<AttendanceRecord['method']>;
    distanceMeters?: number;
    gpsAccuracy?: number;
    photoUrl?: string;
    note?: string;
  }) => void;
  proxyCheckIn: (params: {
    employeeId: string;
    shiftCode: ShiftCode;
    checkIn: string;
    checkOut: string;
    reason: string;
  }) => void;
  remindUncheckedEmployees: () => number;
  approveOrRejectRequest: (requestId: string, status: RequestStatus) => void;
  createRequest: (req: Omit<LeaveOrOtRequest, 'id' | 'status' | 'createdAt'>) => void;
  allocateAnnualLeave: (year: number) => void;
  saveEmployee: (emp: Employee) => void;
  importEmployees: (newEmps: Partial<Employee>[]) => number;
  generateChecklistTasks: (employeeId: string, type: 'Nhận người mới' | 'Tiễn người nghỉ') => void;
  toggleChecklistTask: (employeeId: string, taskId: string) => void;
  aggregateTimesheet: (period: string) => void;
  toggleConfirmTimesheet: (employeeId: string, period: string) => void;
  lockTimesheetPeriod: (period: string) => void;
  declareBaseSalary: (employeeId: string, baseSalary: number, allowance?: number) => void;
  calculatePayrollForPeriod: (period: string) => void;
  publishPayslipsForPeriod: (period: string) => void;
  toggleLockPayrollPeriod: (period: string) => void;
  addBonusDeduction: (item: Omit<BonusDeductionItem, 'id'>) => void;
  computePayrollRows: (period: string) => PayrollRow[];
  updateSettings: (newSettings: SystemSettings) => void;
  saveAnnouncement: (ann: Omit<Announcement, 'id' | 'createdAt'> & { id?: string }) => void;
  deleteAnnouncement: (id: string) => void;
  togglePinAnnouncement: (id: string) => void;
  addAccount: (acc: Omit<UserAccount, 'id'>) => void;
  toggleAccountStatus: (id: string) => void;
  addAuditLog: (action: string, targetType: string, targetDetail: string, actor?: string) => void;
  resetDemoData: () => void;
}

const STORAGE_KEY = 'phuonghihi_hrm_state_v2';

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

  const [activeTab, setActiveTab] = useState<NavTabId>(initialTab);
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

  // Global UI states
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isDoorQrModalOpen, setIsDoorQrModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Persist changes
  useEffect(() => savePersisted('employees', employees), [employees]);
  useEffect(() => savePersisted('shiftAssignments', shiftAssignments), [shiftAssignments]);
  useEffect(() => savePersisted('attendanceRecords', attendanceRecords), [attendanceRecords]);
  useEffect(() => savePersisted('requests', requests), [requests]);
  useEffect(() => savePersisted('leaveBalances', leaveBalances), [leaveBalances]);
  useEffect(() => savePersisted('timesheets', timesheets), [timesheets]);
  useEffect(() => savePersisted('payrollPeriods', payrollPeriods), [payrollPeriods]);
  useEffect(() => savePersisted('bonusDeductions', bonusDeductions), [bonusDeductions]);
  useEffect(() => savePersisted('settings', settings), [settings]);
  useEffect(() => savePersisted('accounts', accounts), [accounts]);
  useEffect(() => savePersisted('currentAccountId', currentAccountId), [currentAccountId]);
  useEffect(() => savePersisted('auditLogs', auditLogs), [auditLogs]);
  useEffect(() => savePersisted('announcements', announcements), [announcements]);

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

  const currentAccount = useMemo(
    () => accounts.find((a) => a.id === currentAccountId) || accounts[0],
    [accounts, currentAccountId]
  );

  // Scoped employees based on RBAC role & department
  const scopedEmployees = useMemo(() => {
    if (currentAccount.dataScope === 'Toàn hệ thống') {
      return employees;
    }
    if (currentAccount.dataScope === 'Chỉ phòng ban mình' && currentAccount.department) {
      return employees.filter((e) => e.department === currentAccount.department);
    }
    if (currentAccount.dataScope === 'Của bản thân') {
      return employees.filter((e) => e.id === currentAccount.employeeId);
    }
    return employees;
  }, [employees, currentAccount]);

  const showToast = (
    title: string,
    description?: string,
    type: ToastMessage['type'] = 'success'
  ) => {
    const id = `TOAST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const formatNowTimestamp = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm} 09/10/2026`;
  };

  const addAuditLog = (
    action: string,
    targetType: string,
    targetDetail: string,
    actor?: string
  ) => {
    const newEntry: AuditLogEntry = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: formatNowTimestamp(),
      actor: actor || currentAccount.email || 'admin@phuonghihi',
      action,
      targetType,
      targetDetail,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const switchAccount = (accountId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return;
    setCurrentAccountId(accountId);
    if (target.roleId === 'door_kiosk') {
      setIsDoorQrModalOpen(true);
    }
    showToast(
      `Đã chuyển sang tài khoản: ${target.name}`,
      `Phạm vi dữ liệu: ${target.dataScope}${target.department ? ` (${target.department})` : ''}`,
      'info'
    );
  };

  const assignShift = (employeeId: string, date: string, shiftCode: ShiftCode | null) => {
    setShiftAssignments((prev) => {
      const filtered = prev.filter((a) => !(a.employeeId === employeeId && a.date === date));
      if (!shiftCode) return filtered;
      return [...filtered, { employeeId, date, shiftCode }];
    });
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

  const checkInOrOut = ({
    employeeId,
    method,
    distanceMeters = 27,
    gpsAccuracy = 12,
    photoUrl,
    note,
  }: {
    employeeId: string;
    method: NonNullable<AttendanceRecord['method']>;
    distanceMeters?: number;
    gpsAccuracy?: number;
    photoUrl?: string;
    note?: string;
  }) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const emp = employees.find((e) => e.id === employeeId);

    setAttendanceRecords((prev) => {
      const existing = prev.find((r) => r.employeeId === employeeId && r.date === '2026-10-09');
      if (existing) {
        const isCheckingOut = Boolean(existing.checkIn && !existing.checkOut);
        return prev.map((r) =>
          r.id === existing.id
            ? {
                ...r,
                shiftCode: r.shiftCode || 'hanh_chinh',
                checkIn: r.checkIn || timeStr,
                checkOut: isCheckingOut ? timeStr : r.checkOut,
                status: r.status === 'Chưa chấm' || r.status === 'Không có ca' ? 'Đúng giờ' : r.status,
                method,
                distanceMeters,
                gpsAccuracy,
                photoUrl: photoUrl || r.photoUrl,
                note: note || r.note,
              }
            : r
        );
      }
      return [
        ...prev,
        {
          id: `ATT-2026-10-09-${employeeId}`,
          employeeId,
          date: '2026-10-09',
          shiftCode: 'hanh_chinh',
          checkIn: timeStr,
          status: 'Đúng giờ',
          lateMinutes: 0,
          otHours: 0,
          method,
          distanceMeters,
          gpsAccuracy,
          photoUrl,
          note,
        },
      ];
    });

    addAuditLog(
      'Chấm công',
      'Điểm danh',
      `${emp?.name || employeeId} · ${method} (${distanceMeters}m)`
    );
    showToast(
      `Chấm công thành công lúc ${timeStr}!`,
      `${emp?.name || employeeId} · Hình thức: ${method} (Cách văn phòng ${distanceMeters}m)`
    );
  };

  const proxyCheckIn = ({
    employeeId,
    shiftCode,
    checkIn,
    checkOut,
    reason,
  }: {
    employeeId: string;
    shiftCode: ShiftCode;
    checkIn: string;
    checkOut: string;
    reason: string;
  }) => {
    const emp = employees.find((e) => e.id === employeeId);
    setAttendanceRecords((prev) =>
      prev.map((r) =>
        r.employeeId === employeeId && r.date === '2026-10-09'
          ? {
              ...r,
              shiftCode,
              checkIn,
              checkOut,
              status: 'Đúng giờ',
              method: 'Chấm hộ',
              note: reason,
            }
          : r
      )
    );
    addAuditLog(
      'Chấm công hộ',
      'Điểm danh',
      `${emp?.name || employeeId} (${checkIn} - ${checkOut}) · Lý do: ${reason}`
    );
    showToast(
      `Đã chấm công hộ cho ${emp?.name || employeeId}`,
      `Giờ vào/ra: ${checkIn} - ${checkOut} · Đã ghi nhật ký hệ thống.`
    );
  };

  const remindUncheckedEmployees = () => {
    const unchecked = attendanceRecords.filter((r) => r.status === 'Chưa chấm');
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.status === 'Chưa chấm' ? { ...r, remindedAt: nowTime } : r))
    );
    addAuditLog(
      'Gửi nhắc chấm công',
      'Điểm danh',
      `Đã nhắc ${unchecked.length} nhân viên chưa chấm công ngày 09/10/2026`
    );
    showToast(
      `Đã gửi nhắc nhở tới ${unchecked.length} nhân viên chưa chấm công!`,
      'Thông báo đẩy trên App và Email nhắc chấm công đã được gửi đi.'
    );
    return unchecked.length;
  };

  const approveOrRejectRequest = (requestId: string, status: RequestStatus) => {
    const target = requests.find((r) => r.id === requestId);
    if (!target) return;
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status } : r)));

    if (status === 'Đã duyệt' && target.type === 'Nghỉ phép năm') {
      const days = target.days || 1;
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
    }

    const emp = employees.find((e) => e.id === target.employeeId);
    addAuditLog(
      status === 'Đã duyệt' ? 'Duyệt đơn' : 'Từ chối đơn',
      'Đơn từ',
      `${target.type} · ${emp?.name || target.employeeId}`
    );
    showToast(
      `${status === 'Đã duyệt' ? 'Đã phê duyệt' : 'Đã từ chối'} đơn ${target.type}`,
      `Nhân viên: ${emp?.name || target.employeeId}`
    );
  };

  const createRequest = (req: Omit<LeaveOrOtRequest, 'id' | 'status' | 'createdAt'>) => {
    const newReq: LeaveOrOtRequest = {
      ...req,
      id: `REQ-${Date.now()}`,
      status: 'Đang chờ',
      createdAt: '09/10/2026 15:45',
    };
    setRequests((prev) => [newReq, ...prev]);
    const emp = employees.find((e) => e.id === req.employeeId);
    addAuditLog('Tạo đơn từ', 'Đơn từ', `${req.type} · ${emp?.name || req.employeeId}`);
    showToast('Đã gửi đơn thành công!', `Loại đơn: ${req.type} · Đang chờ quản lý phê duyệt.`);
  };

  const allocateAnnualLeave = (year: number) => {
    setLeaveBalances((prev) =>
      prev.map((lb) => (lb.year === year ? { ...lb, allocated: true } : lb))
    );
    addAuditLog('Cấp phép năm', 'Số dư phép', `Cấp phép năm ${year} cho toàn bộ nhân sự`);
    showToast(
      `Đã tính và cấp số dư phép năm ${year}!`,
      'Tự động cộng thêm phép thâm niên (5 năm +1 ngày) và chuyển phép tồn tối đa 5 ngày.'
    );
  };

  const saveEmployee = (emp: Employee) => {
    setEmployees((prev) => {
      const exists = prev.some((e) => e.id === emp.id);
      if (exists) {
        return prev.map((e) => (e.id === emp.id ? emp : e));
      }
      return [emp, ...prev];
    });
    addAuditLog('Cập nhật hồ sơ', 'Nhân sự', `${emp.name} (${emp.code})`);
    showToast(`Đã lưu hồ sơ nhân viên: ${emp.name}`, `Mã NV: ${emp.code} · Phòng ${emp.department}`);
  };

  const importEmployees = (newEmps: Partial<Employee>[]) => {
    let addedCount = 0;
    const createdList: Employee[] = [];

    newEmps.forEach((raw, idx) => {
      const code = raw.code || `NV${String(employees.length + idx + 1).padStart(4, '0')}`;
      const name = raw.name || `Nhân viên Mới ${idx + 1}`;
      const joinDate = raw.joinDate || '10/10/2026';
      createdList.push({
        id: code,
        code,
        name,
        email: raw.email || `${code.toLowerCase()}@phuonghihi.vn`,
        phone: raw.phone || '0901234567',
        dob: raw.dob || '15/05/1998',
        department: (raw.department as Employee['department']) || 'Kinh doanh',
        position: (raw.position as Employee['position']) || 'Nhân viên',
        status: (raw.status as Employee['status']) || 'Thử việc',
        joinDate,
        allowRemote: Boolean(raw.allowRemote),
        avatarColor: 'bg-blue-100 text-blue-700',
        baseSalary: Number(raw.baseSalary) || 14000000,
        allowance: Number(raw.allowance) || 1200000,
        dependents: 0,
        contracts: [],
        documents: [],
        tasks: DEFAULT_ONBOARDING_TEMPLATE.map((t, tIdx) => ({
          id: `TASK-${code}-${tIdx}`,
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
      addAuditLog('Nhập Excel nhân sự', 'Nhân sự', `Đã nhập ${addedCount} nhân viên từ file Excel`);
      showToast(
        `Đã nhập thành công ${addedCount} nhân viên từ Excel!`,
        'Danh sách công việc nhận người mới đã được tự động khởi tạo.'
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
      dueDate: emp.joinDate || '15/10/2026',
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
  };

  const aggregateTimesheet = (period: string) => {
    setPayrollPeriods((prev) =>
      prev.map((p) => (p.period === period ? { ...p, step1TimesheetAggregated: true } : p))
    );
    addAuditLog('Tổng hợp công', 'Bảng công', `Kỳ ${period}`);
    showToast(
      `Đã tổng hợp bảng công kỳ ${period}!`,
      'Tự động đối chiếu ngày công thực tế, phép năm, đi muộn và giờ tăng ca (OT).'
    );
  };

  const toggleConfirmTimesheet = (employeeId: string, period: string) => {
    setTimesheets((prev) =>
      prev.map((row) =>
        row.employeeId === employeeId && row.period === period
          ? { ...row, confirmed: !row.confirmed }
          : row
      )
    );
  };

  const lockTimesheetPeriod = (period: string) => {
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

  const declareBaseSalary = (employeeId: string, baseSalary: number, allowance = 3000000) => {
    setEmployees((prev) => {
      const updated = prev.map((e) =>
        e.id === employeeId ? { ...e, baseSalary, allowance } : e
      );
      const anyMissing = updated.some((e) => e.status !== 'Đã nghỉ' && e.baseSalary <= 0);
      if (!anyMissing) {
        setPayrollPeriods((pp) =>
          pp.map((p) => ({ ...p, step3SalariesDeclared: true }))
        );
      }
      return updated;
    });
    const emp = employees.find((e) => e.id === employeeId);
    addAuditLog('Khai lương cơ bản', 'Bảng lương', `${emp?.name || employeeId}`);
    showToast(
      `Đã khai lương cơ bản cho ${emp?.name || employeeId}!`,
      'Tất cả nhân viên trong kỳ đã có đủ mức lương cơ bản.'
    );
  };

  const computePayrollRows = (period: string): PayrollRow[] => {
    const activeEmps = employees.filter((e) => e.status !== 'Đã nghỉ');
    const periodState = payrollPeriods.find((p) => p.period === period);

    return activeEmps.map((emp) => {
      const ts = timesheets.find((t) => t.employeeId === emp.id && t.period === period) || {
        standardDays: settings.standardWorkDays || 22,
        actualDays: 21,
        paidLeaveDays: 1,
        absentDays: 0,
        lateCount: 0,
        lateMinutes: 0,
        otHours: 0,
      };

      const baseSalary = emp.baseSalary || 25000000;
      const allowance = emp.allowance || 1500000;
      const dailySalary = baseSalary / ts.standardDays;
      const hourlySalary = dailySalary / 8;

      // Evaluate tiered late penalties
      let latePenaltyAmount = 0;
      let lateDeductedDays = 0;
      const effectiveLateCount = Math.max(0, ts.lateCount - settings.graceLateCountPerMonth);

      if (settings.autoProcessLate && effectiveLateCount > 0 && ts.lateMinutes > 0) {
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

      const payableDays = Math.max(0, ts.actualDays + ts.paidLeaveDays);
      const proRatedSalary = Math.round(dailySalary * payableDays);
      const otAmount = Math.round(ts.otHours * hourlySalary * settings.otMultiplierWeekday);

      const empBonuses = bonusDeductions
        .filter((b) => b.employeeId === emp.id && b.period === period && b.type === 'Thưởng')
        .reduce((sum, b) => sum + b.amount, 0);

      const empDeductions = bonusDeductions
        .filter((b) => b.employeeId === emp.id && b.period === period && b.type === 'Khấu trừ')
        .reduce((sum, b) => sum + b.amount, 0);

      const grossIncome = proRatedSalary + allowance + otAmount + empBonuses;
      const insuranceAmount = Math.round((baseSalary * settings.insuranceRateEmployee) / 100);

      // Personal Income Tax (Thuế TNCN)
      const familyDeduction =
        settings.personalTaxDeduction + emp.dependents * settings.dependentTaxDeduction;
      const taxableIncome = Math.max(0, grossIncome - insuranceAmount - familyDeduction);
      const taxAmount =
        taxableIncome <= 0
          ? 0
          : taxableIncome <= 5000000
          ? Math.round(taxableIncome * 0.05)
          : Math.round(250000 + (taxableIncome - 5000000) * 0.1);

      const netSalary = Math.max(
        0,
        grossIncome - insuranceAmount - taxAmount - latePenaltyAmount - empDeductions
      );

      return {
        employeeId: emp.id,
        period,
        baseSalary: emp.baseSalary,
        allowance,
        standardDays: ts.standardDays,
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
  };

  const calculatePayrollForPeriod = (period: string) => {
    setPayrollPeriods((prev) =>
      prev.map((p) => (p.period === period ? { ...p, step4PayrollCalculated: true } : p))
    );
    addAuditLog('Tính lương', 'Bảng lương', `${period}`);
    showToast(
      `Đã tính xong bảng lương kỳ ${period}!`,
      'Đã tự động tính BHXH (10.5%), Thuế TNCN, Tăng ca và Khấu trừ đi muộn theo bậc.'
    );
  };

  const publishPayslipsForPeriod = (period: string) => {
    setPayrollPeriods((prev) =>
      prev.map((p) =>
        p.period === period
          ? {
              ...p,
              step4PayrollCalculated: true,
              step5PayslipsPublished: true,
            }
          : p
      )
    );
    addAuditLog('Phát hành phiếu lương', 'Bảng lương', `Kỳ ${period} (49 phiếu)`);
    showToast(
      `Đã chốt & phát hành 49 phiếu lương kỳ ${period}!`,
      settings.autoSendPayslipEmail
        ? 'Đã tạo PDF phiếu lương và gửi email tự động tới từng nhân viên.'
        : 'Phiếu lương đã được xuất bản lên cổng thông tin của từng nhân viên.'
    );
  };

  const toggleLockPayrollPeriod = (period: string) => {
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
    const newItem: BonusDeductionItem = {
      ...item,
      id: `BD-${Date.now()}`,
    };
    setBonusDeductions((prev) => [newItem, ...prev]);
    const emp = employees.find((e) => e.id === item.employeeId);
    addAuditLog(
      `Thêm ${item.type.toLowerCase()}`,
      'Bảng lương',
      `${emp?.name || item.employeeId} · ${item.title}`
    );
    showToast(`Đã thêm khoản ${item.type}`, `${emp?.name}: ${item.title}`);
  };

  const updateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    addAuditLog('Đổi cấu hình', 'Cài đặt', 'attendance & payroll');
    showToast(
      'Đã lưu thay đổi cài đặt hệ thống!',
      'Quy tắc chấm công, địa điểm GPS và bậc phạt đi muộn đã được cập nhật.'
    );
  };

  const saveAnnouncement = (ann: Omit<Announcement, 'id' | 'createdAt'> & { id?: string }) => {
    if (ann.id) {
      setAnnouncements((prev) =>
        prev.map((item) => (item.id === ann.id ? { ...item, ...ann } : item))
      );
      addAuditLog('Sửa thông báo', 'Bản tin nội bộ', ann.title);
      showToast('Đã cập nhật thông báo nội bộ', ann.title);
    } else {
      const newAnn: Announcement = {
        ...ann,
        id: `NEWS-${Date.now()}`,
        createdAt: '09/10/2026',
      };
      setAnnouncements((prev) => [newAnn, ...prev]);
      addAuditLog('Đăng thông báo', 'Bản tin nội bộ', ann.title);
      showToast('Đã đăng thông báo lên Bản tin nội bộ!', ann.title);
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
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a))
    );
  };

  const addAccount = (acc: Omit<UserAccount, 'id'>) => {
    const newAcc: UserAccount = {
      ...acc,
      id: `ACC-${Date.now()}`,
    };
    setAccounts((prev) => [...prev, newAcc]);
    addAuditLog('Cấp tài khoản', 'Phân quyền', `${acc.name} (${acc.username})`);
    showToast(`Đã cấp tài khoản cho ${acc.name}`, `Vai trò: ${acc.dataScope}`);
  };

  const toggleAccountStatus = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const resetDemoData = () => {
    localStorage.clear();
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
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isDoorQrModalOpen,
        setIsDoorQrModalOpen,
        selectedEmployeeId,
        setSelectedEmployeeId,
        switchAccount,
        assignShift,
        bulkAssignShifts,
        checkInOrOut,
        proxyCheckIn,
        remindUncheckedEmployees,
        approveOrRejectRequest,
        createRequest,
        allocateAnnualLeave,
        saveEmployee,
        importEmployees,
        generateChecklistTasks,
        toggleChecklistTask,
        aggregateTimesheet,
        toggleConfirmTimesheet,
        lockTimesheetPeriod,
        declareBaseSalary,
        calculatePayrollForPeriod,
        publishPayslipsForPeriod,
        toggleLockPayrollPeriod,
        addBonusDeduction,
        computePayrollRows,
        updateSettings,
        saveAnnouncement,
        deleteAnnouncement,
        togglePinAnnouncement,
        addAccount,
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
