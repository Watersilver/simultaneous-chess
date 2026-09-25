import { ZodError } from "zod";
import { CreateRoomRequest, CreateRoomSuccessSchema, ReqErrorSchema } from "../../both/protocol.js";
import { BASE_URL } from "../constants.js";

export default async function requestCreateRoom(name: string, hidden?: boolean) {
  if (name === "") throw Error("Empty room name");
  const body: CreateRoomRequest = {
    name, private: !!hidden
  };
  const res = await fetch(BASE_URL + `/rooms/create`, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw Error(res.status + " Error. " + res.statusText);
  const json = await res.json();
  try {
    const final = CreateRoomSuccessSchema.parse(json);
    return final;
  } catch (e) {
    if (e instanceof ZodError) {
      const error = ReqErrorSchema.parse(json);
      return error;
    } else {
      throw e;
    }
  }
}