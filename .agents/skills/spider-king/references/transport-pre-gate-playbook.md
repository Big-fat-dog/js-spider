# Transport Pre-Gate Playbook

Use this playbook when the clean baseline dies before meaningful application semantics are visible.

## Route here when

- standard HTTP clients fail at H2 reset, TLS EOF, handshake timeout, or early disconnect
- the same route behaves differently across UA families, HTTP versions, ALPN, or client stacks
- impersonated transport or mobile or app UA passes while default desktop or stdlib traffic fails
- one challenged landing route fails, but a sibling auth, identity, or business route still works

## Core idea

Transport admission is a separate contract from signer, cookie, or payload logic.

Do not reverse the application layer until one request is admitted cleanly enough to observe real semantics.

## Fast execution path

1. Freeze a small admission matrix.
   Record:
   - route
   - method
   - client stack
   - UA family
   - HTTP version
   - result class such as pass, H2 reset, timeout, redirect loop, or challenged HTML

2. Test narrow transport variations before giant bundle work.
   Common variations:
   - stdlib client vs impersonated TLS client
   - HTTP/2 vs HTTP/1.1
   - desktop browser UA vs mobile or app UA
   - challenged landing route vs sibling auth or data route

3. Keep the exception narrow.
   If only one route family needs a special transport profile, scope it there instead of polluting the whole collector.

4. Separate admission from later gates.
   After one route is admitted, continue normal triage for signer, verifier, decode, or session logic.

5. Prefer route bypass over unnecessary challenge work.
   If a sibling identity, auth, or data route cleanly avoids the challenged landing path, use that evidence before spending hours on the wrong gate.

## High-value checks

- whether the failure happens before headers, after TLS, or only after body bytes start flowing
- whether redirects or alternate hosts change the policy
- whether mobile or app UA changes the returned HTML shape, not just the pass or fail status
- whether the route requires the same transport profile as neighboring routes or is an isolated exception
- whether the browser-success sample is really application success or only a different transport admission path

## Common traps

- blaming cookies or signatures for traffic that never cleared transport admission
- hardcoding one magical UA across the whole collector when only one route needed it
- treating impersonated TLS as final victory instead of the start of application-layer reversal
- assuming the challenged landing page is the only entry route worth testing

## Delivery guidance

Preferred shape:

1. Python collector with route-local transport policy
2. application-layer reversal done only after admission is proven
3. no browser dependency in the final path

## Minimal handoff notes

Report these items explicitly:

- which route family was transport-gated
- which narrow client profile admitted the baseline
- whether the exception is route-local or global
- whether a sibling route bypassed the gate
- which later family triage won after admission
