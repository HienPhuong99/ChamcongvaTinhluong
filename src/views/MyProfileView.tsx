import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  UserCircle,
  Calendar,
  Wallet,
  Smartphone,
  Shield,
  QrCode,
  Printer,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import {
  exportPayslipToPDF,
  formatVND,
  generatePersonalQrPayload,
  getInitials,
} from '../utils/helpers';

export const MyProfileView: React.FC = () => {
  const {
    currentAccount,
    employees,
    leaveBalances,
    computePayrollRows,
    setActiveTab,
    setSelectedEmployeeId,
  } = useHRM();

  const [period, setPeriod] = useState<'2026-10' | '2026-09' | '2026-08'>('2026-09');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const myEmp =
    employees.find((e) => e.id === currentAccount.employeeId) || employees[0];
  const myLeave = leaveBalances.find((l) => l.employeeId === myEmp.id) || {
    annualQuota: 12,
    carriedOver: 2,
    used: 2,
    pending: 0,
  };
  const myPayslip = computePayrollRows(period).find(
    (p) => p.employeeId === myEmp.id
  );

  useEffect(() => {
    if (!myEmp) return;
    const payload = generatePersonalQrPayload(myEmp.code);
    QRCode.toDataURL(payload, { width: 180, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [myEmp]);

  const remainingLeave = Math.max(
    0,
    myLeave.annualQuota + myLeave.carriedOver - myLeave.used
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
          Thông tin cá nhân, mã QR định danh chữ ký số, số dư phép năm và phiếu lương của bạn.
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
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            Chỉnh sửa hồ sơ
          </button>
          <button
            onClick={() => setActiveTab('mobile_app')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
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
            <span>Thông tin liên hệ &amp; Ngân hàng</span>
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
            <div>
              Ngân hàng:{' '}
              <strong className="text-slate-900">
                {myEmp.bankName || 'Vietcombank'} ({myEmp.bankAccount || 'Chưa cập nhật'})
              </strong>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Số dư phép năm 2026</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 pt-1">
            {remainingLeave} ngày còn lại
          </div>
          <div className="text-xs text-slate-500">
            Định mức: {myLeave.annualQuota} (+{myLeave.carriedOver} tồn) · Đã dùng:{' '}
            {myLeave.used} · Chờ duyệt: {myLeave.pending}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <QrCode className="w-4 h-4 text-indigo-600" />
              <span>Mã QR định danh</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Mã QR cá nhân có chữ ký số chống giả mạo để chấm công tại quầy.
            </p>
            <div className="text-xs font-bold text-indigo-600">{myEmp.code}</div>
          </div>
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="Personal QR"
              className="w-20 h-20 rounded-xl border border-slate-200 p-1 shrink-0"
            />
          )}
        </div>
      </div>

      {/* Personal Payslip Detail Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Phiếu lương cá nhân kỳ {period}
              </h3>
              <p className="text-xs text-slate-500">
                Chi tiết ngày công, phụ cấp, hoa hồng, khấu trừ EWA và thực lĩnh chuyển khoản.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value as '2026-10' | '2026-09' | '2026-08')
              }
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
            >
              <option value="2026-10">Kỳ 2026-10</option>
              <option value="2026-09">Kỳ 2026-09</option>
              <option value="2026-08">Kỳ 2026-08</option>
            </select>
            {myPayslip && (
              <button
                onClick={() => exportPayslipToPDF(myPayslip, myEmp)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In PDF</span>
              </button>
            )}
          </div>
        </div>

        {myPayslip ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Lương cơ bản hợp đồng:</span>
                <span className="font-semibold">
                  {myPayslip.baseSalary > 0
                    ? formatVND(myPayslip.baseSalary)
                    : 'Chưa khai lương (0 đ)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày công tính lương:</span>
                <span className="font-semibold">
                  {myPayslip.actualDays + myPayslip.paidLeaveDays} /{' '}
                  {myPayslip.standardDays} ngày
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lương theo ngày công:</span>
                <span className="font-semibold">
                  {formatVND(myPayslip.proRatedSalary)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phụ cấp + OT + Thưởng:</span>
                <span className="font-semibold text-emerald-700">
                  +{formatVND(myPayslip.allowance + myPayslip.otAmount + myPayslip.bonus)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Phạt đi muộn:</span>
                <span className="font-semibold text-rose-600">
                  -{formatVND(myPayslip.latePenaltyAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Khấu trừ khác &amp; Tạm ứng EWA:
                </span>
                <span className="font-semibold text-rose-600">
                  -{formatVND(myPayslip.otherDeduction)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">BHXH &amp; Thuế TNCN:</span>
                <span className="font-semibold text-rose-600">
                  -{formatVND(myPayslip.insuranceAmount + myPayslip.taxAmount)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span>Thực lĩnh kỳ {period}:</span>
                <span className="text-blue-600 text-base">
                  {formatVND(myPayslip.netSalary)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            Chưa có dữ liệu phiếu lương cho kỳ {period}.
          </div>
        )}
      </div>
    </div>
  );
};

