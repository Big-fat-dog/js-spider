# Hook Techniques

Use this file when runtime proof is faster than static reading.

## Highest-value hook targets

- `fetch`
- `XMLHttpRequest.prototype.open`
- `XMLHttpRequest.prototype.send`
- transport wrapper functions
- bootstrap helpers
- signer helpers
- storage reads and writes when session state is changing

## Hook goals

- capture pre-sign strings
- capture final payloads after wrapper mutation
- capture response-side refresh fields
- capture cookies or globals that change between requests

## Hooking order

1. wire-level hooks
2. wrapper-level hooks
3. helper-level hooks
4. local-variable breakpoints only if hooks still leave ambiguity

Rule:

- if instance-level hooks get replaced or skipped, move upward to the shared boundary that every call must cross such as the prototype, constructor wrapper, or transport egress

## Common traps

- hooking business-layer functions while missing the transport wrapper
- hooking one convenient object instance when the runtime keeps rebinding or cloning the real caller
- pausing too early with breakpoints and drowning in noise
- capturing only final hashes without the input string that produced them
