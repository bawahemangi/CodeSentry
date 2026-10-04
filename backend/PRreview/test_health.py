"""
test_health.py
--------------
Unit test suite for health_scorer.py.
Tests rule-based signals, scoring logic, grade bounds, and markdown output.
"""

import sys, os
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(__file__))

from review.health_scorer import (
    calculate_health_score,
    format_health_score_markdown,
    HealthScorerConfig,
    PRHealthReport,
)
from review.ast_checker import ASTFinding
from review.llm_reviewer import ReviewComment


def test_small_clean_pr():
    print("Testing small clean PR...")
    raw_diff = """\
--- a/src/math_utils.py
+++ b/src/math_utils.py
@@ -1,3 +1,5 @@
+def add(a: int, b: int) -> int:
+    return a + b
"""
    changed_files = ["src/math_utils.py", "tests/test_math.py"]
    pr_title = "feat: add math helper"
    pr_desc = "Added a clean math helper module with proper test cases for basic arithmetic."

    report = calculate_health_score(
        changed_files=changed_files,
        raw_diff=raw_diff,
        pr_title=pr_title,
        pr_description=pr_desc,
    )

    print(f"  Score: {report.score} | Grade: {report.grade} | Risk: {report.risk_level}")
    print(f"  Badges: {report.badges}")
    assert report.score >= 90
    assert report.grade == "A+"
    assert report.risk_level == "Low"
    assert "🧪 Tests Included" in report.badges
    print("  ✅ PASS\n")


def test_large_untested_pr_with_syntax_error():
    print("Testing large untested PR with syntax error & empty description...")
    # Generate diff > 1000 lines
    diff_lines = ["--- a/app.py", "+++ b/app.py", "@@ -1,1 +1,1100 @@"]
    for i in range(1100):
        diff_lines.append(f"+print({i})")
    raw_diff = "\n".join(diff_lines)

    changed_files = [f"src/file_{i}.py" for i in range(18)]  # High file sprawl > 15 files
    pr_desc = "short"  # < 20 chars

    ast_findings = [
        ASTFinding(
            file="src/file_1.py",
            line=10,
            check="SYNTAX_ERROR",
            severity="critical",
            category="bug",
            title="Syntax Error",
            body="Invalid syntax",
        ),
        ASTFinding(
            file="src/file_2.py",
            line=4,
            check="HARDCODED_SECRET",
            severity="critical",
            category="security",
            title="Hardcoded API Token",
            body="Found secret",
        )
    ]

    llm_comments = [
        ReviewComment(
            file="src/file_3.py",
            line=20,
            severity="critical",
            category="security",
            title="SQL Injection Vulnerability",
            body="Raw query string used",
        )
    ]

    report = calculate_health_score(
        changed_files=changed_files,
        raw_diff=raw_diff,
        pr_title="huge change",
        pr_description=pr_desc,
        ast_findings=ast_findings,
        llm_comments=llm_comments,
    )

    print(f"  Score: {report.score} | Grade: {report.grade} | Risk: {report.risk_level}")
    print(f"  Badges: {report.badges}")
    print(f"  Recommendations count: {len(report.recommendations)}")
    assert report.score < 40
    assert report.grade == "F"
    assert report.risk_level == "Critical"
    assert "⚡ Massive Diff" in report.badges
    assert "🔴 Syntax Error" in report.badges
    assert "🔒 Secret Detected" in report.badges
    print("  ✅ PASS\n")


def test_markdown_formatting():
    print("Testing markdown widget formatting...")
    changed_files = ["src/api.py"]
    raw_diff = "+x = 1\n+y = 2\n"
    report = calculate_health_score(
        changed_files=changed_files,
        raw_diff=raw_diff,
        pr_title="small fix",
        pr_description="short",
    )
    md = format_health_score_markdown(report)
    print("  Generated Markdown Output:")
    print("--------------------------------------------------")
    print(md)
    print("--------------------------------------------------")
    assert "PR Health Score:" in md
    assert "Grade:" in md
    print("  ✅ PASS\n")


if __name__ == "__main__":
    test_small_clean_pr()
    test_large_untested_pr_with_syntax_error()
    test_markdown_formatting()
    print("ALL HEALTH SCORER TESTS PASSED! 🎉")
