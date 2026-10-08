import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#faf8f5",
				borderRadius: 36,
			}}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
				<div
					style={{
						width: 72,
						height: 12,
						borderRadius: 4,
						background: "#41648a",
					}}
				/>
				<div
					style={{
						width: 48,
						height: 12,
						borderRadius: 4,
						background: "#5a7a5c",
					}}
				/>
				<div
					style={{
						width: 28,
						height: 12,
						borderRadius: 4,
						background: "#a6836a",
					}}
				/>
			</div>
		</div>,
		{ ...size },
	);
}
