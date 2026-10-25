# Pharos AI Worker

`worker.js` is generated from `worker.template.js` by `python build_demo.py`.
The worker exposes `/health`, `/chat`, and `/triage` using Workers AI. Requests
from the GitHub Pages origin are allowed, and AI requests are subject to the
daily limits stored in the `LIMITS` KV namespace.

The deployment workflow creates or reuses the `coa-crosscheck-limits` namespace
with Wrangler and fills its real ID into `wrangler.toml`. Configure the
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets before
deploying. The token needs Workers Scripts edit, Workers KV Storage edit, and
Account Settings read permissions.

To build the demo with hosted answers enabled:

```bash
python build_demo.py --cloud-url https://pharos-ai-worker.<subdomain>.workers.dev
```

Running `python build_demo.py` without `--cloud-url` rebuilds the worker and
leaves hosted answers disabled in `index.html`.
