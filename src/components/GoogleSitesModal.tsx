import React, { useState } from 'react';
import { Globe, Copy, Check, ExternalLink, Smartphone, Monitor, X } from 'lucide-react';

interface GoogleSitesModalProps {
  open: boolean;
  onClose: () => void;
}

const LIVE_WEB_URL = 'https://hienphuong99.github.io/ChamcongvaTinhluong/';
const LIVE_MOBILE_URL = 'https://hienphuong99.github.io/ChamcongvaTinhluong/?mode=mobile';

const WEB_EMBED_CODE = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #F8FAFC; }
  iframe { width: 100%; height: 100vh; min-height: 860px; border: none; display: block; }
</style>
</head>
<body>
  <iframe
    src="${LIVE_WEB_URL}"
    allow="geolocation *; camera *; microphone *; clipboard-write *"
    allowfullscreen
  ></iframe>
</body>
</html>`;

const MOBILE_EMBED_CODE = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #F8FAFC; }
  iframe { width: 100%; height: 100vh; min-height: 820px; border: none; display: block; }
</style>
</head>
<body>
  <iframe
    src="${LIVE_MOBILE_URL}"
    allow="geolocation *; camera *; microphone *; clipboard-write *"
    allowfullscreen
  ></iframe>
</body>
</html>`;

const CREATED_GOOGLE_SITE_EDITOR_URL =
  'https://sites.google.com/d/1Vk57WTh2Pm1IUUq0sv79AbA5WhTZr0BS/p/1EAFJGQZZriXfrKFyYxk-RGxmrJXhE3DQ/edit';

const SUGGESTED_SLUGS = [
  {
    slug: 'phuonghihi-chamcong',
    label: 'Trực quan, dễ nhớ nhất cho nhân viên chấm công',
    badge: 'Khuyên dùng #1',
  },
  {
    slug: 'phuonghihi-luong',
    label: 'Chuyên nghiệp chuẩn Hệ thống Chấm công & Tính lương',
    badge: 'Chuyên nghiệp',
  },
  {
    slug: 'phuonghihi-nhansu',
    label: 'Thuần Việt, thân thiện với toàn bộ nhân viên cửa hàng',
    badge: 'Dễ nhớ',
  },
  {
    slug: 'phuonghihi-noibo',
    label: 'Phù hợp làm Cổng thông tin nội bộ & Phiếu lương',
    badge: 'Nội bộ',
  },
  {
    slug: 'phuonghihi-work',
    label: 'Ngắn gọn, hiện đại (Workspace của phuonghihi)',
    badge: 'Hiện đại',
  },
  {
    slug: 'phuonghihi-staff',
    label: 'Phong cách chuỗi cửa hàng Apple / Retail quốc tế',
    badge: 'Retail',
  },
];

export const GoogleSitesModal: React.FC<GoogleSitesModalProps> = ({ open, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [embedTarget, setEmbedTarget] = useState<'web' | 'mobile'>('web');

  if (!open) return null;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const activeUrl = embedTarget === 'web' ? LIVE_WEB_URL : LIVE_MOBILE_URL;
  const activeCode = embedTarget === 'web' ? WEB_EMBED_CODE : MOBILE_EMBED_CODE;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Gắn phuonghihi (Chấm công &amp; Lương) lên Google Sites
              </h3>
              <p className="text-xs text-blue-100">
                Đồng bộ hệ sinh thái Cửa hàng phuonghihi (sites.google.com/view/phuonghihi)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto">
          {/* Custom URL Slug Suggestions Section */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-900 text-sm">
                ✨ Đổi đuôi link Google Sites đẹp như <code className="text-blue-700">sites.google.com/view/phuonghihi</code>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold shrink-0">
                Mẹo đổi đuôi URL
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Link có dạng <code className="text-slate-700">/d/1Vk57WTh.../edit</code> là <strong>link chỉnh sửa (Editor)</strong>. Khi bạn bấm nút <strong>Xuất bản (Publish)</strong> màu xanh ở góc phải trên cùng của Google Sites, ô <strong>Địa chỉ web (Web address)</strong> sẽ hiện ra để bạn đặt đuôi đẹp:
            </p>

            {/* Option A: Subpage right inside existing sites.google.com/view/phuonghihi */}
            <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Cách đồng bộ nhất
                  </span>
                  <span className="font-bold text-slate-900 font-mono text-xs">
                    sites.google.com/view/phuonghihi/cham-cong
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Mở trang <strong>phuonghihi</strong> hiện tại → tab <strong>Trang (Pages)</strong> → dấu <strong>+</strong> → <strong>Nhúng toàn trang</strong> → đặt tên trang là <code className="text-slate-700 font-semibold">Chấm công</code>
                </div>
              </div>
              <button
                onClick={() => handleCopy('subpage', 'cham-cong')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shrink-0 cursor-pointer"
              >
                {copiedKey === 'subpage' ? 'Đã chép!' : 'Chép đuôi'}
              </button>
            </div>

            {/* Option B: Standalone clean slugs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_SLUGS.map((item) => (
                <div
                  key={item.slug}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 hover:border-blue-300 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-blue-700 truncate">
                        ...view/{item.slug}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[9px] font-bold shrink-0">
                        {item.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{item.label}</div>
                  </div>
                  <button
                    onClick={() => handleCopy(item.slug, item.slug)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-semibold text-[11px] shrink-0 transition cursor-pointer"
                  >
                    {copiedKey === item.slug ? 'Đã chép' : 'Chép tên'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Switcher: Web Admin vs Mobile App */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEmbedTarget('web')}
              className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                embedTarget === 'web'
                  ? 'bg-blue-50/80 border-blue-600 text-blue-950'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Monitor className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <div className="font-bold text-sm">Bản Web Quản trị &amp; Portal</div>
                <div className="text-[11px] text-slate-500">
                  Đầy đủ 14 phân hệ Xếp ca, Điểm danh, Lương 5 bước
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setEmbedTarget('mobile')}
              className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                embedTarget === 'mobile'
                  ? 'bg-blue-50/80 border-blue-600 text-blue-950'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Smartphone className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <div className="font-bold text-sm">Bản App Chấm Công Điện Thoại</div>
                <div className="text-[11px] text-slate-500">
                  Mở thẳng màn hình Chấm công GPS Leaflet &amp; Mã QR
                </div>
              </div>
            </button>
          </div>

          {/* Option 1: Embed by URL */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                Cách 1: Nhúng nguyên trang bằng Đường dẫn (Theo URL)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Nhanh nhất
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={activeUrl}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs text-blue-700"
              />
              <button
                onClick={() => handleCopy('url', activeUrl)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shrink-0 cursor-pointer"
              >
                {copiedKey === 'url' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã sao chép URL</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option 2: Embed by HTML Code */}
          <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                Cách 2: Nhúng bằng Mã HTML (Bật sẵn quyền Định vị GPS &amp; Camera)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                Khuyên dùng cho GPS
              </span>
            </div>
            <div className="relative">
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-28">
                {activeCode}
              </pre>
              <button
                onClick={() => handleCopy('code', activeCode)}
                className="mt-2 w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedKey === 'code' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Đã sao chép Mã nhúng HTML!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép Mã nhúng HTML (Đầy đủ quyền GPS &amp; Camera)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <a
                href={CREATED_GOOGLE_SITE_EDITOR_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Mở trang Google Sites đã nhúng sẵn &amp; Đổi đuôi URL</span>
              </a>
              <a
                href="https://sites.google.com/view/phuonghihi"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold transition"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>sites.google.com/view/phuonghihi</span>
              </a>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

