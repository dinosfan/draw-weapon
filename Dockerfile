FROM node:22-bookworm-slim AS node-runtime
FROM python:3.13-slim-bookworm
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
RUN apt-get update && apt-get install -y --no-install-recommends libstdc++6 libatomic1 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir -r requirements-cloud.txt && node --check cloud-server.cjs
RUN node scripts/download-game-audio.cjs && python scripts/import-game-audio.py
ENV NODE_ENV=production PYTHON_BIN=/usr/local/bin/python PYTHONDONTWRITEBYTECODE=1 DATA_DIR=/tmp/draw-weapon PORT=10000
EXPOSE 10000
CMD ["node", "cloud-server.cjs"]
