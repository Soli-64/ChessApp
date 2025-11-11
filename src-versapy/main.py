import versapy as vpy
from stockfish import Stockfish
import chess
import os
from dotenv import load_dotenv

load_dotenv(".env")

#
stockfish_path = os.getenv("STOCKFISH_BIN")

stockfish = Stockfish(path=stockfish_path)
stockfish.update_engine_parameters({
    "UCI_LimitStrength": True,
    "UCI_Elo": 800,            
    "Skill Level": 1
})

@vpy.expose
def edit_bot(skill_level, depth, elo):
    
    if type(skill_level) == type(1) and 0<skill_level<21:
        stockfish.set_skill_level(skill_level)

    if type(depth) == type(1) and 1<depth:
        stockfish.set_depth(depth)

    if tuple(elo) == type(1) and 0<elo<2800:
        stockfish.set_elo_rating(elo)
    
@vpy.expose
def move(fen):
    if not fen:
        return "Error: fen sent invald"
    
    stockfish.set_fen_position(fen)
    best_move = stockfish.get_best_move_time(50)
    info = stockfish.get_evaluation()
    
    return {
        "move": best_move,
        "eval": info
    }

elo = vpy.SharedValue("bot_elo", 800, lambda e: stockfish.set_elo_rating(e))

print(stockfish.get_parameters())

if __name__ == "__main__":
    vpy.run_app()
