# Official Self-Test Task Suite

Use this file when validating whether `spider-king` still behaves like a protocol-first reverse skill after edits.

## How to use the suite

For each task:

1. feed the prompt as if it came from a user
2. check which references and scripts the skill would route to
3. verify the proposed delivery shape
4. fail the test if the answer drifts into browser automation as final delivery

## Pass criteria across the whole suite

- the startup gate is emitted on fresh targets
- blocked tools are reported explicitly instead of being silently skipped
- final delivery stays pure protocol
- Python remains the preferred collector language
- missing evidence requests stay minimal
- the skill identifies the real protocol contract, not just a `sign` function
- structured transport and decode-chain cases route correctly
- cookie provenance is made explicit when rotating cookies gate replay

## Task 0: Fresh target with one blocked tool

Prompt:

```text
The page returns useful data, but `chrome-devtools` is currently unavailable in this session. I still need the collector. Show me how you start.
```

Expected route:

- `references/startup-triage-playbook.md`
- `references/tool-playbook.md`

Must conclude:

- emit the startup gate first
- report the blocked tool explicitly
- still classify the target family and intended final delivery shape
- do not pretend the missing tool already proved anything

## Task 1: Decoy endpoint versus real endpoint

Prompt:

```text
The page JavaScript calls /api/match/list, but the network request that returns data is /api/question/list. Build the collector.
```

Expected route:

- `references/decoy-and-real-request-playbook.md`
- `references/workflow-overview.md`

Must conclude:

- trust the wire path
- code against `/api/question/list`

## Task 2: Transport wrapper mutates the payload

Prompt:

```text
The business code builds token=abc, but beforeSend rewrites it into m=... and adds Accept-Time. Recover the real request.
```

Expected route:

- `references/transport-wrapper-playbook.md`
- `references/hook-techniques.md`

Must conclude:

- the mutation point is the wrapper
- the collector reproduces wrapper-added fields locally

## Task 3: Helper named md5 is not standard

Prompt:

```text
There is a function called md5, but hashlib.md5 never matches the browser output on the same timestamp. Figure out the real logic.
```

Expected route:

- `references/crypto-patterns.md`
- `references/patched-helper-playbook.md`
- `references/env-diff-playbook.md`

Must conclude:

- helper names do not prove behavior
- fixed-input comparison is required

## Task 4: Server returns JS bootstrap before data

Prompt:

```text
Page 1 only works after an endpoint returns executable JS that seeds cookies and offsets. I want a Python collector.
```

Expected route:

- `references/server-js-cookie-bootstrap-playbook.md`
- `references/side-asset-bootstrap-playbook.md`

Must conclude:

- bootstrap response is part of the protocol
- JS may be replayed locally, but not through browser automation

## Task 5: Only one page fails

Prompt:

```text
Pages 1 to 4 work, but page 5 fails unless the User-Agent changes. Fix the collector without wrecking the earlier pages.
```

Expected route:

- `references/page-specific-exception-playbook.md`

Must conclude:

- keep the exception narrow
- do not generalize the page-5 rule to every request

## Task 6: Account-bound session contract

Prompt:

```text
Different sessionid values produce different sums, and submit only passes with the same account state that fetched the data.
```

Expected route:

- `references/session-contract-playbook.md`

Must conclude:

- session state is part of the protocol contract
- fetch and submit must stay under the same account state

## Task 7: Side asset carries the signer

Prompt:

```text
The main bundle is noisy, but a tiny wasm export seems to produce the final sign parameter. Recover it.
```

Expected route:

- `references/side-asset-bootstrap-playbook.md`
- `references/jsvmp-analysis-playbook.md` when applicable

Must conclude:

- inspect the small side asset early
- local helper is acceptable, browser dependency is not

## Task 8: Dynamic font hides the payload

Prompt:

```text
The API response is just glyph soup until a font file is loaded. Build a pure-protocol decoder.
```

Expected route:

- `references/side-asset-bootstrap-playbook.md`
- `references/response-decode-playbook.md`

Must conclude:

- freeze the raw payload
- derive the glyph map locally

## Task 9: One-shot verifier gates the business API

Prompt:

```text
There is no meaningful sign function, but the next request only works after a verifier request returns coordinates and a token.
```

Expected route:

- `references/verifier-replay-playbook.md`

Must conclude:

- verifier output is the real dynamic parameter
- replay the verifier in protocol form

## Task 10: GraphQL contract, not REST

Prompt:

```text
The endpoint never changes, but operationName, variables, and a persisted-query hash decide whether data comes back.
```

Expected route:

- `references/structured-transport-playbook.md`

Must conclude:

- transport shape is part of the contract
- replay must preserve GraphQL envelope fields

## Task 11: WebSocket business stream

Prompt:

```text
The real data only arrives on WebSocket frames after auth, subscribe, and heartbeat messages. Recover a local client.
```

Expected route:

- `references/structured-transport-playbook.md`

Must conclude:

- identify auth, subscribe, heartbeat, and business frames
- preserve required sequencing

## Task 12: Response decode chain

Prompt:

```text
HTTP 200 is fine, but the body must go through Base64, byte remap, and protobuf parse before it becomes useful data.
```

Expected route:

- `references/response-decode-playbook.md`

Must conclude:

- raw payload must be frozen first
- decoder chain must be rebuilt locally in order

## Task 12A: Exact body bytes matter more than semantic field equivalence

Prompt:

```text
Sending the form as a Python dict or JSON keeps failing, but replaying the exact frontend-style application/x-www-form-urlencoded byte string works. Recover the collector shape.
```

Expected route:

- `references/transport-wrapper-playbook.md`
- `references/troubleshooting-playbook.md`

Must conclude:

- exact body serialization can be part of the protocol contract
- preserve field order, encoding, and frontend-style urlencoding when the route is legacy or wrapper-sensitive
- do not assume that semantically equivalent key-value pairs are replay-equivalent on the wire

## Task 13: Environment mismatch

Prompt:

```text
Node reproduces the sign, Python does not, and the page output differs unless one tiny helper is patched. Decide the smallest acceptable delivery shape.
```

Expected route:

- `references/env-diff-playbook.md`
- `references/delivery-gate-playbook.md`

Must conclude:

- mismatch is evidence
- choose the smallest local patch surface

## Task 13A: Instance hook is bypassed

Prompt:

```text
I patched one XMLHttpRequest instance in the local runtime, but the SDK still rewrites headers through a wrapper and bypasses my hook. Recover the collector shape.
```

Expected route:

- `references/hook-techniques.md`
- `references/environment-patch-playbook.md`

Must conclude:

- patch the highest stable boundary every call must cross
- prototype, constructor-wrapper, ingress, or egress hooks beat one-off instance monkey-patching

## Task 13B: Async bootstrap can collapse into injected state

Prompt:

```text
The page fetches a token cookie asynchronously during bootstrap, but the signer later only reads document.cookie and local storage. My host bridge is synchronous. Recover the delivery shape.
```

Expected route:

- `references/embedded-browser-runtime-playbook.md`
- `references/cookie-provenance-playbook.md`

Must conclude:

- separate issuance from consumption
- inject verified server-issued state when that removes unnecessary async bootstrap from the hot path
- only reverse automated refresh when repeated replay proves the injected state expires or must be reissued online

## Task 13C: Injected state does not close a native-surface gap

Prompt:

```text
The local helper still emits a much shorter verifier blob than the browser. Injecting cookie, local storage, script tags, and resource lists barely changes it. The runtime probes canvas, WebGL, and computed style before the field is produced. Recover the delivery shape.
```

Expected route:

- `references/environment-patch-playbook.md`
- `references/embedded-browser-runtime-playbook.md`

Must conclude:

- compare structural metrics before semantic debugging
- distinguish an injected-state gap from a native-surface gap
- patch narrow local adapters or stubs for `canvas`, WebGL, layout, style, or descriptor surfaces before escalating to broader emulation
- final delivery stays Python plus a tiny local helper, not browser-backed replay

## Task 14: Delivery-gate rejection

Prompt:

```text
I can make it work by calling fetch from the browser page through CDP. Ship that as the final collector.
```

Expected route:

- `references/delivery-gate-playbook.md`

Must conclude:

- reject browser-backed delivery
- continue reversing toward local protocol delivery

## Task 15: Public page with bootstrap envelope

Prompt:

```text
The list page is public, but replay only works after /public returns a key string. The real request posts {"param":"..."} with compact-JSON sign, timestamp injection, and encrypted wrapping. Build a Python collector for 10 pages.
```

Expected route:

- `references/public-bootstrap-envelope-playbook.md`
- `references/transport-wrapper-playbook.md`

Must conclude:

- public does not mean unsigned
- bootstrap output is part of the protocol contract
- category and pagination fields must be made explicit instead of trusting UI defaults
- list and detail permissions may differ and must be documented separately

## Task 15A: Challenge-generated cookie and packet family

Prompt:

```text
The entry HTML loads challenge JS that must run locally before anything works. After that, a derived cookie and storage state appear. A token preflight returns one encoded blob, and the business request needs a cookie, URL query, header token, and encoded body that all seem related. The response is also encoded and only turns into JSON after prefix stripping. Build the collector shape.
```

Expected route:

- `references/challenge-state-envelope-playbook.md`
- `references/cookie-provenance-playbook.md`
- `references/public-bootstrap-envelope-playbook.md`

Must conclude:

- challenge output is protocol state, not decoration
- packet framing and inner crypto must be separated
- URL query, body, response, and cookie may belong to one shared envelope family with field-specific variants
- final delivery must model `entry -> local challenge/bootstrap -> token preflight -> business request -> local response decode`

## Task 15B: Pagination route pivot and raw pager source

Prompt:

```text
Pages 1 to 5 replay from /list-1.html to /list-5.html, but page 6 fails. The visible pager still looks normal, yet its inline onclick points to /ui?page=6 and the DOM getter turns &currentPage into garbage. Recover the collector shape.
```

Expected route:

- `references/pagination-route-pivot-playbook.md`
- `references/page-specific-exception-playbook.md` when the pivot might be narrow

Must conclude:

- pagination is part of the protocol contract, not filename arithmetic
- the collector should follow the live next-page target instead of extrapolating the first-page URL family
- raw pager source may be safer than a DOM-decoded attribute when markup repair mutates the route
- final delivery stays browser-free

## Task 15C: Public shell, empty hydration, split signer scopes

Prompt:

```text
The page opens anonymously and renders a loading shell, but the HTML data blob is empty. A later GET says success=true yet still returns no business rows unless one page-seeded cookie and one request header are both refreshed from the same full-URL signing family. Reusing logged-in cookies makes the behavior less stable. Build the collector shape.
```

Expected route:

- `references/public-bootstrap-envelope-playbook.md`
- `references/cookie-provenance-playbook.md`
- `references/transport-wrapper-playbook.md`

Must conclude:

- rendered shell does not prove the business payload lives in the HTML
- boolean success flags do not prove protocol acceptance when payload and subcodes disagree
- page-scoped bootstrap state and request-scoped signer state must be modeled separately
- exact GET sign-input serialization can matter: query order, empty fields, and URL encoding
- a fresh anonymous baseline should be established before reusing account state

## Task 15D: Bootstrap config, wrapper framing, and perception surface

Prompt:

```text
A public verifier begins with a prehandle call that returns JSONP containing a session id, work factor, asset URLs, answer bounds, and expiry. The visible challenge uses RGBA sprite assets with large transparent padding, so OCR is unstable but template matching becomes reliable after simple background normalization. A formal collect field exists, yet an empty string passes on the demo route. Recover the collector shape.
```

Expected route:

- `references/verifier-replay-playbook.md`
- `references/public-bootstrap-envelope-playbook.md`
- `references/transport-wrapper-playbook.md`

Must conclude:

- bootstrap output is protocol state, not something to locally invent
- JSONP or callback framing is part of the contract and must be normalized explicitly
- the target should be split into protocol, compute, perception, and behavior surfaces
- image preprocessing and visual QA can dominate verifier success when the answer is image-derived
- a tolerated empty or simplified field on one public route is evidence, not proof the field is globally irrelevant

## Task 15E: Server-looking field is locally minted filler

Prompt:

```text
The request includes __RequestVerificationToken and pageId, but page code appends both locally and any fresh format-conforming values replay successfully under one valid session. Recover the collector shape.
```

Expected route:

- `references/public-bootstrap-envelope-playbook.md`
- `references/cookie-provenance-playbook.md`

Must conclude:

- server-looking names do not prove server issuance
- prove writer, tolerance, and blocking value before modeling the field as a hard dependency
- locally minted fillers should be generated cheaply in the collector instead of over-reversed

## Task 15F: Human detail page is only a shell for a sibling API

Prompt:

```text
Search results link to /detail/index.html?id=..., but the full article actually arrives through the same parse endpoint family with a different cfg and the same response decoder. Recover the collector shape.
```

Expected route:

- `references/decoy-and-real-request-playbook.md`
- `references/public-bootstrap-envelope-playbook.md`

Must conclude:

- the human-facing detail page can still be only a shell
- once one route in the packet family is solved, sibling list/detail methods should be checked for wrapper and decoder reuse
- a staged collector that persists ids for later detail backfill is preferred over rerunning the whole list crawl

## Task 16: Stateful encrypted stream

Prompt:

```text
The target upgrades into a long-lived WebSocket after pairing. Early frames return a ref, public key, and client ID. Business traffic stays binary until session keys are derived, and media downloads need a separate derived secret. Recover a local client.
```

Expected route:

- `references/structured-transport-playbook.md`
- `references/stateful-stream-e2ee-playbook.md`
- `references/response-decode-playbook.md`

Must conclude:

- the transcript, not one request, is the contract
- session keys, counters, and media secrets must be derived locally
- login or pairing bootstrap is part of the protocol contract
- session keys, message tags, and heartbeat rules must be made explicit
- frame decode and media-key derivation are separate reproducible steps
- final delivery must be a local protocol client, not a browser-backed session

## Task 17: Rotating cookie with unclear writer

Prompt:

```text
The request only works when a cookie named m is fresh, but I do not know whether it comes from Set-Cookie, document.cookie, or returned challenge JS. Recover the right protocol path.
```

Expected route:

- `references/cookie-provenance-playbook.md`
- `references/server-js-cookie-bootstrap-playbook.md` when returned JS is involved

Must conclude:

- prove who writes the cookie before hardcoding anything
- recover the refresh path locally

## Task 17A: Fresh session bootstrap still lacks business admission

Prompt:

```text
I can call a public current-user bootstrap and receive a fresh session cookie from scratch, but the real business method still returns permission denied. A captured cookie from a successful browser business call replays fine. Recover the right protocol path.
```

Expected route:

- `references/cookie-provenance-playbook.md`
- `references/session-contract-playbook.md`

Must conclude:

- separate session minting from business admission
- captured success can prove the request framing and decode chain even when the full session bootstrap path is still incomplete
- do not keep blaming signer logic when the failure mode is route-specific permission state

## Task 18: Hooks make the site fail

Prompt:

```text
The request works once in a clean page, but as soon as I add broad hooks and breakpoints the verifier starts failing. Decide the next move.
```

Expected route:

- `references/startup-triage-playbook.md`
- `references/troubleshooting-playbook.md`

Must conclude:

- suspect observer effect before declaring the site browser-only
- capture a clean baseline and move instrumentation to the smallest boundary

## Failure signals

Fail the skill revision immediately if it does any of these:

- accepts browser automation as final delivery
- treats every hard target as only a sign-recovery problem
- ignores transport envelopes or decode chains
- asks the user for giant manual bundle review instead of narrowing the target
- returns vague success without replay proof
