import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, User, FileText, Wallet, Settings } from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { matchesSearch } from '../utils/helpers';

interface SearchResultItem {
  id: string;
  category: 'NHÂN VIÊN' | 'ĐƠN TỪ' | 'BẢNG LƯƠNG' | 'CÀI ĐẶT & CHỨC NĂNG';
  title: string;
  subtitle: string;
  onSelect: () => void;
}

export const CommandPaletteModal: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    scopedEmployees,
    requests,
    payrollPeriods,
    setActiveTab,
    setSelectedEmployeeId,
  } = useHRM();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  const results = useMemo<SearchResultItem[]>(() => {
    if (query.trim().length < 2) return [];

    const items: SearchResultItem[] = [];

    // 1. Nhân viên
    scopedEmployees.forEach((emp) => {
      if (
        matchesSearch(emp.name, query) ||
        matchesSearch(emp.code, query) ||
        matchesSearch(emp.department, query) ||
        matchesSearch(emp.email, query)
      ) {
        items.push({
          id: `EMP-${emp.id}`,
          category: 'NHÂN VIÊN',
          title: emp.name,
          subtitle: `${emp.code} · ${emp.department} · ${emp.status}`,
          onSelect: () => {
            setActiveTab('employees');
            setSelectedEmployeeId(emp.id);
            setIsCommandPaletteOpen(false);
          },
        });
      }
    });

    // 2. Đơn từ
    requests.forEach((req) => {
      const emp = scopedEmployees.find((e) => e.id === req.employeeId);
      if (!emp) return;
      if (
        matchesSearch(emp.name, query) ||
        matchesSearch(req.type, query) ||
        matchesSearch(req.reason, query)
      ) {
        items.push({
          id: `REQ-${req.id}`,
          category: 'ĐƠN TỪ',
          title: `${req.type} · ${emp.name}`,
          subtitle: `${req.status} · ${req.startDate} · ${req.reason}`,
          onSelect: () => {
            setActiveTab('requests');
            setIsCommandPaletteOpen(false);
          },
        });
      }
    });

    // 3. Bảng lương
    payrollPeriods.forEach((pp) => {
      const matchEmp = scopedEmployees.find((e) => matchesSearch(e.name, query));
      if (
        matchesSearch(`Bảng lương kỳ ${pp.period}`, query) ||
        matchesSearch('bang luong', query) ||
        Boolean(matchEmp)
      ) {
        items.push({
          id: `PAY-${pp.period}`,
          category: 'BẢNG LƯƠNG',
          title: `Bảng lương kỳ ${pp.period}`,
          subtitle: `1 phiếu trong phạm vi của bạn`,
          onSelect: () => {
            setActiveTab('payroll');
            setIsCommandPaletteOpen(false);
          },
        });
      }
    });

    // 4. Chức năng / Cài đặt
    const quickPages: { label: string; sub: string; tab: Parameters<typeof setActiveTab>[0] }[] = [
      { label: 'Ca & lịch làm việc', sub: 'Xếp ca nhanh bằng bút vẽ ca', tab: 'shifts' },
      { label: 'Điểm danh hôm nay', sub: 'Xem ai chưa chấm công & gửi nhắc', tab: 'attendance' },
      { label: 'Cài đặt đi muộn & GPS', sub: 'Bậc phạt đi muộn, bán kính văn phòng', tab: 'settings' },
      { label: 'App Chấm Công Điện Thoại', sub: 'Chấm công GPS Leaflet & QR', tab: 'mobile_app' },
      { label: 'Báo cáo & Xuất Excel / PDF', sub: 'Biểu đồ chuyên cần & chi phí lương', tab: 'reports' },
    ];

    quickPages.forEach((page, idx) => {
      if (matchesSearch(page.label, query) || matchesSearch(page.sub, query)) {
        items.push({
          id: `PAGE-${idx}`,
          category: 'CÀI ĐẶT & CHỨC NĂNG',
          title: page.label,
          subtitle: page.sub,
          onSelect: () => {
            setActiveTab(page.tab);
            setIsCommandPaletteOpen(false);
          },
        });
      }
    });

    return items.slice(0, 12);
  }, [query, scopedEmployees, requests, payrollPeriods, setActiveTab, setSelectedEmployeeId, setIsCommandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  useEffect(() => {
    if (!isCommandPaletteOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          results.length > 0 ? (prev - 1 + results.length) % results.length : 0
        );
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        results[selectedIndex].onSelect();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCommandPaletteOpen, results, selectedIndex, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  // Group results by category while keeping flat index
  const categories = Array.from(new Set(results.map((r) => r.category)));

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-start justify-center pt-20 px-4"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header (Matches 01:07 in video) */}
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 border-blue-600 bg-white">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Gõ tên nhân viên, mã NV, đơn từ, bảng lương (không cần dấu)..."
              className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="max-h-96 overflow-y-auto px-4 py-3">
          {query.trim().length < 2 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500">
                Gõ ít nhất hai ký tự. Không cần dấu: gõ{' '}
                <button
                  onClick={() => setQuery('minh anh')}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  minh anh
                </button>{' '}
                hoặc{' '}
                <button
                  onClick={() => setQuery('hai an')}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  hai an
                </button>{' '}
                vẫn ra Nguyễn Minh Anh / Lê Hải An.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Không tìm thấy dữ liệu phù hợp với &ldquo;{query}&rdquo; trong phạm vi phân quyền của bạn.
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => {
                const catItems = results.filter((r) => r.category === cat);
                return (
                  <div key={cat}>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                      {cat}
                    </div>
                    <div className="space-y-1">
                      {catItems.map((item) => {
                        const flatIdx = results.findIndex((r) => r.id === item.id);
                        const isSelected = flatIdx === selectedIndex;
                        return (
                          <button
                            key={item.id}
                            onClick={item.onSelect}
                            onMouseEnter={() => setSelectedIndex(flatIdx)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition border ${
                              isSelected
                                ? 'bg-blue-50/70 border-blue-500 shadow-2xs'
                                : 'bg-white border-transparent hover:bg-slate-50'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                item.category === 'NHÂN VIÊN'
                                  ? 'bg-blue-100 text-blue-600'
                                  : item.category === 'ĐƠN TỪ'
                                  ? 'bg-amber-100 text-amber-600'
                                  : item.category === 'BẢNG LƯƠNG'
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.category === 'NHÂN VIÊN' ? (
                                <User className="w-4 h-4" />
                              ) : item.category === 'ĐƠN TỪ' ? (
                                <FileText className="w-4 h-4" />
                              ) : item.category === 'BẢNG LƯƠNG' ? (
                                <Wallet className="w-4 h-4" />
                              ) : (
                                <Settings className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-slate-900 truncate">
                                {item.title}
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                {item.subtitle}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer keyboard hints (Exact match to 01:07 in video) */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px]">
                ↑
              </kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px]">
                ↓
              </kbd>{' '}
              chọn
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px]">
                Enter
              </kbd>{' '}
              mở
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px]">
                Esc
              </kbd>{' '}
              đóng
            </span>
          </div>
          <span>Chỉ hiện dữ liệu bạn được phép xem</span>
        </div>
      </div>
    </div>
  );
};
