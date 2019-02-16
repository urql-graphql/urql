# Extending & Experimenting

Hopefully you have read the sections on `urql`'s [Architecture](architecture.md)
and its [Basics](basics.md). This section will introduce you to hacking
with `urql`.

`urql` comes with some very functional defaults, but its standard component APIs,
hook APIs, or its core behaviour might not be enough for your complex app. Or
maybe you're just looking to play around and experiment with GraphQL clients?

This document contains two main sections. The first is about reusing `urql`'s
core and build new "outward facing APIs". The second is about writing new
exchanges and hence changing `urql`'s core behaviour.
