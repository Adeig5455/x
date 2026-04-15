import React, { useState, useMemo } from 'react';

// ============================================================================
// Source Control Graph - Git log visualization with branches, merges, graph
// ============================================================================

export interface GitCommitNode {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  authorEmail: string;
  date: number;
  parents: string[];
  branches: string[];
  tags: string[];
  isHead: boolean;
  isMerge: boolean;
  additions?: number;
  deletions?: number;
  filesChanged?: number;
}

export interface GitBranch {
  name: string;
  isRemote: boolean;
  isCurrent: boolean;
  lastCommitHash: string;
  color: string;
}

interface SourceControlGraphProps {
  commits: GitCommitNode[];
  branches: GitBranch[];
  onCommitClick: (hash: string) => void;
  onBranchClick: (name: string) => void;
  onCheckout: (ref: string) => void;
  onCherryPick: (hash: string) => void;
  onRevert: (hash: string) => void;
  isLoading?: boolean;
}

const BRANCH_COLORS = [
  '#4ec9b0', '#3794ff', '#c586c0', '#dcdcaa', '#ce9178',
  '#f44747', '#cca700', '#569cd6', '#d16969', '#b5cea8',
  '#e8ab53', '#75beff', '#d4d4d4', '#608b4e', '#4fc1ff',
];

function assignLanes(commits: GitCommitNode[]): Map<string, number> {
  const lanes = new Map<string, number>();
  const activeLanes = new Set<number>();
  let nextLane = 0;

  for (const commit of commits) {
    if (!lanes.has(commit.hash)) {
      // Find first free lane
      let lane = 0;
      while (activeLanes.has(lane)) lane++;
      lanes.set(commit.hash, lane);
      activeLanes.add(lane);
    }

    const currentLane = lanes.get(commit.hash)!;

    // Assign parents
    for (let i = 0; i < commit.parents.length; i++) {
      const parent = commit.parents[i];
      if (!lanes.has(parent)) {
        if (i === 0) {
          lanes.set(parent, currentLane);
        } else {
          let lane = 0;
          while (activeLanes.has(lane)) lane++;
          lanes.set(parent, lane);
          activeLanes.add(lane);
        }
      }
    }

    // Free lane if no more commits will use it
    if (commit.parents.length === 0) {
      activeLanes.delete(currentLane);
    }
  }

  return lanes;
}

const formatDate = (ts: number): string => {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const GraphLine: React.FC<{
  commit: GitCommitNode;
  lane: number;
  maxLane: number;
  color: string;
  parentLanes: Array<{ lane: number; color: string }>;
}> = ({ commit, lane, maxLane, color, parentLanes }) => {
  const width = (maxLane + 1) * 20 + 10;
  const cx = lane * 20 + 15;
  const cy = 15;

  return (
    <svg width={width} height={30} style={{ flexShrink: 0 }}>
      {/* Parent connections */}
      {parentLanes.map((pl, i) => {
        const px = pl.lane * 20 + 15;
        return (
          <path
            key={i}
            d={`M ${cx} ${cy} C ${cx} ${cy + 10}, ${px} ${cy + 5}, ${px} ${cy + 15}`}
            stroke={pl.color}
            strokeWidth={1.5}
            fill="none"
            opacity={0.6}
          />
        );
      })}
      {/* Vertical line down */}
      <line x1={cx} y1={0} x2={cx} y2={cy} stroke={color} strokeWidth={1.5} opacity={0.6} />
      {/* Commit dot */}
      <circle
        cx={cx}
        cy={cy}
        r={commit.isMerge ? 5 : commit.isHead ? 6 : 4}
        fill={commit.isHead ? color : commit.isMerge ? 'var(--bg-primary)' : color}
        stroke={color}
        strokeWidth={commit.isMerge ? 2 : commit.isHead ? 2 : 0}
      />
    </svg>
  );
};

export const SourceControlGraph: React.FC<SourceControlGraphProps> = ({
  commits,
  branches,
  onCommitClick,
  onBranchClick,
  onCheckout,
  onCherryPick,
  onRevert,
  isLoading,
}) => {
  const [filter, setFilter] = useState('');
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [showBranches, setShowBranches] = useState(true);

  const lanes = useMemo(() => assignLanes(commits), [commits]);
  const maxLane = useMemo(() => Math.max(0, ...Array.from(lanes.values())), [lanes]);

  const branchColorMap = useMemo(() => {
    const map = new Map<string, string>();
    branches.forEach((b, i) => map.set(b.name, b.color || BRANCH_COLORS[i % BRANCH_COLORS.length]));
    return map;
  }, [branches]);

  const getCommitColor = (commit: GitCommitNode): string => {
    if (commit.branches.length > 0) {
      return branchColorMap.get(commit.branches[0]) || BRANCH_COLORS[0];
    }
    const lane = lanes.get(commit.hash) || 0;
    return BRANCH_COLORS[lane % BRANCH_COLORS.length];
  };

  const filtered = useMemo(() => {
    if (!filter) return commits;
    const q = filter.toLowerCase();
    return commits.filter((c) =>
      c.message.toLowerCase().includes(q) ||
      c.author.toLowerCase().includes(q) ||
      c.shortHash.toLowerCase().includes(q) ||
      c.branches.some((b) => b.toLowerCase().includes(q)) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [commits, filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
          Source Control Graph
        </span>
        <div style={{ flex: 1 }} />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search commits..."
          style={{
            width: 180, padding: '2px 6px', background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)', borderRadius: 3, color: 'var(--text-primary)',
            fontSize: 11, outline: 'none',
          }}
        />
        <button onClick={() => setShowBranches(!showBranches)} style={{
          background: 'none', border: 'none', fontSize: 11, cursor: 'pointer',
          color: showBranches ? 'var(--accent-color)' : 'var(--text-secondary)',
        }}>Branches</button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Branch list */}
        {showBranches && (
          <div style={{ width: 180, borderRight: '1px solid var(--border-color)', overflow: 'auto' }}>
            <div style={{
              padding: '4px 8px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
              color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)',
            }}>Branches</div>
            {branches.map((branch) => (
              <div
                key={branch.name}
                onClick={() => onBranchClick(branch.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px',
                  cursor: 'pointer', fontSize: 11,
                  background: branch.isCurrent ? 'rgba(55,148,255,0.1)' : 'transparent',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseOut={(e) => (e.currentTarget.style.background = branch.isCurrent ? 'rgba(55,148,255,0.1)' : 'transparent')}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: 4,
                  background: branchColorMap.get(branch.name) || '#969696', flexShrink: 0,
                }} />
                <span style={{
                  color: branch.isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: branch.isCurrent ? 600 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{branch.name}</span>
                {branch.isRemote && <span style={{ fontSize: 8, color: '#c586c0' }}>⬆</span>}
              </div>
            ))}
          </div>
        )}

        {/* Commit graph */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>Loading...</div>
          ) : (
            filtered.map((commit) => {
              const lane = lanes.get(commit.hash) || 0;
              const color = getCommitColor(commit);
              const parentLanes = commit.parents.map((p) => ({
                lane: lanes.get(p) || 0,
                color: BRANCH_COLORS[(lanes.get(p) || 0) % BRANCH_COLORS.length],
              }));
              const isSelected = selectedHash === commit.hash;

              return (
                <div
                  key={commit.hash}
                  onClick={() => { setSelectedHash(commit.hash); onCommitClick(commit.hash); }}
                  style={{
                    display: 'flex', alignItems: 'center', height: 30,
                    cursor: 'pointer', borderBottom: '1px solid rgba(60,60,60,0.15)',
                    background: isSelected ? 'rgba(55,148,255,0.1)' : 'transparent',
                  }}
                  onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = isSelected ? 'rgba(55,148,255,0.1)' : 'transparent'; }}
                >
                  <GraphLine
                    commit={commit}
                    lane={lane}
                    maxLane={Math.min(maxLane, 6)}
                    color={color}
                    parentLanes={parentLanes}
                  />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, paddingRight: 8 }}>
                    {/* Branches/tags */}
                    {commit.branches.map((b) => (
                      <span key={b} style={{
                        fontSize: 9, padding: '0 4px', borderRadius: 3, flexShrink: 0,
                        background: `${branchColorMap.get(b) || '#569cd6'}22`,
                        color: branchColorMap.get(b) || '#569cd6',
                        border: `1px solid ${branchColorMap.get(b) || '#569cd6'}44`,
                      }}>{b}</span>
                    ))}
                    {commit.tags.map((t) => (
                      <span key={t} style={{
                        fontSize: 9, padding: '0 4px', borderRadius: 3, flexShrink: 0,
                        background: 'rgba(204,167,0,0.15)', color: '#cca700',
                      }}>🏷 {t}</span>
                    ))}
                    {/* Message */}
                    <span style={{
                      fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                    }}>{commit.message}</span>
                    {/* Author */}
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {commit.author}
                    </span>
                    {/* Hash */}
                    <span style={{ fontSize: 10, color: 'var(--text-accent)', fontFamily: 'monospace', flexShrink: 0 }}>
                      {commit.shortHash}
                    </span>
                    {/* Date */}
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', flexShrink: 0, width: 50, textAlign: 'right' }}>
                      {formatDate(commit.date)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Selected commit detail */}
      {selectedHash && (() => {
        const commit = commits.find((c) => c.hash === selectedHash);
        if (!commit) return null;
        return (
          <div style={{
            padding: '6px 12px', borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-accent)' }}>{commit.shortHash}</span>
            <span style={{ fontSize: 11, color: 'var(--text-primary)', flex: 1 }}>{commit.message}</span>
            <button onClick={() => onCheckout(commit.hash)} style={{
              padding: '2px 6px', borderRadius: 3, border: '1px solid var(--border-color)',
              background: 'transparent', color: 'var(--text-secondary)', fontSize: 10, cursor: 'pointer',
            }}>Checkout</button>
            <button onClick={() => onCherryPick(commit.hash)} style={{
              padding: '2px 6px', borderRadius: 3, border: '1px solid var(--border-color)',
              background: 'transparent', color: 'var(--text-secondary)', fontSize: 10, cursor: 'pointer',
            }}>Cherry Pick</button>
            <button onClick={() => onRevert(commit.hash)} style={{
              padding: '2px 6px', borderRadius: 3, border: '1px solid rgba(244,71,71,0.3)',
              background: 'transparent', color: '#f44747', fontSize: 10, cursor: 'pointer',
            }}>Revert</button>
          </div>
        );
      })()}
    </div>
  );
};
