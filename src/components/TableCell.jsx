
import { useState } from 'react';

export default function TableCell({
  width,
  content,
  boxClass,
  iconSrc,
  iconAlt = '',
  iconSize = 'h-6 w-6',
  truncateContent = true,
}) {
  const [failedIconSrc, setFailedIconSrc] = useState(null);

  return (
    <div className={`flex ${width} shrink-0 text-gray-200 ${iconSrc ? `text-xs` : 'text-sm'} p-2 justify-center items-center ${boxClass}`}>
      {iconSrc && failedIconSrc !== iconSrc ? (
        <div className="flex w-full items-center justify-start gap-2 min-w-0">
          <div className="shrink-0 flex items-center justify-center">
            <img
              src={iconSrc}
              alt={iconAlt}
              className={`${iconSize} object-contain shrink-0`}
              onError={() => setFailedIconSrc(iconSrc)}
            />
          </div>
          <span className={truncateContent ? 'truncate' : 'whitespace-normal wrap-break-word leading-tight'}>{content}</span>
        </div>
      ) : (
        content
      )}
    </div>
  )
}