import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";
import { Search } from "reicon-react-native/icons/Search";
import { HIDDEN_UNTIL_READY } from "@/shared/hidden-until-ready";
import type { CycleMovementsResult } from "@/shared/lib/expenses/expense-record";
import {
	MOVEMENT_FILTERS,
	type MovementFilter,
	type MovementListRow,
	type MovementMetaTone,
	type MovementTone,
	presentMovementList,
} from "@/shared/lib/movements/model";

export const MOVEMENT_SEARCH_DEBOUNCE_MS = 300;

// Entrada mínima del buscador: aparece con un fundido y baja 6 px.
const SEARCH_ENTERING = FadeInDown.duration(180)
	.easing(Easing.bezier(0.23, 1, 0.32, 1))
	.withInitialValues({ opacity: 0, transform: [{ translateY: -6 }] });

const EMPTY_TITLE = "Todavía no hay nada registrado en este ciclo.";
const EMPTY_BODY = "Cada gasto que registres aparecerá aquí, ordenado por día y con su sobre.";
const FILTER_EMPTY = "Ningún movimiento con ese criterio.";

const DOT: Record<MovementTone, string> = {
	needs: "bg-needs",
	wants: "bg-wants",
	savings: "bg-savings",
	income: "bg-primary",
};

const META: Record<MovementMetaTone, string> = {
	detected: "text-primary",
	note: "text-warning",
	muted: "text-foreground/45",
};

const VISIBLE_FILTERS = MOVEMENT_FILTERS.filter(
	(item) => item.id !== "savings" || !HIDDEN_UNTIL_READY.movementsSavingsFilter,
);

const AMOUNT: Record<MovementListRow["amountTone"], string> = {
	out: "text-foreground",
	in: "text-primary",
};

type Props = {
	status: "loading" | "ready";
	data: CycleMovementsResult | null;
	now?: number;
	onOpenExpense: (id: string) => void;
	onCreate: () => void;
};

export function MovementsList({ status, data, now, onOpenExpense, onCreate }: Props) {
	const [filter, setFilter] = useState<MovementFilter>("all");
	const [query, setQuery] = useState("");
	const [searchOpen, setSearchOpen] = useState(false);
	const model =
		status === "ready"
			? presentMovementList(data, { filter, query, now: now ?? Date.now() })
			: null;

	function toggleSearch() {
		setQuery("");
		setSearchOpen((open) => !open);
	}

	return (
		<ScrollView
			className="flex-1"
			contentContainerClassName="grow pb-8"
			keyboardShouldPersistTaps="handled"
			showsVerticalScrollIndicator={false}
		>
			<View className="flex-row items-center justify-between">
				<Text className="font-newsreader text-[27px] leading-8 text-foreground">Movimientos</Text>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Buscar"
					hitSlop={12}
					onPress={toggleSearch}
					className="active:scale-90 active:opacity-60"
				>
					<Search size={20} color="#6B6B6B" />
				</Pressable>
			</View>

			{searchOpen ? <SearchField onChange={setQuery} /> : null}

			{model ? (
				<Text className="mt-2.5 font-geist-mono text-[11px] uppercase tracking-[0.12em] text-foreground/45">
					{model.cycleLine}
				</Text>
			) : null}

			{model && !model.isEmpty ? (
				<View className="mt-[18px] flex-row flex-wrap gap-[7px]">
					{VISIBLE_FILTERS.map((item) => (
						<FilterChip
							key={item.id}
							label={item.label}
							selected={filter === item.id}
							onPress={() => setFilter(item.id)}
						/>
					))}
				</View>
			) : null}

			{status === "loading" ? (
				<View className="flex-1 items-center justify-center py-16">
					<Text className="font-hanken text-[15px] text-foreground/55">Cargando…</Text>
				</View>
			) : null}

			{model?.isEmpty ? (
				<EmptyState
					onCreate={onCreate}
					label={model.hasCycle ? "Registrar gasto" : "Registrar ingreso"}
				/>
			) : null}
			{model?.isFilterEmpty ? (
				<Text className="py-10 text-center font-hanken text-[15px] text-foreground/55">
					{FILTER_EMPTY}
				</Text>
			) : null}

			{model?.groups.map((group) => (
				<View key={group.key} className="mt-6">
					<View className="flex-row items-baseline justify-between">
						<Text className="font-geist-mono text-[10.5px] uppercase tracking-[0.14em] text-foreground/55">
							{group.title}
						</Text>
						<Text className="font-geist-mono text-[11.5px] text-foreground/45">
							{group.totalLabel}
						</Text>
					</View>
					<View className="mt-1">
						{group.rows.map((row) => (
							<MovementRow key={row.id} row={row} onOpen={onOpenExpense} />
						))}
					</View>
				</View>
			))}
		</ScrollView>
	);
}

function SearchField({ onChange }: { onChange: (query: string) => void }) {
	const form = useForm({ defaultValues: { query: "" } });

	return (
		<Animated.View entering={SEARCH_ENTERING}>
			<form.Field
				name="query"
				listeners={{
					onChange: ({ value }) => onChange(value),
					onChangeDebounceMs: MOVEMENT_SEARCH_DEBOUNCE_MS,
				}}
			>
				{(field) => (
					<TextInput
						accessibilityLabel="Buscar movimientos"
						autoCapitalize="none"
						autoCorrect={false}
						autoFocus
						className="mt-3 border-b border-line pb-2 font-hanken text-[16px] text-foreground"
						onChangeText={field.handleChange}
						onBlur={field.handleBlur}
						placeholder="Buscar"
						placeholderTextColor="#8C8880"
						value={field.state.value}
					/>
				)}
			</form.Field>
		</Animated.View>
	);
}

function FilterChip({
	label,
	selected,
	onPress,
}: {
	label: string;
	selected: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ selected }}
			onPress={onPress}
			className={`rounded-full px-[13px] py-[7px] ${
				selected ? "bg-foreground" : "border border-line"
			}`}
		>
			<Text
				className={`font-hanken-semibold text-[12.5px] ${
					selected ? "text-background" : "text-foreground/55"
				}`}
			>
				{label}
			</Text>
		</Pressable>
	);
}

function MovementRow({ row, onOpen }: { row: MovementListRow; onOpen: (id: string) => void }) {
	const body = (
		<View className="flex-row items-center justify-between border-b border-line py-3">
			<View className="min-w-0 flex-1 flex-row items-center gap-[11px] pr-3">
				<View className={`h-1.5 w-1.5 rounded-full ${DOT[row.dot]}`} />
				<View className="min-w-0 flex-1">
					<Text className="font-hanken-semibold text-[14.5px] text-foreground" numberOfLines={1}>
						{row.label}
					</Text>
					{row.meta ? (
						<Text
							className={`mt-[5px] font-geist-mono text-[11.5px] uppercase ${
								row.metaTone ? META[row.metaTone] : "text-foreground/45"
							}`}
							numberOfLines={1}
						>
							{row.meta}
						</Text>
					) : null}
				</View>
			</View>
			<Text
				className={`font-hanken-semibold text-[14.5px] tabular-nums ${AMOUNT[row.amountTone]}`}
				selectable
			>
				{row.amountLabel}
			</Text>
		</View>
	);

	if (!row.opensExpense) return body;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`${row.label}, ${row.amountLabel}`}
			onPress={() => onOpen(row.id)}
		>
			{body}
		</Pressable>
	);
}

function EmptyState({ onCreate, label }: { onCreate: () => void; label: string }) {
	return (
		<View className="flex-1 items-center justify-center px-2 py-10">
			<EmptyArt />
			<Text className="text-center font-newsreader text-[23px] leading-8 text-foreground">
				{EMPTY_TITLE}
			</Text>
			<Text className="mt-3 max-w-[300px] text-center font-hanken text-[14.5px] leading-6 text-foreground/55">
				{EMPTY_BODY}
			</Text>
			<Pressable
				accessibilityRole="button"
				className="mt-6 rounded-xl bg-foreground px-[22px] py-3.5"
				onPress={onCreate}
			>
				<Text className="font-hanken-semibold text-[14px] text-background">{label}</Text>
			</Pressable>
		</View>
	);
}

function EmptyArt() {
	return (
		<View
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			className="mb-7 h-40 w-40 items-center justify-center"
		>
			<View className="absolute h-36 w-36 rounded-full bg-primary/10" />
			<View className="h-[92px] w-[74px] rounded-2xl border border-line bg-background px-3 pt-3">
				<View className="mb-2 h-2 w-8 rounded-full bg-wants" />
				<View className="mb-1.5 h-1.5 w-full rounded-full bg-foreground/10" />
				<View className="h-1.5 w-10 rounded-full bg-foreground/10" />
				<View className="mt-3 flex-row items-center gap-1.5">
					<View className="h-1.5 w-1.5 rounded-full bg-needs" />
					<View className="h-1.5 flex-1 rounded-full bg-foreground/10" />
				</View>
				<View className="mt-2 flex-row items-center gap-1.5">
					<View className="h-1.5 w-1.5 rounded-full bg-wants" />
					<View className="h-1.5 flex-1 rounded-full bg-foreground/10" />
				</View>
				<View className="mt-2 flex-row items-center gap-1.5">
					<View className="h-1.5 w-1.5 rounded-full bg-savings" />
					<View className="h-1.5 w-8 rounded-full bg-foreground/10" />
				</View>
			</View>
		</View>
	);
}
