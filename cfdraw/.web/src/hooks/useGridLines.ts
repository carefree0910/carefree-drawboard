import { useEffect } from "react";

import {
  injectEventCallback,
  removeEventCallback,
  useBoardContainerWH,
  useGlobalTransform,
  useIsReady,
} from "@carefree0910/business";
import { Coordinate, GlobalEvent, GlobalEvents } from "@carefree0910/core";

import { gridlinesStore } from "@/stores/gridLines";

const gridLinesCanvasId = "gridLinesLayer";
const gridLineEventTypes = [GlobalEvents.MOVE, GlobalEvents.SCALE, GlobalEvents.TRANSFORM];
function getMod(x: number, y: number): number {
  let mod = x % y;
  if (mod < 0) mod += y;
  return mod;
}
function checkIsMultiple(x: number, y: number, eps: number = 1): boolean {
  const mod = getMod(x, y);
  return mod < eps || mod > y - eps;
}

export function useGridLines(): void {
  const isReady = useIsReady();

  useEffect(() => {
    async function updateGridLines(): Promise<void> {
      if (!isReady) return;
      const mainLayer = document.getElementById("mainLayer") as HTMLDivElement;
      if (!mainLayer) return;
      let gridLinesCanvas = document.getElementById(gridLinesCanvasId) as HTMLCanvasElement;
      if (!gridLinesCanvas) {
        gridLinesCanvas = document.createElement("canvas");
        gridLinesCanvas.setAttribute("id", gridLinesCanvasId);
        gridLinesCanvas.style.position = "absolute";
        mainLayer.insertBefore(gridLinesCanvas, mainLayer.firstChild!);
      }
      const ctx = gridLinesCanvas.getContext("2d");
      if (!ctx) return;

      if (!gridlinesStore.enable) {
        ctx.clearRect(0, 0, gridLinesCanvas.width, gridLinesCanvas.height);
        return;
      }

      const { globalScale, globalTransform } = useGlobalTransform();
      const { lineWidth, lineColor, maxOpacity, maxGridSize, span, startSubGridsFraction } =
        gridlinesStore;

      const log2Scale = Math.log2(globalScale);
      const modBase = Math.log2(span);
      const mod = getMod(log2Scale + Math.log2(0.5) + modBase, modBase);
      const fraction = Math.pow(2, mod) / span;
      const gridSize = maxGridSize * fraction;

      const { w, h } = useBoardContainerWH();
      gridLinesCanvas.width = w;
      gridLinesCanvas.height = h;

      const originalStart = new Coordinate(-0.25 * maxGridSize, -0.25 * maxGridSize);
      const { x: xStart, y: yStart } = globalTransform.applyTo(originalStart);
      const xNewStart = getMod(xStart, gridSize);
      const yNewStart = getMod(yStart, gridSize);

      const opacity = fraction * maxOpacity;
      const subGridFractionRatio = fraction / startSubGridsFraction;
      const enableSubGrids = subGridFractionRatio <= 1;
      const subGridOpacity = enableSubGrids ? opacity * subGridFractionRatio : opacity;
      ctx.beginPath();
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = `rgba(${lineColor},${subGridOpacity})`;
      for (let x = xNewStart; x <= w + gridSize; x += gridSize) {
        if (enableSubGrids && checkIsMultiple(x - xStart, gridSize * span)) continue;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = yNewStart; y <= h + gridSize; y += gridSize) {
        if (enableSubGrids && checkIsMultiple(y - yStart, gridSize * span)) continue;
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
      if (enableSubGrids) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${lineColor},${maxOpacity})`;
        for (let x = xNewStart; x <= w + gridSize; x += gridSize) {
          if (!checkIsMultiple(x - xStart, gridSize * span)) continue;
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
        }
        for (let y = yNewStart; y <= h + gridSize; y += gridSize) {
          if (!checkIsMultiple(y - yStart, gridSize * span)) continue;
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
        }
        ctx.stroke();
      }
    }

    updateGridLines();
    window.addEventListener("resize", updateGridLines);
    gridLineEventTypes.forEach((triggerType) => {
      injectEventCallback(triggerType, {
        key: gridLinesCanvasId,
        event: GlobalEvent,
        fn: updateGridLines,
      });
    });
    return () => {
      window.removeEventListener("resize", updateGridLines);
      gridLineEventTypes.forEach((triggerType) => {
        removeEventCallback(triggerType, gridLinesCanvasId);
      });
    };
  }, [isReady]);
}
