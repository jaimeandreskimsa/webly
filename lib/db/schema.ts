import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const planEnum = pgEnum('plan', ['basico', 'pro', 'premium', 'broker'])
export const rolEnum = pgEnum('rol', ['usuario', 'admin'])
export const estadoSitioEnum = pgEnum('estado_sitio', [
  'pendiente_pago',
  'generando',
  'publicado',
  'borrador',
  'error',
])
export const estadoPagoEnum = pgEnum('estado_pago', [
  'pendiente',
  'aprobado',
  'rechazado',
  'reembolsado',
])
export const tipoSuscripcionEnum = pgEnum('tipo_suscripcion', [
  'unico',
  'mensual',
])

// ─── Usuarios ────────────────────────────────────────────────────────────────

export const usuarios = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  avatar: text('avatar'),
  plan: planEnum('plan').default('basico'),
  rol: rolEnum('rol').default('usuario'),
  activo: boolean('activo').default(true),
  emailVerificado: boolean('email_verificado').default(false),
  // Integraciones del cliente
  vercelToken: text('vercel_token'),       // token personal Vercel del cliente
  vercelTeamId: text('vercel_team_id'),    // team ID opcional
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Sesiones (NextAuth) ──────────────────────────────────────────────────────

export const sesiones = pgTable('sesiones', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Pagos ───────────────────────────────────────────────────────────────────

export const pagos = pgTable('pagos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  flowToken: text('flow_token').unique(),   // token de la transacción Flow
  flowOrder: text('flow_order'),            // número de orden Flow
  plan: planEnum('plan').notNull(),
  tipoSuscripcion: tipoSuscripcionEnum('tipo_suscripcion').default('unico'),
  monto: integer('monto').notNull(), // en CLP
  estado: estadoPagoEnum('estado').default('pendiente'),
  metadata: jsonb('metadata'), // datos adicionales del pago
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Suscripciones ───────────────────────────────────────────────────────────

export const suscripciones = pgTable('suscripciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  sitioId: uuid('sitio_id')
    .references(() => sitios.id, { onDelete: 'cascade' }),
  plan: planEnum('plan').notNull(),
  activa: boolean('activa').default(true),
  edicionesUsadasEsteMes: integer('ediciones_usadas_este_mes').default(0),
  limiteEdiciones: integer('limite_ediciones').default(0), // 0 = sin límite
  fechaRenovacion: timestamp('fecha_renovacion'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Sitios ───────────────────────────────────────────────────────────────────

export const sitios = pgTable('sitios', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  slug: text('slug').unique(), // para URL amigable
  plan: planEnum('plan').notNull(),
  estado: estadoSitioEnum('estado').default('borrador'),
  // Datos del formulario del cliente
  contenidoJson: jsonb('contenido_json'), // todos los inputs del wizard
  // Deploy info
  deployUrl: text('deploy_url'),
  vercelProjectId: text('vercel_project_id'),
  vercelDeploymentId: text('vercel_deployment_id'),
  dominioPersonalizado: text('dominio_personalizado'),
  // Estadísticas
  totalEdiciones: integer('total_ediciones').default(0),
  ultimaEdicion: timestamp('ultima_edicion'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Versiones del Sitio ──────────────────────────────────────────────────────

export const versionesSitio = pgTable('versiones_sitio', {
  id: uuid('id').primaryKey().defaultRandom(),
  sitioId: uuid('sitio_id')
    .notNull()
    .references(() => sitios.id, { onDelete: 'cascade' }),
  numeroVersion: integer('numero_version').notNull(),
  htmlCompleto: text('html_completo').notNull(), // el HTML generado por Claude
  esActual: boolean('es_actual').default(false),
  promptUsado: text('prompt_usado'), // para debug
  modeloUsado: text('modelo_usado').default('claude-sonnet-4-6'),
  tokensUsados: integer('tokens_usados'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Imágenes Subidas ─────────────────────────────────────────────────────────

export const imagenesSitio = pgTable('imagenes_sitio', {
  id: uuid('id').primaryKey().defaultRandom(),
  sitioId: uuid('sitio_id')
    .notNull()
    .references(() => sitios.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  url: text('url').notNull(), // Cloudinary URL
  publicId: text('public_id').notNull(), // Cloudinary public_id
  tipo: text('tipo').notNull(), // 'logo', 'hero', 'galeria', 'video'
  nombre: text('nombre'),
  tamaño: integer('tamanio'), // bytes
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Ediciones Mensuales ──────────────────────────────────────────────────────

export const edicionesMensuales = pgTable('ediciones_mensuales', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  sitioId: uuid('sitio_id')
    .notNull()
    .references(() => sitios.id, { onDelete: 'cascade' }),
  mes: integer('mes').notNull(),
  año: integer('año').notNull(),
  edicionesUsadas: integer('ediciones_usadas').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Configuración del sistema ──────────────────────────────────────────────

export const configuracion = pgTable('configuracion', {
  id: uuid('id').primaryKey().defaultRandom(),
  clave: text('clave').notNull().unique(),
  valor: text('valor').notNull().default(''),
  descripcion: text('descripcion'),
  tipo: text('tipo').notNull().default('string'), // string | secret | text | number | boolean
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: uuid('updated_by').references(() => usuarios.id, { onDelete: 'set null' }),
})

// ─── Propiedades (Plan Broker) ────────────────────────────────────────────────

export const propiedades = pgTable('propiedades', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  titulo: text('titulo').notNull(),
  descripcion: text('descripcion'),
  precio: integer('precio'), // en CLP o UF según moneda
  moneda: text('moneda').notNull().default('CLP'), // CLP | UF
  tipo: text('tipo').notNull().default('venta'), // venta | arriendo
  tipoPropiedad: text('tipo_propiedad').notNull().default('casa'), // casa | departamento | local | terreno | oficina | bodega
  superficie: integer('superficie'), // m2
  habitaciones: integer('habitaciones'),
  banos: integer('banos'),
  estacionamientos: integer('estacionamientos'),
  ubicacion: text('ubicacion'),
  ciudad: text('ciudad'),
  imagenes: jsonb('imagenes').$type<string[]>().default([]),
  destacada: boolean('destacada').default(false),
  activa: boolean('activa').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Solicitudes de Ayuda ────────────────────────────────────────────────────

export const solicitudesAyuda = pgTable('solicitudes_ayuda', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull().default('vercel_dominio'),
  mensaje: text('mensaje'),
  leida: boolean('leida').default(false),
  atendida: boolean('atendida').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const usuariosRelations = relations(usuarios, ({ many, one }) => ({
  sitios: many(sitios),
  pagos: many(pagos),
  suscripcion: one(suscripciones, {
    fields: [usuarios.id],
    references: [suscripciones.userId],
  }),
  sesiones: many(sesiones),
  propiedades: many(propiedades),
}))

export const sitiosRelations = relations(sitios, ({ one, many }) => ({
  usuario: one(usuarios, {
    fields: [sitios.userId],
    references: [usuarios.id],
  }),
  versiones: many(versionesSitio),
  imagenes: many(imagenesSitio),
  edicionesMensuales: many(edicionesMensuales),
}))

export const versionesRelations = relations(versionesSitio, ({ one }) => ({
  sitio: one(sitios, {
    fields: [versionesSitio.sitioId],
    references: [sitios.id],
  }),
}))

// ─── Types ────────────────────────────────────────────────────────────────────

export type Rol = 'usuario' | 'admin'
export type Usuario = typeof usuarios.$inferSelect
export type NuevoUsuario = typeof usuarios.$inferInsert
export type Sitio = typeof sitios.$inferSelect
export type NuevoSitio = typeof sitios.$inferInsert
export type VersionSitio = typeof versionesSitio.$inferSelect
export type Pago = typeof pagos.$inferSelect
export type Suscripcion = typeof suscripciones.$inferSelect
export type ImagenSitio = typeof imagenesSitio.$inferSelect
export type Configuracion = typeof configuracion.$inferSelect
export type Propiedad = typeof propiedades.$inferSelect
export type NuevaPropiedad = typeof propiedades.$inferInsert
export type SolicitudAyuda = typeof solicitudesAyuda.$inferSelect
