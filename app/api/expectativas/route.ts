import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const participanteId =
      request.nextUrl.searchParams.get(
        'participante_id'
      );

    if (
      !participanteId ||
      participanteId.trim() === ''
    ) {
      return NextResponse.json(
        {
          error: 'Participante inválido.'
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          "Expectativa_Id" AS id,
          "Expectativa" AS expectativa
        FROM "Expectativas"
        WHERE "Participante_Id" = $1
        LIMIT 1
      `,
      [participanteId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        exists: false,
        expectativa: null
      });
    }

    return NextResponse.json({
      exists: true,
      expectativa: result.rows[0].expectativa
    });
  } catch (error) {
    console.error(
      'Error obteniendo expectativa:',
      error
    );

    return NextResponse.json(
      {
        error:
          'No se pudo consultar la expectativa.'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      participante_id,
      texto
    } = await request.json();

    if (
      typeof participante_id !== 'string' ||
      participante_id.trim() === ''
    ) {
      return NextResponse.json(
        {
          error: 'Participante inválido.'
        },
        { status: 400 }
      );
    }

    const expectativa = String(
      texto ?? ''
    ).trim();

    if (!expectativa) {
      return NextResponse.json(
        {
          error: 'Completa todos los campos.'
        },
        { status: 400 }
      );
    }

    /*
     * Verificamos si el participante
     * ya tiene una expectativa.
     */
    const existing = await pool.query(
      `
        SELECT
          "Expectativa_Id"
        FROM "Expectativas"
        WHERE "Participante_Id" = $1
        LIMIT 1
      `,
      [participante_id]
    );

    /*
     * Si ya existe, no permitimos
     * sobrescribirla.
     */
    if (existing.rows.length > 0) {
      return NextResponse.json(
        {
          error:
            'Este participante ya tiene una expectativa registrada.'
        },
        { status: 409 }
      );
    }

    await pool.query(
      `
        INSERT INTO "Expectativas"
        (
          "Participante_Id",
          "Expectativa"
        )
        VALUES
        ($1, $2)
      `,
      [
        participante_id,
        expectativa
      ]
    );

    return NextResponse.json({
      ok: true,
      message:
        'La expectativa fue guardada correctamente.'
    });
  } catch (error) {
    console.error(
      'Error guardando expectativa:',
      error
    );

    return NextResponse.json(
      {
        error:
          'No se pudo guardar la expectativa.'
      },
      { status: 500 }
    );
  }
}