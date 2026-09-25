import { ZodError } from "zod";
import { ReqErrorSchema, RoomsListResponseSchema } from "../../both/protocol";
import { BASE_URL } from "../constants";

export default async function requestRoomsList() {
  const res = await fetch(BASE_URL + `/rooms`);
  if (!res.ok) throw Error(res.status + " Error. " + res.statusText);
  const json = await res.json();
  try {
    const final = RoomsListResponseSchema.parse(json);
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