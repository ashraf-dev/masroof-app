import { Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from './theme';

export interface Slice {
  value: number;
  color: string;
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = { x: cx + r * Math.cos(start), y: cy + r * Math.sin(start) };
  const e = { x: cx + r * Math.cos(end), y: cy + r * Math.sin(end) };
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export function DonutChart({ data, size = 180, thickness = 26, center }: { data: Slice[]; size?: number; thickness?: number; center?: React.ReactNode }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  let angle = -Math.PI / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={c} cy={c} r={r} stroke={colors.border} strokeWidth={thickness} fill="none" />
        {total > 0 &&
          data.map((d, i) => {
            const sweep = (d.value / total) * Math.PI * 2;
            const start = angle;
            angle += sweep;
            if (sweep >= Math.PI * 2 - 1e-6) {
              return <Circle key={i} cx={c} cy={c} r={r} stroke={d.color} strokeWidth={thickness} fill="none" />;
            }
            return <Path key={i} d={arcPath(c, c, r, start, start + sweep)} stroke={d.color} strokeWidth={thickness} fill="none" />;
          })}
      </Svg>
      {center}
    </View>
  );
}

export function BarChart({
  data,
  height = 160,
  barColor = colors.primary,
  highlightIndex,
}: {
  data: { label: string; value: number }[];
  height?: number;
  barColor?: string;
  highlightIndex?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const showEvery = data.length > 10 ? Math.ceil(data.length / 7) : 1;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: data.length > 10 ? 2 : 8 }}>
        {data.map((d, i) => (
          <View key={i} style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
            <Svg width="100%" height={Math.max(2, (d.value / max) * height)}>
              <Rect x={0} y={0} width="100%" height="100%" rx={4} fill={i === highlightIndex ? colors.primaryDark : barColor} opacity={d.value ? 1 : 0.25} />
            </Svg>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 6, gap: data.length > 10 ? 2 : 8 }}>
        {data.map((d, i) => (
          <Text key={i} numberOfLines={1} style={{ flex: 1, fontSize: 11, color: colors.muted, textAlign: 'center' }}>
            {i % showEvery === 0 ? d.label : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function ProgressBar({ value, color = colors.primary }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color, borderRadius: 5 }} />
    </View>
  );
}

