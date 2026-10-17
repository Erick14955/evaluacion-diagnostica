"use client";

import {
  useCallback,
  useEffect,
  useState
} from "react";

import "./presentacion.css";

type Expectativa = {
  id: string | number;
  participante_id: string;
  expectativa: string;
  nombre: string | null;
};

export default function ExpectativasLive() {
  const [datos, setDatos] =
    useState<Expectativa[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  const cargarDatos =
    useCallback(async () => {
      try {
        const response =
          await fetch(
            "/api/expectativas?presentacion=true",
            {
              cache: "no-store"
            }
          );

        if (!response.ok) {
          throw new Error(
            "Error consultando expectativas"
          );
        }

        const resultado =
          await response.json();

        setDatos(
          resultado.data || []
        );

        setError(false);

      } catch (error) {
        console.error(
          "Error cargando expectativas:",
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
      clearInterval(
        intervalo
      );
    };
  }, [cargarDatos]);

  return (
    <main className="presentacion-live">

      <header className="presentacion-header">

        <div>

          <span className="presentacion-label">
            ADMINISTRACIÓN DE BASES DE DATOS
          </span>

          <h1>
            Expectativas de los participantes
          </h1>

          <p>
            Conozcamos qué esperan aprender
            durante este curso.
          </p>

        </div>

      </header>

      <div className="presentacion-info">

        <span>
          {datos.length}{" "}
          {datos.length === 1
            ? "respuesta"
            : "respuestas"}
        </span>

      </div>

      {loading ? (

        <div className="presentacion-state">

          <div className="loader" />

          <h2>
            Cargando expectativas...
          </h2>

        </div>

      ) : error ? (

        <div className="presentacion-state">

          <div className="state-icon">
            ⚠️
          </div>

          <h2>
            No se pudieron cargar
            los datos
          </h2>

          <p>
            Verifica la conexión
            con el servidor.
          </p>

        </div>

      ) : datos.length === 0 ? (

        <div className="presentacion-state">

          <div className="state-icon">
            💬
          </div>

          <h2>
            Aún no hay expectativas
          </h2>

        </div>

      ) : (

        <section className="presentacion-grid">

          {datos.map((item) => (

            <article
              className="presentacion-card"
              key={item.id}
            >

              <div className="card-header">

                <div className="avatar">

                  {item.nombre
                    ?.charAt(0)
                    .toUpperCase() ||
                    "?"}

                </div>

                <div>

                  <span className="card-label">
                    PARTICIPANTE
                  </span>

                  <h2>
                    {item.nombre ||
                      "Participante"}
                  </h2>

                </div>

              </div>

              <div className="card-body">

                <span className="quote">
                  “
                </span>

                <p>
                  {item.expectativa}
                </p>

              </div>

            </article>

          ))}

        </section>

      )}

    </main>
  );
}