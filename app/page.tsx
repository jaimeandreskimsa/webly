import Link from 'next/link'
import {
  Zap, Globe, Sparkles, Shield, ArrowRight, Check,
  Star, Rocket, Code2, Palette, BarChart3, MessageSquare,
  ChevronRight, Play, Building2
} from 'lucide-react'

// ─── Pricing Data ─────────────────────────────────────────────────────────────

const planes = [
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
    titulo: 'Ingresa tu contenido',
    descripcion: 'Completa el wizard con los textos, servicios, fotos y datos de tu empresa.',
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
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-white transition-colors px-4 py-2"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="text-sm font-medium px-4 py-2 rounded-lg btn-gradient text-white"
          >
            Comenzar gratis
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
          <span>Powered by Claude AI · Sitios en menos de 5 minutos</span>
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
          <button className="flex items-center gap-2 glass glass-hover text-white font-medium px-8 py-4 rounded-xl text-lg">
            <Play className="w-5 h-5 text-indigo-400" />
            Ver demo
          </button>
        </div>

        {/* Social proof */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500'].map((color, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-background`} />
              ))}
            </div>
            <span>+500 sitios creados</span>
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

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
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
              Más de 500 empresas ya tienen su sitio web creado con WeblyNow.
              La tuya puede ser la próxima en 5 minutos.
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
            <a href="/terminos" className="hover:text-white transition-colors">Términos</a>
            <a href="/privacidad" className="hover:text-white transition-colors">Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#080B14]">
      <Navbar />
      <Hero />
      <ComoFunciona />
      <Planes />
      <Testimonios />
      <CTA />
      <Footer />
    </main>
  )
}
