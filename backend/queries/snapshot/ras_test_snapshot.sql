--
-- PostgreSQL database dump
--

\restrict fq92XN4aQGJcWJfFPHBCfflCjft7XhWVIlXvSsgU78urAb5gMibp8fOeeSC1Rnz

-- Dumped from database version 18.6 (Debian 18.6-1.pgdg13+2)
-- Dumped by pg_dump version 18.6 (Debian 18.6-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: actualizar_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id bigint NOT NULL,
    empresa character varying(255) NOT NULL,
    nombre_normalizado character varying(255) NOT NULL,
    cif character varying(30),
    direccion character varying(255),
    codigo_postal character varying(20),
    ciudad character varying(120),
    pais_id bigint NOT NULL,
    comercial_id bigint,
    fecha_alta date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    estado_id bigint NOT NULL,
    CONSTRAINT chk_clientes_empresa_not_empty CHECK ((length(TRIM(BOTH FROM empresa)) > 0))
);


--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.clientes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.clientes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: comerciales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comerciales (
    id bigint NOT NULL,
    nombre character varying(150) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: comerciales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.comerciales ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.comerciales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: contactos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contactos (
    id bigint NOT NULL,
    cliente_id bigint NOT NULL,
    nombre character varying(150) NOT NULL,
    email character varying(254),
    telefono character varying(30),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_contactos_nombre_not_empty CHECK ((length(TRIM(BOTH FROM nombre)) > 0))
);


--
-- Name: contactos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.contactos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.contactos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: estados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estados (
    id bigint NOT NULL,
    nombre character varying(20) NOT NULL
);


--
-- Name: estados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.estados ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.estados_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: facturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facturas (
    id bigint NOT NULL,
    cliente_id bigint NOT NULL,
    numero_factura character varying(100) NOT NULL,
    fecha_factura date NOT NULL,
    base_imponible numeric(12,2) NOT NULL,
    iva_porcentaje numeric(5,2) NOT NULL,
    importe_iva numeric(12,2) GENERATED ALWAYS AS (round(((base_imponible * iva_porcentaje) / (100)::numeric), 2)) STORED,
    total numeric(12,2) GENERATED ALWAYS AS ((base_imponible + round(((base_imponible * iva_porcentaje) / (100)::numeric), 2))) STORED,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_facturas_numero_not_empty CHECK ((length(TRIM(BOTH FROM numero_factura)) > 0)),
    CONSTRAINT facturas_base_imponible_check CHECK ((base_imponible >= (0)::numeric)),
    CONSTRAINT facturas_iva_porcentaje_check CHECK (((iva_porcentaje >= (0)::numeric) AND (iva_porcentaje <= (100)::numeric)))
);


--
-- Name: facturas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.facturas ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.facturas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: historico_cambios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historico_cambios (
    id bigint NOT NULL,
    cliente_id bigint NOT NULL,
    entidad_tipo character varying(20) NOT NULL,
    entidad_id bigint NOT NULL,
    campo character varying(100) NOT NULL,
    valor_anterior jsonb,
    valor_nuevo jsonb,
    usuario_id bigint,
    actor_tipo character varying(20) DEFAULT 'usuario'::character varying NOT NULL,
    fecha_hora timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT historico_cambios_actor_tipo_check CHECK (((actor_tipo)::text = ANY ((ARRAY['usuario'::character varying, 'sistema'::character varying, 'importacion'::character varying])::text[]))),
    CONSTRAINT historico_cambios_entidad_tipo_check CHECK (((entidad_tipo)::text = ANY ((ARRAY['cliente'::character varying, 'contacto'::character varying])::text[])))
);


--
-- Name: historico_cambios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.historico_cambios ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.historico_cambios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: importaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.importaciones (
    id bigint NOT NULL,
    nombre_archivo character varying(255) NOT NULL,
    checksum_sha256 character(64),
    estado character varying(20) DEFAULT 'iniciada'::character varying NOT NULL,
    filas_totales integer DEFAULT 0 NOT NULL,
    filas_importadas integer DEFAULT 0 NOT NULL,
    filas_rechazadas integer DEFAULT 0 NOT NULL,
    filas_duplicadas integer DEFAULT 0 NOT NULL,
    iniciado_en timestamp with time zone DEFAULT now() NOT NULL,
    finalizado_en timestamp with time zone,
    CONSTRAINT chk_importaciones_counts CHECK (((filas_totales >= 0) AND (filas_importadas >= 0) AND (filas_rechazadas >= 0) AND (filas_duplicadas >= 0))),
    CONSTRAINT importaciones_estado_check CHECK (((estado)::text = ANY ((ARRAY['iniciada'::character varying, 'completada'::character varying, 'completada_con_incidencias'::character varying, 'fallida'::character varying])::text[])))
);


--
-- Name: importaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.importaciones ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.importaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: incidencias_importacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incidencias_importacion (
    id bigint NOT NULL,
    importacion_id bigint NOT NULL,
    fila_csv integer,
    tipo character varying(50) NOT NULL,
    severidad character varying(10) DEFAULT 'error'::character varying NOT NULL,
    descripcion text NOT NULL,
    datos_originales jsonb,
    identificador_registro character varying(255),
    estado character varying(15) DEFAULT 'pendiente'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT incidencias_importacion_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'revisada'::character varying, 'resuelta'::character varying])::text[]))),
    CONSTRAINT incidencias_importacion_severidad_check CHECK (((severidad)::text = ANY ((ARRAY['info'::character varying, 'warning'::character varying, 'error'::character varying])::text[])))
);


--
-- Name: incidencias_importacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.incidencias_importacion ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.incidencias_importacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: paises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paises (
    id bigint NOT NULL,
    codigo character(2) NOT NULL,
    nombre character varying(100) NOT NULL,
    CONSTRAINT chk_paises_codigo CHECK ((codigo ~ '^[A-Z]{2}$'::text))
);


--
-- Name: paises_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.paises ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.paises_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id bigint NOT NULL,
    nombre character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    password_hash text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.usuarios ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: vista_facturacion_clientes; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vista_facturacion_clientes AS
 SELECT c.id AS cliente_id,
    (COALESCE(sum(f.base_imponible), (0)::numeric))::numeric(12,2) AS facturacion_acumulada
   FROM (public.clientes c
     LEFT JOIN public.facturas f ON ((f.cliente_id = c.id)))
  WHERE (c.deleted_at IS NULL)
  GROUP BY c.id;


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clientes (id, empresa, nombre_normalizado, cif, direccion, codigo_postal, ciudad, pais_id, comercial_id, fecha_alta, created_at, updated_at, deleted_at, estado_id) FROM stdin;
1	Construcciones Ebro SL	construcciones ebro sl	B50123456	Calle Alfonso I, 12	50003	Zaragoza	1	1	2025-01-14	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00	\N	1
2	Clínica Dental Sonrisa SLP	clinica dental sonrisa slp	B28765432	Calle de Alcalá, 200	28028	Madrid	1	2	2025-03-05	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00	\N	1
3	Hotel Mar Blau SA	hotel mar blau sa	A07123987	Passeig Marítim, 8	07014	Palma	1	2	2025-06-12	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00	\N	1
4	Logística Duero SL	logistica duero sl	B47222333	Polígono San Cristóbal, nave 4	47012	Valladolid	1	3	2024-02-20	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00	\N	2
5	Associazione Culturale Brera	associazione culturale brera	IT01234560967	Via Brera, 28	20121	Milano	4	1	2025-07-01	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00	\N	1
6	Vinhos do Porto Lda	vinhos do porto lda	PT509876543	Rua de Santa Catarina, 100	4000-447	Porto	2	3	2025-11-18	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00	\N	1
7	Atelier Lumière SARL	atelier lumiere sarl	FR12345678901	12 rue de Rivoli	75004	Paris	3	3	2026-10-02	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00	\N	1
\.


--
-- Data for Name: comerciales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comerciales (id, nombre, created_at) FROM stdin;
1	Elena Sanz	2026-10-29 10:07:26.765964+00
2	Jordi Puig	2026-10-29 10:07:26.765964+00
3	Carmen Vega	2026-10-29 10:07:26.765964+00
\.


--
-- Data for Name: contactos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contactos (id, cliente_id, nombre, email, telefono, created_at, updated_at) FROM stdin;
1	1	Marta Gil	marta.gil@construccionesebro.es	+34976123456	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
2	1	Marta Gil	marta.gil@construccionesebro.es	+34976123456	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
3	2	Lucía Moreno	lucia@clinicasonrisa.es	+34915551234	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
4	3	Toni Ferrer	toni.ferrer@hotelmarblau.com	+34971223344	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
5	4	Raúl Sanz	raul@logisticaduero.es	+34983445566	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
6	5	Giulia Bianchi	giulia@brera-cultura.it	+39021234567	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
7	6	João Silva	joao.silva@vinhosdoporto.pt	+351912345678	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
8	6	João Silva	joao.silva@vinhosdoporto.pt	+351912345678	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
9	1	Pablo Ruiz	pablo.ruiz@construccionesebro.es	+34976123457	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
10	2	Lucía Moreno	lucia@clinicasonrisa.es	+34915551234	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
11	3	Toni Ferrer	toni.ferrer@hotelmarblau.com	+34971223344	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
12	5	Giulia Bianchi	giulia@brera-cultura.it	+39021234567	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
13	7	Claire Martin	claire.martin@atelier-lumiere.fr	+33612345678	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
14	4	Raúl Sanz	raul@logisticaduero.es	+34983445566	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
15	3	Toni Ferrer	toni.ferrer@hotelmarblau.com	+34971223344	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
16	1	Marta Gil	marta.gil@construccionesebro.es	+34976123456	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
17	1	Marta Gil	marta.gil@construccionesebro.es	+34976123456	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
18	6	João Silva	joao.silva@vinhosdoporto.pt	+351912345678	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
\.


--
-- Data for Name: estados; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.estados (id, nombre) FROM stdin;
1	Activo
2	Inactivo
\.


--
-- Data for Name: facturas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.facturas (id, cliente_id, numero_factura, fecha_factura, base_imponible, iva_porcentaje, created_at, updated_at) FROM stdin;
1	1	F-2026-0101	2026-09-03	1250.00	21.00	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
2	1	F-2026-0102	2026-09-17	1875.60	21.00	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
3	3	F-2026-0104	2026-09-10	3420.00	21.00	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
4	4	F-2026-0105	2026-09-12	415.25	21.00	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
5	5	F-2026-0106	2026-09-15	2300.00	0.00	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
6	6	F-2026-0107	2026-09-22	890.00	0.00	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
7	1	F-2026-0109	2026-10-06	529.50	21.00	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
8	2	F-2026-0110	2026-10-09	980.40	21.00	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
9	3	F-2026-0111	2026-10-12	2150.00	21.00	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
10	5	F-2026-0112	2026-10-14	1180.00	0.00	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
11	3	F-2026-0114	2026-10-19	780.00	21.00	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
12	1	F-2026-0115	2026-10-21	520.80	21.00	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
13	6	F-2026-0116	2026-10-23	1050.00	0.00	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
\.


--
-- Data for Name: historico_cambios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.historico_cambios (id, cliente_id, entidad_tipo, entidad_id, campo, valor_anterior, valor_nuevo, usuario_id, actor_tipo, fecha_hora) FROM stdin;
\.


--
-- Data for Name: importaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.importaciones (id, nombre_archivo, checksum_sha256, estado, filas_totales, filas_importadas, filas_rechazadas, filas_duplicadas, iniciado_en, finalizado_en) FROM stdin;
1	clientes_antiguos.csv	1a92fc4a126e23aa8d7804fda9439a55156361e5ea5865a6e1a620b685b654fc	completada	18	18	0	1	2026-10-29 12:45:05.366021+00	2026-10-29 12:45:05.366021+00
\.


--
-- Data for Name: incidencias_importacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incidencias_importacion (id, importacion_id, fila_csv, tipo, severidad, descripcion, datos_originales, identificador_registro, estado, created_at) FROM stdin;
1	1	4	INFERRED_PHONE_COUNTRY	warning	Phone country was inferred during normalization.	{"field": "telefono", "value": "91 555 12 34"}	\N	pendiente	2026-10-29 12:45:05.366021+00
2	1	4	INVALID_TAXABLE_BASE	error	Taxable base is missing or invalid.	{"field": "base_imponible", "value": "640.5"}	\N	pendiente	2026-10-29 12:45:05.366021+00
3	1	5	INFERRED_PHONE_COUNTRY	warning	Phone country was inferred during normalization.	{"field": "telefono", "value": "971 22 33 44"}	\N	pendiente	2026-10-29 12:45:05.366021+00
4	1	6	INFERRED_PHONE_COUNTRY	warning	Phone country was inferred during normalization.	{"field": "telefono", "value": "983 44 55 66"}	\N	pendiente	2026-10-29 12:45:05.366021+00
5	1	9	INVALID_INVOICE_DATE	error	Invoice date is missing or invalid.	{"field": "fecha_factura", "value": "31/09/2026"}	\N	pendiente	2026-10-29 12:45:05.366021+00
6	1	10	INVALID_CREATION_DATE	warning	Client creation date is invalid.	{"field": "fecha_alta", "value": "2025-01-14"}	\N	pendiente	2026-10-29 12:45:05.366021+00
7	1	10	INFERRED_PHONE_COUNTRY	warning	Phone country was inferred during normalization.	{"field": "telefono", "value": "976123457"}	\N	pendiente	2026-10-29 12:45:05.366021+00
8	1	12	INFERRED_PHONE_COUNTRY	warning	Phone country was inferred during normalization.	{"field": "telefono", "value": "971 22 33 44"}	\N	pendiente	2026-10-29 12:45:05.366021+00
9	1	15	INVALID_TAXABLE_BASE	error	Taxable base is missing or invalid.	{"field": "base_imponible", "value": ""}	\N	pendiente	2026-10-29 12:45:05.366021+00
10	1	16	INFERRED_PHONE_COUNTRY	warning	Phone country was inferred during normalization.	{"field": "telefono", "value": "971 22 33 44"}	\N	pendiente	2026-10-29 12:45:05.366021+00
11	1	18	DUPLICATE_INVOICE	warning	Duplicate invoice F-2026-0115 for this client.	{"invoiceNumber": "F-2026-0115"}	\N	pendiente	2026-10-29 12:45:05.366021+00
\.


--
-- Data for Name: paises; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.paises (id, codigo, nombre) FROM stdin;
1	ES	España
2	PT	Portugal
3	FR	Francia
4	IT	Italia
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, nombre, email, password_hash, activo, created_at, updated_at) FROM stdin;
\.


--
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clientes_id_seq', 7, true);


--
-- Name: comerciales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comerciales_id_seq', 3, true);


--
-- Name: contactos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contactos_id_seq', 18, true);


--
-- Name: estados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.estados_id_seq', 2, true);


--
-- Name: facturas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.facturas_id_seq', 13, true);


--
-- Name: historico_cambios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.historico_cambios_id_seq', 1, false);


--
-- Name: importaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.importaciones_id_seq', 1, true);


--
-- Name: incidencias_importacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.incidencias_importacion_id_seq', 11, true);


--
-- Name: paises_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.paises_id_seq', 8, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 1, false);


--
-- Name: clientes clientes_nombre_normalizado_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_nombre_normalizado_key UNIQUE (nombre_normalizado);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: comerciales comerciales_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comerciales
    ADD CONSTRAINT comerciales_nombre_key UNIQUE (nombre);


--
-- Name: comerciales comerciales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comerciales
    ADD CONSTRAINT comerciales_pkey PRIMARY KEY (id);


--
-- Name: contactos contactos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contactos
    ADD CONSTRAINT contactos_pkey PRIMARY KEY (id);


--
-- Name: estados estados_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estados
    ADD CONSTRAINT estados_nombre_key UNIQUE (nombre);


--
-- Name: estados estados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estados
    ADD CONSTRAINT estados_pkey PRIMARY KEY (id);


--
-- Name: facturas facturas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_pkey PRIMARY KEY (id);


--
-- Name: historico_cambios historico_cambios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_cambios
    ADD CONSTRAINT historico_cambios_pkey PRIMARY KEY (id);


--
-- Name: importaciones importaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.importaciones
    ADD CONSTRAINT importaciones_pkey PRIMARY KEY (id);


--
-- Name: incidencias_importacion incidencias_importacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidencias_importacion
    ADD CONSTRAINT incidencias_importacion_pkey PRIMARY KEY (id);


--
-- Name: paises paises_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paises
    ADD CONSTRAINT paises_codigo_key UNIQUE (codigo);


--
-- Name: paises paises_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paises
    ADD CONSTRAINT paises_nombre_key UNIQUE (nombre);


--
-- Name: paises paises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paises
    ADD CONSTRAINT paises_pkey PRIMARY KEY (id);


--
-- Name: facturas uq_facturas_cliente_numero; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT uq_facturas_cliente_numero UNIQUE (cliente_id, numero_factura);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_clientes_comercial; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_comercial ON public.clientes USING btree (comercial_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_clientes_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_empresa ON public.clientes USING btree (lower((empresa)::text)) WHERE (deleted_at IS NULL);


--
-- Name: idx_clientes_estado_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_estado_id ON public.clientes USING btree (estado_id);


--
-- Name: idx_clientes_pais; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_pais ON public.clientes USING btree (pais_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_contactos_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contactos_cliente ON public.contactos USING btree (cliente_id);


--
-- Name: idx_contactos_email_lower; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contactos_email_lower ON public.contactos USING btree (lower((email)::text)) WHERE (email IS NOT NULL);


--
-- Name: idx_facturas_cliente_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_facturas_cliente_fecha ON public.facturas USING btree (cliente_id, fecha_factura DESC);


--
-- Name: idx_historico_cliente_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_cliente_fecha ON public.historico_cambios USING btree (cliente_id, fecha_hora DESC);


--
-- Name: idx_historico_entidad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_entidad ON public.historico_cambios USING btree (entidad_tipo, entidad_id);


--
-- Name: idx_incidencias_importacion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidencias_importacion ON public.incidencias_importacion USING btree (importacion_id, fila_csv);


--
-- Name: uq_clientes_cif; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_clientes_cif ON public.clientes USING btree (upper((cif)::text)) WHERE (cif IS NOT NULL);


--
-- Name: uq_usuarios_email_lower; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_usuarios_email_lower ON public.usuarios USING btree (lower((email)::text));


--
-- Name: clientes trg_clientes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: contactos trg_contactos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_contactos_updated_at BEFORE UPDATE ON public.contactos FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: facturas trg_facturas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_facturas_updated_at BEFORE UPDATE ON public.facturas FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: usuarios trg_usuarios_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.actualizar_updated_at();


--
-- Name: clientes clientes_comercial_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_comercial_id_fkey FOREIGN KEY (comercial_id) REFERENCES public.comerciales(id) ON DELETE RESTRICT;


--
-- Name: clientes clientes_pais_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pais_id_fkey FOREIGN KEY (pais_id) REFERENCES public.paises(id) ON DELETE RESTRICT;


--
-- Name: contactos contactos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contactos
    ADD CONSTRAINT contactos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE RESTRICT;


--
-- Name: facturas facturas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE RESTRICT;


--
-- Name: clientes fk_clientes_estado; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT fk_clientes_estado FOREIGN KEY (estado_id) REFERENCES public.estados(id) ON DELETE RESTRICT;


--
-- Name: historico_cambios historico_cambios_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_cambios
    ADD CONSTRAINT historico_cambios_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE RESTRICT;


--
-- Name: historico_cambios historico_cambios_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_cambios
    ADD CONSTRAINT historico_cambios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- Name: incidencias_importacion incidencias_importacion_importacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidencias_importacion
    ADD CONSTRAINT incidencias_importacion_importacion_id_fkey FOREIGN KEY (importacion_id) REFERENCES public.importaciones(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict fq92XN4aQGJcWJfFPHBCfflCjft7XhWVIlXvSsgU78urAb5gMibp8fOeeSC1Rnz

