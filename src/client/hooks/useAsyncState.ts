import { useCallback, useEffect, useRef, useState } from "react";

type AsyncState<T> = {
  status: "ok",
  data: T;
  progress: 1;
  error: null;
} | {
  status: "loading",
  data: null;
  /** between 0 and 1 */
  progress: number;
  error: null;
} | {
  status: "error",
  data: null;
  progress: null;
  error: unknown;
}

export default function useAsyncState<T>(
  updater: (
    /** Progress should be between 0 and 1 */
    setProgress: (progress: number) => void
  ) => Promise<T>,
  settings?: {
    /** Default is true */
    updateOnMount?: boolean;
    /** default is [] */
    triggers?: [];
  },
): [state: AsyncState<T>, updateState: () => void] {
  const initialState: AsyncState<T> = {data: null, error: null, progress: 0, status: "loading"};
  const [state, setState] = useState<AsyncState<T>>(initialState);

  const firstRender = useRef(false);
  /** Symbol description is info on why a request with a symbol mismatch failed */
  const currentReqId = useRef(Symbol("Initial invalid request"));
  const updaterRef = useRef(updater);
  updaterRef.current = updater;

  const updateState = useCallback(() => {
    setState(initialState);
    const reqId = Symbol("Other request in progress");
    currentReqId.current = reqId;

    updaterRef.current(progress => setState(prev => {
      if (prev.status === "loading") {
        return {...prev, progress};
      }
      return prev;
    })).then(r => {
      if (currentReqId.current !== reqId) {
        console.log('Async state outdated update ingnored:', currentReqId.current.description);
        return;
      }
      setState({status: 'ok', progress: 1, data: r, error: null});
    }).catch(e => {
      if (currentReqId.current !== reqId) {
        console.log('Async state outdated error ingnored:', currentReqId.current.description);
        return;
      }
      setState({status: 'error', progress: null, data: null, error: e});
    });

    return () => currentReqId.current = Symbol("Component has unmounted");
  }, []);

  useEffect(() => {
    firstRender.current = true;
  }, []);

  useEffect(() => {
    if (!firstRender.current || settings?.updateOnMount !== false) {
      updateState();
    }
  }, settings?.triggers ?? []);

  useEffect(() => {
    firstRender.current = false;
  }, []);

  return [state, updateState];
}