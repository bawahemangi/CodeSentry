"""
diff_mapper.py
--------------
Converts a unified diff (as returned by GitHub's PR diff API) into a
lookup table that maps:

    (file_path, absolute_line_number)  →  diff_position

The diff_position is the integer GitHub expects in the `position` field
when posting a pull-request review comment via:
    POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews

HOW GITHUB POSITIONS WORK
--------------------------
GitHub counts every line in the unified diff sequentially, starting at 1,
including the `--- a/...` / `+++ b/...` header lines and the hunk `@@ ... @@`
lines. Each `+` (added) or ` ` (context) line in the diff has a position.
Removed lines (`-`) do NOT get a position in the "new" file, but they DO
consume a position number in the diff.

We build two maps:
  - new_line_map  : (filename, new_line_no)  → diff_position   (for + and context)
  - old_line_map  : (filename, old_line_no)  → diff_position   (for - and context)
"""

import re
from dataclasses import dataclass, field
from typing import Optional


# ─────────────────────────────────────────────────────────────────────────────
# Data structures
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class DiffPosition:
    """Represents a resolvable position inside a GitHub PR diff."""
    file_path: str         # e.g. "src/utils.py"
    diff_position: int     # integer to pass to GitHub review comment API
    old_line: Optional[int] = None   # absolute line in the base (before) file
    new_line: Optional[int] = None   # absolute line in the head (after) file
    line_type: str = ''    # '+' added | '-' removed | ' ' context


@dataclass
class FileDiffMap:
    """All diff positions for a single file in the PR."""
    filename: str
    # (new_line_number) → DiffPosition
    new_line_map: dict[int, DiffPosition] = field(default_factory=dict)
    # (old_line_number) → DiffPosition
    old_line_map: dict[int, DiffPosition] = field(default_factory=dict)


# ─────────────────────────────────────────────────────────────────────────────
# Parser
# ─────────────────────────────────────────────────────────────────────────────

_HUNK_HEADER = re.compile(
    r'^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@'
)

_DIFF_FILE_OLD = re.compile(r'^--- (?:a/)?(.+)$')
_DIFF_FILE_NEW = re.compile(r'^\+\+\+ (?:b/)?(.+)$')


def parse_diff(raw_diff: str) -> dict[str, FileDiffMap]:
    """
    Parse a full unified diff string (multi-file) and return a dict:
        { "src/utils.py": FileDiffMap, ... }

    Args:
        raw_diff: The raw unified diff text from GitHub's PR diff endpoint.

    Returns:
        Dictionary keyed by new filename (relative path).
    """
    file_maps: dict[str, FileDiffMap] = {}

    current_file: Optional[str] = None
    current_map: Optional[FileDiffMap] = None

    # Running counters
    diff_position = 0       # global counter across the entire diff
    old_line = 0
    new_line = 0

    for raw_line in raw_diff.splitlines():

        # ── New file header (--- a/path) ─────────────────────────────────────
        m = _DIFF_FILE_OLD.match(raw_line)
        if m:
            diff_position += 1  # the "---" line itself counts
            continue

        # ── New file header (+++ b/path) ─────────────────────────────────────
        m = _DIFF_FILE_NEW.match(raw_line)
        if m:
            current_file = m.group(1)
            current_map = FileDiffMap(filename=current_file)
            file_maps[current_file] = current_map
            diff_position += 1  # the "+++" line itself counts
            continue

        # ── Hunk header (@@ -x,y +a,b @@) ───────────────────────────────────
        m = _HUNK_HEADER.match(raw_line)
        if m:
            old_line = int(m.group(1))
            new_line = int(m.group(2))
            diff_position += 1  # the @@ line itself counts
            continue

        # ── Added line (+) ────────────────────────────────────────────────────
        if raw_line.startswith('+'):
            if current_map is not None:
                pos = DiffPosition(
                    file_path=current_file,
                    diff_position=diff_position,
                    new_line=new_line,
                    old_line=None,
                    line_type='+',
                )
                current_map.new_line_map[new_line] = pos
            diff_position += 1
            new_line += 1
            continue

        # ── Removed line (-) ──────────────────────────────────────────────────
        if raw_line.startswith('-'):
            if current_map is not None:
                pos = DiffPosition(
                    file_path=current_file,
                    diff_position=diff_position,
                    new_line=None,
                    old_line=old_line,
                    line_type='-',
                )
                current_map.old_line_map[old_line] = pos
            diff_position += 1
            old_line += 1
            continue

        # ── Context line (space) ──────────────────────────────────────────────
        if raw_line.startswith(' '):
            if current_map is not None:
                pos = DiffPosition(
                    file_path=current_file,
                    diff_position=diff_position,
                    new_line=new_line,
                    old_line=old_line,
                    line_type=' ',
                )
                current_map.new_line_map[new_line] = pos
                current_map.old_line_map[old_line] = pos
            diff_position += 1
            old_line += 1
            new_line += 1
            continue

        # ── Any other line (e.g. "diff --git", "index ...", "new file mode")
        diff_position += 1

    return file_maps


# ─────────────────────────────────────────────────────────────────────────────
# Public lookup helpers
# ─────────────────────────────────────────────────────────────────────────────

def get_position_for_new_line(
    file_maps: dict[str, FileDiffMap],
    file_path: str,
    new_line_number: int,
) -> Optional[int]:
    """
    Return the GitHub diff position for a line number in the NEW (head) file.

    Args:
        file_maps   : Output of parse_diff()
        file_path   : Relative file path, e.g. "src/utils.py"
        new_line_number: 1-indexed absolute line number in the new file

    Returns:
        Integer diff position, or None if the line isn't in the diff.
    """
    file_map = file_maps.get(file_path)
    if not file_map:
        return None
    pos = file_map.new_line_map.get(new_line_number)
    return pos.diff_position if pos else None


def get_position_for_old_line(
    file_maps: dict[str, FileDiffMap],
    file_path: str,
    old_line_number: int,
) -> Optional[int]:
    """
    Return the GitHub diff position for a line number in the OLD (base) file.
    Useful for commenting on deleted lines.
    """
    file_map = file_maps.get(file_path)
    if not file_map:
        return None
    pos = file_map.old_line_map.get(old_line_number)
    return pos.diff_position if pos else None


def get_all_changed_lines(
    file_maps: dict[str, FileDiffMap],
) -> list[dict]:
    """
    Return a flat list of all changed lines (added/removed) across all files.
    Useful for building the LLM prompt context.

    Each item:
        {
            "file": "src/utils.py",
            "line_type": "+" | "-",
            "new_line": 42 | None,
            "old_line": 39 | None,
            "diff_position": 17,
        }
    """
    result = []
    for filename, file_map in file_maps.items():
        seen_positions = set()

        for pos in file_map.new_line_map.values():
            if pos.diff_position not in seen_positions and pos.line_type in ('+', '-'):
                seen_positions.add(pos.diff_position)
                result.append({
                    "file": filename,
                    "line_type": pos.line_type,
                    "new_line": pos.new_line,
                    "old_line": pos.old_line,
                    "diff_position": pos.diff_position,
                })

        for pos in file_map.old_line_map.values():
            if pos.diff_position not in seen_positions and pos.line_type == '-':
                seen_positions.add(pos.diff_position)
                result.append({
                    "file": filename,
                    "line_type": pos.line_type,
                    "new_line": pos.new_line,
                    "old_line": pos.old_line,
                    "diff_position": pos.diff_position,
                })

    return result
