import { useEffect, useRef, useState } from 'react';
import { categoryDetails } from '../data/categoryDetails';

export default function CategoryHeaderCell({ category, width, boxClass }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const detail = categoryDetails[category];

  const positionTooltip = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = Math.min(256, Math.floor(window.innerWidth * 0.8));
    const minLeft = 8;
    const maxLeft = Math.max(minLeft, window.innerWidth - tooltipWidth - 8);
    const centeredLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    const clampedLeft = Math.min(maxLeft, Math.max(minLeft, centeredLeft));

    setTooltipStyle({
      top: rect.bottom + 8,
      left: clampedLeft
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    positionTooltip();
    window.addEventListener('resize', positionTooltip);
    window.addEventListener('scroll', positionTooltip, true);

    return () => {
      window.removeEventListener('resize', positionTooltip);
      window.removeEventListener('scroll', positionTooltip, true);
    };
  }, [isOpen]);

  return (
    <div
      className={`relative ${width} h-14 shrink-0`}
      onMouseEnter={() => {
        positionTooltip();
        setIsOpen(true);
      }}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`w-full h-full flex items-center justify-center text-gray-200 p-2 text-xs ${boxClass}`}
        onClick={() => {
          positionTooltip();
          setIsOpen((prev) => !prev);
        }}
        onBlur={() => setIsOpen(false)}
      >
        <span className="whitespace-normal break-words text-center leading-tight">{category}</span>
      </button>

      {isOpen && detail && (
        <div
          className="fixed w-64 max-w-[80vw] z-40 rounded-md border border-gray-500 bg-gray-900 text-gray-100 p-3 shadow-lg text-left whitespace-normal break-words"
          style={tooltipStyle}
        >
          <p className="font-semibold text-sm whitespace-normal break-words">{detail.title}</p>
          <p className="text-xs mt-1 leading-relaxed text-gray-200 whitespace-normal break-words">{detail.description}</p>
        </div>
      )}
    </div>
  );
}
