import type {BlockPlayer} from './engine';
// Heartbeats, input acknowledgements and scores do not change board pixels.
export function sameBoard(a:BlockPlayer,b:BlockPlayer){return a===b||(a.name===b.name&&a.out===b.out&&a.piece.kind===b.piece.kind&&a.piece.rotation===b.piece.rotation&&a.piece.x===b.piece.x&&a.piece.y===b.piece.y&&a.board.length===b.board.length&&a.board.every((cell,i)=>cell===b.board[i]));}
