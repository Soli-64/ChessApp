import versapy as vpy
import os
from dotenv import load_dotenv
from Engine.bot import StockfishBot
from Engine.analyzer import Analyzer

load_dotenv(".env")
STOCKFISH_BIN = os.getenv("STOCKFISH_BIN")

engine = StockfishBot(STOCKFISH_BIN)
analyzer = Analyzer(STOCKFISH_BIN)

if __name__ == "__main__":
    vpy.run_app()
