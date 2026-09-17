// TODO: I need env vars for frontend
console.log(import.meta.env.VITE_SOME_KEY)

// Create WebSocket connection.
const clientSocket =
window.location.protocol.startsWith('https')
? new WebSocket("wss://" + window.location.hostname + "/ws")
: new WebSocket("ws://" + window.location.hostname + ":8080/ws");

// Connection opened
clientSocket.addEventListener("open", (event) => {
  clientSocket.send("Hello Server!");
});

// Listen for messages
clientSocket.addEventListener("message", (event) => {
  console.log("Message from server ", event.data);
});

// Connection closed
clientSocket.addEventListener('close', event => {
  console.log("Closing connection: ", event.reason);
});

// Connection error
// clientSocket.addEventListener('error', event => {
//   console.log("Websocket error");
// });

export default clientSocket