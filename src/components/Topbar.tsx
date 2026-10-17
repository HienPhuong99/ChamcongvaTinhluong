import React, { useState } from 'react';
import {
  Search,
  Bell,
  Smartphone,
  QrCode,
  Shield,
  RotateCcw,
  Globe,
  Menu,
  AlertTriangle,
  Lock,
  X,
  CloudOff,
  LogOut,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import {
  canManageSchedules,
  canManageSettings,
  getInitials,
} from '../utils/helpers';
import { GoogleSitesModal } from './GoogleSitesModal';
import { ExpoGoModal } from './ExpoGoModal';

export const Topbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsMobileMenuOpen,
    setIsCommandPaletteOpen,
    setIsDoorQrModalOpen,
    requests,
    scopedEmployees,
    accounts,
    currentAccount,
    isLoggedOut,
    mustChangePin,
    logoutAccount,
    offlineQueueCount,
    flushOfflineAttendanceQueue,
    pendingAuthAccountId,
    setPendingAuthAccountId,
    switchAccount,
    changeOwnServerPin,
    resetDemoData,
  } = useHRM();

  const [isGoogleSitesOpen, setIsGoogleSitesOpen] = useState(false);
  const [isExpoGoOpen, setIsExpoGoOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [currentPinForChange, setCurrentPinForChange] = useState('');
  const [newPinForChange, setNewPinForChange] = useState('');
  const [confirmPinForChange, setConfirmPinForChange] = useState('');
  const [changePinError, setChangePinError] = useState('');
  const [isChangingOwnPin, setIsChangingOwnPin] = useState(false);

  const scopedIds = new Set(scopedEmployees.map((e) => e.id));
  const pendingCount = requests.filter(
    (r) => r.status === 'Đang chờ' && scopedIds.has(r.employeeId)
  ).length;

  const pendingTargetAccount = pendingAuthAccountId
    ? accounts.find((a) => a.id === pendingAuthAccountId)
    : null;

  const canOpenKioskModal =
    !isLoggedOut &&
    (currentAccount.roleId === 'door_kiosk' || canManageSchedules(currentAccount.roleId));

  const handleConfirmAccountSwitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAuthAccountId || isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      const enteredPin = pinInput;
      const ok = await switchAccount(pendingAuthAccountId, enteredPin);
      if (ok) {
        setCurrentPinForChange(enteredPin);
        setNewPinForChange('');
        setConfirmPinForChange('');
        setChangePinError('');
        setPinInput('');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleMandatoryChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isChangingOwnPin) return;
    setChangePinError('');
    if (!currentPinForChange.trim() || !newPinForChange.trim()) {
      setChangePinError('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.');
      return;
    }
    if (newPinForChange.trim().length < 6) {
      setChangePinError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPinForChange.trim() !== confirmPinForChange.trim()) {
      setChangePinError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }
    setIsChangingOwnPin(true);
    try {
      const ok = await changeOwnServerPin(currentPinForChange.trim(), newPinForChange.trim());
      if (ok) {
        setCurrentPinForChange('');
        setNewPinForChange('');
        setConfirmPinForChange('');
      }
    } finally {
      setIsChangingOwnPin(false);
    }
  };

  return (
    <>
      <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between gap-2 shrink-0 z-20">
        {/* Left: Mobile Hamburger + Global Search Bar trigger (Ctrl + K) */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden shrink-0"
            title="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full max-w-[200px] sm:max-w-[250px] xl:max-w-[290px] flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-400 text-sm transition group min-w-0"
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
              <span className="truncate text-xs sm:text-[13px]">
                Tìm nhân viên, đơn từ, ca...
              </span>
            </div>
            <kbd className="hidden sm:inline-block text-[10.5px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs shrink-0 whitespace-nowrap">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* Right: Quick actions, Offline Queue, Expo Go, Google Sites, Role Switcher, Notifications, Profile */}
        <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
          {/* Issue C1: Offline Attendance Queue Indicator */}
          {offlineQueueCount > 0 && (
            <button
              onClick={() => flushOfflineAttendanceQueue()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition cursor-pointer whitespace-nowrap shrink-0"
              title="Có bản ghi chấm công đang nằm trong hàng đợi Offline. Bấm để gửi lại lên Server ngay."
            >
              <CloudOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Hàng đợi ({offlineQueueCount})</span>
            </button>
          )}

          {/* Open Mobile Check-in App Button */}
          <button
            onClick={() =>
              setActiveTab(activeTab === 'mobile_app' ? 'shifts' : 'mobile_app')
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'mobile_app'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-blue-50/80 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>
              {activeTab === 'mobile_app' ? 'Về bản Web' : 'App Mobile'}
            </span>
          </button>

          {/* Expo Go Native QR Button */}
          <button
            onClick={() => setIsExpoGoOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition cursor-pointer whitespace-nowrap shrink-0"
            title="Mở mã QR chạy trên ứng dụng Expo Go"
          >
            <QrCode className="w-3.5 h-3.5 text-slate-800 shrink-0" />
            <span>Expo Go</span>
          </button>

          {/* Gắn lên Google Sites Button */}
          <button
            onClick={() => setIsGoogleSitesOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer whitespace-nowrap shrink-0"
            title="Lấy link & mã nhúng gắn lên Google Sites phuonghihi"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Google Sites</span>
          </button>

          {/* Link sang Web Bán hàng phuonghihi */}
          <a
            href="https://sites.google.com/view/phuonghihi"
            target="_blank"
            rel="noreferrer"
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0B4174] bg-[#E9F0F8] hover:bg-blue-100 border border-blue-200 transition whitespace-nowrap shrink-0"
            title="Mở Web Bán hàng & Kho IMEI phuonghihi (123 Lê Lợi, Q.1)"
          >
            <span>Web Bán hàng</span>
          </a>

          {/* Quick Kiosk QR at door (Issue E1: Only visible to door_kiosk or management roles) */}
          {canOpenKioskModal && (
            <button
              onClick={() => setIsDoorQrModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer whitespace-nowrap shrink-0"
              title="Mở màn hình Mã QR tại cửa (tự đổi mỗi 45 giây)"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>QR tại cửa</span>
            </button>
          )}

          {/* Role / Scope Switcher */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 shrink-0">
            <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              aria-label="Chọn tài khoản phân quyền"
              value={isLoggedOut ? '' : currentAccount.id}
              onChange={(e) => {
                if (!e.target.value) return;
                setPinInput('');
                void switchAccount(e.target.value);
              }}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer max-w-[180px] 2xl:max-w-[240px] truncate"
            >
              {isLoggedOut && (
                <option value="" disabled>
                  -- Chọn tài khoản đăng nhập --
                </option>
              )}
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} disabled={!acc.active}>
                  {acc.name} ({acc.dataScope}
                  {acc.department ? ` - ${acc.department}` : ''})
                  {!acc.active ? ' [Đã khoá]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => setActiveTab('requests')}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition shrink-0"
            title={`${pendingCount} đơn từ đang chờ duyệt`}
          >
            <Bell className="w-4 h-4" />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Reset demo data button (only visible to super_admin) */}
          {!isLoggedOut && canManageSettings(currentAccount.roleId) && (
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              title="Khôi phục dữ liệu mẫu mặc định (Chỉ Quản trị cao nhất)"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Logout button when authenticated */}
          {!isLoggedOut && (
            <button
              onClick={logoutAccount}
              title="Đăng xuất phiên làm việc hiện tại"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Profile Pill */}
          <div
            onClick={() => setActiveTab('my_profile')}
            className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-slate-200 cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center">
              {getInitials(currentAccount.name)}
            </div>
          </div>
        </div>
      </header>

      {/* Server-side PIN / Password Authentication Modal (Issue B1: Never allow first-time PIN setup on login screen) */}
      {pendingTargetAccount && (
        <div
          onClick={() => {
            setPendingAuthAccountId(null);
            setPinInput('');
          }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleConfirmAccountSwitch}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Xác thực đăng nhập tài khoản
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nhập mật khẩu / mã PIN bảo mật do Quản trị viên hoặc HR cấp (kiểm tra trên Server)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPendingAuthAccountId(null);
                  setPinInput('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">
                {pendingTargetAccount.name}{' '}
                <span className="font-mono text-blue-600 font-normal">
                  ({pendingTargetAccount.username})
                </span>
              </div>
              <div className="text-slate-500">
                Vai trò: <span className="font-semibold">{pendingTargetAccount.dataScope}</span>
                {pendingTargetAccount.department ? ` · Phòng ${pendingTargetAccount.department}` : ''}
              </div>
            </div>

            <div className="mt-3.5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mật khẩu / Mã PIN xác thực (Server)
                </label>
                <input
                  type="password"
                  autoFocus
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Nhập mật khẩu / mã PIN đã được cấp..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
                />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Xác thực trực tiếp với máy chủ bằng PBKDF2-SHA256 và nhận phiên đăng nhập có chữ ký HMAC.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingAuthAccountId(null);
                  setPinInput('');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Huỷ bỏ
              </button>
              <button
                type="submit"
                disabled={isAuthenticating}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition shadow-xs"
              >
                {isAuthenticating ? 'Đang xác thực...' : 'Xác thực & Đăng nhập'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mandatory First-Login Password / PIN Change Modal (Issue M3) */}
      {!isLoggedOut && mustChangePin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleMandatoryChangePin}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-amber-300 max-w-md w-full p-5 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Bắt buộc đổi mật khẩu ở lần đăng nhập đầu
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vì lý do bảo mật, vui lòng thiết lập mật khẩu / mã PIN cá nhân mới trước khi sử dụng hệ thống.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">
                {currentAccount.name}{' '}
                <span className="font-mono text-blue-600 font-normal">
                  ({currentAccount.username})
                </span>
              </div>
              <div className="text-slate-600">
                Mật khẩu khởi tạo hoặc mật khẩu do Quản trị viên cấp lại chỉ dùng một lần để kích hoạt phiên.
              </div>
            </div>

            <div className="mt-3.5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu / Mã PIN hiện tại
                </label>
                <input
                  type="password"
                  value={currentPinForChange}
                  onChange={(e) => setCurrentPinForChange(e.target.value)}
                  placeholder="Nhập mật khẩu vừa dùng để đăng nhập..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu / Mã PIN mới (tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  autoFocus
                  value={newPinForChange}
                  onChange={(e) => setNewPinForChange(e.target.value)}
                  placeholder="Nhập mật khẩu mới khó đoán..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Xác nhận mật khẩu / Mã PIN mới
                </label>
                <input
                  type="password"
                  value={confirmPinForChange}
                  onChange={(e) => setConfirmPinForChange(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
              {changePinError && (
                <p className="text-xs font-medium text-rose-600">{changePinError}</p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={logoutAccount}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Đăng xuất
              </button>
              <button
                type="submit"
                disabled={isChangingOwnPin}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition shadow-xs"
              >
                {isChangingOwnPin ? 'Đang lưu mật khẩu mới...' : 'Lưu mật khẩu mới & Tiếp tục'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal for Reset Demo Data */}
      {isResetConfirmOpen && (
        <div
          onClick={() => setIsResetConfirmOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Xác nhận khôi phục dữ liệu mẫu?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thao tác này chỉ đặt lại dữ liệu HRM phuonghihi về trạng thái ban đầu.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
              Các thay đổi phân ca, chấm công, đơn từ, bảng lương và cài đặt bạn vừa thử nghiệm sẽ được đặt lại về bộ dữ liệu mẫu 51 nhân sự mặc định.
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Huỷ bỏ
              </button>
              <button
                onClick={() => {
                  resetDemoData();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition shadow-xs"
              >
                Khôi phục mặc định
              </button>
            </div>
          </div>
        </div>
      )}

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
