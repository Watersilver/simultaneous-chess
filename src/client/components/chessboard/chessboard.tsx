import { Box, Image } from "@mantine/core";
import { PieceType, Position, SquareCoordinates } from "../../../both/Notation";
import useResizeObserver from "../../hooks/useResizeObserver";
import { useEffect, useState } from "react";
import styles from "./chessboard.module.css"
import board from "../../assets/chess/Board.png";
import blackBishop from "../../assets/chess/BlackBishop.png";
import blackKing from "../../assets/chess/BlackKing.png";
import blackKnight from "../../assets/chess/BlackKnight.png";
import blackPawn from "../../assets/chess/BlackPawn.png";
import blackQueen from "../../assets/chess/BlackQueen.png";
import blackRook from "../../assets/chess/BlackRook.png";
import whiteBishop from "../../assets/chess/WhiteBishop.png";
import whiteKing from "../../assets/chess/WhiteKing.png";
import whiteKnight from "../../assets/chess/WhiteKnight.png";
import whitePawn from "../../assets/chess/WhitePawn.png";
import whiteQueen from "../../assets/chess/WhiteQueen.png";
import whiteRook from "../../assets/chess/WhiteRook.png";
import useObservableState from "../../hooks/useObservableState";
import store from "../../store";

const pieceImgs: {[type in PieceType]: {[colour in 'b' | 'w']: string}} = {
  '': {w: whitePawn, b: blackPawn},
  'B': {w: whiteBishop, b: blackBishop},
  'K': {w: whiteKing, b: blackKing},
  'N': {w: whiteKnight, b: blackKnight},
  'Q': {w: whiteQueen, b: blackQueen},
  'R': {w: whiteRook, b: blackRook}
}

const squares: SquareCoordinates[] = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8',
  'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8',
  'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8',
  'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8',
  'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8',
  'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8',
  'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8',
  'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8',
];

type PieceState = {
  coords?: SquareCoordinates;
  type: PieceType;
  colour: "w" | "b";
  captured?: boolean;
  promoted?: boolean;
}

const initialPiecesState: [
  PieceState, PieceState, PieceState, PieceState, PieceState, PieceState, PieceState, PieceState,
  PieceState, PieceState, PieceState, PieceState, PieceState, PieceState, PieceState, PieceState,
  PieceState, PieceState, PieceState, PieceState, PieceState, PieceState, PieceState, PieceState,
  PieceState, PieceState, PieceState, PieceState, PieceState, PieceState, PieceState, PieceState
] = [
  // White Pieces
  { type: "K", colour: "w" },
  { type: "Q", colour: "w" },
  { type: "R", colour: "w" },
  { type: "R", colour: "w" },
  { type: "B", colour: "w" },
  { type: "B", colour: "w" },
  { type: "N", colour: "w" },
  { type: "N", colour: "w" },
  { type: "", colour: "w" },
  { type: "", colour: "w" },
  { type: "", colour: "w" },
  { type: "", colour: "w" },
  { type: "", colour: "w" },
  { type: "", colour: "w" },
  { type: "", colour: "w" },
  { type: "", colour: "w" },

  // Black Pieces
  { type: "K", colour: "b" },
  { type: "Q", colour: "b" },
  { type: "R", colour: "b" },
  { type: "R", colour: "b" },
  { type: "B", colour: "b" },
  { type: "B", colour: "b" },
  { type: "N", colour: "b" },
  { type: "N", colour: "b" },
  { type: "", colour: "b" },
  { type: "", colour: "b" },
  { type: "", colour: "b" },
  { type: "", colour: "b" },
  { type: "", colour: "b" },
  { type: "", colour: "b" },
  { type: "", colour: "b" },
  { type: "", colour: "b" },
];

function Piece({
  type,
  colour,
  size,
  coords
}: {
  type: PieceType;
  colour: 'w' | 'b';
  size: number;
  coords?: SquareCoordinates;
}) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  useEffect(() => {
    if (!coords) {
      setX(0);
      setY(0);
      return;
    }

    const sqContEl = document.getElementById("pieces-container");
    const squareEl = document.getElementById(coords);
    if (squareEl && sqContEl) {
      const offset = sqContEl.getBoundingClientRect();
      const rect = squareEl.getBoundingClientRect();
      setX(rect.x - offset.x);
      setY(rect.y - offset.y);
      return;
    }

    setX(0);
    setY(0);
  }, [coords, size]);

  return <Image
    style={{
      position: 'absolute',
      top: 0, left: 0,
      width: size,
      height: size,
      imageRendering: 'pixelated',
      transform: `translate(${x}px, ${y}px)`,
      transition: 'transform 0.05s'
    }}
    src={pieceImgs[type][colour]}
  />
}

export default function Chessboard({
  data
}: {
  data: Position
}) {
  const [connData] = useObservableState(store.socketConnData);
  const role = connData.colour ?? "spectator";
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [w, h] = useResizeObserver(container);
  const min = Math.min(w, h);
  const boardSize = min * (1 - 1/9.05);
  const pieceSize = boardSize / 8;

  const [pieces, setPieces] = useState(initialPiecesState);

  return <Box
    style={{
      position: 'relative',
      boxSizing: 'border-box',
      width: '100%',
      height: '100%',
      userSelect: 'none'
    }}
    id="pieces-container"
  >
    {
      pieces.map((piece, i) => {
        return <Piece
          key={i}
          size={pieceSize}
          coords={piece.coords}
          type={piece.type}
          colour={piece.colour}
        />
      })
    }
    <Box
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        alignItems: 'center',
        justifyItems: 'center'
      }}
      ref={el => setContainer(el)}
    >
      <Box
        style={{
          // outline: 'dashed red 1px',
          display: 'grid',
          width: boardSize,
          height: boardSize,
          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
          transform: "translate(0.425%, 0.425%)"
        }}
      >
        {
          squares.map(square => {
            return <Box
              key={square}
              id={square}
              className={styles.square + (role === 'spectator' ? " " + styles.player : "")}
              style={{
                // outline: 'solid blue 1px'
              }}
              onMouseEnter={() => {
                if (role === 'spectator') return;
                setPieces(p => {
                  const newP: typeof p = [...p];
                  newP[0].coords = square;
                  return newP;
                })
              }}
            />
          })
        }
      </Box>
    </Box>
    <Image
      fit="contain"
      style={{
        imageRendering: 'pixelated',
        height: '100%',
        pointerEvents: 'none'
      }}
      src={board}
    />
  </Box>;
}