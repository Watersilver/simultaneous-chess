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

  reset() {
    this.threatenedByWhite = [];
    this.threatenedByBlack = [];
    this.pos = getInitialChessPosition();
    this.turns = [];
  }

  private checkIfPinned = true;
  private ignoreCheck = false;
  /**
   * @param returnType valid returns squares piece can move to,
   * threatened includes squares inaccessible by king. Default is `'valid'`
   */
  getValidSquares(piece: PieceState, returnType: 'valid' | 'threatened' = 'valid') {
    if (!piece.coords || piece.captured) return [];
    /** Valid squares */
    let vSquares: SquareCoordinates[] = [];
    /** Threatened squares */
    const tSquares: SquareCoordinates[] = [];
    const coords = Game.findCoords(piece.coords);
    if (
      !this.ignoreCheck
      && returnType === 'valid'
      && piece.type !== 'K'
      && this.isCheck(piece.colour)
    ) {
      // Check if I can interpose or capture attacking piece
      const king = this.alivePos.find(p => p.type === 'K' && p.colour === piece.colour);
      if (king?.coords) {
        // Step 1: count how many pieces are threatening king.
        // If only one piece is threatening, continue
        // If there are more, a single piece's move
        // cannot save the king, so return empty array
        this.ignoreCheck = true;
        const threats = this.alivePos.filter(p => {
          return this.getValidSquares(p).some(s => king.coords === s);
        });
        this.ignoreCheck = false;
        if (threats.length > 1) {
          return vSquares;
        }
        // Step 2: get my valid squares as if check
        // wasn't there
        this.ignoreCheck = true;
        const sq = this.getValidSquares(piece);
        this.ignoreCheck = false;
        // Step 3: intersect my valid squares with
        // the squares of the checking enemy and return;
        // enemy squares include their valid squares and their position
        const enemy = threats[0];
        if (enemy?.coords) {
          const path = Game.getPath({f: enemy.coords, t: king.coords});
          vSquares = sq.filter(square => path.includes(square) || square === enemy.coords);
        }
      }

      return vSquares;
    }
    let markedKingCaptured: 'b' | 'w' | null = null;
    if (returnType === 'threatened' && piece.type !== 'K') {
      for (const p of this.pos) {
        // Mark the enemy king as captured so when marking squares we will
        // go through the king as if he's not there.
        // Since we're marking the squares that threaten kings, he can't
        // use himself as a shield.
        if (p.type === 'K' && piece.colour !== p.colour) {
          if (!p.captured) {
            p.captured = true;
            markedKingCaptured = p.colour;
            break;
          }
        }
      }
    }
    let r = coords[0], f = coords[1];
    let dir = 0;
    let loopVar = 0;
    switch (piece.type) {
      case "":
        const direction = piece.colour === 'b' ? -1 : 1;
        let forward = Game.squares[coords[0] + direction]?.[coords[1]];
        if (forward && !this.alivePos.some(p => p.coords === forward)) {
          vSquares.push(forward);
        } else {
          forward = undefined;
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
            (piece.colour === 'w' && p.coords === 'h1')
            || (piece.colour === 'b' && p.coords === 'h8')
          ))?.coords;
          if (rRookSq) {
            const kingNumCoords = Game.findCoords(pc);
            const r1c: [r: number, f: number] = [kingNumCoords[0], kingNumCoords[1] + 1];
            const r2c: [r: number, f: number] = [kingNumCoords[0], kingNumCoords[1] + 2];
            const r1 = Game.squares[r1c[0]]?.[r1c[1]];
            const r2 = Game.squares[r2c[0]]?.[r2c[1]];
            if (
              // Squares king traverses must be empty
              this.alivePos.every(
                p => p.coords
                && p.coords !== r1
                && p.coords !== r2
              )
              // Squares king traverses and is on must be not threatened by enemy
              && (
                (
                  piece.colour === 'w'
                  && !this.threatenedByBlack.some(sq => sq === r1 || sq === r2 || sq === piece.coords)
                )
                || (
                  piece.colour === 'b'
                  && !this.threatenedByWhite.some(sq => sq === r1 || sq === r2 || sq === piece.coords)
                )
              )
            ) {
              vSquares.push(rRookSq);
            }
          }
          // Left side
          const lRookSq = this.alivePos.find(p => !p.moved && p.type === "R" && (
            (piece.colour === 'w' && p.coords === 'a1')
            || (piece.colour === 'b' && p.coords === 'a8')
          ))?.coords;
          if (lRookSq) {
            const kingNumCoords = Game.findCoords(pc);
            const l1c: [r: number, f: number] = [kingNumCoords[0], kingNumCoords[1] - 1];
            const l2c: [r: number, f: number] = [kingNumCoords[0], kingNumCoords[1] - 2];
            const l1 = Game.squares[l1c[0]]?.[l1c[1]];
            const l2 = Game.squares[l2c[0]]?.[l2c[1]];
            if (
              // Squares king traverses must be empty
              this.alivePos.every(
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
      
      if (piece.type !== 'K') {
        const king = this.alivePos.find(p => p.type === 'K' && p.colour === piece.colour);
        if (this.checkIfPinned && king) {
          this.checkIfPinned = false;
          piece.captured = true;
          // Check if pinned
          const otherCol = piece.colour === 'b' ? 'w' : 'b';
          for (const other of this.alivePos) {
            if (other.colour === otherCol && (other.type === "R" || other.type === "Q" || other.type === "B")) {
              const sq = this.getValidSquares(other);
              if (sq.some(s => piece.coords === s) && sq.some(s => king.coords === s)) {
                vSquares = vSquares.filter(square => sq.includes(square) || square === other.coords);
                break;
              }
            }
          }
          piece.captured = false;
          this.checkIfPinned = true;
        }
      }

      return vSquares;
    } else {
      if (markedKingCaptured) {
        const king = this.pos.find(p => p.type === 'K' && p.colour === markedKingCaptured);
        if (king) {
          king.captured = false;
        }
      }
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
    let wCastling = false
    if (whitePiece?.type === 'K') {
      if (moves.w.t === 'h1' && this.alivePos.some(p => p.coords === 'h1')) {
        const rook = this.alivePos.find(p => p.coords === 'h1');
        if (rook) {
          rook.coords = 'f1';
          rook.moved = true;
          wCastling = true;
        }
        whitePiece.coords = 'g1';
      } else if (moves.w.t === 'a1' && this.alivePos.some(p => p.coords === 'a1')) {
        const rook = this.alivePos.find(p => p.coords === 'a1');
        if (rook) {
          rook.coords = 'd1';
          rook.moved = true;
          wCastling = true;
        }
        whitePiece.coords = 'c1';
      } else {
        whitePiece.coords = moves.w.t;
      }
    }
    let bCastling = false
    if (blackPiece?.type === 'K') {
      if (moves.b.t === 'h8' && this.alivePos.some(p => p.coords === 'h8')) {
        const rook = this.alivePos.find(p => p.coords === 'h8');
        if (rook) {
          rook.coords = 'f8';
          rook.moved = true;
          bCastling = true;
        }
        blackPiece.coords = 'g8';
      } else if (moves.b.t === 'a8' && this.alivePos.some(p => p.coords === 'a8')) {
        const rook = this.alivePos.find(p => p.coords === 'a8');
        if (rook) {
          rook.coords = 'd8';
          rook.moved = true;
          bCastling = true;
        }
        blackPiece.coords = 'c8';
      } else {
        blackPiece.coords = moves.b.t;
      }
    }

    // Check if collided (careful to make sure castling doesn't collide)
    // Step 1: get paths for both moves
    const wPath = wCastling ? [] : Game.getPath(moves.w);
    const bPath = bCastling ? [] : Game.getPath(moves.b);
    // Step 2: if either piece ends its move in the path of the other, collide
    const collided = wPath.some(s => s === moves.b.t) || bPath.some(s => s === moves.w.t);
    // Step 3: if collision occurs, other captures fail because piece got intercepted
    // Make sure that king doesn't die if attacking piece is captured
    // (done by making king immortal for now)

    // Keep track of captured pieces here
    // Let kings be immortal for now
    // to deal with intercepted and captured
    // pieces that attack the king
    let capturedWhite = collided ? whitePiece : this.alivePos.find(p => {
      return p.type !== "K" && p.colour === 'b' && p.coords === moves.w.t
    });
    let capturedBlack = collided ? blackPiece : this.alivePos.find(p => {
      return p.type !== "K" && p.colour === 'w' && p.coords === moves.b.t
    });

    // Check for en passant
    let enPassantCaptureW: PieceState | undefined;
    if (
      !collided
      // Pawn
      && blackPiece?.type === ''
      // Changed file
      && moves.b.f[0] !== moves.b.t[0]
      // Landed on en passant vulnerable spot
      && this.alivePos.some(p => {
        return p.skipped === moves.b.t
      })
    ) {
      enPassantCaptureW = this.alivePos.find(p => {
        return p.skipped === moves.b.t
      });
    }
    let enPassantCaptureB: PieceState | undefined;
    if (
      !collided
      // Pawn
      && whitePiece?.type === ''
      // Changed file
      && moves.w.f[0] !== moves.w.t[0]
      // Landed on en passant vulnerable spot
      && this.alivePos.some(p => {
        return p.skipped === moves.w.t
      })
    ) {
      enPassantCaptureB = this.alivePos.find(p => {
        return p.skipped === moves.w.t
      });
    }

    // Move pieces
    if (whitePiece) {
      if (whitePiece.type !== 'K') {
        whitePiece.coords = moves.w.t;
      }
      if (whitePiece.type === '') {
        // Mark/unmark skipped square
        const cf = Game.findCoords(moves.w.f);
        const ct = Game.findCoords(moves.w.t);
        if (cf[0] - ct[0] < -1) {
          whitePiece.skipped = Game.squares[cf[0] + 1]?.[cf[1]];
        } else {
          whitePiece.skipped = undefined;
        }
      }
      whitePiece.moved = true;
    }
    if (blackPiece) {
      if (blackPiece.type !== 'K') {
        blackPiece.coords = moves.b.t;
      }
      if (blackPiece.type === '') {
        // Mark/unmark skipped square
        const cf = Game.findCoords(moves.b.f);
        const ct = Game.findCoords(moves.b.t);
        if (cf[0] - ct[0] > 1) {
          blackPiece.skipped = Game.squares[cf[0] - 1]?.[cf[1]];
        } else {
          blackPiece.skipped = undefined;
        }
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
    if (enPassantCaptureW) {
      enPassantCaptureW.captured = true;
    }
    if (capturedBlack) {
      capturedBlack.captured = true;
    }
    if (enPassantCaptureB) {
      enPassantCaptureB.captured = true;
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

    // Check if game is over
    let wKing = this.alivePos.find(p => p.colour === 'w' && p.type === "K");
    if (wKing) {
      if (this.isCheck('w') && this.alivePos.every(p => p.colour === 'w' && this.getValidSquares(p).length === 0)) {
        wKing = undefined;
      }
    }
    let bKing = this.alivePos.find(p => p.colour === 'b' && p.type === "K");
    if (bKing) {
      if (this.isCheck('b') && this.alivePos.every(p => p.colour === 'b' && this.getValidSquares(p).length === 0)) {
        bKing = undefined;
      }
    }
    let end = !wKing || !bKing;
    if (wKing && bKing) {
      const wSq: SquareCoordinates[] = [];
      const bSq: SquareCoordinates[] = [];
      this.alivePos.forEach(p => {
        const squares = this.getValidSquares(p);
        if (p.colour === 'w') {
          wSq.push(...squares);
        } else {
          bSq.push(...squares);
        }
      });
      if (!end) {
        end = wSq.length === 0 || bSq.length === 0;
      }
    }

    this.turns.push({
      w: moves.w, b: moves.b,
      id: this.getLastTurnId() + 1,
      wCastling, bCastling,
      wCaptures: (capturedWhite ? [capturedWhite.type] : [])
        .concat(enPassantCaptureW ? [enPassantCaptureW.type] : []),
      bCaptures: (capturedBlack ? [capturedBlack.type] : [])
        .concat(enPassantCaptureB ? [enPassantCaptureB.type] : []),
      wEnPassant: !!enPassantCaptureW, bEnPassant: !!enPassantCaptureB,
      wCheck: this.isCheck('w'), bCheck: this.isCheck('b'),
      collided,
      end,
      victor:
        end
        ? (
          wKing
          ? (
            bKing
            ? undefined
            : 'white'
          )
          : (
            bKing
            ? 'black'
            : undefined
          )
        )
        : undefined
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

  static getPath(move: Move) {
    const from = Game.findCoords(move.f);
    const to = Game.findCoords(move.t);
    const path: SquareCoordinates[] = [];
    if (from[0] == to[0]) {
      if (from[1] > to[1]) {
        let i = 1;
        while (true) {
          const sq = Game.squares[from[0]]?.[from[1] - i];
          if (sq === move.t) {
            break;
          } else if (sq) {
            path.push(sq);
            i++;
          } else {
            break;
          }
        }
      } else {
        let i = 1;
        while (true) {
          const sq = Game.squares[from[0]]?.[from[1] + i];
          if (sq === move.t) {
            break;
          } else if (sq) {
            path.push(sq);
            i++;
          } else {
            break;
          }
        }
      }
    } else if (from[1] === to[1]) {
      if (from[0] > to[0]) {
        let i = 1;
        while (true) {
          const sq = Game.squares[from[0] - i]?.[from[1]];
          if (sq === move.t) {
            break;
          } else if (sq) {
            path.push(sq);
            i++;
          } else {
            break;
          }
        }
      } else {
        let i = 1;
        while (true) {
          const sq = Game.squares[from[0] + i]?.[from[1]];
          if (sq === move.t) {
            break;
          } else if (sq) {
            path.push(sq);
            i++;
          } else {
            break;
          }
        }
      }
    } else if (Math.abs(from[0] - to[0]) === Math.abs(from[1] - to[1])) {
      if (from[0] > to[0]) {
        if (from[1] > to[1]) {
          let i = 1;
          while (true) {
            const sq = Game.squares[from[0] - i]?.[from[1] - i];
            if (sq === move.t) {
              break;
            } else if (sq) {
              path.push(sq);
              i++;
            } else {
              break;
            }
          }
        } else {
          let i = 1;
          while (true) {
            const sq = Game.squares[from[0] - i]?.[from[1] + i];
            if (sq === move.t) {
              break;
            } else if (sq) {
              path.push(sq);
              i++;
            } else {
              break;
            }
          }
        }
      } else {
        if (from[1] > to[1]) {
          let i = 1;
          while (true) {
            const sq = Game.squares[from[0] + i]?.[from[1] - i];
            if (sq === move.t) {
              break;
            } else if (sq) {
              path.push(sq);
              i++;
            } else {
              break;
            }
          }
        } else {
          let i = 1;
          while (true) {
            const sq = Game.squares[from[0] + i]?.[from[1] + i];
            if (sq === move.t) {
              break;
            } else if (sq) {
              path.push(sq);
              i++;
            } else {
              break;
            }
          }
        }
      }
    }
    return path;
  }
}

export default Game;