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

    def analyze_pgn_string(self, pgn_input: str) -> str:
        engine = chess.engine.SimpleEngine.popen_uci(self.engine_path)
        
        pgn_io = StringIO(pgn_input)
        output_io = StringIO()

        while True:
            game = chess.pgn.read_game(pgn_io)
            if game is None:
                break

            node = game
            board = game.board()

            for move in game.mainline_moves():
                board.push(move)

                info = engine.analyse(board, chess.engine.Limit(time=0.1))
                print(info)
                score = info["score"].white()
                # best_move = info["pv"][0].uci() if info["pv"] else "??"

                eval_str = format_eval(score)
                comment = f"{eval_str}"

                current_node = node.variations[0]
                if current_node.comment:
                    current_node.comment += " " + comment
                else:
                    current_node.comment = comment

                node = current_node

            exporter = chess.pgn.StringExporter(headers=True, variations=True, comments=True)
            output_io.write(game.accept(exporter))

        engine.quit()
        return output_io.getvalue()

    def setup(self):

        @vpy.expose
        def analyze(pgn_data):
            return self.analyze_pgn_string(pgn_data)