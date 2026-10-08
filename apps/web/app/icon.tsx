import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#faf8f5",
			}}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
				<div
					style={{
						width: 18,
						height: 3,
						borderRadius: 2,
						background: "#41648a",
					}}
				/>
				<div
					style={{
						width: 12,
						height: 3,
						borderRadius: 2,
						background: "#5a7a5c",
					}}
				/>
				<div
					style={{
						width: 7,
						height: 3,
						borderRadius: 2,
						background: "#a6836a",
					}}
				/>
			</div>
		</div>,
		{ ...size },
	);
}
