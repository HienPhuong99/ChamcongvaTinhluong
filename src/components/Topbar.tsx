import React, { useState } from 'react';
import { Search, Bell, Smartphone, QrCode, Shield, RotateCcw, Globe } from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { getInitials } from '../utils/helpers';
import { GoogleSitesModal } from './GoogleSitesModal';
import { ExpoGoModal } from './ExpoGoModal';

export const Topbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsCommandPaletteOpen,
    setIsDoorQrModalOpen,
    requests,
    accounts,
    currentAccount,
    switchAccount,
    resetDemoData,
  } = useHRM();

  const [isGoogleSitesOpen, setIsGoogleSitesOpen] = useState(false);
  const [isExpoGoOpen, setIsExpoGoOpen] = useState(false);

  const pendingCount = requests.filter((r) => r.status === 'Đang chờ').length;

  return (
    <>
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
        {/* Left: Global Search Bar trigger (Ctrl + K) */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-72 max-w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-400 text-sm transition group"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
            <span className="truncate text-[13px]">
              Tìm nhân viên, đơn từ, ca, cài đặt...
            </span>
          </div>
          <kbd className="text-[11px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs shrink-0">
            Ctrl + K
          </kbd>
        </button>

        {/* Right: Quick actions, Expo Go, Google Sites, Date, Role Switcher, Notifications, Profile */}
        <div className="flex items-center gap-2">
          {/* Open Mobile Check-in App Button */}
          <button
            onClick={() =>
              setActiveTab(activeTab === 'mobile_app' ? 'shifts' : 'mobile_app')
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              activeTab === 'mobile_app'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-blue-50/80 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>
              {activeTab === 'mobile_app' ? 'Về bản Web' : 'App Mobile'}
            </span>
          </button>

          {/* Expo Go Native QR Button */}
          <button
            onClick={() => setIsExpoGoOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition cursor-pointer"
            title="Mở mã QR chạy trên ứng dụng Expo Go"
          >
            <QrCode className="w-3.5 h-3.5 text-slate-800" />
            <span>Expo Go</span>
          </button>

          {/* Gắn lên Google Sites Button */}
          <button
            onClick={() => setIsGoogleSitesOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
            title="Lấy link & mã nhúng gắn lên Google Sites phuonghihi"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Sites</span>
          </button>

          {/* Link sang Web Bán hàng phuonghihi */}
          <a
            href="https://sites.google.com/view/phuonghihi"
            target="_blank"
            rel="noreferrer"
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0B4174] bg-[#E9F0F8] hover:bg-blue-100 border border-blue-200 transition"
            title="Mở Web Bán hàng & Kho IMEI phuonghihi (123 Lê Lợi, Q.1)"
          >
            <span>Web Bán hàng</span>
          </a>

          {/* Quick Kiosk QR at door */}
          <button
            onClick={() => setIsDoorQrModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            title="Mở màn hình Mã QR tại cửa (tự đổi mỗi 45 giây)"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            <span>QR tại cửa</span>
          </button>

          {/* Role / Scope Switcher */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <select
              aria-label="Chọn tài khoản phân quyền"
              value={currentAccount.id}
              onChange={(e) => switchAccount(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.dataScope}
                  {acc.department ? ` - ${acc.department}` : ''})
                </option>
              ))}
            </select>
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => setActiveTab('requests')}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            title={`${pendingCount} đơn từ đang chờ duyệt`}
          >
            <Bell className="w-4 h-4" />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Reset demo data button */}
          <button
            onClick={resetDemoData}
            title="Khôi phục dữ liệu mẫu mặc định"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Profile Pill */}
          <div
            onClick={() => setActiveTab('my_profile')}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center">
              {getInitials(currentAccount.name)}
            </div>
          </div>
        </div>
      </header>

      <GoogleSitesModal
        open={isGoogleSitesOpen}
        onClose={() => setIsGoogleSitesOpen(false)}
      />
      <ExpoGoModal
        open={isExpoGoOpen}
        onClose={() => setIsExpoGoOpen(false)}
      />
    </>
  );
};
