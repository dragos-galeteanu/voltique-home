import { matchFont } from '@shopify/react-native-skia';
import { Fragment, useMemo } from 'react';
import { Platform, View } from 'react-native';
import { Area, CartesianChart, Line } from 'victory-native';

import { useTheme } from '@/design-system';

import { buildAxisLabeller } from './axis';
import type { RangeKey } from './range';
import type { ChartRow } from './series';

export type ChartMetric = {
  /** Key in the row, which is the metric name the API used. */
  key: string;
  color: string;
  /** Filled to the baseline, for production and battery. */
  filled?: boolean;
};

export type EnergyChartProps = {
  rows: ChartRow[];
  metrics: ChartMetric[];
  range: RangeKey;
  timeZone: string;
  height?: number;
  /** Fixed vertical range, used to pin state of charge to nought and a hundred. */
  domain?: [number, number];
  testID?: string;
};

/**
 * The chart itself. It draws what it is given and nothing more: no fetching, no range
 * logic, no derived figures, so it can be reused for a household and for one asset.
 *
 * Missing buckets arrive as null and are drawn as breaks, because a gap in the data is
 * not the same as a reading of zero.
 */
export function EnergyChart({
  rows,
  metrics,
  range,
  timeZone,
  height = 240,
  domain,
  testID,
}: EnergyChartProps) {
  const theme = useTheme();

  // Skia needs a font object; matching a system face avoids shipping a typeface.
  const font = useMemo(
    () =>
      matchFont({
        fontFamily: Platform.select({ ios: 'Helvetica', default: 'sans-serif' }),
        fontSize: 11,
      }),
    [],
  );

  const formatXLabel = useMemo(() => buildAxisLabeller(range, timeZone), [range, timeZone]);

  const yKeys = metrics.map((metric) => metric.key);

  return (
    <View style={{ height }} testID={testID}>
      <CartesianChart
        data={rows}
        xKey="t"
        yKeys={yKeys}
        domain={domain ? { y: domain } : undefined}
        domainPadding={{ top: 16, bottom: 0 }}
        padding={{ left: 4, right: 8, top: 8, bottom: 4 }}
        xAxis={{
          font,
          tickCount: 4,
          labelColor: theme.colors.textMuted,
          lineColor: theme.colors.border,
          formatXLabel,
        }}
        yAxis={[
          {
            font,
            tickCount: 4,
            labelColor: theme.colors.textMuted,
            lineColor: theme.colors.border,
          },
        ]}
      >
        {({ points, chartBounds }) =>
          metrics.map((metric) => {
            const series = points[metric.key] ?? [];

            return (
              <Fragment key={metric.key}>
                {metric.filled ? (
                  <Area
                    points={series}
                    y0={chartBounds.bottom}
                    color={metric.color}
                    opacity={0.2}
                    curveType="natural"
                    animate={{ type: 'timing', duration: 250 }}
                  />
                ) : null}
                <Line
                  points={series}
                  color={metric.color}
                  strokeWidth={2}
                  curveType="natural"
                  // Null buckets stay as breaks in the line rather than being bridged.
                  connectMissingData={false}
                  animate={{ type: 'timing', duration: 250 }}
                />
              </Fragment>
            );
          })
        }
      </CartesianChart>
    </View>
  );
}
