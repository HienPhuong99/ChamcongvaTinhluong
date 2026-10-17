import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import QRCode from 'qrcode';
import {
  Camera,
  MapPin,
  QrCode,
  FilePlus2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Menu,
  Search,
  Bell,
  ShieldCheck,
  LocateFixed,
  X,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { SHIFT_TEMPLATES } from '../data/seedData';
import {
  calculateDistanceMeters,
  canManageSchedules,
  compressImageToDataUrl,
  formatIsoToVN,
  formatVND,
  formatVietnameseDayHeader,
  getDynamicPeriods,
  getGreetingByHour,
  getInitials,
  getPreviousMonthPeriod,
  getTodayIsoDate,
  requestQrFromServer,
  verifyQrWithServer,
} from '../utils/helpers';

export const MobileAppView: React.FC = () => {
  const {
    scopedEmployees,
    employees,
    settings,
    attendanceRecords,
    shiftAssignments,
    selectedAttendanceDate,
    currentAccount,
    checkInOrOut,
    createRequest,
    computePayrollRows,
    showToast,
    setIsDoorQrModalOpen,
    setIsMobileMenuOpen,
    setIsCommandPaletteOpen,
  } = useHRM();

  const activeDate = selectedAttendanceDate || getTodayIsoDate();
  const isDemoGpsEnabled = Boolean(settings.demoGpsSimulationEnabled);
  const canOpenKioskModal =
    currentAccount.roleId === 'door_kiosk' || canManageSchedules(currentAccount.roleId);

  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    currentAccount.employeeId || scopedEmployees[0]?.id || 'NV0000'
  );
  const [clockStr, setClockStr] = useState<string>('08:00:00');
  // Issue B3: Default to 'real_gps' instead of simulated 'in_range'
  const [gpsMode, setGpsMode] = useState<'real_gps' | 'in_range' | 'out_of_range'>('real_gps');
  const [realGpsCoords, setRealGpsCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string>(
    'Đang chờ cấp quyền vị trí GPS từ trình duyệt...'
  );
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);

  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [mobileSubTab, setMobileSubTab] = useState<'checkin' | 'my_qr' | 'quick_req' | 'payslip'>(
    'checkin'
  );
  const [personalQrUrl, setPersonalQrUrl] = useState<string>('');
  const [personalQrRaw, setPersonalQrRaw] = useState<string>('');
  const [scanInputToken, setScanInputToken] = useState<string>('');
  // Issue E5: Default payslip period computed dynamically from current date (previous month)
  const [payslipPeriod, setPayslipPeriod] = useState<string>(() => getPreviousMonthPeriod());
  const [reqType, setReqType] = useState<
    | 'Nghỉ phép năm'
    | 'Đổi ca trực'
    | 'Ứng lương nhanh'
    | 'Đăng ký tăng ca'
    | 'Bổ sung chấm công'
  >('Nghỉ phép năm');
  const [reqDate, setReqDate] = useState<string>(() => formatIsoToVN(activeDate));
  const [reqReason, setReqReason] = useState('');
  const [reqTargetShift, setReqTargetShift] = useState<'sang' | 'chieu' | 'hanh_chinh' | 'ca_gay'>(
    'sang'
  );
  const [reqAdvanceAmount, setReqAdvanceAmount] = useState<number>(3000000);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const selfieFileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // If demo GPS mode gets disabled in settings, force back to real_gps
  useEffect(() => {
    if (!isDemoGpsEnabled && gpsMode !== 'real_gps') {
      setGpsMode('real_gps');
    }
  }, [isDemoGpsEnabled, gpsMode]);

  useEffect(() => {
    if (
      !scopedEmployees.some((e) => e.id === selectedEmpId) &&
      scopedEmployees.length > 0
    ) {
      setSelectedEmpId(currentAccount.employeeId || scopedEmployees[0].id);
    }
  }, [scopedEmployees, selectedEmpId, currentAccount.employeeId]);

  const currentEmp =
    scopedEmployees.find((e) => e.id === selectedEmpId) || scopedEmployees[0];

  const todayRecord = attendanceRecords.find(
    (r) => r.employeeId === currentEmp?.id && r.date === activeDate
  );

  const scheduledShiftCode = shiftAssignments.find(
    (s) => s.employeeId === currentEmp?.id && s.date === activeDate
  )?.shiftCode;

  const assignedShiftDef = scheduledShiftCode
    ? SHIFT_TEMPLATES.find((s) => s.code === scheduledShiftCode) || null
    : null;

  // Request real browser geolocation on mount and on user request (Issue B3)
  const requestRealGps = useCallback(
    (silent = false) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setRealGpsCoords(null);
        setGpsErrorMsg('Thiết bị hoặc trình duyệt không hỗ trợ định vị GPS.');
        if (!silent) {
          showToast('Thiết bị không hỗ trợ định vị GPS!', undefined, 'warning');
        }
        return;
      }
      setIsLocatingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocatingGps(false);
          setRealGpsCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 15,
          });
          setGpsErrorMsg('');
          setGpsMode('real_gps');
          if (!silent) {
            showToast(
              'Đã lấy toạ độ GPS thực tế từ thiết bị!',
              `Vĩ độ: ${pos.coords.latitude.toFixed(5)} · Kinh độ: ${pos.coords.longitude.toFixed(5)} (±${Math.round(pos.coords.accuracy || 15)}m)`
            );
          }
        },
        (err) => {
          setIsLocatingGps(false);
          setRealGpsCoords(null);
          const reason =
            err.code === 1
              ? 'Đã từ chối quyền truy cập vị trí (Location Permission Denied).'
              : 'Không thể lấy vị trí GPS từ thiết bị.';
          setGpsErrorMsg(reason);
          if (!silent) {
            showToast('Không thể định vị GPS!', reason, 'warning');
          }
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    },
    [showToast]
  );

  useEffect(() => {
    requestRealGps(true);
  }, [requestRealGps]);

  // Stop camera stream when unmounting or closing camera
  const stopCameraStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Determine effective GPS position (Issue B3: null when real_gps has no permission/coords)
  const activeCoords: { lat: number; lng: number; accuracy: number } | null =
    gpsMode === 'real_gps'
      ? realGpsCoords
      : isDemoGpsEnabled && gpsMode === 'in_range'
      ? { lat: settings.officeLat + 0.00018, lng: settings.officeLng + 0.00016, accuracy: 12 }
      : isDemoGpsEnabled && gpsMode === 'out_of_range'
      ? { lat: settings.officeLat + 0.0026, lng: settings.officeLng + 0.0021, accuracy: 15 }
      : null;

  const hasValidGpsPosition = activeCoords !== null;
  const currentAccuracy = activeCoords ? Math.round(activeCoords.accuracy) : 0;
  const distanceMeters = activeCoords
    ? calculateDistanceMeters(
        settings.officeLat,
        settings.officeLng,
        activeCoords.lat,
        activeCoords.lng
      )
    : null;
  const isInRange =
    distanceMeters !== null && distanceMeters <= settings.allowedRadiusMeters;

  // Issue B3 & E2: Open real WebRTC camera or file input (NO fake canvas generator)
  const handleOpenCameraOrFile = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        mediaStreamRef.current = stream;
        setIsCameraOpen(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }, 50);
        return;
      } catch {
        // Fallback to native file input with capture="user" if webcam is unavailable or blocked
      }
    }
    selfieFileInputRef.current?.click();
  };

  const handleCaptureFromVideoStream = async () => {
    if (!videoRef.current || !videoRef.current.videoWidth) {
      showToast('Camera chưa sẵn sàng!', 'Vui lòng chờ hình ảnh từ Camera hoặc chọn tải file ảnh.', 'warning');
      return;
    }
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopCameraStream();
    try {
      const compressed = await compressImageToDataUrl(rawDataUrl, 480, 0.6);
      setCapturedPhotoUrl(compressed);
      showToast('Đã chụp và nén ảnh Selfie từ Camera!', `${currentEmp?.name || ''} · ${clockStr}`);
    } catch {
      setCapturedPhotoUrl(rawDataUrl);
    }
  };

  // Issue E2: Compress uploaded photo file (even 4MB+) down to ≤480px JPEG 0.6 (~25KB)
  const handleSelfieFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Tệp không hợp lệ!', 'Vui lòng chọn hoặc chụp tệp hình ảnh (JPEG/PNG/WebP).', 'warning');
      return;
    }
    try {
      const compressedDataUrl = await compressImageToDataUrl(file, 480, 0.6);
      setCapturedPhotoUrl(compressedDataUrl);
      const kb = Math.max(1, Math.round((compressedDataUrl.length * 0.75) / 1024));
      showToast(
        'Đã đính kèm và tối ưu dung lượng ảnh Selfie!',
        `${file.name} → Đã nén còn ~${kb}KB (An toàn bộ nhớ)`
      );
    } catch {
      showToast('Không thể xử lý ảnh!', 'Vui lòng thử lại với một ảnh khác.', 'warning');
    } finally {
      e.target.value = '';
    }
  };

  // Live digital clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setClockStr(`${hh}:${mm}:${ss}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (mobileSubTab !== 'checkin' || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [settings.officeLat, settings.officeLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    // Office allowed radius green circle
    L.circle([settings.officeLat, settings.officeLng], {
      radius: settings.allowedRadiusMeters,
      color: '#16A34A',
      weight: 2,
      fillColor: '#22C55E',
      fillOpacity: 0.18,
    }).addTo(map);

    // Office center dot
    L.circleMarker([settings.officeLat, settings.officeLng], {
      radius: 7,
      color: '#FFFFFF',
      weight: 2,
      fillColor: '#2563EB',
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup(`<b>${settings.officeName}</b><br/>Bán kính: ${settings.allowedRadiusMeters}m`);

    // User GPS position marker (only drawn when valid GPS coordinates exist)
    if (activeCoords) {
      L.circleMarker([activeCoords.lat, activeCoords.lng], {
        radius: 8,
        color: '#FFFFFF',
        weight: 2.5,
        fillColor: isInRange ? '#10B981' : '#EF4444',
        fillOpacity: 1,
      }).addTo(map);
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [
    mobileSubTab,
    settings.officeLat,
    settings.officeLng,
    settings.allowedRadiusMeters,
     settings.officeName,
    activeCoords,
    isInRange,
  ]);

  // Issue B5: Signed Personal QR generator via Server HMAC
  useEffect(() => {
    if (!currentEmp) return;
    let cancelled = false;
    (async () => {
      let signedPayload = '';
      try {
        signedPayload = await requestQrFromServer({
          kind: 'personal',
          empCode: currentEmp.code,
          name: currentEmp.name,
          department: currentEmp.department,
          backendApiUrl: settings.backendApiUrl,
        });
      } catch {
        signedPayload = '';
      }
      if (cancelled) return;
      setPersonalQrRaw(signedPayload);
      QRCode.toDataURL(signedPayload, { width: 220, margin: 2 })
        .then((url) => {
          if (!cancelled) setPersonalQrUrl(url);
        })
        .catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [currentEmp, settings.backendApiUrl]);

  const handleMobileCheckIn = () => {
    if (!currentEmp) return;
    // Issue B3: Block GPS check-in if geolocation is denied or unavailable
    if (!hasValidGpsPosition || distanceMeters === null || !activeCoords) {
      showToast(
        'Chưa định vị được vị trí GPS!',
        gpsErrorMsg ||
          'Vui lòng cấp quyền truy cập vị trí (Location) trên trình duyệt trước khi chấm công GPS.',
        'warning'
      );
      return;
    }

    checkInOrOut({
      employeeId: currentEmp.id,
      date: activeDate,
      method: isInRange ? 'GPS' : 'Từ xa',
      distanceMeters,
      gpsAccuracy: currentAccuracy,
      lat: activeCoords.lat,
      lng: activeCoords.lng,
      photoUrl: capturedPhotoUrl || undefined,
      note: isInRange
        ? `Chấm công GPS tại ${settings.officeName} [±${currentAccuracy}m]`
        : 'Chấm công ngoài phạm vi (Làm việc từ xa)',
    });
  };

  // Issue B5: Verify QR token on the server so QR displayed on Device A works on Device B and forged QR fails
  const handleVerifyScannedQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmp) return;
    const raw = scanInputToken.trim();
    if (!raw) {
      showToast(
        'Vui lòng nhập hoặc dán mã QR cần quét!',
        'Hãy quét mã QR tại cửa hàng hoặc dán chuỗi Token QR vào ô.',
        'warning'
      );
      return;
    }
    if (!settings.qrEnabled) {
      showToast('Chấm công QR đang tắt!', 'Vui lòng bật Chấm công bằng mã QR trong Cài đặt.', 'warning');
      return;
    }

    const verification = await verifyQrWithServer(raw, settings.backendApiUrl);
    if (!verification.valid) {
      showToast(
        'Mã QR không hợp lệ hoặc đã hết hạn!',
        verification.error || 'Chữ ký mã QR không khớp với khoá bảo mật trên Server.',
        'warning'
      );
      return;
    }

    if (verification.kind === 'personal' && verification.empCode) {
      const targetEmp = employees.find((emp) => emp.code === verification.empCode);
      if (!targetEmp) {
        showToast('Không tìm thấy nhân viên trong mã QR!', undefined, 'warning');
        return;
      }
      if (targetEmp.id !== currentAccount.employeeId) {
        if (!canManageSchedules(currentAccount.roleId) || !settings.qrManagerScanEmployee) {
          showToast(
            'Không có quyền quét mã QR của nhân viên khác!',
            'Chỉ Quản lý / Nhân sự (khi bật cho phép quét QR nhân viên) mới được quét mã định danh của nhân viên.',
            'warning'
          );
          return;
        }
        if (!scopedEmployees.some((emp) => emp.id === targetEmp.id)) {
          showToast(
            'Nhân viên ngoài phạm vi quản lý!',
            `Bạn không có quyền chấm công hộ cho nhân sự phòng ${targetEmp.department}.`,
            'warning'
          );
          return;
        }
      }
      checkInOrOut({
        employeeId: targetEmp.id,
        date: activeDate,
        method: 'QR tại cửa',
        distanceMeters: 4,
        gpsAccuracy: 5,
        note: `Quét mã QR định danh xác thực Server (${verification.empCode})`,
      });
      setScanInputToken('');
      return;
    }

    if (verification.kind === 'door') {
      checkInOrOut({
        employeeId: currentEmp.id,
        date: activeDate,
        method: 'QR tại cửa',
        distanceMeters: 5,
        gpsAccuracy: 6,
        note: 'Quét mã QR động 45s tại cửa văn phòng (Đã xác thực Server)',
      });
      setScanInputToken('');
      return;
    }
  };

  // Issue C5: EWA limit = 0 when baseSalary is 0 (no 15,000,000 fallback)
  const declaredSalary = Math.max(0, Number(currentEmp?.baseSalary) || 0);
  const maxEwaAdvance = declaredSalary > 0 ? Math.round(declaredSalary * 0.3) : 0;

  const handleQuickRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmp || !reqReason.trim()) return;
    const ok = createRequest({
      employeeId: currentEmp.id,
      type: reqType,
      startDate: reqDate || formatIsoToVN(activeDate),
      endDate: reqDate || formatIsoToVN(activeDate),
      reason: reqReason,
      days: 1,
      otHours: reqType === 'Đăng ký tăng ca' ? 2 : undefined,
      targetShiftCode: reqType === 'Đổi ca trực' ? reqTargetShift : undefined,
      advanceAmount: reqType === 'Ứng lương nhanh' ? reqAdvanceAmount : undefined,
    });
    if (ok) {
      setReqReason('');
      setMobileSubTab('checkin');
    }
  };

  const myPayslip = computePayrollRows(payslipPeriod).find(
    (r) => r.employeeId === currentEmp?.id
  );

  return (
    <div className="p-2.5 sm:p-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-8 max-w-6xl mx-auto">
      {/* Left Phone Frame */}
      <div className="w-full max-w-[400px] bg-white rounded-3xl sm:rounded-[38px] shadow-xl sm:shadow-2xl border border-slate-200 sm:border-[8px] sm:border-slate-900 overflow-hidden flex flex-col shrink-0">
        {/* Mobile App Top Bar */}
        <div className="hidden sm:flex px-4 py-3 bg-white border-b border-slate-100 items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-600">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
              title="Mở menu điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
              title="Tìm kiếm nhanh (Ctrl + K)"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs font-bold text-slate-800">phuonghihi Mobile</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileSubTab('quick_req')}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
              title="Gửi đơn nhanh"
            >
              <Bell className="w-4 h-4 text-slate-600" />
            </button>
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
              {getInitials(currentEmp?.name || 'QT')}
            </div>
          </div>
        </div>

        {/* Inline Quick Switcher for Mobile Users */}
        <div className="px-3.5 py-2 bg-slate-100/80 border-b border-slate-200/70 flex items-center justify-between gap-2">
          <select
            aria-label="Đổi nhân viên trên điện thoại"
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-800 truncate"
          >
            {scopedEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.code})
              </option>
            ))}
          </select>

          {isDemoGpsEnabled ? (
            <button
              type="button"
              onClick={() =>
                setGpsMode((prev) => (prev === 'in_range' ? 'out_of_range' : 'in_range'))
              }
              className={`px-2 py-1 rounded-lg text-[10.5px] font-bold border whitespace-nowrap shrink-0 transition ${
                gpsMode === 'in_range'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}
            >
              {gpsMode === 'in_range' ? '📍 Demo: Tại quầy' : '🚶 Demo: Ngoài vùng'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => requestRealGps(false)}
              className={`px-2 py-1 rounded-lg text-[10.5px] font-bold border whitespace-nowrap shrink-0 transition flex items-center gap-1 ${
                hasValidGpsPosition
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-rose-50 border-rose-300 text-rose-700'
              }`}
            >
              <LocateFixed className="w-3 h-3" />
              <span>
                {isLocatingGps
                  ? 'Đang định vị...'
                  : hasValidGpsPosition
                  ? `GPS thật (${distanceMeters}m)`
                  : 'Định vị GPS'}
              </span>
            </button>
          )}
        </div>

        {/* Quick 4-Tab Segmented Bar on Mobile (< 640px) */}
        <div className="grid sm:hidden grid-cols-4 gap-1 p-1.5 bg-white border-b border-slate-100">
          {[
            { id: 'checkin', label: 'Chấm công', icon: MapPin },
            { id: 'my_qr', label: 'Mã QR', icon: QrCode },
            { id: 'quick_req', label: 'Gửi đơn', icon: FilePlus2 },
            { id: 'payslip', label: 'Phiếu lương', icon: Wallet },
          ].map((item) => {
            const Icon = item.icon;
            const active = mobileSubTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMobileSubTab(item.id as typeof mobileSubTab)}
                className={`flex items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-bold transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Screen Content */}
        <div className="p-3.5 space-y-4 bg-slate-50 flex-1">
          {mobileSubTab === 'checkin' && (
            <>
              {/* Blue Header Card */}
              <div className="rounded-3xl bg-gradient-to-b from-blue-600 to-blue-700 p-4 text-white shadow-md">
                <div className="text-xs text-blue-100 font-medium">
                  {getGreetingByHour()},
                </div>
                <div className="text-lg font-bold tracking-tight mt-0.5 truncate">
                  {currentEmp?.name}
                </div>

                {/* Shift Info Box */}
                <div className="mt-3 p-3.5 rounded-2xl bg-white text-slate-900 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">
                    {formatVietnameseDayHeader(activeDate)}
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {assignedShiftDef ? assignedShiftDef.name : 'Không có ca phân công'}
                  </div>
                  <div className="text-xs font-medium text-slate-600 mt-0.5 truncate">
                    {assignedShiftDef
                      ? `${assignedShiftDef.startTime}–${assignedShiftDef.endTime} · ${settings.officeName}`
                      : `Ngoài lịch phân ca (Không tính muộn) · ${settings.officeName}`}
                  </div>
                </div>
              </div>

              {/* Digital Clock & Big Circular Check-in Button */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col items-center shadow-2xs">
                <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                  {clockStr}
                </div>

                {todayRecord?.checkIn && (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      Đã vào ca lúc {todayRecord.checkIn}
                      {todayRecord.checkOut ? ` · Ra lúc ${todayRecord.checkOut}` : ''}
                    </span>
                  </div>
                )}

                {/* Big Round Blue Check-in Button */}
                <button
                  onClick={handleMobileCheckIn}
                  disabled={!hasValidGpsPosition}
                  className={`my-4 w-36 h-36 rounded-full text-white shadow-xl flex flex-col items-center justify-center gap-2 transition border-4 ${
                    hasValidGpsPosition
                      ? 'bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-95 shadow-blue-500/30 border-blue-100 cursor-pointer'
                      : 'bg-slate-300 border-slate-200 text-slate-500 shadow-none cursor-not-allowed'
                  }`}
                >
                  <Camera className="w-7 h-7 text-white" />
                  <span className="text-sm font-bold tracking-wide text-center px-2">
                    {!hasValidGpsPosition
                      ? 'Cần cấp quyền GPS'
                      : todayRecord?.checkIn && !todayRecord?.checkOut
                      ? 'Chấm công ra'
                      : todayRecord?.checkOut
                      ? 'Đã hoàn tất'
                      : 'Chấm công vào'}
                  </span>
                </button>

                {/* Real Camera & File Selfie Controls (Issue B3 & E2: No fake canvas selfie) */}
                <div className="mb-3 w-full space-y-2">
                  <div className="py-1.5 px-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-mono flex items-center justify-between">
                    <span>📸 {currentEmp?.code} · {settings.officeName}</span>
                    <span className={hasValidGpsPosition ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {hasValidGpsPosition
                        ? `GPS ${distanceMeters}m (±${currentAccuracy}m)`
                        : 'Chưa có GPS'}
                    </span>
                  </div>

                  {isCameraOpen && (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500 bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-44 object-cover"
                      />
                      <div className="p-2 bg-slate-900/90 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={handleCaptureFromVideoStream}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                        >
                          Chụp ảnh từ Camera
                        </button>
                        <button
                          type="button"
                          onClick={stopCameraStream}
                          className="p-1.5 rounded-xl bg-slate-700 text-white hover:bg-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleOpenCameraOrFile}
                      className="flex-1 py-1.5 px-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition flex items-center justify-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {capturedPhotoUrl ? 'Chụp lại bằng Camera' : 'Mở Camera chụp Selfie'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => selfieFileInputRef.current?.click()}
                      className="py-1.5 px-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition"
                    >
                      Chọn ảnh chụp
                    </button>
                    <input
                      ref={selfieFileInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleSelfieFileChange}
                      className="hidden"
                    />
                  </div>

                  {capturedPhotoUrl && (
                    <div className="relative rounded-xl overflow-hidden border border-emerald-300 bg-slate-900">
                      <img
                        src={capturedPhotoUrl}
                        alt="Selfie chấm công"
                        className="w-full h-24 object-cover"
                      />
                      <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                        ✓ Đã nén &amp; đính kèm ảnh thật
                      </span>
                    </div>
                  )}
                </div>

                {/* Embedded Leaflet OpenStreetMap */}
                <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                  <div ref={mapContainerRef} className="w-full h-36 z-0" />
                </div>

                {/* Distance & GPS Accuracy Pill */}
                <div
                  className={`mt-3 w-full py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold ${
                    !hasValidGpsPosition
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : isInRange
                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  {!hasValidGpsPosition ? (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  ) : isInRange ? (
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  )}
                  <span className="truncate">
                    {!hasValidGpsPosition
                      ? gpsErrorMsg || 'Chưa định vị được GPS (Cần cấp quyền vị trí)'
                      : `${isInRange ? 'Trong phạm vi' : 'Ngoài phạm vi'} · cách ${distanceMeters} m · GPS ±${currentAccuracy} m`}
                  </span>
                </div>
              </div>
            </>
          )}

          {mobileSubTab === 'my_qr' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 text-center space-y-3">
              <div className="text-sm font-bold text-slate-900">
                Mã QR định danh của tôi (Chữ ký Server)
              </div>
              <p className="text-xs text-slate-500">
                Đưa mã này cho Quản lý quét tại quầy cửa hàng hoặc quét mã QR động 45s tại cửa.
              </p>
              {personalQrUrl && (
                <img
                  src={personalQrUrl}
                  alt="Personal QR"
                  className="w-48 h-48 mx-auto rounded-2xl border border-slate-200 p-2"
                />
              )}
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{currentEmp?.name} · {currentEmp?.code}</span>
              </div>

              <form onSubmit={handleVerifyScannedQr} className="pt-2 space-y-2 text-left">
                <label className="block text-[11px] font-semibold text-slate-600">
                  Xác thực mã QR với Server (Dán chuỗi Token QR tại cửa hoặc mã QR nhân viên):
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={scanInputToken}
                    onChange={(e) => setScanInputToken(e.target.value)}
                    placeholder="Dán Token QR tại cửa (45s) hoặc chuỗi QR vào đây..."
                    className="flex-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px] font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                  >
                    Xác thực QR
                  </button>
                </div>
                {canManageSchedules(currentAccount.roleId) && settings.qrManagerScanEmployee && (
                  <button
                    type="button"
                    onClick={() => setScanInputToken(personalQrRaw)}
                    className="text-[10.5px] font-semibold text-blue-600 hover:underline"
                  >
                    + Điền mã QR định danh của {currentEmp?.code} (Dành cho Quản lý quét hộ)
                  </button>
                )}
              </form>

              {/* Issue E1: Only door_kiosk or management roles can open Kiosk QR modal */}
              {canOpenKioskModal && (
                <button
                  type="button"
                  onClick={() => setIsDoorQrModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Mở Kiosk QR động 45s tại cửa văn phòng
                </button>
              )}
            </div>
          )}

          {mobileSubTab === 'quick_req' && (
            <form
              onSubmit={handleQuickRequestSubmit}
              className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3"
            >
              <div className="text-sm font-bold text-slate-900">
                Gửi đơn từ &amp; Đổi ca / Ứng lương nhanh
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Loại đơn
                </label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value as typeof reqType)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                >
                  <option value="Nghỉ phép năm">🏖️ Nghỉ phép năm</option>
                  <option value="Đổi ca trực">🔄 Đổi ca trực cửa hàng</option>
                  <option value="Ứng lương nhanh">💸 Ứng lương nhanh (EWA tới 30%)</option>
                  <option value="Đăng ký tăng ca">⏱️ Đăng ký tăng ca (OT)</option>
                  <option value="Bổ sung chấm công">📝 Bổ sung chấm công</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Ngày áp dụng (DD/MM/YYYY)
                </label>
                <input
                  type="text"
                  value={reqDate}
                  onChange={(e) => setReqDate(e.target.value)}
                  placeholder="16/10/2026"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                />
              </div>
              {reqType === 'Đổi ca trực' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Ca muốn đổi sang
                  </label>
                  <select
                    value={reqTargetShift}
                    onChange={(e) =>
                      setReqTargetShift(
                        e.target.value as 'sang' | 'chieu' | 'hanh_chinh' | 'ca_gay'
                      )
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-indigo-50/50 font-semibold text-indigo-900"
                  >
                    <option value="sang">Ca Sáng (06:00 - 14:00)</option>
                    <option value="chieu">Ca Chiều (14:00 - 22:00)</option>
                    <option value="hanh_chinh">Hành chính (08:00 - 17:30)</option>
                    <option value="ca_gay">Ca gãy (08:00 - 21:00)</option>
                  </select>
                </div>
              )}
              {reqType === 'Ứng lương nhanh' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Số tiền ứng trước (VNĐ - Tối đa 30% lương cơ bản:{' '}
                    {formatVND(maxEwaAdvance)})
                  </label>
                  {maxEwaAdvance <= 0 ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">
                      Nhân viên chưa được khai lương cơ bản (0đ) nên hạn mức ứng lương là 0 ₫.
                    </div>
                  ) : (
                    <input
                      type="number"
                      step={500000}
                      min={0}
                      max={maxEwaAdvance}
                      value={reqAdvanceAmount}
                      onChange={(e) => setReqAdvanceAmount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 bg-emerald-50/50 font-bold text-emerald-800"
                    />
                  )}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Lý do chi tiết
                </label>
                <textarea
                  rows={3}
                  required
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="Nhập lý do xin nghỉ / đổi ca / ứng lương..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200"
                />
              </div>
              <button
                type="submit"
                disabled={reqType === 'Ứng lương nhanh' && maxEwaAdvance <= 0}
                className="w-full py-2.5 rounded-xl bg-blue-600 disabled:bg-slate-300 text-white text-xs font-semibold"
              >
                Gửi đơn cho quản lý duyệt
              </button>
            </form>
          )}

          {mobileSubTab === 'payslip' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-900">
                  Phiếu lương kỳ
                </span>
                <select
                  value={payslipPeriod}
                  onChange={(e) => setPayslipPeriod(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800"
                >
                  {getDynamicPeriods(activeDate).map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              {myPayslip ? (
                <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngày công tính lương:</span>
                    <span className="font-semibold">
                      {myPayslip.actualDays + myPayslip.paidLeaveDays} /{' '}
                      {myPayslip.standardDays} công
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lương theo ngày công:</span>
                    <span className="font-semibold">
                      {formatVND(myPayslip.proRatedSalary)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phụ cấp + Tăng ca + Thưởng:</span>
                    <span className="font-semibold text-emerald-600">
                      +{formatVND(myPayslip.allowance + myPayslip.otAmount + myPayslip.bonus)}
                    </span>
                  </div>
                  {myPayslip.latePenaltyAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phạt đi muộn:</span>
                      <span className="font-semibold text-rose-600">
                        -{formatVND(myPayslip.latePenaltyAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khấu trừ khác &amp; Tạm ứng EWA:</span>
                    <span className="font-semibold text-rose-600">
                      -{formatVND(myPayslip.otherDeduction)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">BHXH (10.5%) &amp; Thuế TNCN:</span>
                    <span className="font-semibold text-rose-600">
                      -{formatVND(myPayslip.insuranceAmount + myPayslip.taxAmount)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-bold text-slate-900">
                    <span>Thực lĩnh:</span>
                    <span className="text-blue-600 text-base">
                      {formatVND(myPayslip.netSalary)}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={maxEwaAdvance <= 0}
                    onClick={() => {
                      setReqType('Ứng lương nhanh');
                      setReqAdvanceAmount(Math.min(3000000, maxEwaAdvance));
                      setReqReason('Ứng trước lương trên số công tích lũy thực tế');
                      setMobileSubTab('quick_req');
                    }}
                    className="w-full mt-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold transition"
                  >
                    {maxEwaAdvance > 0
                      ? `💸 Ứng lương nhanh 24/7 (Tối đa ${formatVND(maxEwaAdvance)})`
                      : 'Chưa khai lương cơ bản (Hạn mức ứng: 0đ)'}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Chưa có dữ liệu phiếu lương.</p>
              )}
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="px-3 py-2.5 bg-white border-t border-slate-200 grid grid-cols-4 gap-1 text-center">
          {[
            { id: 'checkin', label: 'Chấm công', icon: MapPin },
            { id: 'my_qr', label: 'Mã QR', icon: QrCode },
            { id: 'quick_req', label: 'Gửi đơn', icon: FilePlus2 },
            { id: 'payslip', label: 'Phiếu lương', icon: Wallet },
          ].map((item) => {
            const Icon = item.icon;
            const active = mobileSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setMobileSubTab(item.id as typeof mobileSubTab)}
                className={`flex flex-col items-center gap-1 py-1 rounded-xl text-[11px] font-semibold transition ${
                  active ? 'text-blue-600 bg-blue-50/70' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Control Panel for Mobile Check-in */}
      <div className="flex-1 w-full max-w-xl bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-2xs">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <Navigation className="w-3.5 h-3.5" />
            Thông tin Định vị GPS &amp; Thiết bị Di động
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">
            Chấm Công GPS Thực Tế &amp; Mã QR Server
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống mặc định lấy vị trí thực tế từ <code>navigator.geolocation</code> và chụp ảnh trực tiếp từ Camera thiết bị (nén tự động ≤ 480px JPEG 0.6).
          </p>
        </div>

        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              1. Nhân viên đang thao tác:
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 font-medium"
            >
              {scopedEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.code} · {emp.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                2. Trạng thái định vị GPS so với {settings.officeName}:
              </label>
              <button
                type="button"
                onClick={() => requestRealGps(false)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>Lấy lại GPS thực tế</span>
              </button>
            </div>

            {isDemoGpsEnabled ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGpsMode('in_range')}
                  className={`p-3 rounded-xl border text-left transition ${
                    gpsMode === 'in_range'
                      ? 'bg-emerald-50/70 border-emerald-500 text-emerald-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">📍 Demo: Đứng trong văn phòng</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Cách tâm văn phòng ~27m (Hợp lệ)
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setGpsMode('out_of_range')}
                  className={`p-3 rounded-xl border text-left transition ${
                    gpsMode === 'out_of_range'
                      ? 'bg-amber-50/70 border-amber-500 text-amber-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">🚗 Demo: Đứng ngoài bán kính</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Cách văn phòng ~365m (Chấm từ xa)
                  </div>
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 space-y-1">
                <div className="font-semibold text-slate-900">
                  {hasValidGpsPosition
                    ? `Đã xác thực toạ độ GPS thật: cách tâm cửa hàng ${distanceMeters}m (±${currentAccuracy}m)`
                    : `Chưa có toạ độ GPS: ${gpsErrorMsg}`}
                </div>
                <div className="text-[11px] text-slate-500">
                  Chế độ giả lập vị trí đang tắt ở bản thật. Quản trị viên chỉ có thể bật cờ Demo trong mục Cài đặt khi cần trình diễn.
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
            <div className="font-bold text-slate-800">
              Hướng dẫn cài App lên màn hình chính điện thoại (PWA):
            </div>
            <p>
              • Trên <strong>iPhone (Safari)</strong>: Bấm nút Chia sẻ (Share) → chọn{' '}
              <strong>Thêm vào MH chính (Add to Home Screen)</strong>.
            </p>
            <p>
              • Trên <strong>Android (Chrome)</strong>: Bấm biểu tượng <strong>Cài đặt ứng dụng</strong> trên thanh địa chỉ để dùng toàn màn hình như App gốc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
