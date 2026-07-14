# Environment Patch Playbook

Use this file when extracted logic runs in a local runtime but outputs still differ from the page.

## Common mismatch sources

- missing globals
- different user agent branches
- DOM-derived constants
- text encoding assumptions
- `Date.now()` or randomness precision
- scheduler, timer, or microtask differences
- helper functions patched by side scripts
- instance-level hooks bypassed by prototype rewrites, rebinding, or wrapper replacement
- async bootstrap state that is only consumed later from cookie, storage, or one cached object
- unimplemented native surfaces such as `canvas`, WebGL, layout metrics, or style computation that quietly collapse fingerprint or verifier payloads
- structurally shortened outputs caused by null-returning host APIs rather than wrong business logic

## Working method

1. compare helper outputs on the same fixed inputs
2. compare structural metrics such as length, repeated blocks, and field presence before chasing semantics
3. identify the first diverging intermediate value
4. if cookie, storage, script, or resource injection barely changes the output, inspect which host APIs are actually probed
5. patch only the smallest missing environment surface or authoritative boundary that downstream code cannot bypass
6. if the runtime later only reads a server-issued cookie, storage value, token, or cached blob, test whether injecting a verified sample removes the async bootstrap from the hot path
7. allow structural failures to propagate; suppress only the exact recoverable error class you can justify
8. keep the patch local to the helper runtime, not a whole browser dependency

## Boundary-selection rule

Patch the nearest stable boundary, not the prettiest one.

Prefer these boundaries over one-off instance patching when the target keeps rebinding helpers:

- prototype methods such as `XMLHttpRequest.prototype.open` or `.send`
- constructor-time wrappers
- transport-wrapper ingress before mutation
- request egress after mutation but before live HTTP

If the runtime can replace one instance method and skip your patch, that patch surface is too low.

## Common traps

- patching one object instance when the runtime clones, rebinds, or replaces the method upstream
- replaying an entire async bootstrap when the signer only reads an already-issued cookie, storage slot, or token
- copying cookie, storage, script, or resource snapshots when the runtime actually branches on `canvas`, WebGL, layout, style, or native descriptors
- patching the entire DOM when only one global value was needed
- treating a much shorter verifier sidecar as an answer-quality problem instead of environment evidence
- swallowing every runtime error and hiding recursion, stack overflow, or corrupted VM state
- blaming crypto before checking environment-sensitive branches

## Delivery rule

Prefer tiny local patches and explicit state injection over browser-backed execution.
