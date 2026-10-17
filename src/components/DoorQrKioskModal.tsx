import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, RefreshCw, QrCode, CheckCircle2, ShieldCheck, AlertTriangle, Copy } from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { generateDoorQrToken, verifyDoorQrToken } from '../utils/helpers';

export const DoorQrKioskModal: React.FC = () => {
  const {
    isDoorQrModalOpen,
    setIsDoorQrModalOpen,
    settings,
    employees,
    currentAccount,
    selectedAttendanceDate,
    checkInOrOut,
    showToast,
  } = useHRM();

  const currentEmployee = employees.find((e) => e.id === currentAccount.employeeId);
  const isKioskRole = currentAccount.roleId === 'door_kiosk';

  const [secondsLeft, setSecondsLeft] = useState(45);
  const [tokenSeed, setTokenSeed] = useState(() => generateDoorQrToken());
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!isDoorQrModalOpen) return;
    setTokenSeed(generateDoorQrToken());
    setSecondsLeft(45);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTokenSeed(generateDoorQrToken());
          return 45;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isDoorQrModalOpen]);

  useEffect(() => {
    if (!isDoorQrModalOpen) return;
    const payload = JSON.stringify({
      office: settings.officeName,
      token: tokenSeed,
      expiresIn: '45s',
    });
    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [isDoorQrModalOpen, tokenSeed, settings.officeName]);

  if (!isDoorQrModalOpen) return null;

  const handleManualRotate = () => {
    setTokenSeed(generateDoorQrToken());
    setSecondsLeft(45);
  };

  const handleCopyToken = () => {
    navigator.clipboard?.writeText(tokenSeed).catch(() => {});
    showToast('Đã sao chép Token QR tại cửa!', 'Bạn có thể dán vào ô Quét QR trên App Mobile để kiểm thử.');
  };

  const handleSimulateSelfScan = () => {
    if (isKioskRole) {
      showToast(
        'Màn hình Kiosk chỉ dùng để hiển thị mã QR!',
        'Nhân viên vui lòng mở App Mobile trên điện thoại cá nhân để quét mã QR này.',
        'warning'
      );
      return;
    }
    if (!settings.qrEnabled) {
      showToast(
        'Chấm công QR đang tắt!',
        'Vui lòng bật hình thức chấm công Mã QR trong mục Cài đặt.',
        'warning'
      );
      return;
    }
    const verification = verifyDoorQrToken(tokenSeed);
    if (!verification.valid) {
      showToast('Mã QR không hợp lệ hoặc đã hết hạn!', verification.reason, 'warning');
      handleManualRotate();
      return;
    }
    checkInOrOut({
      employeeId: currentAccount.employeeId,
      method: 'QR tại cửa',
      distanceMeters: 5,
      gpsAccuracy: 8,
      date: selectedAttendanceDate,
      note: `Quét mã QR tại cửa đã xác thực chữ ký (${tokenSeed.slice(-10)})`,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => setIsDoorQrModalOpen(false)}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Kiosk Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Mã QR chấm công tại cửa</h3>
              <p className="text-xs text-blue-100">
                {settings.officeName} · Tự đổi mã mới mỗi 45 giây
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDoorQrModalOpen(false)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Display */}
        <div className="p-6 flex flex-col items-center text-center">
          {!settings.qrEnabled && (
            <div className="w-full mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800 text-left">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Hình thức chấm công Mã QR hiện đang tắt trong Cài đặt hệ thống.</span>
            </div>
          )}

          <div className="relative p-4 rounded-2xl bg-white border-2 border-blue-100 shadow-inner">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code tại cửa"
                className="w-60 h-60 object-contain"
              />
            ) : (
              <div className="w-60 h-60 flex items-center justify-center text-sm text-slate-400">
                Đang tạo mã QR...
              </div>
            )}
            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-mono text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chữ ký HMAC động · Token: {tokenSeed.slice(-10)}</span>
            </div>
          </div>

          {/* Countdown Progress Bar */}
          <div className="w-full mt-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
              <span>Tự động đổi mã sau:</span>
              <span className="font-bold text-blue-600">{secondsLeft} giây</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-1000 rounded-full"
                style={{ width: `${(secondsLeft / 45) * 100}%` }}
              />
            </div>
          </div>

          {/* Kiosk Controls (No arbitrary employee dropdown to prevent spoofing) */}
          <div className="w-full mt-6 pt-5 border-t border-slate-100 text-left">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              {isKioskRole
                ? 'Chế độ Màn hình Kiosk tại cửa (Chỉ hiển thị mã QR):'
                : `Quét chấm công bằng tài khoản đang đăng nhập (${currentEmployee?.name || currentAccount.name}):`}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyToken}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
              >
                <Copy className="w-3.5 h-3.5 text-blue-600" />
                <span>Sao chép Token QR</span>
              </button>
              {!isKioskRole && (
                <button
                  onClick={handleSimulateSelfScan}
                  disabled={!settings.qrEnabled}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition shrink-0 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tự quét ({currentAccount.employeeId})</span>
                </button>
              )}
              <button
                onClick={handleManualRotate}
                title="Đổi mã QR ngay lập tức"
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
