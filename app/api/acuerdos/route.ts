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
          "Acuerdos_Id" AS id,
          "Acuerdos" AS acuerdo
        FROM "Acuerdos_Compromisos"
        WHERE "Participante_Id" = $1
        LIMIT 1
      `,
      [participanteId]
    );

    /*
     * El participante todavía no tiene
     * un acuerdo registrado.
     */
    if (result.rows.length === 0) {
      return NextResponse.json({
        exists: false,
        acuerdo: null
      });
    }

    /*
     * El participante ya tiene un acuerdo.
     */
    return NextResponse.json({
      exists: true,
      acuerdo: result.rows[0].acuerdo
    });

  } catch (error) {
    console.error(
      'Error obteniendo acuerdo:',
      error
    );

    return NextResponse.json(
      {
        error:
          'No se pudo consultar el acuerdo.'
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

    const participanteId =
      body.participante_id;

    const acuerdo =
      String(body.texto ?? '').trim();

    /*
     * Validar participante.
     */
    if (
      typeof participanteId !== 'string' ||
      participanteId.trim() === ''
    ) {
      return NextResponse.json(
        {
          error: 'Participante inválido.'
        },
        { status: 400 }
      );
    }

    /*
     * Validar acuerdo.
     */
    if (!acuerdo) {
      return NextResponse.json(
        {
          error:
            'Completa el campo antes de continuar.'
        },
        { status: 400 }
      );
    }

    /*
     * Verificar si ya existe un acuerdo
     * para este participante.
     */
    const existing = await pool.query(
      `
        SELECT
          "Acuerdos_Id" AS id,
          "Acuerdos" AS acuerdo
        FROM "Acuerdos_Compromisos"
        WHERE "Participante_Id" = $1
        LIMIT 1
      `,
      [participanteId]
    );

    /*
     * Si ya existe, no permitimos
     * registrar otro.
     */
    if (existing.rows.length > 0) {
      return NextResponse.json(
        {
          error:
            'Este participante ya tiene un acuerdo registrado.',
          exists: true,
          acuerdo:
            existing.rows[0].acuerdo
        },
        { status: 409 }
      );
    }

    /*
     * Insertar el nuevo acuerdo.
     */
    await pool.query(
      `
        INSERT INTO "Acuerdos_Compromisos"
        (
          "Participante_Id",
          "Acuerdos"
        )
        VALUES
        (
          $1,
          $2
        )
      `,
      [
        participanteId,
        acuerdo
      ]
    );

    return NextResponse.json({
      ok: true,
      message:
        'El acuerdo fue guardado correctamente.'
    });

  } catch (error) {
    console.error(
      'Error guardando acuerdo:',
      error
    );

    return NextResponse.json(
      {
        error:
          'No se pudo guardar el acuerdo.'
      },
      { status: 500 }
    );
  }
}