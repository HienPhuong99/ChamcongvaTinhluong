import React, { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { calculateDistanceMeters, formatVND, getInitials } from '../utils/helpers';

export const MobileAppView: React.FC = () => {
  const {
    scopedEmployees,
    settings,
    attendanceRecords,
    checkInOrOut,
    createRequest,
    computePayrollRows,
    setIsDoorQrModalOpen,
  } = useHRM();

  const [selectedEmpId, setSelectedEmpId] = useState<string>('NV0000');
  const [clockStr, setClockStr] = useState<string>('15:41:39');
  const [simulatedOffset, setSimulatedOffset] = useState<'in_range' | 'out_of_range'>('in_range');
  const [mobileSubTab, setMobileSubTab] = useState<'checkin' | 'my_qr' | 'quick_req' | 'payslip'>(
    'checkin'
  );
  const [personalQrUrl, setPersonalQrUrl] = useState<string>('');
  const [reqType, setReqType] = useState<'Nghỉ phép năm' | 'Đăng ký tăng ca' | 'Bổ sung chấm công'>(
    'Nghỉ phép năm'
  );
  const [reqReason, setReqReason] = useState('');

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  const currentEmp =
    scopedEmployees.find((e) => e.id === selectedEmpId) || scopedEmployees[0];

  const todayRecord = attendanceRecords.find(
    (r) => r.employeeId === currentEmp?.id && r.date === '2026-10-09'
  );

  // User simulated coordinates relative to office
  const userCoords =
    simulatedOffset === 'in_range'
      ? { lat: settings.officeLat + 0.00018, lng: settings.officeLng + 0.00016 }
      : { lat: settings.officeLat + 0.0026, lng: settings.officeLng + 0.0021 };

  const distanceMeters = calculateDistanceMeters(
    settings.officeLat,
    settings.officeLng,
    userCoords.lat,
    userCoords.lng
  );
  const isInRange = distanceMeters <= settings.allowedRadiusMeters;

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

  // Initialize Leaflet Map (Matches 00:12 - 00:16 in video)
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

    // User GPS position marker
    const uMarker = L.circleMarker([userCoords.lat, userCoords.lng], {
      radius: 8,
      color: '#FFFFFF',
      weight: 2.5,
      fillColor: isInRange ? '#10B981' : '#EF4444',
      fillOpacity: 1,
    }).addTo(map);

    userMarkerRef.current = uMarker;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mobileSubTab, settings.officeLat, settings.officeLng, settings.allowedRadiusMeters, simulatedOffset]);

  // Personal QR generator
  useEffect(() => {
    if (!currentEmp) return;
    QRCode.toDataURL(
      JSON.stringify({
        empCode: currentEmp.code,
        empName: currentEmp.name,
        dept: currentEmp.department,
        ts: Date.now(),
      }),
      { width: 220, margin: 2 }
    )
      .then(setPersonalQrUrl)
      .catch(() => {});
  }, [currentEmp]);

  const handleMobileCheckIn = () => {
    if (!currentEmp) return;
    checkInOrOut({
      employeeId: currentEmp.id,
      method: isInRange ? 'GPS' : 'Từ xa',
      distanceMeters,
      gpsAccuracy: 12,
      note: isInRange
        ? `Chấm công GPS tại ${settings.officeName}`
        : 'Chấm công ngoài phạm vi (Làm việc từ xa)',
    });
  };

  const handleQuickRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmp || !reqReason.trim()) return;
    createRequest({
      employeeId: currentEmp.id,
      type: reqType,
      startDate: '10/10/2026',
      endDate: '10/10/2026',
      reason: reqReason,
      days: 1,
      otHours: reqType === 'Đăng ký tăng ca' ? 2 : undefined,
    });
    setReqReason('');
    setMobileSubTab('checkin');
  };

  const myPayslip = computePayrollRows('2026-09').find(
    (r) => r.employeeId === currentEmp?.id
  );

  return (
    <div className="p-4 sm:p-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 max-w-6xl mx-auto">
      {/* Left Phone Frame (Exact replica of 00:12 - 00:16 in video) */}
      <div className="w-full max-w-[390px] bg-white rounded-[38px] shadow-2xl border-[8px] border-slate-900 overflow-hidden flex flex-col shrink-0">
        {/* Mobile App Top Bar */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-600">
            <Menu className="w-5 h-5" />
            <Search className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800">phuonghihi Mobile</span>
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-slate-600" />
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
              {getInitials(currentEmp?.name || 'QT')}
            </div>
          </div>
        </div>

        {/* Mobile Screen Content */}
        <div className="p-3.5 space-y-4 bg-slate-50 flex-1">
          {mobileSubTab === 'checkin' && (
            <>
              {/* Blue Header Card (Exact match to 00:12 in video) */}
              <div className="rounded-3xl bg-gradient-to-b from-blue-600 to-blue-700 p-4 text-white shadow-md">
                <div className="text-xs text-blue-100 font-medium">
                  Chào buổi chiều,
                </div>
                <div className="text-lg font-bold tracking-tight mt-0.5">
                  {currentEmp?.name}
                </div>

                {/* Shift Info Box */}
                <div className="mt-3 p-3.5 rounded-2xl bg-white text-slate-900 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">
                    Thứ Sáu, 09/10/2026
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                    Hành chính
                  </div>
                  <div className="text-xs font-medium text-slate-600 mt-0.5">
                    08:00 – 17:30 · {settings.officeName}
                  </div>
                </div>
              </div>

              {/* Digital Clock & Big Circular Check-in Button (Exact match to 00:13-00:16) */}
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
                  className="my-5 w-40 h-40 rounded-full bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-95 text-white shadow-xl shadow-blue-500/30 flex flex-col items-center justify-center gap-2 transition cursor-pointer border-4 border-blue-100"
                >
                  <Camera className="w-8 h-8 text-white" />
                  <span className="text-sm font-bold tracking-wide">
                    {todayRecord?.checkIn && !todayRecord?.checkOut
                      ? 'Chấm công ra'
                      : 'Chấm công vào'}
                  </span>
                </button>

                {/* Embedded Leaflet OpenStreetMap */}
                <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                  <div ref={mapContainerRef} className="w-full h-40 z-0" />
                </div>

                {/* Distance & GPS Accuracy Pill (Exact match to 00:15 in video) */}
                <div
                  className={`mt-3 w-full py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold ${
                    isInRange
                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  {isInRange ? (
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  )}
                  <span>
                    {isInRange ? 'Trong phạm vi' : 'Ngoài phạm vi'} · cách{' '}
                    {distanceMeters} m · GPS ±12 m
                  </span>
                </div>
              </div>
            </>
          )}

          {mobileSubTab === 'my_qr' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 text-center space-y-3">
              <div className="text-sm font-bold text-slate-900">
                Mã QR định danh của tôi
              </div>
              <p className="text-xs text-slate-500">
                Đưa mã này cho Quản lý quét tại công trường / kho bãi hoặc quét mã QR tại cửa.
              </p>
              {personalQrUrl && (
                <img
                  src={personalQrUrl}
                  alt="Personal QR"
                  className="w-48 h-48 mx-auto rounded-2xl border border-slate-200 p-2"
                />
              )}
              <div className="text-xs font-semibold text-blue-600">
                {currentEmp?.name} · {currentEmp?.code}
              </div>
              <button
                onClick={() => setIsDoorQrModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
              >
                Quét mã QR tại cửa văn phòng
              </button>
            </div>
          )}

          {mobileSubTab === 'quick_req' && (
            <form
              onSubmit={handleQuickRequestSubmit}
              className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3"
            >
              <div className="text-sm font-bold text-slate-900">
                Gửi đơn từ nhanh trên điện thoại
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Loại đơn
                </label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value as typeof reqType)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="Nghỉ phép năm">Nghỉ phép năm</option>
                  <option value="Đăng ký tăng ca">Đăng ký tăng ca</option>
                  <option value="Bổ sung chấm công">Bổ sung chấm công</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Lý do chi tiết
                </label>
                <textarea
                  rows={3}
                  required
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="Nhập lý do xin nghỉ / tăng ca / bổ sung công..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
              >
                Gửi đơn cho quản lý duyệt
              </button>
            </form>
          )}

          {mobileSubTab === 'payslip' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">
                  Phiếu lương kỳ 2026-09
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                  Đã chốt
                </span>
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

      {/* Right Control Panel for Testing Mobile Check-in & GPS Simulation */}
      <div className="flex-1 w-full max-w-xl bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-2xs">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <Navigation className="w-3.5 h-3.5" />
            Bảng điều khiển Giả lập &amp; Kiểm thử App Điện Thoại
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">
            Trải nghiệm App Chấm Công GPS &amp; QR
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Nhân viên mở điện thoại đứng trong bán kính văn phòng ({settings.allowedRadiusMeters}m)
            là bấm <strong>Chấm công vào</strong>, máy tự đối chiếu vị trí GPS trên bản đồ Leaflet.
          </p>
        </div>

        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              1. Chọn nhân viên đang cầm điện thoại:
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              2. Giả lập vị trí đứng của nhân viên so với {settings.officeName}:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSimulatedOffset('in_range')}
                className={`p-3 rounded-xl border text-left transition ${
                  simulatedOffset === 'in_range'
                    ? 'bg-emerald-50/70 border-emerald-500 text-emerald-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold">📍 Đứng trong văn phòng</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Cách tâm văn phòng ~27m (Hợp lệ)
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSimulatedOffset('out_of_range')}
                className={`p-3 rounded-xl border text-left transition ${
                  simulatedOffset === 'out_of_range'
                    ? 'bg-amber-50/70 border-amber-500 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold">🚗 Đứng ngoài bán kính</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Cách văn phòng ~365m (Chấm từ xa)
                </div>
              </button>
            </div>
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
