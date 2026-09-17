// Create WebSocket connection.
const clientSocket = new WebSocket("ws://" + window.location.hostname + ":8080");

// Connection opened
clientSocket.addEventListener("open", (event) => {
  clientSocket.send("Hello Server!");
});

// Listen for messages
clientSocket.addEventListener("message", (event) => {
  console.log("Message from server ", event.data);
});

export default clientSocket