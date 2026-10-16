import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, QrCode, Copy, Check, Terminal, X } from 'lucide-react';

interface ExpoGoModalProps {
  open: boolean;
  onClose: () => void;
}

export const ExpoGoModal: React.FC<ExpoGoModalProps> = ({ open, onClose }) => {
  const [expoUrl, setExpoUrl] = useState('exp://192.168.0.23:8081');
  const [qrMode, setQrMode] = useState<'expo' | 'pwa'>('expo');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const pwaMobileUrl = 'https://hienphuong99.github.io/ChamcongvaTinhluong/?mode=mobile';
  const activeQrTarget = qrMode === 'expo' ? expoUrl : pwaMobileUrl;

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(activeQrTarget, {
      width: 260,
      margin: 2,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [open, activeQrTarget]);

  if (!open) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Chạy App trên Điện thoại (Expo Go &amp; Mobile QR)
              </h3>
              <p className="text-xs text-slate-300">
                Quét mã bằng ứng dụng Expo Go (iOS / Android) hoặc Camera điện thoại
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

        <div className="p-6 space-y-4 text-xs">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setQrMode('expo')}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                qrMode === 'expo'
                  ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>Mã QR Expo Go (Native)</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-normal">
                Mở trong app Expo Go (thư mục <code>mobile-expo</code>)
              </div>
            </button>

            <button
              type="button"
              onClick={() => setQrMode('pwa')}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                qrMode === 'pwa'
                  ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Mã QR Web App (PWA)</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-normal">
                Quét bằng Camera mở ngay không cần cài Expo
              </div>
            </button>
          </div>

          {/* QR Code Box */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt="Expo Go QR Code"
                className="w-52 h-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs"
              />
            )}
            <div className="mt-3 w-full flex items-center gap-2">
              <input
                type="text"
                value={activeQrTarget}
                onChange={(e) => {
                  if (qrMode === 'expo') setExpoUrl(e.target.value);
                }}
                readOnly={qrMode === 'pwa'}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs text-slate-800"
                placeholder="exp://192.168.1.x:8081"
              />
              <button
                onClick={() => handleCopy(activeQrTarget)}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
          </div>

          {/* Terminal Command Info */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lệnh khởi chạy máy chủ Expo Go trong dự án:</span>
            </div>
            <code className="block font-mono text-xs text-emerald-300">
              cd mobile-expo &amp;&amp; npx expo start --tunnel
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
