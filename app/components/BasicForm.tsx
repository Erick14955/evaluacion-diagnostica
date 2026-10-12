'use client';

import {
  useEffect,
  useState
} from 'react';

import {
  NameField,
  useParticipant
} from './ParticipantForm';

export function BasicForm({
  type,
  title,
  description,
  endpoint,
  fieldLabel,
  placeholder
}: {
  type: 'expectativa' | 'acuerdo';
  title: string;
  description: string;
  endpoint: string;
  fieldLabel: string;
  placeholder: string;
}) {
  const {
    participant,
    loading,
    identify
  } = useParticipant();

  const [nombre, setNombre] =
    useState('');

  const [text, setText] =
    useState('');

  const [status, setStatus] =
    useState<{
      type: 'success' | 'error';
      text: string;
    } | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [checkingResponse, setCheckingResponse] =
    useState(true);

  const [hasExistingResponse, setHasExistingResponse] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  /*
   * =====================================================
   * CONSULTAR RESPUESTA EXISTENTE
   * =====================================================
   */

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!participant) {
      setCheckingResponse(false);
      return;
    }

    /*
     * Creamos una constante para que TypeScript
     * sepa que este participante no es null.
     */
    const currentParticipant =
      participant;

    async function loadExistingResponse() {
      try {
        setCheckingResponse(true);
        setStatus(null);

        const response =
          await fetch(
            `${endpoint}?participante_id=${encodeURIComponent(
              currentParticipant.id
            )}`
          );

        /*
         * Leer la respuesta como texto primero.
         *
         * Esto evita que un endpoint que por algún
         * motivo devuelva una respuesta vacía provoque
         * "Unexpected end of JSON input".
         */
        const responseText =
          await response.text();

        let data: {
          exists?: boolean;
          expectativa?: string | null;
          acuerdo?: string | null;
          error?: string;
        } = {};

        if (responseText.trim()) {
          try {
            data =
              JSON.parse(responseText);
          } catch {
            throw new Error(
              'El servidor devolvió una respuesta no válida.'
            );
          }
        }

        if (!response.ok) {
          throw new Error(
            data.error ||
              'No se pudo consultar la información.'
          );
        }

        /*
         * Determinar qué propiedad corresponde
         * al formulario actual.
         */
        const existingText =
          type === 'expectativa'
            ? data.expectativa
            : data.acuerdo;

        if (
          data.exists &&
          typeof existingText === 'string'
        ) {
          /*
           * Mostrar la respuesta existente.
           */
          setText(existingText);

          /*
           * Bloquear formulario.
           */
          setHasExistingResponse(true);
        } else {
          /*
           * No existe respuesta.
           */
          setText('');
          setHasExistingResponse(false);
        }

      } catch (error) {
        console.error(
          'Error consultando respuesta:',
          error
        );

        setStatus({
          type: 'error',
          text:
            error instanceof Error
              ? error.message
              : 'No se pudo consultar la información.'
        });

      } finally {
        setCheckingResponse(false);
      }
    }

    loadExistingResponse();

  }, [
    participant,
    loading,
    endpoint,
    type
  ]);

  /*
   * =====================================================
   * CARGANDO PARTICIPANTE
   * =====================================================
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
   * =====================================================
   * GUARDAR RESPUESTA
   * =====================================================
   */

  async function submit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    /*
     * Evitar guardar nuevamente si ya existe
     * una respuesta.
     */
    if (hasExistingResponse) {
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const cleanText =
        text.trim();

      /*
       * Validar respuesta.
       */
      if (!cleanText) {
        throw new Error(
          'Completa el campo antes de continuar.'
        );
      }

      /*
       * Obtener participante.
       *
       * Si ya existe usamos ese.
       * Si no existe, lo creamos.
       */
      const currentParticipant =
        participant ??
        await identify(nombre);

      /*
       * Si acabamos de identificar al participante,
       * hacemos una comprobación adicional.
       */
      if (!participant) {

        const checkResponse =
          await fetch(
            `${endpoint}?participante_id=${encodeURIComponent(
              currentParticipant.id
            )}`
          );

        const checkText =
          await checkResponse.text();

        let checkData: {
          exists?: boolean;
          expectativa?: string | null;
          acuerdo?: string | null;
        } = {};

        if (checkText.trim()) {
          try {
            checkData =
              JSON.parse(checkText);
          } catch {
            throw new Error(
              'El servidor devolvió una respuesta no válida.'
            );
          }
        }

        if (
          checkResponse.ok &&
          checkData.exists
        ) {
          const existingText =
            type === 'expectativa'
              ? checkData.expectativa
              : checkData.acuerdo;

          if (
            typeof existingText === 'string'
          ) {
            setText(existingText);
          }

          setHasExistingResponse(true);

          throw new Error(
            'Este participante ya tiene una respuesta registrada.'
          );
        }
      }

      /*
       * =================================================
       * GUARDAR EN LA BASE DE DATOS
       * =================================================
       */

      const response =
        await fetch(
          endpoint,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify({
              participante_id:
                currentParticipant.id,
              texto: cleanText
            })
          }
        );

      const responseText =
        await response.text();

      let data: {
        ok?: boolean;
        error?: string;
        exists?: boolean;
        expectativa?: string | null;
        acuerdo?: string | null;
      } = {};

      if (responseText.trim()) {
        try {
          data =
            JSON.parse(responseText);
        } catch {
          throw new Error(
            'El servidor devolvió una respuesta no válida.'
          );
        }
      }

      if (!response.ok) {

        /*
         * Si el servidor indica que ya existe,
         * cargamos la respuesta existente.
         */
        if (
          response.status === 409 &&
          data.exists
        ) {
          const existingText =
            type === 'expectativa'
              ? data.expectativa
              : data.acuerdo;

          if (
            typeof existingText === 'string'
          ) {
            setText(existingText);
          }

          setHasExistingResponse(true);
        }

        throw new Error(
          data.error ||
            'No se pudo guardar la información.'
        );
      }

      /*
       * =================================================
       * GUARDADO EXITOSO
       * =================================================
       */

      /*
       * Conservamos el texto.
       */
      setText(cleanText);

      /*
       * Bloqueamos el formulario.
       */
      setHasExistingResponse(true);

      /*
       * Mostramos modal.
       */
      setShowModal(true);

    } catch (error) {

      setStatus({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al guardar la información.'
      });

    } finally {
      setSaving(false);
    }
  }

  /*
   * =====================================================
   * CERRAR MODAL
   * =====================================================
   */

  function closeModal() {
    setShowModal(false);
  }

  /*
   * El formulario queda bloqueado mientras
   * se verifica o si ya existe una respuesta.
   */
  const responseLocked =
    hasExistingResponse ||
    checkingResponse;

  return (
    <>
      <main className="container">

        {/* ================================================
            ENCABEZADO
        ================================================= */}

        <section className="hero basic-form-hero">

          <div className="eyebrow">
            Actividad RT-03
          </div>

          <h1>
            {title}
          </h1>

          <p className="lead">
            {description}
          </p>

        </section>

        {/* ================================================
            FORMULARIO
        ================================================= */}

        <form
          className="card form-card basic-form-card"
          onSubmit={submit}
        >

          {/* CABECERA DEL FORMULARIO */}

          <div className="form-intro">

            <div className="form-intro-icon">

              <span>
                {type === 'acuerdo'
                  ? '✓'
                  : '✎'}
              </span>

            </div>

            <div>

              <h2>
                {type === 'acuerdo'
                  ? 'Asume tu compromiso'
                  : 'Comparte tu expectativa'}
              </h2>

              <p>
                {type === 'acuerdo'
                  ? 'Escribe el compromiso que asumirás durante el curso.'
                  : 'Cuéntanos qué esperas aprender o lograr.'}
              </p>

            </div>

          </div>

          {/* CONTENIDO */}

          <div className="form-content">

            {/* PARTICIPANTE */}

            <NameField
              participant={participant}
              value={nombre}
              onChange={setNombre}
            />

            {/* RESPUESTA */}

            <div className="field">

              <label htmlFor="texto">
                {fieldLabel}
              </label>

              <textarea
                id="texto"
                className={`textarea ${
                  hasExistingResponse
                    ? 'textarea-locked'
                    : ''
                }`}
                value={text}
                onChange={(e) =>
                  setText(e.target.value)
                }
                placeholder={
                  checkingResponse
                    ? 'Consultando tu respuesta…'
                    : placeholder
                }
                required
                maxLength={2000}
                disabled={responseLocked}
              />

              <div className="response-info">

                <div className="character-count">
                  {text.length} / 2000
                </div>

                {checkingResponse && (
                  <div className="response-checking-message">
                    <span className="mini-spinner" />
                    Verificando respuesta…
                  </div>
                )}

                {hasExistingResponse && (
                  <div className="response-locked-message">
                    ✓ Respuesta ya registrada
                  </div>
                )}

              </div>

            </div>

          </div>

          {/* BOTÓN */}

          <div className="actions basic-form-actions">

            <button
              type="submit"
              className="btn"
              disabled={
                saving ||
                responseLocked ||
                !text.trim()
              }
            >

              {checkingResponse ? (
                <>
                  <span className="button-spinner" />
                  Verificando…
                </>
              ) : saving ? (
                <>
                  <span className="button-spinner" />
                  Guardando…
                </>
              ) : hasExistingResponse ? (
                <>
                  ✓ Respuesta registrada
                </>
              ) : (
                <>
                  Guardar respuesta

                  <span className="btn-arrow">
                    →
                  </span>
                </>
              )}

            </button>

          </div>

          {/* ERROR */}

          {status && (
            <div
              className="notice error"
              role="alert"
            >

              <span className="notice-icon">
                !
              </span>

              <span>
                {status.text}
              </span>

            </div>
          )}

        </form>

      </main>

      {/* ================================================
          MODAL DE ÉXITO
      ================================================= */}

      {showModal && (
        <div
          className="success-modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div
            className="success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-modal-title"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="success-icon-wrapper">

              <div className="success-icon">

                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >

                  <path
                    d="M5 12.5l4.2 4.2L19 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                </svg>

              </div>

            </div>

            <div className="success-modal-content">

              <div className="success-modal-label">
                ¡Listo!
              </div>

              <h2 id="success-modal-title">
                Respuesta guardada
              </h2>

              <p>
                Tu respuesta fue guardada
                correctamente.
              </p>

              <button
                type="button"
                className="modal-ok-button"
                onClick={closeModal}
                autoFocus
              >
                OK
              </button>

            </div>

          </div>

        </div>
      )}

    </>
  );
}