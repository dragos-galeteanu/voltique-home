# 0009. Five languages behind a typed key surface

## Decision

English, German, French, Italian and Spanish, following the device language with an
override in settings. Translation keys are type-checked against the English catalogue.

## Why

The structure was put in before the screens rather than after. At the time there were about
forty strings; by the end of the planned work there were several hundred. Moving copy out of
components later costs roughly ten times as much and always misses some.

Type-checking the keys turns the usual failure, a screen rendering `alerts.title` to a
person, into a compile error. Tests add what types cannot see: that every locale has exactly
English's keys, that no value is empty, and that no translation drops an interpolated value.

## Rejected

**English only, structured for more.** Cheaper, and it postpones discovering whether the
structure actually works. Shipping five locales proves it does.

**Leaving strings in components.** Fastest per screen and the most expensive thing here to
undo.

## Consequences

Every feature now carries five copies of its copy, which is a real ongoing cost and the
reason the catalogues are grouped by feature.

The four non-English catalogues were machine translated and need a native speaker's review
before a real release. Energy terminology is where that goes wrong.

Server-worded error text is shown as it arrives, which makes localising problem details the
API's responsibility.
