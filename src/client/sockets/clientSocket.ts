// Create WebSocket connection.
const clientSocket = new WebSocket(import.meta.env.VITE_WS_URL + "/" + import.meta.env.VITE_WS_PATH);

// Connection opened
clientSocket.addEventListener("open", (_event) => {
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
clientSocket.addEventListener('error', event => {
  console.log("Websocket error");
});

export default clientSocket