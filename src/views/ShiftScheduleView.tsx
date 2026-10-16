import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  AlertTriangle,
  Calendar,
  CheckSquare,
  Lightbulb,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { ShiftCode } from '../types';
import { getInitials, matchesSearch } from '../utils/helpers';

const WEEK_DAYS_OCT_12 = [
  { date: '2026-10-12', dayName: 'T2', dayNum: '12' },
  { date: '2026-10-13', dayName: 'T3', dayNum: '13' },
  { date: '2026-10-14', dayName: 'T4', dayNum: '14' },
  { date: '2026-10-15', dayName: 'T5', dayNum: '15' },
  { date: '2026-10-16', dayName: 'T6', dayNum: '16' },
  { date: '2026-10-17', dayName: 'T7', dayNum: '17' },
  { date: '2026-10-18', dayName: 'CN', dayNum: '18' },
];

const WEEK_DAYS_OCT_05 = [
  { date: '2026-10-05', dayName: 'T2', dayNum: '05' },
  { date: '2026-10-06', dayName: 'T3', dayNum: '06' },
  { date: '2026-10-07', dayName: 'T4', dayNum: '07' },
  { date: '2026-10-08', dayName: 'T5', dayNum: '08' },
  { date: '2026-10-09', dayName: 'T6', dayNum: '09' },
  { date: '2026-10-10', dayName: 'T7', dayNum: '10' },
  { date: '2026-10-11', dayName: 'CN', dayNum: '11' },
];

export const ShiftScheduleView: React.FC = () => {
  const {
    scopedEmployees,
    shiftTemplates,
    shiftAssignments,
    assignShift,
    bulkAssignShifts,
    autoScheduleWeekWithAI,
    hasApprovedLeaveOnDate,
    setSelectedEmployeeId,
  } = useHRM();

  const [weekIndex, setWeekIndex] = useState<0 | 1>(1); // 1 = 12/10 - 18/10/2026 (matches video 00:00)
  const [viewMode, setViewMode] = useState<'Ngày' | 'Tuần' | 'Tháng'>('Tuần');
  const [searchEmp, setSearchEmp] = useState('');
  const [activeBrush, setActiveBrush] = useState<ShiftCode | 'CLEAR' | null>('hanh_chinh');
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkDept, setBulkDept] = useState<string>('ALL');
  const [bulkShift, setBulkShift] = useState<ShiftCode>('hanh_chinh');
  const [showAllRows, setShowAllRows] = useState(false);

  const currentWeekDays = weekIndex === 1 ? WEEK_DAYS_OCT_12 : WEEK_DAYS_OCT_05;

  const activeEmps = useMemo(
    () =>
      scopedEmployees.filter(
        (e) =>
          e.status !== 'Đã nghỉ' &&
          (matchesSearch(e.name, searchEmp) ||
            matchesSearch(e.department, searchEmp) ||
            matchesSearch(e.code, searchEmp))
      ),
    [scopedEmployees, searchEmp]
  );

  // Build O(1) lookup map for shift assignments to optimize rendering 50x7 cells
  const assignmentMap = useMemo(() => {
    const map = new Map<string, ShiftCode>();
    for (let i = 0; i < shiftAssignments.length; i++) {
      const a = shiftAssignments[i];
      map.set(`${a.employeeId}__${a.date}`, a.shiftCode);
    }
    return map;
  }, [shiftAssignments]);

  // Count leave conflicts in current week
  const leaveConflictCount = useMemo(() => {
    let count = 0;
    activeEmps.forEach((emp) => {
      currentWeekDays.forEach((day) => {
        if (
          assignmentMap.has(`${emp.id}__${day.date}`) &&
          hasApprovedLeaveOnDate(emp.id, day.date)
        ) {
          count++;
        }
      });
    });
    return count;
  }, [activeEmps, currentWeekDays, assignmentMap, hasApprovedLeaveOnDate]);

  // Stop painting when mouse released anywhere, or Esc pressed
  useEffect(() => {
    const handleMouseUp = () => setIsMouseDown(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveBrush(null);
        setIsMouseDown(false);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCellPaint = (employeeId: string, date: string) => {
    if (!activeBrush) return;
    if (activeBrush === 'CLEAR') {
      assignShift(employeeId, date, null);
    } else {
      assignShift(employeeId, date, activeBrush);
    }
  };

  const getAssignedShift = (employeeId: string, date: string) => {
    const code = assignmentMap.get(`${employeeId}__${date}`);
    if (!code) return null;
    return shiftTemplates.find((t) => t.code === code) || null;
  };

  const activeBrushTemplate = useMemo(
    () => shiftTemplates.find((t) => t.code === activeBrush),
    [shiftTemplates, activeBrush]
  );

  const handleApplyBulkModal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmps = activeEmps
      .filter((emp) => bulkDept === 'ALL' || emp.department === bulkDept)
      .map((emp) => emp.id);
    const weekdayDates = currentWeekDays.slice(0, 5).map((d) => d.date);
    bulkAssignShifts(targetEmps, weekdayDates, bulkShift);
    setIsBulkModalOpen(false);
  };

  const displayedEmps = showAllRows ? activeEmps : activeEmps.slice(0, 20);

  return (
    <div className="p-3.5 sm:p-6 space-y-5 max-w-[1600px] mx-auto select-none">
      {/* Page Header */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          PHUONGHIHI / CHẤM CÔNG
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
          Ca &amp; lịch làm việc
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {weekIndex === 1
            ? '12/10/2026 - 18/10/2026'
            : '05/10/2026 - 11/10/2026'}{' '}
          · {activeEmps.length} nhân viên trong phạm vi
        </p>
      </div>

      {/* Top Filter Banner (Matches 00:01 in video) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">
              Xem lịch nhân viên
            </div>
            <div className="text-xs text-slate-500">
              Chọn một hoặc nhiều người để lọc ngay trên thiết bị này.
            </div>
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchEmp}
            onChange={(e) => setSearchEmp(e.target.value)}
            placeholder="Tất cả nhân viên"
            className="w-full pl-9 pr-8 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
          {searchEmp && (
            <button
              onClick={() => setSearchEmp('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Layout (Left Mini Calendar + Right Schedule Grid) */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Sidebar Card (Matches 00:00 - 00:08 in video) */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Mở lối tắt phân ca</span>
          </button>

          {/* Mini Calendar Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800">
                {weekIndex === 1 ? '12/10 - 18/10/2026' : '05/10 - 11/10/2026'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setWeekIndex(0)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setWeekIndex(1)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 mb-1.5">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span>CN</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {[
                { d: 28, muted: true },
                { d: 29, muted: true },
                { d: 30, muted: true },
                { d: 1 },
                { d: 2 },
                { d: 3 },
                { d: 4 },
                { d: 5, w0: true },
                { d: 6, w0: true },
                { d: 7, w0: true },
                { d: 8, w0: true },
                { d: 9, w0: true, today: true },
                { d: 10, w0: true },
                { d: 11, w0: true },
                { d: 12, w1: true },
                { d: 13, w1: true },
                { d: 14, w1: true },
                { d: 15, w1: true },
                { d: 16, w1: true },
                { d: 17, w1: true },
                { d: 18, w1: true },
                { d: 19 },
                { d: 20 },
                { d: 21 },
                { d: 22 },
                { d: 23 },
                { d: 24 },
                { d: 25 },
                { d: 26 },
                { d: 27 },
                { d: 28 },
                { d: 29 },
                { d: 30 },
                { d: 31 },
                { d: 1, muted: true },
              ].map((cell, idx) => {
                const isSelectedWeek =
                  (weekIndex === 1 && cell.w1) || (weekIndex === 0 && cell.w0);
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (cell.w0) setWeekIndex(0);
                      if (cell.w1) setWeekIndex(1);
                    }}
                    className={`h-7 rounded-lg flex items-center justify-center font-medium transition ${
                      cell.today
                        ? 'bg-blue-600 text-white font-bold shadow-2xs'
                        : isSelectedWeek
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : cell.muted
                        ? 'text-slate-300'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cell.d}
                  </button>
                );
              })}
            </div>

            {/* 2 Mini Stat Cards (50 NHÂN SỰ / 5 CA MẪU) */}
            <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-slate-100">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-base font-bold text-slate-900">
                  {activeEmps.length}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                  NHÂN SỰ
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-base font-bold text-slate-900">
                  {shiftTemplates.length}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                  CA MẪU
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Schedule Panel */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Top Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekIndex(0)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeekIndex(1)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeekIndex(1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                Hôm nay
              </button>
              <span className="text-sm font-bold text-slate-900 ml-2">
                {weekIndex === 1 ? '12/10 - 18/10/2026' : '05/10 - 11/10/2026'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                {(['Ngày', 'Tuần', 'Tháng'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      viewMode === m
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sub-toolbar with AI Auto-Scheduler, warnings & shift config */}
          <div className="px-4 py-2.5 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  autoScheduleWeekWithAI(currentWeekDays.map((d) => d.date))
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold shadow-xs transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>✨ AI Xếp ca tối ưu (Tự tránh phép)</span>
              </button>
              {leaveConflictCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{leaveConflictCount} ca trùng ngày nghỉ phép đã duyệt</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  bulkAssignShifts(
                    activeEmps.slice(0, 10).map((e) => e.id),
                    currentWeekDays.slice(0, 5).map((d) => d.date),
                    'hanh_chinh'
                  )
                }
                title="Sao chép ca tuần chuẩn"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>45 cảnh báo</span>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Ca &amp; ngày nghỉ</span>
              </button>
            </div>
          </div>

          {/* Quick Shift Paint Bar (Thanh Xếp nhanh - Exact match to 00:07-00:10 in video) */}
          <div className="p-4 border-b border-slate-100 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 mr-1">
                Xếp nhanh:
              </span>
              {shiftTemplates.map((tpl) => {
                const isSelected = activeBrush === tpl.code;
                return (
                  <button
                    key={tpl.code}
                    onClick={() =>
                      setActiveBrush(isSelected ? null : tpl.code)
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${tpl.dotClass}`} />
                    <span>{tpl.name}</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      {tpl.startTime}-{tpl.endTime}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() =>
                  setActiveBrush(activeBrush === 'CLEAR' ? null : 'CLEAR')
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  activeBrush === 'CLEAR'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>Xoá ca</span>
              </button>
            </div>

            {/* Active Brush Notification Banner (Matches 00:09 in video) */}
            {activeBrush && (
              <div className="px-3.5 py-2 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    {activeBrush === 'CLEAR' ? (
                      <>
                        Đang bật bút <strong>Xoá ca</strong>. Bấm hoặc kéo qua
                        các ô để xoá ca, <strong>Esc</strong> để thôi.
                      </>
                    ) : (
                      <>
                        Đang bật bút ca{' '}
                        <strong>{activeBrushTemplate?.name}</strong>. Bấm hoặc
                        kéo qua các ô để xếp, <strong>Esc</strong> để thôi.
                      </>
                    )}
                  </span>
                </div>
                <button
                  onClick={() => setActiveBrush(null)}
                  className="text-[11px] font-semibold text-blue-700 hover:underline"
                >
                  Tắt bút (Esc)
                </button>
              </div>
            )}

            {/* Helper Tip Banner */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2 text-[11.5px] text-slate-500">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                Bấm vào ô để mở chi tiết · Kéo thả để chuyển ca, giữ Ctrl khi
                thả để nhân bản · Chỉ bấm để chọn nhiều ô, Shift + bấm để mở
                menu thao tác
              </span>
            </div>
          </div>

          {/* Schedule Matrix Grid (Supports Click & Drag Painting across cells!) */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 w-56 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                    Nhân viên
                  </th>
                  {currentWeekDays.map((day) => (
                    <th
                      key={day.date}
                      className="py-2.5 px-2 text-center border-r border-slate-100 min-w-[105px]"
                    >
                      <div className="text-[11px] font-semibold text-slate-400">
                        {day.dayName}
                      </div>
                      <div className="text-sm font-bold text-slate-800 mt-0.5">
                        {day.dayNum}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedEmps.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/60 transition group"
                  >
                    {/* Employee Cell */}
                    <td
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className="py-2.5 px-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${emp.avatarColor}`}
                        >
                          {getInitials(emp.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600">
                            {emp.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {emp.department}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 7 Day Shift Cells */}
                    {currentWeekDays.map((day) => {
                      const assigned = getAssignedShift(emp.id, day.date);
                      const leaveReq = hasApprovedLeaveOnDate(emp.id, day.date);
                      return (
                        <td
                          key={day.date}
                          onMouseDown={() => {
                            if (activeBrush) {
                              setIsMouseDown(true);
                              handleCellPaint(emp.id, day.date);
                            } else {
                              const nextCode = assigned ? null : 'hanh_chinh';
                              assignShift(emp.id, day.date, nextCode);
                            }
                          }}
                          onMouseEnter={() => {
                            if (isMouseDown && activeBrush) {
                              handleCellPaint(emp.id, day.date);
                            }
                          }}
                          className={`p-1.5 border-r border-slate-100 text-center align-middle transition ${
                            activeBrush
                              ? 'cursor-crosshair hover:bg-blue-50/50'
                              : 'cursor-pointer hover:bg-slate-100/70'
                          }`}
                        >
                          {assigned && leaveReq ? (
                            <div className="space-y-1">
                              <div
                                className={`w-full py-1 px-2 rounded-lg border text-[11px] font-semibold transition ${assigned.bgClass} ${assigned.textClass} ${assigned.borderClass}`}
                              >
                                {assigned.name}
                              </div>
                              <div
                                title={`Nhân viên có đơn ${leaveReq.type} đã duyệt: ${leaveReq.reason}`}
                                className="w-full py-0.5 px-1.5 rounded-md bg-rose-100 border border-rose-300 text-rose-700 text-[10px] font-bold truncate"
                              >
                                ⚠️ Trùng nghỉ phép
                              </div>
                            </div>
                          ) : assigned ? (
                            <div
                              className={`w-full py-1.5 px-2 rounded-lg border text-xs font-semibold transition shadow-2xs ${assigned.bgClass} ${assigned.textClass} ${assigned.borderClass}`}
                            >
                              {assigned.name}
                            </div>
                          ) : leaveReq ? (
                            <div
                              title={`${leaveReq.type}: ${leaveReq.reason}`}
                              className="w-full py-1.5 px-2 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 text-[11px] font-semibold truncate"
                            >
                              🏖️ Nghỉ phép
                            </div>
                          ) : (
                            <div className="w-full h-8 rounded-lg border border-dashed border-transparent hover:border-slate-300 flex items-center justify-center text-slate-300 hover:text-slate-500 text-xs transition">
                              +
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {activeEmps.length > 20 && (
            <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Đang hiển thị <strong>{displayedEmps.length}</strong> /{' '}
                <strong>{activeEmps.length}</strong> nhân sự trong phạm vi
              </span>
              <button
                onClick={() => setShowAllRows((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold transition"
              >
                {showAllRows
                  ? 'Thu gọn (20 dòng đầu)'
                  : `Xem toàn bộ ${activeEmps.length} nhân sự`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Shift Assignment Modal (Lối tắt phân ca) */}
      {isBulkModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsBulkModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Lối tắt phân ca hàng loạt
              </h3>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleApplyBulkModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Phòng ban áp dụng
                </label>
                <select
                  value={bulkDept}
                  onChange={(e) => setBulkDept(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                >
                  <option value="ALL">Toàn bộ nhân viên trong phạm vi</option>
                  <option value="Nhân sự">Nhân sự</option>
                  <option value="Kỹ thuật">Kỹ thuật</option>
                  <option value="Kinh doanh">Kinh doanh</option>
                  <option value="Kế toán">Kế toán</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Vận hành">Vận hành</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Ca làm việc (Thứ 2 → Thứ 6)
                </label>
                <select
                  value={bulkShift}
                  onChange={(e) => setBulkShift(e.target.value as ShiftCode)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                >
                  {shiftTemplates.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.name} ({t.startTime} - {t.endTime})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  Xếp ca cả tuần
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
