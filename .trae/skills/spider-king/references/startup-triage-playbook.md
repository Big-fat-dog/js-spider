# Startup Triage Playbook

Use this reference at the start of every fresh target.

The goal is to decide what kind of fight this is before you load giant bundles or poison the page with broad hooks.

## Startup gate

Complete these three checks first:

1. environment and tool sanity
   - run `scripts/check_reverse_env.py` when local execution is available
   - confirm whether both `chrome-devtools` and `js-reverse` are usable
   - note whether a local embedded runtime such as `iv8` is available when host-bound bootstrap is suspected
   - report blockers early instead of pretending the missing tool does not matter
2. family triage
   - choose the first family that explains the failure mode best
   - if the family changes after new evidence, restate it explicitly
3. delivery intent
   - state the smallest acceptable final shape
   - reject browser-backed replay, profile-bound state, and automation-driven submission up front

## Escalation ladder before full browser dependence

Use the smallest faithful layer that explains the evidence:

1. simple decode or standard algorithm: handwrite in Python first
2. host-bound JavaScript without true interaction: route to `references/embedded-browser-runtime-playbook.md`
3. full interaction or rendering dependence: observe in browser, but keep the delivery gate strict and do not confuse observation with the final collector

## Family triage

Choose one primary family for the application contract.
Add the secondary tag `transport-gated` when TLS, ALPN, UA, HTTP version, or route-local admission blocks the clean baseline before application semantics are visible.

### `signer-gated`

Symptoms:

- one or more request fields change every time
- the server rejects stale `sign`, `m`, `token`, header, or wrapper output
- the request initiator points into wrapper or helper logic

First move:

- capture one good request
- trace the initiator
- locate the canonical mutation point
- if the field collapses to a standard digest, compact JSON, or obvious packet format, handwrite it in Python before touching any runtime
- if the code reads host objects, lifecycle state, timers, or XHR wrappers, route to `references/embedded-browser-runtime-playbook.md`

Primary references:

- `references/transport-wrapper-playbook.md`
- `references/patched-helper-playbook.md`
- `references/crypto-patterns.md`
- `references/embedded-browser-runtime-playbook.md` when host semantics matter

### `transport-gated` (secondary tag)

Symptoms:

- standard HTTP clients fail at H2 reset, TLS EOF, handshake timeout, or early disconnect before meaningful application data appears
- the same route behaves differently across UA families, HTTP versions, or client stacks
- impersonated transport or mobile or app UA passes while default desktop or stdlib traffic fails
- a sibling auth, identity, or business route bypasses a challenged landing route

First move:

- freeze a small admission matrix across route, client stack, UA family, and HTTP version
- find one narrow profile that admits the baseline cleanly
- test route-local bypasses before loading giant bundles
- continue normal family triage only after application semantics become visible

Primary references:

- `references/transport-pre-gate-playbook.md`
- `references/env-diff-playbook.md`

### `verifier-gated`

Symptoms:

- the business request only works after a verifier, challenge, or warm-up step
- the page starts failing once hooks or breakpoints are installed
- there is no meaningful business signer, but a token, cookie, or coordinates appear after a separate request

First move:

- capture a clean untouched baseline before invasive instrumentation
- diff requests and verifier outputs first
- only then add the narrowest hook that proves the boundary
- if challenge HTML plus scripts appear to seed the cookie, URL suffix, or verifier token, route to `references/embedded-browser-runtime-playbook.md`
- if a bootstrap runtime exposes a getter after init or self-issues the decisive request, route to `references/challenge-artifact-harvest-playbook.md`

Primary references:

- `references/verifier-replay-playbook.md`
- `references/troubleshooting-playbook.md`
- `references/cookie-provenance-playbook.md` when cookies mutate during the verifier
- `references/embedded-browser-runtime-playbook.md` when offline bootstrap may recover the verifier state
- `references/challenge-artifact-harvest-playbook.md` when the verifier answer can be harvested locally from a runtime boundary

### `decode-gated`

Symptoms:

- the request succeeds, but the payload stays unreadable
- the body needs glyph mapping, decompression, protobuf, Base64, or layered decode
- fonts, side assets, or tiny helper functions decide whether the response becomes usable

First move:

- freeze the raw payload first
- locate the first consumer of the unreadable data
- rebuild the decode chain locally before scaling collection

Primary references:

- `references/response-decode-playbook.md`
- `references/side-asset-bootstrap-playbook.md`
- `references/structured-transport-playbook.md` when the payload sits inside a binary envelope

### `session-gated`

Symptoms:

- login, pairing, subscribe, heartbeat, or reconnect order decides success
- auth appears once, but later frames fail unless counters, tags, or keys stay in order
- media download or decryption needs secrets derived from prior traffic

First move:

- freeze one full successful transcript
- separate handshake, keepalive, and business frames before reading payload semantics
- rebuild one stable local session before adding scale

Primary references:

- `references/stateful-stream-e2ee-playbook.md`
- `references/structured-transport-playbook.md`
- `references/session-contract-playbook.md`

## Observer-effect rule

If hooks, breakpoints, or monkey patches make the target behave differently, assume your tooling may be changing the sample.

In that case:

1. revert to the cleanest possible capture
2. save one untouched request and response pair
3. move hooks outward toward the transport boundary
4. prefer initiator stacks and request diffs over broad global monkey patches

Do not call the target "browser-only" until you have ruled out your own instrumentation.
