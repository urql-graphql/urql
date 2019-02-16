# Development

Thanks for contributing! We want to ensure that `urql` evolves and fulfills
its idea of extensibility and flexibility by seeing continuous improvements
and enhancements, no matter how small or big they might be.

If you're about to add a new exchange, please consider publishing it as
a separate package.

## How to contribute?

We follow fairly standard but lenient rules around pull requests and issues.
Please pick a title that describes your change briefly, optionally in the imperative
mood if possible.

If you have an idea for a feature or want to fix a bug, consider opening an issue
first. We're also happy to discuss and help you open a PR and get your changes
in!

## How do I set up the project?

Luckily it's not hard to get started. You can install dependencies using yarn.
Please don't use `npm` to respect the lockfile.

```sh
yarn
```

You can then run the build using:

```sh
yarn build
```

Or run just the TypeScript build for type checks:

```sh
yarn build:types
```

## How do I test my changes?

It's always good practice to run the tests when making changes.
It might also make sense to add more tests when you're adding features
or fixing a bug, but we'll help you in the pull request, if necessary.

```sh
yarn test            # Single pass
yarn test --watch    # Watched
yarn test --coverage # Single pass coverage report
```

Additionally you can head to any example in the `examples/` folder
and run them. There you'll also need to run `yarn` to install their
dependencies. All examples are started using `yarn start`.

Make sure you rebuild `urql` using `yarn build` when you run an
example. However, most examples will do so automatically.

## How do I lint my code?

We ensure consistency in `urql`'s codebase using `tslint` and `prettier`.
They are run on a `precommit` hook, so if something's off they'll try
to automatically fix up your code, or display an error.

If you have them set up in your editor, even better!

## How do I publish a new version?

If you're a core contributor or maintainer this will certainly come
up once in a while.

Make sure you first create a new version. The following commands
bump the version in the `package.json`, create a commit,
and tag the commit on git:

```sh
yarn version --new-version X
# or
npm version patch # accepts patch|minor|major
```

Then run `npm publish` (npm is recommended here, not yarn)
And maybe run `npm publish --dry-run` first to check the output.

```sh
npm publish
```

There's a `prepublishOnly` hook in place that'll clean and build
`urql` automatically.

Don't forget to push afterwards:

```sh
git push && git push --tags
```

[This process can be simplified and streamlined by using `np`.](https://github.com/sindresorhus/np)
