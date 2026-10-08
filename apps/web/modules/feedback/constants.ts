export const FEEDBACK_PAGE_TITLE = "Cuéntanos";
export const FEEDBACK_PAGE_SUBTITLE = "Problemas, ideas o consultas. Lo leemos en persona.";
export const FEEDBACK_CATEGORY_LABEL = "¿De qué se trata?";
export const FEEDBACK_CATEGORY_PROBLEM = "Problema";
export const FEEDBACK_CATEGORY_IMPROVEMENT = "Mejora";
export const FEEDBACK_CATEGORY_QUESTION = "Consulta";
export const FEEDBACK_MESSAGE_LABEL = "Tu mensaje";
export const FEEDBACK_MESSAGE_PLACEHOLDER =
	"Cuéntanos con detalle qué pasó o qué te gustaría mejorar…";
export const FEEDBACK_SUBMIT = "Enviar mensaje";
export const FEEDBACK_SUBMITTING = "Enviando…";
export const FEEDBACK_SUCCESS = "Gracias. Recibimos tu mensaje.";
export const FEEDBACK_ERROR = "No pudimos enviar tu mensaje. Intenta de nuevo.";
export const FEEDBACK_FOOTER = "También puedes escribir a soporte@quipu.pe";

export const FEEDBACK_CATEGORY_OPTIONS = [
	{ value: "problem", label: FEEDBACK_CATEGORY_PROBLEM },
	{ value: "improvement", label: FEEDBACK_CATEGORY_IMPROVEMENT },
	{ value: "question", label: FEEDBACK_CATEGORY_QUESTION },
] as const;
