# Challenge State Envelope Playbook

Use this playbook when entry HTML and challenge JavaScript seed environment-bound state before business replay works, and several later fields appear to share one encoded envelope family.

## When to route here

Route here when one or more of these symptoms appear:

- first-page HTML plus challenge JS must run before token or business requests stabilize
- a derived cookie, storage item, or preflight token appears after challenge execution and gates later requests
- URL query, form body, response body, and cookie all look structurally related
- the same target uses a version marker, checksum, custom alphabet, dynamic prefix, or inner encrypted payload across several fields
- a business preflight or token endpoint returns the same encoded family as the later business endpoint
- decrypting one field is not enough because another field still needs current state bytes, storage state, or challenge output

## Core idea

Challenge output is protocol state, not decoration.
When one target reuses the same envelope family across URL, body, response, and cookie, separate packet framing from inner crypto and prove both.

## Fast execution path

1. Freeze one fresh two-stage trace.
   Save:
   - entry HTML
   - challenge script URLs or inline challenge code
   - initial cookies
   - post-challenge cookie and storage state
   - one preflight token request and response when present
   - one business request and response

2. Separate six proof layers.
   Keep these as distinct questions:
   - environment model
   - state transition
   - packet framing
   - key normalization
   - inner cipher
   - business plaintext or decoded JSON

3. Map the envelope family once.
   For each related field, record:
   - wire field name
   - version marker or fixed prefix
   - checksum scope
   - alphabet or byte remap
   - state-derived prefix or slice
   - inner encrypted segment
   - payload anchor or parser rule

4. Prove state dependency explicitly.
   Check whether the URL param, body field, or cookie can be rebuilt from business plaintext alone, or whether they also need current state bytes, storage state, or challenge outputs.

5. Validate the family with small checkpoints.
   Use exact checks such as:
   - cookie length or segment count
   - token length or format
   - checksum OK
   - expected prefix length
   - JSON anchor found
   - expected schema keys present

## High-value checks

- Verify whether several fields share one custom alphabet or packet prefix instead of independent encoders.
- Verify whether the checksum covers plaintext, ciphertext, framed body, or the whole outer packet.
- Verify whether the response payload starts at byte zero or only after a fixed or state-derived prefix.
- Verify whether the apparent AES key is direct, wrapped, XOR-masked, length-decorated, or otherwise normalized before use.
- Verify whether the preflight token response uses the same decode chain as the later business response.
- Verify whether the environment-bound cookie is just a stored token or a structured packet with several typed segments.

## Common traps

- treating the cookie as a copied browser value instead of a reproducible protocol artifact
- proving only the inner cipher and missing the outer version, checksum, or alphabet layer
- assuming the URL param and body field are unrelated when they are siblings in one packet family
- parsing decrypted bytes as JSON immediately when the real payload starts after a prefix
- assuming business plaintext alone can rebuild the request while hidden state bytes still affect the outer envelope

## Delivery guidance

Preferred delivery shape:

1. Python collector with explicit staged bootstrap: entry, local challenge execution, preflight token when needed, business request, local response decode
2. tiny local JS helper only for unrecovered challenge or packet-family logic when Python porting is not yet cheaper
3. no browser dependency in the final path

## Minimal handoff notes

Report these items explicitly:

- which challenge output becomes protocol state
- which cookie, storage item, token, or header is derived from that state
- which fields belong to the same envelope family
- exact packet-family order: version, checksum, alphabet, prefix, cipher, payload anchor
- which later fields still depend on current state bytes
- which fixed checkpoints prove local reconstruction is correct
