import { Box, Image } from "@mantine/core";
import { PieceType, ChessPosition, SquareCoordinates } from "../../../both/Notation";
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
  'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
  'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
  'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
  'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
  'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
  'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
  'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
  'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'
];

function Piece({
  type,
  colour,
  size,
  coords,
  repositionTrigger
}: {
  type: PieceType;
  colour: 'w' | 'b';
  size: number;
  coords?: SquareCoordinates;
  repositionTrigger: unknown;
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
  }, [coords, size, repositionTrigger]);

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

export default function Chessboard() {
  const [pieces] = useObservableState(store.chessPos);
  const [connData] = useObservableState(store.socketConnData);
  const role = connData.colour ?? "spectator";
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [w, h] = useResizeObserver(container);
  const min = Math.min(w, h);
  const boardSize = min * (1 - 1/9.05);
  const pieceSize = boardSize / 8;

  const perspectiveSquares = [...squares];
  if (role === 'black') {
    perspectiveSquares.reverse();
  }

  const [selected, setSelected] = useState<SquareCoordinates>();

  // Reset board
  useEffect(() => {
    store.chessPos.reset();
  }, []);

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
          repositionTrigger={role !== 'black'}
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
          perspectiveSquares.map(square => {
            return <Box
              key={square}
              id={square}
              className={
                styles.square
                + (role === 'spectator' ? "" : (" " + styles.player))
                + (selected !== square ? "" : (" " + styles.selected))
              }
              style={{
                // outline: 'solid blue 1px'
              }}
              onMouseEnter={() => {
                if (role === 'spectator') return;
              }}
              onClick={() => {
                if (role === 'spectator') return;

                if (!selected) {
                  if (pieces.some(p => p.coords === square)) {
                    console.log('selected', square);
                    setSelected(square);
                  } else {
                    setSelected(undefined);
                  }
                } else {
                  console.log('moving', selected, 'to', square);
                  const pos = [...store.chessPos.get()];
                  pos.forEach(p => {
                    if (p.coords === selected) {
                      p.coords = square;
                    }
                  });
                  setSelected(undefined);
                }
              }}
            >
            </Box>
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