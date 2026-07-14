# Pagination Route Pivot Playbook

Use this playbook when pagination stops following one obvious URL family, or when the next-page target is hidden inside inline pager metadata rather than a plain link.

## When to route here

Route here when one or more of these symptoms appear:

- pages 1 to N work through a static path, but a later page number 404s or returns the wrong content
- the visible pager looks uniform, but the live next-page target points to a different endpoint family such as `/ui`, Ajax, or another template route
- guessing later pages from the first-page URL works briefly and then fails
- inline `onclick`, `tagname`, hidden templates, or pager widgets carry the real next-page URL
- DOM-parsed attribute values no longer match the raw HTML because of unescaped `&`, entity decoding, or legacy markup repair

## Core idea

Pagination is part of the protocol contract.
The correct next route may change mid-sequence, and the safest source of truth may be the raw HTML snippet rather than a repaired DOM attribute.

## Fast execution path

1. Freeze one good early page and one failing late page.
   Save:
   - the current page URL
   - the raw HTML around the pager
   - the exact next-page route from the live page
   - the failing guessed URL, if you tried one

2. Compare route families, not just page numbers.
   Record:
   - early-page URL family
   - late-page URL family
   - cutoff page where the family changes
   - whether category, mode, or other hidden state changes with the route family

3. Treat pager metadata as protocol state.
   Check:
   - `href`
   - inline `onclick`
   - `tagname` or custom attributes
   - hidden templates or jump-to-page format strings

4. Compare raw source against parsed values.
   If the route lives in inline markup:
   - save the raw tag snippet
   - compare it with the parser-returned attribute value
   - look for broken `&`, entity decoding, or template repair that mutates the route

5. Rebuild pagination from the live chain.
   Preferred order:
   - follow the next-page target exposed by the current page
   - preserve narrow route-family exceptions explicitly
   - only extrapolate a URL template after later pages prove it is stable

## High-value checks

- Verify whether the first page and later pages use different hosts, paths, or query-based routes.
- Verify whether the next route is only present in inline JavaScript or a hidden jump template.
- Verify whether reparsing the page changes parameter names or query separators.
- Verify whether the late-page route needs a different referer, category, or mode state.
- Verify whether the route pivot is a one-page exception or the start of a new stable family.

## Common traps

- assuming page arithmetic from the first URL proves the whole sequence
- treating pagination as presentation rather than protocol
- trusting DOM-decoded `onclick` or custom attributes without comparing them to raw source
- letting an HTML parser or beautifier rewrite replay-critical query strings before extraction
- generalizing one late-page exception into every request in the collector

## Delivery guidance

Preferred delivery shape:

1. Python collector that advances through the real pager chain
2. narrow configuration for route-family pivots when early and late pages differ
3. no browser dependency in the final path

## Minimal handoff notes

Report these items explicitly:

- where the pagination route family changes
- which pager field is the real source of the next route
- whether raw HTML or parsed DOM was the safer source of truth
- which narrow exception, if any, was required for later pages
