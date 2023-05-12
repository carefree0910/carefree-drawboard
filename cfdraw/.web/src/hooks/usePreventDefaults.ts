import { useEffect } from "react";

function preventDefaultWheel(e: WheelEvent) {
  if (e.ctrlKey) {
    if (e.deltaY !== 0) {
      e.preventDefault();
      return false;
    }
  }
}
function preventPopstate(e: PopStateEvent) {
  e.preventDefault();
  window.history.forward();
}

export function usePreventDefaults() {
  useEffect(() => {
    window.addEventListener("wheel", preventDefaultWheel, { passive: false });
    window.addEventListener("popstate", preventPopstate);
    return () => {
      window.removeEventListener("wheel", preventDefaultWheel);
      window.removeEventListener("popstate", preventPopstate);
    };
  }, []);
}
