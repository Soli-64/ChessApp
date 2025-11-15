import { Chess, type Square } from "chess.js";
import { useEffect, useState } from "react";
import { Chessboard, type ChessboardOptions } from "react-chessboard";
import { invoke } from "versapy/api";
import "./styles/Analyzer.css";

interface Analysis {
  eval: string;
  bestMove: string | null;
}

const AnalyzerView = () => {
  
  // game instance
  const [chess, setChess] = useState<Chess | null>(null);
  
  const [moveList, setMoveList] = useState<string[]>([]);
  const [currentMove, setCurrentMove] = useState(0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  
  const [gameHeaders, setGameHeaders] = useState<null|Record<string,string>>(null) 
  const [boardOrientation, setBoardOrientation] = useState<"white"|"black">("white")

  const [position, setPosition] = useState(chess?.fen())
  
  // Loader
  const [loader, setLoader] = useState<boolean>(false);

  const evalToPercent = (evalStr: string): number => {
    if (currentMove === 0) {
      return 50 // first move, so return mid
    }
    if (evalStr === "None") { // Forced checkmate possible or checkmate
      return 0
    } else {
      const clean = evalStr.replace(/[+#]/g, "");
      const value = parseFloat(clean) || 0;
      const clamped = Math.max(-10, Math.min(10, value));
      return ((clamped + 10) / 20) * 100;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const game = new Chess();
      game.loadPgn(text)

      setChess(game);
      
      const headers = game?.getHeaders()
      console.log(headers)
      setGameHeaders(headers || null)

      const moves = game.history();
      setMoveList(moves);
      setCurrentMove(0);
      goToMove(0); 

    };
    reader.readAsText(file);
  };

  const goToMove = async (index: number) => {
    if (!chess || index < 0 || index > moveList.length) return;
    if (loader) return;
    
    chess.reset();
    for (let i = 0; i < index; i++) {
      const san = moveList[i];
      const move = chess.move(san);
      if (!move) {
        console.error("Invalid move:", san);
        return;
      }
    }

    setCurrentMove(index);
    setPosition(chess.fen())
    await analyzePosition();
  };

  const analyzePosition = async () => {
    setLoader(true);
    try {
      const result = await invoke("analyze_position", { fen_data: chess?.fen() }) as Analysis;
      setAnalysis(result);
    } catch (err: any) {
      console.error("Analyzis failed:", err);
      setAnalysis({ eval: "Error", bestMove: null });
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    if (chess && currentMove === 0) {
      analyzePosition();
    }
  }, [chess]);

  const totalMoves = moveList.length;

  const BoardConfig: ChessboardOptions = {
    position: position,
    boardOrientation,
    arrows: analysis?.bestMove ? [{
      startSquare: analysis.bestMove.substring(0, 2) as Square,
      endSquare: analysis.bestMove.substring(2, 4) as Square,
      color: 'rgb(0, 128, 0)'
    }] : undefined
  }; 

  return (
    <div className="analyzer">
      
      {
        !chess && 
        <div className="file-input">
          <input type="file" accept=".pgn" onChange={handleFileChange} />
        </div>
      }

      {chess && (
        <>
          <div className="analysis-left-container">
            <div className="board-container">
              <div className="eval-bar">
                  <div 
                    className="eval-fill"
                    style={{ 
                      height: `${evalToPercent(analysis?.eval || "0")}%` 
                    }}>
                  </div>
                </div>
              <div className="analysis-board">
                <Chessboard options={BoardConfig} />
              </div>
              <div className="action-btns">
                <button onClick={() => setBoardOrientation(boardOrientation === "black" ? "white" : "black")}>
                  Sw
                </button>
              </div>
            </div>

            <div className="navigation">
              <button onClick={() => goToMove(0)} disabled={currentMove === 0}>
                Start
              </button>
              <button onClick={() => goToMove(currentMove - 1)} disabled={currentMove === 0}>
                {"<"}
              </button>

              <span className="move-info">
                {currentMove === 0 ? "Position initiale" : `Coup ${currentMove} / ${totalMoves}`}
              </span>

              <button onClick={() => goToMove(currentMove + 1)} disabled={currentMove === totalMoves}>
                {">"}
              </button>
              <button onClick={() => goToMove(totalMoves)} disabled={currentMove === totalMoves}>
                End
              </button>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(currentMove / totalMoves) * 100}%` }}
              />
            </div>
          </div>

          <div className="analysis-right-container">
            {
              gameHeaders &&
              <>
                <div className="analysis-headers">
                  <p>White: {gameHeaders.White} ({gameHeaders.WhiteElo})</p>
                  <p>Black: {gameHeaders.Black} ({gameHeaders.BlackElo})</p>
                  <div className="move-list">
                    {moveList.slice(0, currentMove).map(m => (
                      <p>{m}</p>
                    ))}
                  </div>
                </div>
              </>
            }
          </div>

        </>
      )}

      {!chess && (
        <div className="placeholder">
          <p>Chargez un fichier PGN pour commencer.</p>
        </div>
      )}
    </div>
  );
};

export default AnalyzerView;