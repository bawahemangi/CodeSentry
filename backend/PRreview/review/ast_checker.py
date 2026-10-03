"""
ast_checker.py
--------------
Tree-sitter-based AST analysis for changed Python files in a PR.

Runs BEFORE the LLM review so that:
  - Syntax errors are caught immediately (cheap, deterministic).
  - Static analysis findings are injected into the LLM prompt,
    giving the model richer context about the code's structure.
  - Results are also surfaced as ReviewComment objects that get
    posted as inline GitHub comments, independent of the LLM.

Supported checks (Python)
--------------------------
  1. SYNTAX_ERROR     — file fails to parse (tree-sitter ERROR nodes)
  2. COMPLEXITY       — functions with too many lines or deep nesting
  3. MISSING_DOCSTRING — public functions / classes with no docstring
  4. HARDCODED_SECRET  — string literals that look like credentials
  5. UNUSED_IMPORT    — imported names that are never referenced

Each check returns a list of ASTFinding objects.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from pathlib import PurePath
from typing import Optional

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Data types
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class ASTFinding:
    """A single finding produced by static AST analysis."""
    file: str
    line: int               # 1-based line number in the new file
    check: str              # e.g. "SYNTAX_ERROR", "COMPLEXITY"
    severity: str           # "critical" | "warning" | "suggestion"
    title: str
    body: str
    category: str = "logic" # default category for llm_reviewer compatibility


@dataclass
class ASTReport:
    """Aggregated result for a single file."""
    file: str
    language: str
    parse_ok: bool          # False if the file has syntax errors
    findings: list[ASTFinding] = field(default_factory=list)


# ─────────────────────────────────────────────────────────────────────────────
# Tree-sitter parser setup
# ─────────────────────────────────────────────────────────────────────────────

_PARSERS: dict[str, object] = {}  # language_name -> tree_sitter.Parser


def _get_parser(language: str):
    """Lazily load and cache the parser for a given language."""
    if language in _PARSERS:
        return _PARSERS[language]

    try:
        import tree_sitter_python as tspython
        from tree_sitter import Language, Parser

        if language == "python":
            lang = Language(tspython.language())
            parser = Parser(lang)
            _PARSERS[language] = parser
            return parser
    except ImportError as e:
        logger.warning(f"tree-sitter not available: {e}")
    except Exception as e:
        logger.warning(f"Failed to load tree-sitter parser for {language}: {e}")

    return None


# ─────────────────────────────────────────────────────────────────────────────
# Language detection
# ─────────────────────────────────────────────────────────────────────────────

_EXT_TO_LANG: dict[str, str] = {
    ".py":   "python",
    ".pyw":  "python",
}

SUPPORTED_LANGUAGES = set(_EXT_TO_LANG.values())


def detect_language(filename: str) -> Optional[str]:
    """Return the language key for a filename, or None if unsupported."""
    suffix = PurePath(filename).suffix.lower()
    return _EXT_TO_LANG.get(suffix)


# ─────────────────────────────────────────────────────────────────────────────
# Check 1: Syntax errors
# ─────────────────────────────────────────────────────────────────────────────

def _check_syntax_errors(tree, source_bytes: bytes, filename: str) -> list[ASTFinding]:
    """Walk the AST looking for ERROR or MISSING nodes."""
    findings: list[ASTFinding] = []

    def walk(node):
        if node.type in ("ERROR", "MISSING"):
            line = node.start_point[0] + 1  # 0-indexed → 1-indexed
            snippet = source_bytes[node.start_byte:node.end_byte].decode("utf-8", errors="replace")
            findings.append(ASTFinding(
                file=filename,
                line=line,
                check="SYNTAX_ERROR",
                severity="critical",
                category="bug",
                title="Syntax error detected",
                body=(
                    f"Tree-sitter could not parse this region. "
                    f"Node type: `{node.type}`. "
                    f"Snippet: `{snippet[:120]}`\n\n"
                    f"Fix the syntax error before merging — the LLM review may be unreliable "
                    f"for files that don't parse correctly."
                ),
            ))
        for child in node.children:
            walk(child)

    walk(tree.root_node)
    return findings


# ─────────────────────────────────────────────────────────────────────────────
# Check 2: Complexity (function length + nesting depth)
# ─────────────────────────────────────────────────────────────────────────────

MAX_FUNCTION_LINES = 60    # flag functions longer than this
MAX_NESTING_DEPTH = 5      # flag if-for-while chains deeper than this


def _nesting_depth(node, target_types=("if_statement", "for_statement", "while_statement",
                                       "with_statement", "try_statement")) -> int:
    """Recursively compute max nesting depth of control-flow statements."""
    if node.type in target_types:
        child_depths = [_nesting_depth(c, target_types) for c in node.children]
        return 1 + (max(child_depths) if child_depths else 0)
    child_depths = [_nesting_depth(c, target_types) for c in node.children]
    return max(child_depths) if child_depths else 0


def _check_complexity(tree, source_lines: list[str], filename: str) -> list[ASTFinding]:
    findings: list[ASTFinding] = []

    def walk(node):
        if node.type in ("function_definition", "async_function_definition"):
            start_line = node.start_point[0] + 1
            end_line = node.end_point[0] + 1
            func_len = end_line - start_line + 1

            # Get function name
            name_node = node.child_by_field_name("name")
            func_name = name_node.text.decode("utf-8") if name_node else "<anonymous>"

            # Length check
            if func_len > MAX_FUNCTION_LINES:
                findings.append(ASTFinding(
                    file=filename,
                    line=start_line,
                    check="COMPLEXITY",
                    severity="warning",
                    category="performance",
                    title=f"Function `{func_name}` is too long ({func_len} lines)",
                    body=(
                        f"`{func_name}` spans **{func_len} lines** (limit: {MAX_FUNCTION_LINES}). "
                        f"Long functions are harder to test and understand. "
                        f"Consider splitting it into smaller, focused functions."
                    ),
                ))

            # Nesting depth check
            depth = _nesting_depth(node)
            if depth > MAX_NESTING_DEPTH:
                findings.append(ASTFinding(
                    file=filename,
                    line=start_line,
                    check="COMPLEXITY",
                    severity="warning",
                    category="logic",
                    title=f"Function `{func_name}` has deep nesting (depth {depth})",
                    body=(
                        f"`{func_name}` has control-flow nesting depth of **{depth}** "
                        f"(limit: {MAX_NESTING_DEPTH}). "
                        f"Consider using early returns, guard clauses, or helper functions "
                        f"to flatten the structure."
                    ),
                ))

        for child in node.children:
            walk(child)

    walk(tree.root_node)
    return findings


# ─────────────────────────────────────────────────────────────────────────────
# Check 3: Missing docstrings on public functions/classes
# ─────────────────────────────────────────────────────────────────────────────

def _has_docstring(node) -> bool:
    """Check whether a function/class body starts with a string expression."""
    body = node.child_by_field_name("body")
    if not body:
        return False
    for child in body.children:
        # Skip comment nodes and newlines
        if child.type in ("comment", "newline", "indent"):
            continue
        # First real statement must be an expression_statement containing a string
        if child.type == "expression_statement":
            for sub in child.children:
                if sub.type in ("string", "concatenated_string"):
                    return True
        break  # first real statement is not a docstring
    return False


def _check_missing_docstrings(tree, source_lines: list[str], filename: str) -> list[ASTFinding]:
    findings: list[ASTFinding] = []

    def walk(node):
        if node.type in ("function_definition", "async_function_definition", "class_definition"):
            name_node = node.child_by_field_name("name")
            if not name_node:
                for child in node.children:
                    walk(child)
                return

            name = name_node.text.decode("utf-8")
            line = node.start_point[0] + 1

            # Skip private/dunder names
            if name.startswith("_"):
                for child in node.children:
                    walk(child)
                return

            kind = "function" if "function" in node.type else "class"

            if not _has_docstring(node):
                findings.append(ASTFinding(
                    file=filename,
                    line=line,
                    check="MISSING_DOCSTRING",
                    severity="suggestion",
                    category="docs",
                    title=f"Public {kind} `{name}` has no docstring",
                    body=(
                        f"`{name}` is a public {kind} with no docstring. "
                        f"Add a docstring to describe its purpose, parameters, and return value.\n\n"
                        f"```python\n"
                        f"def {name}(...):\n"
                        f"    \"\"\"Short description.\n\n"
                        f"    Args:\n"
                        f"        param: description\n\n"
                        f"    Returns:\n"
                        f"        description\n"
                        f"    \"\"\"\n"
                        f"```"
                    ),
                ))

        for child in node.children:
            walk(child)

    walk(tree.root_node)
    return findings


# ─────────────────────────────────────────────────────────────────────────────
# Check 4: Hardcoded secrets
# ─────────────────────────────────────────────────────────────────────────────

# Variable name patterns that suggest a secret value
_SECRET_VAR_PATTERN = re.compile(
    r"(password|passwd|secret|api[_-]?key|auth[_-]?token|access[_-]?token|"
    r"private[_-]?key|client[_-]?secret|bearer|credential|db[_-]?pass)",
    re.IGNORECASE,
)

# Looks like a real secret value (not a placeholder or env lookup)
_SECRET_VALUE_PATTERN = re.compile(
    r'^["\'](?!.*\{)(?!your[-_ ])(?!<)(?!example)(?!placeholder)(?!xxx)'
    r'[A-Za-z0-9+/=_\-]{8,}["\']$'
)


def _check_hardcoded_secrets(tree, source_lines: list[str], filename: str) -> list[ASTFinding]:
    """
    Flag assignments like:
        password = "hunter2"
        API_KEY = "sk-abc123..."
    """
    findings: list[ASTFinding] = []

    def walk(node):
        # Pattern: identifier = string_literal
        if node.type == "assignment":
            left = node.child_by_field_name("left")
            right = node.child_by_field_name("right")

            if left and right and right.type == "string":
                var_name = left.text.decode("utf-8", errors="replace")
                val_text = right.text.decode("utf-8", errors="replace").strip()

                if _SECRET_VAR_PATTERN.search(var_name) and _SECRET_VALUE_PATTERN.match(val_text):
                    line = node.start_point[0] + 1
                    findings.append(ASTFinding(
                        file=filename,
                        line=line,
                        check="HARDCODED_SECRET",
                        severity="critical",
                        category="security",
                        title=f"Possible hardcoded secret in `{var_name}`",
                        body=(
                            f"The variable `{var_name}` appears to contain a hardcoded credential. "
                            f"**Never commit secrets to source control.**\n\n"
                            f"**Fix:** Load it from environment variables instead:\n"
                            f"```python\nimport os\n{var_name} = os.environ['YOUR_SECRET_NAME']\n```\n"
                            f"Or use `python-decouple`:\n"
                            f"```python\nfrom decouple import config\n"
                            f"{var_name} = config('{var_name.upper()}')\n```"
                        ),
                    ))

        for child in node.children:
            walk(child)

    walk(tree.root_node)
    return findings


# ─────────────────────────────────────────────────────────────────────────────
# Check 5: Unused imports
# ─────────────────────────────────────────────────────────────────────────────

def _collect_imports(tree, source_bytes: bytes) -> dict[str, int]:
    """
    Returns {imported_name: line_number} for all top-level imports.
    Handles: import x, import x as y, from x import y, from x import y as z
    """
    imports: dict[str, int] = {}

    def walk(node):
        line = node.start_point[0] + 1

        if node.type == "import_statement":
            # import foo, bar
            for child in node.children:
                if child.type == "dotted_name":
                    # import os.path → only "os" is the bound name
                    first = child.children[0] if child.children else child
                    imports[first.text.decode("utf-8")] = line
                elif child.type == "aliased_import":
                    # import foo as f → "f" is the bound name
                    alias = child.child_by_field_name("alias")
                    if alias:
                        imports[alias.text.decode("utf-8")] = line
                    else:
                        name = child.child_by_field_name("name")
                        if name:
                            imports[name.text.decode("utf-8")] = line

        elif node.type == "import_from_statement":
            # from x import foo, bar as b
            for child in node.children:
                if child.type == "aliased_import":
                    alias = child.child_by_field_name("alias")
                    if alias:
                        imports[alias.text.decode("utf-8")] = line
                    else:
                        name = child.child_by_field_name("name")
                        if name:
                            imports[name.text.decode("utf-8")] = line
                elif child.type == "dotted_name" and node.children.index(child) > 2:
                    # plain "from x import name" — name comes after the module
                    imports[child.text.decode("utf-8")] = line

        for child in node.children:
            walk(child)

    walk(tree.root_node)
    return imports


def _check_unused_imports(tree, source_bytes: bytes, filename: str) -> list[ASTFinding]:
    imports = _collect_imports(tree, source_bytes)
    if not imports:
        return []

    # Get the full source text once for reference scanning
    source_text = source_bytes.decode("utf-8", errors="replace")

    findings: list[ASTFinding] = []
    for name, line in imports.items():
        # Count occurrences of the name outside the import line itself
        # We remove the import line and check if the name appears elsewhere
        other_lines = "\n".join(
            ln for i, ln in enumerate(source_text.splitlines(), 1)
            if i != line
        )
        # Word-boundary match to avoid partial matches
        pattern = re.compile(rf"\b{re.escape(name)}\b")
        if not pattern.search(other_lines):
            findings.append(ASTFinding(
                file=filename,
                line=line,
                check="UNUSED_IMPORT",
                severity="suggestion",
                category="style",
                title=f"Unused import: `{name}`",
                body=(
                    f"`{name}` is imported but never used in this file. "
                    f"Remove unused imports to keep the code clean and avoid "
                    f"confusion about dependencies.\n\n"
                    f"If you need it in the future, add it back when required."
                ),
            ))

    return findings


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def analyze_file(filename: str, source_code: str) -> ASTReport:
    """
    Run all AST checks on a single file's source code.

    Args:
        filename    : Relative path of the file (used for language detection
                      and in Finding.file).
        source_code : The full text of the NEW version of the file.

    Returns:
        ASTReport with all findings.
    """
    language = detect_language(filename)
    if language is None:
        logger.debug(f"[AST] Skipping unsupported file: {filename}")
        return ASTReport(file=filename, language="unknown", parse_ok=True)

    parser = _get_parser(language)
    if parser is None:
        logger.warning(f"[AST] No parser available for {language}, skipping {filename}")
        return ASTReport(file=filename, language=language, parse_ok=True)

    source_bytes = source_code.encode("utf-8")
    source_lines = source_code.splitlines()

    try:
        tree = parser.parse(source_bytes)
    except Exception as e:
        logger.error(f"[AST] Parser crashed on {filename}: {e}")
        return ASTReport(file=filename, language=language, parse_ok=False, findings=[
            ASTFinding(
                file=filename, line=1, check="SYNTAX_ERROR", severity="critical",
                category="bug",
                title="Parser crashed — file may be severely malformed",
                body=str(e),
            )
        ])

    findings: list[ASTFinding] = []

    # 1. Syntax errors
    syntax_findings = _check_syntax_errors(tree, source_bytes, filename)
    findings.extend(syntax_findings)
    parse_ok = len(syntax_findings) == 0

    # 2. Complexity (only if parseable)
    if parse_ok:
        findings.extend(_check_complexity(tree, source_lines, filename))

    # 3. Missing docstrings
    if parse_ok:
        findings.extend(_check_missing_docstrings(tree, source_lines, filename))

    # 4. Hardcoded secrets (always run — secrets found even in broken files)
    findings.extend(_check_hardcoded_secrets(tree, source_lines, filename))

    # 5. Unused imports
    if parse_ok:
        findings.extend(_check_unused_imports(tree, source_bytes, filename))

    logger.info(
        f"[AST] {filename}: {len(findings)} findings "
        f"(parse_ok={parse_ok}, lang={language})"
    )

    return ASTReport(
        file=filename,
        language=language,
        parse_ok=parse_ok,
        findings=findings,
    )


def analyze_changed_files(
    changed_file_contents: dict[str, str],
) -> list[ASTReport]:
    """
    Run AST analysis on all changed files.

    Args:
        changed_file_contents : {filename: full_source_code} for new file versions.
                                Files that were deleted should be excluded.

    Returns:
        List of ASTReport, one per analysed file (unsupported files are omitted).
    """
    reports: list[ASTReport] = []
    for filename, content in changed_file_contents.items():
        lang = detect_language(filename)
        if lang is None:
            continue
        reports.append(analyze_file(filename, content))
    return reports


def format_ast_findings_for_prompt(reports: list[ASTReport]) -> str:
    """
    Format AST findings as a concise block to inject into the LLM prompt.
    This gives the model extra context about static analysis findings
    so it can reference or elaborate on them.
    """
    if not reports:
        return ""

    all_findings = [f for r in reports for f in r.findings]
    if not all_findings:
        return ""

    lines = [
        "## Static Analysis Findings (tree-sitter)",
        "The following issues were detected by static AST analysis BEFORE the LLM review.",
        "You should reference these in your review where relevant:\n",
    ]

    for finding in all_findings:
        emoji = {"critical": "🔴", "warning": "🟡", "suggestion": "🔵"}.get(finding.severity, "💬")
        lines.append(
            f"- {emoji} **[{finding.check}]** `{finding.file}:{finding.line}` — "
            f"**{finding.title}**"
        )

    return "\n".join(lines)
