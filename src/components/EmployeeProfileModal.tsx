import React, { useEffect, useState } from 'react';
import { X, Plus, FileText, CheckSquare, Square } from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { DepartmentName, Employee, EmployeeStatus } from '../types';
import { formatVND, getInitials } from '../utils/helpers';

type ProfileTab = 'info' | 'contracts' | 'documents' | 'tasks' | 'notes';

export const EmployeeProfileModal: React.FC = () => {
  const {
    selectedEmployeeId,
    setSelectedEmployeeId,
    employees,
    saveEmployee,
    generateChecklistTasks,
    toggleChecklistTask,
  } = useHRM();

  const existingEmp = employees.find((e) => e.id === selectedEmployeeId);
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');
  const [formData, setFormData] = useState<Employee | null>(null);

  useEffect(() => {
    if (existingEmp) {
      setFormData({ ...existingEmp });
      setActiveTab('info');
    } else if (selectedEmployeeId === 'NEW') {
      const nextNum = String(employees.length + 1).padStart(4, '0');
      const code = `NV${nextNum}`;
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
        joinDate: '10/10/2026',
        allowRemote: false,
        avatarColor: 'bg-blue-100 text-blue-700',
        baseSalary: 14000000,
        allowance: 1200000,
        dependents: 0,
        contracts: [],
        documents: [],
        tasks: [],
        notes: '',
      });
      setActiveTab('info');
    } else {
      setFormData(null);
    }
  }, [selectedEmployeeId, existingEmp, employees.length]);

  if (!selectedEmployeeId || !formData) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    saveEmployee(formData);
    setSelectedEmployeeId(null);
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
        {/* Modal Header (Matches 00:37 in video) */}
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

          {/* 5 Sub-tabs (Matches 00:37-00:40 in video) */}
          <div className="flex items-center gap-6 mt-4 -mb-4 border-b border-slate-100">
            {[
              { id: 'info', label: 'Thông tin' },
              { id: 'contracts', label: 'Hợp đồng' },
              { id: 'documents', label: 'Tài liệu' },
              { id: 'tasks', label: 'Nhận & trả việc' },
              { id: 'notes', label: 'Ghi chú' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as ProfileTab)}
                className={`pb-3 text-xs font-semibold border-b-2 transition ${
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
                    Họ tên
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
                    Ngày sinh
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
                    Phòng ban
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        department: e.target.value as DepartmentName,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600"
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
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        position: e.target.value as Employee['position'],
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600"
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
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as EmployeeStatus,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600"
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
                    Ngày vào
                  </label>
                  <input
                    type="text"
                    value={formData.joinDate}
                    onChange={(e) =>
                      setFormData({ ...formData, joinDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Lương cơ bản (VNĐ/tháng)
                  </label>
                  <input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        baseSalary: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Phụ cấp cố định (VNĐ/tháng)
                  </label>
                  <input
                    type="number"
                    value={formData.allowance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allowance: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowRemote}
                  onChange={(e) =>
                    setFormData({ ...formData, allowRemote: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 font-medium">
                  Cho phép làm việc từ xa
                </span>
              </label>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="space-y-3">
              {formData.contracts.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between"
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
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                    {c.status}
                  </span>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newContract = {
                    id: `HD-${Date.now()}`,
                    contractNumber: `PLHĐ/${formData.code}/2026`,
                    contractType: 'Hợp đồng không xác định thời hạn' as const,
                    startDate: '01/10/2026',
                    endDate: 'Không thời hạn',
                    baseSalary: formData.baseSalary || 16000000,
                    allowance: formData.allowance || 1500000,
                    dependents: formData.dependents,
                    status: 'Còn hiệu lực' as const,
                  };
                  setFormData({
                    ...formData,
                    contracts: [...formData.contracts, newContract],
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm phụ lục / hợp đồng mới</span>
              </button>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-3">
              {formData.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {doc.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {doc.category} · Tải lên {doc.uploadedAt} · {doc.fileSize}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-blue-600">Đã lưu trữ</span>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const nextDoc = {
                    id: `DOC-${Date.now()}`,
                    name: `SoYeuLyLich_${formData.code}.pdf`,
                    category: 'Khác' as const,
                    uploadedAt: '09/10/2026',
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
                <span>Tải lên tài liệu đính kèm</span>
              </button>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              {/* Action Buttons (Matches 00:39-00:42 in video) */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    generateChecklistTasks(formData.id, 'Nhận người mới');
                    const updated = employees.find((e) => e.id === formData.id);
                    if (updated) setFormData({ ...updated });
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo việc nhận người mới</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    generateChecklistTasks(formData.id, 'Tiễn người nghỉ');
                    const updated = employees.find((e) => e.id === formData.id);
                    if (updated) setFormData({ ...updated });
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo việc tiễn người nghỉ</span>
                </button>
              </div>

              {/* Checklist Box (Matches orange/slate bordered list in video 00:41) */}
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {(existingEmp?.tasks || formData.tasks).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleChecklistTask(formData.id, task.id)}
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
                ))}
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
          <div className="flex items-center justify-end gap-2.5 pt-5 mt-5 border-t border-slate-100">
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
        </form>
      </div>
    </div>
  );
};
