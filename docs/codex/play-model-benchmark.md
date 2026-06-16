# Play Model Phase 1 Benchmark

Date: 2026-06-15

The fixed benchmark contains 15 cases: three intended behavior profiles for
each of the five adult events.

## Result

- top-1 accuracy: 6/15 (40%)
- average top-1 margin: 0.0472
- low-confidence cases with margin below 0.05: 9/15
- event accuracy: ME001 33%, ME002 33%, ME003 67%, ME004 33%, ME005 33%

The model frequently selects one preferred action regardless of the persona:

- ME001 tends toward `reports_to_authorities`
- ME002 tends toward `refuses_illegal`
- ME004 tends toward `finds_a_whistleblower`
- ME005 tends toward `refuses_order`

## Decision

Phase 1 is technically deployable but is not reliable enough to become the
default behavior selector. Keep the current rule-based game decision path and
expose Play Model only through the experimental `/api/play_action` endpoint.

Before promotion, improve the training objective with event/action supervision
and evaluate against a held-out labeled behavior set. Increasing the number of
skills/hobbies samples alone is unlikely to solve the ethical-action bias.

Reproduce locally:

```bash
python ml/benchmark_play_model.py --device cuda
```
