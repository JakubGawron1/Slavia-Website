#!/usr/bin/env bash
# Vercel Ignored Build Step — exit 0 = pomiń build, exit 1 = buduj.
# Gałęzie inne niż main: pomijamy preview, gdy HEAD == tip main (ten sam commit).
set -uo pipefail

branch="${VERCEL_GIT_COMMIT_REF:-}"
sha="${VERCEL_GIT_COMMIT_SHA:-}"

echo "[vercel-ignore] branch=${branch:-?} sha=${sha:-?}"

if [[ "${branch}" == "main" ]]; then
  echo "[vercel-ignore] main → build"
  exit 1
fi

if [[ -z "${sha}" ]]; then
  echo "[vercel-ignore] brak VERCEL_GIT_COMMIT_SHA → build (bezpieczny fallback)"
  exit 1
fi

if ! git fetch origin main --depth=1 2>/dev/null; then
  echo "[vercel-ignore] nie udało się pobrać origin/main → build"
  exit 1
fi

if ! main_sha="$(git rev-parse origin/main 2>/dev/null)"; then
  echo "[vercel-ignore] brak origin/main → build"
  exit 1
fi

if [[ "${sha}" == "${main_sha}" ]]; then
  echo "[vercel-ignore] ${branch} wskazuje na main@${main_sha:0:7} → skip"
  exit 0
fi

echo "[vercel-ignore] ${branch}@${sha:0:7} ≠ main@${main_sha:0:7} → build"
exit 1
