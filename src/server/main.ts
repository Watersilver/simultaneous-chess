import express from "express";
import ViteExpress from "vite-express";

import "./dotenvconfig.js"

import "./sockets/wsServer.js";

const app = express();

app.use('/public', express.static('public'));

app.get("/hello", (_, res) => {
  res.send("Hello Vite + React + TypeScript!");
});

app.get("/rooms/:name", (req, res) => {
  res.json("create");
});

ViteExpress.listen(app, 3000, () => {
    console.log("Server is listening on port 3000...");
  },
);
