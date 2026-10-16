import React, { useMemo, useRef, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Plus,
  Search,
  Edit3,
  FileDown,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { DepartmentName, Employee, EmployeeStatus } from '../types';
import {
  canManageHR,
  exportToCSV,
  exportToExcel,
  getInitials,
  matchesSearch,
  parseExcelFile,
} from '../utils/helpers';

export const EmployeesView: React.FC = () => {
  const {
    scopedEmployees,
    currentAccount,
    setSelectedEmployeeId,
    importEmployees,
    showToast,
  } = useHRM();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [posFilter, setPosFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEditHR = canManageHR(currentAccount.roleId);

  const stats = useMemo(() => {
    const total = scopedEmployees.length;
    const official = scopedEmployees.filter((e) => e.status === 'Chính thức').length;
    const probation = scopedEmployees.filter((e) => e.status === 'Thử việc').length;
    const inactive = scopedEmployees.filter(
      (e) => e.status === 'Tạm nghỉ' || e.status === 'Đã nghỉ'
    ).length;
    return { total, official, probation, inactive };
  }, [scopedEmployees]);

  const filteredEmployees = useMemo(() => {
    return scopedEmployees.filter((emp) => {
      if (statusFilter !== 'ALL' && emp.status !== statusFilter) return false;
      if (deptFilter !== 'ALL' && emp.department !== deptFilter) return false;
      if (posFilter !== 'ALL' && emp.position !== posFilter) return false;
      if (
        searchQuery.trim() &&
        !matchesSearch(emp.name, searchQuery) &&
        !matchesSearch(emp.code, searchQuery) &&
        !matchesSearch(emp.email, searchQuery) &&
        !matchesSearch(emp.phone, searchQuery)
      ) {
        return false;
      }
      return true;
    });
  }, [scopedEmployees, statusFilter, deptFilter, posFilter, searchQuery]);

  const handleExportCSV = () => {
    exportToCSV(
      'DanhSachNhanVien_phuonghihi.csv',
      filteredEmployees.map((e) => ({
        'Mã NV': e.code,
        'Họ tên': e.name,
        Email: e.email,
        'Số điện thoại': e.phone,
        'Phòng ban': e.department,
        'Chức vụ': e.position,
        'Trạng thái': e.status,
        'Ngày vào': e.joinDate,
        'Lương cơ bản': e.baseSalary,
        'Phụ cấp': e.allowance,
      }))
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseExcelFile(file);
      if (!rows || rows.length === 0) {
        showToast(
          'File Excel đang trống!',
          'Vui lòng kiểm tra lại dữ liệu trong file trước khi tải lên.',
          'warning'
        );
        e.target.value = '';
        return;
      }
      const parsed: Partial<Employee>[] = rows
        .map((r) => ({
          code: String(r['Mã NV'] || r['Code'] || '').trim() || undefined,
          name: String(r['Họ tên'] || r['Name'] || r['Ho ten'] || '').trim(),
          email: String(r['Email'] || '').trim() || undefined,
          phone: String(r['Số điện thoại'] || r['Phone'] || '0909123456').trim(),
          department: (r['Phòng ban'] as DepartmentName) || 'Kinh doanh',
          position: (r['Chức vụ'] as Employee['position']) || 'Nhân viên',
          status: (r['Trạng thái'] as EmployeeStatus) || 'Thử việc',
          baseSalary: Number(r['Lương cơ bản'] || 14000000),
          allowance: Number(r['Phụ cấp'] || 1200000),
        }))
        .filter((item) => item.name.length > 0);

      if (parsed.length === 0) {
        showToast(
          'Không tìm thấy cột "Họ tên" hợp lệ trong file Excel!',
          'Hãy bấm "Tải mẫu Excel" để lấy đúng cấu trúc cột chuẩn.',
          'warning'
        );
      } else {
        importEmployees(parsed);
      }
    } catch {
      showToast(
        'Không thể đọc file Excel này!',
        'Vui lòng chọn đúng định dạng .xlsx, .xls hoặc .csv hợp lệ.',
        'warning'
      );
    }
    e.target.value = '';
  };

  const handleDownloadSampleExcel = () => {
    exportToExcel('Mau_Nhap_Nhan_Vien_phuonghihi.xlsx', 'NhanVien', [
      {
        'Mã NV': 'NV0051',
        'Họ tên': 'Nguyễn Hoàng Nam',
        Email: 'hoangnam@phuonghihi.vn',
        'Số điện thoại': '0912345678',
        'Phòng ban': 'Kỹ thuật',
        'Chức vụ': 'Nhân viên',
        'Trạng thái': 'Chính thức',
        'Lương cơ bản': 18000000,
        'Phụ cấp': 1500000,
      },
    ]);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            PHUONGHIHI / NHÂN SỰ
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Nhân viên</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng số {stats.total} nhân viên trong phạm vi của bạn
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>

          {canEditHR && (
            <>
              <button
                onClick={handleDownloadSampleExcel}
                title="Tải file Excel mẫu chuẩn (.xlsx)"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 shadow-2xs transition cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải mẫu Excel</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Bấm để chọn file Excel (.xlsx/.csv) nhập danh sách nhân sự"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nhập từ Excel</span>
              </button>

              <button
                onClick={() => setSelectedEmployeeId('NEW')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm nhân viên</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Tổng nhân sự</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Trong phạm vi của bạn
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Đang làm việc</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {stats.official}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Nhân viên chính thức
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Thử việc</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {stats.probation}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Cần theo dõi đánh giá
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">
            Tạm nghỉ / Đã nghỉ
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {stats.inactive}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Không hoạt động thường xuyên
          </div>
        </div>
      </div>

      {/* Employee Directory Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-slate-900">
              Danh sách nhân viên
            </div>
            <div className="text-xs text-slate-400">
              {filteredEmployees.length} kết quả phù hợp
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-700"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Chính thức">Chính thức</option>
              <option value="Thử việc">Thử việc</option>
              <option value="Tạm nghỉ">Tạm nghỉ</option>
              <option value="Đã nghỉ">Đã nghỉ</option>
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-700"
            >
              <option value="ALL">Tất cả phòng ban</option>
              <option value="Phòng ban chung">Phòng ban chung</option>
              <option value="Kinh doanh">Kinh doanh</option>
              <option value="Kỹ thuật">Kỹ thuật</option>
              <option value="Nhân sự">Nhân sự</option>
              <option value="Kế toán">Kế toán</option>
              <option value="Marketing">Marketing</option>
              <option value="Vận hành">Vận hành</option>
            </select>

            <select
              value={posFilter}
              onChange={(e) => setPosFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-700"
            >
              <option value="ALL">Tất cả chức vụ</option>
              <option value="Quản trị viên">Quản trị viên</option>
              <option value="Trưởng phòng">Trưởng phòng</option>
              <option value="Trưởng nhóm">Trưởng nhóm</option>
              <option value="Nhân viên">Nhân viên</option>
              <option value="Thực tập sinh">Thực tập sinh</option>
            </select>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên, mã, email, điện thoại..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/50">
                <th className="py-3 px-4">Nhân viên</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phòng ban</th>
                <th className="py-3 px-4">Chức vụ</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Hồ sơ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => setSelectedEmployeeId(emp.id)}
                  className="hover:bg-slate-50/80 transition cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${emp.avatarColor}`}
                      >
                        {getInitials(emp.name)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 hover:text-blue-600">
                          {emp.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {emp.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{emp.email}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {emp.department}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{emp.position}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        emp.status === 'Chính thức'
                          ? 'bg-emerald-50 text-emerald-700'
                          : emp.status === 'Thử việc'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          emp.status === 'Chính thức'
                            ? 'bg-emerald-500'
                            : emp.status === 'Thử việc'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmployeeId(emp.id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Chi tiết</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
