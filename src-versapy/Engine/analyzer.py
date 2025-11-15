import chess
import chess.engine
import chess.pgn
import sys
from io import StringIO

import versapy as vpy

def format_eval(score: chess.engine.Score) -> str:
    if score.is_mate():
        mate_in = score.mate()
        sign = "+" if mate_in > 0 else "-"
        return f"[%eval #{sign}{abs(mate_in)}]"
    else:
        cp = score.score()
        if cp is None:
            return "[%eval ?]"
        return f"[%eval {cp / 100.0:+.2f}]"

class Analyzer:

    def __init__(self, model_path) -> None:
        self.engine_path = model_path
        self.setup()

    def analyze_position(self, fen_data: str):
        try:
            board = chess.Board(fen_data)
            with chess.engine.SimpleEngine.popen_uci(self.engine_path) as engine:
                info = engine.analyse(board, chess.engine.Limit(time=0.5))
                
                print(info["score"].white().score())
                score = info["score"].white().score() / 100 if info["score"].white().score() else None
                pv = info.get("pv", [])
                best_move = pv[0].uci() if pv else None

                return {
                    "eval": str(score),     
                    "bestMove": best_move 
                }
        except Exception as e:
            print("Erreur analyse:", e)
            return {"eval": "Erreur", "bestMove": None}

    def setup(self):
        
        @vpy.expose
        def analyze_position(fen_data):
            return self.analyze_position(fen_data)

        