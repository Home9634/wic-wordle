import { useEffect, useRef, useState } from 'react';

export default function Tooltip({ title, description, children, compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [style, setStyle] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const position = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const minLeft = 8;
    const maxLeft = Math.max(minLeft, window.innerWidth - 8);
    const centerX = Math.min(maxLeft, Math.max(minLeft, rect.left + rect.width / 2));
    setStyle({ top: rect.bottom + 8, left: centerX });
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
      {children ? (
        <span
          ref={triggerRef}
          onMouseEnter={() => { position(); setIsOpen(true); }}
          onMouseLeave={() => setIsOpen(false)}
          onClick={() => { position(); setIsOpen((s) => !s); }}
          aria-label={title}
          className="inline-block"
        >
          {children}
        </span>
      ) : (
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
      )}

      {isOpen && (
        <div
          className={`fixed z-40 ${compact ? 'max-w-[220px]' : 'max-w-[90vw]'} -translate-x-1/2 rounded-md border border-white/10 bg-black/90 p-2 text-left text-white shadow-lg`}
          style={style}
        >
          <div className="font-semibold text-sm leading-none">{title}</div>
          {description ? <div className="mt-1 text-xs text-white/80">{description}</div> : null}
        </div>
      )}
    </span>
  );
}
