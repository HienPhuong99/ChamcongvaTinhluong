export type DepartmentName =
  | 'Phòng ban chung'
  | 'Nhân sự'
  | 'Kỹ thuật'
  | 'Kinh doanh'
  | 'Kế toán'
  | 'Vận hành'
  | 'Marketing';

export type EmployeeStatus = 'Chính thức' | 'Thử việc' | 'Tạm nghỉ' | 'Đã nghỉ';

export type RoleId =
  | 'super_admin'
  | 'hr'
  | 'accountant'
  | 'manager'
  | 'employee'
  | 'door_kiosk';

export interface OnboardingTask {
  id: string;
  title: string;
  type: 'Nhận người mới' | 'Tiễn người nghỉ';
  dueDate: string;
  assignee: string;
  completed: boolean;
}

export interface EmployeeDocument {
  id: string;
  name: string;
  category: 'Hợp đồng' | 'CCCD / Định danh' | 'Bằng cấp' | 'Khác';
  uploadedAt: string;
  fileSize: string;
  dataUrl?: string;
}

export interface EmployeeContract {
  id: string;
  contractNumber: string;
  contractType: 'Hợp đồng xác định thời hạn 12 tháng' | 'Hợp đồng không xác định thời hạn' | 'Hợp đồng thử việc 2 tháng';
  startDate: string;
  endDate: string;
  baseSalary: number;
  allowance: number;
  dependents: number;
  status: 'Còn hiệu lực' | 'Sắp hết hạn' | 'Hết hạn';
}

export interface Employee {
  id: string;
  code: string; // e.g., NV0001
  name: string;
  email: string;
  phone: string;
  dob: string; // DD/MM/YYYY
  department: DepartmentName;
  position: 'Quản trị viên' | 'Trưởng phòng' | 'Trưởng nhóm' | 'Nhân viên' | 'Thực tập sinh';
  status: EmployeeStatus;
  joinDate: string; // DD/MM/YYYY
  allowRemote: boolean;
  avatarColor: string;
  baseSalary: number; // 0 if not yet declared (like Quản lý cửa hàng phuonghihi)
  allowance: number;
  dependents: number;
  bankAccount?: string;
  bankName?: string;
  contracts: EmployeeContract[];
  documents: EmployeeDocument[];
  tasks: OnboardingTask[];
  notes: string;
}

export type ShiftCode = 'hanh_chinh' | 'sang' | 'chieu' | 'dem' | 'ca_gay';

export interface ShiftTemplate {
  code: ShiftCode;
  name: string; // Hành chính, Sáng, Chiều, Đêm, Ca gãy
  startTime: string; // 08:00
  endTime: string; // 17:30
  workDays: number; // 1.0 or 1.5
  color: string; // emerald, sky, amber, indigo, rose
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}

export interface ShiftAssignment {
  employeeId: string;
  date: string; // YYYY-MM-DD
  shiftCode: ShiftCode;
}

export type AttendanceStatus = 'Đúng giờ' | 'Đi muộn' | 'Chưa chấm' | 'Không có ca' | 'Nghỉ phép' | 'Vắng';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  shiftCode?: ShiftCode;
  checkIn?: string; // HH:mm
  checkOut?: string; // HH:mm
  status: AttendanceStatus;
  lateMinutes: number;
  otHours: number;
  method?: 'GPS' | 'QR tại cửa' | 'Từ xa' | 'Máy vân tay' | 'Chấm hộ';
  distanceMeters?: number;
  gpsAccuracy?: number;
  photoUrl?: string;
  note?: string;
  remindedAt?: string;
}

export type RequestType =
  | 'Công tác'
  | 'Nghỉ ốm'
  | 'Đăng ký tăng ca'
  | 'Bổ sung chấm công'
  | 'Đi muộn / về sớm'
  | 'Nghỉ phép năm'
  | 'Đổi ca trực'
  | 'Ứng lương nhanh';

export type RequestStatus = 'Đang chờ' | 'Đã duyệt' | 'Từ chối';

export interface LeaveOrOtRequest {
  id: string;
  employeeId: string;
  type: RequestType;
  startDate: string; // DD/MM/YYYY
  endDate: string; // DD/MM/YYYY
  reason: string;
  status: RequestStatus;
  createdAt: string;
  otHours?: number;
  checkInTime?: string;
  checkOutTime?: string;
  days?: number;
  swapWithEmployeeId?: string;
  swapShiftCode?: ShiftCode;
  targetShiftCode?: ShiftCode;
  advanceAmount?: number;
}

export interface LeaveBalance {
  employeeId: string;
  year: number;
  annualQuota: number; // 12 + seniority
  carriedOver: number; // max 5
  used: number;
  pending: number;
  allocated: boolean;
}

export interface MonthlyTimesheetRow {
  employeeId: string;
  period: string; // YYYY-MM e.g. '2026-10' or '2026-09'
  standardDays: number; // 22
  actualDays: number;
  paidLeaveDays: number;
  absentDays: number;
  lateCount: number;
  lateMinutes: number;
  otHours: number;
  confirmed: boolean;
}

export interface BonusDeductionItem {
  id: string;
  employeeId: string;
  period: string;
  type: 'Thưởng' | 'Khấu trừ';
  title: string;
  amount: number;
  date?: string;
}

export interface PayrollRow {
  employeeId: string;
  period: string; // YYYY-MM
  baseSalary: number;
  allowance: number;
  standardDays: number;
  actualDays: number;
  paidLeaveDays: number;
  otHours: number;
  otAmount: number;
  proRatedSalary: number;
  bonus: number;
  lateCount: number;
  lateMinutes: number;
  latePenaltyAmount: number;
  lateDeductedDays: number;
  otherDeduction: number;
  insuranceAmount: number; // 10.5%
  taxAmount: number; // PIT
  netSalary: number;
  payslipPublished: boolean;
  emailSent: boolean;
}

export interface PayrollPeriodState {
  period: string; // '2026-09' | '2026-10'
  step1TimesheetAggregated: boolean;
  step2TimesheetLocked: boolean;
  step3SalariesDeclared: boolean;
  step4PayrollCalculated: boolean;
  step5PayslipsPublished: boolean;
  locked: boolean;
}

export interface LatePenaltyTier {
  id: string;
  fromMinutes: number;
  toMinutes: number | null; // null = trở lên
  action: 'Nhắc nhở' | 'Trừ tiền' | 'Trừ công';
  value: number; // VND or workdays (e.g. 50000, 100000, 0.5)
}

export interface SystemSettings {
  // Hình thức chấm công
  gpsEnabled: boolean;
  requirePhotoOnGps: boolean;
  qrEnabled: boolean;
  qrScreen45s: boolean;
  qrPrintedAtDoor: boolean;
  qrManagerScanEmployee: boolean;
  remoteEnabled: boolean;
  biometricEnabled: boolean;
  manualProxyEnabled: boolean;
  // Địa điểm
  officeName: string;
  officeAddress: string;
  officeLat: number;
  officeLng: number;
  allowedRadiusMeters: number;
  // Đi muộn
  autoProcessLate: boolean;
  graceLateCountPerMonth: number;
  lateTiers: LatePenaltyTier[];
  // Quy tắc chấm
  allowEarlyCheckInMinutes: number;
  allowLateCheckOutMinutes: number;
  otMultiplierWeekday: number;
  otMultiplierWeekend: number;
  // Tính lương
  standardWorkDays: number;
  insuranceRateEmployee: number; // 10.5%
  maxInsuranceSalary?: number; // Trần đóng BHXH (20 x lương cơ sở = 46,800,000)
  personalTaxDeduction: number; // 11,000,000 hoặc 15,500,000
  dependentTaxDeduction: number; // 4,400,000 hoặc 6,200,000
  autoSendPayslipEmail: boolean;
  // Máy chấm công
  biometricDeviceName?: string;
  biometricDeviceIp?: string;
  // Đồng bộ Google Sheets & Backend API
  googleSheetsWebAppUrl: string;
  autoSyncGoogleSheets: boolean;
  apiSecretToken?: string;
}

export interface RoleDefinition {
  id: RoleId;
  name: string;
  permissionCount: number;
  scopeLabel: string;
  modules: string[];
  permissionsDetail: string[];
}

export interface UserAccount {
  id: string;
  employeeId: string;
  name: string;
  username: string;
  email: string;
  roleId: RoleId;
  dataScope: 'Toàn hệ thống' | 'Chỉ phòng ban mình' | 'Của bản thân' | 'Chỉ mở mã QR tại cửa';
  department?: DepartmentName;
  active: boolean;
  pin?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // HH:mm DD/MM/YYYY
  actor: string; // e.g., admin@phuonghihi or trigger@phuonghihi
  action: string; // Tính lương, Đổi cấu hình, Phân ca, Duyệt đơn, Chấm công vào...
  targetType: string; // Bảng lương, Cài đặt, Phân ca, Đơn từ...
  targetDetail: string; // 2026-09, attendance, Quản lý cửa hàng (phuonghihi) · 2026-10-18...
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  scope: 'Toàn công ty' | 'Một phòng ban';
  department?: DepartmentName;
  pinned: boolean;
  author: string;
  createdAt: string; // DD/MM/YYYY
  expiresAt?: string; // DD/MM/YYYY
}

export type NavTabId =
  | 'dashboard'
  | 'news'
  | 'employees'
  | 'shifts'
  | 'attendance'
  | 'requests'
  | 'timesheet'
  | 'payroll'
  | 'reports'
  | 'my_profile'
  | 'settings'
  | 'permissions'
  | 'audit_log'
  | 'mobile_app';
