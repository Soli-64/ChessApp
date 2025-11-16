import { Chess, WHITE, type Square } from 'chess.js';
import { useEffect, useRef, useState } from 'react';
import { Chessboard, type ChessboardOptions, type PieceDropHandlerArgs, type SquareHandlerArgs } from 'react-chessboard';
import { invoke } from 'versapy/api';
import { useEloManager } from '../hooks/GameUtils';


enum Players {WHITE="w",BLACK="b"}

type BackResponse = {
    move: string,
    eval: any
}

function PlayerView() {

  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());

  const [botPlaying, setBotPlaying] = useState<Players>(Players.BLACK)

  const [fromSquare, setFromSquare] = useState<string|null>(null);
  const [squareStyles, setSquareStyles] = useState({})

  const [botElo, setBotElo] = useEloManager(800)

  const [gameEnded, setGameEnded] = useState<boolean>(true)

  const makeMove = (from: string, to: string) => {
    chessGame.move({
      from,
      to,
      promotion: 'q'
    })
    setChessPosition(chessGame.fen());
  }

  const BotMove = async () => {
    let _ = await invoke('move', {fen: chessGame.fen()}) as BackResponse
    if (_.move && _.eval) {
      const {move} = _
      const [m1,m2] = [move.slice(0,2), move.slice(2,4)]
      makeMove(m1,m2)
    } else {
      console.error('No move or eval in bot return')
    }
  }

  useEffect(() => {
    
  }, [botElo])

  useEffect(() => {
    if (!(chessGame.isGameOver() || chessGame.isDraw())) {
      if (chessGame.turn() === botPlaying) {
        BotMove()
      }
    } else if (chessGame.isGameOver() || chessGame.isDraw()) {
      console.log("Game ended")
      setGameEnded(true)
    }
  }, [chessGame.fen()]);

  function onPieceDrop({
      sourceSquare,
      targetSquare
    }: PieceDropHandlerArgs) {

      if (!targetSquare) {
        return false;
      }

      try {
        makeMove(sourceSquare, targetSquare)

        if (chessGame.isGameOver() || chessGame.isDraw()) {
          return false;
        }

        return true;
      } catch {
        return false;
      }
  }

  function handleClick(args: SquareHandlerArgs) {
    const {square, piece} = args

    if (!fromSquare) {
      if (!piece) {
        setFromSquare(null);
        setSquareStyles({});
        return
      }
      setFromSquare(square);
      let moves = chessGame.moves({ square: square as Square })
      setSquareStyles(moveStyles(moves))
      return;
    }

    setFromSquare(null);
    setSquareStyles({});
    try {
      makeMove(fromSquare, square);
    } catch {
      setFromSquare(square);
      let moves = chessGame.moves({ square: square as Square })
      setSquareStyles(moveStyles(moves))
    }
  }

  const reset = () => {
    setFromSquare(null)
    setSquareStyles({})
    chessGame.reset()
    setChessPosition(chessGame.fen())
  }

  const moveStyles = (moves: string[]) => {
    const r = {} as Record<string, React.CSSProperties>
    for (const m of moves) {
      let i;
      if (m.endsWith("+")) {
        i = m.slice(1, 3)
      } else {
        i = m.slice(-2)
      }
      r[i] = {
        boxShadow: "inset 0 0 10px 0 rgba(0, 0, 0, 0.5)",
        borderRadius: "100%",
      }
    }
    return r
  }

  const chessboardOptions: ChessboardOptions = {
    position: chessPosition,
    onPieceDrop,
    onSquareClick: (_) => handleClick(_),
    squareStyles: squareStyles,
    id: 'analysis-board'
  };

  return (
    <div className='container'>
      <div className='left_container'>
        <div className='board'>
          <Chessboard options={chessboardOptions} />;
        </div>
        {
          gameEnded &&
          <div style={{
            position: "absolute",
            width: "20vw",
            height: "30vh",
            backgroundColor: "rgb(44, 44, 44)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-around",
            padding: "5vh 0",
          }}>
            <p
              style={{
                color: "white",
              }}
            >Game Ended</p>
            <button onClick={() => {
              reset()
              setGameEnded(false)
            }}>New game</button>
          </div>
        }
      </div>
      <div className='right_container'>
          <div>
            <input type="range" value={botElo} onChange={(e) => setBotElo(Number(e.target.value))} min={800} max={2800} />
            <p 
              className='text-base'
            >Elo: {botElo}</p> 
            <p 
              className='text-base' 
              onClick={
                (e) => {
                  const elem = e.target as HTMLParagraphElement
                  elem.innerText = "(This is Stockfish UCI Elo, it's not equivalent to your chess.com/lichess rating )"
                  setTimeout(() => (elem.innerText = "?"), 7000)
                }}> ? </p>
          </div>
          <button onClick={() => reset()}>Reset</button>
      </div>
    </div>
  )
}

export default PlayerView
