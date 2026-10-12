-- Esquema para la actividad RT-03.
-- No se almacenan fechas porque la evaluación se realizará una sola vez por participante.

create extension if not exists pgcrypto;

create table if not exists participantes (
  id uuid primary key default gen_random_uuid(),
  nombre varchar(150) not null
);

create table if not exists criterios (
  id integer primary key,
  criterio text not null
);

create table if not exists escala (
  id integer primary key,
  valor integer not null unique check (valor between 1 and 5),
  descripcion varchar(120) not null
);

create table if not exists expectativas (
  participante_id uuid primary key references participantes(id) on delete cascade,
  expectativa text not null
);

create table if not exists acuerdos (
  participante_id uuid primary key references participantes(id) on delete cascade,
  acuerdo text not null
);

create table if not exists respuestas_criterios (
  participante_id uuid not null references participantes(id) on delete cascade,
  criterio_id integer not null references criterios(id),
  escala_id integer not null references escala(id),
  primary key (participante_id, criterio_id)
);

insert into criterios (id, criterio) values
  (1, 'Comprendo qué es una base de datos y para qué se utiliza.'),
  (2, 'Comprendo qué es una clave primaria y cuáles son sus características.'),
  (3, 'Puedo identificar qué campo puede funcionar como clave primaria en una tabla.'),
  (4, 'Puedo diferenciar un campo con valores únicos de uno que puede contener valores repetidos.'),
  (5, 'Puedo justificar por qué un campo es adecuado o no para utilizarse como clave primaria.')
on conflict (id) do update set criterio = excluded.criterio;

insert into escala (id, valor, descripcion) values
  (1, 1, 'No tengo conocimiento'),
  (2, 2, 'Tengo poco conocimiento'),
  (3, 3, 'Tengo conocimiento básico'),
  (4, 4, 'Tengo buen dominio'),
  (5, 5, 'Lo domino completamente')
on conflict (id) do update set valor = excluded.valor, descripcion = excluded.descripcion;
