// Escapa el correo para usarlo dentro de un regex de Maestro.
// Confirmar que QUIPU_E2E_EMAIL llega como variable global del entorno.
var raw = typeof QUIPU_E2E_EMAIL === "string" ? QUIPU_E2E_EMAIL : "";
output.emailRe = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
