import { Chess } from "chess.js";
import { useCallback, useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import { invoke } from "versapy/api";

interface MoveAnalysis {
  move: string;        // ex: "e2e4"
  eval: string;        // ex: "+0.45" ou "#3"
  bestMove?: string;   // ex: "d2d4"
  isMate: boolean;
}

const AnalyzerView = () => {
  const [pgn, setPgn] = useState<string>("");
  const [analyzedPgn, setAnalyzedPgn] = useState<string>("");
  const [chess, setChess] = useState<Chess | null>(null);
  const [currentMove, setCurrentMove] = useState(0);
  const [moveHistory, setMoveHistory] = useState<MoveAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger et analyser le PGN
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("file change")
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      //@ts-ignore
      const rawPgn = event.target.result;
      setPgn(rawPgn as string);
      setIsLoading(true);

      try {
        const result = await invoke("analyze", { pgn_data: rawPgn });
        setAnalyzedPgn(result as string);
      } catch (err) {
        console.error("Analyse échouée", err);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Parser le PGN annoté
  const parseAnalyzedPgn = useCallback(() => {
    if (!analyzedPgn || !pgn) return;

    const game = new Chess();
    game.loadPgn(analyzedPgn);
    const history = game.history({ verbose: true });
    const moves: MoveAnalysis[] = [];

    let node: any = game;
    console.log(node)
    for (const move of history) {
        // if (move.starts)
        const comment = node._comments[history.indexOf(move)] || "";
        
        // Extraire [%eval ...] et [uci]
        const evalMatch = comment.match(/\[%eval ([^\]]+)\]/);
        const bestMoveMatch = comment.match(/\[([a-h][1-8][a-h][1-8])\]/);

        const evalStr = evalMatch ? evalMatch[1] : "?";
        const isMate = evalStr.includes("#");
        const bestMove = bestMoveMatch ? bestMoveMatch[1] : undefined;

        moves.push({
            move: move.lan,
            eval: isMate ? evalStr : evalStr,
            bestMove,
            isMate,
        });
    }

    setMoveHistory(moves);
    setChess(game);
    setCurrentMove(0);
  }, [analyzedPgn, pgn]);

  useEffect(() => {
    if (analyzedPgn) {
      parseAnalyzedPgn();
    }
  }, [analyzedPgn]);

  // Navigation
  const goToMove = (index: number) => {
    if (!chess || index < 0 || index > moveHistory.length) return;
    console.log(index)
    // chess.reset();
    const moves = chess.history({ verbose: true });
    console.log(moves)
    for (let i = 0; i < index; i++) {
      const [from, to] = [moves[i].from, moves[i].to]
      chess.move({from, to, promotion: "q"});
    }
    setCurrentMove(index);
  };

  const currentAnalysis = currentMove < moveHistory.length ? moveHistory[currentMove] : null;
  const totalMoves = moveHistory.length;

  return (
    <div className="analyzer">
      <div className="file-input">
        <input type="file" accept=".pgn" onChange={handleFileChange} />
      </div>

      {isLoading && <div>Analyse en cours...</div>}

      {chess && totalMoves > 0 && (
        <>
          <div className="board">
            <Chessboard position={chess.fen()} />
          </div>

          <div className="navigation">
            <button onClick={() => goToMove(0)} disabled={currentMove === 0}>
              Début
            </button>
            <button onClick={() => goToMove(currentMove - 1)} disabled={currentMove === 0}>
              Précédent
            </button>

            <span className="move-info">
              Coup {currentMove + 1} / {totalMoves + 1}
            </span>

            <button onClick={() => goToMove(currentMove + 1)} disabled={currentMove === totalMoves}>
              Suivant
            </button>
            <button onClick={() => goToMove(totalMoves)} disabled={currentMove === totalMoves}>
              Fin
            </button>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(currentMove / totalMoves) * 100}%` }}
            />
          </div>

          {currentAnalysis && (
            <div className="analysis-panel">
              <h3>Analyse du coup</h3>
              <p>
                <strong>Joué :</strong> {currentAnalysis.move}
              </p>
              <p>
                <strong>Évaluation :</strong>{" "}
                <span className={currentAnalysis.eval.startsWith('+') ? 'positive' : currentAnalysis.eval.startsWith('-') ? 'negative' : ''}>
                  {currentAnalysis.eval}
                </span>
              </p>
              {currentAnalysis.bestMove && (
                <p>
                  <strong>Meilleur coup suggéré :</strong> {currentAnalysis.bestMove}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyzerView;