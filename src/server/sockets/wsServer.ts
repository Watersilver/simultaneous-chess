import WebSocket, { WebSocketServer } from 'ws';
import server from '../server.js';
import WsRoomServerManager from './WsRoomServerManager.js';
import { ClientMsgSchema, ServerMsg } from '../../both/protocol.js';
import DataAccess from '../DataAccess.js';
import Game from '../../both/Game.js';


// healpers
const leaveRoom = (ws: WebSocket, sm: WsRoomServerManager<any, any, any>) => {
  // console.log('leaving room')
  const state = sm.getSocketState(ws);
  if (state !== null && state.room !== undefined) {
    // console.log('socket room found')
    const room = DataAccess.getRoom(state.room);
    if (room) {
      let plStChanged = false;
      // console.log('room data found', room)
      if (room.blackId === state.id) {
        plStChanged = true;
        DataAccess.setRoomProps(state.room, ['blackId', undefined]);
        // console.log('removed black id ', DataAccess.getRoom(state.room));
      };
      if (room.whiteId === state.id) {
        plStChanged = true;
        DataAccess.setRoomProps(state.room, ['whiteId', undefined]);
        // console.log('removed white id ', DataAccess.getRoom(state.room));
      }
      DataAccess.setRoomProps(state.room, ['people', room.people - 1]);
      // console.log('removed one person ', DataAccess.getRoom(state.room));
      if (plStChanged) {
        sm.send(sm.getSocketsInRoom(room.name)?.filter(w => w !== ws), {
          type: 'players-status',
          w: DataAccess.getRoom(state.room)?.whiteId !== undefined,
          b: DataAccess.getRoom(state.room)?.blackId !== undefined
        });
      }
    }
  }
  sm.leaveRoom(ws);
  // console.log('Left room as socket')
}


const games: {[roomName: string]: Game} = {}

const wsServer = new WsRoomServerManager(() => {
  return new WebSocketServer({
    server,
    path: "/" + process.env.VITE_WS_PATH
  })
}, {
  serialise: (msg: ServerMsg) => JSON.stringify(msg),
  deserialise: msg => ClientMsgSchema.parse(JSON.parse(msg.data.toString('utf8'))),
  onRoomCreated: name => games[name] = new Game(),
  onRoomDeleted: name => delete games[name],
  messageHandler: (msg, ws, sm) => {
    switch (msg.type) {
      case 'queue-move': {
        const s = sm.getSocketState(ws);
        if (s?.room) {
          const room = DataAccess.getRoom(s.room);
          let player: 'w' | 'b' | null = null;
          if (room?.whiteId === s.id) {
            player = 'w';
          } else if (room?.blackId === s.id) {
            player = 'b';
          } else {
            // Respond that request wasn't made by player
            sm.send(ws, {
              type: 'queue-move-error',
              reason: 'Not a player'
            });
            break;
          }
          const game = games[s.room];
          if (game) {
            if (game.isGameOver()) {
              sm.send(ws, {
                type: 'queue-move-error',
                reason: 'Game over'
              });
            } else if (msg.lastTurnId !== game.getLastTurnId()) {
              // Respond that request was out of sync
              sm.send(ws, {
                type: 'queue-move-error',
                reason: 'outdated'
              });
            } else {
              const move = {f: msg.from, t: msg.to};
              if (!game.isMoveLegal(move, player)) {
                // Respond that requested move was illegal
                sm.send(ws, {
                  type: 'queue-move-error',
                  reason: 'illegal move'
                });
              } else {
                game.queueMove(move, player);
                if (game.areBothPlayersMovesCommited()) {
                  game.resolveQueuedMoves();
                  const lastTurn = game.turns.at(-1);
                  if (lastTurn) {
                    // Broadcast to all in room the new position
                    sm.send(sm.getSocketsInRoom(s.room), {
                      type: 'new-turn',
                      turn: lastTurn
                    });
                  } else {
                    console.warn("There is no turn after queued move resolution, for some reason.");
                  }
                }
                // else {
                //   // Let client know that we are waiting for opponent to commit
                // } // ...or not. who cares?
              }
            }
          }
        } else {
          sm.send(ws, {
            type: 'queue-move-error',
            reason: 'Not in room'
          });
        }
      }
      break;
      case 'request-game-state': {
        const s = sm.getSocketState(ws);
        if (s?.room) {
          const game = games[s.room];
          if (game) {
            sm.send(ws, {
              type: 'game-state',
              pos: game.pos,
              turns: game.turns
            });
          }
        } else {
          sm.send(ws, {
            type: 'game-state-req-error',
            reason: 'Not in room'
          });
        }
      }
      break;
      case 'request-sync': {
        const s = sm.getSocketState(ws);
        if (s?.room) {
          const game = games[s.room];
          if (game) {
            if (
              game.turns.some(t => t.id === msg.lastTurnId)
              && (!msg.missingIds || msg.missingIds.every(id => game.turns.some(t => t.id == id)))
            ) {
              const turns = game.turns.filter(t => {
                if (t.id > msg.lastTurnId) return true;
                return msg.missingIds?.some(id => t.id === id);
              });
              sm.send(ws, {
                type: 'sync',
                turns
              });
            } else {
              sm.send(ws, {
                type: 'sync-error',
                reason: 'Invalid id'
              });
            }
          }
        } else {
          sm.send(ws, {
            type: 'sync-error',
            reason: 'Not in room'
          });
        }
      }
      break;
      case 'request-players-status': {
        const s = sm.getSocketState(ws);
        if (s?.room) {
          const room = DataAccess.getRoom(s.room);
          if (room) {
            sm.send(ws, {
              type: 'players-status',
              w: (room.whiteId !== undefined) || undefined,
              b: (room.blackId !== undefined) || undefined
            });
          } else {
            sm.send(ws, {
              type: 'players-status-fail',
              reason: 'Not in room'
            });
          }
        }
        break;
      }
      case 'request-play': {
        const wsData = sm.getSocketState(ws);
        if (wsData?.room) {
          const room = DataAccess.getRoom(wsData.room);
          if (room) {
            let colour: 'black' | 'white' | undefined;
            switch (msg.colour) {
              case 'black':
                if (room.blackId === undefined) {
                  colour = 'black';
                  DataAccess.setRoomProps(room.name, ['blackId', wsData.id]);
                  // console.log('added black', DataAccess.getRoom(msg.name));
                } else if (room.whiteId === undefined) {
                  colour = 'white';
                  DataAccess.setRoomProps(room.name, ['whiteId', wsData.id]);
                  // console.log('added white', DataAccess.getRoom(msg.name));
                }
                break;
              case 'white':
                if (room.whiteId === undefined) {
                  colour = 'white';
                  DataAccess.setRoomProps(room.name, ['whiteId', wsData.id]);
                  // console.log('added white', DataAccess.getRoom(msg.name));
                } else if (room.blackId === undefined) {
                  colour = 'black';
                  DataAccess.setRoomProps(room.name, ['blackId', wsData.id]);
                  // console.log('added black', DataAccess.getRoom(msg.name));
                }
                break;
            }
            if (colour) {
              sm.send(ws, {
                type: 'request-play-success',
                colour
              });
              // Inform room spectators that a player has joined
              sm.send(sm.getSocketsInRoom(room.name)?.filter(w => w !== ws), {
                type: 'players-status',
                w: (room.whiteId !== undefined) || undefined,
                b: (room.blackId !== undefined) || undefined
              });
            } else {
              sm.send(ws, {
                type: 'request-play-fail',
                reason: 'No room for another player'
              });
            }
          }
        }
      }
      break;
      case 'join-room': {
        // console.log('joining room');
        leaveRoom(ws, sm);
        // console.log('left prev room');
        const room = DataAccess.getRoom(msg.name);
        const wsData = sm.getSocketState(ws);
        if (room && wsData) {
          // console.log('room data and socket data found', room);
          DataAccess.setRoomProps(room.name, ['people', room.people + 1]);
          // console.log('Added a person', DataAccess.getRoom(msg.name));
          let colour: 'black' | 'white' | undefined;
          if (msg.colour) {
            // console.log('requesting colour: ' + msg.colour);
            switch (msg.colour) {
              case 'black':
                if (room.blackId === undefined) {
                  colour = 'black';
                  DataAccess.setRoomProps(room.name, ['blackId', wsData.id]);
                  // console.log('added black', DataAccess.getRoom(msg.name));
                } else if (room.whiteId === undefined) {
                  colour = 'white';
                  DataAccess.setRoomProps(room.name, ['whiteId', wsData.id]);
                  // console.log('added white', DataAccess.getRoom(msg.name));
                }
                break;
              case 'white':
                if (room.whiteId === undefined) {
                  colour = 'white';
                  DataAccess.setRoomProps(room.name, ['whiteId', wsData.id]);
                  // console.log('added white', DataAccess.getRoom(msg.name));
                } else if (room.blackId === undefined) {
                  colour = 'black';
                  DataAccess.setRoomProps(room.name, ['blackId', wsData.id]);
                  // console.log('added black', DataAccess.getRoom(msg.name));
                }
                break;
            }
          }
          sm.joinRoom(room.name, ws);
          // console.log('joined room as socket');
          sm.send(ws, {
            type: 'join-room-success',
            roomName: room.name,
            colour
          });
          // Inform room spectators that a player has joined
          if (colour !== undefined) {
            sm.send(sm.getSocketsInRoom(room.name)?.filter(w => w !== ws), {
              type: 'players-status',
              w: (room.whiteId !== undefined || colour === 'white') || undefined,
              b: (room.blackId !== undefined || colour === 'black') || undefined
            });
          }
        } else {
          sm.send(ws, {
            type: 'join-room-fail',
            roomName: msg.name,
            reason: 'Room doesn\'t exist'
          });
        }
      }
      break;
      case 'leave-room':
        const s = sm.getSocketState(ws);
        leaveRoom(ws, sm);
        sm.send(ws, {
          type: 'leave-room-response',
          roomName: s?.room
        });
      break;
    }
  }
});

// wsServer.addConnectionEventListener((ws) => {
// });

wsServer.addCleanEventListener(ws => {
  leaveRoom(ws, wsServer);
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