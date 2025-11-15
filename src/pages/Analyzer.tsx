import { Chess, Move, type Square } from "chess.js";
import { useEffect, useState } from "react";
import { Chessboard, type ChessboardOptions } from "react-chessboard";
import { invoke } from "versapy/api";
import "./styles/Analyzer.css";

interface Analysis {
  eval: string;
  bestMove: string | null;
}

const AnalyzerView = () => {
  const [chess, setChess] = useState<Chess | null>(null);
  const [moveList, setMoveList] = useState<string[]>([]); // SAN moves
  const [currentMove, setCurrentMove] = useState(0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [position, setPosition] = useState(chess?.fen())

  const evalToPercent = (evalStr: string): number => {
    if (evalStr == "None") {
      return 0
    } else {
      const clean = evalStr.replace(/[+#]/g, "");
      const value = parseFloat(clean) || 0;
      const clamped = Math.max(-10, Math.min(10, value));
      return ((clamped + 10) / 20) * 100;
    }
  };

  // 1. Charger le PGN
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const game = new Chess();
      game.loadPgn(text)

      setChess(game);

      const players = chess?.getHeaders()
      console.log(chess, players)

      const moves = game.history();
      setMoveList(moves);
      setCurrentMove(0);
      goToMove(0); 

    };
    reader.readAsText(file);
  };

  // 2. Aller à un coup
  const goToMove = async (index: number) => {
    if (!chess || index < 0 || index > moveList.length) return;

    // Réinitialise + rejoue
    chess.reset();
    for (let i = 0; i < index; i++) {
      const san = moveList[i];
      const move = chess.move(san);
      if (!move) {
        console.error("Mouvement invalide:", san);
        return;
      }
    }

    setCurrentMove(index);
    setPosition(chess.fen())
    await analyzePosition();
  };

  // 3. Analyse
  const analyzePosition = async () => {
    setIsAnalyzing(true);
    try {
      const result = await invoke("analyze_position", { fen_data: chess?.fen() }) as Analysis;
      setAnalysis(result);
    } catch (err: any) {
      console.error("Analyse échouée:", err);
      setAnalysis({ eval: "Erreur", bestMove: null });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (chess && currentMove === 0) {
      console.log("Position analyzed sent:", chess.fen())
      analyzePosition();
    }
  }, [chess]);

  const totalMoves = moveList.length;

  const BoardConfig: ChessboardOptions = {
    position: position,
    arrows: analysis?.bestMove ? [{
      startSquare: analysis.bestMove.substring(0, 2) as Square,
      endSquare: analysis.bestMove.substring(2, 4) as Square,
      color: 'rgb(0, 128, 0)'
    }] : undefined
  }; 

  return (
    <div className="analyzer">
      <div className="file-input">
        <input type="file" accept=".pgn" onChange={handleFileChange} />
      </div>

      {chess && (
        <>
          <div className="board">
          <div className="eval-bar">
            <div 
              className="eval-fill"
              style={{ 
                height: `${evalToPercent(analysis?.eval || "0")}%` 
              }}
            />
          </div>
            <Chessboard options={BoardConfig} />
          </div>

          <div className="navigation">
            <button onClick={() => goToMove(0)} disabled={currentMove === 0}>
              Début
            </button>
            <button onClick={() => goToMove(currentMove - 1)} disabled={currentMove === 0}>
              Précédent
            </button>

            <span className="move-info">
              {currentMove === 0 ? "Position initiale" : `Coup ${currentMove} / ${totalMoves}`}
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

          <div className="analysis-panel">
            <h3>Analyse {isAnalyzing && "(calcul...)"}</h3>
            {analysis && (
              <>
                <p>
                  <strong>Évaluation :</strong>{" "}
                  <span
                    className={
                      analysis.eval.startsWith("+")
                        ? "positive"
                        : analysis.eval.startsWith("-")
                        ? "negative"
                        : ""
                    }
                  >
                    {analysis.eval}
                  </span>
                </p>
                {analysis.bestMove && (
                  <p><strong>Meilleur coup :</strong> {analysis.bestMove}</p>
                )}
              </>
            )}
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