[working-directory: 'data_pipeline']
gather_data_small:
    uv run python main.py -i data/boardgames_ranks.csv -o data/boardgames_enriched.csv -n 100 --pareto-neighbors 100 --verbose

[working-directory: 'data_pipeline']
gather_data:
    uv run python main.py -i data/boardgames_ranks.csv -o data/boardgames_enriched.csv -n 1000 --pareto-neighbors 100 --verbose
