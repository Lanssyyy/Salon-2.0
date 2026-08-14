import { useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 70;

// Native-style swipe-down-to-refresh gesture. Wrap a scrollable list view with it
// and pass an onRefresh callback (e.g. invalidate relevant query keys).
export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pulling = useRef(false);
  const startY = useRef(0);
  const containerRef = useRef(null);

  const onTouchStart = (e) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0 && !refreshing) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  };

  const onTouchMove = (e) => {
    if (!pulling.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta, 120));
    }
  };

  const onTouchEnd = async () => {
    if (pulling.current && pullDistance > THRESHOLD) {
      setRefreshing(true);
      await onRefresh?.();
      setRefreshing(false);
    }
    pulling.current = false;
    setPullDistance(0);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height]"
        style={{ height: refreshing ? 40 : pullDistance * 0.5 }}
      >
        <RefreshCw
          className={`w-5 h-5 text-stone-400 ${refreshing ? "animate-spin" : ""}`}
          style={{ transform: refreshing ? "none" : `rotate(${pullDistance * 2}deg)` }}
        />
      </div>
      {children}
    </div>
  );
}