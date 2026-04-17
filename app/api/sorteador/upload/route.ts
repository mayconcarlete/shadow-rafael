import { NextRequest, NextResponse } from 'next/server';

interface Player {
  firstName: string;
  lastName: string;
  team: string;
  modality: string;
  yearsPlaying: string;
}

function detectDelimiter(line: string): string {
  if (line.includes('\t')) return '\t';
  if (line.includes(';')) return ';';
  return ',';
}

function unquote(cell: string): string {
  const trimmed = cell.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"');
  }
  return trimmed;
}

function parseCSV(text: string): Player[] {
  const lines = text.trim().split('\n');
  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0].split(delimiter).map(unquote);

  const idx = {
    firstName: headers.indexOf('Guest first name'),
    lastName: headers.indexOf('Guest last name'),
    team: headers.indexOf('Equipe Atual'),
    modality: headers.indexOf('Modalidade'),
    years: headers.indexOf('Joga a quantos anos?'),
  };

  return lines.slice(1).map((line) => {
    const cols = line.split(delimiter).map(unquote);
    return {
      firstName: cols[idx.firstName] ?? '',
      lastName: cols[idx.lastName] ?? '',
      team: cols[idx.team] ?? '',
      modality: cols[idx.modality] ?? '',
      yearsPlaying: cols[idx.years] ?? '',
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a .csv' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Detect UTF-16 LE BOM (FF FE) and decode accordingly
    let text: string;
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      text = new TextDecoder('utf-16le').decode(buffer);
    } else {
      text = new TextDecoder('utf-8').decode(buffer);
    }

    // Strip BOM character if present and normalize line endings
    text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const players = parseCSV(text);

    console.log('=== CSV UPLOAD ===');
    console.log(`Total players: ${players.length}`);
    console.table(players);

    return NextResponse.json({ total: players.length, players });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
