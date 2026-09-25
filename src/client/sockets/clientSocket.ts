import { ClientMsg, ServerMsgSchema } from "../../both/protocol";
import store from "../store";
import WsClientManager from "./WsClientManager";

// Create WebSocket connection.
const clientSocket = new WsClientManager(() => new WebSocket(import.meta.env.VITE_WS_URL + "/" + import.meta.env.VITE_WS_PATH), {
  serialise: (msg: ClientMsg) => JSON.stringify(msg),
  deserialise: async msg => ServerMsgSchema.parse(JSON.parse(msg instanceof Blob ? await msg.text() : msg))
});

clientSocket.addEventListener('message', msg => {
  switch (msg.type) {
    case 'join-room-success':
      store.socketConnData.set({
        connectedToRoom: msg.roomName,
        colour: msg.colour ?? null
      });
      break;
    case 'leave-room-response':
      store.state.set({
        id: 'Lobby'
      });
      store.socketConnData.set({
        connectedToRoom: '',
        colour: null
      });
      break;
    case 'request-play-success':
      break;
    case 'join-room-fail':
      store.roomJoinError.set(msg.reason);
      break;
    case 'request-play-fail':
      store.roomJoinError.set(msg.reason);
      break;
  }
});

clientSocket.addEventListener('open', async () => {
  store.state.set({id: 'Lobby'});
});

// // Connection opened
// clientSocket.addEventListener("open", (_event) => {
//   store.state.set({id: 'Lobby'});
// });

// // // Listen for messages
// clientSocket.addEventListener("message", (event) => {
//   console.log("Message from server ", event.data);
// });

// // Connection closed
// clientSocket.addEventListener('close', event => {
//   console.log("Closing connection: ", event.reason);
// });

// // Connection error
// clientSocket.addEventListener('error', _event => {
//   console.log("Websocket error");
// });

export default clientSocket