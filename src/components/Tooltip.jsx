import { useEffect, useRef, useState } from 'react';

export default function Tooltip({ title, description, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [style, setStyle] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const position = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = Math.min(320, Math.floor(window.innerWidth * 0.8));
    const minLeft = 8;
    const maxLeft = Math.max(minLeft, window.innerWidth - tooltipWidth - 8);
    const centeredLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    const left = Math.min(maxLeft, Math.max(minLeft, centeredLeft));
    setStyle({ top: rect.bottom + 8, left });
  };

  useEffect(() => {
    if (!isOpen) return;
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [isOpen]);

  return (
    <span className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/6 text-xs text-white/80 hover:bg-white/10"
        onMouseEnter={() => { position(); setIsOpen(true); }}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => { position(); setIsOpen((s) => !s); }}
        aria-label={title}
      >
        i
      </button>

      {isOpen && (
        <div
          className="fixed z-40 w-80 max-w-[90vw] rounded-md border border-white/10 bg-black/90 text-white p-3 text-left shadow-lg"
          style={style}
        >
          <div className="font-semibold text-sm">{title}</div>
          <div className="text-xs mt-1 text-white/80">{description}</div>
        </div>
      )}
    </span>
  );
}
