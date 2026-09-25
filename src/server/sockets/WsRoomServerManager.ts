import WebSocket, { Server } from "ws";
import { IncomingMessage } from "node:http";
import { ReadonlyDeep } from "../../both/ReadonlyDeep.js";

type ServerOptions = WebSocket.ServerOptions<typeof WebSocket, typeof IncomingMessage>
type WsConstructor<WS extends typeof WebSocket, IM extends typeof IncomingMessage, S extends Server<WS, IM>> = (options?: ServerOptions, callback?: () => void) => S

type BufferLike =
  | string
  | Buffer
  | DataView
  | number
  | ArrayBufferView
  | Uint8Array
  | ArrayBuffer
  | SharedArrayBuffer
  | Blob
  | readonly any[]
  | readonly number[]
  | { valueOf(): ArrayBuffer }
  | { valueOf(): SharedArrayBuffer }
  | { valueOf(): Uint8Array }
  | { valueOf(): readonly number[] }
  | { valueOf(): string }
  | { [Symbol.toPrimitive](hint: string): string };

type ServerSettings<ServerMsg, ClientMsg> = {
  /** Value is ms. Default is `30000` */
  heartbeatDelay?: number;
  /**
   * Whether to start the server upon creating the object.
   * Default is `true`
   */
  startOnInstantiation?: boolean;
  /**
   * Takes client message and parses it to something useful for the user.
   * Default is to stay unparsed
   */
  deserialise?: (raw: {data: WebSocket.RawData, isBinary: boolean}) => ClientMsg
  /**
   * Function that handles client messages
   * @param msg parsed message
   * @returns void, or action that should be taken by server
   */
  messageHandler?: (msg: ClientMsg, ws: WebSocket, sm: WsRoomServerManager<ServerMsg, any, any, any>) =>
  | {type: "join_room", name: string}
  | void;
  /**
   * If not provided, String() is used for outgoing message serialisation
   */
  serialise?: (msg: ServerMsg) => BufferLike;
}

type SocketState = {
  room?: string;
  awaitingPong?: boolean;
  id: number;
};

/**
 * Sets up hartbeat and basic rooms
 */
export default class WsRoomServerManager<
  OutgoingMessage,
  ClientMsg,
  WS extends typeof WebSocket = typeof WebSocket,
  IM extends typeof IncomingMessage = typeof IncomingMessage,
  S extends Server<WS, IM> = Server<WS, IM>
> {
  private ServerCreator: WsConstructor<WS, IM, S>;
  private server?: S;
  private wsToState = new WeakMap<InstanceType<WS>, {
    room?: string;
    awaitingPong?: boolean;
    id: number;
  }>();
  private hearbeatInterval?: NodeJS.Timeout;
  private settings?: ServerSettings<OutgoingMessage, ClientMsg>;
  private rooms: {[room: string]: WebSocket[]} = {};
  private nextId = 1;
  private ids: number[] = [];

  private clean(ws: InstanceType<WS>) {
    for (const l of this.cleanListeners) {
      l(ws);
    }
    const s = this.wsToState.get(ws);
    if (s) {
      const i = this.ids.indexOf(s.id);
      if (i !== -1) {
        this.ids.splice(i, 1);
      }
    }
    this.leaveRoom(ws);
    this.wsToState.delete(ws);
  }

  constructor(
    ServerCreator: WsConstructor<WS, IM, S>,
    settings?: ServerSettings<OutgoingMessage, ClientMsg>
  ) {
    this.ServerCreator = ServerCreator;
    this.settings = settings;

    if (settings?.startOnInstantiation !== false) {
      this.start();
    }
  }

  private connectionHandlers: ((ws: InstanceType<WS>, req: InstanceType<IM>) => void)[] = [];
  addConnectionEventListener(handler: (ws: InstanceType<WS>, req: InstanceType<IM>) => void) {
    this.connectionHandlers.push(handler);
    return () => this.removeConnectionEventListener(handler);
  }
  removeConnectionEventListener(handler: (ws: InstanceType<WS>, req: InstanceType<IM>) => void) {
    const i = this.connectionHandlers.indexOf(handler);
    if (i !== -1) {this.connectionHandlers.splice(i, 1);}
  }

  private cleanListeners: ((ws: InstanceType<WS>) => void)[] = [];
  addCleanEventListener(handler: (ws: InstanceType<WS>) => void) {
    this.cleanListeners.push(handler);
    return () => this.removeCleanEventListener(handler);
  }
  removeCleanEventListener(handler: (ws: InstanceType<WS>) => void) {
    const i = this.cleanListeners.indexOf(handler);
    if (i !== -1) {this.cleanListeners.splice(i, 1);}
  }

  start() {
    if (this.server) {
      throw Error("Server is already running");
    }
    this.server = this.ServerCreator();
    // Emitted when the handshake is complete.
    // `request` is the http GET request sent by the client.
    // Useful for parsing authority headers, cookie headers, and other information.
    this.server.on('connection', (ws, req) => {
      // console.log("Websocket server `connection`");
      // console.log("ip: ", req.socket.remoteAddress);
      this.wsToState.set(
        ws,
        {
          id: this.nextId
        }
      );
      this.ids.push(this.nextId);
      this.nextId++;
      for (const ch of this.connectionHandlers) {
        ch(ws, req);
      }

      // Emitted when the connection is established.
      // (Doesn't always trigger for some reason)
      // ws.on('open', () => {
      //   ws.send('Hi from server!');
      // });

      // Emitted when the connection is closed.
      // `code` is a numeric value indicating the status code explaining why the connection has been closed.
      // `reason` is a Buffer containing a human-readable string explaining why the connection has been closed.
      ws.on('close', (_code, _reason) => {
        this.clean(ws);
      });

      // Emitted when an error occurs. Errors may have a .code property,
      // matching one of the string values defined below under Error codes.
      // https://github.com/websockets/ws/blob/master/doc/ws.md#error-codes.
      ws.on('error', e => {
        // console.error(e);
        ws.close();
      });

      // Emitted when a ping is received.
      ws.on('ping', _data => {
        ws.pong();
      });

      // Emitted when a pong is received.
      ws.on('pong', _data => {
        const s = this.wsToState.get(ws);
        if (s) {
          delete s.awaitingPong;
        }
      });

      // Emitted before a redirect is followed.
      // `url` is the redirect URL.
      // `request` is the HTTP GET request with the headers queued.
      // This event gives the ability to inspect confidential headers and remove them on a
      // per-redirect basis using the `request.getHeader()` and `request.removeHeader()` API.
      // The `request` object should be used only for this purpose.
      // When there is at least one listener for this event, no header is removed by default,
      // even if the redirect is to a different domain.
      // ws.on('redirect', (url, req) => {});

      // Emitted when the server response is not the expected one, for example a 401 response.
      // This event gives the ability to read the response in order to extract useful information.
      // If the server sends an invalid response and there isn't a listener for this event,
      // an error is emitted.
      // ws.on('unexpected-response', (req, res) => {})

      // Emitted when response headers are received from the server as part of the handshake.
      // This allows you to read headers from the server, for example 'set-cookie' headers.
      // ws.on('upgrade', res => {})

      // Emitted when a message is received.
      // `data` is the message content.
      // `isBinary` specifies whether the message is binary or not.
      ws.on('message', (data, isBinary) => {
        const raw = {data, isBinary};
        if (this.settings?.messageHandler) {
          if (this.settings.deserialise) {
            const parsed = this.settings.deserialise(raw);
            const result = this.settings.messageHandler(parsed, ws, this);
            if (result) {
              switch (result.type) {
                case "join_room":
                  this.joinRoom(result.name, ws);
              }
            }
          }
        }
      });
    });

    // Emitted when the server closes.
    // This event depends on the `'close'` event of HTTP server only when it is created internally.
    // In all other cases, the event is emitted independently.
    // this.server.on('close', () => {
    //   console.log("Websocket server `close`");
    // });

    // Emitted when the underlying server has been bound.
    // this.server.on('listening', () => {
    //   console.log("Websocket server `listening`");
    // });

    // Emitted when an error occurs on the underlying server
    this.server.on('error', (e) => {
      console.log("Websocket server `error`", e);
    });

    // Emitted before the response headers are written to the socket as part of the handshake.
    // This allows you to inspect/modify the headers before they are sent.
    // this.server.on('headers', (headers, _req) => {
    //   console.log("Websocket server `headers`", headers.join(', '));
    // });

    // Emitted when an error occurs before the WebSocket connection is established.
    // `socket` and `request` are respectively the socket and the HTTP request from which the error originated.
    // The listener of this event is responsible for closing the socket.
    // When the `'wsClientError'` event is emitted there is no `http.ServerResponse` object,
    // so any HTTP response, including the response headers and body, must be written directly to the `socket`.
    // If there is no listener for this event, the socket is closed with a default 4xx response containing a descriptive error message.
    // this.server.on('wsClientError', (error, _socket, _request) => {
    //   console.log("Websocket server `wsClientError`", error);
    // });

    const interval = setInterval(() => {
      if (!this.server) {
        clearInterval(interval);
        return;
      }

      for (const ws of this.server.clients) {
        const s = this.wsToState.get(ws);
        if (!s) {
          // If ws has no state for some reason, terminate it and notify logs
          console.warn("Stateless WebSocket terminated")
          ws.terminate();
          this.clean(ws);
        } else if (s.awaitingPong) {
          // If ws did not respond in time terminate to avoid zombie connections
          ws.terminate();
          this.clean(ws);
        } else {
          // Socket survived, so ping again
          s.awaitingPong = true;
          ws.ping();
        }
      }
    }, this.getHearbeatDelay());
    this.hearbeatInterval = interval;
  }

  stop() {
    if (!this.server) {
      throw Error("Server is already stopped");
    }

    this.server.close();
    clearInterval(this.hearbeatInterval);
    this.server = undefined;
  }

  restart() {
    if (this.server) this.stop();
    this.start();
  }

  getHearbeatDelay() {
    return this.settings?.heartbeatDelay || 30000;
  }

  // Returns underlying ws server
  getServer() {
    return this.server;
  }

  joinRoom(name: string, ws: InstanceType<WS>) {
    this.leaveRoom(ws);
    const state = this.wsToState.get(ws);
    if (state) {
      state.room = name;
    }
    if (!this.rooms[name]) {
      this.rooms[name] = [];
    }
    this.rooms[name].push(ws);
  }

  leaveRoom(ws: InstanceType<WS>) {
    const res = this.wsToState.get(ws);
    if (res) {
      if (res.room !== undefined) {
        const rs = this.rooms[res.room];
        if (rs) {
          const i = rs.indexOf(ws);
          if (i !== -1) {
            rs.splice(i, 1);
            if (rs.length === 0) {
              delete this.rooms[res.room];
            }
          }
        }
        delete res.room;
      }
    }
  }

  getSocketState(ws: InstanceType<WS>): ReadonlyDeep<SocketState> | null {
    return this.wsToState.get(ws) ?? null;
  }

  getSocketsInRoom(room: string) {
    return this.rooms[room];
  }

  /**
   * Sends unparsed message that gets parsed internally by provided serialiser
   * @param recipient The socket or sockets to receive the message.
   * `getSocketsInRoom` to send to all connections in a room.
   */
  send(
    recipient: InstanceType<WS> | InstanceType<WS>[] | undefined,
    msg: OutgoingMessage,
    cb?: (err?: Error) => void
  ) {
    if (!recipient) return;
    const serialised = this.settings?.serialise ? this.settings.serialise(msg) : String(msg);
    if (!Array.isArray(recipient)) {
      recipient = [recipient];
    }
    for (const r of recipient) {
      r.send(serialised, cb);
    }
  }
}
