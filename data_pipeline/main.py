"""BGG data pipeline: fetch game details, compute pareto-optimal games."""

import logging
import os
from itertools import batched
from pathlib import Path
from xml.etree import ElementTree as ET

import click
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from requests import HTTPError, Session
from requests_cache import CacheMixin
from requests_ratelimiter import LimiterMixin
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)
from tqdm import tqdm

from utils import best_with_map, recommended_with_map

load_dotenv()
log = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent / "data"
BGG_API = "https://boardgamegeek.com/xmlapi2/thing"


class BGGSession(CacheMixin, LimiterMixin, Session):
    """Requests session with caching and rate limiting for BGG API."""

    def __init__(self):
        super().__init__(per_second=1)
        if token := os.getenv("BGG_BEARER_TOKEN"):
            self.headers["Authorization"] = f"Bearer {token}"


session = BGGSession()


def parse_game(item: ET.Element) -> dict:
    """Parse a single game from BGG XML response."""

    def val(path: str, attr: str = "value") -> str:
        """Get attribute from element at path, or '0' if missing."""
        if (el := item.find(path)) is not None:
            return el.attrib.get(attr, "0")
        return "0"

    def links(link_type: str, attr: str = "value") -> list[str]:
        """Get all link values of a given type."""
        return [
            el.attrib[attr]
            for el in item.findall(f'link[@type="boardgame{link_type}"]')
        ]

    game_id = int(item.attrib["id"])

    return {
        "id": game_id,
        "link": f"https://boardgamegeek.com/boardgame/{game_id}",
        "complexity": float(val("statistics/ratings/averageweight")),
        "min_players": int(val("minplayers")),
        "max_players": int(val("maxplayers")),
        "playing_time": int(val("playingtime")),
        "categories": links("category"),
        "mechanics": links("mechanic"),
        "types": [
            r.attrib["name"]
            for r in item.findall('statistics/ratings/ranks/rank[@type="family"]')
        ],
        **{
            p.attrib["name"]: p.attrib["value"]
            for p in item.findall("poll-summary/result")
        },
    }


@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(min=2, max=30),
    retry=retry_if_exception_type(HTTPError),
)
def _fetch_batch(ids: list[int]) -> list[dict]:
    """Fetch a single batch of games from BGG API."""
    resp = session.get(BGG_API, params={"id": ",".join(map(str, ids)), "stats": 1})
    resp.raise_for_status()
    return [parse_game(item) for item in ET.fromstring(resp.text).findall("item")]


def fetch_games(game_ids: list[int], batch_size: int = 20) -> pd.DataFrame:
    """Fetch game details from BGG API in batches."""
    games = []
    for batch in tqdm(list(batched(game_ids, batch_size)), desc="Fetching from BGG"):
        games.extend(_fetch_batch(list(batch)))
    return pd.DataFrame(games).set_index("id")


def is_pareto_efficient(costs: np.ndarray) -> np.ndarray:
    """Find pareto-efficient points (minimizing all costs).

    Source: https://stackoverflow.com/a/40239615 (CC BY-SA 4.0)
    """
    is_efficient = np.arange(costs.shape[0])
    n_points = costs.shape[0]
    next_point_index = 0
    while next_point_index < len(costs):
        nondominated_point_mask = np.any(costs < costs[next_point_index], axis=1)
        nondominated_point_mask[next_point_index] = True
        is_efficient = is_efficient[nondominated_point_mask]
        costs = costs[nondominated_point_mask]
        next_point_index = np.sum(nondominated_point_mask[:next_point_index]) + 1
    is_efficient_mask = np.zeros(n_points, dtype=bool)
    is_efficient_mask[is_efficient] = True
    return is_efficient_mask


def add_pareto_ranks(df: pd.DataFrame, max_rank: int = 10) -> pd.DataFrame:
    """Assign pareto ranks using iterative non-dominated sorting.

    Rank 1 = pareto optimal (no game dominates it)
    Rank 2 = pareto optimal after removing rank 1
    Rank 3 = pareto optimal after removing ranks 1-2
    etc.

    Args:
        df: DataFrame with bayesaverage and complexity columns.
        max_rank: Maximum number of ranking iterations to run.
    """
    df = df.dropna(subset=["bayesaverage", "complexity"]).copy()
    df["pareto_rank"] = 0

    remaining = df.index.tolist()
    for rank in range(1, max_rank + 1):
        if not remaining:
            break

        subset = df.loc[remaining]
        # Negate bayesaverage to convert "maximize rating" to "minimize"
        costs = np.column_stack([-subset["bayesaverage"].values, subset["complexity"].values])
        is_pareto = is_pareto_efficient(costs)

        pareto_ids = subset.index[is_pareto].tolist()
        df.loc[pareto_ids, "pareto_rank"] = rank
        remaining = [i for i in remaining if i not in pareto_ids]

    # Anything left gets max_rank + 1
    if remaining:
        df.loc[remaining, "pareto_rank"] = max_rank + 1

    return df


@click.command()
@click.option(
    "-i",
    "--input",
    "input_path",
    type=click.Path(exists=True, path_type=Path),
    default=DATA_DIR / "boardgames_ranks.csv",
)
@click.option(
    "-o",
    "--output",
    "output_path",
    type=click.Path(path_type=Path),
    default=DATA_DIR / "boardgames_enriched.csv",
)
@click.option(
    "-n", "--limit", type=int, default=100, help="Limit games processed (for testing)"
)
@click.option(
    "--max-rank",
    type=int,
    default=10,
    help="Maximum pareto rank iterations (rank 1 = optimal, rank 2 = optimal after removing rank 1, etc.)",
)
@click.option("-v", "--verbose", is_flag=True)
def main(
    input_path: Path,
    output_path: Path,
    limit: int | None,
    max_rank: int,
    verbose: bool,
):
    """Build enriched boardgame dataset with pareto analysis."""
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO, format="%(message)s"
    )

    # Load rankings
    df = (
        pd.read_csv(input_path)
        .query("average > 0 and bayesaverage > 0")
        .set_index("id")
    )
    df = df.sort_values(by="bayesaverage", ascending=False)
    if limit:
        df = df.head(limit)
    log.info(f"Loaded {len(df)} games")

    # Fetch and join API details
    details = fetch_games(list(df.index))
    df = df.join(details, how="inner")
    df["bestwith"] = df["bestwith"].map(best_with_map)
    df["recommendedwith"] = df["recommmendedwith"].map(recommended_with_map)
    df = df.drop(columns=["recommmendedwith"])
    log.info(f"Enriched {len(df)} games")

    # Compute pareto ranks
    df = add_pareto_ranks(df, max_rank)
    log.info(f"Found {(df['pareto_rank'] == 1).sum()} pareto-optimal games (rank 1)")
    log.info(f"Found {(df['pareto_rank'] <= max_rank).sum()} ranked games (ranks 1-{max_rank})")
    for rank in range(1, max_rank + 1):
        count = (df["pareto_rank"] == rank).sum()
        if count > 0:
            log.debug(f"  Rank {rank}: {count} games")

    # Save
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    log.info(f"Saved to {output_path}")


if __name__ == "__main__":
    main()
