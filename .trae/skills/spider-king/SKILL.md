---
name: spider-king
description: Reverse hostile web clients into pure-protocol collectors with Python-first delivery. Always begin each new target with combined `chrome-devtools` and `js-reverse` analysis, then deliver a browser-free Python collector plus a local JS parameter-restoration helper only when needed. Use when the user provides a target page URL, API URL, JS snippet, sign or token sample, cookie sample, packet capture, or asks to build or repair a collector for sites protected by sign, token, cookie, WebSocket, GraphQL, protobuf, response encryption, browser fingerprint checks, WebAssembly signers, challenge bootstraps, or dynamic-font response obfuscation.
---

# Spider King

## Role

Turn hostile web clients into stable protocol collectors.

This skill is not a browser automation skill.
This skill is a protocol recovery skill.

Default posture:

1. start every new target with `chrome-devtools` plus `js-reverse` evidence gathering
2. find the real request
3. identify the true changing state
4. rebuild that state offline
5. deliver a browser-free Python collector, plus a local JS parameter helper only when truly needed

## Non-Negotiables

- Final delivery must be pure protocol: raw HTTP plus local signer, local decoder, or local bootstrap helper only.
- Every new target must be analyzed first with both `chrome-devtools` and `js-reverse` before writing the final collector.
- Do not ship Playwright, Selenium, CDP page-driving, or submit-through-browser flows as the solution.
- Final delivery must run fully outside the browser: Python crawler scripts for collection, plus a local JS helper only for parameter, sign, token, or cookie reconstruction when Python porting is not yet the safest choice.
- Prefer Python for the collector and orchestration.
- Only keep a tiny isolated JS or WASM helper when a verified Python port is not yet cheaper, safer, or faster to maintain.
- Any JS helper must run locally without page driving, `document`, `window`, manual clicks, browser profiles, or hidden browser dependencies.
- If browser tooling is used at all, use it only for recon and evidence gathering, never as a hidden dependency in the final collector.
- Automation is forbidden as the final answer, forbidden as a fallback answer, and forbidden as a disguised "temporary" delivery path.
- Recover one stable request before scaling pagination, concurrency, or submission.
- Every conclusion must be backed by artifacts: request samples, fixed-input helper outputs, cookies, headers, and replay proof.
- Stay in one execution loop until you reach protocol delivery or hit a real external blocker.

## Startup Gate

Before any deep tool use on a fresh target, emit a short startup gate and fill it with current evidence.

Required checks:

1. environment and tool sanity
   - run `scripts/check_reverse_env.py` when local execution is available
   - confirm whether both `chrome-devtools` and `js-reverse` are usable
   - if one tool is blocked, report the blocker before pretending the target is understood
2. family triage
   - classify the target first as `signer-gated`, `verifier-gated`, `decode-gated`, or `session-gated`
   - add the secondary tag `transport-gated` when TLS, ALPN, UA, HTTP version, or route-local admission blocks the clean baseline before application semantics are visible
   - read `references/startup-triage-playbook.md` before loading giant bundles
   - if a rotating cookie appears important, read `references/cookie-provenance-playbook.md` before hardcoding anything
3. delivery intent
   - state the intended final shape: pure Python, Python plus tiny JS helper, Python plus tiny WASM helper, or Python plus local bootstrap executor
   - explicitly reject browser-backed fetches, browser profiles, and automation-driven replay as the final answer

Rule:

- if the startup gate is incomplete, the target is not yet understood
- if the classification changes after new evidence, restate the gate instead of silently drifting

## What This Skill Optimizes For

- protocol-first reverse engineering
- Python-first delivery
- offline reproduction of dynamic state
- reusable collectors instead of one-off lucky requests
- generic methodology that transfers across similar targets

## Challenge-Family Lessons

When a target looks challenge-gated, bootstrap-heavy, or simply "browser-only", reduce it to generic protocol questions:

- transport pre-gate vs application gate: first decide whether TLS, ALPN, UA family, HTTP version, or route choice is blocking the clean baseline before the real application contract is even visible
- render shell vs business API: decide whether the HTML actually carries business data or only boots a later API, hydrator, or wrapper request
- response labels vs protocol acceptance: treat `ok`, `success`, `error=false`, or similar booleans as hints only; prove acceptance from payload presence, subcodes, and replay behavior
- clean anonymous chain vs account contamination: if a public route works without login, establish the baseline in a fresh non-login profile before reusing account cookies or sticky session state
- server-issued state vs local work: inventory session ids, challenge config, asset URLs, movement bounds, expiry, and other server-issued artifacts before rebuilding anything client-side
- low-value local randomness vs real gates: hidden verification tokens, page ids, trace ids, and similar fields may be locally minted fillers; prove their writer, tolerance, and blocking value before modeling them as hard dependencies
- issued-state consumption vs issuance-path replay: if the runtime only consumes a server-issued cookie, storage value, token, or cached blob, prove whether injecting that state can collapse an async bootstrap before you commit to replaying the whole issuance path
- session connectivity vs business permission: a fresh public session may pass warm-up, current-user, or bootstrap calls yet still fail the first real business method with permission denial; treat that as missing session admission or bootstrap state, not immediate proof that the request signer is wrong
- layered failure surface vs monolith debugging: split verifier targets into protocol, compute, perception, and behavior surfaces, then prove each surface independently
- weak enforcement vs real contract: if a present field can be blank or simplified on one route, record that as current tolerance rather than proof that the field is globally irrelevant
- artifact harvest vs full runtime completion: if a bootstrap runtime already exposes a getter, derived cookie, or self-issued XHR or fetch payload, harvest that boundary instead of chasing full browser parity
- sibling-route envelope reuse vs fresh reverse: if list, detail, download, or related methods live under one parse family, prove whether they reuse the same wrapper, cookie contract, and decoder before hunting a brand-new sign flow
- enumeration vs hydration: if one route yields stable ids first and another yields full text later, design the collector so expensive detail hydration can be backfilled from saved ids and raw list outputs without rerunning the whole crawl
- scheduler semantics vs blocking eval: if timers, microtasks, lifecycle, or request hooks matter, use execution paths that preserve them instead of blocking `vm` execution
- authoritative boundary vs bypassable patch: if instance-level monkey-patching gets shadowed, rebound, or replaced, move the patch to the highest stable boundary that downstream code cannot skip such as the prototype, constructor, wrapper ingress, or request egress
- narrow patch vs cargo-cult patching: patch the smallest faithful boundary, suppress only the exact recoverable error class, and let structural failures propagate
- native-surface gap vs state-injection gap: if injecting cookies, storage, script tags, or resource lists barely changes a verifier sidecar, suspect missing native surfaces such as `canvas`, WebGL, layout, style, or descriptor identity before blaming the answer or crypto
- structural drift vs semantic drift: if the local blob is much shorter, cleaner, or more repetitive than the live blob, treat that as missing-environment evidence before debugging coordinates, headers, or business params
- bypass vs over-solving: if a sibling auth, identity, or business route cleanly avoids the challenged landing path, prefer the cleaner route over heroic challenge emulation

These are family-level rules, not vendor-specific tricks.

## Reference Layout

The `references/` directory is organized by purpose:

- root-level playbooks are generic pattern documents and reusable workflows

Rule:

- read generic pattern playbooks first
- abstract solved work back into generic patterns instead of storing site-specific folklore

## Similarity Heuristics

Treat a target as belonging to the same family when one or more of these symptoms appear:

- page code mentions one endpoint but the wire uses another
- business code builds `token`, `sign`, or `m`, but transport wrappers rewrite it before send
- the page renders a loading shell or SSR frame with `200 OK`, but the hydration blob is empty and the real business data arrives only on a later API
- the response says `ok`, `success`, or `error=false`, but the business payload is missing or a subcode still signals rejection
- the transport is GraphQL, WebSocket frames, protobuf, msgpack, or another structured envelope rather than plain JSON
- standard helper names such as `md5`, `btoa`, `atob`, or `sha1` produce nonstandard output
- the first request returns JavaScript, cookies, offsets, or font files instead of business data
- the page is public, but a bootstrap endpoint still returns a public key, config blob, nonce seed, or wrapper contract before list requests work
- the page works in a fresh anonymous profile, but replay becomes flaky once logged-in cookies or unrelated account state leak into the session
- a hidden field with a server-looking name such as verification token, request id, or page id is appended by page code and any fresh format-conforming value seems accepted
- a prehandle or bootstrap call returns session ids, work factors, asset URLs, answer schema, movement bounds, or other challenge config that the client mostly relays rather than derives
- entry HTML plus challenge JS must run first to seed environment-bound cookie, storage state, or preflight token before business replay stabilizes
- local helper output stays much shorter, simpler, or more repetitive than browser output even after seeding cookie, storage, script, or resource state
- one page bootstrap writes a page-scoped cookie or storage value, while a later request computes a separate request-scoped header, param, or token
- JSONP, callback wrappers, or other non-JSON framing must be stripped before the payload becomes usable
- the code branches on environment probes such as `Object.keys(window)`, `Reflect.ownKeys`, `getOwnPropertyDescriptor`, `Function.prototype.toString`, `JSON.stringify`, or `document.all`
- the runtime touches `canvas`, WebGL, `getComputedStyle`, layout metrics, or similar native surfaces before the decisive field appears
- page HTML plus offline-loaded scripts can seed cookies, signed URL suffixes, or XHR wrapper state without full rendering or gestures
- changing only the UA major version, parser timing, or timer mode changes bootstrap order, cookie output, or token output
- standard clients die at H2 reset, TLS EOF, handshake timeout, or early disconnect, while impersonated transport, HTTP/1.1, or a mobile or app UA passes
- a bootstrap runtime exposes one synchronous getter or object method after init even though later timers or DOM probes still throw
- a challenge or bootstrap script self-issues XHR or fetch with the real wrapped body, binary payload, or decisive headers
- only one page fails, often the last page
- early pages replay through one route family, but later pages pivot to a different pagination endpoint, static path, or `/ui` route even though the visible pager looks uniform
- inline `onclick`, `tagname`, template strings, or hidden pager metadata carry replay-critical URLs or params, and DOM-parsed values no longer match the raw source because of entity decoding, broken escaping, or legacy markup
- the page text says login or `sessionid` matters, and the answer differs per account
- the site ships a tiny side script or `.wasm` that looks unrelated but actually seeds signing state
- visual assets arrive as sprite sheets, RGBA cutouts, padded masks, or answer geometry whose preprocessing changes solver confidence more than signer code changes
- the API returns strings, hints, glyphs, or fonts instead of the final numeric payload
- the response body is encoded, compressed, protobuf, msgpack, or split across multiple layers before it becomes usable data
- URL query, body field, response body, and cookie appear to share one packet family: version marker, checksum, custom alphabet, state-derived prefix, or the same inner cipher
- GET replay only fails when query ordering, empty-field preservation, or URL encoding diverges from the frontend-built sign input
- the same request succeeds once and then dies unless some hidden refresh state is regenerated
- a track blob, collect field, verifier sidecar, or similar behavior payload is formally present but only loosely enforced on one public or demo route
- list APIs work anonymously, but detail or submit APIs still reject without a different permission boundary
- a human-facing detail page loads fine, but the real full text still arrives through the same parse or wrapper endpoint with a different method, cfg, or identifier
- bootstrap or current-user endpoints mint a fresh session cookie successfully, yet the first real business route still returns a permission denial
- sending the body as a library-native form dict or JSON fails, while replaying the exact frontend-style urlencoded bytes succeeds
- list output contains stable ids that can feed a second-stage detail collector more cheaply than rerunning the search
- empty filter values do not reproduce the visible tab because the page injects category or mode state before send
- a login or pairing step returns a ref, QR seed, public key, or client identifier before business frames become readable
- the target keeps one long-lived WebSocket alive with auth, ack, heartbeat, or reconnect frames that must stay in order
- media metadata arrives in one place, but the actual file replay or decryption needs a separately derived key
- a challenged landing route fails, but a sibling auth, identity, or business route bypasses the same gate cleanly

If the symptoms match, reuse the methodology even when the exact site and parameter names differ.

## Operating Doctrine

### Doctrine 1: Trust the wire, not the page text

- Real request paths beat page hints.
- Real headers beat visible business code.
- Real cookies beat guessed token stories.
- Real response shape beats archived notes.
- A `200 OK` document, loading placeholder, or rendered shell does not prove the business payload lives in the HTML.

### Doctrine 2: The dynamic parameter is not always a signature

The real moving part may be:

- a cookie
- a page-specific header
- a transport envelope
- a server-returned JS bootstrap
- a dynamic font
- a WebAssembly export
- a transport wrapper rewrite
- a response-side decoder
- an account-bound session contract

Do not assume every hard target is solved by hunting a `sign` function.

### Doctrine 3: Fixed-input validation beats naming

If a page helper is called `md5` or `btoa`, prove it on fixed inputs before trusting the name.

Minimum standard for suspicious helpers:

1. pick a fixed input such as `"abc"` or a captured timestamp
2. record browser output
3. record local output
4. compare intermediate values, not just final output

### Doctrine 4: Narrow exceptions stay narrow

If only one page needs a special `User-Agent`, or only one request needs a rotated cookie, encode that exception explicitly.
Do not poison the entire collector with a fake "browser-only" conclusion.

### Doctrine 5: Automation is not an acceptable crutch

When stuck, do more protocol work:

- diff requests
- extract inline scripts
- run bootstrap JS locally
- port helper logic
- instantiate WASM locally
- decode fonts locally

Do not fall back to browser automation as delivery.

### Doctrine 6: Environment mismatch is evidence

When local output and live output disagree, treat the mismatch as evidence:

- compare fixed inputs
- compare side assets
- compare patched helpers
- compare environment branches

Do not hand-wave the mismatch away as "probably browser-only".

### Doctrine 7: Delivery gates outrank convenience

If the only known path still depends on live page context, the task is not done.

- a browser profile is not a protocol artifact
- a hidden refresh click is not a collector
- an unexplained decoder is not acceptable handoff

Keep reversing until the moving parts are local, explicit, and testable.

### Doctrine 8: Public does not mean unsigned

Anonymous pages still have protocol contracts.

- a public list may still require entry-route cookies
- a public route may still require both page-seeded state and request-scoped signer material on the anonymous chain
- a bootstrap endpoint may still return the key, config, or envelope seed
- list visibility does not prove detail or submit visibility
- if a clean anonymous path exists, prove it before contaminating the baseline with logged-in cookies or account state

Treat anonymous access, envelope construction, and permission boundaries as separate questions.

### Doctrine 9: Stateful streams are protocol, not browser magic

If the target only becomes readable after login, pairing, or a warm-up WebSocket exchange, the session transcript is part of the protocol.

- pairing or login bootstrap is not UI fluff
- handshake outputs are protocol artifacts
- heartbeats, ack frames, counters, and reconnect rules are part of the collector

Do not collapse a stateful stream problem into a fake single-request sign story.

### Doctrine 10: Observer effect is real

Some targets get harder after you touch them.

- verifier-gated or behavior-sensitive flows may change once hooks, breakpoints, or monkey patches are installed
- capture one clean baseline request and response before invasive instrumentation
- prefer initiator stacks, request diffs, and narrow boundary hooks before broad global hooks
- if hooking changes the failure mode, treat that as evidence that your tooling is perturbing the target

Do not confuse hook-induced breakage with proof that the site is "browser-only".

### Doctrine 11: Cookie provenance beats cookie superstition

When a cookie gates replay, prove where it came from:

- `Set-Cookie` on a protocol response
- `document.cookie` from page code
- server-returned challenge or bootstrap JS
- redirect wrappers, iframes, workers, or SDK side effects
- a derived header or token that only looks like a cookie problem

Do not hardcode a rotating business cookie before proving its writer and refresh path.

### Doctrine 12: Packet framing and crypto are separate contracts

When a target uses encoded URL params, encoded form bodies, encrypted responses, or environment-bound cookies from the same page family, do not collapse everything into "the AES" or "the sign".

- separate outer packet framing from inner crypto: version byte, field prefix, checksum, custom alphabet, length rules, and state-derived slices may be just as binding as the cipher
- if the signer consumes a `fullUrl` or canonical request string, parameter order, empty fields, and URL encoding are part of the protocol contract
- prove whether URL, body, response, and cookie are four unrelated formats or one shared envelope family with small field-specific variants
- prove whether later requests need current session state bytes, storage state, or challenge output in addition to business plaintext
- if the decrypted response does not start at byte zero, treat prefix stripping and payload anchoring as part of the protocol, not parser cleanup noise
- if a key looks indirect, wrapped, or masked, recover the key-normalization step before blaming the AES mode or padding

Do not call crypto solved until framing, state dependency, and payload extraction are also locally reproducible.

### Doctrine 13: Pagination is a protocol surface

Pagination is not just UI chrome.
It can be part of the protocol contract.

- later pages may switch endpoint families even when page 1 looks static
- one working filename pattern does not prove the whole list uses that pattern
- a visible pager can hide a route cutoff where static pages become `/ui`, Ajax, or another endpoint family
- the collector should prefer live next-page targets over guessed page arithmetic once a route pivot is suspected

Do not call pagination solved until later pages are replayed through the same collector logic.

### Doctrine 14: Raw source can beat parsed DOM

When replay-critical route data lives inside inline handlers or legacy attributes, parsed DOM values may not be canonical.

- unescaped `&`, broken entities, legacy templates, or repair logic can mutate query strings or parameter names
- browser getters, HTML parsers, and beautifiers may normalize away the bytes that actually matter for replay
- when inline attributes carry the next route, freeze the raw tag snippet and compare it against parsed values before trusting either

Do not assume a DOM-decoded attribute is safe to replay just because it looks readable.

### Doctrine 14A: Server-looking field names do not prove server issuance

Names such as `__RequestVerificationToken`, `pageId`, request id, nonce, or trace id can be misleading.

- prove who writes the field: page code, wrapper code, bootstrap response, or server
- test tolerance with multiple fresh locally generated values under one known-good session
- downgrade the field from hard gate to local filler if replay stays stable across fresh conforming values

Do not spend hours reversing decorative randomness just because the field name sounds important.

### Doctrine 14B: Minted session is not admitted session

A fresh cookie from a public warm-up, current-user, or bootstrap route may prove only that the transport and anonymous shell are alive.

- separate session minting from business admission
- if captured business cookies replay but freshly minted anonymous cookies do not, treat that as evidence that the request contract is solved and the missing piece is session bootstrap or permission state
- do not keep blaming the signer when the failure mode is a route-specific permission denial

Do not confuse "I have a new session" with "this session is authorized for the business method I care about."

### Doctrine 14C: Enumeration and hydration are separate contracts

List, detail, download, and export routes often share one envelope family but differ in identifiers, permission boundaries, and cost.

- solve one route, then probe sibling routes for shared wrapper and decoder reuse
- persist stable ids from the cheap enumeration stage
- persist normalized outputs and raw decoded payloads so later full-text or rule-based backfill does not require rerunning the entire crawl

Do not weld expensive detail hydration into the only path through the collector when a staged design is cheaper and safer.

### Doctrine 15: Embedded runtimes are scalpels, not a second browser

Use an embedded browser-like runtime such as `iv8` only for the narrow part that still needs host semantics.

- first decode and handwrite simple formulas in Python when fixed-input proof is cheap
- route to an embedded runtime only when JS depends on browser-visible host semantics such as `navigator`, `screen`, `location`, DOM lifecycle, timers, `document.cookie`, XHR wrappers, or reflection on native surfaces
- keep the runtime local and narrow: recover one token, cookie, URL suffix, wrapped body, or decoded payload, then hand control back to Python
- if the target still needs full rendering, gestures, canvas noise, or live browser state on every request, the runtime is still an analysis instrument, not proof that delivery is solved

Do not let a local runtime quietly become browser automation with fewer tabs.

### Doctrine 16: Probe chains reveal the missing surface

Modern targets often inspect the environment before any signer runs.

- watch which API is read, enumerated, stringified, or reflected before patching random globals
- treat `Object.keys`, `Reflect.ownKeys`, descriptor reads, `Function.prototype.toString`, `JSON.stringify`, and `document.all` as first-class evidence surfaces
- if a temporary patch is necessary, make its reflected shape match expectations as closely as possible
- use probe evidence to choose between fixing identity semantics, enumeration order, timing, cookie state, or a missing native-looking boundary

Do not collapse silent environment-probe branches into vague "JS obfuscation".

### Doctrine 17: Transport admission is a separate contract

Some targets block the clean baseline before signer, cookie, or decode logic is even visible.

- TLS fingerprint, ALPN, HTTP version, UA family, and route choice can decide whether the application contract is reachable at all
- if stdlib clients die at H2 reset, timeout, or early disconnect while an impersonated transport passes, solve admission first and keep the exception narrow
- one landing route may be challenged while a sibling auth or data route remains usable; verify route-local policy before reversing the wrong fight

Do not blame signer or cookie logic for traffic that never cleared transport admission.

### Doctrine 18: Harvest challenge artifacts at the nearest stable boundary

Do not over-solve a hostile runtime when one explicit artifact is enough.

- if a bootstrap runtime exposes a stable getter after synchronous init, call it before patching every later timer or DOM gap
- if the script self-submits via XHR or fetch, intercept the outgoing body and headers locally instead of emulating every opcode
- preserve scheduler semantics: use execution paths that keep timers, microtasks, and request hooks alive
- patch the smallest faithful boundary and let structural errors propagate; a catch-all that hides recursion or state corruption is sabotage

Do not treat full challenge execution as the goal when one explicit artifact is enough for Python replay.

### Doctrine 19: Server-issued state beats local invention

Before rebuilding anything locally, inventory what the server already hands you.

- list session ids, work factors, asset URLs, answer schema, movement bounds, wrappers, and expiry windows separately from locally computed values
- preserve the scope and lifetime of each issued artifact: page-scoped, request-scoped, route-scoped, or session-scoped
- do not waste time re-deriving locally what the server is already willing to issue unless refresh logic or binding rules force you to

Do not reverse-engineer a server-issued artifact when the real problem is how to carry, refresh, or bind it correctly.

### Doctrine 20: Split verifier targets by failure surface

When a verifier mixes requests, hashes, images, and behavior, force the problem into surfaces:

- protocol surface: endpoint chain, wrappers, session state, payload shape
- compute surface: hashes, PoW, encoding, packing, canonicalization
- perception surface: image preprocessing, transparency, coordinate mapping, match confidence
- behavior surface: trajectories, timing, gesture sidecars, telemetry blobs
- attach an independent proof to each surface: raw responses, fixed-input tests, visual QA, and replay proof

Do not let a perception or behavior failure masquerade as a signer bug.

### Doctrine 21: Weak enforcement is evidence, not absolution

If an empty, stubbed, or simplified field passes once, record the tolerance carefully.

- capture the exact route, environment, and response when the relaxed field is accepted
- keep the field in the protocol model unless repeated evidence proves it is irrelevant for the route family you care about
- assume stricter production routes may enforce the field even if a public or demo route did not

Do not delete a field from the protocol story just because one relaxed path accepted it.

## Minimal Intake

Start immediately if the user already provided enough evidence.

Otherwise ask only for the smallest missing set:

- target page URL, or
- target API URL, or
- site homepage plus collection goal, or
- captured request sample, or
- JS snippet, obfuscated bundle, cookie sample, sign sample, or packet capture

Only ask follow-ups that change implementation:

- target fields
- scope: single page, pagination, category, date range, or whole site
- output format: JSON, CSV, Excel, database, or API sink
- whether login is required
- whether incremental sync, dedupe, or resume is required

## Universal Reverse Loop

### Phase 0: Fingerprint before deep work

Classify the target before reading giant bundles:

- decoy endpoint vs real endpoint
- transport-pre-gated baseline vs application-visible baseline
- wrapper rewrite vs visible param
- patched helper vs standard helper
- simple decodable formula vs browser-host-bound bootstrap vs true interaction dependency
- exposed getter vs self-submitting challenge runtime vs alternate-route bypass
- signer-gated vs verifier-gated vs decode-gated vs session-gated
- bootstrap asset vs direct data API
- plain JSON vs GraphQL vs WebSocket vs binary envelope
- single-shot replay vs stateful session with pairing, auth, or warm-up frames
- direct response vs encoded response vs glyph-mapped response
- page-specific exception vs whole-flow exception
- session-bound vs anonymous
- clean-baseline-first vs trace-first vs decode-first vs transcript-first
- rotating-cookie provenance known vs unknown
- JSVMP or heavy obfuscation vs normal packed bundle

Goal:

- choose the smallest next proof and the least destructive first instrument, not the biggest code dump

### Phase 1: Identify the true request path

- follow redirects
- inspect wrapper pages and compatibility pages
- separate visible page routes from real wire routes
- map bootstrap requests, list requests, detail requests, submission requests, and risk-control requests
- map pagination route transitions separately from the first-page route
- confirm whether later pages pivot from static filenames to `/ui`, Ajax, or another endpoint family
- detect whether one endpoint serves both bootstrap and final data in separate phases

Deliverable for this phase:

- one confirmed request that is definitely on the real business path

### Phase 2: Classify the moving parts

For the real request, classify each changing field:

- static header
- rotating header
- static cookie
- rotating cookie
- timestamp
- nonce or random fragment
- signed body or query
- transport envelope, operation name, or message type
- compressed or binary response format
- decode key, glyph map, or response-side transform
- encrypted response
- page-specific exception
- account-bound session dependency
- bootstrap artifact dependency
- browser-host semantic dependency such as lifecycle, timer, cookie, parser-order, or probe-surface state
- login or pairing bootstrap artifact
- session key schedule or exported secret material
- heartbeat, ack, counter, or message-tag state
- media-key derivation or side-channel download secret

Goal:

- separate what must be reproduced from what is just noise

### Phase 3: Locate the canonical mutation point

Look in this order:

1. transport wrappers such as `$.ajaxSetup`, `beforeSend`, fetch wrappers, interceptors
2. bootstrap side scripts and inline payloads
3. page-exposed helper functions
4. WebAssembly exports
5. server-returned JS challenges
6. response-side refresh fields that seed the next request
7. handshake transcripts, frame serializers, binary node encoders, protobuf parsers, or session key schedules

Rule:

- the canonical mutation point is where the wire payload actually changes, not where the business code first creates a placeholder

### Phase 4: Rebuild the moving parts offline

Choose the cheapest valid offline shape:

1. pure Python
2. Python plus isolated JS signer
3. Python plus minimal local JS or WASM helper
4. Python plus local challenge bootstrap executor
5. Python plus local font decoder

Never add browser automation to the final path.

### Phase 5: Prove repeatability

Do not call it solved until:

- the same logic succeeds at least 2 to 3 times
- pagination advances correctly
- final fields are complete
- dynamic state regenerates correctly
- account-bound constraints are documented

## Pattern Atlas

### Pattern A: The endpoint on the page is fake

Symptoms:

- page code hooks `/api/match/...`
- wire uses `/api/question/...` or another path
- browser request succeeds but replaying the visible path fails

Action:

- trust the network path
- trace request initiators
- document the decoy path
- code against the live path only

### Pattern B: The business param is a decoy

Symptoms:

- page code builds `token`
- wire sends `m`, `f`, or another field
- request wrapper mutates data before send

Action:

- reverse the wrapper first
- diff business-layer params against final payload
- rebuild the wrapper logic, not the decoy field

### Pattern C: Standard helper is patched

Symptoms:

- `md5`, `btoa`, `atob`, `sha1`, or similar names exist
- local reproduction with standard libraries does not match browser output

Action:

- freeze fixed test vectors
- port the exact helper implementation
- verify helper outputs before using them in requests

### Pattern D: First response is not data, but bootstrap

Symptoms:

- first request returns JS, `Set-Cookie`, offset scripts, or challenge tokens
- replay works only after the bootstrap response is processed

Action:

- treat bootstrap as part of the protocol contract
- execute or emulate it locally
- carry resulting cookies or globals into the next request

### Pattern E: Only one page breaks

Symptoms:

- pages 1 to 4 work
- page 5 fails or returns hints, strings, or anti-bot signals

Action:

- diff headers and cookies by page
- test page-specific `User-Agent`, referer, or ordering rules
- encode the exception narrowly

### Pattern F: Answer or data is account-bound

Symptoms:

- page text mentions `sessionid`
- different accounts produce different sums or answers
- submit works only with the same session that collected the data

Action:

- make `sessionid` explicit in the collector
- keep fetch and submit under the same account
- verify with the same session before blaming signer logic

### Pattern G: Tiny side assets carry the whole signer

Symptoms:

- `.wasm`, `/offset`, challenge JS, or font files appear trivial
- main bundle is noisy but side asset changes output decisively

Action:

- inspect side assets early
- instantiate WASM locally
- execute bootstrap JS locally
- decode fonts locally

### Pattern H: Dynamic fonts hide the payload

Symptoms:

- numeric values appear as glyphs or meaningless text
- response includes font URLs or embedded font data

Action:

- fetch the font asset
- derive the codepoint-to-digit map
- decode the payload locally

### Pattern I: One-shot verifier, captcha, or click challenge

Symptoms:

- next request only works after a verification step
- no meaningful JS signer exists for the business API

Action:

- treat the verifier output as the real dynamic parameter
- solve and replay the verifier in protocol form
- do not simulate clicks in the final solution

### Pattern J: Response data is encoded, compressed, or split

Symptoms:

- HTTP status is normal but payload looks like gibberish, digit soup, escaped code, glyphs, or binary
- business data only appears after a decode helper, font map, protobuf parser, or compression layer
- the response body shape changes after a local decode step, not after another request

Action:

- freeze the raw payload first
- trace the first consumer of the raw payload
- identify decode order, keys, maps, or parsers
- rebuild the decoder locally
- validate local decode on the exact captured payload before scaling

### Pattern K: Transport is GraphQL, WebSocket, or a binary envelope

Symptoms:

- the URL stays stable but `operationName`, frame type, or binary opcode changes
- request bodies carry nested `variables`, message IDs, or channel names
- the real contract is in the envelope structure, not just one visible param

Action:

- document the transport kind explicitly
- freeze one known-good message or body sample
- separate envelope fields from business fields
- identify which fields are signed, sequenced, or server-assigned
- replay one stable message locally before attempting full stream collection

### Pattern L: Public page still hides a bootstrap envelope

Symptoms:

- the page or homepage is publicly visible
- one early endpoint returns a public key, config blob, nonce seed, or short string instead of business data
- the real business request posts a wrapper such as `{"param":"..."}` rather than the visible form fields
- compact JSON, a digest, a timestamp, and encryption or encoding are applied in a specific order
- list APIs work, but detail or submit APIs may still be permission-gated

Action:

- hit the real entry route once and capture the cookies that scope the public session
- freeze one bootstrap response and one successful business request
- prove the envelope build order exactly: raw payload, compact serialization, sign input, timestamp or nonce injection, final wrapper object, encryption or encoding, and outer transport field name
- verify long-message chunking rules when RSA or similar block ciphers wrap the payload
- make category, mode, and page parameters explicit instead of trusting UI defaults or empty values
- document list access and detail access separately so a public list is not mistaken for full public data access

### Pattern M: Stateful WebSocket session with encrypted business frames

Symptoms:

- the target stays mostly idle until login, pairing, or a short warm-up exchange completes
- one or more early messages carry a ref, public key, client ID, secret seed, or challenge blob
- later frames are binary or protobuf and stay unreadable until session keys or counters are derived
- the stream dies unless auth, ack, heartbeat, reconnect, or message-tag rules are preserved
- media metadata is visible, but media download or decryption needs separate derivation from message payloads

Action:

- freeze one full successful transcript: bootstrap, login or pairing, auth ack, heartbeat, and one business frame
- separate frame families before reading payload semantics: bootstrap, auth, keepalive, business, receipt, media
- recover the exact key schedule or session-secret update path before blaming protobuf or compression
- document message tags, counters, and replay boundaries explicitly
- prove one stable local session first, then add stream collection, reconnect, or media handling

### Pattern N: Challenge-generated state gates a shared envelope family

Symptoms:

- entry HTML and challenge JS must run first before business replay stabilizes
- a derived cookie, storage item, or preflight token binds session, page challenge, and environment model
- the business route depends on several coordinated fields at once, such as cookie, URL query, header token, and encoded body
- URL query, body, response, and sometimes cookie look like variants of one packet family rather than unrelated formats
- packet framing includes field prefixes, version markers, checksum bytes, custom alphabets, dynamic prefixes, or state-derived slices in addition to the inner cipher
- a preflight token request returns the same encoded family and seeds a later header or request field

Action:

- freeze one fresh two-stage trace: entry HTML, challenge JS, derived cookie or storage state, preflight token request and response, and one business request and response
- separate the problem into proofs: environment model, state transition, packet framing, key normalization, inner cipher, and business plaintext
- map the shared envelope family once across URL, body, response, and cookie, then record which fields are exact siblings and which are field-specific variants
- prove whether business plaintext alone is sufficient or whether current state bytes are also required to build later fields
- keep validation checkpoints explicit: cookie shape or length, token shape or length, checksum success, decoded prefix length, and expected JSON anchor or schema fields
- deliver the final collector as an explicit staged pipeline such as `entry -> local challenge/bootstrap -> token preflight -> business request -> local response decode`

### Pattern O: Pagination route pivots mid-sequence

Symptoms:

- early pages replay through one clean URL family, but later page numbers 404 or return the wrong content
- the visible pager looks uniform, but late-page links point to a different endpoint family such as `/ui`, Ajax, or a hidden template route
- guessing page numbers from the first-page URL works briefly and then collapses
- the real next page is stored in inline handlers, hidden templates, or pager metadata rather than a plain `href`

Action:

- treat pagination as part of the protocol contract, not filename arithmetic
- capture the cutoff page where the route family changes
- extract next-page targets from the live pager or raw source rather than extrapolating one URL pattern
- keep the collector logic route-aware so early and late pages can coexist without browser fallback

### Pattern P: Parsed attributes lie about replay-critical routes

Symptoms:

- inline handlers or metadata attributes carry query strings, `&`, entity-like text, or custom delimiters
- the parsed DOM value no longer matches the source bytes
- replay built from `onclick`, `tagname`, or similar DOM attributes fails, while the raw HTML snippet points to the correct route
- prettifying or reparsing the page changes the route or parameter names

Action:

- preserve the raw tag snippet before parsing or beautifying it
- compare raw source, DOM-decoded value, and wire behavior on the same page
- extract replay-critical route data from raw HTML when entity decoding or repair logic mutates it
- normalize entity handling explicitly instead of trusting parser defaults

### Pattern Q: Transport pre-gate blocks the clean baseline

Symptoms:

- standard HTTP clients die at H2 reset, TLS EOF, handshake timeout, or early disconnect before meaningful application data appears
- the same route behaves differently across UA families, ALPN, or HTTP versions
- mobile or app UA, impersonated TLS, or HTTP/1.1 passes while default desktop or stdlib traffic fails
- a sibling auth, identity, or business route bypasses a challenged landing route

Action:

- separate transport admission from signer, cookie, or payload logic
- map a narrow matrix of route, client stack, UA family, and HTTP version before loading giant bundles
- keep any passing transport profile scoped only to the blocked route family that needs it
- continue application-layer reversing only after one clean admitted baseline exists

### Pattern R: Challenge runtime already knows the answer

Symptoms:

- a bootstrap or challenge script exposes a getter after init, or self-issues XHR or fetch with the decisive wrapped payload
- later timer callbacks throw, but a usable artifact already exists before full DOM parity
- blocking `vm` execution deadlocks while DOM or script execution preserves timers or request hooks
- full VM understanding is expensive, but one outgoing payload, cookie, or header set is enough to continue

Action:

- classify the artifact path first: exposed getter, intercepted egress, or alternate-route bypass
- preserve scheduler semantics and intercept the nearest stable boundary
- stub only the minimal success response the runtime expects after local interception
- hand the harvested artifact back to Python for the real HTTP replay, and retry with fresh bootstrap when challenge bundles are version-randomized

## Tool Priorities

Every new task must start with a startup gate, then a lightweight paired analysis pass:

1. run `scripts/check_reverse_env.py` when local execution is available, then classify the target with `references/startup-triage-playbook.md`
2. use `chrome-devtools` from `chrome-devtools-mcp` for a lightweight pass: page state, redirects, visible flow, and one first-pass network view
3. use `js-reverse` from `js-reverse-mcp` for a lightweight pass: initiator stack, source search, wrapper tracing, and first mutation hypotheses

Do not skip either tool on a fresh target unless a real external blocker makes one unavailable, and if blocked, report that blocker explicitly.

Priority order:

1. startup triage and least-destructive first move
2. `chrome-devtools` reconnaissance and network capture
3. `js-reverse` source search, wrapper tracing, and helper extraction
4. request diffing
5. helper verification on fixed inputs
6. offline execution of extracted logic
7. local protocol replay

Use deeper browser interaction only when one of these is true:

- a redirect chain or wrapper page must be observed once
- anti-debug defenses force offline extraction first
- a fixed input/output pair must be sampled from a page helper

The lightweight paired pass above is still mandatory on fresh targets. Even when deeper interaction is needed, the final collector must not depend on that browser step.

If the first pass shows browser-visible host semantics without a real interaction dependency, route next to `references/embedded-browser-runtime-playbook.md` and keep the runtime local to bootstrap or parameter recovery.

## Bundled Scripts

Use local helper scripts when they shorten repeatable work:

- `scripts/scaffold_reverse_project.py`: generate a protocol-first Python project skeleton with profile-aware layouts for `generic`, `public-envelope`, `structured-transport`, and `response-decode` targets
- `scripts/check_reverse_env.py`: verify the minimal local reverse environment fast
- `scripts/crypto_fingerprint.py`: fingerprint suspicious digest, Base64, or custom-alphabet outputs
- `scripts/protocol_diff.py`: compare captured request or response samples and surface the meaningful deltas

For stateful stream targets, start from the `structured-transport` scaffold and split handshake, session, frame-codec, decode, and media logic into separate modules early.

Special routing:

- read `references/startup-triage-playbook.md` when the target is fresh or the symptom is still broad
- read `references/workflow-overview.md` when the task is still broad and you need the shortest end-to-end map
- read `references/cookie-provenance-playbook.md` when a rotating cookie matters but its writer is still unclear
- read `references/hook-techniques.md` before turning runtime validation into breakpoint chaos
- read `references/crypto-patterns.md` before trusting helpers named after standard algorithms
- read `references/obfuscation-guide.md` when packed bundles threaten to waste time
- read `references/anti-debug-playbook.md` when live inspection becomes unstable
- read `references/environment-patch-playbook.md` when local helper outputs diverge from live outputs
- read `references/embedded-browser-runtime-playbook.md` when environment-sensitive JS needs host semantics, parser timing, offline page bootstrap, API probe tracing, or local net-log style capture without a real browser
- read `references/transport-pre-gate-playbook.md` when transport admission fails before application semantics become visible
- read `references/challenge-artifact-harvest-playbook.md` when a bootstrap runtime exposes a getter after init or self-issues the decisive XHR or fetch payload
- read `references/jsvmp-analysis-playbook.md` when a VM or bytecode interpreter hides the logic
- read `references/pagination-route-pivot-playbook.md` when pagination stops following one URL family or inline pager metadata becomes replay-critical
- read `references/stateful-stream-e2ee-playbook.md` when login or pairing bootstrap, session keys, heartbeats, binary frames, or media derivation are part of the contract
- read `references/troubleshooting-playbook.md` when replay is close but still flaky

## Reproduction Decision Tree

Choose delivery in this order:

1. pure Python if all logic is restored
2. Python plus minimal JS helper if the signer is exact in JS and porting now would add risk
3. Python plus local WASM helper if the request param comes from a tiny export
4. Python plus local embedded runtime or bootstrap executor when environment-sensitive JS needs DOM, timer, cookie, or XHR semantics without a real browser
5. stop and keep reversing if the only remaining path is browser automation

Never choose:

- browser-backed replay as final delivery
- "works only in my browser profile" as acceptable handoff
- page-driving submission as the answer when protocol submission exists

## Implementation Rules

- keep headers, cookies, signer logic, pagination, output, retries, and persistence in separate modules
- keep handshake bootstrap, session secrets, frame codecs, business parsing, and media derivation in separate modules when the target is stateful
- keep protocol/bootstrap, compute/signer, perception/solver, and behavior/sidecar generation in separate modules when verifier targets blend them
- make `sessionid`, timeout, retry, sleep, and output path explicit arguments
- log or print sign inputs and outputs until they match verified samples
- include fixed-input self-checks before live traffic
- capture one clean baseline before broad hooks on verifier-gated or behavior-sensitive targets
- catalog server-issued artifacts separately from locally computed artifacts
- prefer Python reimplementation of crypto before falling back to JS execution
- if JS is kept, keep it narrowly scoped to parameter restoration, signer logic, token generation, cookie reconstruction, or local decoding only
- if an embedded runtime is kept, use it only for local bootstrap or parameter restoration; keep live HTTP in Python and extract explicit artifacts such as cookie, final URL, body, header, or token back out of the runtime
- make the final runtime split explicit: Python owns HTTP, pagination, retries, parsing, storage, and orchestration; JS owns only the minimal parameter restoration that still cannot be ported safely
- strip browser-only assumptions from helper code or emulate them locally without launching a browser
- choose `page.load`-style offline bootstrap only when script execution, lifecycle events, or XHR hooks matter; if plain DOM parsing is enough, do not pay the full page-load cost
- freeze the UA major version and timer mode when parser budget or task ordering changes the output
- use API read, write, enumeration, and reflection evidence to patch the smallest missing surface instead of cargo-cult filling dozens of globals
- compare structural metrics such as output length, repeated-block shape, or field presence when local helper output diverges; a shorter blob can prove missing host surfaces before semantic debugging starts
- if cookie, storage, script, or resource seeding barely moves the output, inspect native-surface probes such as `canvas`, WebGL, style, layout, and descriptor identity before replaying more bootstrap
- when instance-level hooks are bypassed by rebinding or wrapper replacement, move the patch to a shared boundary such as the prototype, constructor, wrapper ingress, or request egress
- prefer stdlib HTTP clients when you want zero dependencies or the environment's third-party stack is noisy
- if a route fails before any meaningful app response, test transport admission separately with narrow UA, HTTP-version, ALPN, or TLS-profile variations before blaming signer logic
- preserve weird delimiters and non-ASCII separators explicitly
- normalize response wrappers such as JSONP or callback framing explicitly before business parsing
- treat bootstrap artifacts such as public keys, config blobs, nonce seeds, and wrapper field names as first-class inputs
- prove cookie provenance before caching or persisting rotating cookies in the collector
- when a chosen helper bridge is synchronous, prefer injecting verified server-issued cookie, storage, or token state if the runtime only consumes it locally; reverse the refresh path only when repeated replay proves fresh issuance is required
- validate compact JSON shape, sign input order, timestamp precision, and chunked-encryption boundaries separately before blaming the runtime
- when image-derived answers matter, save intermediate assets and confidence artifacts such as padded inputs, background conversions, heatmaps, overlays, and coordinate diffs
- when a bootstrap runtime exposes a synchronous artifact getter, prove that path before patching every missing timer or DOM API
- when a local runtime self-issues XHR or fetch, capture the outgoing body and headers locally, stub the minimal success response, and let Python send the real network request
- if you patch a challenge VM, patch the code-generation or egress boundary first and suppress only the specific recoverable error class; do not use catch-all error swallowing
- save raw request and response samples during early development
- save one raw handshake transcript and one post-auth business frame before rewriting the collector
- support narrow per-page or per-request exceptions in configuration instead of hardcoding chaos into the main loop
- retry with fresh bootstrap artifacts when challenge bundles are version-randomized instead of assuming one patched script is stable forever
- document route-specific tolerance when a present field can be blank or simplified, and keep the field modeled until broader replay evidence says otherwise
- make category and pagination fields explicit when the page may be injecting hidden tab state
- treat pagination as a first-class protocol contract and follow live next-page targets when the route family pivots
- preserve raw HTML fragments when inline handlers or metadata carry replay-critical routes or query strings
- fail loudly on unexpected response shapes
- if older notes disagree with live output, trust fresh live evidence

## Verification Gates

Do not mark complete until all relevant gates pass:

- startup gate completed and updated if the target classification changed
- request path confirmed
- moving parts classified
- target family classified and initial routing recorded
- canonical mutation point identified
- first-pass `chrome-devtools` evidence captured for the target
- first-pass `js-reverse` evidence captured for the target
- clean baseline captured before invasive tooling when the target is verifier-gated or behavior-sensitive
- helper outputs verified on fixed inputs
- server-issued artifacts cataloged with scope and expiry before local reimplementation begins
- document-versus-business-data split documented when a page shell renders successfully but the real payload arrives later
- response acceptance semantics documented when boolean success flags and business payload disagree
- response wrapper normalization verified when JSONP or callback framing is present
- transport admission documented when standard clients fail before application semantics become visible
- structured transport rules documented when the target is not plain JSON
- response decode steps are local and repeatable when the payload is not directly readable
- fixed-sample checks exist for local decoders when decode is part of the contract
- bootstrap artifact replay confirmed when public routes still require key, config, cookie, or wrapper seeding
- challenge artifact extraction proven when a local runtime exposes a getter or self-submits the decisive payload
- cookie provenance proven when rotating cookies gate replay
- locally minted versus server-issued status documented when anti-CSRF-looking, page-id, trace-id, or similar fields appear
- clean anonymous baseline captured in a fresh profile when public routes exist and account cookies could contaminate replay
- page-scoped bootstrap state and request-scoped signer state documented separately when both exist
- exact sign-input serialization proven when GET signing or wrapper logic depends on query order, empty fields, or URL encoding
- exact body serialization proven when legacy form endpoints care about raw urlencoded bytes rather than semantic field equivalence
- verifier targets decomposed into protocol, compute, perception, and behavior surfaces when more than one applies
- visual QA artifacts reviewed when answer quality depends on image preprocessing or coordinate mapping
- route-specific tolerance documented when present fields can be blank or simplified on one path
- login or pairing bootstrap replay confirmed when the target needs a warm session before business traffic
- key schedule or session-secret derivation verified on captured samples when the stream is encrypted
- heartbeat, ack, counter, or message-tag rules documented when the stream is stateful
- raw frame parsing and business decode proven on at least one exact captured frame
- media-key derivation documented when file download or decryption uses separate secrets
- live replay succeeds repeatedly
- pagination or cursor advance confirmed
- pagination route-family transitions documented when later pages use a different endpoint family than early pages
- raw source and parsed attribute values compared when inline handlers or metadata carry replay-critical routes
- account-bound constraints documented
- list-versus-detail permission boundaries documented when access levels differ
- sibling-route envelope reuse checked before assuming list, detail, download, or export each require independent reverse work
- staged hydration or backfill documented when downstream work needs full text, rich detail payloads, or more expensive follow-up routes
- route-local UA, TLS, or HTTP-version exceptions documented narrowly when transport admission varies by path
- alternate bypass documented when a sibling route solves the gate more cleanly than full challenge execution
- page-specific exceptions documented
- final Python collector runs without browser automation or browser profiles
- final JS helper, if any, runs locally without browser automation or DOM dependence
- output saved in the requested format

## Output Contract

After each meaningful phase, emit short structured reporting instead of vague prose.

Always return:

- which target family won the startup triage and why
- what `chrome-devtools` proved about the site flow
- what `js-reverse` proved about the mutation logic
- what the real endpoint is
- what the real moving parts are
- whether observer-effect risk showed up and how it was controlled
- what the cookie provenance is when cookies mattered
- what looked server-issued but was actually local filler, if anything
- what was misleading
- what was verified with fixed inputs
- what the final protocol path is
- whether sibling list, detail, download, or export routes shared one envelope family
- how the Python collector and JS helper are split
- confirmation that the final runtime is fully browser-free
- where the collector and sample output were saved
- what still looks unstable, if anything

Use the headings from `references/report-templates.md` when possible.

## Skill Validation

When modifying this skill itself, validate against the official self-test suite before calling the edit complete.

Pass conditions:

- the route stays protocol-first
- every fresh target begins with `chrome-devtools` plus `js-reverse`
- final delivery never depends on browser automation
- final delivery is Python collector first, with JS limited to local parameter restoration only
- minimal missing evidence is requested instead of broad homework for the user
- the chosen references match the real symptom instead of generic cargo-cult loading
- output reports the real endpoint, real moving parts, and proof artifacts
- structured transport, decode chains, stateful sessions, and delivery gates are handled correctly when present
- challenge-generated state and shared envelope-family cases are handled correctly when present
- transport pre-gates, challenge artifact harvest, and route-local bypasses are handled as generic patterns when present

## Anti-Patterns

- Do not ask the user to manually inspect giant bundles if tooling can inspect them.
- Do not skip `chrome-devtools` or `js-reverse` on a fresh target unless you report a real blocker.
- Do not jump straight to Selenium or Playwright when a direct API exists.
- Do not install broad hooks before capturing a clean baseline on verifier-gated or behavior-sensitive targets.
- Do not confuse business-layer params with wire-layer params.
- Do not trust helper names without fixed-input proof.
- Do not call browser-only behavior before checking page-specific headers or cookies.
- Do not hardcode rotating cookies before proving who writes them and how they refresh.
- Do not bury every concern in one `main.py`.
- Do not stop after one lucky success.
- Do not ship a browser automation script when the task is protocol-recoverable.
- Do not hide automation behind words like "temporary collector" or "reliable fallback".
- Do not leave final JS helpers coupled to `window`, `document`, browser storage, or manual browser state when they can be made local and deterministic.

## Reference Router

Read focused generic references when the symptom matches:

- `references/startup-triage-playbook.md` when the target is fresh and the first question is "what kind of fight is this?"
- `references/workflow-overview.md` for the shortest end-to-end execution map
- `references/tool-playbook.md` for tool choice and next-step routing
- `references/report-templates.md` for phase reporting and handoff structure
- `references/official-self-test-task-suite.md` when validating whether the skill still generalizes after edits
- `references/cookie-provenance-playbook.md` when a cookie is blocking replay but the writer or refresh path is still unclear
- `references/crypto-patterns.md` when signatures or helper outputs look suspicious
- `references/obfuscation-guide.md` when packed code or string tables dominate the bundle
- `references/hook-techniques.md` when runtime proof is faster than static reading
- `references/anti-debug-playbook.md` when the page destabilizes tooling
- `references/environment-patch-playbook.md` when local execution diverges from live execution
- `references/embedded-browser-runtime-playbook.md` when host-bound JS needs offline page bootstrap, logical time, API probe tracing, or local net-log capture without real rendering
- `references/transport-pre-gate-playbook.md` when H2 resets, handshake timeouts, UA family, HTTP version, or route-local admission block the clean baseline before application semantics appear
- `references/challenge-artifact-harvest-playbook.md` when a bootstrap or challenge runtime exposes a getter after init or self-issues the decisive XHR or fetch payload
- `references/env-diff-playbook.md` when redirects, wrappers, or environment-specific behavior cause mismatches
- `references/jsvmp-analysis-playbook.md` when a custom VM or bytecode interpreter hides the logic
- `references/pagination-route-pivot-playbook.md` when later pages stop matching the early URL family or inline pager metadata becomes part of the replay contract
- `references/structured-transport-playbook.md` when GraphQL, WebSocket, protobuf, msgpack, or binary envelopes carry the real contract
- `references/stateful-stream-e2ee-playbook.md` when login, pairing, session keys, keepalive frames, or media decryption make the stream stateful
- `references/response-decode-playbook.md` when the payload needs local decode before it becomes usable data
- `references/public-bootstrap-envelope-playbook.md` when a public page still needs bootstrap keys, cookies, config, or an encrypted wrapper before list replay works
- `references/challenge-state-envelope-playbook.md` when entry HTML plus challenge JS seed environment-bound cookie, storage, token, or multi-field envelope state before business replay works
- `references/delivery-gate-playbook.md` when you need to decide whether the current path is acceptable handoff or still cheating
- `references/offline-inline-deob-playbook.md` when inline scripts, eval-packed code, legacy hashes, or anti-debug logic push the work offline
- `references/decoy-and-real-request-playbook.md` when the page and the wire disagree on the real endpoint
- `references/transport-wrapper-playbook.md` when transport wrappers rewrite params, headers, or payloads
- `references/patched-helper-playbook.md` when helper names look standard but outputs do not
- `references/page-specific-exception-playbook.md` when only one page or one request behaves differently
- `references/session-contract-playbook.md` when results or submission are account-bound
- `references/side-asset-bootstrap-playbook.md` when `.wasm`, side scripts, fonts, or returned JS seed the real state
- `references/server-js-cookie-bootstrap-playbook.md` when an endpoint returns executable JS that seeds cookie or token state
- `references/verifier-replay-playbook.md` when captcha or one-shot verification gates the business request
- `references/troubleshooting-playbook.md` when replay logic is almost correct but still unstable

## Experience Deposition

After a successful job, preserve only the reusable lesson:

- convert site-specific pain points into generic pattern language
- preserve family-triage lessons and observer-effect lessons as generic routing rules
- preserve shell-versus-data lessons as render-contract rules, not "the HTML looked empty on site X"
- preserve success-flag lessons as response-validation rules, not one vendor's `errorCode`
- keep fixed-input validation habits, not endpoint trivia
- preserve server-issued-state lessons as inventory, scope, expiry, and refresh-path rules, not copied session ids or challenge configs
- preserve clean-anonymous-baseline lessons as environment-selection rules, not copied account cookies
- preserve cookie provenance lessons as writer and refresh-path rules, not copied cookie values
- preserve page-state versus request-state lessons as separate moving-part classes, not vendor header names
- preserve local-noise-versus-gate lessons: server-looking names do not prove server issuance; prove writer, tolerance, and blocking value
- preserve transport pre-gate lessons as narrow admission matrices and route-local exceptions, not frozen vendor UA cargo cults
- preserve bootstrap-collapse lessons as issuance-versus-consumption rules: inject or refresh server-issued state only as far as replay truly requires, not as far as the original page happened to go
- preserve session-admission lessons: a minted cookie or current-user success may prove bootstrap reachability without proving business permission
- preserve native-surface gap lessons as environment-routing rules: when cookie, storage, and script injection do not close the gap, test `canvas`, WebGL, layout, style, and native-descriptor surfaces before escalating to broader emulation
- preserve boundary-selection lessons as authoritative-intercept rules: prototypes, constructors, wrapper ingress, and egress beats bypassable instance hooks when the runtime keeps rewriting objects underneath you
- promote transport-shape and decode-chain lessons into generic references, not per-site notes
- preserve JSONP and callback-wrapper lessons as framing rules, not one callback name
- promote public bootstrap and encrypted-envelope lessons into reusable checklists, not vendor folklore
- preserve challenge-generated cookie, storage, and token lessons as bootstrap-state rules, not copied values or browser profiles
- preserve challenge-runtime lessons as getter or egress harvest rules, scheduler-preservation rules, bypass routing rules, and error-class-specific patching rules
- preserve shared envelope lessons as packet-family rules: version, checksum, custom alphabet, state-derived prefix, inner cipher, and payload anchor
- preserve sibling-route family lessons: once one route in a packet family is solved, probe adjacent list, detail, download, and export methods before hunting fresh crypto
- preserve full-request serialization lessons as canonical-input rules: query order, empty fields, and encoding can be part of the contract
- preserve raw-body serialization lessons: some legacy form endpoints care about the exact frontend byte stream, not just equivalent key-value semantics
- preserve verifier decomposition lessons as protocol, compute, perception, and behavior routing, not one captcha project structure
- preserve image-preprocessing and visual-QA lessons as perception-surface rules, not one sprite layout or crop recipe
- preserve weak-enforcement lessons as route-tolerance rules, not claims that sidecar fields or track blobs never matter
- promote session-bootstrap, frame-family, and media-key lessons into generic references, not chat-app trivia
- preserve build-order lessons such as payload -> compact JSON -> sign -> timestamp -> encrypt -> wrapper when that order matters
- preserve pagination-route pivots as route-family rules, not copied page URLs
- preserve raw-source-versus-DOM lessons as source-of-truth rules for inline route metadata, not parser-specific hacks
- preserve staged-hydration lessons: enumerate stable ids early, persist raw decoded payloads, and backfill expensive detail routes separately when downstream rules evolve
- preserve embedded-runtime lessons as routing rules: when Python handwrite is enough, when a local host runtime like `iv8` is the cheapest faithful bootstrap, and when true interaction means the collector is still incomplete
- prefer new root-level generic references over new site-specific case files
- add helper scripts only when they improve many future jobs, not just one target

## Bottom Line

This skill should teach one habit above all:

When the site looks "browser-only", do not panic and do not automate.
First ask:

1. what is the real request
2. what is the real changing state
3. can that state be rebuilt locally

Most similar targets collapse once those three questions are answered honestly.
