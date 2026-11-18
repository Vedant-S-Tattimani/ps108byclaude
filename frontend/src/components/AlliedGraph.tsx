import type { AlliedGroup } from "../types";

export const GROUP_COLOURS: Record<string, string> = {
  normative: "#1d5fa8",
  test_method: "#e2741b",
  terminology: "#6b7a8c",
  safety: "#b3261e",
  installation: "#157a4a",
  related_product: "#0e8a8a",
  sampling: "#a76100",
};

type Props = {
  hub: string;
  groups: AlliedGroup[];
  onOpen: (id: string) => void;
};

/** Hub-and-branch map: the recommended standard in the centre, allied standards grouped around it. */
export function AlliedGraph({ hub, groups, onOpen }: Props) {
  const W = 520;
  const H = 420;
  const cx = W / 2;
  const cy = H / 2;
  const items = groups.flatMap((g) => g.items.slice(0, 4).map((item) => ({ ...item, group: g.type })));
  const radius = 165;
  const hubWidth = Math.max(140, hub.length * 8 + 28);

  return (
    <svg className="graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Map of ${items.length} allied standards around ${hub}`}>
      {items.map((item, i) => {
        const angle = (i / Math.max(items.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * (radius * 0.82);
        return (
          <g key={`edge-${item.id}`}>
            <line className="edge" x1={cx} y1={cy} x2={x} y2={y} />
            <line className="pulse" x1={cx} y1={cy} x2={x} y2={y} style={{ animationDelay: `${(i % 6) * 0.45}s` }} />
          </g>
        );
      })}
      {items.map((item, i) => {
        const angle = (i / Math.max(items.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * (radius * 0.82);
        const label = item.number.replace(" (series)", "").replace(/\(Part (\d+)(\/Sec (\d+))?\)/, "(P$1$2)").replace("/Sec ", "/S");
        const w = Math.max(64, label.length * 6.6 + 18);
        return (
          <g
            key={item.id}
            className="node"
            transform={`translate(${x - w / 2}, ${y - 13})`}
            style={{ cursor: "pointer" }}
            onClick={() => onOpen(item.id)}
            role="button"
            tabIndex={0}
            aria-label={`${item.designation}, ${item.relation.replace("_", " ")}`}
            onKeyDown={(e) => e.key === "Enter" && onOpen(item.id)}
          >
            <rect className="box" width={w} height={26} rx={7} />
            <rect width={4} height={26} rx={2} fill={GROUP_COLOURS[item.group]} stroke="none" />
            <text x={w / 2 + 2} y={17} textAnchor="middle">
              {label}
            </text>
          </g>
        );
      })}
      <g className="node hub" transform={`translate(${cx - hubWidth / 2}, ${cy - 20})`}>
        <rect className="box" width={hubWidth} height={40} rx={10} />
        <text x={hubWidth / 2} y={25} textAnchor="middle" style={{ fontSize: 12.5 }}>
          {hub}
        </text>
      </g>
    </svg>
  );
}
