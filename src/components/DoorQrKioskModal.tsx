import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { X, RefreshCw, QrCode, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { generateDoorQrToken, verifyDoorQrToken } from '../utils/helpers';

export const DoorQrKioskModal: React.FC = () => {
  const {
    isDoorQrModalOpen,
    setIsDoorQrModalOpen,
    settings,
    employees,
    scopedEmployees,
    currentAccount,
    selectedAttendanceDate,
    checkInOrOut,
    showToast,
  } = useHRM();

  const availableEmps = useMemo(() => {
    const list =
      currentAccount.roleId === 'door_kiosk' || scopedEmployees.length === 0
        ? employees
        : scopedEmployees;
    return list.filter((e) => e.status !== 'Đã nghỉ');
  }, [currentAccount.roleId, employees, scopedEmployees]);

  const [secondsLeft, setSecondsLeft] = useState(45);
  const [tokenSeed, setTokenSeed] = useState(() => generateDoorQrToken());
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [selectedEmpId, setSelectedEmpId] = useState<string>(availableEmps[0]?.id || 'NV0003');

  useEffect(() => {
    if (availableEmps.length > 0 && !availableEmps.some((e) => e.id === selectedEmpId)) {
      setSelectedEmpId(availableEmps[0].id);
    }
  }, [availableEmps, selectedEmpId]);

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

  const handleSimulateScan = () => {
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
      employeeId: selectedEmpId,
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
              <span>Token: {tokenSeed.slice(-10)}</span>
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

          {/* Demo / Test QR Scan Controls */}
          <div className="w-full mt-6 pt-5 border-t border-slate-100 text-left">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Giả lập nhân viên quét mã QR tại cửa:
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500 min-w-0"
              >
                {availableEmps.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.code} · {emp.department})
                  </option>
                ))}
              </select>
              <button
                onClick={handleSimulateScan}
                disabled={!settings.qrEnabled}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition shrink-0 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Quét chấm công</span>
              </button>
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
