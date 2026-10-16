import React, { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { useHRM } from '../context/HRMContext';
import { exportToCSV, matchesSearch } from '../utils/helpers';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useHRM();

  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [actorFilter, setActorFilter] = useState('ALL');
  const [showAll, setShowAll] = useState(false);

  const uniqueActions = useMemo(
    () => Array.from(new Set(auditLogs.map((l) => l.action))),
    [auditLogs]
  );

  const uniqueActors = useMemo(
    () => Array.from(new Set(auditLogs.map((l) => l.actor))),
    [auditLogs]
  );

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (actorFilter !== 'ALL' && log.actor !== actorFilter) return false;
      if (
        query.trim() &&
        !matchesSearch(log.action, query) &&
        !matchesSearch(log.actor, query) &&
        !matchesSearch(log.targetType, query) &&
        !matchesSearch(log.targetDetail, query) &&
        !matchesSearch(log.timestamp, query)
      ) {
        return false;
      }
      return true;
    });
  }, [auditLogs, actionFilter, actorFilter, query]);

  const displayedLogs = showAll ? filteredLogs : filteredLogs.slice(0, 30);

  const handleExportCSV = () => {
    exportToCSV(
      'NhatKyHeThong_phuonghihi.csv',
      filteredLogs.map((l) => ({
        'Thời gian': l.timestamp,
        'Người thực hiện': l.actor,
        'Thao tác': l.action,
        'Loại đối tượng': l.targetType,
        'Chi tiết': l.targetDetail,
      }))
    );
  };

  return (
    <div className="p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header (Exact match to 01:03 - 01:05 in video) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            PHUONGHIHI / HỆ THỐNG
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Nhật ký hệ thống
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi thay đổi do người thực hiện theo thời gian thực.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Xuất CSV</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm thao tác, người thực hiện, đối tượng, thời gian..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-700"
            >
              <option value="ALL">Thao tác</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>

            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-700"
            >
              <option value="ALL">Người thực hiện</option>
              {uniqueActors.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-5 py-2 bg-slate-50/60 border-b border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Hiển thị <strong>{displayedLogs.length}</strong> /{' '}
            <strong>{filteredLogs.length}</strong> thao tác (Tổng lưu trữ:{' '}
            {auditLogs.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/40">
                <th className="py-3.5 px-5">Thời gian</th>
                <th className="py-3.5 px-4">Người thực hiện</th>
                <th className="py-3.5 px-4">Thao tác</th>
                <th className="py-3.5 px-5">Đối tượng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-5 font-mono text-slate-500">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {log.actor}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-slate-800">
                      {log.targetType}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {log.targetDetail}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length > 30 && (
          <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Đang hiển thị {displayedLogs.length} / {filteredLogs.length} bản ghi nhật ký
            </span>
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold transition cursor-pointer"
            >
              {showAll
                ? 'Thu gọn (30 bản ghi mới nhất)'
                : `Xem toàn bộ ${filteredLogs.length} bản ghi`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

