import { Box, Image, Loader } from "@mantine/core";
import { PieceType, ChessPosition, SquareCoordinates } from "../../../both/Notation";
import useResizeObserver from "../../hooks/useResizeObserver";
import { useEffect, useRef, useState } from "react";
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
import Game from "../../../both/Game";
import clientSocket from "../../sockets/clientSocket";
import useMessageListener from "../../hooks/useMessageListener";
import getInitialChessPosition from "../../../both/getInitialChessPosition";
import { notifications } from "@mantine/notifications";

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
  repositionTrigger,
  captured
}: {
  type: PieceType;
  colour: 'w' | 'b';
  size: number;
  coords?: SquareCoordinates;
  repositionTrigger: unknown;
  captured?: boolean;
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
      width: captured ? 0 : size,
      height: captured ? 0 : size,
      imageRendering: 'pixelated',
      transform: `translate(${x}px, ${y}px)`,
      transition: captured ? 'transform 0.1s, width 0.1s 0.2s, height 0.1s 0.2s' : 'transform 0.1s'
    }}
    src={pieceImgs[type][colour]}
  />
}

export default function Chessboard() {
  const [pieces] = useObservableState(store.chessPos);
  const [connData] = useObservableState(store.socketConnData);
  const role = connData.colour ?? "spectator";
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [contw, conth] = useResizeObserver(root);
  const [w, h] = useResizeObserver(container);
  const min = Math.min(w, h);
  const boardSize = min * (1 - 1/9.05);
  const pieceSize = boardSize / 8;
  const initialUpdate = useRef(false);
  const [outOfSync, setOutOfSync] = useState(true);

  const perspectiveSquares = [...squares];
  if (role === 'black') {
    perspectiveSquares.reverse();
  }

  const [selected, setSelected] = useState<SquareCoordinates>();
  const [hovered, setHovered] = useState<SquareCoordinates>();
  const [target, setTarget] = useState<SquareCoordinates>();
  const [selectedValidMoves, setSelectedValidMoves] = useState<SquareCoordinates[]>([]);
  const [hoveredValidMoves, setHoveredValidMoves] = useState<SquareCoordinates[]>([]);

  const [game] = useState(() => new Game());
  // Reset board
  useEffect(() => {
    store.chessPos.reset();
    store.history.set([]);
  }, []);
  // Ask for initi state
  useEffect(() => {
    clientSocket.send({type: 'request-game-state'});
  }, []);

  useMessageListener(clientSocket, {
    onMessage: msg => {
      switch (msg.type) {
        case 'new-turn':
          setSelected(undefined);
          setTarget(undefined);
          if (!initialUpdate.current) {
            const missingIds: number[] = [];
            for (let i = 1; i < msg.turn.id; i++) {
              if (!game.turns.some(t => t.id === i)) {
                missingIds.push(i);
              }
            }
            if (missingIds.length > 0) {
              setOutOfSync(true);
              clientSocket.send({
                type: 'request-sync',
                lastTurnId: game.turns.at(-1)?.id ?? 0
              });
            } else {
              game.queueMove(msg.turn.w, 'w');
              game.queueMove(msg.turn.b, 'b');
              game.resolveQueuedMoves();
              store.chessPos.set([...game.pos]);
              store.history.set([...game.turns]);
              if (msg.turn.end) {
                if (msg.turn.victor) {
                  notifications.show({message: "Checkmate! Winner: " + msg.turn.victor});
                } else {
                  notifications.show({message: 'Stalemate'});
                }
              }
              if (msg.turn.bCheck) {
                notifications.show({message: 'Black king in check'});
              }
              if (msg.turn.wCheck) {
                notifications.show({message: 'White king in check'});
              }
            }
          }
          break;
          case 'game-state':
            setSelected(undefined);
            setTarget(undefined);
            game.reset();
            for (const turn of msg.turns) {
              game.queueMove(turn.w, 'w');
              game.queueMove(turn.b, 'b');
              game.resolveQueuedMoves();
            }
            store.chessPos.set([...game.pos]);
            store.history.set([...game.turns]);
            setOutOfSync(false);
            break;
          case 'sync':
            setSelected(undefined);
            setTarget(undefined);
            game.reset();
            for (const turn of msg.turns) {
              game.queueMove(turn.w, 'w');
              game.queueMove(turn.b, 'b');
              game.resolveQueuedMoves();
            }
            store.chessPos.set([...game.pos]);
            store.history.set([...game.turns]);
            setOutOfSync(false);
            break;
          case 'sync-error':
            setOutOfSync(true);
            notifications.show({message: msg.reason});
            clientSocket.send({type: 'request-game-state'})
            break;
          case 'game-state-req-error':
            notifications.show({message: msg.reason});
            setTimeout(() => clientSocket.send({type: 'request-game-state'}), 5000);
            break;
          case 'queue-move-error':
            setSelected(undefined);
            setTarget(undefined);
            notifications.show({message: msg.reason});
            break;
      }
    }
  });

  // Show legal moves on hovered and selected square
  useEffect(() => {
    if (!selected) {
      setSelectedValidMoves([]);
      return;
    }
    const p = game.alivePos.find(p => p.coords === selected);
    if (!p) {
      setSelectedValidMoves([]);
      return;
    }
    setSelectedValidMoves(game.getValidSquares(p));
  }, [selected]);
  useEffect(() => {
    if (!hovered) {
      setHoveredValidMoves([]);
      return;
    }
    const p = game.alivePos.find(p => p.coords === hovered);
    if (!p) {
      setHoveredValidMoves([]);
      return;
    }
    setHoveredValidMoves(game.getValidSquares(p));
  }, [hovered]);

  return outOfSync
  ? <Loader />
  : <Box
    style={{
      position: 'relative',
      boxSizing: 'border-box',
      width: '100%',
      height: '100%',
      userSelect: 'none'
    }}
    id="pieces-container"
    ref={el => setRoot(el)}
  >
    {
      pieces.map((piece, i) => {
        return <Piece
          key={i}
          size={pieceSize}
          coords={piece.coords}
          type={piece.type}
          colour={piece.colour}
          repositionTrigger={role + contw + conth}
          captured={piece.captured}
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
                + (target !== square ? "" : (" " + styles.target))
                + (!selectedValidMoves.concat(hoveredValidMoves).some(s => s === square) ? "" : (" " + styles.controlled))
              }
              style={{
                // outline: 'solid blue 1px'
              }}
              onMouseEnter={() => {
                if (role === 'spectator') return;
                setHovered(square);
              }}
              onMouseLeave={() => {
                setHovered(undefined);
              }}
              onClick={() => {
                if (role === 'spectator') return;
                if (target) return;

                if (!selected) {
                  if (pieces.filter(p => !p.captured).some(p => p.coords === square && p.colour === role[0])) {
                    setSelected(square);
                  } else {
                    setSelected(undefined);
                  }
                } else {
                  if (game.isMoveLegal({f: selected, t: square}, role === 'black' ? 'b' : 'w')) {
                    clientSocket.send({
                      type: 'queue-move',
                      from: selected,
                      to: square,
                      lastTurnId: game.turns.at(-1)?.id ?? 0
                    });
                    setTarget(square);
                  } else {
                    if (pieces.filter(p => !p.captured).some(p => p.coords === square && p.colour === role[0])) {
                      setSelected(square);
                    } else {
                      setSelected(undefined);
                    }
                  }
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