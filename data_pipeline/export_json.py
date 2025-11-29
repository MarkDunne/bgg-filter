"""Export enriched CSV to JSON for the frontend."""

import ast
import json
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).parent / "data"


def safe_literal_eval(val):
    """Safely evaluate string representations of lists."""
    if pd.isna(val):
        return []
    try:
        return ast.literal_eval(val)
    except (ValueError, SyntaxError):
        return []


def main():
    df = pd.read_csv(DATA_DIR / "boardgames_enriched.csv")

    # Convert string representations of lists to actual lists
    list_columns = ["categories", "mechanics", "types", "bestwith", "recommendedwith"]
    for col in list_columns:
        df[col] = df[col].apply(safe_literal_eval)

    # Extract ID from link (e.g., https://boardgamegeek.com/boardgame/363622 -> 363622)
    df["id"] = df["link"].str.extract(r"/boardgame/(\d+)").astype(int)

    # Drop columns we don't need in frontend
    drop_cols = [
        "abstracts_rank", "cgs_rank", "childrensgames_rank", "familygames_rank",
        "partygames_rank", "strategygames_rank", "thematic_rank", "wargames_rank",
        "is_expansion", "rank"
    ]
    df = df.drop(columns=[c for c in drop_cols if c in df.columns])

    # Convert to records and write JSON (handle NaN -> None -> null in JSON)
    games = df.where(pd.notna(df), None).to_dict(orient="records")

    output_path = DATA_DIR / "boardgames.json"
    with open(output_path, "w") as f:
        json.dump(games, f)

    print(f"Exported {len(games)} games to {output_path}")


if __name__ == "__main__":
    main()
