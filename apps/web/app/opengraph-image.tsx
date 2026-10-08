import { ImageResponse } from "next/og";
import { siteConfig } from "@/core/seo";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: 72,
				background: "#faf8f5",
				color: "#1c1b19",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
				<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
					<div
						style={{
							width: 56,
							height: 8,
							borderRadius: 4,
							background: "#41648a",
						}}
					/>
					<div
						style={{
							width: 38,
							height: 8,
							borderRadius: 4,
							background: "#5a7a5c",
						}}
					/>
					<div
						style={{
							width: 22,
							height: 8,
							borderRadius: 4,
							background: "#a6836a",
						}}
					/>
				</div>
				<span style={{ fontSize: 56, fontWeight: 600 }}>{siteConfig.name}</span>
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
				<p style={{ fontSize: 48, fontWeight: 600, margin: 0, lineHeight: 1.15 }}>
					{siteConfig.tagline}
				</p>
				<p style={{ fontSize: 28, margin: 0, color: "#5c5a57", maxWidth: 900 }}>
					{siteConfig.landingLine} Tres sobres, claridad en soles.
				</p>
			</div>
		</div>,
		{ ...size },
	);
}
