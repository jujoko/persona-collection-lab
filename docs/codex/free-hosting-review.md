# Free Hosting Review

Reviewed on 2026-06-15 against the measured deployment image:

- image size: about 1.41 GB
- steady memory after loading all three encoders: about 1.40 GiB
- CPU container startup: about 11 seconds with cached public models

## Recommendation

Use **Hugging Face Docker Spaces CPU Basic** as the primary deployment target.

It provides 2 vCPU, 16 GB RAM, and 50 GB ephemeral disk at no charge. The
repository already uses the Docker Space metadata and port 7860, and GitHub
Actions can synchronize `main` to the existing Space.

The main tradeoff is that free Spaces sleep when unused. This is acceptable for
the current research prototype, but the first visitor after sleep must wait for
the container to wake and load the models.

## Alternatives

| Platform | Free resources / behavior | Fit |
|---|---|---|
| Hugging Face Spaces | 2 vCPU, 16 GB RAM, 50 GB ephemeral disk; sleeps when unused | Best fit |
| Render Free | Spins down after 15 minutes; approximately one-minute wake-up and limited free usage | Less suitable for model loading |
| Koyeb Free | 0.1 vCPU, 512 MB RAM, 2 GB disk | Cannot load the models |
| Google Cloud Run | Usage-based free allowance, but billing setup and possible image/build/storage charges | Good technical fallback, not reliably zero-cost |

Official references:

- https://huggingface.co/docs/hub/spaces-overview
- https://render.com/docs/free
- https://www.koyeb.com/docs/reference/instances
- https://cloud.google.com/run/pricing

## Required Space configuration

Variables:

```text
HF_MODEL_REPO=jujoko/persona-collection-lab-models
REQUIRE_PLAY_MODEL=0
REQUIRE_SUPABASE=1
REQUIRE_SERVICE_ROLE=1
```

Secrets:

```text
HF_TOKEN
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
EXPORT_TOKEN
```

`HF_TOKEN` must have read access to the private model repository. The GitHub
repository secret used by the sync workflow needs write access to the Space.
