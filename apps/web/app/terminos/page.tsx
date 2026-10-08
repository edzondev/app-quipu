import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/core/seo";
import { LegalShell } from "@/modules/legal/components/legal-shell";

export const metadata: Metadata = pageMetadata({
	title: "Términos del servicio",
	description:
		"Condiciones de uso de Quipu: qué es el servicio, planes y pagos, tus datos y las reglas del juego.",
	path: "/terminos",
	index: true,
});

const SECTION_HEADING = "font-serif text-[19px] font-medium text-ink";
const SECTION_BODY = "mt-2";

export default function TerminosPage() {
	return (
		<LegalShell title="Términos del servicio" updatedAt="22 de julio de 2026">
			<section>
				<h2 className={SECTION_HEADING}>1. Qué es Quipu</h2>
				<p className={SECTION_BODY}>
					Quipu es una herramienta de organización financiera personal: divide tu dinero en sobres,
					muestra cuánto puedes gastar y te ayuda a cubrir tus compromisos. Quipu no es un banco, no
					mueve ni custodia tu dinero, y no ofrece asesoría financiera, contable ni de inversión.
					Las decisiones que tomas con tu dinero son tuyas.
				</p>
			</section>

			<section>
				<h2 className={SECTION_HEADING}>2. Tu cuenta</h2>
				<p className={SECTION_BODY}>
					Debes ser mayor de 18 años y registrar datos veraces. El acceso es personal: eres
					responsable de tu passkey, tu contraseña y de la actividad que ocurra dentro de tu cuenta.
					Si detectas un acceso no autorizado, escríbenos de inmediato.
				</p>
			</section>

			<section>
				<h2 className={SECTION_HEADING}>3. Planes y pagos</h2>
				<p className={SECTION_BODY}>
					El plan gratuito es completo y sin límite de registros manuales. Quipu Plus (mensual o
					anual; precios según mercado — p. ej. S/ 14.90/mes o S/ 119.90/año en Perú; equivalentes
					en EUR y USD) agrega automatización y se cobra por adelantado a través de Polar.sh,
					nuestro procesador de pagos; no almacenamos los datos de tu tarjeta. La suscripción se
					renueva automáticamente y puedes cancelarla en cualquier momento desde Ajustes: conservas
					Plus hasta el final del periodo ya pagado. No hay reembolsos parciales, salvo que la ley
					aplicable diga lo contrario.
				</p>
			</section>

			<section>
				<h2 className={SECTION_HEADING}>4. Uso aceptable</h2>
				<p className={SECTION_BODY}>
					Te comprometes a usar Quipu solo para fines lícitos y personales. No está permitido
					intentar acceder a cuentas ajenas, interferir con el servicio, ni usarlo para registrar
					actividad ilegal. Si detectas abuso de la plataforma, repórtalo a{" "}
					<a href="mailto:abuse@quipu-finance.app" className="underline underline-offset-2">
						abuse@quipu-finance.app
					</a>
					.
				</p>
			</section>

			<section>
				<h2 className={SECTION_HEADING}>5. Tus datos</h2>
				<p className={SECTION_BODY}>
					Los datos que registras son tuyos. Puedes exportarlos en cualquier momento y eliminar tu
					cuenta — con todos tus datos — desde Ajustes. El detalle está en la{" "}
					<Link href="/privacidad" className="underline underline-offset-2">
						política de privacidad
					</Link>
					.
				</p>
			</section>

			<section>
				<h2 className={SECTION_HEADING}>6. Disponibilidad y responsabilidad</h2>
				<p className={SECTION_BODY}>
					Trabajamos para que Quipu esté siempre disponible, pero no garantizamos continuidad
					absoluta del servicio. Quipu muestra información organizada por ti y sugerencias
					automáticas; no somos responsables de las decisiones financieras que tomes con esa
					información. En la máxima medida permitida por la ley, nuestra responsabilidad total se
					limita al monto que hayas pagado por Quipu Plus en los últimos 12 meses.
				</p>
			</section>

			<section>
				<h2 className={SECTION_HEADING}>7. Cambios a estos términos</h2>
				<p className={SECTION_BODY}>
					Si estos términos cambian, lo avisaremos dentro de la app con anticipación razonable.
					Seguir usando Quipu después del aviso significa que aceptas la versión vigente.
				</p>
			</section>

			<section>
				<h2 className={SECTION_HEADING}>8. Ley aplicable y contacto</h2>
				<p className={SECTION_BODY}>
					Estos términos se rigen por las leyes de la República del Perú. Cualquier consulta sobre
					ellos puede hacerse al correo de soporte: soporte@quipu.pe.
				</p>
			</section>
		</LegalShell>
	);
}
