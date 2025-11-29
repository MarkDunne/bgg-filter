[working-directory: 'data_pipeline']
gather_data_small:
    uv run python main.py -n 100 --max-rank 7 --verbose

[working-directory: 'data_pipeline']
gather_data:
    uv run python main.py -n 1000 --max-rank 7 --verbose

[working-directory: 'data_pipeline']
export_json: gather_data
    uv run python export_json.py
    cp data/boardgames.json ../frontend/src/data/games.json


[working-directory: 'frontend']
build:
    pnpm build

[working-directory: 'frontend']
dev:
    pnpm dev
