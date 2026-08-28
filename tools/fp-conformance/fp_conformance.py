#!/usr/bin/env python3
"""
fp-conformance — functional-programming conformance scanner.

Checks Rust, TypeScript and Dart sources against the ORESoftware functional
programming guidelines:

    explicit inputs / explicit outputs / immutable values / pure transformations
    typed errors / explicit state transitions / composition / effects pushed
    outward / illegal states excluded by types

The scanner is intentionally dependency-free (stdlib only) so it runs in CI
without a Rust, Node or Dart toolchain present.

Usage
-----
    fp_conformance.py [PATH ...]            human-readable report
    fp_conformance.py --json out.json       machine-readable findings
    fp_conformance.py --fail-on error       exit 1 if any error-severity finding
    fp_conformance.py --budget budget.json  exit 1 only on regression vs budget
    fp_conformance.py --write-budget b.json record current counts as the budget

Exit codes: 0 = pass, 1 = threshold exceeded, 2 = bad invocation.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field, asdict
from typing import Callable, Iterable, Iterator, Sequence

VERSION = "1.0.0"

# --------------------------------------------------------------------------
# configuration
# --------------------------------------------------------------------------

SKIP_DIRS = frozenset({
    ".git", "node_modules", "target", "build", "dist", "out", ".next",
    ".dart_tool", "vendor", "coverage", "Pods", ".venv", "venv", "__pycache__",
    ".idea", ".vscode", "generated", "gen", ".gradle", "Carthage",
})

# Paths whose *content* is exempt: tests exercise effects on purpose, and
# generated code is not hand-maintained.
EXEMPT_PATH = re.compile(
    r"(^|/)(tests?|test|spec|specs|examples?|benches|__tests__|e2e|fixtures?|mocks?)(/|$)"
    r"|\.(g|freezed|pb|generated)\.[a-z]+$"
    r"|\.(test|spec)\.[a-z]+$"
    r"|(^|/)build\.rs$"
    r"|(^|/)migrations?/",
    re.IGNORECASE,
)

# Modules that are *allowed* to hold state and perform effects. The guideline
# is "effects pushed outward", not "no effects" — these are the outward edge.
EFFECT_BOUNDARY = re.compile(
    r"(^|/)(main|bin|cmd|effects?|io|adapters?|infra|infrastructure|runtime|"
    r"transport|server|daemon|sidecar|wire|db|store|repository|repositories|"
    r"handlers?|routes?|middleware|telemetry|otel|logging|log)(/|\.|$)",
    re.IGNORECASE,
)

# Stateful-by-nature domains the guidelines explicitly carve out (websockets,
# tcp connections, stateful clients). Mutable-binding rules soften here.
STATEFUL_HINT = re.compile(
    r"(^|/)(ws|websocket|socket|conn|connection|session|pool|cache|buffer|"
    r"stream|actor|supervisor|state_machine|statemachine|fsm)(/|\.|_|$)",
    re.IGNORECASE,
)

LANG_BY_EXT = {
    ".rs": "rust",
    ".ts": "ts", ".tsx": "ts", ".mts": "ts", ".cts": "ts",
    ".dart": "dart",
}

SEVERITIES = ("error", "warn", "info")


# --------------------------------------------------------------------------
# model
# --------------------------------------------------------------------------

@dataclass(frozen=True)
class Rule:
    code: str
    lang: str
    severity: str
    principle: str
    title: str
    remedy: str


@dataclass(frozen=True)
class Finding:
    code: str
    severity: str
    lang: str
    path: str
    line: int
    text: str
    title: str
    principle: str


@dataclass
class FileContext:
    """Everything a rule needs to judge one file, computed once."""
    path: str
    rel: str
    lang: str
    lines: tuple[str, ...]
    is_effect_boundary: bool
    is_stateful: bool
    code_lines: frozenset[int] = field(default_factory=frozenset)

    @property
    def nlines(self) -> int:
        return len(self.lines)

    def basename(self) -> str:
        return os.path.basename(self.rel)


RuleFn = Callable[[FileContext], Iterator[tuple[str, int, str]]]

RULES: dict[str, Rule] = {}
CHECKS: list[tuple[Rule, RuleFn]] = []


def rule(code: str, lang: str, severity: str, principle: str, title: str, remedy: str):
    r = Rule(code, lang, severity, principle, title, remedy)
    RULES[code] = r

    def register(fn: RuleFn) -> RuleFn:
        CHECKS.append((r, fn))
        return fn

    return register


# --------------------------------------------------------------------------
# lexical helpers — comment/string stripping so rules see code, not prose
# --------------------------------------------------------------------------

_LINE_COMMENT = re.compile(r"(^|[^:])//.*$")
_BLOCK_OPEN = re.compile(r"/\*")
_BLOCK_CLOSE = re.compile(r"\*/")
_STRINGS = re.compile(r"""(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)""")


def strip_noise(lines: Sequence[str]) -> tuple[list[str], frozenset[int]]:
    """Blank out comments and string literals; return (masked, code_line_nums)."""
    out: list[str] = []
    code: set[int] = set()
    in_block = False
    for i, raw in enumerate(lines, 1):
        line = raw
        if in_block:
            m = _BLOCK_CLOSE.search(line)
            if not m:
                out.append("")
                continue
            line = " " * m.end() + line[m.end():]
            in_block = False
        # remove inline block comments, then detect an unterminated opener
        while True:
            o = _BLOCK_OPEN.search(line)
            if not o:
                break
            c = _BLOCK_CLOSE.search(line, o.end())
            if c:
                line = line[:o.start()] + " " * (c.end() - o.start()) + line[c.end():]
            else:
                line = line[:o.start()]
                in_block = True
                break
        line = _LINE_COMMENT.sub(lambda m: m.group(1), line)
        line = _STRINGS.sub('""', line)
        out.append(line)
        if line.strip():
            code.add(i)
    return out, frozenset(code)


def scan(ctx: FileContext, pattern: re.Pattern[str],
         predicate: Callable[[re.Match[str], str, int], bool] | None = None
         ) -> Iterator[tuple[str, int, str]]:
    """Yield (code, lineno, excerpt) for each masked line matching `pattern`."""
    for i, line in enumerate(ctx.lines, 1):
        if i not in ctx.code_lines:
            continue
        m = pattern.search(line)
        if not m:
            continue
        if predicate and not predicate(m, line, i):
            continue
        yield ("", i, line.strip()[:160])


# --------------------------------------------------------------------------
# Rust rules
# --------------------------------------------------------------------------

RS_LET_MUT = re.compile(r"\blet\s+mut\s+")
RS_STATIC_MUT = re.compile(r"\bstatic\s+mut\b")
RS_GLOBAL_LOCK = re.compile(
    r"^\s*(pub\s+)?static\s+[A-Z0-9_]+\s*:\s*.*\b(Mutex|RwLock|RefCell|Cell|AtomicUsize|AtomicBool|OnceCell|Lazy)\b")
RS_PANIC = re.compile(r"\.unwrap\(\)|\.expect\(|(?<![\w.])panic!\(|(?<![\w.])unreachable!\(|(?<![\w.])todo!\(|\.unwrap_unchecked\(")
RS_WILDCARD_ARM = re.compile(r"^\s*_\s*=>")
RS_UNTYPED_ERR = re.compile(r"Box\s*<\s*dyn\s+(std::)?error::Error|(?<![\w:])anyhow::(Result|Error)\b|(?<![\w:])Box<dyn\s+Error")
RS_INTERIOR = re.compile(r"\b(RefCell|Cell)\s*<")
RS_PRINT = re.compile(r"(?<![\w.])(println!|eprintln!|print!|eprint!|dbg!)\s*\(")
RS_MUT_SELF_UNIT = re.compile(r"\bfn\s+\w+\s*(<[^>]*>)?\s*\([^)]*&mut\s+self[^)]*\)\s*\{")
RS_UNSAFE = re.compile(r"(?<![\w])unsafe\s*\{")


@rule("RS001", "rust", "warn", "immutable values",
      "mutable local binding (`let mut`)",
      "Rebind with `let`, fold with an iterator, or build the value with `collect()`/`fold()` instead of mutating in place.")
def rs_let_mut(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    if ctx.is_stateful:
        return iter(())          # stateful carve-out per guidelines
    return scan(ctx, RS_LET_MUT)


@rule("RS002", "rust", "error", "explicit state transitions",
      "module-level mutable / shared-interior global",
      "Move the value into an explicit state struct threaded through call sites, or confine it to an effects module at the outward edge.")
def rs_global_state(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    if ctx.is_effect_boundary:
        return iter(())
    yield from scan(ctx, RS_STATIC_MUT)
    yield from scan(ctx, RS_GLOBAL_LOCK)


@rule("RS003", "rust", "error", "typed errors",
      "panic-based control flow (`unwrap`/`expect`/`panic!`)",
      "Return `Result<T, E>` with a domain error enum and propagate with `?`; reserve panics for genuinely unreachable invariants proven by types.")
def rs_panic(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    return scan(ctx, RS_PANIC)


@rule("RS004", "rust", "warn", "illegal states excluded by types",
      "wildcard match arm defeats exhaustiveness",
      "Enumerate the remaining variants explicitly so adding a variant becomes a compile error.")
def rs_wildcard(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    return scan(ctx, RS_WILDCARD_ARM)


@rule("RS005", "rust", "warn", "typed errors",
      "untyped/erased error in a signature",
      "Replace `Box<dyn Error>` / `anyhow::Error` on public boundaries with a `thiserror` enum so callers can match on failure modes.")
def rs_untyped_err(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    return scan(ctx, RS_UNTYPED_ERR)


@rule("RS006", "rust", "warn", "pure transformations",
      "interior mutability outside a stateful module",
      "Thread the value through as a parameter and return the updated value, rather than hiding mutation behind `RefCell`/`Cell`.")
def rs_interior(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    if ctx.is_stateful or ctx.is_effect_boundary:
        return iter(())
    return scan(ctx, RS_INTERIOR)


@rule("RS007", "rust", "warn", "effects pushed outward",
      "direct stdout/stderr effect in library code",
      "Emit through the ores-otel tracing layer so the effect lives at the outward edge and stays observable.")
def rs_print(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    if ctx.is_effect_boundary:
        return iter(())
    return scan(ctx, RS_PRINT)


@rule("RS008", "rust", "warn", "explicit outputs",
      "`&mut self` method returning unit",
      "Return the new state (or a typed transition) instead of mutating in place and returning `()`.")
def rs_mut_self(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    if ctx.is_stateful:
        return iter(())
    def not_returning(m: re.Match[str], line: str, i: int) -> bool:
        return "->" not in line
    return scan(ctx, RS_MUT_SELF_UNIT, not_returning)


@rule("RS009", "rust", "error", "illegal states excluded by types",
      "`unsafe` block",
      "Replace with a safe abstraction, or isolate behind a reviewed, documented module at the effect boundary.")
def rs_unsafe(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    return scan(ctx, RS_UNSAFE)


# --------------------------------------------------------------------------
# TypeScript rules
# --------------------------------------------------------------------------

TS_VAR = re.compile(r"(?<![\w.])var\s+[\w{[]")
TS_LET = re.compile(r"(?<![\w.])let\s+[\w{[]")
TS_TOP_MUT = re.compile(r"^(export\s+)?(let|var)\s+[\w{[]")
TS_MUTATORS = re.compile(r"\.(push|pop|shift|unshift|splice|sort|reverse|fill|copyWithin)\s*\(")
TS_DELETE = re.compile(r"(?<![\w.])delete\s+\w+(\.|\[)")
TS_ANY = re.compile(r":\s*any(\b|\[|>|,|\)|;|$)|<any>|as\s+any\b")
TS_THROW = re.compile(r"(?<![\w.])throw\s+")
TS_JSX = re.compile(r"(?<![\w.])from\s+\"\"|<[A-Z]\w*[\s/>]")
TS_REACT = re.compile(r"""(?<![\w.])(import|require)\b[^\n]*\b(react|react-dom|preact)\b""", re.IGNORECASE)
TS_CONSOLE = re.compile(r"(?<![\w.])console\.(log|debug|info|warn|error)\s*\(")
TS_IMPURE = re.compile(r"(?<![\w.])(Date\.now|Math\.random|new\s+Date|process\.env|crypto\.randomUUID)\b")
TS_ENUM = re.compile(r"(?<![\w.])(?<!const\s)enum\s+\w+")
TS_NONNULL = re.compile(r"\w!\s*\.|\w!\s*[;,)\]]")
TS_CLASS_MUT_FIELD = re.compile(r"^\s*(public\s+|private\s+|protected\s+)?(?!readonly\b|static\s+readonly\b)\w+\s*[?!]?\s*:\s*[^=;]+;")


@rule("TS001", "ts", "error", "immutable values",
      "`var` declaration",
      "Use `const`; `var` adds function-scoped hoisting on top of mutability.")
def ts_var(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    return scan(ctx, TS_VAR)


@rule("TS002", "ts", "warn", "immutable values",
      "mutable `let` binding",
      "Prefer `const`. Where a value genuinely evolves, derive it with `reduce`/`map` or model the transition explicitly.")
def ts_let(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    if ctx.is_stateful:
        return iter(())
    def not_toplevel(m: re.Match[str], line: str, i: int) -> bool:
        return bool(line[:m.start()].strip()) or line.startswith((" ", "\t"))
    return scan(ctx, TS_LET, lambda m, l, i: not TS_TOP_MUT.match(l))


@rule("TS003", "ts", "error", "explicit state transitions",
      "module-level mutable binding",
      "Module-scope `let`/`var` is shared global state. Hold it in a value passed to the functions that need it.")
def ts_top_mut(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    if ctx.is_effect_boundary:
        return iter(())
    return scan(ctx, TS_TOP_MUT)


@rule("TS004", "ts", "warn", "pure transformations",
      "in-place array mutation",
      "Use the copying form — spread, `toSorted`, `toReversed`, `concat`, `filter` — so callers' values are not modified.")
def ts_mutators(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    yield from scan(ctx, TS_MUTATORS)
    yield from scan(ctx, TS_DELETE)


@rule("TS005", "ts", "warn", "explicit inputs",
      "`any` escapes the type system",
      "Give the value a real type, or `unknown` plus a narrowing guard, so illegal states stay excluded by types.")
def ts_any(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    return scan(ctx, TS_ANY)


@rule("TS006", "ts", "warn", "typed errors",
      "`throw` as control flow",
      "Return a discriminated `Result`/`Either` so the failure appears in the signature instead of escaping it.")
def ts_throw(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    return scan(ctx, TS_THROW)


@rule("TS007", "ts", "error", "composition",
      "React / JSX dependency",
      "React and JSX are prohibited by the house guidelines. Use Leptos/Dioxus islands, Maud+HTMX, or Flutter/Dart on the client.")
def ts_react(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    return scan(ctx, TS_REACT)


@rule("TS008", "ts", "warn", "effects pushed outward",
      "direct console effect in library code",
      "Route through the ores-otel logger so the effect is observable and lives at the boundary.")
def ts_console(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    if ctx.is_effect_boundary:
        return iter(())
    return scan(ctx, TS_CONSOLE)


@rule("TS009", "ts", "warn", "explicit inputs",
      "ambient impurity (clock / randomness / env) read inside pure code",
      "Take the value as a parameter — inject a clock, a seeded RNG, or a config object — so the function stays testable and deterministic.")
def ts_impure(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    if ctx.is_effect_boundary:
        return iter(())
    return scan(ctx, TS_IMPURE)


@rule("TS010", "ts", "warn", "illegal states excluded by types",
      "non-null assertion (`!`) suppresses a real case",
      "Narrow with a guard or model absence in the type; `!` asserts away a state the compiler can see.")
def ts_nonnull(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    return scan(ctx, TS_NONNULL)


# --------------------------------------------------------------------------
# Dart rules
# --------------------------------------------------------------------------

DART_VAR = re.compile(r"(?<![\w.])var\s+\w+")
DART_TOP_MUT = re.compile(r"^(var|late\s+\w+|[A-Za-z_][\w<>,\s?]*)\s+\w+\s*=")
DART_LATE = re.compile(r"(?<![\w.])late\s+(?!final\b)")
DART_NONFINAL_FIELD = re.compile(
    r"^\s{2,}(?!final\b|const\b|static\s+const\b|static\s+final\b|@)"
    r"(?:late\s+)?[A-Z][\w<>,\s?]*\s+_?\w+\s*(=|;)")
DART_THROW = re.compile(r"(?<![\w.])throw\s+")
DART_PRINT = re.compile(r"(?<![\w.])(print|debugPrint)\s*\(")
DART_BANG = re.compile(r"\w!\s*\.|\w!\s*[;,)\]]")
DART_MUTATORS = re.compile(r"\.(add|addAll|remove|removeAt|removeWhere|clear|insert|sort|shuffle)\s*\(")
DART_DEFAULT_CASE = re.compile(r"^\s*default\s*:")


@rule("DA001", "dart", "warn", "immutable values",
      "`var` binding instead of `final`",
      "Declare with `final` (or `const`); Dart infers the type either way.")
def dart_var(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    if ctx.is_stateful:
        return iter(())
    return scan(ctx, DART_VAR)


@rule("DA002", "dart", "error", "explicit state transitions",
      "top-level mutable variable",
      "Library-level mutable state is global state. Pass it in, or scope it to a provider at the effect boundary.")
def dart_top_mut(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    if ctx.is_effect_boundary:
        return iter(())
    def is_top(m: re.Match[str], line: str, i: int) -> bool:
        return not line.startswith((" ", "\t")) and not line.lstrip().startswith(
            ("final", "const", "class", "enum", "typedef", "import", "export", "part", "abstract", "mixin", "extension", "void", "Future", "@"))
    return scan(ctx, DART_TOP_MUT, is_top)


@rule("DA003", "dart", "warn", "immutable values",
      "mutable (non-`final`) instance field",
      "Make the field `final` and produce a new instance with `copyWith`, so state transitions are explicit.")
def dart_field(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    if ctx.is_stateful:
        return iter(())
    return scan(ctx, DART_NONFINAL_FIELD)


@rule("DA004", "dart", "warn", "immutable values",
      "`late` non-final binding",
      "`late var` defers both initialisation and immutability. Prefer `late final`, or restructure so the value exists at construction.")
def dart_late(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    return scan(ctx, DART_LATE)


@rule("DA005", "dart", "warn", "typed errors",
      "`throw` as control flow",
      "Return a sealed `Result` union so the failure is part of the signature and the switch over it stays exhaustive.")
def dart_throw(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    return scan(ctx, DART_THROW)


@rule("DA006", "dart", "warn", "effects pushed outward",
      "direct `print` in library code",
      "Route through the ores-otel logger rather than writing to stdout from inside a transformation.")
def dart_print(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    if ctx.is_effect_boundary:
        return iter(())
    return scan(ctx, DART_PRINT)


@rule("DA007", "dart", "warn", "illegal states excluded by types",
      "null assertion (`!`) suppresses a real case",
      "Narrow with a null check or model absence in the type instead of asserting it away.")
def dart_bang(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    return scan(ctx, DART_BANG)


@rule("DA008", "dart", "warn", "pure transformations",
      "in-place collection mutation",
      "Build a new collection with spread or `followedBy`/`where`/`map` instead of mutating the caller's list.")
def dart_mutators(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    if ctx.is_stateful:
        return iter(())
    return scan(ctx, DART_MUTATORS)


@rule("DA009", "dart", "warn", "illegal states excluded by types",
      "`default:` arm defeats exhaustiveness",
      "Switch over a sealed class and list every subtype so a new variant becomes a compile error.")
def dart_default(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    return scan(ctx, DART_DEFAULT_CASE)


# --------------------------------------------------------------------------
# cross-language rules
# --------------------------------------------------------------------------

GOD_FILE_LIMIT = 600
ENTRY_FILE_LIMIT = 250
ENTRY_FILES = {"main.rs", "lib.rs", "main.ts", "index.ts", "main.dart"}


@rule("XX001", "*", "warn", "composition",
      "oversized module",
      "Split into focused modules; the guidelines call for modularisation rather than a single large entry point.")
def god_file(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    base = ctx.basename()
    limit = ENTRY_FILE_LIMIT if base in ENTRY_FILES else GOD_FILE_LIMIT
    if ctx.nlines > limit:
        yield ("", 1, f"{base} is {ctx.nlines} lines (limit {limit})")


@rule("XX002", "*", "warn", "explicit outputs",
      "long function body",
      "A body over 60 lines is usually several transformations. Extract named, individually testable steps and compose them.")
def long_fn(ctx: FileContext) -> Iterator[tuple[str, int, str]]:
    starts = {
        "rust": re.compile(r"^\s*(pub\s+)?(async\s+)?(unsafe\s+)?fn\s+(\w+)"),
        "ts":   re.compile(r"^\s*(export\s+)?(async\s+)?function\s+(\w+)|^\s*(export\s+)?const\s+(\w+)\s*=\s*(async\s*)?\("),
        "dart": re.compile(r"^\s*[\w<>,\s?\[\]]+\s+(\w+)\s*\([^;]*\)\s*(async\s*)?\{"),
    }[ctx.lang]
    open_at: int | None = None
    depth = 0
    name = ""
    for i, line in enumerate(ctx.lines, 1):
        if open_at is None:
            m = starts.match(line)
            if m and "{" in line:
                open_at = i
                name = next((g for g in m.groups()[2:] if g and g.isidentifier()), "fn")
                depth = line.count("{") - line.count("}")
                if depth <= 0:
                    open_at = None
            continue
        depth += line.count("{") - line.count("}")
        if depth <= 0:
            length = i - open_at
            if length > 60:
                yield ("", open_at, f"`{name}` spans {length} lines")
            open_at = None


# --------------------------------------------------------------------------
# engine
# --------------------------------------------------------------------------

def iter_source_files(roots: Sequence[str]) -> Iterator[tuple[str, str, str]]:
    """Yield (abspath, relpath, lang) for every scannable source file."""
    for root in roots:
        root = os.path.abspath(root)
        if os.path.isfile(root):
            ext = os.path.splitext(root)[1]
            if ext in LANG_BY_EXT:
                yield root, os.path.basename(root), LANG_BY_EXT[ext]
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS and not d.startswith("."))
            for fn in sorted(filenames):
                ext = os.path.splitext(fn)[1]
                lang = LANG_BY_EXT.get(ext)
                if not lang:
                    continue
                ap = os.path.join(dirpath, fn)
                rel = os.path.relpath(ap, root)
                if EXEMPT_PATH.search(rel.replace(os.sep, "/")):
                    continue
                yield ap, rel.replace(os.sep, "/"), lang


def build_context(path: str, rel: str, lang: str) -> FileContext | None:
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            raw = fh.read().split("\n")
    except OSError:
        return None
    if len(raw) > 20000:
        return None
    masked, code = strip_noise(raw)
    return FileContext(
        path=path, rel=rel, lang=lang, lines=tuple(masked),
        is_effect_boundary=bool(EFFECT_BOUNDARY.search(rel)),
        is_stateful=bool(STATEFUL_HINT.search(rel)),
        code_lines=code,
    )


def analyse(roots: Sequence[str]) -> tuple[list[Finding], dict[str, int]]:
    findings: list[Finding] = []
    stats = {"files": 0, "lines": 0, "rust": 0, "ts": 0, "dart": 0}
    for path, rel, lang in iter_source_files(roots):
        ctx = build_context(path, rel, lang)
        if ctx is None:
            continue
        stats["files"] += 1
        stats["lines"] += ctx.nlines
        stats[lang] += 1
        for r, fn in CHECKS:
            if r.lang not in ("*", lang):
                continue
            for _, lineno, text in fn(ctx):
                findings.append(Finding(
                    code=r.code, severity=r.severity, lang=lang, path=rel,
                    line=lineno, text=text, title=r.title, principle=r.principle,
                ))
    findings.sort(key=lambda f: (SEVERITIES.index(f.severity), f.path, f.line))
    return findings, stats


def summarise(findings: Iterable[Finding]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for f in findings:
        counts[f.code] = counts.get(f.code, 0) + 1
    return dict(sorted(counts.items()))


def render(findings: list[Finding], stats: dict[str, int], limit: int) -> str:
    by_sev: dict[str, int] = {s: 0 for s in SEVERITIES}
    for f in findings:
        by_sev[f.severity] += 1
    out = [
        f"fp-conformance {VERSION}",
        f"  scanned {stats['files']} files ({stats['rust']} rust, {stats['ts']} ts, "
        f"{stats['dart']} dart), {stats['lines']} lines",
        f"  findings: {by_sev['error']} error, {by_sev['warn']} warn, {by_sev['info']} info",
        "",
    ]
    counts = summarise(findings)
    if counts:
        out.append("by rule:")
        for code, n in sorted(counts.items(), key=lambda kv: -kv[1]):
            r = RULES[code]
            out.append(f"  {code}  {n:6d}  [{r.severity}] {r.title}")
        out.append("")
    shown = findings[:limit]
    if shown:
        out.append(f"first {len(shown)} findings:")
        for f in shown:
            out.append(f"  {f.path}:{f.line}: [{f.severity}] {f.code} {f.title}")
            if f.text:
                out.append(f"      {f.text}")
    if len(findings) > limit:
        out.append(f"  ... and {len(findings) - limit} more")
    return "\n".join(out)


def main(argv: Sequence[str]) -> int:
    ap = argparse.ArgumentParser(description="functional-programming conformance scanner")
    ap.add_argument("paths", nargs="*", default=["."])
    ap.add_argument("--json", metavar="FILE", help="write findings as JSON")
    ap.add_argument("--fail-on", choices=("never", "error", "warn"), default="never")
    ap.add_argument("--budget", metavar="FILE",
                    help="fail when a rule's count exceeds the recorded budget")
    ap.add_argument("--write-budget", metavar="FILE",
                    help="record current per-rule counts as the budget and exit 0")
    ap.add_argument("--limit", type=int, default=40, help="findings to print")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args(argv)

    findings, stats = analyse(args.paths or ["."])
    counts = summarise(findings)

    if args.write_budget:
        payload = {"version": VERSION, "stats": stats, "budget": counts}
        with open(args.write_budget, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, indent=2, sort_keys=True)
            fh.write("\n")
        if not args.quiet:
            print(f"wrote budget for {len(counts)} rules to {args.write_budget}")
        return 0

    if args.json:
        with open(args.json, "w", encoding="utf-8") as fh:
            json.dump({"version": VERSION, "stats": stats, "counts": counts,
                       "findings": [asdict(f) for f in findings]}, fh, indent=1)
            fh.write("\n")

    if not args.quiet:
        print(render(findings, stats, args.limit))

    status = 0
    if args.budget and os.path.exists(args.budget):
        with open(args.budget, encoding="utf-8") as fh:
            budget = json.load(fh).get("budget", {})
        regressions = [(c, n, budget.get(c, 0)) for c, n in counts.items() if n > budget.get(c, 0)]
        if regressions:
            print("\nfp-conformance: regression against budget")
            for code, now, was in regressions:
                print(f"  {code} {RULES[code].title}: {was} -> {now}")
            print("\nFix the new occurrences, or re-baseline deliberately with --write-budget.")
            status = 1

    if args.fail_on == "error" and any(f.severity == "error" for f in findings):
        status = 1
    elif args.fail_on == "warn" and findings:
        status = 1
    return status


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except KeyboardInterrupt:
        sys.exit(130)
