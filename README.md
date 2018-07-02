# Spectacle documentation site

[![Build Status](https://travis-ci.org/FormidableLabs/spectacle-docs.svg?branch=master)](https://travis-ci.org/FormidableLabs/spectacle-docs)

```
npm install formidable-spectacle-docs
```

To release this lander, please follow the [archetype release instructions](https://github.com/FormidableLabs/builder-docs-archetype#lander-release) for our `npm version` workflow.

## Quick Start

Make sure you have [`builder`](https://github.com/formidablelabs/builder) installed.

Run:

```
builder run start
```

Then, open [http://localhost:3000](http://localhost:3000).

To see a list of available commands, run:

```
builder run
```

## Test the build

```
builder run build-static && builder run server-static
```

Then, open the static build at [http://0.0.0.0:8080](http://0.0.0.0:8080).
