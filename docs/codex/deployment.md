# Deployment Guide

## Required runtime settings

- `HF_MODEL_REPO`: Hugging Face model repository containing `m1_adapter.pt` and `play_model.pt`
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: server-only Supabase key; never expose it to browser code
- `HF_TOKEN`: required only when `HF_MODEL_REPO` is private
- `EXPORT_TOKEN`: bearer token required by `GET /api/export`

The container exposes the Node.js application on port `7860`. The Python ML
server remains internal on port `8788`.

## Model repository

Upload these files to one Hugging Face model repository:

```text
m1_adapter.pt
play_model.pt
```

The public game currently runs in M1-only mode because the Phase 1 Play Model
benchmark is not strong enough for production behavior decisions. Set
`REQUIRE_PLAY_MODEL=0`; `/api/play_action` remains unavailable until the model
is deliberately enabled.

## Hugging Face Spaces (primary, free)

Configure the following Space variables:

```text
HF_MODEL_REPO=jujoko/persona-collection-lab-models
REQUIRE_PLAY_MODEL=0
REQUIRE_SUPABASE=1
REQUIRE_SERVICE_ROLE=1
```

Configure these as Space secrets:

```text
HF_TOKEN
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
EXPORT_TOKEN
```

The README metadata selects the Docker SDK and port `7860`. A push to `main`
runs tests and synchronizes the repository to the Space through GitHub Actions.

Verify after the Space finishes rebuilding:

```bash
curl https://jujoko-persona-collection-lab.hf.space/api/health
curl -H "Authorization: Bearer <export-token>" \
  https://jujoko-persona-collection-lab.hf.space/api/export
```

Expected health response:

```json
{
  "ok": true,
  "node": true,
  "ml": {
    "ok": true,
    "m1_available": true,
    "play_model_available": true
  },
  "supabase_configured": true
}
```

## Fly.io (paid fallback)

The validated `fly.toml` requires a 2GB machine. Keep this only as a fallback
when an always-on deployment becomes worth the monthly cost.

## Local container verification

```bash
docker build -t persona-collection-lab .
docker run --rm -p 7860:7860 \
  -e HF_MODEL_REPO=jujoko/<model-repository> \
  -e HF_TOKEN=<token-if-private> \
  -e SUPABASE_URL=<url> \
  -e SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
  -e EXPORT_TOKEN=<long-random-value> \
  persona-collection-lab

curl http://localhost:7860/api/health
```
