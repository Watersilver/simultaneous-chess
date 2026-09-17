import * as z from "zod"; 

export const ResRoomSchema = z.union([
  z.literal("create"),
  z.literal("join")
]);

export type ResRoom = z.infer<typeof ResRoomSchema>;