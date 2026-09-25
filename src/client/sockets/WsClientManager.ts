type Settings<IncomingMsg extends string | Blob, ParsedMsg, OutgoingMsg> = {
  deserialise: (msg: IncomingMsg) => Promise<ParsedMsg> | ParsedMsg;
  serialise: (msg: OutgoingMsg) => Promise<string> | string;
};

export default class WsClientManager<IncomingMsg extends string | Blob, ParsedMsg, OutgoingMsg> {
  private socket: WebSocket;
  private settings: Settings<IncomingMsg, ParsedMsg, OutgoingMsg>;
  constructor(
    socketCreator: () => WebSocket,
    settings: Settings<IncomingMsg, ParsedMsg, OutgoingMsg>
  ) {
    this.socket = socketCreator();
    this.settings = settings;
  }

  private preSendMiddleware: ((msg: OutgoingMsg) => void)[] = [];
  addPreSendMiddleware(mw: (msg: OutgoingMsg) => void) {
    this.preSendMiddleware.push(mw);
    return () => this.removePreSendMiddleware(mw);
  }
  removePreSendMiddleware(mw: (msg: OutgoingMsg) => void) {
    const i = this.preSendMiddleware.indexOf(mw);
    if (i !== -1) {
      this.removePreSendMiddleware(mw);
    }
  }

  async send(msg: OutgoingMsg) {
    for (const psm of this.preSendMiddleware) {
      psm(msg);
    }
    const parsed = await this.settings.serialise(msg);
    this.socket.send(parsed);
  }

  private listeners: {
    open: (((event?: any) => void) & {id: Function})[];
    close: (((event?: any) => void) & {id: Function})[];
    error: (((event?: any) => void) & {id: Function})[];
    message: (((event?: any) => void) & {id: Function})[];
  } = {
    open: [], close: [], error: [], message: []
  };

  addEventListener(type: "open", handler: () => void): void;
  addEventListener(type: "close", handler: (event: CloseEvent) => void): void;
  addEventListener(type: "error", handler: () => void): void;
  addEventListener(type: "message", handler: (msg: ParsedMsg) => void): void;
  addEventListener(type: "open" | "close" | "error" | "message", handler: any) {
    this.listeners[type].push(handler);
    switch (type) {
      case 'open':
        const oh: (() => void) & {id?: Function} = () => handler();
        oh.id = handler;
        this.socket.addEventListener(type, oh);
        return () => this.removeEventListener(type, handler);
      case 'close':
        this.socket.addEventListener(type, handler);
        return () => this.removeEventListener(type, handler);
      case 'error':
        const eh: (() => void) & {id?: Function} = () => handler();
        eh.id = handler;
        this.socket.addEventListener(type, eh);
        return () => this.removeEventListener(type, handler);
      case 'message':
        const mh: ((e: any) => any) & {id?: Function} = async (event: MessageEvent) => handler(await this.settings.deserialise(event.data));
        mh.id = handler;
        this.socket.addEventListener(type, mh);
        return () => this.removeEventListener(type, handler);
    }
  }

  removeEventListener(type: "open", handler: () => void): void;
  removeEventListener(type: "close", handler: (event: CloseEvent) => void): void;
  removeEventListener(type: "error", handler: () => void): void;
  removeEventListener(type: "message", handler: (msg: ParsedMsg) => void): void;
  removeEventListener(type: "open" | "close" | "error" | "message", handler: (event?: any) => void) {
    const i = this.listeners[type].findIndex(h => h === handler || h.id === handler);
    if (i !== -1) {
      const [h] = this.listeners[type].splice(i);
      if (h) {
        this.socket.removeEventListener(type, h);
      }
    }
  }
}