import { BasicForm } from '@/app/components/BasicForm';
export default function ExpectativasPage() {
  return <BasicForm type="expectativa" title="Mis expectativas" description="Cuéntanos qué esperas de este curso." endpoint="/api/expectativas" fieldLabel="¿Cuáles son tus expectativas del curso de Administración de Bases de Datos?" placeholder="Escribe aquí tus expectativas…" />;
}
