"use client";

import type { IconProps } from "reicon-react";
import { BillList } from "reicon-react/icons/BillList";
import { Bullseye } from "reicon-react/icons/Bullseye";
import { Gear } from "reicon-react/icons/Gear";
import { HandDollar } from "reicon-react/icons/HandDollar";
import { Home } from "reicon-react/icons/Home";
import { Layer } from "reicon-react/icons/Layer";
import { MoneyPlus } from "reicon-react/icons/MoneyPlus";
import { Settings } from "reicon-react/icons/Settings";

type Props = {
	label: string;
	active?: boolean;
} & IconProps;

function iconColor(active: boolean | undefined): string {
	return active ? "var(--qp-deep)" : "var(--mute)";
}

export function AppNavIcon({ label, active, size = 18 }: Props) {
	const color = iconColor(active);

	switch (label) {
		case "Inicio":
			return <Home color={color} size={size} weight={active ? "Filled" : "Outline"} />;
		case "Registrar":
			return <MoneyPlus color={color} size={size} weight={active ? "Filled" : "Outline"} />;
		case "Movimientos":
			return <BillList color={color} size={size} weight={active ? "Filled" : "Outline"} />;
		case "Ahorros":
			return <HandDollar color={color} size={size} weight={active ? "Filled" : "Outline"} />;
		case "Compromisos":
			return <Bullseye color={color} size={size} weight={active ? "Filled" : "Outline"} />;
		case "Espacios":
			return <Layer color={color} size={size} weight={active ? "Filled" : "Outline"} />;
		case "Ajustes":
			return <Gear color={color} size={size} weight={active ? "Filled" : "Outline"} />;
		default:
			return <Settings size={size} color={color} weight="Outline" />;
	}
}
