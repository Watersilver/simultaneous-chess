import app from "./app.js";
import ViteExpress from "vite-express";

const server = ViteExpress.listen(app, Number(process.env.PORT), () => {
    console.log("Server is listening on port " + process.env.PORT + "...");
  },
);

export default server;