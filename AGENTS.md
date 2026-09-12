# Conventions

Rules that apply to every change here, whether it is made by a person or by a coding
agent. They exist because each one has already cost something once.

## The contract is the source of truth

`src/contract/openapi.yaml` defines the API. Change it first, then run `npm run codegen`
and `npm run fixtures`. Never hand-edit anything under `src/api/generated/` or
`src/mocks/generated/`: it is overwritten, and CI fails if the committed output does not
match the contract.

Keep the examples in the contract realistic. They are what the mock server returns, what
the in-app scenarios use and what the end-to-end tests assert against, so a lazy example
weakens three things at once.

## Copy lives in catalogues, not in components

No user-facing string belongs in a component. Add the key to
`src/i18n/locales/en.json` and translate it into the other four files. Keys are
type-checked against English, so a missing one is a compile error rather than a screen
showing `alerts.title`. Validation messages count as copy. See [docs/i18n.md](docs/i18n.md).

## Anything interactive carries a test identifier

Every pressable, input and meaningful container gets a `testID`. Tests select on those
rather than on text, because text changes with the language and a test that reads English
copy breaks in German.

## Storage is declared, never ad hoc

Nothing calls AsyncStorage or the keychain directly. Add an entry to
`src/storage/registry.ts` with a backend, a schema, a version and a scope. Scope decides
what a sign-out clears. See [docs/storage.md](docs/storage.md).

## Screens name roles, not colours

Use the semantic roles from the design system, such as `production` or `danger`. A hex
value in a screen is a bug: it will be wrong in one of the two themes.

## Units are converted in one place

The API speaks watts and watt-hours. Only `src/lib/format-energy.ts` turns those into
something a person reads, and it does so in the active locale.

## Commits

Conventional Commits, enforced on `commit-msg`. The scope must come from the list in
`commitlint.config.js`. Staged files are linted and formatted on `pre-commit`.

```
feat(alerts): add the alert inbox
fix(api): clear the request timeout after a response
```

## Before opening a pull request

```bash
npm run verify        # typecheck, lint, formatting, tests
npm run contract:lint # only if the contract changed
```

CI runs the same, plus a Metro bundle of both platforms and a check that generated code is
current. End-to-end tests run nightly and before a release.
