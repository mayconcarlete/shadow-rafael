import { NextRequest, NextResponse } from 'next/server';
import { drawByAleatorio, drawByTimes, GroupOrder, Player } from '@/lib/services/draw.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { players, method, teamCount, groupOrder } = body as {
      players: Player[];
      method: string;
      teamCount: number;
      groupOrder: GroupOrder;
    };

    if (!players?.length) {
      return NextResponse.json({ error: 'No players provided' }, { status: 400 });
    }
    if (!teamCount || teamCount < 2) {
      return NextResponse.json({ error: 'teamCount must be at least 2' }, { status: 400 });
    }

    if (method === 'times') {
      const result = drawByTimes(players, teamCount, groupOrder);
      console.log('=== SORTEIO (Times) ===');
      result.forEach((t) => {
        console.log(`\n${t.name} — avg: ${t.avgYears} anos`);
        console.table(t.players);
      });
      return NextResponse.json({ teams: result });
    }

    if (method === 'aleatorio') {
      const result = drawByAleatorio(players, teamCount);
      console.log('=== SORTEIO (Aleatório) ===');
      result.forEach((t) => {
        console.log(`\n${t.name} — avg: ${t.avgYears} anos`);
        console.table(t.players);
      });
      return NextResponse.json({ teams: result });
    }

    return NextResponse.json({ error: `Method "${method}" not implemented yet` }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
