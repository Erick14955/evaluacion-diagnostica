import {
  NextRequest,
  NextResponse
} from 'next/server';

import { pool } from '@/lib/db';
import { ensureParticipant } from '@/lib/participant';

export async function GET(
  request: NextRequest
) {
  try {
    const id =
      request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Falta el ID.' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          "id" AS id,
          "Nombre" AS nombre,
          "Comunidad" AS comunidad
        FROM "Participantes"
        WHERE "id" = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          error:
            'Participante no encontrado.'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      participant: result.rows[0]
    });
  } catch (error) {
    console.error(
      'Error obteniendo participante:',
      error
    );

    return NextResponse.json(
      {
        error:
          'No se pudo obtener el participante.'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const participant =
      await ensureParticipant(
        body.id,
        body.nombre ?? ''
      );

    return NextResponse.json({
      participant
    });
  } catch (error) {
    console.error(
      'Error guardando participante:',
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error interno.'
      },
      { status: 500 }
    );
  }
}