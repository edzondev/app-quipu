import { NextResponse } from "next/server";
import { buildAssetLinks } from "@/lib/assetlinks";

export const dynamic = "force-dynamic";

const jsonHeaders = {
	"Content-Type": "application/json",
} as const;

export function GET() {
	const statements = buildAssetLinks({
		packageName: process.env.ANDROID_PACKAGE,
		fingerprints: process.env.ANDROID_SHA256_CERT_FINGERPRINTS,
	});

	if (!statements) {
		return NextResponse.json(
			{ error: "assetlinks_unconfigured" },
			{ status: 404, headers: { ...jsonHeaders, "Cache-Control": "no-store" } },
		);
	}

	return NextResponse.json(statements, {
		headers: { ...jsonHeaders, "Cache-Control": "public, max-age=300" },
	});
}
