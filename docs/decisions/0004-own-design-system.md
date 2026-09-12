# 0004. Our own design system rather than a UI kit

## Decision

A small token-driven component library in `src/design-system`: themes, typography, spacing
and a handful of primitives. No third-party UI kit.

## Why

This is an energy dashboard with a specific visual language, including colours that carry
meaning. Production is one colour everywhere: in a chart, in a status pill, in a legend and
in a metric tile. A kit's components would have had to be fought into that, and a kit's
theme would have been a second source of truth next to the chart colours.

Screens name a semantic role rather than a colour, so light and dark modes cannot drift and
a palette change touches one file.

## Rejected

**Material Design components.** Fastest to a working screen, and a Material look on iOS
with theming constraints to work around.

**A styled system such as Tamagui.** Strong performance and a large component set, at the
cost of tying the codebase to its API and its compiler.

## Consequences

Every primitive we need has to be written, which is perhaps a day of work spread thin, and
means unusual components are never free.

React Navigation's theme is derived from the same tokens, so headers and tab bars cannot
drift from the rest of the app.
