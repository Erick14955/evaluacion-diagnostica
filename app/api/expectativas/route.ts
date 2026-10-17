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
          e."Expectativa_Id" AS id,
          e."Participante_Id" AS participante_id,
          e."Expectativa" AS expectativa,
          p."Nombre" AS nombre
        FROM "Expectativas" e
        LEFT JOIN "Participantes" p
          ON p."id" = e."Participante_Id"
        ORDER BY e."Expectativa_Id" DESC
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

    // ============================================
    // VALIDAR PARTICIPANTE
    // ============================================
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

    // ============================================
    // VALIDAR EXPECTATIVA
    // ============================================
    const expectativa =
      String(texto ?? '').trim();

    if (!expectativa) {
      return NextResponse.json(
        {
          error:
            'Completa todos los campos.'
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
            "Expectativa_Id"
          FROM "Expectativas"
          WHERE "Participante_Id" = $1
          LIMIT 1
        `,
        [participante_id]
      );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        {
          error:
            'Este participante ya tiene una expectativa registrada.'
        },
        { status: 409 }
      );
    }

    // ============================================
    // GUARDAR EXPECTATIVA
    // ============================================
    await pool.query(
      `
        INSERT INTO "Expectativas"
        (
          "Participante_Id",
          "Expectativa"
        )
        VALUES
        (
          $1,
          $2
        )
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
