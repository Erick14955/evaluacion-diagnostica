import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const [criteriaResult, scaleResult] = await Promise.all([
      pool.query(`
        SELECT
          "Criterio_Id" AS id,
          "Criterio" AS criterio
        FROM "Criterios"
        ORDER BY "Criterio_Id"
      `),

      pool.query(`
        SELECT
          "Escala_Id" AS id,
          "Valor" AS valor,
          "Descripcion" AS descripcion
        FROM "Escala"
        ORDER BY "Valor"
      `)
    ]);

    return NextResponse.json({
      criteria: criteriaResult.rows,
      scale: scaleResult.rows
    });
  } catch (error) {
    console.error('Error obteniendo criterios:', error);

    return NextResponse.json(
      {
        error: 'No se pudieron cargar los criterios.',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let client;

  try {
    client = await pool.connect();

    const body = await request.json();

    const participante_id = body.participante_id;
    const respuestas = body.respuestas;

    /*
     * Validar participante.
     * Los IDs de tu base de datos son UUID.
     */
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

    /*
     * Validar respuestas.
     */
    if (
      !respuestas ||
      typeof respuestas !== 'object' ||
      Array.isArray(respuestas)
    ) {
      return NextResponse.json(
        {
          error: 'No se recibieron las respuestas.'
        },
        { status: 400 }
      );
    }

    /*
     * Obtener todos los criterios.
     */
    const criteriaResult = await client.query(`
      SELECT
        "Criterio_Id" AS id
      FROM "Criterios"
      ORDER BY "Criterio_Id"
    `);

    const criteriaIds = criteriaResult.rows.map(
      (row: { id: string }) => row.id
    );

    if (criteriaIds.length === 0) {
      return NextResponse.json(
        {
          error:
            'No existen criterios configurados en la base de datos.'
        },
        { status: 500 }
      );
    }

    /*
     * Verificar que cada criterio tenga
     * una valoración entre 1 y 5.
     */
    for (const criterioId of criteriaIds) {
      const value = Number(respuestas[criterioId]);

      if (
        !Number.isInteger(value) ||
        value < 1 ||
        value > 5
      ) {
        return NextResponse.json(
          {
            error:
              'Debes seleccionar una valoración del 1 al 5 para cada criterio.'
          },
          { status: 400 }
        );
      }
    }

    await client.query('BEGIN');

    /*
     * Guardar cada respuesta.
     */
    for (const criterioId of criteriaIds) {
      const valor = Number(respuestas[criterioId]);

      /*
       * Buscar el UUID de la escala
       * correspondiente al valor seleccionado.
       */
      const scaleResult = await client.query(
        `
          SELECT
            "Escala_Id" AS id
          FROM "Escala"
          WHERE "Valor" = $1
          LIMIT 1
        `,
        [valor]
      );

      if (scaleResult.rows.length === 0) {
        throw new Error(
          `No existe una escala configurada para el valor ${valor}.`
        );
      }

      const escalaId = scaleResult.rows[0].id;

      /*
       * Insertar la respuesta.
       */
      await client.query(
        `
          INSERT INTO "Respuestas"
          (
            "Participante_Id",
            "Criterio_Id",
            "Escala_Id"
          )
          VALUES
          ($1, $2, $3)
        `,
        [
          participante_id,
          criterioId,
          escalaId
        ]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      ok: true,
      message:
        'Las respuestas fueron guardadas correctamente.'
    });
  } catch (error) {
    console.error(
      'Error guardando criterios:',
      error
    );

    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error(
          'Error haciendo ROLLBACK:',
          rollbackError
        );
      }
    }

    return NextResponse.json(
      {
        error:
          'No se pudieron guardar las respuestas.',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}