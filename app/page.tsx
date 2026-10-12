import Link from 'next/link';

const items = [
  { href: '/expectativas', title: 'Expectativas', text: 'Comparte qué esperas obtener o aprender durante la actividad.' },
  { href: '/acuerdos', title: 'Acuerdos', text: 'Registra los compromisos y acuerdos para el desarrollo de la actividad.' },
  { href: '/criterios', title: 'Criterios', text: 'Valora del 1 al 5 tu nivel actual en los cinco criterios del RT-03.' }
];

export default function Home() {
  return (
    <main className="container">
      <section className="hero">
        <div className="eyebrow">Módulo 1 · RT-03</div>
        <h1>Bienvenido/a</h1>
        <p className="lead">Completa las actividades desde tu celular. Tu identificación se guarda en este dispositivo para que no tengas que volver a escribir tu nombre en cada formulario.</p>
      </section>
      <section className="grid" aria-label="Formularios">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="card card-link">
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <strong>Entrar →</strong>
          </Link>
        ))}
      </section>
    </main>
  );
}
