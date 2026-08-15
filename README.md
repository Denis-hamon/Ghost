# GHOST MCP

**The ghost of every past run grades your patch draft.**

GHOST is a goal-free world model for coding agents, served as an
[MCP](https://modelcontextprotocol.io) server. It compares a candidate diff to
the geometry of past run outcomes (failures to avoid, successes to imitate)
and answers *before* you spend an execution. Outside its measured regime it
does not guess: **abstention is the product.**

- Advisory only — no tool replaces executing your tests.
- Zero LLM judges in the decision path — geometry + execution-grounded outcomes only.
- Reinforcement accepts only grounded outcomes (`grounded_by`: how the result was measured).

Website: [denis-hamon.github.io/ghost-mcp](https://denis-hamon.github.io/ghost-mcp)

## Serving honesty

| instrument | global | reliable regime |
|---|---|---|
| `risk_scan` (goal-free) | AUC 0.615–0.675 (rank, not verdict) | acc 0.952, Wilson 95% [0.773, 0.992] on the ~10% of queries it answers |
| everything else | — | `abstain` |

The calibration constants are shipped in `artifacts/` and served alongside the
pool — clients can audit the regime before trusting a verdict.

## Install

**Remote HTTP (recommended — weights + pool stay on the serving host):**

```sh
claude mcp add --transport http ghost http://<host>:8093/mcp
```

```json
{ "mcpServers": { "ghost": { "url": "http://<host>:8093/mcp" } } }
```

Auth: set `GHOST_TOKEN` on the server to require `Authorization: Bearer <token>`.
The server refuses to boot if the token is set but cannot be enforced
(fail-closed). Without a token, serve on an internal network only.

**Local stdio (colocated; needs torch + transformers):**

```json
{
  "mcpServers": {
    "ghost": {
      "command": ".venv/bin/python",
      "args": ["server/ghost_server.py"]
    }
  }
}
```

Env overrides: `LI_POOL_JSON`, `LI_POOL_NPZ` (served pool), `LI_RISK_CALIB`
(serving calibration), `LI_CALIBRATION` (gold-axis calibration),
`LI_LOG_PATH` (telemetry journal), `GHOST_HOST`, `GHOST_PORT`.

```sh
pip install -r requirements.txt
python server/ghost_http_server.py
```

## The 4-step contract

1. **`preflight_patch(repo_path, diff_text)`** — free deterministic checks
   (git-apply, py_compile, rewrite detection). Zero tokens, run first.
2. **`risk_scan(state_text, diff_text, reporter, exclude_task?)`** — goal-free
   attractor score; `reporter` = your agent id (flywheel stratification);
   returns `low_risk` / `high_risk` / `abstain` + a `call_id`.
   Since v0.4.0, abstentions name the nearest pool family and its coverage.
3. **Run your tests.**
4. **`report_outcome(call_id, passed, reporter, grounded_by)`** — the measured
   outcome and its method. Self-declared opinions are rejected from
   reinforcement.

Other tools: `near_mis_patches` (k nearest real outcomes), `assess_patch`
(gold axis — harness/evaluation mode only, needs the goal text).

## Repository layout

```
server/   ghost_server.py (stdio) + ghost_http_server.py (HTTP, mcp-2.0)
artifacts/  risk-scan-v8-calibration.json · predictor-mcp-calibration.json
docs/       GitHub Pages site (index.html + styles.css)
data/       pool files go here on the serving host (not shipped — see below)
```

## The pool

The served pool (v8, n=207 labeled patch runs) is produced and governed by the
[Latent Imagination](https://github.com/Denis-hamon/latent-imagination)
measurement project; the corpus release v0 is on Zenodo
([10.5281/zenodo.21837153](https://doi.org/10.5281/zenodo.21837153)).
Pool files (`latent-pool-*.json/.npz`) are deployment artifacts and are not
committed here — point `LI_POOL_JSON`/`LI_POOL_NPZ` at your copy.

## Provenance & license

Server code vendored from `latent-imagination/scripts/mcp/` at commit
`65afcf3`, adapted for standalone serving. Apache-2.0 (see `LICENSE`).
The website design language is adapted from
[langfuse.com](https://langfuse.com) (tokens extracted 2026-08-15).
