import { BasicForm } from '@/app/components/BasicForm';

export default function AcuerdosPage() {
  return (
    <BasicForm
      type="acuerdo"
      title="Mis acuerdos y compromisos"
      description="Registra el compromiso o acuerdo que asumirás durante el curso."
      endpoint="/api/acuerdos"
      fieldLabel="¿Cuál es el acuerdo o compromiso que asumirás durante el curso?"
      placeholder="Escribe aquí tu acuerdo o compromiso…"
    />
  );
}