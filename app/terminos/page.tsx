import Link from 'next/link'
import { Zap } from 'lucide-react'

export const metadata = {
  title: 'Términos y Condiciones — WeblyNow',
  description: 'Términos y condiciones de uso de la plataforma WeblyNow.',
}

export default function TerminosPage() {
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
        <h1 className="text-4xl font-black mb-2">Términos y Condiciones</h1>
        <p className="text-muted-foreground mb-10">Última actualización: abril 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Aceptación de los términos</h2>
            <p>Al acceder y usar la plataforma WeblyNow (en adelante "el Servicio"), usted acepta quedar vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá usar el Servicio.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Descripción del servicio</h2>
            <p>WeblyNow es una plataforma SaaS que permite a usuarios crear sitios web profesionales mediante inteligencia artificial. El Servicio incluye generación de contenido HTML, alojamiento temporal de archivos, y herramientas de edición de contenido web.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Registro y cuenta</h2>
            <p>Para usar el Servicio deberá crear una cuenta con un email válido y contraseña segura. Usted es responsable de mantener la confidencialidad de sus credenciales y de toda actividad que ocurra bajo su cuenta. WeblyNow no será responsable por pérdidas derivadas del uso no autorizado de su cuenta.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Planes y pagos</h2>
            <p>WeblyNow ofrece distintos planes de pago (Básico, Pro, Premium, Broker). Los precios están expresados en pesos chilenos (CLP) e incluyen IVA cuando corresponda. Los pagos se procesan a través de Flow.cl. Una vez realizado el pago, no se realizan reembolsos salvo fallas técnicas graves imputables al Servicio.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Propiedad intelectual</h2>
            <p>El contenido que usted ingresa en la plataforma (textos, imágenes, datos de negocio) es de su propiedad. El HTML generado por la plataforma es de su uso exclusivo. WeblyNow conserva derechos sobre la plataforma, su código, diseño y marca.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Uso aceptable</h2>
            <p>Usted se compromete a no usar el Servicio para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Publicar contenido ilegal, difamatorio, fraudulento u obsceno</li>
              <li>Infringir derechos de propiedad intelectual de terceros</li>
              <li>Intentar acceder sin autorización a sistemas o datos de otros usuarios</li>
              <li>Distribuir malware o código malicioso</li>
              <li>Realizar actividades de spam o phishing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Disponibilidad del servicio</h2>
            <p>WeblyNow se esfuerza por mantener el Servicio disponible 24/7, pero no garantiza disponibilidad ininterrumpida. Podremos suspender el Servicio por mantenimiento programado o circunstancias fuera de nuestro control sin previo aviso.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Limitación de responsabilidad</h2>
            <p>En la máxima medida permitida por la ley, WeblyNow no será responsable por daños indirectos, incidentales, especiales o consecuentes derivados del uso o imposibilidad de uso del Servicio. La responsabilidad total no excederá el monto pagado en los últimos 3 meses.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Modificaciones</h2>
            <p>WeblyNow se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados mediante el email registrado con al menos 15 días de anticipación para cambios sustanciales. El uso continuado del Servicio tras los cambios implica su aceptación.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Ley aplicable</h2>
            <p>Estos términos se rigen por las leyes de la República de Chile. Cualquier disputa será sometida a los tribunales ordinarios de justicia de Santiago, Chile.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Contacto</h2>
            <p>Para consultas sobre estos términos, escríbenos a: <a href="mailto:hola@weblynow.com" className="text-indigo-400 hover:text-indigo-300">hola@weblynow.com</a></p>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-3xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 WeblyNow · Chile</p>
          <div className="flex gap-6">
            <Link href="/terminos" className="text-white">Términos</Link>
            <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
