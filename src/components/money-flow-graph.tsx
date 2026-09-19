import { useMemo } from "react";
import { avatarFill } from "@/lib/avatar";
import { useI18n } from "@/lib/i18n";
import { formatCents } from "@/lib/money";

export interface FlowPerson {
  id: string;
  name: string;
}

export interface FlowTransfer {
  from: string;
  to: string;
  cents: number;
}

interface FlowNode {
  id: string;
  name: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
}

const WIDTH = 560;
const HEIGHT = 340;
const NODE_RADIUS = 22;
const MIN_EDGE = 1.5;
const MAX_EDGE = 5;

function initial(name: string): string {
  const trimmed = name.trim();
  return trimmed.length === 0 ? "?" : trimmed.slice(0, 1).toUpperCase();
}

export function MoneyFlowGraph({
  people,
  transfers
}: {
  people: readonly FlowPerson[];
  transfers: readonly FlowTransfer[];
}) {
  const { t, locale } = useI18n();

  const nodes = useMemo<FlowNode[]>(() => {
    const entries = people.map((person) => [person.id, person.name] as const);
    const count = entries.length;
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2 - 6;
    const rx = WIDTH / 2 - 80;
    const ry = HEIGHT / 2 - 60;
    const labelOffset = NODE_RADIUS + 14;

    return entries.map(([id, name], index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * rx;
      const y = cy + Math.sin(angle) * ry;
      return {
        id,
        name,
        x,
        y,
        labelX: x + Math.cos(angle) * labelOffset,
        labelY: y + Math.sin(angle) * labelOffset + 4
      };
    });
  }, [people]);

  const edges = useMemo(() => {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2 - 6;
    const maxAmount = transfers.reduce(
      (largest, transfer) => Math.max(largest, transfer.cents),
      1
    );
    const positions = [0.3, 0.46, 0.62, 0.78];

    const rawEdges = transfers.flatMap((transfer, index) => {
      const from = nodeById.get(transfer.from);
      const to = nodeById.get(transfer.to);
      if (!from || !to) {
        return [];
      }

      const width =
        MIN_EDGE + (transfer.cents / maxAmount) * (MAX_EDGE - MIN_EDGE);
      const arrow = 6 + width * 1.2;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy) || 1;
      const ux = dx / length;
      const uy = dy / length;

      const start = {
        x: from.x + ux * (NODE_RADIUS + 2),
        y: from.y + uy * (NODE_RADIUS + 2)
      };
      const tip = {
        x: to.x - ux * (NODE_RADIUS + 2),
        y: to.y - uy * (NODE_RADIUS + 2)
      };
      const end = { x: tip.x - ux * arrow, y: tip.y - uy * arrow };
      const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
      const control = {
        x: mid.x + (cx - mid.x) * 0.35,
        y: mid.y + (cy - mid.y) * 0.35
      };

      const position = positions[index % positions.length] ?? 0.5;
      const inverse = 1 - position;
      const label = {
        x:
          inverse * inverse * start.x +
          2 * position * inverse * control.x +
          position * position * end.x,
        y:
          inverse * inverse * start.y +
          2 * position * inverse * control.y +
          position * position * end.y
      };

      const base = { x: tip.x - ux * arrow, y: tip.y - uy * arrow };
      const px = -uy * (3 + width / 2);
      const py = ux * (3 + width / 2);
      const labelText = formatCents(transfer.cents, locale);

      return [
        {
          key: `${transfer.from}-${transfer.to}-${transfer.cents}`,
          path: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
          arrow: `${tip.x},${tip.y} ${base.x + px},${base.y + py} ${
            base.x - px
          },${base.y - py}`,
          label,
          labelWidth: Math.max(40, labelText.length * 6.2 + 12),
          labelText,
          width
        }
      ];
    });

    const placed: { x: number; y: number; width: number }[] = [];
    for (const edge of rawEdges) {
      let attempts = 0;
      while (
        attempts < 12 &&
        placed.some(
          (other) =>
            Math.abs(other.x - edge.label.x) <
              (other.width + edge.labelWidth) / 2 + 8 &&
            Math.abs(other.y - edge.label.y) < 20
        )
      ) {
        attempts += 1;
        edge.label.y += 16;
      }
      placed.push({
        x: edge.label.x,
        y: edge.label.y,
        width: edge.labelWidth
      });
    }

    return rawEdges;
  }, [nodes, transfers, locale]);

  return (
    <svg
      key={transfers.map((transfer) => `${transfer.from}-${transfer.to}`).join("|")}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="flow-fade h-auto w-full"
      role="img"
      aria-label={t("settle.flowAria")}
    >
      {edges.map((edge) => (
        <g key={edge.key}>
          <path
            d={edge.path}
            fill="none"
            strokeWidth={edge.width}
            strokeLinecap="round"
            style={{
              stroke: "color-mix(in oklab, var(--muted) 45%, transparent)"
            }}
          />
          <polygon
            points={edge.arrow}
            style={{
              fill: "color-mix(in oklab, var(--muted) 45%, transparent)"
            }}
          />
        </g>
      ))}

      {edges.map((edge) => (
        <g key={`${edge.key}-label`}>
          <rect
            x={edge.label.x - edge.labelWidth / 2}
            y={edge.label.y - 9}
            width={edge.labelWidth}
            height={18}
            rx={5}
            style={{ fill: "var(--muted-surface)" }}
          />
          <text
            x={edge.label.x}
            y={edge.label.y + 3.5}
            textAnchor="middle"
            fontSize={10.5}
            style={{ fill: "var(--muted)" }}
          >
            {edge.labelText}
          </text>
        </g>
      ))}

      {nodes.map((node) => (
        <g key={node.id}>
          <circle
            cx={node.x}
            cy={node.y}
            r={NODE_RADIUS}
            strokeWidth={1}
            style={{
              fill: avatarFill(node.name),
              stroke: "var(--line)"
            }}
          />
          <text
            x={node.x}
            y={node.y + 4}
            textAnchor="middle"
            fontSize={12}
            fontWeight={600}
            style={{ fill: "var(--avatar-foreground)" }}
          >
            {initial(node.name)}
          </text>
          <text
            x={node.labelX}
            y={node.labelY}
            textAnchor="middle"
            fontSize={11}
            fontWeight={500}
            style={{ fill: "var(--ink)" }}
          >
            {node.name}
          </text>
        </g>
      ))}
    </svg>
  );
}
