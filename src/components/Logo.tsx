export function LogoMark({ className = "h-8 w-8", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="35" y="2" width="30" height="30" rx="9" fill={color} />
      <rect x="35" y="68" width="30" height="30" rx="9" fill={color} />
      <rect x="2" y="35" width="30" height="30" rx="9" fill={color} />
      <rect x="68" y="35" width="30" height="30" rx="9" fill={color} />
      <circle cx="50" cy="50" r="15" fill={color} />
    </svg>
  );
}

export function Logo({
  className = "",
  markClassName = "h-8 w-8",
  markColor = "currentColor",
  wordmarkClassName = "text-lg",
}: {
  className?: string;
  markClassName?: string;
  markColor?: string;
  wordmarkClassName?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} color={markColor} />
      <span className={`font-heading leading-none ${wordmarkClassName}`}>
        Diabolo <span className="font-normal opacity-80">One</span>
      </span>
    </div>
  );
}
