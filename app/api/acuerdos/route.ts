import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const participanteId =
      request.nextUrl.searchParams.get('participante_id');

    const presentacion =
      request.nextUrl.searchParams.get('presentacion');

    // ============================================
    // PRESENTACIÓN EN VIVO
    // ============================================
    if (presentacion === 'true') {
      const result = await pool.query(`
        SELECT
          a."Acuerdos_Id" AS id,
          a."Participante_Id" AS participante_id,
          a."Acuerdos" AS acuerdo,
          p."Nombre" AS nombre
        FROM "Acuerdos_Compromisos" a
        LEFT JOIN "Participantes" p
          ON p."id" = a."Participante_Id"
        ORDER BY a."Acuerdos_Id" DESC
      `);

      return NextResponse.json(
        {
          success: true,
          data: result.rows
        },
        {
          headers: {
            'Cache-Control':
              'no-store, no-cache, must-revalidate'
          }
        }
      );
    }

    // ============================================
    // CONSULTA INDIVIDUAL DEL PARTICIPANTE
    // ============================================
    if (
      !participanteId ||
      participanteId.trim() === ''
    ) {
      return NextResponse.json(
        {
          error:
            'Participante inválido.'
        },
        { status: 400 }
      );
    }

    const result =
      await pool.query(
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

    if (result.rows.length === 0) {
      return NextResponse.json({
        exists: false,
        acuerdo: null
      });
    }

    return NextResponse.json({
      exists: true,
      acuerdo:
        result.rows[0].acuerdo
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

export async function POST(request: NextRequest) {
  try {
    const body =
      await request.json();

    const participanteId =
      body.participante_id;

    const acuerdo =
      String(
        body.texto ?? ''
      ).trim();

    // ============================================
    // VALIDAR PARTICIPANTE
    // ============================================
    if (
      typeof participanteId !== 'string' ||
      participanteId.trim() === ''
    ) {
      return NextResponse.json(
        {
          error:
            'Participante inválido.'
        },
        { status: 400 }
      );
    }

    // ============================================
    // VALIDAR ACUERDO
    // ============================================
    if (!acuerdo) {
      return NextResponse.json(
        {
          error:
            'Completa el campo antes de continuar.'
        },
        { status: 400 }
      );
    }

    // ============================================
    // EVITAR DUPLICADOS
    // ============================================
    const existing =
      await pool.query(
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

    // ============================================
    // GUARDAR ACUERDO
    // ============================================
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