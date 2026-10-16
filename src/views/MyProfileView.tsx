import React from 'react';
import {
  UserCircle,
  Calendar,
  Wallet,
  Smartphone,
  Shield,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { formatVND, getInitials } from '../utils/helpers';

export const MyProfileView: React.FC = () => {
  const {
    currentAccount,
    employees,
    leaveBalances,
    computePayrollRows,
    setActiveTab,
    setSelectedEmployeeId,
  } = useHRM();

  const myEmp =
    employees.find((e) => e.id === currentAccount.employeeId) || employees[0];
  const myLeave = leaveBalances.find((l) => l.employeeId === myEmp.id) || {
    annualQuota: 12,
    carriedOver: 2,
    used: 2,
    pending: 0,
  };
  const myPayslip = computePayrollRows('2026-09').find(
    (p) => p.employeeId === myEmp.id
  );

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          PHUONGHIHI / HỆ THỐNG
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
          Hồ sơ của tôi
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Thông tin cá nhân, số dư phép năm và phiếu lương của bạn.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center">
            {getInitials(myEmp.name)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{myEmp.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                {myEmp.status}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {myEmp.code} · {myEmp.position} · Phòng {myEmp.department}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium mt-1">
              <Shield className="w-3.5 h-3.5" />
              <span>
                Tài khoản: {currentAccount.username} · Phạm vi:{' '}
                {currentAccount.dataScope}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedEmployeeId(myEmp.id)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            Chỉnh sửa hồ sơ
          </button>
          <button
            onClick={() => setActiveTab('mobile_app')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Chấm công ngay</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <UserCircle className="w-4 h-4 text-blue-600" />
            <span>Thông tin liên hệ</span>
          </div>
          <div className="text-xs space-y-1.5 pt-2 text-slate-600">
            <div>
              Email: <strong className="text-slate-900">{myEmp.email}</strong>
            </div>
            <div>
              Điện thoại:{' '}
              <strong className="text-slate-900">{myEmp.phone}</strong>
            </div>
            <div>
              Ngày vào công ty:{' '}
              <strong className="text-slate-900">{myEmp.joinDate}</strong>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Số dư phép năm 2026</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 pt-1">
            {myLeave.annualQuota + myLeave.carriedOver - myLeave.used} ngày còn
            lại
          </div>
          <div className="text-xs text-slate-500">
            Định mức: {myLeave.annualQuota} ngày · Đã dùng: {myLeave.used} ngày
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Wallet className="w-4 h-4 text-blue-600" />
            <span>Thực lĩnh kỳ gần nhất (2026-09)</span>
          </div>
          <div className="text-2xl font-extrabold text-blue-600 pt-1">
            {myPayslip ? formatVND(myPayslip.netSalary) : '25.000.000 đ'}
          </div>
          <div className="text-xs text-slate-500">
            Đã phát hành phiếu lương PDF &amp; gửi email
          </div>
        </div>
      </div>
    </div>
  );
};
