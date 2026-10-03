"""Quick smoke test for ast_checker."""
import sys, os
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from review.ast_checker import analyze_file, format_ast_findings_for_prompt

TEST_SOURCE = """\
import os
import re

password = "hunter2secret"

def foo():
    x = 1
    if x:
        if x:
            if x:
                if x:
                    if x:
                        pass

class Bar:
    def public_method(self):
        pass
"""

r = analyze_file("mymodule.py", TEST_SOURCE)
print(f"Parse OK: {r.parse_ok}")
print(f"Language: {r.language}")
print(f"Findings: {len(r.findings)}")
for f in r.findings:
    print(f"  [{f.severity.upper():10s}] {f.check}: {f.title} (line {f.line})")

# Test the prompt formatter
summary = format_ast_findings_for_prompt([r])
print("\n--- AST PROMPT BLOCK ---")
print(summary)
