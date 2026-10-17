'use client';

import {
  useCallback,
  useEffect,
  useState
} from 'react';

import './comunidades.css';

type Integrante = {
  id: string;
  nombre: string;
};

type Comunidad = {
  numero: number;
  cantidad: number;
  integrantes: Integrante[];
};

type ApiResponse = {
  success: boolean;
  total_comunidades: number;
  total_participantes: number;
  comunidades: Comunidad[];
};

export default function ComunidadesLive() {
  const [comunidades, setComunidades] =
    useState<Comunidad[]>([]);

  const [
    totalParticipantes,
    setTotalParticipantes
  ] = useState(0);

  const [
    totalComunidades,
    setTotalComunidades
  ] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  const cargarDatos =
    useCallback(async () => {
      try {
        const response = await fetch(
          '/api/presentacion/comunidades',
          {
            cache: 'no-store'
          }
        );

        if (!response.ok) {
          throw new Error(
            'Error consultando las comunidades.'
          );
        }

        const resultado: ApiResponse =
          await response.json();

        setComunidades(
          Array.isArray(
            resultado.comunidades
          )
            ? resultado.comunidades
            : []
        );

        setTotalParticipantes(
          resultado.total_participantes ?? 0
        );

        setTotalComunidades(
          resultado.total_comunidades ?? 0
        );

        setError(false);
      } catch (error) {
        console.error(
          'Error cargando comunidades:',
          error
        );

        setError(true);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    cargarDatos();

    /*
     * Actualizar automáticamente
     * cada 2 segundos.
     */
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
    <main className="comunidades-live">

      {/* Encabezado */}
      <header className="comunidades-header">

        <div>
          <span className="comunidades-label">
            TRABAJO COLABORATIVO
          </span>

          <h1>
            Comunidades de aprendizaje
          </h1>

          <p>
            Conoce tu comunidad y los
            compañeros que trabajarán
            contigo durante la actividad.
          </p>
        </div>

        <div className="comunidades-live-status">
          <span className="comunidades-live-dot" />
          EN VIVO
        </div>

      </header>

      {/* Información general */}
      <section className="comunidades-summary">

        <div className="summary-item">
          <span>
            Comunidades
          </span>

          <strong>
            {totalComunidades}
          </strong>
        </div>

        <div className="summary-divider" />

        <div className="summary-item">
          <span>
            Participantes asignados
          </span>

          <strong>
            {totalParticipantes}
          </strong>
        </div>

        <div className="summary-update">
          Actualización automática
        </div>

      </section>

      {/* Cargando */}
      {loading ? (

        <section className="comunidades-state">

          <div className="comunidades-loader" />

          <h2>
            Cargando comunidades...
          </h2>

        </section>

      ) : error ? (

        /* Error */
        <section className="comunidades-state">

          <div className="comunidades-state-icon">
            ⚠️
          </div>

          <h2>
            No se pudieron cargar
            las comunidades
          </h2>

          <p>
            Verifica la conexión
            con el servidor.
          </p>

        </section>

      ) : comunidades.length === 0 ? (

        /* Sin participantes */
        <section className="comunidades-state">

          <div className="comunidades-state-icon">
            👥
          </div>

          <h2>
            Esperando participantes
          </h2>

          <p>
            Las comunidades aparecerán
            aquí automáticamente.
          </p>

        </section>

      ) : (

        /* Cards */
        <section className="comunidades-grid">

          {comunidades.map(
            comunidad => (

              <article
                className="comunidad-card"
                key={comunidad.numero}
              >

                {/* Cabecera card */}
                <div className="comunidad-card-header">

                  <div className="comunidad-numero">
                    {comunidad.numero}
                  </div>

                  <div className="comunidad-title">

                    <span>
                      COMUNIDAD
                    </span>

                    <h2>
                      Comunidad{' '}
                      {comunidad.numero}
                    </h2>

                  </div>

                  <div className="comunidad-count">

                    <strong>
                      {comunidad.cantidad}
                    </strong>

                    <span>
                      {comunidad.cantidad === 1
                        ? 'integrante'
                        : 'integrantes'}
                    </span>

                  </div>

                </div>

                {/* Integrantes */}
                <div className="integrantes-list">

                  {comunidad.integrantes.map(
                    (integrante, index) => (

                      <div
                        className="integrante"
                        key={integrante.id}
                      >

                        <div className="integrante-avatar">
                          {integrante.nombre
                            ?.charAt(0)
                            .toUpperCase() ||
                            '?'}
                        </div>

                        <div className="integrante-info">

                          <span>
                            Integrante{' '}
                            {index + 1}
                          </span>

                          <strong>
                            {integrante.nombre}
                          </strong>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </article>

            )
          )}

        </section>

      )}

      <footer className="comunidades-footer">

        <span>
          Las comunidades se actualizan
          automáticamente cuando ingresan
          nuevos participantes.
        </span>

        <span className="footer-live">
          <span className="footer-dot" />
          Datos en tiempo real
        </span>

      </footer>

    </main>
  );
}