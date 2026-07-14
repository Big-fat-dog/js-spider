# Challenge Artifact Harvest Playbook

Use this playbook when a hostile runtime already produces the decisive artifact locally, and the job is to harvest it without turning the solution into browser automation.

## Route here when

- a bootstrap or challenge script exposes a stable getter or object method after initialization
- a local runtime self-issues XHR or fetch with the real wrapped body, binary payload, or decisive headers
- later timer or DOM errors appear, but the needed artifact may already exist before full DOM parity
- blocking `vm` execution deadlocks while DOM or script execution preserves timers, microtasks, or request hooks
- patching the code-generation boundary looks cheaper than filling dozens of missing DOM APIs

## Core idea

Recover the artifact at the nearest stable boundary.

Typical stable boundaries are:

- an exposed getter after synchronous init
- the outgoing XHR or fetch call
- a cleaner alternate route that makes full challenge execution unnecessary

## Fast execution path

1. Classify the artifact path first.
   Choose one:
   - exposed getter
   - intercepted XHR or fetch egress
   - alternate-route bypass

2. Preserve scheduler semantics.
   When timers, microtasks, lifecycle, or self-issued requests matter, use an execution path that keeps them alive.
   Prefer DOM or script insertion style execution over blocking `vm` evaluation for these cases.

3. Patch the smallest faithful boundary.
   Good patch targets:
   - one missing environment read
   - one code-generation boundary
   - one local request hook
   - one narrow success stub

4. Harvest the artifact.
   Examples:
   - getter return value
   - outgoing request body
   - decisive headers
   - derived cookie
   - final token

5. Hand control back to Python.
   Let Python perform the real HTTP replay, retries, parsing, and persistence.

6. Retry with fresh bootstrap when necessary.
   If bundles are version-randomized, reacquire bootstrap assets instead of assuming one patched script stays stable forever.

## High-value checks

- whether the artifact exists before noisy timer callbacks finish
- whether the runtime needs script insertion or page bootstrap instead of blocking eval
- whether the self-issued request can be captured locally without touching the live site
- whether the runtime only needs a minimal fake success response to keep progressing
- whether a recoverable patch should catch one exact error class while structural failures still propagate

## Common traps

- trying to finish every timer callback when one getter already returns the artifact
- patching every missing DOM hole instead of intercepting the outgoing request
- using catch-all error swallowing that hides recursion, stack overflow, or state corruption
- letting the local runtime issue real business HTTP when only local mutation evidence was needed
- keeping the challenge runtime as a hidden dependency after the artifact shape is already understood

## Delivery guidance

Preferred shape:

1. Python request or bootstrap
2. local runtime harvest step
3. explicit artifact extraction
4. Python replay

Not:

1. Python orchestrates a hidden browser replacement

## Minimal handoff notes

Report these items explicitly:

- which artifact path won: getter, egress, or bypass
- which scheduler assumptions mattered
- which narrow patch was required, if any
- which artifact was extracted locally
- how Python consumed that artifact in the final replay
