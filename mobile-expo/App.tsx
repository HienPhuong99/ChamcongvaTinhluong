import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';

type TabKey = 'checkin' | 'shifts' | 'attendance' | 'requests' | 'payroll';
type ShiftCode = 'hanh_chinh' | 'sang' | 'chieu' | 'dem' | 'ca_gay';

interface ShiftTpl {
  code: ShiftCode;
  name: string;
  time: string;
  bg: string;
  text: string;
  dot: string;
}

const SHIFTS: ShiftTpl[] = [
  { code: 'hanh_chinh', name: 'Hành chính', time: '08:00-17:30', bg: '#ECFDF5', text: '#047857', dot: '#10B981' },
  { code: 'sang', name: 'Sáng', time: '06:00-14:00', bg: '#F0F9FF', text: '#0369A1', dot: '#0EA5E9' },
  { code: 'chieu', name: 'Chiều', time: '14:00-22:00', bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B' },
  { code: 'dem', name: 'Đêm', time: '22:00-06:00', bg: '#EEF2FF', text: '#4338CA', dot: '#6366F1' },
  { code: 'ca_gay', name: 'Ca gãy', time: '08:00-21:00', bg: '#FFF1F2', text: '#BE123C', dot: '#F43F5E' },
];

interface EmpItem {
  id: string;
  name: string;
  dept: string;
  joinYear: number;
  baseSalary: number;
  allowance: number;
  actualDays: number;
  leaveDays: number;
  lateCount: number;
  lateMins: number;
  otHours: number;
  checkedIn?: string;
  checkedOut?: string;
  status: 'Đúng giờ' | 'Đi muộn' | 'Chưa chấm';
  weekShifts: (ShiftCode | null)[];
}

const INITIAL_EMPS: EmpItem[] = [
  {
    id: 'NV0000',
    name: 'Quản lý cửa hàng (phuonghihi)',
    dept: 'Phòng ban chung',
    joinYear: 2020,
    baseSalary: 28000000,
    allowance: 3000000,
    actualDays: 21,
    leaveDays: 1,
    lateCount: 0,
    lateMins: 0,
    otHours: 2,
    status: 'Chưa chấm',
    weekShifts: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', null, null],
  },
  {
    id: 'NV0001',
    name: 'Nguyễn Minh Anh',
    dept: 'Nhân sự',
    joinYear: 2021,
    baseSalary: 22000000,
    allowance: 2500000,
    actualDays: 19.5,
    leaveDays: 2,
    lateCount: 1,
    lateMins: 7,
    otHours: 0,
    checkedIn: '07:55',
    status: 'Đúng giờ',
    weekShifts: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', null],
  },
  {
    id: 'NV0002',
    name: 'Trần Thị Thu Hà',
    dept: 'Kỹ thuật',
    joinYear: 2021,
    baseSalary: 18500000,
    allowance: 1500000,
    actualDays: 19,
    leaveDays: 0,
    lateCount: 4,
    lateMins: 32,
    otHours: 2,
    status: 'Chưa chấm',
    weekShifts: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', null, null],
  },
  {
    id: 'NV0003',
    name: 'Lê Quang Huy',
    dept: 'Kinh doanh',
    joinYear: 2021,
    baseSalary: 19000000,
    allowance: 2000000,
    actualDays: 19.5,
    leaveDays: 3,
    lateCount: 0,
    lateMins: 0,
    otHours: 4,
    status: 'Chưa chấm',
    weekShifts: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', null, null],
  },
  {
    id: 'NV0004',
    name: 'Phạm Ngọc Lan',
    dept: 'Kế toán',
    joinYear: 2021,
    baseSalary: 21000000,
    allowance: 2000000,
    actualDays: 22,
    leaveDays: 0,
    lateCount: 3,
    lateMins: 35,
    otHours: 5,
    checkedIn: '08:18',
    status: 'Đi muộn',
    weekShifts: ['sang', 'chieu', 'dem', 'sang', 'chieu', null, null],
  },
  {
    id: 'NV0006',
    name: 'Hoàng Mai Chi',
    dept: 'Marketing',
    joinYear: 2022,
    baseSalary: 17500000,
    allowance: 1500000,
    actualDays: 18.5,
    leaveDays: 0,
    lateCount: 2,
    lateMins: 24,
    otHours: 2,
    status: 'Chưa chấm',
    weekShifts: ['ca_gay', 'ca_gay', 'ca_gay', 'ca_gay', 'ca_gay', null, null],
  },
  {
    id: 'NV0009',
    name: 'Bùi Minh Quân',
    dept: 'Kinh doanh',
    joinYear: 2022,
    baseSalary: 15000000,
    allowance: 1500000,
    actualDays: 21.5,
    leaveDays: 1,
    lateCount: 4,
    lateMins: 60,
    otHours: 5,
    status: 'Chưa chấm',
    weekShifts: ['hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', 'hanh_chinh', null, null],
  },
];

interface ReqItem {
  id: string;
  empName: string;
  empCode: string;
  type: string;
  dateRange: string;
  reason: string;
  status: 'Đang chờ' | 'Đã duyệt' | 'Từ chối';
}

const INITIAL_REQS: ReqItem[] = [
  {
    id: 'R1',
    empName: 'Trần Quang An 32',
    empCode: 'NV0032',
    type: 'Công tác',
    dateRange: '09/10/2026 → 10/10/2026',
    reason: 'Giao lô máy iPhone 16 Pro Max cho Công ty TNHH Ánh Dương (88 Nguyễn Huệ, Q.1)',
    status: 'Đang chờ',
  },
  {
    id: 'R2',
    empName: 'Bùi Quang An 36',
    empCode: 'NV0036',
    type: 'Nghỉ ốm',
    dateRange: '08/10/2026 → 08/10/2026',
    reason: 'Lịch tái khám định kỳ',
    status: 'Đang chờ',
  },
  {
    id: 'R3',
    empName: 'Đỗ Văn Nam',
    empCode: 'NV0011',
    type: 'Đăng ký tăng ca',
    dateRange: '07/10/2026 → 07/10/2026',
    reason: 'Kiểm kho IMEI lô iPhone mới nhập từ Nhà phân phối FPT & Digiworld',
    status: 'Đang chờ',
  },
  {
    id: 'R4',
    empName: 'Lê Ngọc Mai',
    empCode: 'NV0014',
    type: 'Bổ sung chấm công',
    dateRange: '06/10/2026 → 06/10/2026',
    reason: 'Đứng quầy tư vấn khách thu cũ đổi mới iPhone, điện thoại hết pin chưa chấm vào',
    status: 'Đang chờ',
  },
  {
    id: 'R5',
    empName: 'Bùi Minh Quân',
    empCode: 'NV0009',
    type: 'Bổ sung chấm công',
    dateRange: '04/10/2026 → 04/10/2026',
    reason: 'Bận lập hợp đồng trả góp cho khách lúc cuối ca nên quên chấm ra',
    status: 'Đang chờ',
  },
];

function formatVND(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('checkin');
  const [emps, setEmps] = useState<EmpItem[]>(INITIAL_EMPS);
  const [selectedEmpIdx, setSelectedEmpIdx] = useState(0);
  const [clockStr, setClockStr] = useState('15:41:39');
  const [inRangeMode, setInRangeMode] = useState(true);
  const [activeBrush, setActiveBrush] = useState<ShiftCode | 'CLEAR'>('hanh_chinh');
  const [qrCountdown, setQrCountdown] = useState(45);
  const [qrToken, setQrToken] = useState('PHUONGHIHI-849201');
  const [reqs, setReqs] = useState<ReqItem[]>(INITIAL_REQS);
  const [newReqReason, setNewReqReason] = useState('');
  const [newReqType, setNewReqType] = useState('Nghỉ phép năm');
  const [isNewReqModal, setIsNewReqModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const currentEmp = emps[selectedEmpIdx] || emps[0];
  const distanceMeters = inRangeMode ? 27 : 365;

  const showBanner = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Live clock + 45s QR timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setClockStr(`${hh}:${mm}:${ss}`);

      setQrCountdown((prev) => {
        if (prev <= 1) {
          setQrToken(`PHUONGHIHI-${Math.floor(100000 + Math.random() * 900000)}`);
          return 45;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = () => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(70);
    }
    const timeShort = clockStr.slice(0, 5);
    setEmps((prev) =>
      prev.map((item, idx) => {
        if (idx !== selectedEmpIdx) return item;
        const isOut = Boolean(item.checkedIn && !item.checkedOut);
        return {
          ...item,
          checkedIn: item.checkedIn || timeShort,
          checkedOut: isOut ? timeShort : item.checkedOut,
          status: 'Đúng giờ',
        };
      })
    );
    showBanner(
      `✅ Chấm công thành công lúc ${timeShort} (${
        inRangeMode ? 'GPS Trong phạm vi 27m' : 'Chấm công từ xa'
      })`
    );
  };

  const handlePaintShift = (empId: string, dayIdx: number) => {
    setEmps((prev) =>
      prev.map((item) => {
        if (item.id !== empId) return item;
        const nextWeek = [...item.weekShifts];
        nextWeek[dayIdx] = activeBrush === 'CLEAR' ? null : activeBrush;
        return { ...item, weekShifts: nextWeek };
      })
    );
  };

  const handleRemindUnchecked = () => {
    const uncheckedCount = emps.filter((e) => e.status === 'Chưa chấm').length;
    showBanner(`🔔 Đã gửi thông báo nhắc chấm công tới ${uncheckedCount} nhân viên!`);
  };

  const handleApproveReq = (id: string, status: 'Đã duyệt' | 'Từ chối') => {
    setReqs((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    showBanner(
      status === 'Đã duyệt' ? '✅ Đã duyệt đơn một chạm!' : '❌ Đã từ chối đơn!'
    );
  };

  const handleCreateReq = () => {
    if (!newReqReason.trim()) return;
    const created: ReqItem = {
      id: `R-${Date.now()}`,
      empName: currentEmp.name,
      empCode: currentEmp.id,
      type: newReqType,
      dateRange: '10/10/2026 → 10/10/2026',
      reason: newReqReason.trim(),
      status: 'Đang chờ',
    };
    setReqs((prev) => [created, ...prev]);
    setNewReqReason('');
    setIsNewReqModal(false);
    showBanner('📝 Đã gửi đơn thành công!');
  };

  const payrollSummary = useMemo(() => {
    const stdDays = 22;
    const daily = currentEmp.baseSalary / stdDays;
    const proRated = Math.round(daily * (currentEmp.actualDays + currentEmp.leaveDays));
    const otPay = Math.round((daily / 8) * currentEmp.otHours * 1.5);
    const latePenalty =
      currentEmp.lateCount > 1 ? (currentEmp.lateCount - 1) * 50000 : 0;
    const insurance = Math.round(currentEmp.baseSalary * 0.105);
    const gross = proRated + currentEmp.allowance + otPay;
    const taxable = Math.max(0, gross - insurance - 11000000);
    const tax = Math.round(taxable * 0.05);
    const net = Math.max(0, gross - insurance - tax - latePenalty);
    return { stdDays, proRated, otPay, latePenalty, insurance, tax, net };
  }, [currentEmp]);

  const pendingReqCount = reqs.filter((r) => r.status === 'Đang chờ').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top App Header */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>p</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>phuonghihi</Text>
            <Text style={styles.brandSub}>iPhone chính hãng · Chấm công &amp; Lương</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.empSwitchBtn}
          onPress={() => setSelectedEmpIdx((prev) => (prev + 1) % emps.length)}
        >
          <Text style={styles.empSwitchText}>{currentEmp.name}</Text>
          <Text style={styles.empSwitchSub}>{currentEmp.dept} ▾</Text>
        </TouchableOpacity>
      </View>

      {/* Toast Feedback Banner */}
      {toastMsg && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}

      {/* Main Content Scroll */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TAB 1: CHẤM CÔNG ĐIỆN THOẠI (Matches 00:12 - 00:16 in video) */}
        {activeTab === 'checkin' && (
          <View style={styles.sectionGap}>
            {/* Blue Greeting Card */}
            <View style={styles.blueHeroCard}>
              <Text style={styles.greetingSub}>Chào buổi chiều,</Text>
              <Text style={styles.greetingName}>{currentEmp.name}</Text>

              <View style={styles.shiftWhiteBox}>
                <Text style={styles.shiftDateText}>Thứ Sáu, 09/10/2026</Text>
                <Text style={styles.shiftNameText}>Hành chính</Text>
                <Text style={styles.shiftTimeLocText}>
                  08:00 – 17:30 · Cửa hàng phuonghihi (123 Lê Lợi, Q.1)
                </Text>
              </View>
            </View>

            {/* Clock + Big Circular Check-in Button + Geofence Map */}
            <View style={styles.whiteCardCenter}>
              <Text style={styles.digitalClock}>{clockStr}</Text>

              {currentEmp.checkedIn && (
                <View style={styles.checkedPill}>
                  <Text style={styles.checkedPillText}>
                    ✓ Đã vào ca lúc {currentEmp.checkedIn}
                    {currentEmp.checkedOut ? ` · Ra lúc ${currentEmp.checkedOut}` : ''}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleCheckIn}
                style={styles.bigCheckinCircle}
              >
                <Text style={styles.cameraIcon}>📷</Text>
                <Text style={styles.bigCheckinLabel}>
                  {currentEmp.checkedIn && !currentEmp.checkedOut
                    ? 'Chấm công ra'
                    : 'Chấm công vào'}
                </Text>
              </TouchableOpacity>

              {/* Visual Leaflet / OpenStreetMap Geofence Radar Box */}
              <View style={styles.mapCanvas}>
                <View style={styles.mapGridLineH} />
                <View style={styles.mapGridLineV} />
                <View style={styles.geofenceCircle}>
                  <View style={styles.officeCenterPin} />
                  {inRangeMode && <View style={styles.userGpsDotIn} />}
                </View>
                {!inRangeMode && <View style={styles.userGpsDotOut} />}
                <View style={styles.mapAttribution}>
                  <Text style={styles.mapAttrText}>
                    Leaflet | © OpenStreetMap · Bán kính 150m
                  </Text>
                </View>
              </View>

              {/* GPS Distance Pill */}
              <View
                style={[
                  styles.gpsStatusPill,
                  !inRangeMode && styles.gpsStatusPillWarn,
                ]}
              >
                <Text
                  style={[
                    styles.gpsStatusText,
                    !inRangeMode && styles.gpsStatusTextWarn,
                  ]}
                >
                  📍 {inRangeMode ? 'Trong phạm vi' : 'Ngoài phạm vi'} · cách{' '}
                  {distanceMeters} m · GPS ±12 m
                </Text>
              </View>

              {/* Quick GPS Simulator Toggle */}
              <View style={styles.simRow}>
                <TouchableOpacity
                  onPress={() => setInRangeMode(true)}
                  style={[
                    styles.simBtn,
                    inRangeMode && styles.simBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.simBtnText,
                      inRangeMode && styles.simBtnTextActive,
                    ]}
                  >
                    📍 Đứng trong VP (27m)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setInRangeMode(false)}
                  style={[
                    styles.simBtn,
                    !inRangeMode && styles.simBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.simBtnText,
                      !inRangeMode && styles.simBtnTextActive,
                    ]}
                  >
                    🚗 Ngoài bán kính (365m)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: CA & LỊCH LÀM VIỆC (Matches 00:00 - 00:11 in video) */}
        {activeTab === 'shifts' && (
          <View style={styles.sectionGap}>
            <View style={styles.whiteCard}>
              <Text style={styles.cardHeaderTitle}>
                Ca &amp; lịch làm việc (12/10 - 18/10/2026)
              </Text>
              <Text style={styles.cardHeaderSub}>
                Chọn ca ở thanh Xếp nhanh rồi chạm vào các ô để xếp lịch cả tuần
              </Text>

              {/* Quick Paint Brush Pills */}
              <View style={styles.brushWrap}>
                {SHIFTS.map((s) => {
                  const selected = activeBrush === s.code;
                  return (
                    <TouchableOpacity
                      key={s.code}
                      onPress={() => setActiveBrush(s.code)}
                      style={[
                        styles.brushPill,
                        selected && {
                          borderColor: s.dot,
                          backgroundColor: s.bg,
                        },
                      ]}
                    >
                      <View
                        style={[styles.dotIndicator, { backgroundColor: s.dot }]}
                      />
                      <Text style={[styles.brushText, { color: s.text }]}>
                        {s.name} ({s.time})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  onPress={() => setActiveBrush('CLEAR')}
                  style={[
                    styles.brushPill,
                    activeBrush === 'CLEAR' && {
                      borderColor: '#EF4444',
                      backgroundColor: '#FEF2F2',
                    },
                  ]}
                >
                  <Text style={styles.clearBrushText}>✕ Xoá ca</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Employee Shift Rows */}
            {emps.map((emp) => (
              <View key={emp.id} style={styles.whiteCard}>
                <View style={styles.empRowHeader}>
                  <Text style={styles.empRowName}>{emp.name}</Text>
                  <Text style={styles.empRowDept}>{emp.dept}</Text>
                </View>
                <View style={styles.weekDaysRow}>
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((dName, dIdx) => {
                    const code = emp.weekShifts[dIdx];
                    const tpl = SHIFTS.find((s) => s.code === code);
                    return (
                      <TouchableOpacity
                        key={dName}
                        onPress={() => handlePaintShift(emp.id, dIdx)}
                        style={[
                          styles.dayCell,
                          tpl && {
                            backgroundColor: tpl.bg,
                            borderColor: tpl.dot,
                          },
                        ]}
                      >
                        <Text style={styles.dayCellHeader}>{dName}</Text>
                        <Text
                          style={[
                            styles.dayCellShift,
                            tpl && { color: tpl.text },
                          ]}
                          numberOfLines={1}
                        >
                          {tpl ? tpl.name : '+'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 3: ĐIỂM DANH & MÃ QR TẠI CỬA 45 GIÂY (Matches 00:18 - 00:26 in video) */}
        {activeTab === 'attendance' && (
          <View style={styles.sectionGap}>
            {/* 4 KPI Status Boxes */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiNum}>
                  {emps.filter((e) => e.status === 'Đúng giờ').length}
                </Text>
                <Text style={styles.kpiLabel}>Đúng giờ</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiNum, { color: '#D97706' }]}>
                  {emps.filter((e) => e.status === 'Đi muộn').length}
                </Text>
                <Text style={styles.kpiLabel}>Đi muộn</Text>
              </View>
              <View style={[styles.kpiBox, { borderColor: '#F43F5E' }]}>
                <Text style={[styles.kpiNum, { color: '#E11D48' }]}>
                  {emps.filter((e) => e.status === 'Chưa chấm').length}
                </Text>
                <Text style={styles.kpiLabel}>Chưa chấm</Text>
              </View>
            </View>

            {/* 1-Click Remind Unchecked Button */}
            <TouchableOpacity
              onPress={handleRemindUnchecked}
              style={styles.primaryBlueBtn}
            >
              <Text style={styles.primaryBlueBtnText}>
                🔔 Gửi nhắc tất cả người chưa chấm công
              </Text>
            </TouchableOpacity>

            {/* 45s Dynamic Door QR Card */}
            <View style={styles.whiteCardCenter}>
              <Text style={styles.cardHeaderTitle}>
                🏁 Mã QR tại cửa (Tự đổi mỗi 45 giây)
              </Text>
              <Text style={styles.cardHeaderSub}>
                Token hiện tại: {qrToken} · Tự đổi sau {qrCountdown}s
              </Text>

              <View style={styles.qrVisualBox}>
                <Text style={styles.qrVisualAscii}>▣ ▤ ▥ ▣</Text>
                <Text style={styles.qrVisualAscii}>▤ ▣ ▤ ▥</Text>
                <Text style={styles.qrVisualAscii}>▣ ▥ ▣ ▤</Text>
                <Text style={styles.qrTokenSmall}>{qrToken}</Text>
              </View>

              <TouchableOpacity
                onPress={handleCheckIn}
                style={styles.emeraldActionBtn}
              >
                <Text style={styles.emeraldActionText}>
                  ✓ Quét mã QR chấm công ngay
                </Text>
              </TouchableOpacity>
            </View>

            {/* Attendance List */}
            <View style={styles.whiteCard}>
              <Text style={styles.cardHeaderTitle}>Danh sách điểm danh hôm nay</Text>
              {emps.map((emp) => (
                <View key={emp.id} style={styles.listRowItem}>
                  <View>
                    <Text style={styles.empRowName}>{emp.name}</Text>
                    <Text style={styles.empRowDept}>
                      {emp.dept} · Giờ vào: {emp.checkedIn || '--:--'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      emp.status === 'Đúng giờ'
                        ? styles.badgeGreen
                        : emp.status === 'Đi muộn'
                        ? styles.badgeAmber
                        : styles.badgeRose,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        emp.status === 'Đúng giờ'
                          ? { color: '#047857' }
                          : emp.status === 'Đi muộn'
                          ? { color: '#B45309' }
                          : { color: '#BE123C' },
                      ]}
                    >
                      {emp.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TAB 4: ĐƠN TỪ & SỐ DƯ PHÉP NĂM (Matches 00:27 - 00:34 in video) */}
        {activeTab === 'requests' && (
          <View style={styles.sectionGap}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardHeaderTitle}>
                Đơn chờ duyệt ({pendingReqCount})
              </Text>
              <TouchableOpacity
                onPress={() => setIsNewReqModal(true)}
                style={styles.smallBlueBtn}
              >
                <Text style={styles.smallBlueBtnText}>+ Tạo đơn mới</Text>
              </TouchableOpacity>
            </View>

            {reqs.map((r) => (
              <View key={r.id} style={styles.whiteCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.reqTypeLabel}>{r.type}</Text>
                  <Text
                    style={[
                      styles.reqStatusText,
                      r.status === 'Đã duyệt'
                        ? { color: '#059669' }
                        : r.status === 'Từ chối'
                        ? { color: '#E11D48' }
                        : { color: '#D97706' },
                    ]}
                  >
                    {r.status}
                  </Text>
                </View>
                <Text style={styles.empRowName}>
                  {r.empName} ({r.empCode})
                </Text>
                <Text style={styles.empRowDept}>{r.dateRange}</Text>
                <Text style={styles.reqReasonText}>{r.reason}</Text>

                {r.status === 'Đang chờ' && (
                  <View style={styles.approveRow}>
                    <TouchableOpacity
                      onPress={() => handleApproveReq(r.id, 'Đã duyệt')}
                      style={styles.approveBtn}
                    >
                      <Text style={styles.approveBtnText}>✓ Duyệt một chạm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleApproveReq(r.id, 'Từ chối')}
                      style={styles.rejectBtn}
                    >
                      <Text style={styles.rejectBtnText}>✕ Từ chối</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}

            {/* Seniority Leave Balance Card */}
            <View style={styles.whiteCard}>
              <Text style={styles.cardHeaderTitle}>
                Số dư phép năm 2026 (Tự tính theo thâm niên)
              </Text>
              <Text style={styles.cardHeaderSub}>
                Mỗi năm 12 ngày, cứ 5 năm làm việc cộng thêm 1 ngày.
              </Text>
              {emps.slice(0, 5).map((e) => {
                const seniority = Math.floor(Math.max(0, 2026 - e.joinYear) / 5);
                const totalQuota = 12 + seniority;
                const remain = totalQuota - e.leaveDays;
                return (
                  <View key={e.id} style={styles.listRowItem}>
                    <View>
                      <Text style={styles.empRowName}>{e.name}</Text>
                      <Text style={styles.empRowDept}>
                        Định mức: {totalQuota} ngày · Đã dùng: {e.leaveDays}
                      </Text>
                    </View>
                    <Text style={styles.leaveRemainText}>Còn {remain} ngày</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* TAB 5: BẢNG LƯƠNG 5 BƯỚC & PHIẾU LƯƠNG (Matches 00:48 - 00:55 in video) */}
        {activeTab === 'payroll' && (
          <View style={styles.sectionGap}>
            <View style={styles.whiteCard}>
              <Text style={styles.cardHeaderTitle}>
                Quy trình Làm lương 5 bước (Kỳ 2026-09)
              </Text>
              {[
                '1. Tổng hợp bảng công tháng (50/50 đã xong)',
                '2. Chốt kỳ công (Đã khoá sổ công)',
                '3. Khai lương cơ bản (Đầy đủ hợp đồng)',
                '4. Tính bảng lương (Tự tính BHXH 10.5%, Thuế, Phạt muộn)',
                '5. Chốt & Phát hành phiếu lương (Gửi PDF & Email)',
              ].map((step) => (
                <View key={step} style={styles.stepItem}>
                  <Text style={styles.stepCheck}>✓</Text>
                  <Text style={styles.stepLabel}>{step}</Text>
                </View>
              ))}
            </View>

            {/* Detailed Payslip for Current Selected Employee */}
            <View style={styles.whiteCard}>
              <Text style={styles.cardHeaderTitle}>
                Phiếu lương cá nhân: {currentEmp.name}
              </Text>
              <Text style={styles.cardHeaderSub}>
                Mã NV: {currentEmp.id} · Phòng {currentEmp.dept}
              </Text>

              <View style={styles.payslipDivider} />

              <View style={styles.payslipRow}>
                <Text style={styles.payslipKey}>Lương cơ bản hợp đồng:</Text>
                <Text style={styles.payslipVal}>
                  {formatVND(currentEmp.baseSalary)}
                </Text>
              </View>
              <View style={styles.payslipRow}>
                <Text style={styles.payslipKey}>
                  Ngày công thực tế + Phép:
                </Text>
                <Text style={styles.payslipVal}>
                  {currentEmp.actualDays + currentEmp.leaveDays}/
                  {payrollSummary.stdDays} ngày
                </Text>
              </View>
              <View style={styles.payslipRow}>
                <Text style={styles.payslipKey}>Lương theo ngày công:</Text>
                <Text style={styles.payslipVal}>
                  {formatVND(payrollSummary.proRated)}
                </Text>
              </View>
              <View style={styles.payslipRow}>
                <Text style={styles.payslipKey}>
                  Phụ cấp + Tăng ca ({currentEmp.otHours}h OT):
                </Text>
                <Text style={[styles.payslipVal, { color: '#059669' }]}>
                  +{formatVND(currentEmp.allowance + payrollSummary.otPay)}
                </Text>
              </View>
              <View style={styles.payslipRow}>
                <Text style={styles.payslipKey}>
                  Phạt đi muộn ({currentEmp.lateCount} lần · {currentEmp.lateMins}p):
                </Text>
                <Text style={[styles.payslipVal, { color: '#E11D48' }]}>
                  -{formatVND(payrollSummary.latePenalty)}
                </Text>
              </View>
              <View style={styles.payslipRow}>
                <Text style={styles.payslipKey}>
                  BHXH (10.5%) &amp; Thuế TNCN:
                </Text>
                <Text style={[styles.payslipVal, { color: '#E11D48' }]}>
                  -{formatVND(payrollSummary.insurance + payrollSummary.tax)}
                </Text>
              </View>

              <View style={styles.payslipDivider} />

              <View style={styles.payslipRow}>
                <Text style={styles.netLabel}>THỰC LĨNH:</Text>
                <Text style={styles.netValue}>
                  {formatVND(payrollSummary.net)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setNewReqType('Ứng lương nhanh');
                  setNewReqReason('Ứng trước 3.000.000đ trên số công tích lũy thực tế tháng 10/2026');
                  setIsNewReqModal(true);
                }}
                style={[styles.primaryBtn, { marginTop: 12, backgroundColor: '#059669' }]}
              >
                <Text style={styles.primaryBtnText}>
                  💸 Ứng lương nhanh 24/7 (Tới 30% lương)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal Tạo Đơn Mới */}
      <Modal visible={isNewReqModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.cardHeaderTitle}>Tạo đơn từ &amp; Đổi ca / Ứng lương</Text>
            <View style={styles.brushWrap}>
              {[
                'Nghỉ phép năm',
                'Đổi ca trực',
                'Ứng lương nhanh',
                'Đăng ký tăng ca',
                'Bổ sung chấm công',
              ].map(
                (t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setNewReqType(t)}
                    style={[
                      styles.brushPill,
                      newReqType === t && {
                        borderColor: '#2563EB',
                        backgroundColor: '#EFF6FF',
                      },
                    ]}
                  >
                    <Text style={styles.brushText}>{t}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
            <TextInput
              value={newReqReason}
              onChangeText={setNewReqReason}
              placeholder="Nhập lý do chi tiết..."
              style={styles.textInputBox}
              multiline
            />
            <View style={styles.approveRow}>
              <TouchableOpacity
                onPress={() => setIsNewReqModal(false)}
                style={styles.rejectBtn}
              >
                <Text style={styles.rejectBtnText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateReq}
                style={styles.approveBtn}
              >
                <Text style={styles.approveBtnText}>Gửi đơn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomNav}>
        {[
          { id: 'checkin' as const, icon: '📍', label: 'Chấm công' },
          { id: 'shifts' as const, icon: '🗓️', label: 'Xếp ca' },
          { id: 'attendance' as const, icon: '🏁', label: 'Điểm danh' },
          {
            id: 'requests' as const,
            icon: '📝',
            label: `Đơn từ (${pendingReqCount})`,
          },
          { id: 'payroll' as const, icon: '💰', label: 'Bảng lương' },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.navItem, active && styles.navItemActive]}
            >
              <Text style={styles.navIcon}>{tab.icon}</Text>
              <Text
                style={[styles.navLabel, active && styles.navLabelActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  brandSub: {
    fontSize: 11,
    color: '#64748B',
  },
  empSwitchBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'flex-end',
  },
  empSwitchText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  empSwitchSub: {
    fontSize: 10,
    color: '#3B82F6',
  },
  toastBanner: {
    backgroundColor: '#0F172A',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionGap: {
    gap: 14,
  },
  blueHeroCard: {
    backgroundColor: '#2563EB',
    borderRadius: 24,
    padding: 18,
  },
  greetingSub: {
    color: '#DBEAFE',
    fontSize: 13,
    fontWeight: '500',
  },
  greetingName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  shiftWhiteBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  shiftDateText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  shiftNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  shiftTimeLocText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  whiteCardCenter: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  digitalClock: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
  },
  checkedPill: {
    marginTop: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  checkedPillText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
  },
  bigCheckinCircle: {
    width: 154,
    height: 154,
    borderRadius: 77,
    backgroundColor: '#2563EB',
    borderWidth: 5,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    shadowColor: '#2563EB',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  cameraIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  bigCheckinLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  mapCanvas: {
    width: '100%',
    height: 145,
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  mapGridLineH: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#F8FAFC',
  },
  mapGridLineV: {
    position: 'absolute',
    height: '100%',
    width: 2,
    backgroundColor: '#F8FAFC',
  },
  geofenceCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(34, 197, 94, 0.22)',
    borderWidth: 2,
    borderColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  officeCenterPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userGpsDotIn: {
    position: 'absolute',
    right: 26,
    bottom: 28,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userGpsDotOut: {
    position: 'absolute',
    right: 18,
    top: 16,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mapAttribution: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mapAttrText: {
    fontSize: 9,
    color: '#475569',
  },
  gpsStatusPill: {
    marginTop: 10,
    width: '100%',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  gpsStatusPillWarn: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  gpsStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  gpsStatusTextWarn: {
    color: '#B45309',
  },
  simRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    width: '100%',
  },
  simBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  simBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  simBtnText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  simBtnTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardHeaderSub: {
    fontSize: 12,
    color: '#64748B',
  },
  brushWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  brushPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  brushText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  clearBrushText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  empRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  empRowName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  empRowDept: {
    fontSize: 11,
    color: '#64748B',
  },
  weekDaysRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  dayCell: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  dayCellHeader: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
  },
  dayCellShift: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  kpiNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#059669',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  primaryBlueBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBlueBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  qrVisualBox: {
    marginVertical: 12,
    padding: 18,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#DBEAFE',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  qrVisualAscii: {
    fontSize: 26,
    letterSpacing: 6,
    color: '#0F172A',
    fontWeight: '900',
  },
  qrTokenSmall: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
    marginTop: 6,
  },
  emeraldActionBtn: {
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  emeraldActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgeGreen: { backgroundColor: '#ECFDF5' },
  badgeAmber: { backgroundColor: '#FFFBEB' },
  badgeRose: { backgroundColor: '#FFF1F2' },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smallBlueBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  smallBlueBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  reqTypeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  reqStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reqReasonText: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  approveRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#FFF1F2',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  rejectBtnText: {
    color: '#BE123C',
    fontSize: 12,
    fontWeight: '700',
  },
  leaveRemainText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  stepCheck: {
    color: '#059669',
    fontWeight: '900',
    fontSize: 14,
  },
  stepLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  payslipDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  payslipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  payslipKey: {
    fontSize: 12,
    color: '#64748B',
  },
  payslipVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  netLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  netValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2563EB',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  textInputBox: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    minHeight: 70,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 10,
  },
  navItemActive: {
    backgroundColor: '#EFF6FF',
  },
  navIcon: {
    fontSize: 16,
  },
  navLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
});
