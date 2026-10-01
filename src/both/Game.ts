import getInitialChessPosition from "./getInitialChessPosition.js"
import { ChessPosition, Move, Turn } from "./Notation.js";

class Game {
  pos = getInitialChessPosition();
  turns: Turn[] = [];
  private queuedMoves: {w?: Move, b?: Move} = {};

  isMoveLegal(move: Move, player: 'w' | 'b') {
    return !!move && !!player;
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
    this.turns.push({
      w: moves.w,
      b: moves.b,
      id: this.getLastTurnId() + 1
    });

    // Get moved pieces
    const whitePiece = this.pos.find(p => {
      return p.colour === 'w' && p.coords === moves.w.f && !p.captured
    });
    const blackPiece = this.pos.find(p => {
      return p.colour === 'b' && p.coords === moves.b.f && !p.captured
    });

    // TODO: anyone directly attacking a king should move last
    // to avoid the king dying like some random piece.
    // Consider making anyone taking threatening movement towards
    // a king move after other pieces too. If so when the king
    // is threatened other pieces can cover him and stop
    // a potential attacker in their tracks.

    // Keep track of captured pieces here
    let capturedWhite = this.pos.find(p => {
      return p.colour === 'b' && p.coords === moves.w.t && !p.captured
    });
    let capturedBlack = this.pos.find(p => {
      return p.colour === 'w' && p.coords === moves.b.t && !p.captured
    });

    // Move pieces
    // TODO: castling
    if (whitePiece) {
      whitePiece.coords = moves.w.t;
    }
    if (blackPiece) {
      blackPiece.coords = moves.b.t;
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
  }

  resolveQueuedMoves() {
    if (!this.queuedMoves.b || !this.queuedMoves.w) return;
    this.resolveMoves({w: this.queuedMoves.w, b: this.queuedMoves.b});
    delete this.queuedMoves.w;
    delete this.queuedMoves.b;
  }
}

export default Game;