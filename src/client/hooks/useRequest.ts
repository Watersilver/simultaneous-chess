import { useCallback, useRef, useState } from "react";

type Res<T> = {
  status: "init"
} | {
  status: "ok",
  data: T;
} | {
  status: "loading",
} | {
  status: "error",
  error: unknown;
}

export default function useRequest<I, V extends Array<I>, T>(
  request: (...init: V) => Promise<T>
): [state: Res<T>, sendRequest: (...init: V) => void, clear: () => void] {
  const initialState: Res<T> = {status: "init"};
  const [state, setState] = useState<Res<T>>(initialState);

  /** Symbol description is info on why a request with a symbol mismatch failed */
  const currentReqId = useRef(Symbol("Initial invalid request"));

  const updateState = useCallback((...init: V) => {
    setState(initialState);
    const reqId = Symbol("Other request in progress");
    currentReqId.current = reqId;

    request(...init).then(r => {
      if (currentReqId.current !== reqId) {
        console.log('Async state outdated update ingnored:', currentReqId.current.description);
        return;
      }
      setState({status: 'ok', data: r});
    }).catch(e => {
      if (currentReqId.current !== reqId) {
        console.log('Async state outdated error ingnored:', currentReqId.current.description);
        return;
      }
      setState({status: 'error', error: e});
    });

    return () => currentReqId.current = Symbol("Component has unmounted");
  }, [request]);

  const clear = useCallback(() => setState(initialState), []);

  return [state, updateState, clear];
}