import type {
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
  PayrollPeriodState,
  RoleDefinition,
  ShiftAssignment,
  ShiftCode,
  ShiftTemplate,
  SystemSettings,
  UserAccount,
} from '../types';

export const SHIFT_TEMPLATES: ShiftTemplate[] = [
  {
    code: 'hanh_chinh',
    name: 'Hành chính',
    startTime: '08:00',
    endTime: '17:30',
    workDays: 1.0,
    color: 'emerald',
    bgClass: 'bg-emerald-50 hover:bg-emerald-100',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  {
    code: 'sang',
    name: 'Sáng',
    startTime: '06:00',
    endTime: '14:00',
    workDays: 1.0,
    color: 'sky',
    bgClass: 'bg-sky-50 hover:bg-sky-100',
    textClass: 'text-sky-700',
    borderClass: 'border-sky-200',
    dotClass: 'bg-sky-500',
  },
  {
    code: 'chieu',
    name: 'Chiều',
    startTime: '14:00',
    endTime: '22:00',
    workDays: 1.0,
    color: 'amber',
    bgClass: 'bg-amber-50 hover:bg-amber-100',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-500',
  },
  {
    code: 'dem',
    name: 'Đêm',
    startTime: '22:00',
    endTime: '06:00',
    workDays: 1.0,
    color: 'indigo',
    bgClass: 'bg-indigo-50 hover:bg-indigo-100',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-200',
    dotClass: 'bg-indigo-500',
  },
  {
    code: 'ca_gay',
    name: 'Ca gãy',
    startTime: '08:00',
    endTime: '21:00',
    workDays: 1.5,
    color: 'rose',
    bgClass: 'bg-rose-50 hover:bg-rose-100',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-200',
    dotClass: 'bg-rose-500',
  },
];

export const DEFAULT_ONBOARDING_TEMPLATE = [
  'Chuẩn bị quầy làm việc, đồng phục và thẻ nhân viên phuonghihi',
  'Cấp tài khoản bán hàng phuonghihi (IMEI/Kho) và app Chấm công',
  'Ký hợp đồng lao động & cam kết bảo mật kho máy iPhone',
  'Nhận hồ sơ giấy tờ và số tài khoản ngân hàng nhận lương',
  'Đào tạo quy trình quét IMEI, tra bảo hành, thu cũ đổi mới 7 ngày',
];

export const DEFAULT_OFFBOARDING_TEMPLATE = [
  'Bàn giao ca trực, khách hàng và hợp đồng trả góp đang phụ trách',
  'Kiểm kê bàn giao kho máy iPhone, phụ kiện và thu hồi thẻ quầy',
  'Đăng xuất thiết bị từ xa (ThietBi) và khoá tài khoản phuonghihi',
  'Chốt công, hoa hồng bán máy, phép tồn và thanh lý hợp đồng',
];

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
];

interface RawEmpSeed {
  code: string;
  name: string;
  dept: DepartmentName;
  pos: Employee['position'];
  status: EmployeeStatus;
  joinDate: string;
  baseSalary: number;
  allowance: number;
}

const RAW_EMPLOYEES: RawEmpSeed[] = [
  { code: 'NV0000', name: 'Quản lý cửa hàng (phuonghihi)', dept: 'Phòng ban chung', pos: 'Quản trị viên', status: 'Chính thức', joinDate: '01/01/2020', baseSalary: 0, allowance: 3000000 },
  { code: 'NV0001', name: 'Nguyễn Minh Anh', dept: 'Nhân sự', pos: 'Trưởng phòng', status: 'Chính thức', joinDate: '10/03/2021', baseSalary: 22000000, allowance: 2500000 },
  { code: 'NV0002', name: 'Trần Thị Thu Hà', dept: 'Kỹ thuật', pos: 'Nhân viên', status: 'Chính thức', joinDate: '15/06/2021', baseSalary: 18500000, allowance: 1500000 },
  { code: 'NV0003', name: 'Lê Quang Huy', dept: 'Kinh doanh', pos: 'Trưởng nhóm', status: 'Chính thức', joinDate: '20/08/2021', baseSalary: 19000000, allowance: 2000000 },
  { code: 'NV0004', name: 'Phạm Ngọc Lan', dept: 'Kế toán', pos: 'Trưởng phòng', status: 'Chính thức', joinDate: '05/01/2021', baseSalary: 21000000, allowance: 2000000 },
  { code: 'NV0005', name: 'Nguyễn Văn Đức', dept: 'Vận hành', pos: 'Nhân viên', status: 'Chính thức', joinDate: '12/11/2021', baseSalary: 14500000, allowance: 1200000 },
  { code: 'NV0006', name: 'Hoàng Mai Chi', dept: 'Marketing', pos: 'Trưởng nhóm', status: 'Chính thức', joinDate: '01/04/2022', baseSalary: 17500000, allowance: 1500000 },
  { code: 'NV0007', name: 'Vũ Tuấn Kiệt', dept: 'Kỹ thuật', pos: 'Nhân viên', status: 'Chính thức', joinDate: '18/05/2022', baseSalary: 18000000, allowance: 1500000 },
  { code: 'NV0008', name: 'Đặng Thu Trang', dept: 'Nhân sự', pos: 'Trưởng nhóm', status: 'Chính thức', joinDate: '01/07/2021', baseSalary: 16500000, allowance: 1500000 },
  { code: 'NV0009', name: 'Bùi Minh Quân', dept: 'Kinh doanh', pos: 'Nhân viên', status: 'Chính thức', joinDate: '15/09/2022', baseSalary: 15000000, allowance: 1500000 },
  { code: 'NV0010', name: 'Vũ Hải Yến', dept: 'Kế toán', pos: 'Nhân viên', status: 'Chính thức', joinDate: '10/10/2022', baseSalary: 14000000, allowance: 1200000 },
  { code: 'NV0011', name: 'Đỗ Văn Nam', dept: 'Kỹ thuật', pos: 'Nhân viên', status: 'Chính thức', joinDate: '05/12/2022', baseSalary: 17000000, allowance: 1500000 },
  { code: 'NV0012', name: 'Bùi Anh Tuấn', dept: 'Vận hành', pos: 'Nhân viên', status: 'Chính thức', joinDate: '15/01/2023', baseSalary: 13500000, allowance: 1000000 },
  { code: 'NV0013', name: 'Trịnh Văn Long', dept: 'Kỹ thuật', pos: 'Nhân viên', status: 'Chính thức', joinDate: '01/02/2023', baseSalary: 16500000, allowance: 1200000 },
  { code: 'NV0014', name: 'Lê Ngọc Mai', dept: 'Marketing', pos: 'Nhân viên', status: 'Chính thức', joinDate: '14/02/2023', baseSalary: 14000000, allowance: 1000000 },
  { code: 'NV0015', name: 'Trần Quốc Bảo', dept: 'Kinh doanh', pos: 'Nhân viên', status: 'Chính thức', joinDate: '01/03/2023', baseSalary: 14500000, allowance: 1500000 },
  { code: 'NV0016', name: 'Ngô Thanh Tùng', dept: 'Kỹ thuật', pos: 'Trưởng nhóm', status: 'Chính thức', joinDate: '10/03/2020', baseSalary: 23000000, allowance: 2500000 },
  { code: 'NV0017', name: 'Lý Thu Thảo', dept: 'Nhân sự', pos: 'Nhân viên', status: 'Chính thức', joinDate: '22/04/2023', baseSalary: 13000000, allowance: 1000000 },
  { code: 'NV0018', name: 'Phan Minh Đức', dept: 'Vận hành', pos: 'Trưởng nhóm', status: 'Chính thức', joinDate: '15/05/2021', baseSalary: 17500000, allowance: 1800000 },
  { code: 'NV0019', name: 'Hồ Bích Ngọc', dept: 'Kế toán', pos: 'Nhân viên', status: 'Chính thức', joinDate: '01/06/2023', baseSalary: 14200000, allowance: 1200000 },
  { code: 'NV0020', name: 'Dương Gia Bảo', dept: 'Kinh doanh', pos: 'Nhân viên', status: 'Chính thức', joinDate: '12/07/2023', baseSalary: 13800000, allowance: 1500000 },
  { code: 'NV0021', name: 'Võ Hoài Nam', dept: 'Kỹ thuật', pos: 'Nhân viên', status: 'Chính thức', joinDate: '01/08/2023', baseSalary: 16800000, allowance: 1400000 },
  { code: 'NV0022', name: 'Đoàn Khánh Linh', dept: 'Marketing', pos: 'Nhân viên', status: 'Chính thức', joinDate: '19/08/2023', baseSalary: 13500000, allowance: 1000000 },
  { code: 'NV0023', name: 'Tạ Quang Minh', dept: 'Kỹ thuật', pos: 'Nhân viên', status: 'Chính thức', joinDate: '05/09/2023', baseSalary: 17200000, allowance: 1500000 },
  { code: 'NV0024', name: 'Lương Hải Đăng', dept: 'Vận hành', pos: 'Nhân viên', status: 'Chính thức', joinDate: '20/09/2023', baseSalary: 13000000, allowance: 1000000 },
  { code: 'NV0025', name: 'Cao Thị Tuyết', dept: 'Kinh doanh', pos: 'Nhân viên', status: 'Chính thức', joinDate: '02/10/2023', baseSalary: 14000000, allowance: 1500000 },
  { code: 'NV0026', name: 'Hà Minh Trí', dept: 'Kỹ thuật', pos: 'Nhân viên', status: 'Chính thức', joinDate: '15/11/2023', baseSalary: 16000000, allowance: 1200000 },
  { code: 'NV0027', name: 'Chu Phương Anh', dept: 'Marketing', pos: 'Nhân viên', status: 'Chính thức', joinDate: '01/12/2023', baseSalary: 13600000, allowance: 1000000 },
  { code: 'NV0028', name: 'Đinh Gia Hân', dept: 'Nhân sự', pos: 'Nhân viên', status: 'Chính thức', joinDate: '10/01/2024', baseSalary: 13200000, allowance: 1000000 },
  { code: 'NV0029', name: 'Đỗ Anh Khoa', dept: 'Kỹ thuật', pos: 'Nhân viên', status: 'Chính thức', joinDate: '01/02/2024', baseSalary: 17500000, allowance: 1500000 },
  { code: 'NV0030', name: 'Mai Tuấn Anh', dept: 'Vận hành', pos: 'Nhân viên', status: 'Chính thức', joinDate: '18/02/2024', baseSalary: 12800000, allowance: 1000000 },
  { code: 'NV0031', name: 'Lê Hải An', dept: 'Kinh doanh', pos: 'Nhân viên', status: 'Chính thức', joinDate: '05/03/2024', baseSalary: 14500000, allowance: 1500000 },
  { code: 'NV0032', name: 'Trần Quang An 32', dept: 'Kinh doanh', pos: 'Nhân viên', status: 'Chính thức', joinDate: '15/03/2024', baseSalary: 14800000, allowance: 1500000 },
  { code: 'NV0033', name: 'Nguyễn Thuỳ Dương', dept: 'Kế toán', pos: 'Nhân viên', status: 'Chính thức', joinDate: '01/04/2024', baseSalary: 13800000, allowance: 1200000 },
  { code: 'NV0034', name: 'Phạm Quang An 34', dept: 'Kế toán', pos: 'Nhân viên', status: 'Chính thức', joinDate: '20/04/2024', baseSalary: 14000000, allowance: 1200000 },
  { code: 'NV0035', name: 'Trương Quốc Khánh', dept: 'Kỹ thuật', pos: 'Nhân viên', status: 'Chính thức', joinDate: '02/05/2024', baseSalary: 16500000, allowance: 1500000 },
  { code: 'NV0036', name: 'Bùi Quang An 36', dept: 'Kỹ thuật', pos: 'Nhân viên', status: 'Chính thức', joinDate: '12/05/2024', baseSalary: 16200000, allowance: 1400000 },
  { code: 'NV0037', name: 'Đặng Quang An 37', dept: 'Vận hành', pos: 'Nhân viên', status: 'Chính thức', joinDate: '01/06/2024', baseSalary: 13500000, allowance: 1000000 },
  { code: 'NV0038', name: 'Lâm Bảo Ngọc', dept: 'Marketing', pos: 'Nhân viên', status: 'Chính thức', joinDate: '15/06/2024', baseSalary: 13200000, allowance: 1000000 },
  { code: 'NV0039', name: 'Đỗ Quang An 39', dept: 'Kinh doanh', pos: 'Nhân viên', status: 'Chính thức', joinDate: '01/07/2024', baseSalary: 14200000, allowance: 1500000 },
  { code: 'NV0040', name: 'Kiều Minh Tuấn', dept: 'Vận hành', pos: 'Nhân viên', status: 'Chính thức', joinDate: '18/07/2024', baseSalary: 13000000, allowance: 1000000 },
  { code: 'NV0041', name: 'Phùng Thanh Hằng', dept: 'Nhân sự', pos: 'Nhân viên', status: 'Chính thức', joinDate: '01/08/2024', baseSalary: 13000000, allowance: 1000000 },
  { code: 'NV0042', name: 'Bùi Thanh Sơn', dept: 'Nhân sự', pos: 'Nhân viên', status: 'Chính thức', joinDate: '15/08/2020', baseSalary: 16000000, allowance: 1500000 },
  // 6 Thử việc
  { code: 'NV0043', name: 'Vương Đình Hiếu', dept: 'Kỹ thuật', pos: 'Nhân viên', status: 'Thử việc', joinDate: '01/09/2026', baseSalary: 12000000, allowance: 800000 },
  { code: 'NV0044', name: 'Tô Ngọc Ánh', dept: 'Kinh doanh', pos: 'Nhân viên', status: 'Thử việc', joinDate: '05/09/2026', baseSalary: 11500000, allowance: 800000 },
  { code: 'NV0045', name: 'Hoàng Thu An 45', dept: 'Marketing', pos: 'Nhân viên', status: 'Thử việc', joinDate: '10/09/2026', baseSalary: 11000000, allowance: 800000 },
  { code: 'NV0046', name: 'Nghiêm Xuân Phúc', dept: 'Vận hành', pos: 'Nhân viên', status: 'Thử việc', joinDate: '15/09/2026', baseSalary: 11000000, allowance: 800000 },
  { code: 'NV0047', name: 'Đặng Thu An 47', dept: 'Kỹ thuật', pos: 'Trưởng nhóm', status: 'Thử việc', joinDate: '20/09/2026', baseSalary: 18000000, allowance: 1500000 },
  { code: 'NV0048', name: 'Bùi Thu An 48', dept: 'Marketing', pos: 'Nhân viên', status: 'Thử việc', joinDate: '25/09/2026', baseSalary: 11500000, allowance: 800000 },
  // 2 Tạm nghỉ / Đã nghỉ
  { code: 'NV0049', name: 'Đoàn Minh Khôi', dept: 'Vận hành', pos: 'Nhân viên', status: 'Tạm nghỉ', joinDate: '10/05/2023', baseSalary: 13000000, allowance: 1000000 },
  { code: 'NV0050', name: 'Đỗ Thu An 50', dept: 'Vận hành', pos: 'Nhân viên', status: 'Đã nghỉ', joinDate: '12/03/2022', baseSalary: 13500000, allowance: 1000000 },
];

export const INITIAL_EMPLOYEES: Employee[] = RAW_EMPLOYEES.map((raw, idx) => {
  const numStr = String(idx).padStart(2, '0');
  const emailPrefix = raw.code.toLowerCase();
  return {
    id: raw.code,
    code: raw.code,
    name: raw.name,
    email: `${emailPrefix}@phuonghihi.vn`,
    phone: `09003000${numStr}`,
    dob: `${String((idx % 28) + 1).padStart(2, '0')}/0${(idx % 9) + 1}/199${idx % 10}`,
    department: raw.dept,
    position: raw.pos,
    status: raw.status,
    joinDate: raw.joinDate,
    allowRemote: idx % 3 === 0,
    avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
    baseSalary: raw.baseSalary,
    allowance: raw.allowance,
    dependents: idx % 3 === 0 ? 1 : 0,
    bankAccount: `00710001234${numStr}`,
    bankName: 'Vietcombank',
    contracts: [
      {
        id: `HD-${raw.code}`,
        contractNumber: `HĐLĐ-PH/${raw.code}/2026`,
        contractType:
          raw.status === 'Thử việc'
            ? 'Hợp đồng thử việc 2 tháng'
            : 'Hợp đồng không xác định thời hạn',
        startDate: raw.joinDate,
        endDate: raw.status === 'Thử việc' ? '30/11/2026' : 'Không thời hạn',
        baseSalary: raw.baseSalary,
        allowance: raw.allowance,
        dependents: idx % 3 === 0 ? 1 : 0,
        status: 'Còn hiệu lực',
      },
    ],
    documents: [
      {
        id: `DOC-1-${raw.code}`,
        name: `CCCD_${raw.code}.pdf`,
        category: 'CCCD / Định danh',
        uploadedAt: raw.joinDate,
        fileSize: '1.2 MB',
      },
      {
        id: `DOC-2-${raw.code}`,
        name: `HopDongLaoDong_phuonghihi_${raw.code}.pdf`,
        category: 'Hợp đồng',
        uploadedAt: raw.joinDate,
        fileSize: '840 KB',
      },
    ],
    tasks: DEFAULT_ONBOARDING_TEMPLATE.map((title, tIdx) => ({
      id: `TASK-${raw.code}-${tIdx + 1}`,
      title,
      type: 'Nhận người mới',
      dueDate: raw.joinDate,
      assignee: 'Đặng Thu Trang',
      completed: raw.status === 'Chính thức' && raw.code !== 'NV0009' ? true : false,
    })),
    notes:
      raw.code === 'NV0009'
        ? 'Nhân viên tư vấn bán hàng iPhone chính hãng & phụ trách khách doanh nghiệp tại Cửa hàng phuonghihi (123 Lê Lợi, Q.1).'
        : 'Hồ sơ nhân sự phuonghihi đầy đủ, tuân thủ tốt nội quy ca trực cửa hàng (08:00 - 21:00).',
  };
});

// Generate weekly shift schedule covering Oct & Nov 2026 (28/09/2026 - 06/12/2026)
function buildInitialShiftAssignments(): ShiftAssignment[] {
  const assignments: ShiftAssignment[] = [];
  const dates = [
    // Week 1: 28/09 - 04/10
    '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04',
    // Week 2: 05/10 - 11/10
    '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11',
    // Week 3: 12/10 - 18/10
    '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18',
    // Week 4: 19/10 - 25/10
    '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25',
    // Week 5: 26/10 - 01/11
    '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01',
    // Week 6: 02/11 - 08/11
    '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08',
    // Week 7: 09/11 - 15/11
    '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15',
    // Week 8: 16/11 - 22/11
    '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22',
    // Week 9: 23/11 - 29/11
    '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29',
    // Week 10: 30/11 - 06/12
    '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05', '2026-12-06',
  ];

  const specificPatterns: Record<string, (ShiftCode | null)[]> = {
    NV0000: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', null, null],
    NV0001: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'ca_gay', 'hanh_chinh', null],
    NV0002: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'chieu', null, null],
    NV0003: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'dem', null, null],
    NV0004: ['sang', 'chieu', 'dem', 'sang', 'ca_gay', null, null],
    NV0005: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'chieu', null, null],
    NV0006: ['ca_gay', 'ca_gay', 'ca_gay', 'ca_gay', 'chieu', null, null],
    NV0007: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'ca_gay', null, null],
    NV0008: [null, 'chieu', 'sang', 'dem', 'dem', null, null],
    NV0009: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'chieu', null, null],
    NV0010: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'ca_gay', null, null],
    NV0011: ['sang', 'sang', 'chieu', 'chieu', 'chieu', null, null],
    NV0012: ['chieu', 'chieu', 'hanh_chinh', 'hanh_chinh', 'chieu', null, null],
    NV0013: ['hanh_chinh', 'sang', 'chieu', 'hanh_chinh', 'ca_gay', null, null],
    NV0014: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', null, null],
  };

  INITIAL_EMPLOYEES.forEach((emp, empIdx) => {
    if (emp.status === 'Đã nghỉ') return;
    dates.forEach((dateStr, dIdx) => {
      const dayOfWeek = dIdx % 7; // 0 = Mon .. 6 = Sun
      const pattern = specificPatterns[emp.code];
      if (pattern) {
        const sc = pattern[dayOfWeek];
        if (sc) {
          assignments.push({ employeeId: emp.id, date: dateStr, shiftCode: sc });
        }
      } else {
        // Other employees work Mon-Thu + Saturday rotation so Friday has exact 15 scheduled shifts
        if (dayOfWeek < 4 || dayOfWeek === 5) {
          const pool: ShiftCode[] = ['hanh_chinh', 'sang', 'chieu', 'ca_gay', 'dem'];
          const sc = pool[empIdx % pool.length];
          assignments.push({ employeeId: emp.id, date: dateStr, shiftCode: sc });
        }
      }
    });
  });

  return assignments;
}

export const INITIAL_SHIFT_ASSIGNMENTS: ShiftAssignment[] = buildInitialShiftAssignments();

function buildInitialAttendanceRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  // Past completed workdays in October 2026
  const completedDates = [
    '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-05',
    '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-10',
    '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15',
  ];
  // Active check-in dates (un-checked yet so user can test live check-in & reminders)
  const pendingDates = ['2026-10-09', '2026-10-16', '2026-10-17'];

  completedDates.forEach((dateStr, dIdx) => {
    INITIAL_EMPLOYEES.forEach((emp, empIdx) => {
      if (emp.status === 'Đã nghỉ') return;
      const assigned = INITIAL_SHIFT_ASSIGNMENTS.find(
        (a) => a.employeeId === emp.id && a.date === dateStr
      );
      if (!assigned) return;
      const tpl = SHIFT_TEMPLATES.find((s) => s.code === assigned.shiftCode) || SHIFT_TEMPLATES[0];
      const isLateSample = (empIdx + dIdx) % 9 === 0;
      const lateMins = isLateSample ? 12 : 0;
      const otHrs = (empIdx + dIdx) % 11 === 0 ? 1.5 : 0;
      const [sh, sm] = tpl.startTime.split(':').map(Number);
      const inTotal = sh * 60 + sm + lateMins;
      const inStr = `${String(Math.floor(inTotal / 60) % 24).padStart(2, '0')}:${String(inTotal % 60).padStart(2, '0')}`;
      records.push({
        id: `ATT-${dateStr}-${emp.code}`,
        employeeId: emp.id,
        date: dateStr,
        shiftCode: assigned.shiftCode,
        checkIn: inStr,
        checkOut: tpl.endTime,
        status: lateMins > 0 ? 'Đi muộn' : 'Đúng giờ',
        lateMinutes: lateMins,
        otHours: otHrs,
        method: empIdx % 3 === 0 ? 'QR tại cửa' : 'GPS',
        distanceMeters: 12 + (empIdx % 25),
        gpsAccuracy: 10,
      });
    });
  });

  pendingDates.forEach((dateStr) => {
    INITIAL_EMPLOYEES.forEach((emp) => {
      const assigned = INITIAL_SHIFT_ASSIGNMENTS.find(
        (a) => a.employeeId === emp.id && a.date === dateStr
      );
      if (assigned) {
        records.push({
          id: `ATT-${dateStr}-${emp.code}`,
          employeeId: emp.id,
          date: dateStr,
          shiftCode: assigned.shiftCode,
          status: 'Chưa chấm',
          lateMinutes: 0,
          otHours: 0,
        });
      } else {
        records.push({
          id: `ATT-${dateStr}-${emp.code}`,
          employeeId: emp.id,
          date: dateStr,
          status: 'Không có ca',
          lateMinutes: 0,
          otHours: 0,
        });
      }
    });
  });

  return records;
}

// Attendance records synced 100% with INITIAL_SHIFT_ASSIGNMENTS
export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = buildInitialAttendanceRecords();

export const INITIAL_REQUESTS: LeaveOrOtRequest[] = [
  {
    id: 'REQ-001',
    employeeId: 'NV0032',
    type: 'Công tác',
    startDate: '09/10/2026',
    endDate: '10/10/2026',
    reason: 'Giao lô máy iPhone 16 Pro Max cho Công ty TNHH Ánh Dương (88 Nguyễn Huệ, Q.1)',
    status: 'Đang chờ',
    createdAt: '08/10/2026 09:15',
    days: 2,
  },
  {
    id: 'REQ-002',
    employeeId: 'NV0036',
    type: 'Nghỉ ốm',
    startDate: '08/10/2026',
    endDate: '08/10/2026',
    reason: 'Lịch tái khám định kỳ',
    status: 'Đang chờ',
    createdAt: '07/10/2026 16:40',
    days: 1,
  },
  {
    id: 'REQ-003',
    employeeId: 'NV0011',
    type: 'Đăng ký tăng ca',
    startDate: '07/10/2026',
    endDate: '07/10/2026',
    reason: 'Kiểm kho IMEI lô iPhone mới nhập từ Nhà phân phối FPT & Digiworld',
    status: 'Đang chờ',
    createdAt: '07/10/2026 14:20',
    otHours: 3,
  },
  {
    id: 'REQ-004',
    employeeId: 'NV0014',
    type: 'Bổ sung chấm công',
    startDate: '06/10/2026',
    endDate: '06/10/2026',
    reason: 'Đứng quầy tư vấn khách thu cũ đổi mới iPhone, điện thoại hết pin chưa chấm vào',
    status: 'Đang chờ',
    createdAt: '06/10/2026 18:05',
    checkInTime: '08:00',
    checkOutTime: '17:30',
  },
  {
    id: 'REQ-005',
    employeeId: 'NV0045',
    type: 'Đi muộn / về sớm',
    startDate: '05/10/2026',
    endDate: '05/10/2026',
    reason: 'Kẹt xe đường Lê Lợi Quận 1 giờ cao điểm, đến cửa hàng muộn 10 phút',
    status: 'Đang chờ',
    createdAt: '05/10/2026 08:12',
  },
  {
    id: 'REQ-006',
    employeeId: 'NV0009',
    type: 'Bổ sung chấm công',
    startDate: '04/10/2026',
    endDate: '04/10/2026',
    reason: 'Bận lập hợp đồng trả góp cho khách lúc cuối ca nên quên chấm ra',
    status: 'Đang chờ',
    createdAt: '04/10/2026 20:10',
    checkInTime: '07:55',
    checkOutTime: '17:30',
  },
  {
    id: 'REQ-007',
    employeeId: 'NV0029',
    type: 'Đăng ký tăng ca',
    startDate: '12/09/2026',
    endDate: '12/09/2026',
    reason: 'Trực quầy kỹ thuật bảo hành iPhone ca tối tại 123 Lê Lợi',
    status: 'Đang chờ',
    createdAt: '12/09/2026 17:00',
    otHours: 2.5,
  },
  // Approved requests shown on Company Leave Calendar & Ctrl+K search
  {
    id: 'REQ-008',
    employeeId: 'NV0034',
    type: 'Nghỉ phép năm',
    startDate: '10/10/2026',
    endDate: '11/10/2026',
    reason: 'Nghỉ phép năm thăm gia đình',
    status: 'Đã duyệt',
    createdAt: '05/10/2026 10:00',
    days: 2,
  },
  {
    id: 'REQ-009',
    employeeId: 'NV0014',
    type: 'Nghỉ phép năm',
    startDate: '15/10/2026',
    endDate: '15/10/2026',
    reason: 'Giải quyết việc cá nhân',
    status: 'Đã duyệt',
    createdAt: '06/10/2026 11:00',
    days: 1,
  },
  {
    id: 'REQ-010',
    employeeId: 'NV0001',
    type: 'Đăng ký tăng ca',
    startDate: '19/09/2026',
    endDate: '19/09/2026',
    reason: 'Tổng hợp bảng công & hoa hồng bán máy cửa hàng phuonghihi',
    status: 'Đã duyệt',
    createdAt: '19/09/2026 18:00',
    otHours: 2,
  },
  {
    id: 'REQ-011',
    employeeId: 'NV0005',
    type: 'Nghỉ phép năm',
    startDate: '14/10/2026',
    endDate: '14/10/2026',
    reason: 'Nghỉ phép năm đưa người nhà đi khám sức khỏe định kỳ',
    status: 'Đã duyệt',
    createdAt: '08/10/2026 09:30',
    days: 1,
  },
  {
    id: 'REQ-012',
    employeeId: 'NV0004',
    type: 'Đổi ca trực',
    startDate: '13/10/2026',
    endDate: '13/10/2026',
    reason: 'Xin đổi từ Ca Chiều sang Ca Sáng ngày Thứ Ba 13/10 để nhận lô hàng phụ kiện Apple',
    status: 'Đang chờ',
    createdAt: '09/10/2026 10:15',
    targetShiftCode: 'sang',
    swapWithEmployeeId: 'NV0008',
  },
  {
    id: 'REQ-013',
    employeeId: 'NV0009',
    type: 'Ứng lương nhanh',
    startDate: '09/10/2026',
    endDate: '09/10/2026',
    reason: 'Ứng trước 3.000.000đ trên số công thực tế tích lũy trong tháng 10/2026 (EWA)',
    status: 'Đang chờ',
    createdAt: '09/10/2026 11:20',
    advanceAmount: 3000000,
  },
];

// Leave balances matching 00:31 in video (with seniority calculation and 1 unallocated person)
export const INITIAL_LEAVE_BALANCES: LeaveBalance[] = INITIAL_EMPLOYEES.map((emp, idx) => {
  const joinYear = parseInt(emp.joinDate.split('/')[2] || '2023', 10);
  const yearsWorked = Math.max(0, 2026 - joinYear);
  const seniorityBonus = Math.floor(yearsWorked / 5);
  const annualQuota = 12 + seniorityBonus;
  const carriedOver = idx % 4 === 0 ? 0 : (idx % 3);
  const used = (idx % 4) + 1;
  return {
    employeeId: emp.id,
    year: 2026,
    annualQuota,
    carriedOver,
    used,
    pending: idx === 32 ? 2 : 0,
    allocated: idx !== 0, // 1 người chưa được cấp phép năm 2026
  };
});

export function buildInitialTimesheets(): MonthlyTimesheetRow[] {
  const rows: MonthlyTimesheetRow[] = [];
  const periods = ['2026-10', '2026-09', '2026-08'];

  periods.forEach((period) => {
    INITIAL_EMPLOYEES.forEach((emp, idx) => {
      if (emp.status === 'Đã nghỉ') return;
      if (period === '2026-10') {
        const periodAtt = INITIAL_ATTENDANCE_RECORDS.filter(
          (r) => r.employeeId === emp.id && r.date.startsWith('2026-10') && Boolean(r.checkIn)
        );
        const actualDays = periodAtt.reduce((sum, r) => {
          const tpl = SHIFT_TEMPLATES.find((s) => s.code === r.shiftCode);
          return sum + (tpl ? tpl.workDays : 1);
        }, 0);
        const lateRecs = periodAtt.filter((r) => r.lateMinutes > 0);
        const lateMinutes = lateRecs.reduce((s, r) => s + r.lateMinutes, 0);
        const otHours = periodAtt.reduce((s, r) => s + (r.otHours || 0), 0);
        const approvedLeaves = INITIAL_REQUESTS.filter(
          (r) =>
            r.employeeId === emp.id &&
            r.status === 'Đã duyệt' &&
            (r.type === 'Nghỉ phép năm' || r.type === 'Nghỉ ốm') &&
            r.startDate.endsWith('/10/2026')
        );
        const paidLeaveDays = approvedLeaves.reduce((s, r) => s + (r.days || 1), 0);
        const pastScheduledShifts = INITIAL_SHIFT_ASSIGNMENTS.filter(
          (a) =>
            a.employeeId === emp.id &&
            a.date.startsWith('2026-10') &&
            a.date <= '2026-10-16'
        ).length;
        const absentDays = Math.max(0, pastScheduledShifts - periodAtt.length - paidLeaveDays);
        rows.push({
          employeeId: emp.id,
          period,
          standardDays: 22,
          actualDays,
          paidLeaveDays,
          absentDays,
          lateCount: lateRecs.length,
          lateMinutes,
          otHours,
          confirmed: idx % 2 === 0,
        });
      } else {
        rows.push({
          employeeId: emp.id,
          period,
          standardDays: 22,
          actualDays: 20 + (idx % 3) * 0.5,
          paidLeaveDays: idx % 3 === 0 ? 1 : 0,
          absentDays: idx % 7 === 0 ? 1 : 0,
          lateCount: idx % 4,
          lateMinutes: (idx % 4) * 14,
          otHours: idx % 5 === 0 ? 3 : idx % 3 === 0 ? 2 : 0,
          confirmed: true,
        });
      }
    });
  });

  return rows;
}

export const INITIAL_TIMESHEETS: MonthlyTimesheetRow[] = buildInitialTimesheets();

export const INITIAL_PAYROLL_PERIODS: PayrollPeriodState[] = [
  {
    period: '2026-09',
    step1TimesheetAggregated: true,
    step2TimesheetLocked: true,
    step3SalariesDeclared: false, // Shows "1 người chưa có lương cơ bản: Quản lý cửa hàng (phuonghihi)"
    step4PayrollCalculated: true,
    step5PayslipsPublished: true,
    locked: false,
  },
  {
    period: '2026-10',
    step1TimesheetAggregated: true,
    step2TimesheetLocked: false,
    step3SalariesDeclared: false,
    step4PayrollCalculated: false,
    step5PayslipsPublished: false,
    locked: false,
  },
  {
    period: '2026-08',
    step1TimesheetAggregated: true,
    step2TimesheetLocked: true,
    step3SalariesDeclared: true,
    step4PayrollCalculated: true,
    step5PayslipsPublished: true,
    locked: true,
  },
];

export const INITIAL_BONUS_DEDUCTIONS: BonusDeductionItem[] = [
  {
    id: 'BD-001',
    employeeId: 'NV0001',
    period: '2026-09',
    type: 'Thưởng',
    title: 'Thưởng hoàn thành KPI tuyển dụng & đào tạo nhân viên đứng quầy Q3',
    amount: 2000000,
  },
  {
    id: 'BD-002',
    employeeId: 'NV0003',
    period: '2026-09',
    type: 'Thưởng',
    title: 'Thưởng vượt doanh số bán iPhone 16 Pro Max & Bảo hành mở rộng',
    amount: 3500000,
  },
  {
    id: 'BD-003',
    employeeId: 'NV0009',
    period: '2026-09',
    type: 'Thưởng',
    title: 'Thưởng hoa hồng ký hợp đồng trả góp doanh nghiệp (Công ty CP Sao Việt)',
    amount: 1500000,
  },
];

export const INITIAL_SETTINGS: SystemSettings = {
  gpsEnabled: true,
  requirePhotoOnGps: true,
  qrEnabled: true,
  qrScreen45s: true,
  qrPrintedAtDoor: false,
  qrManagerScanEmployee: false,
  remoteEnabled: true,
  biometricEnabled: false,
  manualProxyEnabled: true,
  officeName: 'Cửa hàng phuonghihi (Quận 1)',
  officeAddress: '123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh (Hotline: 0900 300 300 · Mở cửa 08:00 - 21:00)',
  officeLat: 10.7728,
  officeLng: 106.6988,
  allowedRadiusMeters: 150,
  autoProcessLate: true,
  graceLateCountPerMonth: 1,
  graceLateMinutes: 5,
  lateTiers: [
    { id: 'TIER-1', fromMinutes: 1, toMinutes: 15, action: 'Nhắc nhở', value: 0 },
    { id: 'TIER-2', fromMinutes: 16, toMinutes: 30, action: 'Trừ tiền', value: 50000 },
    { id: 'TIER-3', fromMinutes: 31, toMinutes: 60, action: 'Trừ tiền', value: 100000 },
    { id: 'TIER-4', fromMinutes: 61, toMinutes: null, action: 'Trừ công', value: 0.5 },
  ],
  allowEarlyCheckInMinutes: 45,
  allowLateCheckOutMinutes: 120,
  otMultiplierWeekday: 1.5,
  otMultiplierWeekend: 2.0,
  demoGpsSimulationEnabled: false,
  standardWorkDays: 22,
  insuranceRateEmployee: 10.5,
  maxInsuranceSalary: 46800000,
  personalTaxDeduction: 15500000,
  dependentTaxDeduction: 6200000,
  autoSendPayslipEmail: true,
  biometricDeviceName: 'ZKTeco SenseFace 4A (Quầy thu ngân 123 Lê Lợi)',
  biometricDeviceIp: '192.168.1.201:4370',
  googleSheetsWebAppUrl: '',
  backendApiUrl: '',
  autoSyncGoogleSheets: false,
};

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: 'super_admin',
    name: 'Quản trị cao nhất',
    permissionCount: 6,
    scopeLabel: 'Toàn hệ thống',
    modules: ['Nhân sự', 'Ca & chấm công', 'Đơn từ', 'Bảng công', 'Lương', 'Báo cáo', 'Hệ thống'],
    permissionsDetail: [
      'Xem & chỉnh sửa toàn bộ hồ sơ nhân sự cửa hàng phuonghihi',
      'Xếp ca trực quầy (08:00 - 21:00), điểm danh, chấm công hộ toàn cửa hàng',
      'Duyệt mọi đơn từ & cấp số dư phép năm',
      'Tổng hợp công, chốt kỳ công, mở khoá bảng công',
      'Khai lương cơ bản, tính lương & hoa hồng bán máy, phát hành phiếu lương',
      'Thay đổi cài đặt hệ thống, phân quyền & xem nhật ký',
    ],
  },
  {
    id: 'hr',
    name: 'Nhân sự',
    permissionCount: 4,
    scopeLabel: 'Toàn hệ thống',
    modules: ['Nhân sự', 'Ca & chấm công', 'Đơn từ', 'Bảng công', 'Báo cáo'],
    permissionsDetail: [
      'Thêm, sửa hồ sơ nhân sự, hợp đồng & checklist nhận/trả việc tại phuonghihi',
      'Xếp ca làm việc & theo dõi điểm danh hàng ngày',
      'Duyệt đơn nghỉ phép, công tác, bổ sung công',
      'Tổng hợp bảng công cuối tháng & xuất báo cáo nhân sự',
    ],
  },
  {
    id: 'accountant',
    name: 'Kế toán',
    permissionCount: 4,
    scopeLabel: 'Toàn hệ thống',
    modules: ['Bảng công', 'Lương', 'Báo cáo'],
    permissionsDetail: [
      'Xem & đối chiếu bảng công đã chốt',
      'Khai lương cơ bản, phụ cấp, thưởng doanh số iPhone & khấu trừ',
      'Chạy tính lương 5 bước, tính BHXH & thuế TNCN',
      'Phát hành phiếu lương PDF & xuất Excel hạch toán Sổ quỹ phuonghihi',
    ],
  },
  {
    id: 'manager',
    name: 'Quản lý',
    permissionCount: 4,
    scopeLabel: 'Chỉ phòng ban mình',
    modules: ['Nhân sự', 'Ca & chấm công', 'Đơn từ', 'Bảng công', 'Báo cáo'],
    permissionsDetail: [
      'Chỉ xem danh sách nhân viên thuộc bộ phận/quầy mình quản lý',
      'Xếp ca & điểm danh cho nhân sự trong bộ phận',
      'Duyệt đơn xin nghỉ, tăng ca của nhân viên cấp dưới',
      'Xem bảng công và báo cáo hiệu suất bộ phận mình',
    ],
  },
  {
    id: 'employee',
    name: 'Nhân viên',
    permissionCount: 3,
    scopeLabel: 'Của bản thân',
    modules: ['Của bản thân'],
    permissionsDetail: [
      'Chấm công vào/ra bằng GPS tại 123 Lê Lợi hoặc mã QR trên điện thoại',
      'Xem lịch phân ca cá nhân, gửi đơn từ & theo dõi số dư phép',
      'Xác nhận bảng công tháng & xem phiếu lương cá nhân',
    ],
  },
  {
    id: 'door_kiosk',
    name: 'Thiết bị tại cửa',
    permissionCount: 1,
    scopeLabel: 'Chỉ mở mã QR tại cửa',
    modules: ['Chỉ mở mã QR tại cửa'],
    permissionsDetail: [
      'Chỉ hiển thị màn hình Kiosk Mã QR tại quầy thu ngân tự đổi mỗi 45 giây',
    ],
  },
];

export const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: 'ACC-001',
    employeeId: 'NV0000',
    name: 'Quản lý cửa hàng (phuonghihi)',
    username: '@admin',
    email: 'admin@phuonghihi.vn',
    roleId: 'super_admin',
    dataScope: 'Toàn hệ thống',
    active: true,
  },
  {
    id: 'ACC-002',
    employeeId: 'NV0001',
    name: 'Nguyễn Minh Anh',
    username: '@minhanh.hr',
    email: 'nv0001@phuonghihi.vn',
    roleId: 'hr',
    dataScope: 'Toàn hệ thống',
    department: 'Nhân sự',
    active: true,
  },
  {
    id: 'ACC-003',
    employeeId: 'NV0004',
    name: 'Phạm Ngọc Lan',
    username: '@ngoclan.kt',
    email: 'nv0004@phuonghihi.vn',
    roleId: 'accountant',
    dataScope: 'Toàn hệ thống',
    department: 'Kế toán',
    active: true,
  },
  {
    id: 'ACC-004',
    employeeId: 'NV0003',
    name: 'Lê Quang Huy',
    username: '@quanghuy.sales',
    email: 'nv0003@phuonghihi.vn',
    roleId: 'manager',
    dataScope: 'Chỉ phòng ban mình',
    department: 'Kinh doanh',
    active: true,
  },
  {
    id: 'ACC-005',
    employeeId: 'NV0009',
    name: 'Bùi Minh Quân',
    username: '@minhquan',
    email: 'nv0009@phuonghihi.vn',
    roleId: 'employee',
    dataScope: 'Của bản thân',
    department: 'Kinh doanh',
    active: true,
  },
  {
    id: 'ACC-006',
    employeeId: 'NV0000',
    name: 'iPad Kiosk Quầy Thu Ngân (123 Lê Lợi)',
    username: '@kiosk.quay',
    email: 'kiosk@phuonghihi.vn',
    roleId: 'door_kiosk',
    dataScope: 'Chỉ mở mã QR tại cửa',
    active: true,
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'LOG-001',
    timestamp: '06:18 10/10/2026',
    actor: 'trigger@phuonghihi',
    action: 'Nhắc duyệt đơn quá hạn',
    targetType: 'Đơn từ',
    targetDetail: '2026-10-10',
  },
  {
    id: 'LOG-002',
    timestamp: '04:18 10/10/2026',
    actor: 'trigger@phuonghihi',
    action: 'Nhắc duyệt đơn quá hạn',
    targetType: 'Đơn từ',
    targetDetail: '2026-10-10',
  },
  {
    id: 'LOG-003',
    timestamp: '00:18 10/10/2026',
    actor: 'trigger@phuonghihi',
    action: 'Nhắc duyệt đơn quá hạn',
    targetType: 'Đơn từ',
    targetDetail: '2026-10-10',
  },
  {
    id: 'LOG-004',
    timestamp: '20:39 09/10/2026',
    actor: 'admin@phuonghihi',
    action: 'Tính lương',
    targetType: 'Bảng lương',
    targetDetail: '2026-10-01',
  },
  {
    id: 'LOG-005',
    timestamp: '20:18 09/10/2026',
    actor: 'trigger@phuonghihi',
    action: 'Nhắc duyệt đơn quá hạn',
    targetType: 'Đơn từ',
    targetDetail: '2026-10-09',
  },
  {
    id: 'LOG-006',
    timestamp: '18:18 09/10/2026',
    actor: 'trigger@phuonghihi',
    action: 'Nhắc duyệt đơn quá hạn',
    targetType: 'Đơn từ',
    targetDetail: '2026-10-09',
  },
  {
    id: 'LOG-007',
    timestamp: '16:34 09/10/2026',
    actor: 'admin@phuonghihi',
    action: 'Đổi cấu hình',
    targetType: 'Cài đặt',
    targetDetail: 'attendance',
  },
  {
    id: 'LOG-008',
    timestamp: '15:34 09/10/2026',
    actor: 'admin@phuonghihi',
    action: 'Đổi cấu hình',
    targetType: 'Cài đặt',
    targetDetail: 'workplace.phuonghihi_leloi',
  },
  {
    id: 'LOG-009',
    timestamp: '10:33 09/10/2026',
    actor: 'admin@phuonghihi',
    action: 'Phân ca',
    targetType: 'Phân ca',
    targetDetail: 'Quản lý cửa hàng (phuonghihi) · 2026-10-18',
  },
  {
    id: 'LOG-010',
    timestamp: '09:45 09/10/2026',
    actor: 'admin@phuonghihi',
    action: 'Phát hành phiếu lương',
    targetType: 'Bảng lương',
    targetDetail: 'Kỳ 2026-09 (49 phiếu)',
  },
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'NEWS-001',
    title: 'Quy định chấm công ca trực tại Cửa hàng phuonghihi (123 Lê Lợi, Q.1)',
    content:
      'Nhân viên đứng quầy, kỹ thuật bảo hành và kho IMEI chấm công bằng điện thoại trong bán kính 150m tại 123 Đường Lê Lợi, Quận 1 (hoặc quét QR tại iPad quầy thu ngân). Giờ mở cửa 08:00 - 21:00 hằng ngày. Quên chấm gửi đơn bổ sung trong 3 ngày.',
    scope: 'Toàn công ty',
    pinned: true,
    author: 'Nguyễn Minh Anh (Nhân sự)',
    createdAt: '28/09/2026',
  },
  {
    id: 'NEWS-002',
    title: 'Lương & hoa hồng bán iPhone kỳ trước đã chuyển khoản',
    content:
      'Phiếu lương cùng bảng kê thưởng doanh số bán iPhone chính hãng, phụ kiện MagSafe và hợp đồng trả góp đã gửi về từng nhân viên. Thấy sai lệch thì bấm Phản hồi ngay dưới phiếu, kế toán trả lời trong 2 ngày làm việc.',
    scope: 'Toàn công ty',
    pinned: false,
    author: 'Phạm Ngọc Lan (Kế toán)',
    createdAt: '05/10/2026',
  },
  {
    id: 'NEWS-003',
    title: 'Họp tổng kết doanh số iPhone 16 Series & Hợp đồng trả góp',
    content:
      'Thứ Sáu tuần này, 15:00 tại tầng 2 Cửa hàng phuonghihi (123 Lê Lợi, Q.1). Trưởng nhóm chuẩn bị số liệu tồn kho IMEI, đơn lên đời giữ máy cũ 7 ngày và công nợ khách doanh nghiệp.',
    scope: 'Một phòng ban',
    department: 'Kinh doanh',
    pinned: false,
    author: 'Lê Quang Huy (Kinh doanh)',
    createdAt: '04/10/2026',
    expiresAt: '12/10/2026',
  },
  {
    id: 'NEWS-004',
    title: 'Kiểm kê định kỳ kho IMEI & Khám sức khoẻ nhân viên phuonghihi',
    content:
      'Cửa hàng phuonghihi tổ chức khám sức khoẻ định kỳ cho toàn bộ nhân sự. Các ca trực quầy đăng ký khung giờ luân phiên với bộ phận Nhân sự để vẫn đảm bảo lịch mở cửa 08:00 - 21:00.',
    scope: 'Toàn công ty',
    pinned: false,
    author: 'Nguyễn Minh Anh (Nhân sự)',
    createdAt: '01/10/2026',
    expiresAt: '20/10/2026',
  },
];
