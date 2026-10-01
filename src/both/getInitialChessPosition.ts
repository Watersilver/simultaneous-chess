import { ChessPosition } from "./Notation.js";

const getInitialChessPosition: () => ChessPosition = () => [
  // White Pieces
  { type: "K", colour: "w", coords: 'e1' },
  { type: "Q", colour: "w", coords: 'd1' },
  { type: "R", colour: "w", coords: 'a1' },
  { type: "R", colour: "w", coords: 'h1' },
  { type: "B", colour: "w", coords: 'c1' },
  { type: "B", colour: "w", coords: 'f1' },
  { type: "N", colour: "w", coords: 'b1' },
  { type: "N", colour: "w", coords: 'g1' },
  { type: "", colour: "w", coords: 'e2' },
  { type: "", colour: "w", coords: 'd2' },
  { type: "", colour: "w", coords: 'a2' },
  { type: "", colour: "w", coords: 'h2' },
  { type: "", colour: "w", coords: 'c2' },
  { type: "", colour: "w", coords: 'f2' },
  { type: "", colour: "w", coords: 'b2' },
  { type: "", colour: "w", coords: 'g2' },

  // Black Pieces
  { type: "K", colour: "b", coords: 'e8' },
  { type: "Q", colour: "b", coords: 'd8' },
  { type: "R", colour: "b", coords: 'a8' },
  { type: "R", colour: "b", coords: 'h8' },
  { type: "B", colour: "b", coords: 'c8' },
  { type: "B", colour: "b", coords: 'f8' },
  { type: "N", colour: "b", coords: 'b8' },
  { type: "N", colour: "b", coords: 'g8' },
  { type: "", colour: "b", coords: 'e7' },
  { type: "", colour: "b", coords: 'd7' },
  { type: "", colour: "b", coords: 'a7' },
  { type: "", colour: "b", coords: 'h7' },
  { type: "", colour: "b", coords: 'c7' },
  { type: "", colour: "b", coords: 'f7' },
  { type: "", colour: "b", coords: 'b7' },
  { type: "", colour: "b", coords: 'g7' },
];

export default getInitialChessPosition;