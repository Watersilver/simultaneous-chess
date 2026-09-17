import React from "react";
import ReactDOM from "react-dom/client";

import "./sockets/clientSocket";

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/spotlight/styles.css';
// import '@mantine/modals/styles.css';

import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
