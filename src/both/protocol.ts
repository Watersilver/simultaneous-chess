import * as z from "zod"
import { ChessPositionSchema, SquareCoordinatesSchema, TurnSchema } from "./Notation.js";

export const ServerMsgSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('join-room-fail'),
    roomName: z.string(),
    reason: z.enum(["Room doesn't exist", 'Dunno'])
  }),
  z.object({
    type: z.literal('join-room-success'),
    roomName: z.string(),
    colour: z.optional(z.enum(['black', 'white']))
  }),
  z.object({
    type: z.literal('players-status'),
    /** Whether white player exists */
    w: z.optional(z.boolean()),
    /** Whether black player exists */
    b: z.optional(z.boolean())
  }),
  z.object({
    type: z.literal('players-status-fail'),
    reason: z.enum(['Not in room', 'Dunno'])
  }),
  z.object({
    type: z.literal('leave-room-response'),
    /** `undefined` if there was no room to leave */
    roomName: z.optional(z.string())
  }),
  z.object({
    type: z.literal('request-play-success'),
    colour: z.enum(['black', 'white'])
  }),
  z.object({
    type: z.literal('request-play-fail'),
    reason: z.enum(["No room for another player", 'Dunno'])
  }),
  z.object({
    type: z.literal('queue-move-error'),
    reason: z.enum(['Not a player', 'Not in room', 'outdated', 'illegal move', 'Game over'])
  }),
  z.object({
    type: z.literal('new-turn'),
    turn: TurnSchema
  }),
  z.object({
    type: z.literal('game-state'),
    pos: ChessPositionSchema,
    turns: z.array(TurnSchema)
  }),
  z.object({
    type: z.literal('sync'),
    turns: z.array(TurnSchema)
  }),
  z.object({
    type: z.literal('game-state-req-error'),
    reason: z.enum(['Not in room', 'Dunno'])
  }),
  z.object({
    type: z.literal('sync-error'),
    reason: z.enum(['Not in room', 'Invalid id', 'Dunno'])
  })
]);

export type ServerMsg = z.infer<typeof ServerMsgSchema>;

export const ClientMsgSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('request-players-status')
  }),
  z.object({
    type: z.literal('join-room'),
    name: z.string(),
    colour: z.optional(z.enum(['black', 'white']))
  }),
  z.object({
    type: z.literal('leave-room'),
  }),
  z.object({
    type: z.literal('request-play'),
    colour: z.enum(['black', 'white'])
  }),
  z.object({
    type: z.literal('queue-move'),
    from: SquareCoordinatesSchema,
    to: SquareCoordinatesSchema,
    lastTurnId: z.number()
  }),
  z.object({
    type: z.literal('request-game-state')
  }),
  z.object({
    type: z.literal('request-sync'),
    lastTurnId: z.number(),
    missingIds: z.optional(z.array(z.number()))
  })
]);

export type ClientMsg = z.infer<typeof ClientMsgSchema>;

export const CreateRoomRequestSchema = z.object({
  name: z.string(),
  private: z.boolean()
});

export type CreateRoomRequest = z.infer<typeof CreateRoomRequestSchema>;

export const RoomsListResponseSchema = z.array(z.object({
  name: z.string(),
  viewers: z.number(),
  players: z.number()
}));

export type RoomsListResponse = z.infer<typeof RoomsListResponseSchema>;

export const CreateRoomSuccessSchema = z.object({name: z.string()});

export type CreateRoomSuccess = z.infer<typeof CreateRoomSuccessSchema>;

export const ReqErrorSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal("malformed json"),
    issues: z.array(z.object({
      path: z.string(),
      message: z.string()
    }))
  }),
  z.object({
    type: z.literal("create room"),
    message: z.enum(['Room already exists', 'unknown error'])
  })
]);

export type ReqError = z.infer<typeof ReqErrorSchema>;