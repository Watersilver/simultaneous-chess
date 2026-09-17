import { ResRoomSchema } from "../../both/ResRoom";
import { BASE_URL } from "../constants";

export default async function requestRoom(name: string) {
  if (name === "") throw Error("Empty room name");
  const res = await fetch(BASE_URL + `/rooms/${name}`);
  if (!res.ok) throw Error(res.status + " Error. " + res.statusText);
  const json = await res.json();
  const final = ResRoomSchema.parse(json);
  return final;
}