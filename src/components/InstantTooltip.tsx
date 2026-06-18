import React from "react";

interface InstantTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export default function InstantTooltip({ content, children, position = "top" }: InstantTooltipProps) {
  const posClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-800 border-l-transparent border-r-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-800 border-l-transparent border-r-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-800 border-t-transparent border-b-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-800 border-t-transparent border-b-transparent border-l-transparent",
  };

  return (
    <div className="relative inline-block group">
      {children}
      <div 
        className={`absolute ${posClasses[position]} bg-slate-800 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-md whitespace-nowrap z-[100] pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-100`}
      >
        {content}
        <div className={`absolute border-4 ${arrowClasses[position]} -ml-1`} />
      </div>
    </div>
  );
}
