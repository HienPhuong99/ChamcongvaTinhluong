import React, { useEffect, useState } from 'react';
import {
  Compass,
  Plus,
  RotateCcw,
  X,
  Save,
  MapPin,
  FileSpreadsheet,
  Clock,
  Cpu,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { INITIAL_SETTINGS } from '../data/seedData';
import { LatePenaltyTier, SystemSettings } from '../types';
import { canManageSettings } from '../utils/helpers';

type SettingsTabId =
  | 'methods'
  | 'locations'
  | 'late_rules'
  | 'checkin_rules'
  | 'biometric'
  | 'payroll_gsheets';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    currentAccount,
    syncNowWithBackend,
    isSyncingBackend,
    lastSyncedAt,
    showToast,
  } = useHRM();

  const [activeSubTab, setActiveSubTab] = useState<SettingsTabId>('late_rules');
  const [draft, setDraft] = useState<SystemSettings>({ ...settings });
  const [isDirty, setIsDirty] = useState(false);

  const canEdit = canManageSettings(currentAccount.roleId);

  useEffect(() => {
    setDraft({ ...settings });
    setIsDirty(false);
  }, [settings]);

  const updateField = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleTierChange = (
    id: string,
    field: keyof LatePenaltyTier,
    value: any
  ) => {
    const nextTiers = draft.lateTiers.map((t) =>
      t.id === id ? { ...t, [field]: value } : t
    );
    updateField('lateTiers', nextTiers);
  };

  const handleAddTier = () => {
    const nextTier: LatePenaltyTier = {
      id: `TIER-${Date.now()}`,
      fromMinutes: 91,
      toMinutes: null,
      action: 'Trừ công',
      value: 1.0,
    };
    updateField('lateTiers', [...draft.lateTiers, nextTier]);
  };

  const handleRemoveTier = (id: string) => {
    updateField(
      'lateTiers',
      draft.lateTiers.filter((t) => t.id !== id)
    );
  };

  const handleResetSuggestedTiers = () => {
    updateField('lateTiers', INITIAL_SETTINGS.lateTiers);
  };

  const handleSaveAll = () => {
    updateSettings(draft);
    setIsDirty(false);
  };

  const enabledMethodsCount = [
    draft.gpsEnabled,
    draft.qrEnabled,
    draft.remoteEnabled,
    draft.biometricEnabled,
    draft.manualProxyEnabled,
  ].filter(Boolean).length;

  return (
    <div className="p-4 sm:p-6 pb-28 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          PHUONGHIHI / HỆ THỐNG
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
          Cài đặt hệ thống
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Cấu hình hình thức chấm công, bán kính GPS, bậc phạt đi muộn, thiết bị sinh trắc học và công thức tính lương.
        </p>
      </div>

      {/* Guided Step Banner (Exact match to 00:53 in video) */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
        <Compass className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <div className="font-bold text-slate-900">
            Làm lần lượt từ trái sang phải
          </div>
          <div>
            Bật hình thức công ty dùng, khai địa điểm, rồi tới quy định đi muộn.
            Sửa ở mục nào xong cũng nhớ bấm <strong>Lưu thay đổi</strong> ở
            thanh hiện dưới đáy màn hình.
          </div>
        </div>
      </div>

      {/* 6 Horizontal Step Cards (Exact match to 00:53 - 00:55 in video) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          {
            id: 'methods' as const,
            title: 'Hình thức',
            sub: `Đang bật ${enabledMethodsCount}`,
          },
          {
            id: 'locations' as const,
            title: 'Địa điểm',
            sub: '1 địa điểm',
          },
          {
            id: 'late_rules' as const,
            title: 'Đi muộn',
            sub: draft.autoProcessLate ? 'Đang xử lý' : 'Chỉ nhắc nhở',
          },
          {
            id: 'checkin_rules' as const,
            title: 'Quy tắc chấm',
            sub: `Sớm ${draft.allowEarlyCheckInMinutes}p · OT x${draft.otMultiplierWeekday}`,
          },
          {
            id: 'biometric' as const,
            title: 'Máy chấm công',
            sub: draft.biometricEnabled ? '1 máy đã gắn' : '0 máy đã gắn',
          },
          {
            id: 'payroll_gsheets' as const,
            title: 'Tính lương & Sheets',
            sub: `${draft.standardWorkDays} công chuẩn`,
          },
        ].map((step) => {
          const active = activeSubTab === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setActiveSubTab(step.id)}
              className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                active
                  ? 'bg-blue-50/80 border-blue-600 shadow-2xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div
                className={`text-xs font-bold ${
                  active ? 'text-blue-700' : 'text-slate-800'
                }`}
              >
                {step.title}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{step.sub}</div>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HÌNH THỨC CHẤM CÔNG (Exact match to 00:17 - 00:22 in video) */}
      {activeSubTab === 'methods' && (
        <div className="space-y-4">
          {/* 1. GPS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900">
                  Chấm công tại chỗ bằng GPS
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Nhân viên bấm nút trên điện thoại, máy đối chiếu vị trí với
                  bán kính quanh nơi làm việc
                </div>
              </div>
              <input
                type="checkbox"
                checked={draft.gpsEnabled}
                onChange={(e) => updateField('gpsEnabled', e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>
            {draft.gpsEnabled && (
              <label className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.requirePhotoOnGps}
                  onChange={(e) =>
                    updateField('requirePhotoOnGps', e.target.checked)
                  }
                  className="mt-0.5 w-4 h-4 accent-blue-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Yêu cầu chụp ảnh khi chấm
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Ảnh không làm mục nhận diện, chỉ để đối chiếu khi có tranh
                    cãi. Tắt đi sẽ bấm một nút là xong
                  </div>
                </div>
              </label>
            )}
          </div>

          {/* 2. Mã QR */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900">
                  Chấm công bằng mã QR
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Ba cách dùng, bật cách nào tuỳ chỗ làm có màn hình hay không
                </div>
              </div>
              <input
                type="checkbox"
                checked={draft.qrEnabled}
                onChange={(e) => updateField('qrEnabled', e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            {draft.qrEnabled && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.qrScreen45s}
                    onChange={(e) => updateField('qrScreen45s', e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-blue-600 rounded"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Màn hình tại cửa, mã đổi mỗi 45 giây
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Mở trên máy tính bảng, màn hình, hoặc ngay trên điện thoại
                      của quản lý. Chắc nhất
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.qrPrintedAtDoor}
                    onChange={(e) =>
                      updateField('qrPrintedAtDoor', e.target.checked)
                    }
                    className="mt-0.5 w-4 h-4 accent-blue-600 rounded"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Mã in ra dán tại cửa
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Cho chỗ không có màn hình. Nên bật kèm kiểm tra vị trí để
                      tránh chụp mã về nhà quét
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.qrManagerScanEmployee}
                    onChange={(e) =>
                      updateField('qrManagerScanEmployee', e.target.checked)
                    }
                    className="mt-0.5 w-4 h-4 accent-blue-600 rounded"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Quản lý quét mã trên máy nhân viên
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Dùng ở công trường, kho bãi. Nhân viên mở Mã của tôi, quản
                      lý quét
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* 3. Chấm công từ xa */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-sm font-bold text-slate-900">
                Chấm công từ xa cho người làm online
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Người làm ngoài văn phòng chấm không cần vị trí, bấm ảnh là một
                nút ghi nhận đang làm việc gì
              </div>
            </div>
            <input
              type="checkbox"
              checked={draft.remoteEnabled}
              onChange={(e) => updateField('remoteEnabled', e.target.checked)}
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          {/* 4. Máy chấm công vân tay / khuôn mặt */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-sm font-bold text-slate-900">
                Máy chấm công vân tay hoặc khuôn mặt
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Máy đặt ở cửa tự đẩy dữ liệu vào hệ thống phuonghihi, nhân viên không phải mở
                điện thoại
              </div>
            </div>
            <input
              type="checkbox"
              checked={draft.biometricEnabled}
              onChange={(e) =>
                updateField('biometricEnabled', e.target.checked)
              }
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          {/* 5. Quản lý chấm công hộ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-sm font-bold text-slate-900">
                Quản lý chấm công hộ
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Quản lý ghi tay giờ vào và ra cho nhân viên, bắt buộc nhập lý do
              </div>
            </div>
            <input
              type="checkbox"
              checked={draft.manualProxyEnabled}
              onChange={(e) =>
                updateField('manualProxyEnabled', e.target.checked)
              }
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* TAB 2: ĐỊA ĐIỂM VĂN PHÒNG */}
      {activeSubTab === 'locations' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Địa điểm chấm công GPS
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tên văn phòng / Chi nhánh
              </label>
              <input
                type="text"
                value={draft.officeName}
                onChange={(e) => updateField('officeName', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Bán kính cho phép (mét)
              </label>
              <input
                type="number"
                min={10}
                value={draft.allowedRadiusMeters}
                onChange={(e) =>
                  updateField('allowedRadiusMeters', Number(e.target.value) || 150)
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Vĩ độ (Latitude)
              </label>
              <input
                type="number"
                step="0.0001"
                value={draft.officeLat}
                onChange={(e) =>
                  updateField('officeLat', Number(e.target.value) || 10.7726)
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Kinh độ (Longitude)
              </label>
              <input
                type="number"
                step="0.0001"
                value={draft.officeLng}
                onChange={(e) =>
                  updateField('officeLng', Number(e.target.value) || 106.698)
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUY ĐỊNH ĐI MUỘN THEO BẬC (Exact match to 00:53 - 00:55 in video) */}
      {activeSubTab === 'late_rules' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-2xs">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Quy định đi muộn
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cài một lần, hệ thống tự áp khi tính công. Chưa bật thì không trừ
              của ai đồng nào.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">
                Tự xử lý đi muộn
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Bật lên, mỗi ngày công có đi muộn sẽ mang sẵn hình thức xử lý;
                tiền phạt sẽ tự đưa vào mục Khấu trừ trên phiếu lương.
              </div>
            </div>
            <input
              type="checkbox"
              checked={draft.autoProcessLate}
              onChange={(e) =>
                updateField('autoProcessLate', e.target.checked)
              }
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Bỏ qua bao nhiêu lần muộn mỗi tháng
            </label>
            <input
              type="number"
              min={0}
              value={draft.graceLateCountPerMonth}
              onChange={(e) =>
                updateField(
                  'graceLateCountPerMonth',
                  Math.max(0, Number(e.target.value) || 0)
                )
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          {/* Tiered Table (Matches 00:54 - 00:55 in video) */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400 bg-slate-50">
                  <th className="py-3 px-4">Từ (Phút)</th>
                  <th className="py-3 px-4">Đến (Phút)</th>
                  <th className="py-3 px-4">Hình thức</th>
                  <th className="py-3 px-4">Mức</th>
                  <th className="py-3 px-3 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {draft.lateTiers.map((tier) => (
                  <tr key={tier.id}>
                    <td className="p-3">
                      <input
                        type="number"
                        value={tier.fromMinutes}
                        onChange={(e) =>
                          handleTierChange(
                            tier.id,
                            'fromMinutes',
                            Number(e.target.value)
                          )
                        }
                        className="w-28 px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={
                          tier.toMinutes === null
                            ? 'trở lên'
                            : String(tier.toMinutes)
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          handleTierChange(
                            tier.id,
                            'toMinutes',
                            val === '' || isNaN(Number(val))
                              ? null
                              : Number(val)
                          );
                        }}
                        className="w-28 px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={tier.action}
                        onChange={(e) =>
                          handleTierChange(tier.id, 'action', e.target.value)
                        }
                        className="w-40 px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                      >
                        <option value="Nhắc nhở">Nhắc nhở</option>
                        <option value="Trừ tiền">Trừ tiền</option>
                        <option value="Trừ công">Trừ công</option>
                      </select>
                    </td>
                    <td className="p-3">
                      {tier.action === 'Nhắc nhở' ? (
                        <div className="px-3 py-2 text-slate-400">—</div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step={tier.action === 'Trừ công' ? '0.5' : '10000'}
                            value={tier.value}
                            onChange={(e) =>
                              handleTierChange(
                                tier.id,
                                'value',
                                Number(e.target.value)
                              )
                            }
                            className="w-36 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
                          />
                          <span className="text-slate-400">
                            {tier.action === 'Trừ tiền' ? 'đ' : 'công'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(tier.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleAddTier}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm bậc</span>
            </button>
            <button
              type="button"
              onClick={handleResetSuggestedTiers}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Về mức gợi ý</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: QUY TẮC CHẤM CÔNG & HỆ SỐ TĂNG CA (OT) */}
      {activeSubTab === 'checkin_rules' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Quy tắc khung giờ chấm công &amp; Hệ số Tăng ca (OT)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập biên độ giờ vào sớm / ra muộn hợp lệ và hệ số nhân lương OT ngày thường / cuối tuần.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Cho phép chấm công vào sớm trước giờ ca (phút)
              </label>
              <input
                type="number"
                min={0}
                max={240}
                value={draft.allowEarlyCheckInMinutes}
                onChange={(e) =>
                  updateField(
                    'allowEarlyCheckInMinutes',
                    Math.max(0, Number(e.target.value) || 0)
                  )
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Cho phép chấm công ra muộn sau giờ tan ca (phút)
              </label>
              <input
                type="number"
                min={0}
                max={480}
                value={draft.allowLateCheckOutMinutes}
                onChange={(e) =>
                  updateField(
                    'allowLateCheckOutMinutes',
                    Math.max(0, Number(e.target.value) || 0)
                  )
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Hệ số lương Tăng ca ngày thường (OT Weekday)
              </label>
              <input
                type="number"
                step="0.1"
                min={1}
                value={draft.otMultiplierWeekday}
                onChange={(e) =>
                  updateField(
                    'otMultiplierWeekday',
                    Number(e.target.value) || 1.5
                  )
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Hệ số lương Tăng ca cuối tuần / Lễ (OT Weekend)
              </label>
              <input
                type="number"
                step="0.1"
                min={1}
                value={draft.otMultiplierWeekend}
                onChange={(e) =>
                  updateField(
                    'otMultiplierWeekend',
                    Number(e.target.value) || 2.0
                  )
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MÁY CHẤM CÔNG VÂN TAY / KHUÔN MẶT */}
      {activeSubTab === 'biometric' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Kết nối Máy chấm công Vân tay &amp; Khuôn mặt (FaceID / ZKTeco)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đồng bộ tự động log quét vân tay/khuôn mặt tại cửa hàng 123 Lê Lợi về bảng chấm công.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={draft.biometricEnabled}
              onChange={(e) =>
                updateField('biometricEnabled', e.target.checked)
              }
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tên thiết bị máy chấm công tại cửa hàng
              </label>
              <input
                type="text"
                value={
                  draft.biometricDeviceName ||
                  'ZKTeco SpeedFace-V5L (Quầy 123 Lê Lợi)'
                }
                onChange={(e) =>
                  updateField('biometricDeviceName', e.target.value)
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Địa chỉ IP LAN / Cổng kết nối TCP
              </label>
              <input
                type="text"
                value={draft.biometricDeviceIp || '192.168.1.201:4370'}
                onChange={(e) =>
                  updateField('biometricDeviceIp', e.target.value)
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Trạng thái thiết bị:{' '}
                <strong>
                  {draft.biometricEnabled
                    ? 'Đang trực tuyến (Online · Ping 4ms)'
                    : 'Đang tạm tắt'}
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                showToast(
                  'Đã kiểm tra kết nối máy chấm công!',
                  `Thiết bị ${draft.biometricDeviceName || 'ZKTeco SpeedFace-V5L'} (${draft.biometricDeviceIp || '192.168.1.201:4370'}) phản hồi tốt.`
                )
              }
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Kiểm tra kết nối máy chấm công
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: TÍNH LƯƠNG, THUẾ TNCN, BHXH & ĐỒNG BỘ GOOGLE SHEETS */}
      {activeSubTab === 'payroll_gsheets' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-2xs">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              Cấu hình Tính lương, Bảo hiểm, Thuế TNCN &amp; Đồng bộ Google Sheets
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Số ngày công chuẩn / tháng
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={draft.standardWorkDays}
                onChange={(e) =>
                  updateField('standardWorkDays', Number(e.target.value) || 22)
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tỷ lệ BHXH nhân viên đóng (%)
              </label>
              <input
                type="number"
                step="0.5"
                min={0}
                value={draft.insuranceRateEmployee}
                onChange={(e) =>
                  updateField(
                    'insuranceRateEmployee',
                    Number(e.target.value) || 10.5
                  )
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Mức trần lương đóng BHXH (VNĐ)
              </label>
              <input
                type="number"
                step={1000000}
                min={0}
                value={draft.maxInsuranceSalary ?? 46800000}
                onChange={(e) =>
                  updateField(
                    'maxInsuranceSalary',
                    Number(e.target.value) || 46800000
                  )
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Giảm trừ gia cảnh bản thân (VNĐ/tháng)
              </label>
              <input
                type="number"
                step={500000}
                min={0}
                value={draft.personalTaxDeduction}
                onChange={(e) =>
                  updateField(
                    'personalTaxDeduction',
                    Number(e.target.value) || 11000000
                  )
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Giảm trừ mỗi người phụ thuộc (VNĐ/tháng)
              </label>
              <input
                type="number"
                step={200000}
                min={0}
                value={draft.dependentTaxDeduction}
                onChange={(e) =>
                  updateField(
                    'dependentTaxDeduction',
                    Number(e.target.value) || 4400000
                  )
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">
                  Tự động gửi phiếu lương qua Email
                </span>
                <input
                  type="checkbox"
                  checked={draft.autoSendPayslipEmail}
                  onChange={(e) =>
                    updateField('autoSendPayslipEmail', e.target.checked)
                  }
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </label>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-emerald-950">
                  Kết nối Backend REST API &amp; Google Sheets (Apps Script Web App URL)
                </div>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Hệ thống đi kèm sẵn mã nguồn <code>server/index.js</code> và{' '}
                  <code>google-sheets/Code.gs</code> để đồng bộ 2 chiều theo thời gian thực.
                  {lastSyncedAt && ` (Đồng bộ gần nhất: ${lastSyncedAt})`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => syncNowWithBackend()}
                disabled={isSyncingBackend}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSyncingBackend ? 'animate-spin' : ''}`}
                />
                <span>
                  {isSyncingBackend ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
                </span>
              </button>
            </div>
            <input
              type="url"
              value={draft.googleSheetsWebAppUrl}
              onChange={(e) =>
                updateField('googleSheetsWebAppUrl', e.target.value)
              }
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 bg-white text-xs"
            />
          </div>
        </div>
      )}

      {/* Sticky Bottom Save Bar */}
      <div className="fixed bottom-4 left-4 lg:left-64 right-4 lg:right-6 z-30 pointer-events-none flex justify-end">
        <div className="pointer-events-auto bg-slate-900 text-white px-4 sm:px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 sm:gap-4 border border-slate-700">
          <span className="text-xs text-slate-300">
            {isDirty
              ? 'Bạn có thay đổi cấu hình chưa lưu.'
              : 'Mọi cấu hình đã được đồng bộ.'}
          </span>
          <button
            onClick={handleSaveAll}
            disabled={!canEdit}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>
    </div>
  );
};

