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

- If you have a question, try [creating a GitHub Discussions thread.](https://github.com/urql-graphql/urql/discussions/new)
- If you think you've found a bug, [open a new issue.](https://github.com/urql-graphql/urql/issues/new/choose)
- or, if you found a bug you'd like to fix, [open a PR.](https://github.com/urql-graphql/urql/compare)
- If you'd like to propose a change [open an RFC issue.](https://github.com/urql-graphql/urql/issues/new?labels=future+%F0%9F%94%AE&template=RFC.md&title=RFC%3A+Your+Proposal) You can read more about the RFC process [below](#how-do-i-propose-changes).

### What are the issue conventions?

There are **no strict conventions**, but we do have two templates in place that will fit most
issues, since questions and other discussion start on GitHub Discussions. The bug template is fairly
standard and the rule of thumb is to try to explain **what you expected** and **what you got
instead.** Following this makes it very clear whether it's a known behavior, an unexpected issue,
or an undocumented quirk.

### How do I propose changes?

We follow an **RFC proposal process**. This allows anyone to propose a new feature or a change, and
allows us to communicate our current planned features or changes, so any technical discussion,
progress, or upcoming changes are always **documented transparently.** You can [find the RFC
template](https://github.com/urql-graphql/urql/issues/new/choose) in our issue creator.

All RFCs are added to the [RFC Lifecycle board.](https://github.com/urql-graphql/urql/projects/3)
This board tracks where an RFC stands and who's working on it until it's completed. Bugs and PRs may
end up on there too if no corresponding RFC exists or was necessary. RFCs are typically first added
to "In Discussion" until we believe they're ready to be worked on. This step may either be short,
skipped, or rather long, if no plan is in place for a change yet. So if you see a way to help,
please leave some suggestions.

### What are the PR conventions?

This also comes with **no strict conventions**. We only ask you to follow the PR template we have
in place more strictly here than the templates for issues, since it asks you to list a summary
(maybe even with a short explanation) and a list of technical changes.

If you're **resolving** an issue please don't forget to add `Resolve #123` to the description so that
it's automatically linked, so that there's no ambiguity and which issue is being addressed (if any)

You'll find that a comment by the "Changeset" bot may pop up. If you don't know what a **changeset**
is and why it's asking you to document your changes, read on at ["How do I document a change for the
changelog"](#how-do-i-document-a-change-for-the-changelog)

We also typically **name** our PRs with a slightly descriptive title, e.g. `(shortcode) - Title`,
where shortcode is either the name of a package, e.g. `(core)` and the title is an imperative mood
description, e.g. "Update X" or "Refactor Y."

## How do I set up the project?

Luckily it's not hard to get started. You can install dependencies using yarn.
Please don't use `npm` to respect the lockfile.

```sh
yarn
```

There are multiple commands you can run in the root folder to test your changes:

```sh
# TypeScript checks:
yarn run check

# Linting (prettier & eslint):
yarn run lint

# Jest Tests (for all packages):
yarn run test

# Builds (for all packages):
yarn run build
```

You can find the main packages in `packages/*` and the addon exchanges in `exchanges/*`.
Each package also has its own scripts that are common and shared between all packages.

```sh
# Jest Tests for the current package:
yarn run test

# Linting (prettier & eslint):
yarn run lint

# Builds for the current package:
yarn run build

# TypeScript checks for the current package:
yarn run check
```

While you can run `build` globally in the interest of time it's advisable to only run it
on the packages you're working on. Note that TypeScript checks don't require any packages
to be built.

## How do I test my changes?

It's always good practice to run the tests when making changes. If you're unsure which packages
may be affected by your new tests or changes you may run `yarn test --watch` in the root of
the repository.

If your editor is not set up with type checks you may also want to run `yarn run check` on your
changes.

Additionally you can head to any example in the `examples/` folder
and run them. There you'll also need to run `yarn` to install their
dependencies. All examples are started using `yarn start`.

## How do I lint my code?

We ensure consistency in `urql`'s codebase using `eslint` and `prettier`.
They are run on a `precommit` hook, so if something's off they'll try
to automatically fix up your code, or display an error.

If you have them set up in your editor, even better!

## How do I document a change for the changelog?

This project uses [changesets](https://github.com/atlassian/changesets). This means that for
every PR there must be documentation for what has been changed and which package is affected.

You can document a change by running `changeset`, which will ask you which packages
have changed and whether the change is major/minor/patch. It will then ask you to write
a change entry as markdown.

```sh
# In the root of the urql repository call:
yarn changeset
```

This will create a new "changeset file" in the `.changeset` folder, which you should commit and
push, so that it's added to your PR.
This will eventually end up in the package's `CHANGELOG.md` file when we do a release.

You won't need to add a changeset if you're simply making "non-visible" changes to the docs or other
files that aren't published to `npm`.

[Read more about adding a `changeset` here.](https://github.com/atlassian/changesets/blob/master/docs/adding-a-changeset.md#i-am-in-a-multi-package-repository-a-mono-repo)

## How do I release new versions of our packages?

Hold up, that's **automated**! Since we use `changeset` to document our changes, which determines what
goes into the changelog and what kind of version bump a change should make, you can also use the
tool to check what's currently posed to change after a release batch using: `yarn changeset status`.

We have a [GitHub Actions workflow](./.github/workflow/release.yml) which is triggered whenever new
changes are merged. It will always open a **"Version Packages" PR** which is kept up-to-date. This PR
documents all changes that are made and will show in its description what all new changelogs are
going to contain for their new entries.

Once a "Version Packages" PR is approved by a contributor and merged, the action will automatically
take care of creating the release, publishing all updated packages to `npm`, and creating
appropriate tags on GitHub too.

This process is automated, but the changelog should be checked for errors.

As to **when** to merge the automated PR and publish? Maybe not after every change. Typically there
are two release batches: hotfixes and release batches. We expect that a hotfix for a single package
should go out as quickly as possible if it negatively affects users. For **release batches**
however, it's common to assume that if one change is made to a package that more will follow in the
same week. So waiting for **a day or two** when other changes are expected will make sense to keep the
fatigue as low as possible for downstream maintainers.

## How do I upgrade all dependencies?

It may be a good idea to keep all dependencies on the `urql` repository **up-to-date** every now and
then. Typically we do this by running `yarn upgrade-interactive --latest` and checking one-by-one
which dependencies will need to be bumped. In case of any security issues it may make sense to
just run `yarn upgrade [package]`.

Afterwards `yarn` may accidentally introduce duplicate packages due to some transitive dependencies
having been upgraded separately. This can be fixed by running:

```sh
npx yarn-deduplicate yarn.lock
yarn
```

It's common to then **create a PR** (with a changeset documenting the packages that need to reflect new
changes if any `dependencies` have changed) with the name of
"(chore) - Upgrade direct and transitive dependencies" or something similar.

## How do I add a new package?

First of all we need to know **where** to put the package.

- Exchanges should be added to `exchanges/` and the folder should be the plain
  name of the exchange. Since the `package.json:name` is following the convention
  of `@urql/exchange-*` the folder should just be without this conventional prefix.
- All other packages should be added to `packages/`. Typically all packages should
  be named `@urql/*` and their folders should be named exactly this without the
  prefix or `*-urql`. Optionally if the package will be named `*-urql` then the folder
  can take on the same name.

When adding a new package, start by **copying** a `package.json` file from another project.
You may want to alter the following fields first:

- `name`
- `version` (either start at `0.1.0` or `1.0.0`)
- `description`
- `repository.directory`
- `keywords`

Make sure to also alter the `devDependencies`, `peerDependencies`, and `dependencies` to match
the new package's needs.

**The `main` and `module` fields follow a convention:**
All output bundles will always be output in the `./dist` folder by `rollup`, which is set up in
the `build` script. Their filenames are a "kebab case" (dash-cased) version of the `name` field with
an appropriate extension (`.esm.js` for `module` and `.cjs.js` for `main`).

If your entrypoint won't be at `src/index.ts` you may alter it. But the `types` field has to match
the same file relative to the `dist/types` folder, where `rollup` will output the TypeScript
declaration files.

When setting up your package make sure to create a `src/index.ts` file
(or any other file which you've pointed `package.json:source` to). Also don't forget to
copy over the `tsconfig.json` from another package (You won't need to change it).

The `scripts.prepare` task is set up to check your new `package.json` file for correctness. So in
case you get anything wrong, you'll get a short error when running `yarn` after setting your new
project up. Just in case! 😄

Afterwards you can check whether everything is working correctly by running:

```sh
yarn
yarn run check
```

At this point, **don't publish** the package or a prerelease yourself if you can avoid it. If you can't
or have already, we'll need to get the **rights** fixed by adding the package to the `@urql` scope.
Typically what we do is:

```sh
npm access grant read-write urql:developers [package]
```
