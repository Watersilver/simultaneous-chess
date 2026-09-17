import express from "express";

const app = express();

app.use('/public', express.static('public'));

app.get("/hello", (_, res) => {
  res.send("Hello Vite + React + TypeScript!");
});

app.get("/rooms/:name", (req, res) => {
  res.json("create");
});

export default app