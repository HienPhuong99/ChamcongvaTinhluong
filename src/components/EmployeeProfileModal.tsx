import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Plus,
  FileText,
  CheckSquare,
  Square,
  Upload,
  Trash2,
  Download,
  UserMinus,
} from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import {
  DEFAULT_OFFBOARDING_TEMPLATE,
  DEFAULT_ONBOARDING_TEMPLATE,
} from '../data/seedData';
import { DepartmentName, Employee, EmployeeDocument, EmployeeStatus } from '../types';
import {
  canManageHR,
  formatIsoToVN,
  formatVND,
  getInitials,
  getTodayIsoDate,
} from '../utils/helpers';

type ProfileTab = 'info' | 'contracts' | 'documents' | 'tasks' | 'notes';

export const EmployeeProfileModal: React.FC = () => {
  const {
    selectedEmployeeId,
    setSelectedEmployeeId,
    employees,
    currentAccount,
    saveEmployee,
    deleteEmployee,
    generateChecklistTasks,
    toggleChecklistTask,
    showToast,
  } = useHRM();

  const existingEmp = employees.find((e) => e.id === selectedEmployeeId);
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');
  const [formData, setFormData] = useState<Employee | null>(null);
  const lastOpenedIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contract inline creation state
  const [isAddingContract, setIsAddingContract] = useState(false);
  const [newContractType, setNewContractType] = useState<
    | 'Hợp đồng thử việc 2 tháng'
    | 'Hợp đồng xác định thời hạn 12 tháng'
    | 'Hợp đồng không xác định thời hạn'
  >('Hợp đồng không xác định thời hạn');
  const [newContractNumber, setNewContractNumber] = useState('');
  const [newContractStart, setNewContractStart] = useState(() =>
    formatIsoToVN(getTodayIsoDate())
  );
  const [newContractEnd, setNewContractEnd] = useState('Không thời hạn');

  // Document category state
  const [docCategory, setDocCategory] =
    useState<EmployeeDocument['category']>('CCCD / Định danh');

  const isHRManager = canManageHR(currentAccount.roleId);

  // Initialize formData ONLY when selectedEmployeeId changes (prevents tab jump when tasks update)
  useEffect(() => {
    if (!selectedEmployeeId) {
      setFormData(null);
      lastOpenedIdRef.current = null;
      setIsAddingContract(false);
      return;
    }

    if (lastOpenedIdRef.current !== selectedEmployeeId) {
      lastOpenedIdRef.current = selectedEmployeeId;
      setActiveTab('info');
      setIsAddingContract(false);

      if (selectedEmployeeId === 'NEW') {
        const maxNum = employees.reduce((max, e) => {
          const n = parseInt(e.code.replace(/\D/g, ''), 10);
          return Number.isFinite(n) && n > max ? n : max;
        }, 0);
        const code = `NV${String(maxNum + 1).padStart(4, '0')}`;
        const todayVN = formatIsoToVN(getTodayIsoDate());
        setFormData({
          id: code,
          code,
          name: '',
          email: `${code.toLowerCase()}@phuonghihi.vn`,
          phone: '0901234568',
          dob: '01/01/1998',
          department: 'Kinh doanh',
          position: 'Nhân viên',
          status: 'Thử việc',
          joinDate: todayVN,
          allowRemote: false,
          avatarColor: 'bg-blue-100 text-blue-700',
          baseSalary: 14000000,
          allowance: 1200000,
          dependents: 0,
          bankName: 'Vietcombank',
          bankAccount: '',
          contracts: [],
          documents: [],
          tasks: DEFAULT_ONBOARDING_TEMPLATE.map((title, idx) => ({
            id: `TASK-${code}-${idx + 1}`,
            title,
            type: 'Nhận người mới',
            dueDate: todayVN,
            assignee: 'Đặng Thu Trang',
            completed: false,
          })),
          notes: '',
        });
      } else if (existingEmp) {
        setFormData({ ...existingEmp });
      }
    }
  }, [selectedEmployeeId, existingEmp, employees]);

  // Sync tasks in formData when existingEmp.tasks changes in context without resetting activeTab or other unsaved edits
  useEffect(() => {
    if (existingEmp && lastOpenedIdRef.current === existingEmp.id) {
      setFormData((prev) => (prev ? { ...prev, tasks: existingEmp.tasks } : prev));
    }
  }, [existingEmp?.tasks, existingEmp]);

  if (!selectedEmployeeId || !formData) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập họ tên nhân viên!', undefined, 'warning');
      return;
    }
    saveEmployee(formData);
    setSelectedEmployeeId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const sizeLabel =
      sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
    const todayVN = formatIsoToVN(getTodayIsoDate());

    const reader = new FileReader();
    reader.onload = () => {
      const nextDoc: EmployeeDocument = {
        id: `DOC-${Date.now()}`,
        name: file.name,
        category: docCategory,
        uploadedAt: todayVN,
        fileSize: sizeLabel,
        dataUrl: typeof reader.result === 'string' ? reader.result : undefined,
      };
      setFormData((prev) =>
        prev ? { ...prev, documents: [...prev.documents, nextDoc] } : prev
      );
      showToast(`Đã đính kèm tệp "${file.name}"`, `Phân loại: ${docCategory} (${sizeLabel})`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGenerateTasks = (type: 'Nhận người mới' | 'Tiễn người nghỉ') => {
    if (existingEmp) {
      generateChecklistTasks(formData.id, type);
    } else {
      const templates =
        type === 'Nhận người mới'
          ? DEFAULT_ONBOARDING_TEMPLATE
          : DEFAULT_OFFBOARDING_TEMPLATE;
      const newTasks = templates.map((title, idx) => ({
        id: `TASK-${formData.code}-${Date.now()}-${idx}`,
        title,
        type,
        dueDate: formData.joinDate || formatIsoToVN(getTodayIsoDate()),
        assignee: 'Đặng Thu Trang',
        completed: false,
      }));
      setFormData({ ...formData, tasks: [...newTasks, ...formData.tasks] });
      showToast(`Đã thêm danh sách việc: ${type}`);
    }
  };

  const handleToggleTask = (taskId: string) => {
    if (existingEmp) {
      toggleChecklistTask(formData.id, taskId);
    } else {
      setFormData({
        ...formData,
        tasks: formData.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        ),
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={() => setSelectedEmployeeId(null)}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                HỒ SƠ NHÂN VIÊN
              </div>
              <div className="flex items-center gap-2.5 mt-1">
                <h2 className="text-xl font-bold text-slate-900">
                  {formData.name || 'Thêm nhân viên mới'}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    formData.status === 'Chính thức'
                      ? 'bg-emerald-50 text-emerald-700'
                      : formData.status === 'Thử việc'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      formData.status === 'Chính thức'
                        ? 'bg-emerald-500'
                        : formData.status === 'Thử việc'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  {formData.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {formData.position} · {formData.code}
              </div>
            </div>
            <button
              onClick={() => setSelectedEmployeeId(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Summary strip */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center ${formData.avatarColor}`}
              >
                {getInitials(formData.name || 'NV')}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {formData.name || 'Nhân viên mới'}
                </div>
                <div className="text-xs text-slate-500">
                  {formData.position} · {formData.department}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400">Ngày vào</div>
              <div className="text-sm font-bold text-slate-800">{formData.joinDate}</div>
            </div>
          </div>

          {/* 5 Sub-tabs */}
          <div className="flex items-center gap-5 sm:gap-6 mt-4 -mb-4 border-b border-slate-100 overflow-x-auto">
            {[
              { id: 'info', label: 'Thông tin' },
              { id: 'contracts', label: `Hợp đồng (${formData.contracts.length})` },
              { id: 'documents', label: `Tài liệu (${formData.documents.length})` },
              { id: 'tasks', label: `Nhận & trả việc (${formData.tasks.length})` },
              { id: 'notes', label: 'Ghi chú' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as ProfileTab)}
                className={`pb-3 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                  activeTab === t.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Họ tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                    placeholder="Nhập họ và tên..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Mã nhân viên
                  </label>
                  <input
                    type="text"
                    disabled={!isHRManager || Boolean(existingEmp)}
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                        id: selectedEmployeeId === 'NEW' ? e.target.value.toUpperCase() : formData.id,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Ngày sinh (DD/MM/YYYY)
                  </label>
                  <input
                    type="text"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Ngày vào làm (DD/MM/YYYY)
                  </label>
                  <input
                    type="text"
                    disabled={!isHRManager}
                    value={formData.joinDate}
                    onChange={(e) =>
                      setFormData({ ...formData, joinDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 disabled:bg-slate-50 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Phòng ban
                  </label>
                  <select
                    disabled={!isHRManager}
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        department: e.target.value as DepartmentName,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white disabled:bg-slate-50 focus:outline-none focus:border-blue-600"
                  >
                    {[
                      'Phòng ban chung',
                      'Nhân sự',
                      'Kỹ thuật',
                      'Kinh doanh',
                      'Kế toán',
                      'Vận hành',
                      'Marketing',
                    ].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Chức vụ
                  </label>
                  <select
                    disabled={!isHRManager}
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        position: e.target.value as Employee['position'],
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white disabled:bg-slate-50 focus:outline-none focus:border-blue-600"
                  >
                    {[
                      'Nhân viên',
                      'Trưởng nhóm',
                      'Trưởng phòng',
                      'Quản trị viên',
                      'Thực tập sinh',
                    ].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Trạng thái làm việc
                  </label>
                  <select
                    disabled={!isHRManager}
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as EmployeeStatus,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white disabled:bg-slate-50 focus:outline-none focus:border-blue-600"
                  >
                    {['Chính thức', 'Thử việc', 'Tạm nghỉ', 'Đã nghỉ'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Người phụ thuộc (Giảm trừ thuế TNCN)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    disabled={!isHRManager}
                    value={formData.dependents}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dependents: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 disabled:bg-slate-50 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Lương cơ bản (VNĐ/tháng)
                  </label>
                  <input
                    type="number"
                    min={0}
                    disabled={!isHRManager}
                    value={formData.baseSalary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        baseSalary: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 disabled:bg-slate-50 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Phụ cấp cố định (VNĐ/tháng)
                  </label>
                  <input
                    type="number"
                    min={0}
                    disabled={!isHRManager}
                    value={formData.allowance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allowance: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 disabled:bg-slate-50 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Ngân hàng nhận lương
                  </label>
                  <input
                    type="text"
                    value={formData.bankName || ''}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="VD: Vietcombank, Techcombank, MB..."
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Số tài khoản ngân hàng
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, bankAccount: e.target.value })
                    }
                    placeholder="Nhập số tài khoản..."
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isHRManager}
                  checked={formData.allowRemote}
                  onChange={(e) =>
                    setFormData({ ...formData, allowRemote: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 font-medium">
                  Cho phép chấm công từ xa (Ngoài bán kính GPS văn phòng)
                </span>
              </label>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="space-y-3">
              {formData.contracts.length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  Chưa có hợp đồng lao động nào được ghi nhận.
                </div>
              )}
              {formData.contracts.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {c.contractType}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Số HĐ: {c.contractNumber} · Hiệu lực: {c.startDate} → {c.endDate}
                    </div>
                    <div className="text-xs font-semibold text-blue-600 mt-1">
                      Lương cơ bản: {formatVND(c.baseSalary)} · Phụ cấp:{' '}
                      {formatVND(c.allowance)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                      {c.status}
                    </span>
                    {isHRManager && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            contracts: formData.contracts.filter((x) => x.id !== c.id),
                          })
                        }
                        title="Xoá hợp đồng này"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isHRManager && !isAddingContract && (
                <button
                  type="button"
                  onClick={() => {
                    setNewContractNumber(
                      `PLHĐ/${formData.code}/${formData.contracts.length + 1}-2026`
                    );
                    setIsAddingContract(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm phụ lục / hợp đồng mới</span>
                </button>
              )}

              {isHRManager && isAddingContract && (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                  <div className="text-xs font-bold text-slate-800">
                    Tạo hợp đồng / phụ lục mới
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Loại hợp đồng
                      </label>
                      <select
                        value={newContractType}
                        onChange={(e) =>
                          setNewContractType(
                            e.target.value as typeof newContractType
                          )
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="Hợp đồng thử việc 2 tháng">
                          Hợp đồng thử việc 2 tháng
                        </option>
                        <option value="Hợp đồng xác định thời hạn 12 tháng">
                          Hợp đồng xác định thời hạn 12 tháng
                        </option>
                        <option value="Hợp đồng không xác định thời hạn">
                          Hợp đồng không xác định thời hạn
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Số hợp đồng
                      </label>
                      <input
                        type="text"
                        value={newContractNumber}
                        onChange={(e) => setNewContractNumber(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Ngày bắt đầu
                      </label>
                      <input
                        type="text"
                        value={newContractStart}
                        onChange={(e) => setNewContractStart(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Ngày kết thúc
                      </label>
                      <input
                        type="text"
                        value={newContractEnd}
                        onChange={(e) => setNewContractEnd(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingContract(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/60"
                    >
                      Huỷ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newContract = {
                          id: `HD-${Date.now()}`,
                          contractNumber:
                            newContractNumber.trim() || `PLHĐ/${formData.code}/2026`,
                          contractType: newContractType,
                          startDate: newContractStart || formatIsoToVN(getTodayIsoDate()),
                          endDate: newContractEnd || 'Không thời hạn',
                          baseSalary: formData.baseSalary || 15000000,
                          allowance: formData.allowance || 1500000,
                          dependents: formData.dependents,
                          status: 'Còn hiệu lực' as const,
                        };
                        setFormData({
                          ...formData,
                          contracts: [...formData.contracts, newContract],
                        });
                        setIsAddingContract(false);
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Xác nhận thêm HĐ
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-3">
              {formData.documents.length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  Chưa có tài liệu đính kèm nào.
                </div>
              )}
              {formData.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800 truncate">
                        {doc.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {doc.category} · Tải lên {doc.uploadedAt} · {doc.fileSize}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {doc.dataUrl ? (
                      <a
                        href={doc.dataUrl}
                        download={doc.name}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải về</span>
                      </a>
                    ) : (
                      <span className="text-xs font-medium text-blue-600">Đã lưu trữ</span>
                    )}
                    {isHRManager && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            documents: formData.documents.filter((d) => d.id !== doc.id),
                          })
                        }
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Xoá tài liệu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-2 flex flex-wrap items-center gap-2">
                <select
                  value={docCategory}
                  onChange={(e) =>
                    setDocCategory(e.target.value as EmployeeDocument['category'])
                  }
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
                >
                  <option value="CCCD / Định danh">CCCD / Định danh</option>
                  <option value="Hợp đồng">Hợp đồng</option>
                  <option value="Bằng cấp">Bằng cấp</option>
                  <option value="Khác">Khác</option>
                </select>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-semibold text-blue-700 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Chọn tệp từ máy tính</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const todayVN = formatIsoToVN(getTodayIsoDate());
                    const nextDoc: EmployeeDocument = {
                      id: `DOC-${Date.now()}`,
                      name: `SoYeuLyLich_${formData.code}.pdf`,
                      category: docCategory,
                      uploadedAt: todayVN,
                      fileSize: '950 KB',
                    };
                    setFormData({
                      ...formData,
                      documents: [...formData.documents, nextDoc],
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm nhanh mẫu hồ sơ</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <button
                  type="button"
                  onClick={() => handleGenerateTasks('Nhận người mới')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo việc nhận người mới</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateTasks('Tiễn người nghỉ')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo việc tiễn người nghỉ</span>
                </button>
              </div>

              {/* Checklist Box */}
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {formData.tasks.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Chưa có đầu việc bàn giao nào. Hãy bấm nút tạo danh sách việc ở trên.
                  </div>
                ) : (
                  formData.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className="p-3.5 bg-white hover:bg-slate-50 flex items-start gap-3 cursor-pointer transition"
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-slate-400 hover:text-blue-600"
                      >
                        {task.completed ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div>
                        <div
                          className={`text-sm font-semibold ${
                            task.completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-800'
                          }`}
                        >
                          {task.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {task.type} · Hạn {task.dueDate} · {task.assignee}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Ghi chú nội bộ nhân sự
              </label>
              <textarea
                rows={5}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Nhập ghi chú đánh giá, lộ trình thăng tiến hoặc lưu ý đặc biệt..."
                className="w-full p-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
              />
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-between gap-2.5 pt-5 mt-5 border-t border-slate-100">
            <div>
              {isHRManager &&
                existingEmp &&
                formData.status !== 'Đã nghỉ' &&
                formData.id !== currentAccount.employeeId && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteEmployee(formData.id);
                      setSelectedEmployeeId(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Cho nghỉ việc</span>
                  </button>
                )}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedEmployeeId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
              >
                Lưu hồ sơ
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
