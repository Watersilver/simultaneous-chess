import { WebSocketServer } from 'ws';
import server from '../server.js';
import WsRoomServerManager from './WsRoomServerManager.js';
import { ClientMsgSchema, ServerMsg } from '../../both/protocol.js';


const wsServer = new WsRoomServerManager(() => {
  return new WebSocketServer({
    server,
    path: "/" + process.env.VITE_WS_PATH
  })
}, {
  serialise: (msg: ServerMsg) => JSON.stringify(msg),
  deserialise: msg => ClientMsgSchema.parse(JSON.parse(msg.data.toString('utf8'))),
  messageHandler: (msg, _sm) => {
    console.log(msg);
  }
});

wsServer.addConnectionEventListener((ws) => {
  wsServer.send(ws, {type: 'ass'});
});

// const wsServer = new WebSocketServer({
//   server,
//   path: "/" + process.env.VITE_WS_PATH
// });

// type WsState = {
//   awaitingPong?: boolean;
// }
// const WsToState = new WeakMap<any, WsState>();

// // Emitted when the handshake is complete.
// // `request` is the http GET request sent by the client.
// // Useful for parsing authority headers, cookie headers, and other information.
// wsServer.on('connection', (ws, req) => {
//   console.log("Websocket server `connection`");
//   console.log("ip: ", req.socket.remoteAddress);
//   WsToState.set(
//     ws,
//     {}
//   );

//   // Emitted when the connection is established.
//   ws.on('open', () => {
//     ws.send('Hi from server!');
//   });

//   // Emitted when the connection is closed.
//   // `code` is a numeric value indicating the status code explaining why the connection has been closed.
//   // `reason` is a Buffer containing a human-readable string explaining why the connection has been closed.
//   ws.on('close', (code, reason) => {
//     console.log('Socket: ' + req.socket.remoteAddress + " disconnected.");
//     console.log('code: ' + code, ' | reason: ' + reason.toString('utf8'));
//     WsToState.delete(ws);
//   });

//   // Emitted when an error occurs. Errors may have a .code property,
//   // matching one of the string values defined below under Error codes.
//   // https://github.com/websockets/ws/blob/master/doc/ws.md#error-codes.
//   ws.on('error', e => {
//     console.error(e);
//     ws.close();
//   });

//   // Emitted when a ping is received.
//   ws.on('ping', _data => {
//     ws.pong();
//   });

//   // Emitted when a pong is received.
//   ws.on('pong', _data => {
//     console.log('got pongd')
//   });

//   // Emitted before a redirect is followed.
//   // `url` is the redirect URL.
//   // `request` is the HTTP GET request with the headers queued.
//   // This event gives the ability to inspect confidential headers and remove them on a
//   // per-redirect basis using the `request.getHeader()` and `request.removeHeader()` API.
//   // The `request` object should be used only for this purpose.
//   // When there is at least one listener for this event, no header is removed by default,
//   // even if the redirect is to a different domain.
//   // ws.on('redirect', (url, req) => {});

//   // Emitted when the server response is not the expected one, for example a 401 response.
//   // This event gives the ability to read the response in order to extract useful information.
//   // If the server sends an invalid response and there isn't a listener for this event,
//   // an error is emitted.
//   // ws.on('unexpected-response', (req, res) => {})

//   // Emitted when response headers are received from the server as part of the handshake.
//   // This allows you to read headers from the server, for example 'set-cookie' headers.
//   // ws.on('upgrade', res => {})

//   // Emitted when a message is received.
//   // `data` is the message content.
//   // `isBinary` specifies whether the message is binary or not.
//   ws.on('message', (data, isBinary) => {
//     console.log('received message: ', data.toString('utf8'), ' | ', "isBinary " + isBinary);
//     ws.send('message received. Fuck off.');
//   });
// });

// // Emitted when the server closes.
// // This event depends on the `'close'` event of HTTP server only when it is created internally.
// // In all other cases, the event is emitted independently.
// wsServer.on('close', () => {
//   console.log("Websocket server `close`");
// });

// // Emitted when the underlying server has been bound.
// wsServer.on('listening', () => {
//   console.log("Websocket server `listening`");
// });

// // Emitted when an error occurs on the underlying server
// wsServer.on('error', (e) => {
//   console.log("Websocket server `error`", e);
// });

// // Emitted before the response headers are written to the socket as part of the handshake.
// // This allows you to inspect/modify the headers before they are sent.
// // wsServer.on('headers', (headers, _req) => {
// //   console.log("Websocket server `headers`", headers.join(', '));
// // });

// // Emitted when an error occurs before the WebSocket connection is established.
// // `socket` and `request` are respectively the socket and the HTTP request from which the error originated.
// // The listener of this event is responsible for closing the socket.
// // When the `'wsClientError'` event is emitted there is no `http.ServerResponse` object,
// // so any HTTP response, including the response headers and body, must be written directly to the `socket`.
// // If there is no listener for this event, the socket is closed with a default 4xx response containing a descriptive error message.
// // wsServer.on('wsClientError', (error, _socket, _request) => {
// //   console.log("Websocket server `wsClientError`", error);
// // });

export default wsServer