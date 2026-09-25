import { useEffect } from "react";
import WsClientManager from "../sockets/WsClientManager";

export default function useMessageListener<
  IncomingMsg extends string | Blob, ParsedMsg, OutgoingMsg
>(
  wsClient: WsClientManager<IncomingMsg, ParsedMsg, OutgoingMsg>,
  settings: {
    onPreSend?: (msg: OutgoingMsg) => void;
    onMessage?: (msg: ParsedMsg) => void;
    /** Default is [] */
    triggers?: [];
  }
) {
  useEffect(() => {
    const onPreSend = settings.onPreSend;
    if (onPreSend) wsClient.addPreSendMiddleware(onPreSend);

    const onMsg = settings.onMessage;
    if (onMsg) wsClient.addEventListener('message', onMsg);

    return () => {
      if (onPreSend) wsClient.removePreSendMiddleware(onPreSend);
      if (onMsg) wsClient.removeEventListener('message', onMsg);
    }
  }, settings.triggers ?? []);
}