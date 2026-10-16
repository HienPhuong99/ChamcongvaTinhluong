import React, { useMemo, useState } from 'react';
import {
  Clock,
  QrCode,
  Download,
  Bell,
  MapPin,
  Settings,
  Search,
  UserCheck,
  X,
  Calendar,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { ShiftCode } from '../types';
import {
  canManageSchedules,
  canManageSettings,
  exportToCSV,
  formatIsoToVN,
  formatVietnameseDayHeader,
  getInitials,
  getTodayIsoDate,
  matchesSearch,
} from '../utils/helpers';

export const AttendanceView: React.FC = () => {
  const {
    scopedEmployees,
    attendanceRecords,
    shiftAssignments,
    shiftTemplates,
    settings,
    currentAccount,
    selectedAttendanceDate,
    setSelectedAttendanceDate,
    remindUncheckedEmployees,
    proxyCheckIn,
    setIsDoorQrModalOpen,
    setActiveTab,
  } = useHRM();

  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'Đúng giờ' | 'Đi muộn' | 'Chưa chấm' | 'Không có ca'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllRows, setShowAllRows] = useState(false);
  const [proxyModalEmpId, setProxyModalEmpId] = useState<string | null>(null);
  const [proxyShift, setProxyShift] = useState<ShiftCode>('hanh_chinh');
  const [proxyIn, setProxyIn] = useState('08:00');
  const [proxyOut, setProxyOut] = useState('17:30');
  const [proxyReason, setProxyReason] = useState(
    'Nhân viên quên điện thoại, báo quản lý xác nhận'
  );

  const canProxy =
    settings.manualProxyEnabled && canManageSchedules(currentAccount.roleId);
  const canEditSettings = canManageSettings(currentAccount.roleId);
  const targetDate = selectedAttendanceDate || getTodayIsoDate();

  const rows = useMemo(() => {
    return scopedEmployees
      .filter((e) => e.status !== 'Đã nghỉ')
      .map((emp) => {
        const assigned = shiftAssignments.find(
          (a) => a.employeeId === emp.id && a.date === targetDate
        );
        const existingRec = attendanceRecords.find(
          (r) => r.employeeId === emp.id && r.date === targetDate
        );
        const rec = existingRec || {
          id: `ATT-TEMP-${targetDate}-${emp.id}`,
          employeeId: emp.id,
          date: targetDate,
          shiftCode: assigned?.shiftCode,
          status: assigned ? ('Chưa chấm' as const) : ('Không có ca' as const),
          lateMinutes: 0,
          otHours: 0,
        };
        const shift = shiftTemplates.find(
          (s) => s.code === (rec.shiftCode || assigned?.shiftCode)
        );
        return { emp, rec, shift };
      });
  }, [scopedEmployees, attendanceRecords, shiftAssignments, shiftTemplates, targetDate]);

  const counts = useMemo(() => {
    return {
      onTime: rows.filter((r) => r.rec.status === 'Đúng giờ').length,
      late: rows.filter((r) => r.rec.status === 'Đi muộn').length,
      unchecked: rows.filter((r) => r.rec.status === 'Chưa chấm').length,
      noShift: rows.filter((r) => r.rec.status === 'Không có ca').length,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((item) => {
      if (statusFilter !== 'ALL' && item.rec.status !== statusFilter) return false;
      if (
        searchQuery.trim() &&
        !matchesSearch(item.emp.name, searchQuery) &&
        !matchesSearch(item.emp.code, searchQuery)
      ) {
        return false;
      }
      return true;
    });
  }, [rows, statusFilter, searchQuery]);

  const displayedRows = showAllRows ? filteredRows : filteredRows.slice(0, 20);

  const uncheckedEmployees = useMemo(
    () => rows.filter((r) => r.rec.status === 'Chưa chấm'),
    [rows]
  );

  // Shift breakdown cards across all 5 shift templates
  const shiftBreakdowns = useMemo(() => {
    return shiftTemplates.map((tpl) => {
      const inShift = rows.filter((r) => r.shift?.code === tpl.code);
      const checkedCount = inShift.filter(
        (r) => r.rec.status === 'Đúng giờ' || r.rec.status === 'Đi muộn'
      ).length;
      const onTimeCount = inShift.filter((r) => r.rec.status === 'Đúng giờ').length;
      const lateCount = inShift.filter((r) => r.rec.status === 'Đi muộn').length;
      const uncheckedCount = inShift.filter((r) => r.rec.status === 'Chưa chấm').length;
      return {
        tpl,
        total: inShift.length,
        checkedCount,
        onTimeCount,
        lateCount,
        uncheckedCount,
      };
    });
  }, [rows, shiftTemplates]);

  const handleExportCSV = () => {
    exportToCSV(
      `DiemDanh_${targetDate}.csv`,
      rows.map((r) => ({
        'Ngày': formatIsoToVN(targetDate),
        'Mã NV': r.emp.code,
        'Họ tên': r.emp.name,
        'Phòng ban': r.emp.department,
        'Ca làm': r.shift
          ? `${r.shift.name} (${r.shift.startTime}-${r.shift.endTime})`
          : 'Không có ca',
        'Giờ vào': r.rec.checkIn || '--',
        'Giờ ra': r.rec.checkOut || '--',
        'Trạng thái': r.rec.status,
        'Đi muộn (phút)': r.rec.lateMinutes,
        'Tăng ca (giờ)': r.rec.otHours,
      }))
    );
  };

  const openProxyForEmployee = (empId: string, shiftCode?: ShiftCode) => {
    setProxyModalEmpId(empId);
    const chosenCode = shiftCode || 'hanh_chinh';
    setProxyShift(chosenCode);
    const tpl = shiftTemplates.find((s) => s.code === chosenCode);
    if (tpl) {
      setProxyIn(tpl.startTime);
      setProxyOut(tpl.endTime);
    }
  };

  const handleProxyShiftChange = (code: ShiftCode) => {
    setProxyShift(code);
    const tpl = shiftTemplates.find((s) => s.code === code);
    if (tpl) {
      setProxyIn(tpl.startTime);
      setProxyOut(tpl.endTime);
    }
  };

  const handleProxySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proxyModalEmpId || !proxyReason.trim()) return;
    proxyCheckIn({
      employeeId: proxyModalEmpId,
      shiftCode: proxyShift,
      checkIn: proxyIn,
      checkOut: proxyOut,
      reason: proxyReason,
      date: targetDate,
    });
    setProxyModalEmpId(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            PHUONGHIHI / CHẤM CÔNG
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Điểm danh thực tế
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatVietnameseDayHeader(targetDate)} · Theo dõi ai chưa chấm công và gửi nhắc cả nhóm chỉ một nút.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <input
              type="date"
              aria-label="Chọn ngày điểm danh"
              value={targetDate}
              onChange={(e) => {
                if (e.target.value) setSelectedAttendanceDate(e.target.value);
              }}
              className="text-xs font-semibold text-slate-800 focus:outline-none bg-transparent cursor-pointer"
            />
          </div>

          {canProxy && (
            <button
              onClick={() =>
                openProxyForEmployee(
                  uncheckedEmployees[0]?.emp.id ||
                    scopedEmployees[0]?.id ||
                    'NV0003',
                  uncheckedEmployees[0]?.shift?.code
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Chấm công hộ</span>
            </button>
          )}

          <button
            onClick={() => setIsDoorQrModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition"
          >
            <QrCode className="w-3.5 h-3.5 text-slate-500" />
            <span>Mã QR tại cửa</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={() => remindUncheckedEmployees(targetDate)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Gửi nhắc {counts.unchecked} người chưa chấm</span>
          </button>
        </div>
      </div>

      {/* 4 Status Filter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          {
            id: 'Đúng giờ' as const,
            count: counts.onTime,
            label: 'Đúng giờ',
            activeBorder: 'border-emerald-500 bg-emerald-50/40',
          },
          {
            id: 'Đi muộn' as const,
            count: counts.late,
            label: 'Đi muộn',
            activeBorder: 'border-amber-500 bg-amber-50/40',
          },
          {
            id: 'Chưa chấm' as const,
            count: counts.unchecked,
            label: 'Chưa chấm',
            activeBorder: 'border-rose-500 bg-rose-50/30',
          },
          {
            id: 'Không có ca' as const,
            count: counts.noShift,
            label: 'Không có ca',
            activeBorder: 'border-slate-500 bg-slate-100/70',
          },
        ].map((card) => {
          const isSelected = statusFilter === card.id;
          return (
            <button
              key={card.id}
              onClick={() =>
                setStatusFilter(isSelected ? 'ALL' : card.id)
              }
              className={`p-4 rounded-2xl border text-left transition flex items-center gap-3 shadow-2xs ${
                isSelected
                  ? `${card.activeBorder} border-2`
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl font-extrabold text-slate-900">
                {card.count}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                {card.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Shift Breakdown Cards (All 5 shift templates) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Theo dõi theo khung giờ ca ({formatIsoToVN(targetDate)})
          </span>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold">
            Đồng bộ thời gian thực từ Bảng phân ca
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {shiftBreakdowns.map(
            ({ tpl, total, checkedCount, onTimeCount, lateCount, uncheckedCount }) => (
              <div
                key={tpl.code}
                className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    {tpl.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {tpl.startTime}-{tpl.endTime}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-slate-900">
                    {checkedCount}
                  </span>
                  <span className="text-xs text-slate-500">
                    / {total} đã điểm danh
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: `${Math.round(
                        (checkedCount / Math.max(1, total)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {onTimeCount} đúng giờ
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {lateCount} muộn
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {uncheckedCount} chưa chấm
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Bottom 2-Column Section: Attendance Table + Right Office & Unchecked List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left 2/3 Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL' as const, label: `Tất cả (${rows.length})` },
                { id: 'Chưa chấm' as const, label: `Chưa chấm (${counts.unchecked})` },
                { id: 'Không có ca' as const, label: `Không có ca (${counts.noShift})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    statusFilter === tab.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên hoặc mã NV..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/50">
                  <th className="py-3 px-4">Nhân viên</th>
                  <th className="py-3 px-3">Vào / Ra</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3">Đi muộn / OT</th>
                  {canProxy && <th className="py-3 px-4 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayedRows.map(({ emp, rec, shift }) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${emp.avatarColor}`}
                        >
                          {getInitials(emp.name)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{emp.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {emp.department}
                            {shift ? ` · Ca ${shift.name}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {rec.checkIn
                        ? `${rec.checkIn} - ${rec.checkOut || '--:--'}`
                        : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          rec.status === 'Đúng giờ'
                            ? 'bg-emerald-50 text-emerald-700'
                            : rec.status === 'Đi muộn'
                            ? 'bg-amber-50 text-amber-700'
                            : rec.status === 'Chưa chấm'
                            ? 'bg-rose-50 text-rose-700'
                            : rec.status === 'Nghỉ phép'
                            ? 'bg-violet-50 text-violet-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            rec.status === 'Đúng giờ'
                              ? 'bg-emerald-500'
                              : rec.status === 'Đi muộn'
                              ? 'bg-amber-500'
                              : rec.status === 'Chưa chấm'
                              ? 'bg-rose-500'
                              : rec.status === 'Nghỉ phép'
                              ? 'bg-violet-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {rec.lateMinutes > 0 ? (
                        <span className="text-amber-700 font-medium">
                          Muộn {rec.lateMinutes}p
                        </span>
                      ) : rec.otHours > 0 ? (
                        <span className="text-blue-600 font-medium">
                          +{rec.otHours}h OT
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    {canProxy && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openProxyForEmployee(emp.id, shift?.code)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
                        >
                          Chấm hộ
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRows.length > 20 && (
            <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Đang hiển thị <strong>{displayedRows.length}</strong> /{' '}
                <strong>{filteredRows.length}</strong> nhân sự
              </span>
              <button
                onClick={() => setShowAllRows((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold transition"
              >
                {showAllRows
                  ? 'Thu gọn (20 dòng đầu)'
                  : `Xem toàn bộ ${filteredRows.length} nhân sự`}
              </button>
            </div>
          )}
        </div>

        {/* Right 1/3 Sidebar Widgets */}
        <div className="space-y-4">
          {/* Office Location Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
            <div className="text-sm font-bold text-slate-900">
              Vị trí chấm công
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  {settings.officeName}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Bán kính cho phép: {settings.allowedRadiusMeters} m
                </div>
              </div>
            </div>
            {canEditSettings && (
              <button
                onClick={() => setActiveTab('settings')}
                className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Thiết lập vị trí</span>
              </button>
            )}
          </div>

          {/* Unchecked Today Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">
                Chưa chấm ({formatIsoToVN(targetDate)})
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold">
                {uncheckedEmployees.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {uncheckedEmployees.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  Tất cả nhân sự có ca trực đều đã điểm danh.
                </div>
              ) : (
                uncheckedEmployees.map(({ emp, rec, shift }) => (
                  <div
                    key={emp.id}
                    className="py-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs font-semibold text-slate-800">
                          {emp.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {' '}
                          · {shift ? `Ca ${shift.name}` : 'Chưa chấm'}
                        </span>
                        {rec.remindedAt && (
                          <span className="block text-[10px] text-emerald-600">
                            Đã nhắc lúc {rec.remindedAt}
                          </span>
                        )}
                      </div>
                    </div>
                    {canProxy && (
                      <button
                        onClick={() => openProxyForEmployee(emp.id, shift?.code)}
                        className="text-[11px] font-semibold text-blue-600 hover:underline shrink-0"
                      >
                        Chấm hộ
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Proxy Check-In Modal (Chấm công hộ) */}
      {proxyModalEmpId && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setProxyModalEmpId(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Quản lý chấm công hộ ({formatIsoToVN(targetDate)})
                </h3>
              </div>
              <button
                onClick={() => setProxyModalEmpId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProxySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nhân viên
                </label>
                <select
                  value={proxyModalEmpId}
                  onChange={(e) => setProxyModalEmpId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50"
                >
                  {scopedEmployees
                    .filter((e) => e.status !== 'Đã nghỉ')
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.code} · {e.department})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Ca trực áp dụng
                </label>
                <select
                  value={proxyShift}
                  onChange={(e) =>
                    handleProxyShiftChange(e.target.value as ShiftCode)
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {shiftTemplates.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Giờ vào
                  </label>
                  <input
                    type="time"
                    value={proxyIn}
                    onChange={(e) => setProxyIn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Giờ ra
                  </label>
                  <input
                    type="time"
                    value={proxyOut}
                    onChange={(e) => setProxyOut(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Lý do chấm công hộ (Bắt buộc ghi nhật ký)
                </label>
                <textarea
                  rows={2}
                  required
                  value={proxyReason}
                  onChange={(e) => setProxyReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProxyModalEmpId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  Xác nhận chấm hộ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
