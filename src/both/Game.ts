// TODO: Castling doesn't work and neither does en passant. Fuck.

import getInitialChessPosition from "./getInitialChessPosition.js";
import { Move, PieceState, SquareCoordinates, Turn } from "./Notation.js";

class Game {
  pos = getInitialChessPosition();
  get alivePos() {
    return this.pos.filter(p => !p.captured);
  }
  turns: Turn[] = [];
  private queuedMoves: {w?: Move, b?: Move} = {};
  private static readonly squares = [
    ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'],
    ['a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2'],
    ['a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3'],
    ['a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4'],
    ['a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5'],
    ['a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6'],
    ['a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7'],
    ['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'],
  ] as const;

  private static findCoords(sq: SquareCoordinates): [r: number, f: number] {
    let r = -1;
    let f = -1;
    r = Number(sq[1]) - 1;
    switch (sq[0]) {
      case 'a': f = 0; break;
      case 'b': f = 1; break;
      case 'c': f = 2; break;
      case 'd': f = 3; break;
      case 'e': f = 4; break;
      case 'f': f = 5; break;
      case 'g': f = 6; break;
      case 'h': f = 7; break;
    }
    return [r, f];
  }

  private threatenedByWhite: SquareCoordinates[] = [];
  private threatenedByBlack: SquareCoordinates[] = [];

  /**
   * @param returnType valid returns move piece can make, threatened includes squares covered by other pieces. Default is `'valid'`
   */
  getValidSquares(piece: PieceState, returnType: 'valid' | 'threatened' = 'valid') {
    if (!piece.coords) return [];
    /** Valid squares */
    const vSquares: SquareCoordinates[] = [];
    /** Threatened squares */
    const tSquares: SquareCoordinates[] = [];
    const coords = Game.findCoords(piece.coords);
    if (
      piece.type !== 'K'
      && this.isCheck(piece.colour)
    ) {
      return vSquares;
    }
    let r = coords[0], f = coords[1];
    let dir = 0;
    let loopVar = 0;
    switch (piece.type) {
      case "":
        const direction = piece.colour === 'b' ? -1 : 1;
        const forward = Game.squares[coords[0] + direction]?.[coords[1]];
        if (forward && !this.alivePos.some(p => p.coords === forward)) {
          vSquares.push(forward);
        }
        const forwardL = Game.squares[coords[0] + direction]?.[coords[1] - 1];
        if (forwardL) {
          if (this.alivePos.some(p => (p.coords === forwardL || p.skipped === forwardL) && p.colour === (piece.colour === 'w' ? 'b' : 'w'))) {
            vSquares.push(forwardL);
          } else {
            tSquares.push(forwardL);
          }
        }
        const forwardR = Game.squares[coords[0] + direction]?.[coords[1] + 1];
        if (forwardR) {
          if (this.alivePos.some(p => (p.coords === forwardR || p.skipped === forwardR) && p.colour === (piece.colour === 'w' ? 'b' : 'w'))) {
            vSquares.push(forwardR);
          } else {
            tSquares.push(forwardR);
          }
        }
        if (!piece.moved && forward) {
          const forwardx2 = Game.squares[coords[0] + direction * 2]?.[coords[1]];
          if (forwardx2 && !this.alivePos.some(p => p.coords === forwardx2)) {
            vSquares.push(forwardx2);
          }
        }
        break;
      case 'Q':
      case 'B':
        for (loopVar = 0; loopVar < 100; loopVar++) {
          r += dir === 0 ? 1 : dir === 1 ? -1 : dir === 2 ? 1 : -1;
          f += dir === 0 ? 1 : dir === 1 ? -1 : dir === 2 ? -1 : 1;
          const sq = Game.squares[r]?.[f];
          if (sq) {
            const p = this.alivePos.find(p => p.coords === sq);
            if (p) {
              if (p.colour !== piece.colour) {
                vSquares.push(sq);
              } else {
                tSquares.push(sq);
              }
              r = coords[0], f = coords[1];
              dir++;
              if (dir > 3) {
                dir = 0;
                break;
              }
            } else {
              vSquares.push(sq);
            }
          } else {
            r = coords[0], f = coords[1];
            dir++;
            if (dir > 3) {
              dir = 0;
              break;
            }
          }
        }
        if (loopVar >= 99) {
          console.warn("Infiloop");
        }
        loopVar = 0;
        if (piece.type === 'B') {
          break;
        }
      case 'R':
        for (loopVar = 0; loopVar < 100; loopVar++) {
          r += dir === 0 ? 1 : dir === 1 ? 0 : dir === 2 ? -1 : 0;
          f += dir === 0 ? 0 : dir === 1 ? 1 : dir === 2 ? 0 : -1;
          const sq = Game.squares[r]?.[f];
          if (sq) {
            const p = this.alivePos.find(p => p.coords === sq);
            if (p) {
              if (p.colour !== piece.colour) {
                vSquares.push(sq);
              } else {
                tSquares.push(sq);
              }
              r = coords[0], f = coords[1];
              dir++;
              if (dir > 3) {
                dir = 0;
                break;
              }
            } else {
              vSquares.push(sq);
            }
          } else {
            r = coords[0], f = coords[1];
            dir++;
            if (dir > 3) {
              dir = 0;
              break;
            }
          }
        }
        if (loopVar >= 99) {
          console.warn("Infiloop");
        }
        loopVar = 0;
        break;
      case 'N':
        for (const sq of [
          Game.squares[r+1]?.[f+2],
          Game.squares[r+1]?.[f-2],
          Game.squares[r-1]?.[f+2],
          Game.squares[r-1]?.[f-2],
          Game.squares[r+2]?.[f+1],
          Game.squares[r+2]?.[f-1],
          Game.squares[r-2]?.[f+1],
          Game.squares[r-2]?.[f-1]
        ]) {
          if (sq) {
            const p = this.alivePos.find(p => p.coords === sq);
            if (p) {
              if (p.colour !== piece.colour) {
                vSquares.push(sq);
              } else {
                tSquares.push(sq);
              }
              dir++;
            } else {
              vSquares.push(sq);
            }
          }
        }
        break;
      case 'K':
        for (const sq of [
          Game.squares[r+1]?.[f+1],
          Game.squares[r+1]?.[f],
          Game.squares[r+1]?.[f-1],
          Game.squares[r]?.[f+1],
          Game.squares[r]?.[f],
          Game.squares[r]?.[f-1],
          Game.squares[r-1]?.[f+1],
          Game.squares[r-1]?.[f],
          Game.squares[r-1]?.[f-1]
        ]) {
          if (
            sq && (
              (piece.colour === 'w' && !this.threatenedByBlack.some(s => s === sq))
              || (piece.colour === 'b' && !this.threatenedByWhite.some(s => s === sq))
            )
          ) {
            const p = this.alivePos.find(p => p.coords === sq);
            if (p) {
              if (p.colour !== piece.colour) {
                vSquares.push(sq);
              }
              dir++;
            } else {
              vSquares.push(sq);
            }
          }
        }
        // Castling
        const pc = piece.coords;
        if (!piece.moved && pc) {
          // Right side
          const rRookSq = this.alivePos.find(p => !p.moved && p.type === "R" && (
            (piece.colour === 'w' && piece.coords === 'h1')
            || (piece.colour === 'b' && piece.coords === 'h8')
          ))?.coords;
          if (rRookSq) {
            const kingNumCoords = Game.findCoords(pc);
            const r1c: [r: number, f: number] = [kingNumCoords[0], kingNumCoords[1] + 1];
            const r2c: [r: number, f: number] = [kingNumCoords[0], kingNumCoords[1] + 2];
            const r1 = Game.squares[r1c[0]]?.[r1c[1]];
            const r2 = Game.squares[r2c[0]]?.[r2c[1]];
            if (
              // Squares king traverses must be empty
              !this.alivePos.some(
                p => p.coords
                && p.coords !== r1
                && p.coords !== r2
              )
              // Squares king traverses and is on must be not threatened by enemy
              && (
                (piece.colour === 'w' && !this.threatenedByBlack.some(sq => sq === r1 || sq === r2 || sq === piece.coords))
                || (piece.colour === 'b' && !this.threatenedByWhite.some(sq => sq === r1 || sq === r2 || sq === piece.coords))
              )
            ) {
              vSquares.push(rRookSq);
            }
          }
          // Left side
          const lRookSq = this.alivePos.find(p => !p.moved && p.type === "R" && (
            (piece.colour === 'w' && piece.coords === 'a1')
            || (piece.colour === 'b' && piece.coords === 'a8')
          ))?.coords;
          if (lRookSq) {
            const kingNumCoords = Game.findCoords(pc);
            const l1c: [r: number, f: number] = [kingNumCoords[0], kingNumCoords[1] - 1];
            const l2c: [r: number, f: number] = [kingNumCoords[0], kingNumCoords[1] - 2];
            const l1 = Game.squares[l1c[0]]?.[l1c[1]];
            const l2 = Game.squares[l2c[0]]?.[l2c[1]];
            if (
              // Squares king traverses must be empty
              !this.alivePos.some(
                p => p.coords
                && p.coords !== l1
                && p.coords !== l2
              )
              // Squares king traverses and is on must be not threatened by enemy
              && (
                (piece.colour === 'w' && !this.threatenedByBlack.some(sq => sq === l1 || sq === l2 || sq === piece.coords))
                || (piece.colour === 'b' && !this.threatenedByWhite.some(sq => sq === l1 || sq === l2 || sq === piece.coords))
              )
            ) {
              vSquares.push(lRookSq);
            }
          }
        }
        break;
    }
    if (returnType === 'valid') {
      return vSquares;
    } else {
      return vSquares.concat(tSquares);
    }
  }

  isCheck(king: 'w' | 'b') {
    const p = this.alivePos.find(p => p.type === 'K' && p.colour === king);
    if (
      p
      && (
        (
          p.colour === 'w'
          && this.threatenedByBlack.some(
            s => p.coords === s
          )
        ) || (
          p.colour === 'b'
          && this.threatenedByWhite.some(
            s => p.coords === s
          )
        )
      )
    ) {
      return true;
    }
    return false;
  }

  isMoveLegal(move: Move, player: 'w' | 'b') {
    const piece = this.alivePos.find(p => p.colour === player && p.coords === move.f);
    if (!piece) return false;
    return this.getValidSquares(piece).some(s => s === move.t);
  }

  /** Returns true if move is legal and got successfully queued */
  queueMove(move: Move, player: 'w' | 'b') {
    if (!this.isMoveLegal(move, player)) return false;
    this.queuedMoves[player] = move;
    return true;
  }

  areBothPlayersMovesCommited() {
    return !!this.queuedMoves.b && !!this.queuedMoves.w;
  }

  getLastTurnId() {
    return this.turns[this.turns.length - 1]?.id ?? 0;
  }

  /** Only use for moves that you have made sure are legal */
  private resolveMoves(moves: {w: Move, b: Move}) {
    this.threatenedByWhite = [];
    this.threatenedByBlack = [];

    // Get moved pieces
    const whitePiece = this.alivePos.find(p => {
      return p.colour === 'w' && p.coords === moves.w.f
    });
    const blackPiece = this.alivePos.find(p => {
      return p.colour === 'b' && p.coords === moves.b.f
    });

    // Kings move first to avoid a check auto becoming checkmate
    if (whitePiece?.type === 'K') {
      if (moves.w.t === 'h1' && this.alivePos.some(p => p.coords === 'h1')) {
        const rook = this.alivePos.find(p => p.coords === 'h1');
        if (rook) {
          rook.coords = 'f1';
          rook.moved = true;
        }
        whitePiece.coords = 'g1';
      } else if (moves.w.t === 'a1' && this.alivePos.some(p => p.coords === 'a1')) {
        const rook = this.alivePos.find(p => p.coords === 'a1');
        if (rook) {
          rook.coords = 'd1';
          rook.moved = true;
        }
        whitePiece.coords = 'c1';
      } else {
        whitePiece.coords = moves.w.t;
      }
    }
    if (blackPiece?.type === 'K') {
      if (moves.b.t === 'h8' && this.alivePos.some(p => p.coords === 'h8')) {
        const rook = this.alivePos.find(p => p.coords === 'h8');
        if (rook) {
          rook.coords = 'f8';
          rook.moved = true;
        }
        blackPiece.coords = 'g8';
      } else if (moves.b.t === 'a8' && this.alivePos.some(p => p.coords === 'a8')) {
        const rook = this.alivePos.find(p => p.coords === 'a8');
        if (rook) {
          rook.coords = 'c8';
          rook.moved = true;
        }
        blackPiece.coords = 'b8';
      } else {
        blackPiece.coords = moves.w.t;
      }
    }

    // Keep track of captured pieces here
    let capturedWhite = this.alivePos.find(p => {
      return p.colour === 'b' && p.coords === moves.w.t
    });
    let capturedBlack = this.alivePos.find(p => {
      return p.colour === 'w' && p.coords === moves.b.t
    });

    // Check for en passant
    if (!capturedWhite) {
      if (
        // Pawn
        blackPiece?.type === ''
        // Changed file
        && moves.b.f[0] !== moves.b.t[0]
        // Landed on en passant vulnerable spot
        && this.alivePos.some(p => {
          return p.skipped === moves.b.t
        })
      ) {
        capturedWhite = this.alivePos.find(p => {
          return p.skipped === moves.b.t
        });
      }
    }
    if (!capturedBlack) {
      if (
        // Pawn
        whitePiece?.type === ''
        // Changed file
        && moves.w.f[0] !== moves.w.t[0]
        // Landed on en passant vulnerable spot
        && this.alivePos.some(p => {
          return p.skipped === moves.w.t
        })
      ) {
        capturedBlack = this.alivePos.find(p => {
          return p.skipped === moves.w.t
        });
      }
    }

    // Move pieces
    if (whitePiece) {
      if (whitePiece.type !== 'K') {
        whitePiece.coords = moves.w.t;
      }
      if (whitePiece.type === '') {
        // Mark/unmark skipped square
        whitePiece.skipped = undefined
      }
      whitePiece.moved = true;
    }
    if (blackPiece) {
      if (blackPiece.type !== 'K') {
        blackPiece.coords = moves.b.t;
      }
      blackPiece.moved = true;
    }

    if (whitePiece?.coords === blackPiece?.coords) {
      capturedWhite = whitePiece;
      capturedBlack = blackPiece;
    }

    if (capturedWhite) {
      capturedWhite.captured = true;
    }
    if (capturedBlack) {
      capturedBlack.captured = true;
    }

    // Promote pawns
    if (whitePiece?.type === '' && !whitePiece.captured && whitePiece.coords?.[1] === "8") {
      whitePiece.type = 'Q';
    }
    if (blackPiece?.type === '' && !blackPiece.captured && blackPiece.coords?.[1] === "1") {
      blackPiece.type = 'Q';
    }

    // Mark threatened squares
    const wThreats: SquareCoordinates[] = [];
    const bThreats: SquareCoordinates[] = [];
    this.alivePos.forEach(p => {
      const squares = this.getValidSquares(p, 'threatened');
      if (p.colour === 'w') {
        wThreats.push(...squares);
      } else {
        bThreats.push(...squares);
      }
    });
    this.threatenedByWhite = wThreats;
    this.threatenedByBlack = bThreats;

    // TODO: Check if game is over
    this.turns.push({
      w: moves.w,
      b: moves.b,
      id: this.getLastTurnId() + 1
    });
  }

  resolveQueuedMoves() {
    if (!this.queuedMoves.b || !this.queuedMoves.w) return;
    this.resolveMoves({w: this.queuedMoves.w, b: this.queuedMoves.b});
    delete this.queuedMoves.w;
    delete this.queuedMoves.b;
  }

  isGameOver() {
    return !!this.turns.at(-1)?.end;
  }

  getVictor() {
    return this.turns.at(-1)?.victor ?? null;
  }
}

export default Game;