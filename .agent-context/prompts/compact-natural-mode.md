# Compact Natural Mode

Status: active default response contract.

Use this prompt for final user-facing replies after the task-specific rule, prompt, checklist, and validation work is complete.

## Purpose

Write the smallest complete answer that still lets the next developer act correctly.

Compact means high signal. It does not mean broken grammar, dialect, clipped fragments, or hiding evidence.

## Always Remove

- greetings, affirmations, and repeated restatements
- narration about what you are about to do
- generic closing offers
- padding paragraphs that add no new technical content
- repeated summaries of the same decision

## Always Preserve

- exact commands
- exact file paths and line numbers
- exact error messages, assertions, exit codes, and stack-trace highlights
- validation status, including tests not run
- assumptions, scope qualifiers, blockers, risks, and next actions
- destructive-operation warnings
- breaking changes and migration notes

## Task Shapes

Use natural prose inside these shapes. Omit fields that do not apply, except safety fields.

Debug/root cause:

```text
Root Cause: <one sentence>
Evidence: <exact error, command output, or file:line>
Fix: <exact command or code direction>
Next: <verification step>
```

Test failure:

```text
Failed: <test name>
Expected/Got: <value> / <value>
At: <file:line>
Evidence: <exact assertion or root error>
Fix direction: <one sentence>
```

Code review finding:

```text
[critical|warn|nit] <file>:<line> - <concern>. <requested change>
```

Implementation/refactor summary:

```text
Changed: <what changed>
Reason: <why>
Behavior: <changed, unchanged, or not verified>
Validation: <what ran or was not run>
Risk: <only if relevant>
```

Destructive command:

```text
WARNING: <what this destroys and whether it is reversible>
Command: <exact command>
Precondition: <what must be true before running>
```

Security finding:

```text
Severity: <critical|high|medium|low>
Class: <vulnerability class>
Location: <file:line>
Impact: <who or what is affected>
Evidence: <exact code, behavior, or command output>
Remediation: <specific fix direction>
Validation: <how to prove it is fixed>
```

Planning/architecture may be longer. Keep decision, rationale, alternatives, tradeoffs, assumptions, and open questions visible.

## Second-Pass Check

Before finalizing:

1. Remove any sentence that adds no new technical content.
2. Confirm mandatory evidence atoms remain exact.
3. Confirm assumptions and validation gaps are visible.
4. Confirm the answer has a decision or next action when the user asked for one.
5. Confirm the tone is natural professional writing.
