import { useState } from "react";
import { X, Check } from "lucide-react";
import { CERT_DATA } from "@/shared/constants";

const CUSTOM_CERT_FILTER = "기타";

type CertFilterModalProps = {
  certCategoryFilter: string;
  certFilter: string;
  onApply: (category: string, cert: string) => void;
  onClose: () => void;
};

export default function CertFilterModal({
  certCategoryFilter,
  certFilter,
  onApply,
  onClose,
}: CertFilterModalProps) {
  const [selectedCat, setSelectedCat] = useState(certCategoryFilter || Object.keys(CERT_DATA)[0]);
  const [selectedCert, setSelectedCert] = useState(certFilter || "");
  const [customInput, setCustomInput] = useState(certFilter || "");

  const isCustom = selectedCat === CUSTOM_CERT_FILTER;
  const certs = CERT_DATA[selectedCat] || [];

  const handleSelectCat = (cat: string) => {
    setSelectedCat(cat);
    setSelectedCert("");
    setCustomInput("");
  };

  const handleApply = () => {
    onApply(selectedCat, isCustom ? customInput : selectedCert);
    onClose();
  };

  const handleClear = () => {
    setSelectedCert("");
    setCustomInput("");
  };

  const displaySelected = isCustom ? customInput : selectedCert;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-xl">

        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <span className="font-bold text-slate-900">자격증 선택</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex h-80">
          {/* 카테고리 */}
          <div className="w-32 shrink-0 overflow-y-auto border-r border-slate-100 py-2">
            {Object.keys(CERT_DATA).map((cat) => (
              <button
                key={cat}
                onClick={() => handleSelectCat(cat)}
                className={`w-full border-l-2 px-3 py-2 text-left text-xs font-medium transition ${
                  selectedCat === cat
                    ? "border-hp-600 bg-slate-50 font-bold text-hp-700"
                    : "border-transparent text-slate-500 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 자격증 목록 */}
          <div className="flex-1 overflow-y-auto p-2">
            {isCustom ? (
              <div className="p-2">
                <p className="mb-2 text-xs text-slate-400">자격증명을 직접 입력해주세요</p>
                <input
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="예: 한국사능력검정시험"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-hp-500"
                  autoFocus
                />
              </div>
            ) : certs.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                자격증 없음
              </div>
            ) : (
              <div className="space-y-0.5">
                {certs.map((cert) => (
                  <button
                    key={cert}
                    onClick={() => setSelectedCert(selectedCert === cert ? "" : cert)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                      selectedCert === cert
                        ? "bg-hp-50 text-hp-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {cert}
                    {selectedCert === cert && <Check size={13} className="shrink-0 text-hp-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 하단 */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <span className="text-xs text-slate-400">
            {displaySelected ? `선택됨: ${displaySelected}` : "선택 안 됨"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
            >
              초기화
            </button>
            <button
              onClick={handleApply}
              className="rounded-full bg-hp-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-hp-700"
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}