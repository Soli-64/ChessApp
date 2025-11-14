from stockfish import Stockfish
import versapy as vpy

class StockfishBot:

    def __init__(self, model_path) -> None:
        self.stockfish = Stockfish(path=model_path)
        self.stockfish.update_engine_parameters({
            "UCI_LimitStrength": True,
            "UCI_Elo": 800,            
            "Skill Level": 1
        })
        self.setup()

    def setup(self):

        self.elo = vpy.SharedValue("bot_elo", 800, lambda e: self.stockfish.set_elo_rating(e))

        @vpy.expose
        def edit_bot(skill_level: int, depth: int, elo: int):
            
            if type(skill_level) == type(1) and 0<skill_level<21:
                self.stockfish.set_skill_level(skill_level)

            if type(depth) == type(1) and 1<depth:
                self.stockfish.set_depth(depth)

            if tuple(elo) == type(1) and 0<elo<2800:
                self.stockfish.set_elo_rating(elo)
        
        @vpy.expose
        def move(fen):
            if not fen:
                return "Error: fen sent invald"
            
            self.stockfish.set_fen_position(fen)
            best_move = self.stockfish.get_best_move_time(50)
            info = self.stockfish.get_evaluation()
            
            return {
                "move": best_move,
                "eval": info
            }