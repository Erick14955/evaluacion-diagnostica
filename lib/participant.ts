import { randomUUID } from 'crypto';
import { pool } from '@/lib/db';

type Participant = {
  id: string;
  nombre: string;
  comunidad: number | null;
};

export async function ensureParticipant(
  id: string | undefined,
  nombre: string
): Promise<Participant> {
  const cleanName =
    String(nombre ?? '').trim();

  if (!cleanName && !id) {
    throw new Error(
      'El nombre es obligatorio.'
    );
  }

  if (id) {
    const existing = await pool.query(
      `
        SELECT
          "id" AS id,
          "Nombre" AS nombre,
          "Comunidad" AS comunidad
        FROM "Participantes"
        WHERE "id" = $1
        LIMIT 1
      `,
      [id]
    );

    if ((existing.rowCount ?? 0) > 0) {
      return existing.rows[0] as Participant;
    }
  }

  if (!cleanName) {
    throw new Error(
      'El nombre es obligatorio.'
    );
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `
        SELECT pg_advisory_xact_lock(20261012)
      `
    );

    const countsResult = await client.query(
      `
        SELECT
          "Comunidad" AS comunidad,
          COUNT(*)::int AS cantidad
        FROM "Participantes"
        WHERE "Comunidad" BETWEEN 1 AND 4
        GROUP BY "Comunidad"
      `
    );

    const counts: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0
    };

    for (const row of countsResult.rows) {
      const comunidad =
        Number(row.comunidad);

      const cantidad =
        Number(row.cantidad);

      if (
        comunidad >= 1 &&
        comunidad <= 4
      ) {
        counts[comunidad] = cantidad;
      }
    }

    const minimum = Math.min(
      counts[1],
      counts[2],
      counts[3],
      counts[4]
    );

    const availableCommunities =
      [1, 2, 3, 4].filter(
        (community) =>
          counts[community] === minimum
      );

    let selectedCommunity: number;

    if (minimum === 0) {
      selectedCommunity =
        availableCommunities[0];
    }

    else {
      const randomIndex =
        Math.floor(
          Math.random() *
            availableCommunities.length
        );

      selectedCommunity =
        availableCommunities[randomIndex];
    }

    const newId = randomUUID();

    const created = await client.query(
      `
        INSERT INTO "Participantes"
        (
          "id",
          "Nombre",
          "Comunidad"
        )
        VALUES
        ($1, $2, $3)
        RETURNING
          "id" AS id,
          "Nombre" AS nombre,
          "Comunidad" AS comunidad
      `,
      [
        newId,
        cleanName,
        selectedCommunity
      ]
    );

    await client.query('COMMIT');

    return created.rows[0] as Participant;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;

  } finally {
    client.release();
  }
}