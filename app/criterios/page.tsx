'use client';

import { useEffect, useState } from 'react';
import {
  NameField,
  useParticipant
} from '@/app/components/ParticipantForm';

type Criterion = {
  id: string;
  criterio: string;
};

type Scale = {
  id: string;
  valor: number;
  descripcion: string;
};

type Status = {
  type: 'success' | 'error';
  text: string;
};

export default function CriteriosPage() {
  const {
    participant,
    loading,
    identify
  } = useParticipant();

  const [nombre, setNombre] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [scale, setScale] = useState<Scale[]>([]);
  const [answers, setAnswers] =
    useState<Record<string, number>>({});

  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] =
    useState(true);

  const [status, setStatus] =
    useState<Status | null>(null);

  /*
   * Cargar criterios y escala
   */
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingData(true);
        setStatus(null);

        const response = await fetch(
          '/api/criterios'
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'No se pudieron cargar los criterios.'
          );
        }

        setCriteria(
          Array.isArray(data.criteria)
            ? data.criteria
            : []
        );

        setScale(
          Array.isArray(data.scale)
            ? data.scale
            : []
        );
      } catch (error) {
        console.error(
          'Error cargando criterios:',
          error
        );

        setStatus({
          type: 'error',
          text:
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar los criterios.'
        });
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  /*
   * Cargando participante
   */
  if (loading) {
    return (
      <main className="container">
        <div className="loading">
          Cargando…
        </div>
      </main>
    );
  }

  /*
   * Cargando información
   */
  if (loadingData) {
    return (
      <main className="container">
        <div className="loading">
          Cargando criterios…
        </div>
      </main>
    );
  }

  /*
   * Guardar respuestas
   */
  async function submit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSaving(true);
    setStatus(null);

    try {
      /*
       * Comprobar que todos los criterios
       * tengan una respuesta.
       */
      const unanswered = criteria.some(
        criterion =>
          !answers[criterion.id]
      );

      if (unanswered) {
        throw new Error(
          'Selecciona una valoración para cada criterio antes de continuar.'
        );
      }

      /*
       * Obtener o crear participante
       */
      const p =
        participant ??
        await identify(nombre);

      if (!p || !p.id) {
        throw new Error(
          'No se pudo identificar al participante.'
        );
      }

      /*
       * Enviar respuestas
       */
      const response = await fetch(
        '/api/criterios',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body: JSON.stringify({
            participante_id: p.id,
            respuestas: answers
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'No se pudieron guardar las respuestas.'
        );
      }

      setStatus({
        type: 'success',
        text:
          '¡Tus respuestas fueron guardadas correctamente!'
      });
    } catch (error) {
      console.error(
        'Error guardando respuestas:',
        error
      );

      setStatus({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al guardar las respuestas.'
      });
    } finally {
      setSaving(false);
    }
  }

  /*
   * Cantidad de preguntas respondidas
   */
  const answeredCount =
    Object.keys(answers).length;

  return (
    <main className="container criterios-page">

      {/* Encabezado */}
      <section className="hero criterios-hero">

        <div className="eyebrow">
          Diagnóstico inicial
        </div>

        <h1>
          ¿Qué tanto sabes sobre este tema?
        </h1>

        <p className="lead">
          Selecciona la opción que mejor
          represente tu nivel actual de
          conocimiento. No es una
          calificación.
        </p>

        {/* Progreso */}
        {criteria.length > 0 && (
          <div className="progress-area">

            <div className="progress-info">
              <span>
                Progreso
              </span>

              <strong>
                {answeredCount} de{' '}
                {criteria.length}
              </strong>
            </div>

            <div className="progress">
              {criteria.map(
                criterion => (
                  <span
                    key={criterion.id}
                    className={
                      answers[
                        criterion.id
                      ]
                        ? 'done'
                        : ''
                    }
                  />
                )
              )}
            </div>

          </div>
        )}

      </section>

      {/* Formulario */}
      <form
        className="card form-card criterios-form"
        onSubmit={submit}
      >

        {/* Participante */}
        <div className="participant-section">

          <div className="section-label">
            Participante
          </div>

          <NameField
            participant={participant}
            value={nombre}
            onChange={setNombre}
          />

        </div>

        {/* Preguntas */}
        <div className="criteria">

          {criteria.map(
            (criterion, index) => (

              <fieldset
                className="criterion"
                key={criterion.id}
              >

                {/* Número de pregunta */}
                <div className="criterion-number">
                  Pregunta {index + 1}
                </div>

                {/* Pregunta */}
                <legend className="criterion-text">
                  {criterion.criterio}
                </legend>

                {/* Opciones */}
                <div className="scale">

                  {scale.map(
                    option => {

                      const inputId =
                        `criterio-${criterion.id}-escala-${option.id}`;

                      const selected =
                        answers[
                          criterion.id
                        ] === option.valor;

                      return (
                        <div
                          className={
                            `scale-option ${
                              selected
                                ? 'selected'
                                : ''
                            }`
                          }
                          key={option.id}
                        >

                          <input
                            id={inputId}
                            type="radio"
                            name={
                              `criterio-${criterion.id}`
                            }
                            value={
                              option.valor
                            }
                            checked={
                              selected
                            }
                            onChange={() =>
                              setAnswers(
                                previous => ({
                                  ...previous,
                                  [criterion.id]:
                                    option.valor
                                })
                              )
                            }
                          />

                          <label
                            htmlFor={inputId}
                          >

                            <span className="scale-number">
                              {option.valor}
                            </span>

                            <span className="scale-description">
                              {option.descripcion}
                            </span>

                          </label>

                        </div>
                      );
                    }
                  )}

                </div>

                {/* Ayuda */}
                <div className="scale-help">
                  Selecciona una sola opción
                </div>

              </fieldset>
            )
          )}

        </div>

        {/* Botón */}
        <div className="actions">

          <button
            type="submit"
            className="btn"
            disabled={
              saving ||
              criteria.length === 0 ||
              scale.length === 0
            }
          >
            {saving
              ? 'Guardando…'
              : 'Guardar respuestas'}
          </button>

        </div>

        {/* Mensaje */}
        {status && (
          <div
            className={
              `notice ${status.type}`
            }
            role="alert"
          >
            {status.text}
          </div>
        )}

      </form>

    </main>
  );
}