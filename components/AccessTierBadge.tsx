"use client";

import { GaugeIcon } from "lucide-react"; // Using Lucide icon as a placeholder for the custom gauge if not available
import Link from "next/link";
import { useIframeData } from "@/contexts/IframeDataContext";
import { cn } from "@/lib/utils";

export function AccessTierBadge({ className }: { className?: string }) {
  const { accessTier, isAuthenticated } = useIframeData();

  const getAccessTierDisplay = () => {
    if (!isAuthenticated) {
      return "WALLET NOT CONNECTED";
    }
    return accessTier || "BASIC";
  };

  const getTierTextColor = () => {
    if (!isAuthenticated) {
      return "text-[#ff6b6b]"; // Red for not connected
    }
    return "text-white"; // White for connected
  };

  return (
    <div className={cn("flex w-full items-center justify-between", className)}>
      <div className="flex shrink-0 items-center">
        <p className="font-['Trispace',sans-serif] text-[#777] text-[10px] uppercase tracking-wide">
          VITA-TERMINAL v1.2.5
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center justify-center gap-1 rounded-md border border-[#404040] px-2 py-1 text-[10px] uppercase">
          <span className="text-[#aeaeae]">YOUR ACCESS TIER:</span>
          <span className={getTierTextColor()}>{getAccessTierDisplay()}</span>
        </div>
        <Link
          className="flex cursor-pointer items-center justify-center gap-1 rounded-md border border-[#796812] bg-transparent px-2 py-1 transition-colors hover:bg-[#796812]/20"
          href="https://www.vitadao.com/terminal/upgrade"
          target="_top"
        >
          <span className="font-bold text-[#ffdd35] text-[10px] uppercase">
            UPGRADE
          </span>
          <GaugeIcon className="text-[#ffdd35]" size={12} />
        </Link>
      </div>
    </div>
  );
}
