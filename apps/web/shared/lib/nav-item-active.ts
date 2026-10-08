export function navItemActive(pathname: string, href: string) {
	if (href === "/settings") {
		return pathname === href || pathname.startsWith(`${href}/`);
	}
	if (href === "/income/register") {
		return pathname === href || pathname.startsWith(`${href}/`);
	}
	if (href === "/movements") {
		return pathname === href || pathname.startsWith(`${href}/`);
	}
	return pathname === href;
}
