import * as z from "zod"

export const SquareCoordinatesSchema = z.enum([
  "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8",
  "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8",
  "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8",
  "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8",
  "e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8",
  "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8",
  "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8",
  "h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8"
])

export type SquareCoordinates = z.infer<typeof SquareCoordinatesSchema>;

export const PieceTypeSchema = z.enum(["K", "Q", "R", "B", "N", ""]);

export type PieceType = z.infer<typeof PieceTypeSchema>;

// type ChessFile = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";

// type ChessRank = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

export const MoveSchema = z.object({
  /** Start position */
  f: SquareCoordinatesSchema,
  /** End position */
  t: SquareCoordinatesSchema
})

export type Move = z.infer<typeof MoveSchema>;

export const TurnSchema = z.object({
  /** White `Move` */
  w: MoveSchema,
  /** Black `Move` */
  b: MoveSchema,
  /** End without victor is stalemate */
  end: z.optional(z.boolean()),
  /** End without victor is stalemate */
  victor: z.optional(z.enum(['white', 'black'])),
  /** Might be useful to describe why stalemate happened, or anything else */
  comment: z.optional(z.string()),
  wEnPassant: z.optional(z.boolean()),
  bEnPassant: z.optional(z.boolean()),
  wCastling: z.optional(z.boolean()),
  bCastling: z.optional(z.boolean()),
  wCaptures: z.optional(z.array(PieceTypeSchema)),
  bCaptures: z.optional(z.array(PieceTypeSchema)),
  wCheck: z.optional(z.boolean()),
  bCheck: z.optional(z.boolean()),
  id: z.number()
});

export type Turn = z.infer<typeof TurnSchema>;

export const PieceStateSchema = z.object({
  coords: z.optional(SquareCoordinatesSchema),
  /** For pawns when they make an initial two square advance, mark the skipped square here. It is vulnerable to an en passant. */
  skipped: z.optional(SquareCoordinatesSchema),
  type: PieceTypeSchema,
  colour: z.enum(["w", "b"]),
  captured: z.optional(z.boolean()),
  promoted: z.optional(z.boolean()),
  moved: z.optional(z.boolean())
});

export type PieceState = z.infer<typeof PieceStateSchema>;

export const ChessPositionSchema = z.tuple([
  PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema,
  PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema,
  PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema,
  PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema, PieceStateSchema
]);

export type ChessPosition = z.infer<typeof ChessPositionSchema>;