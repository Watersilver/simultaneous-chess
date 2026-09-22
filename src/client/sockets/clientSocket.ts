import { ClientMsg, ServerMsgSchema } from "../../both/protocol";
import store from "../store";
import WsCientManager from "./WsCientManager";

// Create WebSocket connection.
const clientSocket = new WsCientManager(() => new WebSocket(import.meta.env.VITE_WS_URL + "/" + import.meta.env.VITE_WS_PATH), {
  serialise: (msg: ClientMsg) => JSON.stringify(msg),
  deserialise: async msg => ServerMsgSchema.parse(JSON.parse(msg instanceof Blob ? await msg.text() : msg))
});

clientSocket.addEventListener('message', msg => {
  console.log(msg);
});

clientSocket.addEventListener('open', () => {
  clientSocket.send({type: 'request-rooms'});
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