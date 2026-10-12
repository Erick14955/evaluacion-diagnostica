'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'rt03_participante_id';

type Participant = {
  id: string;
  nombre: string;
  comunidad: number | null;
};

export function useParticipant() {
  const [participant, setParticipant] =
    useState<Participant | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const id =
      window.localStorage.getItem(STORAGE_KEY);

    if (!id) {
      setLoading(false);
      return;
    }

    fetch(
      `/api/participant?id=${encodeURIComponent(id)}`
    )
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('ID no válido');
        }

        return res.json();
      })
      .then((data) => {
        setParticipant(data.participant);
      })
      .catch(() => {
        window.localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function identify(nombre: string) {
    const res = await fetch('/api/participant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nombre })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error ||
          'No se pudo guardar el participante.'
      );
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      data.participant.id
    );

    setParticipant(data.participant);

    return data.participant as Participant;
  }

  return {
    participant,
    loading,
    identify
  };
}

export function NameField({
  participant,
  value,
  onChange
}: {
  participant: Participant | null;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label htmlFor="nombre">
        Nombre completo
      </label>

      <input
        id="nombre"
        className="input"
        type="text"
        value={participant?.nombre ?? value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        disabled={!!participant}
        placeholder="Escribe tu nombre completo"
        autoComplete="name"
        required
      />

      {participant && (
        <div className="scale-help">
          Tu nombre ya está identificado en este
          dispositivo y no puede editarse.
        </div>
      )}
    </div>
  );
}

export { STORAGE_KEY };