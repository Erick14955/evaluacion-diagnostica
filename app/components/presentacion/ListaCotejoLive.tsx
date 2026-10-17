'use client';

import {
  useCallback,
  useEffect,
  useState
} from 'react';

import './lista-cotejo.css';

type CriterioResultado = {
  id: string;
  criterio: string;

  total_respuestas: number;

  cumple: number;
  no_cumple: number;

  porcentaje_cumple: number;
  porcentaje_no_cumple: number;
};

type ApiResponse = {
  success: boolean;
  total_participantes: number;
  criterios: CriterioResultado[];
};

export default function ListaCotejoLive() {
  const [criterios, setCriterios] =
    useState<CriterioResultado[]>([]);

  const [
    totalParticipantes,
    setTotalParticipantes
  ] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  const cargarDatos =
    useCallback(async () => {
      try {
        const response = await fetch(
          '/api/presentacion/lista-cotejo',
          {
            cache: 'no-store'
          }
        );

        if (!response.ok) {
          throw new Error(
            'Error consultando la lista de cotejo.'
          );
        }

        const resultado: ApiResponse =
          await response.json();

        setCriterios(
          Array.isArray(resultado.criterios)
            ? resultado.criterios
            : []
        );

        setTotalParticipantes(
          resultado.total_participantes ?? 0
        );

        setError(false);
      } catch (error) {
        console.error(
          'Error cargando lista de cotejo:',
          error
        );

        setError(true);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    cargarDatos();

    const intervalo =
      setInterval(
        cargarDatos,
        2000
      );

    return () => {
      clearInterval(intervalo);
    };
  }, [cargarDatos]);

  return (
    <main className="cotejo-live">

      <header className="cotejo-header">

        <div>
          <span className="cotejo-label">
            EVALUACIÓN DEL MÓDULO
          </span>

          <h1>
            Lista de cotejo:
            Evaluación del Módulo No. 1
          </h1>

          <p>
            Resultados obtenidos a partir
            de las valoraciones realizadas
            por los participantes.
          </p>
        </div>

        <div className="cotejo-live-status">
          <span className="cotejo-live-dot" />
          EN VIVO
        </div>

      </header>

      <section className="cotejo-summary">

        <div>
          <span>Participantes</span>

          <strong>
            {totalParticipantes}
          </strong>
        </div>

        <div className="cotejo-regla">
          <span>
            Criterio de evaluación
          </span>

          <strong>
            3 – 5 = Cumple
          </strong>

          <strong>
            1 – 2 = No cumple
          </strong>
        </div>

      </section>

      {loading ? (

        <div className="cotejo-state">
          <div className="cotejo-loader" />

          <h2>
            Cargando resultados...
          </h2>
        </div>

      ) : error ? (

        <div className="cotejo-state">
          <div className="cotejo-state-icon">
            ⚠️
          </div>

          <h2>
            No se pudieron cargar
            los resultados
          </h2>

          <p>
            Verifica la conexión
            con el servidor.
          </p>
        </div>

      ) : criterios.length === 0 ? (

        <div className="cotejo-state">
          <div className="cotejo-state-icon">
            📋
          </div>

          <h2>
            No hay criterios disponibles
          </h2>
        </div>

      ) : (

        <section className="cotejo-table-wrapper">

          <table className="cotejo-table">

            <thead>
              <tr>
                <th>
                  Criterios
                </th>

                <th className="resultado-col">
                  Cumple
                </th>

                <th className="resultado-col">
                  No cumple
                </th>
              </tr>
            </thead>

            <tbody>

              {criterios.map(
                (criterio) => (

                  <tr key={criterio.id}>

                    <td className="criterio-cell">

                      <div className="criterio-content">
                        {criterio.criterio}
                      </div>

                      <div className="criterio-respuestas">
                        {
                          criterio.total_respuestas
                        }{' '}
                        {
                          criterio.total_respuestas ===
                          1
                            ? 'respuesta'
                            : 'respuestas'
                        }
                      </div>

                    </td>

                    <td className="resultado-cell">

                      <div className="resultado cumple">

                        <strong>
                          {
                            criterio
                              .porcentaje_cumple
                          }%
                        </strong>

                        <span>
                          {criterio.cumple} de{' '}
                          {
                            criterio
                              .total_respuestas
                          }
                        </span>

                      </div>

                    </td>

                    <td className="resultado-cell">

                      <div className="resultado no-cumple">

                        <strong>
                          {
                            criterio
                              .porcentaje_no_cumple
                          }%
                        </strong>

                        <span>
                          {
                            criterio.no_cumple
                          } de{' '}
                          {
                            criterio
                              .total_respuestas
                          }
                        </span>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </section>

      )}

      <footer className="cotejo-footer">

        <span>
          Los resultados se actualizan
          automáticamente.
        </span>

        <span>
          Escala 3, 4 y 5 = Cumple
          · Escala 1 y 2 = No cumple
        </span>

      </footer>

    </main>
  );
}