# Functional programming conformance

This repository is checked against the house functional-programming guidelines.
Functional programming here means nine specific things:

- **explicit inputs** — what a function needs arrives through its parameters
- **explicit outputs** — what a function produces leaves through its return type
- **immutable values** — bindings and fields do not change after construction
- **pure transformations** — same input, same output, no observable effect
- **typed errors** — failure is a value in the signature, not an escape
- **explicit state transitions** — state changes are named and returned
- **composition** — small named steps combined, rather than one long body
- **effects pushed outward** — I/O, clocks, randomness and logging live at the edge
- **illegal states excluded by types** — the compiler rejects what must not happen

Stateful code is not exempt from all of this. Websocket handlers, TCP
connections, stateful clients and actor loops legitimately hold mutable state, and
the scanner relaxes the mutability rules for modules whose path marks them as such
(`ws/`, `socket/`, `conn/`, `session/`, `pool/`, `cache/`, `stream/`, `actor/`,
`fsm/`, `state_machine/`). Everything else — typed errors, exhaustive matching,
composition, effects at the edge — still applies there. Likewise, modules that
*are* the outward edge (`main`, `bin/`, `effects/`, `io/`, `adapters/`, `infra/`,
`transport/`, `handlers/`, `routes/`, `db/`, `telemetry/`) are allowed to perform
effects: that is the point of pushing effects outward.

## Running the check

```sh
python3 tools/fp-conformance/fp_conformance.py .                    # report
python3 tools/fp-conformance/fp_conformance.py . --limit 200        # more detail
python3 tools/fp-conformance/fp_conformance.py . --json /tmp/fp.json
```

Stdlib Python 3 only — no toolchain, no dependencies, no network — so it runs
identically on a laptop and on a CI runner.

## The budget, and why CI is not red today

`tools/fp-conformance/budget.json` records the per-rule counts at the moment this
check was introduced: **1,449 findings across 167 files
and 23,339 lines**. CI compares against that budget and fails only when a
rule's count *increases*. The existing backlog blocks nobody; new violations do.

The budget is a ratchet. It should only ever move down. When you clear a class of
violation, re-baseline in the same commit as the fix:

```sh
python3 tools/fp-conformance/fp_conformance.py . \
    --write-budget tools/fp-conformance/budget.json
```

Raising the budget to turn CI green defeats the whole mechanism. Fix the code.

## Baseline for this repository

| rule | count | severity | principle | what it flags |
|---|---:|---|---|---|
| `TS002` | 391 | warn | immutable values | mutable `let` binding |
| `TS008` | 327 | warn | effects pushed outward | direct console effect in library code |
| `TS005` | 219 | warn | explicit inputs | `any` escapes the type system |
| `TS004` | 158 | warn | pure transformations | in-place array mutation |
| `TS009` | 146 | warn | explicit inputs | ambient impurity (clock / randomness / env) read inside pure code |
| `TS006` | 134 | warn | typed errors | `throw` as control flow |
| `TS003` | 63 | error | explicit state transitions | module-level mutable binding |
| `XX002` | 7 | warn | explicit outputs | long function body |
| `XX001` | 4 | warn | composition | oversized module |

## How to clear the top offenders

### `TS002` — mutable `let` binding

*immutable values* · 391 occurrences at baseline

Prefer `const`. Where a value genuinely evolves, derive it with `reduce`/`map` or model the transition explicitly.

### `TS008` — direct console effect in library code

*effects pushed outward* · 327 occurrences at baseline

Route through the ores-otel logger so the effect is observable and lives at the boundary.

### `TS005` — `any` escapes the type system

*explicit inputs* · 219 occurrences at baseline

Give the value a real type, or `unknown` plus a narrowing guard, so illegal states stay excluded by types.

### `TS004` — in-place array mutation

*pure transformations* · 158 occurrences at baseline

Use the copying form — spread, `toSorted`, `toReversed`, `concat`, `filter` — so callers' values are not modified.

### `TS009` — ambient impurity (clock / randomness / env) read inside pure code

*explicit inputs* · 146 occurrences at baseline

Take the value as a parameter — inject a clock, a seeded RNG, or a config object — so the function stays testable and deterministic.

### `TS006` — `throw` as control flow

*typed errors* · 134 occurrences at baseline

Return a discriminated `Result`/`Either` so the failure appears in the signature instead of escaping it.

### `TS003` — module-level mutable binding

*explicit state transitions* · 63 occurrences at baseline

Module-scope `let`/`var` is shared global state. Hold it in a value passed to the functions that need it.

### `XX002` — long function body

*explicit outputs* · 7 occurrences at baseline

A body over 60 lines is usually several transformations. Extract named, individually testable steps and compose them.

### `XX001` — oversized module

*composition* · 4 occurrences at baseline

Split into focused modules; the guidelines call for modularisation rather than a single large entry point.

## Language-native enforcement

The Python scanner is the portable floor — it runs everywhere and costs nothing.
The real type-level enforcement belongs to each toolchain, and those configs ship
in this tree:

- **Rust** — `[lints.clippy]` in `Cargo.toml`. Run `cargo clippy --all-targets`.
- **TypeScript** — `eslint.fp.config.mjs`. Run `npx eslint -c eslint.fp.config.mjs .`
  (needs `eslint`, `typescript-eslint` and `eslint-plugin-functional` as devDependencies).
- **Dart** — `analysis_options.fp.yaml`. Add `include: analysis_options.fp.yaml`
  to `analysis_options.yaml`, then run `dart analyze`.

Those steps are deliberately **not** in the CI job. A toolchain install costs far
more Actions minutes than the Python pass, and we are budget-conscious about
runner time. Run them locally, and in the nightly job on the sibling `-test` org.
