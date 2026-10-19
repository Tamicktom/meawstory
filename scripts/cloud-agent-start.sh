#!/usr/bin/env bash
# Boot script for the Cloud Agent VM.
# The saved environment runs /opt/meawstory/start.sh. Keep that copy identical.
set -euo pipefail

export PATH="/opt/meawstory/bin:/home/ubuntu/.bun/bin:${PATH}"

workspace="${CLOUD_AGENT_WORKSPACE:-/workspace}"
cd "$workspace"

example_placeholder="sk-proj-..."

if [[ ! -f .env ]]; then
  if [[ ! -f example.env ]]; then
    echo "example.env is missing, so .env cannot be created." >&2
    exit 1
  fi
  cp example.env .env
fi

if ! grep -Eq '^BETTER_AUTH_SECRET=.+' .env; then
  secret="$(openssl rand -hex 32)"
  tmp="$(mktemp)"
  awk -v secret="$secret" '
    BEGIN { done = 0 }
    /^BETTER_AUTH_SECRET=/ && done == 0 {
      print "BETTER_AUTH_SECRET=" secret
      done = 1
      next
    }
    { print }
    END {
      if (done == 0) {
        print "BETTER_AUTH_SECRET=" secret
      }
    }
  ' .env > "$tmp"
  mv "$tmp" .env
fi

if [[ -f env/server.ts ]] && grep -Eq '^[[:space:]]*OPENAI_API_KEY:' env/server.ts; then
  if [[ -z "${OPENAI_API_KEY:-}" || "${OPENAI_API_KEY}" == "$example_placeholder" ]]; then
    echo "OPENAI_API_KEY is required by env/server.ts. Add it as a Cloud Agent secret named OPENAI_API_KEY." >&2
    exit 1
  fi

  python3 - "$example_placeholder" <<'PY'
import os
import sys
from pathlib import Path

placeholder = sys.argv[1]
key = "OPENAI_API_KEY"
value = os.environ.get(key, "")
if not value or value == placeholder:
    raise SystemExit(1)

path = Path(".env")
lines = path.read_text().splitlines()
prefix = key + "="
found = False
updated: list[str] = []
for line in lines:
    if line.startswith(prefix):
        updated.append(prefix + value)
        found = True
    else:
        updated.append(line)
if not found:
    updated.append(prefix + value)

text = "\n".join(updated)
if not text.endswith("\n"):
    text += "\n"
path.write_text(text)
PY
fi

if [[ "${CLOUD_AGENT_SKIP_BOOTSTRAP:-}" == "1" ]]; then
  exit 0
fi

if ! pg_isready -h 127.0.0.1 -p 5432 -q; then
  sudo pg_ctlcluster 18 main start
fi

ready=0
for _ in $(seq 1 30); do
  if pg_isready -h 127.0.0.1 -p 5432 -q; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "$ready" -ne 1 ]]; then
  echo "PostgreSQL did not become ready on 127.0.0.1:5432" >&2
  exit 1
fi

sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER USER postgres WITH PASSWORD 'postgres';" >/dev/null

bun run db:migrate
bun run db:seed

# package.json "dev" starts Docker and runs Next with --bun. Docker is not
# available here, and --bun makes Turbopack fail to resolve pg.
exec /opt/meawstory/bin/node ./node_modules/next/dist/bin/next dev --hostname 0.0.0.0 --port 3000
