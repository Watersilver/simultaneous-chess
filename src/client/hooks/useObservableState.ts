import { useCallback, useEffect, useRef, useState } from "react";
import type ObservableState from "../utils/ObservableState";

export default function useObservableState<T>(state: ObservableState<T>): [
  state: T,
  setState: (stateUpdater: (prev: T) => T) => void
] {
  const [data, setData] = useState(state.get());

  const syncEnabled = useRef(true);

  const sync = useCallback((newState: T): void => {
    if (!syncEnabled.current) return;

    setData(newState);
  }, []);

  useEffect(() => {
    const unsub = state.subscribe(sync);

    return () => unsub();
  }, [sync]);

  const setSyncData: (state: (prev: T) => T) => void = useCallback((s) => {
    setData(prev => {
      const val = s(prev);
      syncEnabled.current = false;
      state.set(val);
      syncEnabled.current = true;
      return val;
    });
  }, [sync]);

  return [data, setSyncData];
}