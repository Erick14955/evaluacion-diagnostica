import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        c."Criterio_Id" AS id,
        c."Criterio" AS criterio,

        COUNT(r."Respuesta_Id")::int AS total_respuestas,

        COUNT(r."Respuesta_Id")
          FILTER (
            WHERE e."Valor" >= 3
          )::int AS cumple,

        COUNT(r."Respuesta_Id")
          FILTER (
            WHERE e."Valor" <= 2
          )::int AS no_cumple

      FROM "Criterios" c

      LEFT JOIN "Respuestas" r
        ON r."Criterio_Id" = c."Criterio_Id"

      LEFT JOIN "Escala" e
        ON e."Escala_Id" = r."Escala_Id"

      GROUP BY
        c."Criterio_Id",
        c."Criterio"

      ORDER BY
        c."Criterio_Id"
    `);

    const criterios = result.rows.map(row => {
      const total = Number(
        row.total_respuestas
      );

      const cumple = Number(
        row.cumple
      );

      const noCumple = Number(
        row.no_cumple
      );

      const porcentajeCumple =
        total > 0
          ? Math.round(
              (cumple / total) * 100
            )
          : 0;

      const porcentajeNoCumple =
        total > 0
          ? Math.round(
              (noCumple / total) * 100
            )
          : 0;

      return {
        id: row.id,
        criterio: row.criterio,

        total_respuestas: total,

        cumple: cumple,
        no_cumple: noCumple,

        porcentaje_cumple:
          porcentajeCumple,

        porcentaje_no_cumple:
          porcentajeNoCumple
      };
    });

    /*
     * Participantes distintos que
     * han respondido al menos
     * un criterio.
     */
    const participantesResult =
      await pool.query(`
        SELECT
          COUNT(
            DISTINCT "Participante_Id"
          )::int AS total
        FROM "Respuestas"
      `);

    const totalParticipantes =
      Number(
        participantesResult.rows[0]
          ?.total ?? 0
      );

    return NextResponse.json(
      {
        success: true,
        total_participantes:
          totalParticipantes,
        criterios
      },
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate'
        }
      }
    );
  } catch (error) {
    console.error(
      'Error obteniendo lista de cotejo:',
      error
    );

    return NextResponse.json(
      {
        error:
          'No se pudo cargar la lista de cotejo.',
        details:
          process.env.NODE_ENV ===
          'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined
      },
      {
        status: 500
      }
    );
  }
}