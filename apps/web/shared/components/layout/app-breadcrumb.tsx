"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import { type Crumb, resolveBreadcrumbs } from "@/shared/lib/breadcrumbs";
import { cn } from "@/shared/lib/utils";

type Props = {
	items?: Crumb[] | "auto";
	className?: string;
};

export function AppBreadcrumb({ items = "auto", className }: Props) {
	const pathname = usePathname();
	const resolved = items === "auto" ? resolveBreadcrumbs(pathname) : items;

	if (!resolved?.length) return null;

	return (
		<Breadcrumb className={cn("mb-4", className)}>
			<BreadcrumbList className="gap-1 text-[12.5px] text-mute sm:gap-1.5">
				{resolved.map((crumb, index) => {
					const isLast = index === resolved.length - 1;

					return (
						<span key={crumb.href ?? crumb.label} className="contents">
							{index > 0 ? <BreadcrumbSeparator /> : null}
							<BreadcrumbItem>
								{isLast || !crumb.href ? (
									<BreadcrumbPage className="font-medium text-ink-secondary">
										{crumb.label}
									</BreadcrumbPage>
								) : (
									<Link
										href={crumb.href}
										className="text-mute transition-colors hover:text-ink-secondary motion-reduce:transition-none"
									>
										{crumb.label}
									</Link>
								)}
							</BreadcrumbItem>
						</span>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
