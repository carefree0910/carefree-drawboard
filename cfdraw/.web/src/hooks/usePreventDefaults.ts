import { useEffect } from "react";

function preventDefaultWheel(e: WheelEvent) {
  if (e.ctrlKey) {
    if (e.deltaY !== 0) {
      e.preventDefault();
      return false;
    }
  }
}

export function usePreventDefaults() {
  useEffect(() => {
    window.addEventListener("wheel", preventDefaultWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", preventDefaultWheel);
    };
  }, []);
}
