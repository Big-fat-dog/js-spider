# Embedded Browser Runtime Playbook

Use this playbook when host-bound JavaScript needs browser-visible semantics, but the target does not truly require a full browser for every request.

Examples of suitable runtimes include local embedded hosts such as `iv8`.

## Route here when

- the decoded field is not a simple Python rewrite and the code reads `navigator`, `screen`, `location`, `document.cookie`, timers, or DOM lifecycle state
- the target probes `Object.keys`, `Reflect.ownKeys`, descriptors, `Function.prototype.toString`, `JSON.stringify`, or `document.all` before the business signer runs
- page HTML plus inline or linked scripts are enough to seed a cookie, signed URL suffix, wrapped XHR body, or later token
- the request logic depends on parser order, lifecycle events, or timer scheduling
- you need local observation of XHR or fetch mutation without launching a real browser
- the host bridge is synchronous, but the runtime may still accept injected cookie, storage, or token state instead of replaying the full async bootstrap path on every call
- local output remains much shorter, simpler, or more repetitive than live output even after cookie, storage, script, or resource seeding

## Do not route here first when

- the field collapses to Base64, hex, JSON, SHA, HMAC, AES, or another standard chain you can handwrite and verify in Python
- the flow still needs real rendering, gestures, challenge images, canvas entropy, WebGL behavior, or live browser state on each request
- the runtime would become a hidden replacement for all HTTP instead of a narrow bootstrap or helper stage

## Decision ladder

1. Decode first.
   Prove whether the problem is still just a standard algorithm or compact packet format.

2. Handwrite in Python when the proof is cheap.
   If fixed-input checks already match, stop there.

3. Escalate to an embedded runtime only for host semantics.
   Use it when the JavaScript truly needs DOM, timer, cookie, XHR, or native-surface behavior.

4. Keep the runtime local.
   Recover explicit artifacts such as:
   - cookie string
   - final signed URL
   - wrapped body
   - token
   - decoded payload

5. Hand control back to Python.
   Python should still own live HTTP, retries, parsing, persistence, and scaling.

## High-value runtime moves

- Use `page.load`-style offline bootstrap when lifecycle events, inline scripts, or XHR hooks matter.
- Use plain DOM insertion only when you need parsing without script execution.
- Prefer DOM or script insertion over blocking `vm` evaluation when timers, microtasks, or self-issued XHR or fetch calls must fire.
- Freeze the UA major version when parser budget or event ordering changes behavior.
- Use logical time to advance timers and queued work without waiting on wall clock time.
- If a bootstrap runtime exposes a stable getter after synchronous init, harvest that artifact before trying to finish every later timer callback.
- If the chosen host bridge is synchronous, test whether the runtime only consumes already-issued state from `document.cookie`, storage, or one cached object. If so, inject a verified sample and defer full refresh-path reversal until replay evidence says it is necessary.
- When a local runtime self-issues the decisive request, intercept body and headers locally and return the minimal fake success response needed to keep the runtime moving.
- Watch API probes before broad patching so you know whether the missing surface is identity, enumeration, timing, cookie state, or a native-looking function boundary.
- If cookie, storage, scripts, or resource maps barely move the artifact, stop replaying more bootstrap and trace which native surfaces are actually probed.
- Treat `canvas`, WebGL, `getComputedStyle`, layout metrics, and native descriptor identity as first-class host surfaces; bridge them with narrow local adapters or stubs before escalating to broader emulation.
- Read local net-log style artifacts when the runtime can show the final URL, body, or cookie after wrapper mutation.

## Evidence to record

- exact HTML or bootstrap response used
- offline resource map or script bundle map
- environment overrides and omitted defaults
- structural metrics such as artifact length, field presence, repeated blocks, or entropy changes before and after each patch
- UA major version
- timer mode and every explicit event-loop advance
- final artifact extracted from the runtime
- fixed-input checks that prove the runtime output matches the live sample

## Common traps

- using an embedded runtime before trying the trivial Python rewrite
- feeding the wrong UA version and then blaming crypto for an ordering mismatch
- using full page bootstrap when plain DOM parsing would do
- insisting on full async bootstrap replay when the runtime only needs one already-issued cookie, storage value, or token to proceed
- replaying cookies, storage, scripts, and resource maps forever when the real gap is a null or fake native surface such as `canvas`, WebGL, or layout APIs
- letting the runtime issue real business HTTP when only local mutation evidence was needed
- patching dozens of globals before checking which API probe actually branched
- mistaking a much shorter verifier sidecar for a bad answer instead of a host-fidelity gap
- keeping a broad helper alive after you have already identified the one field that must be recovered

## Delivery rule

An embedded runtime is acceptable only as a local bootstrap or helper stage.

The final collector should read like:

`Python request -> local runtime bootstrap or signer recovery -> explicit artifact extraction -> Python replay`

Not:

`Python orchestrates a hidden browser replacement`
