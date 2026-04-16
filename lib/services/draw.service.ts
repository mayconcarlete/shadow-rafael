export interface Player {
  firstName: string;
  lastName: string;
  team: string;
  modality: string;
  yearsPlaying: string;
}

export interface DrawnTeam {
  name: string;
  players: Player[];
  avgYears: number;
}

function parseYears(value: string): number {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
}

export type GroupOrder = 'maiores' | 'menores';

export function drawByTimes(
  players: Player[],
  teamCount: number,
  groupOrder: GroupOrder = 'maiores'
): DrawnTeam[] {
  const total = players.length;
  const baseSize = Math.floor(total / teamCount);
  const remainder = total % teamCount;
  const capacities = Array.from({ length: teamCount }, (_, i) =>
    i < remainder ? baseSize + 1 : baseSize
  );

  // Group players by Equipe Atual
  const groupMap = new Map<string, Player[]>();
  for (const player of players) {
    const key = player.team || 'Sem time';
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(player);
  }

  // "maiores": large groups placed first, small overflow distributed individually
  // "menores": small groups placed first, large groups distributed individually
  const sorted = Array.from(groupMap.values()).sort((a, b) =>
    groupOrder === 'maiores' ? b.length - a.length : a.length - b.length
  );

  const buckets: Player[][] = Array.from({ length: teamCount }, () => []);
  const overflow: Player[] = [];

  for (const group of sorted) {
    const bucketIndex = buckets
      .map((b, i) => ({ i, space: capacities[i] - b.length }))
      .filter(({ space }) => space >= group.length)
      .sort((a, b) => b.space - a.space)[0]?.i;

    if (bucketIndex !== undefined) {
      buckets[bucketIndex].push(...group);
    } else {
      overflow.push(...group);
    }
  }

  // Distribute overflow individually, filling buckets with most remaining space first
  overflow.sort((a, b) => parseYears(b.yearsPlaying) - parseYears(a.yearsPlaying));
  for (const player of overflow) {
    const target = buckets
      .map((b, i) => ({ i, space: capacities[i] - b.length }))
      .filter(({ space }) => space > 0)
      .sort((a, b) => b.space - a.space)[0];
    if (target) buckets[target.i].push(player);
  }

  return buckets.map((bucket, i) => {
    const totalYears = bucket.reduce((sum, p) => sum + parseYears(p.yearsPlaying), 0);
    return {
      name: `Time ${i + 1}`,
      players: bucket,
      avgYears: bucket.length > 0 ? parseFloat((totalYears / bucket.length).toFixed(2)) : 0,
    };
  });
}

export function drawByAleatorio(players: Player[], teamCount: number): DrawnTeam[] {
  const total = players.length;
  const baseSize = Math.floor(total / teamCount);
  const remainder = total % teamCount;
  const capacities = Array.from({ length: teamCount }, (_, i) =>
    i < remainder ? baseSize + 1 : baseSize
  );

  const byModality = new Map<string, Player[]>();
  for (const player of players) {
    const key = player.modality || 'Sem modalidade';
    if (!byModality.has(key)) byModality.set(key, []);
    byModality.get(key)!.push(player);
  }

  const buckets: Player[][] = Array.from({ length: teamCount }, () => []);

  // Snake order across modalities so any leftover from one modality doesn't always
  // pile up on the same team in the next modality.
  let direction: 1 | -1 = 1;
  let cursor = 0;

  const modalityGroups = Array.from(byModality.values());
  for (const group of modalityGroups) {
    const sorted = [...group].sort(
      (a, b) => parseYears(b.yearsPlaying) - parseYears(a.yearsPlaying)
    );

    for (const player of sorted) {
      let placed = false;
      for (let attempts = 0; attempts < teamCount; attempts++) {
        if (buckets[cursor].length < capacities[cursor]) {
          buckets[cursor].push(player);
          placed = true;
          cursor += direction;
          if (cursor === teamCount) {
            cursor = teamCount - 1;
            direction = -1;
          } else if (cursor === -1) {
            cursor = 0;
            direction = 1;
          }
          break;
        }
        cursor += direction;
        if (cursor === teamCount) {
          cursor = teamCount - 1;
          direction = -1;
        } else if (cursor === -1) {
          cursor = 0;
          direction = 1;
        }
      }
      if (!placed) {
        const target = buckets
          .map((b, i) => ({ i, space: capacities[i] - b.length }))
          .filter(({ space }) => space > 0)
          .sort((a, b) => b.space - a.space)[0];
        if (target) buckets[target.i].push(player);
      }
    }
  }

  return buckets.map((bucket, i) => {
    const totalYears = bucket.reduce((sum, p) => sum + parseYears(p.yearsPlaying), 0);
    return {
      name: `Time ${i + 1}`,
      players: bucket,
      avgYears: bucket.length > 0 ? parseFloat((totalYears / bucket.length).toFixed(2)) : 0,
    };
  });
}
