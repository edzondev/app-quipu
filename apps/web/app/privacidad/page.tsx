import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/convex/lib/supportEmail";
import { pageMetadata } from "@/core/seo";
import { LegalShell } from "@/modules/legal/components/legal-shell";

export const metadata: Metadata = pageMetadata({
	title: "Política de privacidad",
	description:
		"Cómo Quipu recaba, usa y protege tus datos personales, conforme a la Ley N.° 29733 de Protección de Datos Personales del Perú.",
	path: "/privacidad",
	index: true,
});

const SECTION_HEADING = "font-serif text-[19px] font-medium text-ink";
const SECTION_BODY = "mt-2";
const LIST = "mt-2 list-disc space-y-1 pl-5";

export default function PrivacidadPage() {
	return (
		<LegalShell title="Política de privacidad" updatedAt="23 de octubre de 2026">
			<section>
				<h2 className={SECTION_HEADING}>1. Responsable del tratamiento</h2>
				<p className={SECTION_BODY}>
					El titular del banco de datos personales es Quipu (
					<a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-2">
						{SUPPORT_EMAIL}
					</a>
					). Tratamos tus datos conforme a la Ley N.° 29733, Ley de Protección de Datos Personales
					del Perú, y su reglamento.
				</p>
			</section>

			<section>
				<h2 className={SECTION_HEADING}>2. Qué datos recabamos</h2>
				<ul className={LIST}>
					<li>
						<strong className="font-semibold text-ink">De cuenta:</strong> nombre y correo
						electrónico. Las passkeys y contraseñas se almacenan cifradas; nunca las vemos.
					</li>
					<li>
						<strong className="font-semibold text-ink">Financieros:</strong> los ingresos, gastos,
						sobres, compromisos, metas y reglas que registras. Los montos se guardan tal como tú los
						escribes.
					</li>
					<li>
						<strong className="font-semibold text-ink">De uso:</strong> eventos de navegación y
						rendimiento (PostHog). La grabación de sesión enmascara los textos del área privada,
						incluidos tus saldos.
					</li>
					<li>
						<strong className="font-semibold text-ink">De notificaciones bancarias:</strong> en la
						app de Android, y solo si das acceso a las notificaciones, Quipu lee el texto de las
						notificaciones de los bancos que elegiste (por ejemplo, el monto y el comercio). Ese
						texto se procesa y se guarda solo en tu teléfono hasta que guardes o descartes el gasto.
						A nuestros servidores solo llegan los gastos que confirmas: el monto, la descripción, el
						sobre y un identificador de la notificación para evitar duplicados. El resto nunca se
						envía.
					</li>
				</ul>
			</section>

			<section>
				<h2 className={SECTION_HEADING}>3. Para qué los usamos</h2>
				<ul className={LIST}>
					<li>Operar el servicio: tus sobres, ciclos, coach y reportes.</li>
					<li>Gestionar tu suscripción a Quipu Plus.</li>
					<li>Mejorar el producto a partir de patrones de uso agregados.</li>
					<li>Seguridad: prevención de abuso y acceso no autorizado.</li>
				</ul>
				<p className={SECTION_BODY}>
					No vendemos tus datos ni los usamos para publicidad de terceros.
				</p>
			</section>

			<section>
				<h2 className={SECTION_HEADING}>4. Encargados y transferencias</h2>
				<p className={SECTION_BODY}>
					Para operar usamos proveedores que tratan datos como encargados, lo que implica
					transferencia internacional de datos:
				</p>
				<ul className={LIST}>
					<li>Convex / Amazon Web Services (EE. UU.) — base de datos y backend.</li>
					<li>Polar.sh — procesamiento de pagos de Quipu Plus.</li>
					<li>PostHog — analítica de uso con enmascaramiento.</li>
					<li>Resend — correos transaccionales (verificación y recuperación).</li>
					<li>Sentry — monitoreo de errores en la versión web.</li>
				</ul>
				<p className={SECTION_BODY}>
					Al crear una cuenta consientes estas transferencias, necesarias para prestar el servicio.
				</p>
			</section>

			<section>
				<h2 className={SECTION_HEADING}>5. Conservación y eliminación</h2>
				<p className={SECTION_BODY}>
					Conservamos tus datos mientras tu cuenta exista. Si eliminas tu cuenta, tus datos
					personales se borran de nuestros sistemas activos de forma inmediata y de nuestros
					respaldos en un plazo máximo de 30 días, salvo que la ley nos obligue a conservarlos por
					más tiempo.
				</p>
			</section>

			<section id="eliminar-cuenta">
				<h2 className={SECTION_HEADING}>Eliminar cuenta</h2>
				<p className={SECTION_BODY}>
					Puedes eliminar tu cuenta desde la app, en {"Ajustes > Eliminar cuenta"}, o por correo a{" "}
					<a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-2">
						{SUPPORT_EMAIL}
					</a>
					.
				</p>
				<p className={SECTION_BODY}>
					Se eliminan tu perfil, ciclos, sobres, movimientos/gastos, compromisos, metas y sesiones.
				</p>
				<p className={SECTION_BODY}>
					Los datos se borran de inmediato de nuestros sistemas activos y de los respaldos en un
					plazo máximo de 30 días, salvo que la ley nos obligue a conservar alguno.
				</p>
				<p className={SECTION_BODY}>
					Si tienes una suscripción activa, primero debes cancelarla desde el portal de pagos; luego
					podrás eliminar tu cuenta.
				</p>
			</section>

			<section>
				<h2 className={SECTION_HEADING}>6. Tus derechos (ARCO)</h2>
				<p className={SECTION_BODY}>
					Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición: la
					exportación completa de tus datos y la eliminación de tu cuenta están disponibles en
					Ajustes, sin intermediarios. Para cualquier otra solicitud, escríbenos a{" "}
					<a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-2">
						{SUPPORT_EMAIL}
					</a>{" "}
					y responderemos en los plazos de la Ley N.° 29733.
				</p>
			</section>

			<section>
				<h2 className={SECTION_HEADING}>7. Seguridad</h2>
				<p className={SECTION_BODY}>
					Acceso con passkeys (WebAuthn) y contraseña cifrada, cifrado en tránsito (TLS), control de
					acceso por usuario en cada consulta del backend y registros de actividad. Ningún sistema
					es infalible; si detectas una vulnerabilidad, agradeceremos que la reportes antes de
					divulgarla.
				</p>
			</section>

			<section>
				<h2 className={SECTION_HEADING}>8. Cookies</h2>
				<p className={SECTION_BODY}>
					Usamos únicamente cookies técnicas de sesión y de analítica propia. No usamos cookies
					publicitarias.
				</p>
			</section>

			<section>
				<h2 className={SECTION_HEADING}>9. Cambios a esta política</h2>
				<p className={SECTION_BODY}>
					Si esta política cambia de forma sustancial, lo avisaremos dentro de la app antes de que
					entre en vigencia.
				</p>
			</section>
		</LegalShell>
	);
}
