import { BottomSheet as ExpoBottomSheet } from "@expo/ui";
import { withUniwind } from "uniwind";

/**
 * BottomSheet de @expo/ui con className de Uniwind.
 * Usa `containerColorClassName="accent-background"` para pintar el chrome
 * (handle + safe area) con el mismo fondo que el contenido.
 */
export const BottomSheet = withUniwind(ExpoBottomSheet);
