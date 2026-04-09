import Link from 'next/link'
import {
  Zap, Globe, Sparkles, Shield, ArrowRight, Check,
  Star, Rocket, Code2, Palette, BarChart3, MessageSquare,
  ChevronRight, Building2, ExternalLink
} from 'lucide-react'

// ─── Pricing Data ─────────────────────────────────────────────────────────────

const planes = [
  {
    id: 'prueba',
    nombre: 'Prueba',
    precio: '1.000',
    descripcion: 'Prueba la plataforma por solo $1.000 CLP',
    color: 'from-pink-500/20 to-rose-500/20',
    border: 'border-pink-500/30',
    badge: '¡PRUÉBALA YA!',
    features: [
      '1 Landing page con IA',
      '4-6 secciones optimizadas',
      'Imágenes de stock con IA',
      'Formulario de contacto',
      'SEO básico incluido',
      'Descarga ZIP',
      'Animaciones incluidas',
      'Soporte por email',
      'Pago único sin sorpresas',
    ],
    limitaciones: [],
    cta: '¡Probar por $1.000!',
    ctaColor: 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400',
  },
  {
    id: 'basico',
    nombre: 'Básico',
    precio: '50.000',
    descripcion: 'Ideal para emprendedores que recién comienzan',
    color: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-500/30',
    badge: null,
    features: [
      '1 Landing page profesional',
      '4-6 secciones optimizadas',
      'Imágenes de stock con IA',
      'Formulario de contacto',
      'SEO básico incluido',
      'Descarga ZIP',
      '1 revisión incluida',
      'Soporte por email',
    ],
    limitaciones: ['Sin imágenes propias', 'Sin deploy automático'],
    cta: 'Crear mi web básica',
    ctaColor: 'bg-blue-600 hover:bg-blue-500',
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precio: '100.000',
    descripcion: 'Para negocios que quieren destacar',
    color: 'from-violet-500/25 to-purple-500/25',
    border: 'border-violet-500/50',
    badge: 'MÁS POPULAR',
    features: [
      '3-5 páginas completas',
      '8-10 secciones elegibles',
      'Hasta 10 imágenes propias',
      'GSAP + animaciones scroll',
      'Formulario + WhatsApp',
      'Subdominio gratis + SSL',
      'Deploy en 1 click',
      '3 revisiones/mes',
      'Soporte prioritario',
      'Google Analytics incluido',
    ],
    limitaciones: [],
    cta: 'Crear mi web Pro',
    ctaColor: 'btn-gradient',
  },
  {
    id: 'premium',
    nombre: 'Premium',
    precio: '300.000',
    descripcion: 'Experiencia de agencia, velocidad de IA',
    color: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30',
    badge: 'MÁXIMO IMPACTO',
    features: [
      '10+ páginas a medida',
      'Secciones ilimitadas',
      'Imágenes y videos propios',
      'Three.js / efectos 3D',
      'Locomotive Scroll',
      'Blog con 5 posts',
      'Dominio propio + CDN',
      'Deploy + hosting incluido',
      'Historial de versiones',
      'Dark/light mode toggle',
      'Revisiones ilimitadas 30 días',
      'WhatsApp directo',
      'SEO avanzado + analytics',
      '2 idiomas',
    ],
    limitaciones: [],
    cta: 'Crear mi web Premium',
    ctaColor: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400',
  },
  {
    id: 'broker',
    nombre: 'Broker',
    precio: '700.000',
    descripcion: 'Portal inmobiliario con gestión de propiedades',
    color: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    badge: 'INMOBILIARIAS',
    features: [
      'Portal inmobiliario completo',
      '4 páginas (inicio, propiedades, nosotros, contacto)',
      'Carga y gestión de propiedades',
      'Filtros avanzados (tipo, precio, ciudad)',
      'Modal de detalle con galería',
      'WhatsApp CTA por propiedad',
      'Deploy automático en Vercel',
      'Actualización en tiempo real',
      'SEO: schema RealEstateAgent',
      'Hasta 10 imágenes IA incluidas',
      'Ediciones ilimitadas',
      'Panel de administración',
    ],
    limitaciones: [],
    cta: 'Crear mi portal Broker',
    ctaColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
  },
]

const pasos = [
  {
    numero: '01',
    titulo: 'Elige tu plan',
    descripcion: 'Selecciona el plan que mejor se adapta a tu negocio y completa el pago en segundos.',
    icon: Sparkles,
  },
  {
    numero: '02',
    titulo: 'Paga e ingresa tu contenido',
    descripcion: 'Completa el pago en segundos y luego llena el wizard con los textos, servicios, fotos y datos de tu empresa.',
    icon: Code2,
  },
  {
    numero: '03',
    titulo: 'IA genera tu sitio',
    descripcion: 'Claude AI crea tu sitio web profesional con animaciones y diseño premium en segundos.',
    icon: Zap,
  },
  {
    numero: '04',
    titulo: 'Publica o descarga',
    descripcion: 'Despliega con 1 click o descarga el ZIP. Tu web lista para el mundo.',
    icon: Rocket,
  },
]

const testimonios = [
  {
    nombre: 'Valentina Torres',
    cargo: 'Dueña, Café Rituales',
    texto: 'En 10 minutos tuve una web que me costó menos que contratar un diseñador por hora. Las animaciones son increíbles.',
    stars: 5,
    avatar: 'VT',
  },
  {
    nombre: 'Rodrigo Campos',
    cargo: 'CEO, Constructora RC',
    texto: 'Llevaba meses postergando el sitio web. Con WeblyNow lo resolví en una tarde. El resultado superó mis expectativas.',
    stars: 5,
    avatar: 'RC',
  },
  {
    nombre: 'Ana Jiménez',
    cargo: 'Directora, Clínica Vital',
    texto: 'El plan Premium es una locura. Parece hecho por una agencia de primer nivel. Mis pacientes no pueden creer que lo hice yo.',
    stars: 5,
    avatar: 'AJ',
  },
  {
    nombre: 'Carlos Herrera',
    cargo: 'Corredor de Propiedades, CH Real Estate',
    texto: 'El plan Broker transformó mi negocio. Mis clientes pueden ver las propiedades filtradas y me llaman por WhatsApp directo desde el sitio.',
    stars: 5,
    avatar: 'CH',
  },
]

// ─── Components ───────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080B14] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">WeblyNow</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-white transition-colors">
            Cómo funciona
          </a>
          <a href="#planes" className="text-sm text-muted-foreground hover:text-white transition-colors">
            Planes
          </a>
          <a href="#testimonios" className="text-sm text-muted-foreground hover:text-white transition-colors">
            Testimonios
          </a>
          <a href="#faq" className="text-sm text-muted-foreground hover:text-white transition-colors">
            FAQ
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-white transition-colors px-4 py-2"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid pt-16">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="orb absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20" style={{ animationDelay: '0s' }} />
        <div className="orb absolute top-20 -right-20 w-80 h-80 bg-purple-600/20" style={{ animationDelay: '2s' }} />
        <div className="orb absolute -bottom-20 left-1/3 w-72 h-72 bg-cyan-600/15" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-indigo-300 mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4" />
          <span>Powered by Claude AI · Sitios en minutos</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 animate-slide-in">
          Tu sitio web
          <br />
          <span className="gradient-text">profesional con IA</span>
          <br />
          en minutos
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Ingresa el contenido de tu negocio, elige tu estilo y deja que la IA cree
          un sitio web con animaciones premium. Sin conocimientos técnicos.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="#planes"
            className="group flex items-center gap-2 btn-gradient text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105 glow-purple"
          >
            <Rocket className="w-5 h-5" />
            Crear mi sitio ahora
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500'].map((color, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-background`} />
              ))}
            </div>
            <span>+50 sitios creados</span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-1">4.9/5 promedio</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span>Pago 100% seguro</span>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}

function ComoFunciona() {
  return (
    <section id="como-funciona" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-indigo-400 text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            PROCESO SIMPLE
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            De 0 a publicado en{' '}
            <span className="gradient-text">4 pasos</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            No necesitas conocimientos de diseño ni programación. Solo ingresa el contenido de tu negocio.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 stagger-children">
          {pasos.map((paso) => (
            <div key={paso.numero} className="glass glass-hover rounded-2xl p-6 relative group">
              <div className="text-6xl font-black text-white/5 absolute top-4 right-4">
                {paso.numero}
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-4">
                <paso.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">{paso.titulo}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{paso.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Planes() {
  return (
    <section id="planes" className="py-24 relative">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-indigo-400 text-sm font-medium mb-4">
            <BarChart3 className="w-4 h-4" />
            PLANES Y PRECIOS
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Elige tu plan,{' '}
            <span className="gradient-text">crea hoy</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Pago único. Sin suscripciones obligatorias. Tu sitio es tuyo para siempre.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-6 items-stretch">
          {planes.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border ${plan.border} bg-gradient-to-b ${plan.color} p-8 flex flex-col ${
                plan.badge === 'MÁS POPULAR' ? 'scale-105 glow-purple' : ''
              }`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1.5 rounded-full ${
                  plan.id === 'broker'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                    : plan.id === 'premium'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : plan.nombre === 'Prueba'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500'
                    : 'bg-gradient-to-r from-violet-500 to-purple-600'
                }`}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.nombre}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.descripcion}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-muted-foreground text-sm">CLP$</span>
                  <span className="text-4xl font-black">{plan.precio}</span>
                </div>
                <p className="text-muted-foreground text-xs mt-1">Pago único · sin mensualidad</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                {plan.limitaciones.map((limit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground line-through">
                    <span className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0 text-center">✕</span>
                    <span>{limit}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/registro?plan=${plan.id}`}
                className={`w-full text-center py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02] ${plan.ctaColor}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Subscription upsell */}
        <div className="mt-10 glass rounded-2xl p-6 border border-indigo-500/20 max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold">¿Quieres editar tu sitio cada mes?</span>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Agrega el plan de ediciones mensuales después de crear tu sitio
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span><strong>Pro:</strong> 3 ediciones — CLP$15.000/mes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span><strong>Premium:</strong> Ilimitadas — CLP$35.000/mes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Portfolio ───────────────────────────────────────────────────────────────

const sitiosPortfolio = [
  {
    nombre: 'CódigoSafe',
    descripcion: 'Empresa de ciberseguridad y soluciones digitales',
    url: 'https://codigosafe.cl',
    tag: 'Ciberseguridad',
    color: 'from-cyan-500/20 to-blue-500/20',
    border: 'border-cyan-500/30',
    tagColor: 'bg-cyan-500/20 text-cyan-300',
  },
  {
    nombre: 'Building Manager Chile',
    descripcion: 'Servicios profesionales de administración de edificios',
    url: 'https://buildingmanagerchile.cl',
    tag: 'Administración',
    color: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30',
    tagColor: 'bg-amber-500/20 text-amber-300',
  },
  {
    nombre: 'Kimsa Software',
    descripcion: 'Fábrica de software y desarrollo tecnológico a medida',
    url: 'https://kimsa.io',
    tag: 'Software',
    color: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-500/30',
    tagColor: 'bg-violet-500/20 text-violet-300',
  },
  {
    nombre: 'Jaime Gómez',
    descripcion: 'Portfolio profesional de desarrollador full stack',
    url: 'https://jaimegomez.work',
    tag: 'Portfolio',
    color: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    tagColor: 'bg-emerald-500/20 text-emerald-300',
  },
]

function Portfolio() {
  return (
    <section className="py-24 px-6" id="portfolio">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Sitios reales creados con WeblyNow
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Resultados que{' '}
            <span className="gradient-text">hablan solos</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Empresas reales que confiaron en WeblyNow para su presencia digital.
            Cada sitio generado con IA en minutos.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sitiosPortfolio.map((sitio) => (
            <a
              key={sitio.url}
              href={sitio.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative rounded-2xl border ${sitio.border} bg-gradient-to-br ${sitio.color} overflow-hidden hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10`}
            >
              {/* Browser mockup */}
              <div className="relative">
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-black/40 border-b border-white/10">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  <div className="ml-3 flex-1 bg-white/10 rounded-md px-3 py-0.5 text-xs text-white/50 font-mono truncate">
                    {sitio.url.replace('https://', '')}
                  </div>
                </div>
                {/* Screenshot */}
                <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://image.thum.io/get/width/1200/crop/675/noanimate/${sitio.url}`}
                    alt={`Preview de ${sitio.nombre}`}
                    loading="eager"
                    className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Overlay gradient bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              </div>

              {/* Info */}
              <div className="p-5 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white text-lg">{sitio.nombre}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sitio.tagColor}`}>
                      {sitio.tag}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{sitio.descripcion}</p>
                </div>
                <div className="shrink-0 w-9 h-9 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                  <ExternalLink className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { num: '50+', label: 'sitios publicados' },
            { num: '< 5min', label: 'tiempo de generación' },
            { num: '100%', label: 'con IA' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black gradient-text">{s.num}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Testimonios() {
  return (
    <section id="testimonios" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-indigo-400 text-sm font-medium mb-4">
            <MessageSquare className="w-4 h-4" />
            TESTIMONIOS
          </div>
          <h2 className="text-4xl md:text-5xl font-black">
            Lo que dicen{' '}
            <span className="gradient-text">nuestros clientes</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {testimonios.map((t, i) => (
            <div key={i} className="glass glass-hover rounded-2xl p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-foreground/80 text-sm leading-relaxed mb-6">"{t.texto}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.nombre}</div>
                  <div className="text-muted-foreground text-xs">{t.cargo}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden p-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-indigo-600/20" />
          <div className="absolute inset-0 border border-indigo-500/30 rounded-3xl" />
          <div className="orb absolute -top-20 -left-20 w-64 h-64 bg-indigo-600/20" />
          <div className="orb absolute -bottom-20 -right-20 w-64 h-64 bg-purple-600/20" style={{ animationDelay: '3s' }} />

          <div className="relative z-10">
            <Globe className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Tu negocio merece{' '}
              <span className="gradient-text">estar online hoy</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Más de 50 empresas ya tienen su sitio web creado con WeblyNow.
              La tuya puede ser la próxima en minutos.
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 btn-gradient text-white font-bold px-10 py-4 rounded-xl text-lg hover:scale-105 transition-transform glow-purple"
            >
              Crear mi sitio ahora
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold gradient-text">WeblyNow</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2026 WeblyNow · Todos los derechos reservados · Chile
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="mailto:hello@weblynow.com" className="hover:text-white transition-colors">hello@weblynow.com</a>
            <a href="/terminos" className="hover:text-white transition-colors">Términos</a>
            <a href="/privacidad" className="hover:text-white transition-colors">Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── FAQ Chat ────────────────────────────────────────────────────────────────

const faqData = [
  {
    pregunta: '¿Cómo funciona WeblyNow?',
    respuesta: 'Eliges un plan, completas un formulario con la info de tu negocio (nombre, servicios, colores, etc.) y nuestra IA genera un sitio web profesional completo en menos de 2 minutos. Luego puedes publicarlo con 1 click.',
  },
  {
    pregunta: '¿Cuánto cuesta?',
    respuesta: 'Tenemos 4 planes: Básico ($50.000), Pro ($100.000), Premium ($300.000) y Broker ($700.000). Es un pago único, sin mensualidades obligatorias. El precio incluye la generación del sitio y las ediciones del plan.',
  },
  {
    pregunta: '¿Puedo editar mi sitio después?',
    respuesta: 'Sí. El plan Básico incluye 1 edición, y los planes Pro, Premium y Broker incluyen 5 ediciones. Solo describes los cambios en texto y la IA los aplica automáticamente.',
  },
  {
    pregunta: '¿Necesito saber programar?',
    respuesta: 'No. Solo necesitas completar un formulario con la información de tu negocio. La IA se encarga de todo el diseño, código, animaciones y optimización.',
  },
  {
    pregunta: '¿Cómo publico mi sitio?',
    respuesta: 'Desde tu dashboard puedes publicar con 1 click en Vercel (hosting gratuito con SSL). También puedes descargar el ZIP y subirlo a tu propio hosting. Incluimos una guía paso a paso para configurar tu dominio propio.',
  },
  {
    pregunta: '¿Qué incluye el plan Broker?',
    respuesta: 'Un portal inmobiliario completo con gestión de propiedades, filtros avanzados, galería de fotos, integración WhatsApp por propiedad y un panel para agregar/editar propiedades que se actualizan en tu web al instante.',
  },
  {
    pregunta: '¿Qué métodos de pago aceptan?',
    respuesta: 'Aceptamos tarjetas de crédito, débito y transferencia bancaria a través de Flow.cl, la plataforma de pagos más segura de Chile.',
  },
  {
    pregunta: '¿Puedo usar mi propio dominio?',
    respuesta: 'Sí. Todos los planes permiten conectar un dominio propio (.cl, .com, etc.). En tu dashboard encontrarás una guía paso a paso para configurar los DNS.',
  },
]

function FAQChat() {
  return (
    <section className="py-24 px-6" id="faq">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
            <MessageSquare className="w-3.5 h-3.5" />
            Centro de ayuda
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Preguntas{' '}
            <span className="gradient-text">frecuentes</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Resuelve tus dudas al instante. Si necesitas más ayuda, escríbenos a hello@weblynow.com
          </p>
        </div>

        <div className="space-y-3">
          {faqData.map((faq, i) => (
            <details
              key={i}
              className="group glass rounded-xl border border-white/5 overflow-hidden"
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-white/5 transition-colors">
                <span className="text-sm font-medium text-white pr-4">{faq.pregunta}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-white/5 pt-3">
                {faq.respuesta}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">¿No encontraste lo que buscas?</p>
          <a
            href="mailto:hello@weblynow.com"
            className="inline-flex items-center gap-2 glass glass-hover text-white font-medium px-6 py-3 rounded-xl text-sm transition-all hover:scale-105"
          >
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            Escríbenos a hello@weblynow.com
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#080B14]">
      <Navbar />
      <Hero />
      <ComoFunciona />
      <Portfolio />
      <Planes />
      <Testimonios />
      <FAQChat />
      <CTA />
      <Footer />
    </main>
  )
}
