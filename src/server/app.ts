import express from "express";
import { CreateRoomRequestSchema, CreateRoomSuccess, ReqError, RoomsListResponse } from "../both/protocol.js";
import { ZodError } from "zod";
import DataAccess from "./DataAccess.js";

const app = express();

app.use('/public', express.static('public'));

app.use(express.json());

app.get("/hello", (_, res) => {
  res.send("Hello Vite + React + TypeScript!");
});

app.get("/rooms", (_, res) => {
  const jsonRes: RoomsListResponse = DataAccess.getRooms().map(r => {
    let players = r.blackId !== undefined ? 1 : 0;
    players += r.whiteId !== undefined ? 1 : 0;
    return {name: r.name, viewers: r.people - players, players};
  });
  res.json(jsonRes);
});

app.post("/rooms/create", (req, res) => {
  try {
    const json = CreateRoomRequestSchema.parse(req.body);
    const result = DataAccess.createRoom({...json});
    if (result === 'exists') {
      const errRes: ReqError = {
        type: 'create room',
        message: 'Room already exists'
      }
      res.json(errRes);
    } else if (result === 'success') {
      const resJson: CreateRoomSuccess = {name: json.name}
      res.json(resJson);
    } else {
      const errRes: ReqError = {
        type: 'create room',
        message: 'unknown error'
      }
      res.json(errRes);
    }
  } catch (err) {
    if (err instanceof ZodError) {
      const errRes: ReqError = {
        type: 'malformed json',
        issues: err.issues.map(i => ({path: i.path.join('.'), message: i.message}))
      };
      res.json(errRes);
    }
  }
});

export default app