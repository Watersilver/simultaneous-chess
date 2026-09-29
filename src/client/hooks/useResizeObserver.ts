import { useEffect, useState } from "react";

export default function useResizeObserver(el: HTMLElement | null): [w: number, h: number] {
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver((es) => {
      const size = {h: 0, w: 0};
      es.forEach(e => {
        if (e.borderBoxSize[0]) {
          size.h = Math.max(e.borderBoxSize[0].blockSize, size.h);
          size.w = Math.max(e.borderBoxSize[0].inlineSize, size.w);
        }
      });
      setW(size.w);
      setH(size.h);
    });
    ro.observe(el);

    return () => ro.unobserve(el);
  }, [el]);
  return [w, h];
}