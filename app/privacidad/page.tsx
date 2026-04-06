import Link from 'next/link'
import { Zap } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidad — WeblyNow',
  description: 'Política de privacidad y tratamiento de datos personales de WeblyNow.',
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#080B14] text-white">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080B14] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">WeblyNow</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-white transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-4xl font-black mb-2">Política de Privacidad</h1>
        <p className="text-muted-foreground mb-10">Última actualización: abril 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Responsable del tratamiento</h2>
            <p>WeblyNow (en adelante "nosotros" o "la plataforma") es responsable del tratamiento de sus datos personales. Puede contactarnos en <a href="mailto:hola@weblynow.com" className="text-indigo-400 hover:text-indigo-300">hola@weblynow.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Datos que recopilamos</h2>
            <p>Recopilamos los siguientes tipos de datos:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-white">Datos de registro:</strong> nombre, dirección de email y contraseña (almacenada con hash bcrypt)</li>
              <li><strong className="text-white">Datos de uso:</strong> sitios creados, configuraciones del wizard, historial de versiones</li>
              <li><strong className="text-white">Datos de pago:</strong> procesados por Flow.cl; no almacenamos datos de tarjetas</li>
              <li><strong className="text-white">Datos técnicos:</strong> logs de acceso, dirección IP, tipo de navegador</li>
              <li><strong className="text-white">Imágenes:</strong> archivos que usted sube, almacenados en Cloudinary</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Finalidad del tratamiento</h2>
            <p>Usamos sus datos para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Proveer y mejorar el Servicio</li>
              <li>Gestionar su cuenta y autenticación</li>
              <li>Procesar pagos y emitir comprobantes</li>
              <li>Enviar notificaciones relacionadas al Servicio (no spam)</li>
              <li>Cumplir obligaciones legales</li>
              <li>Detectar y prevenir fraudes o usos indebidos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Base legal</h2>
            <p>El tratamiento de sus datos se basa en: (a) la ejecución del contrato de Servicio que acepta al registrarse, (b) su consentimiento para comunicaciones opcionales, y (c) nuestro interés legítimo en la seguridad y mejora del Servicio, conforme a la Ley N° 19.628 sobre Protección de la Vida Privada de Chile.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Compartición de datos</h2>
            <p>No vendemos ni alquilamos sus datos. Podemos compartirlos con:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-white">Flow.cl:</strong> procesador de pagos</li>
              <li><strong className="text-white">Cloudinary:</strong> almacenamiento de imágenes</li>
              <li><strong className="text-white">Railway:</strong> infraestructura de hosting</li>
              <li><strong className="text-white">Anthropic:</strong> generación de contenido con IA (sin datos personales identificables)</li>
            </ul>
            <p className="mt-2">Todos los proveedores operan bajo sus propias políticas de privacidad y cumplen estándares de seguridad internacionales.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Retención de datos</h2>
            <p>Conservamos sus datos mientras su cuenta esté activa. Si elimina su cuenta, borraremos sus datos personales en un plazo de 30 días, excepto aquellos que debamos conservar por obligaciones legales (como registros de transacciones).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Sus derechos</h2>
            <p>Conforme a la ley chilena, usted tiene derecho a:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Acceder a sus datos personales</li>
              <li>Rectificar datos inexactos</li>
              <li>Solicitar la eliminación de sus datos</li>
              <li>Oponerse al tratamiento en ciertos casos</li>
              <li>Portar sus datos a otro proveedor</li>
            </ul>
            <p className="mt-2">Para ejercer estos derechos, contáctenos en <a href="mailto:hola@weblynow.com" className="text-indigo-400 hover:text-indigo-300">hola@weblynow.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Seguridad</h2>
            <p>Aplicamos medidas técnicas y organizativas para proteger sus datos: conexiones HTTPS, contraseñas hasheadas con bcrypt, acceso restringido a la base de datos, y backups regulares. Sin embargo, ningún sistema es 100% seguro y no podemos garantizar la seguridad absoluta.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Cookies</h2>
            <p>Usamos cookies de sesión estrictamente necesarias para autenticación (NextAuth.js). No usamos cookies de rastreo de terceros ni publicidad comportamental.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Cambios a esta política</h2>
            <p>Podemos actualizar esta Política periódicamente. Notificaremos cambios significativos por email con al menos 15 días de anticipación.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Contacto</h2>
            <p>Para consultas sobre privacidad o ejercicio de derechos: <a href="mailto:hola@weblynow.com" className="text-indigo-400 hover:text-indigo-300">hola@weblynow.com</a></p>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-3xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 WeblyNow · Chile</p>
          <div className="flex gap-6">
            <Link href="/terminos" className="hover:text-white transition-colors">Términos</Link>
            <Link href="/privacidad" className="text-white">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
