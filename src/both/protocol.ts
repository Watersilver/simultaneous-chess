import * as z from "zod"

export const ServerMsgSchema = z.union([
  z.object({
    type: z.literal('ass')
  })
]);

export type ServerMsg = z.infer<typeof ServerMsgSchema>;

export const ClientMsgSchema = z.union([
  z.object({
    type: z.literal('request-rooms')
  })
]);

export type ClientMsg = z.infer<typeof ClientMsgSchema>;