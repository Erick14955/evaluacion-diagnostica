import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

type ParticipanteRow = {
  id: string;
  nombre: string;
  comunidad: number;
};

type Comunidad = {
  numero: number;
  cantidad: number;
  integrantes: {
    id: string;
    nombre: string;
  }[];
};

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        "id" AS id,
        "Nombre" AS nombre,
        "Comunidad" AS comunidad
      FROM "Participantes"
      WHERE "Comunidad" IS NOT NULL
      ORDER BY
        "Comunidad" ASC,
        "Nombre" ASC
    `);

    const participantes =
      result.rows as ParticipanteRow[];

    /*
     * Agrupar participantes
     * por número de comunidad.
     */
    const mapaComunidades =
      new Map<number, Comunidad>();

    for (const participante of participantes) {
      const numero =
        Number(participante.comunidad);

      if (!mapaComunidades.has(numero)) {
        mapaComunidades.set(numero, {
          numero,
          cantidad: 0,
          integrantes: []
        });
      }

      const comunidad =
        mapaComunidades.get(numero)!;

      comunidad.integrantes.push({
        id: participante.id,
        nombre: participante.nombre
      });

      comunidad.cantidad =
        comunidad.integrantes.length;
    }

    const comunidades =
      Array.from(
        mapaComunidades.values()
      ).sort(
        (a, b) =>
          a.numero - b.numero
      );

    return NextResponse.json(
      {
        success: true,

        total_comunidades:
          comunidades.length,

        total_participantes:
          participantes.length,

        comunidades
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
      'Error obteniendo comunidades:',
      error
    );

    return NextResponse.json(
      {
        error:
          'No se pudieron cargar las comunidades.',

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