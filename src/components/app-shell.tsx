import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { ThemeToggle } from "#/components/theme-toggle.tsx";
import { Button } from "#/components/ui/button.tsx";
import { mainNav } from "#/config/nav.ts";
import { siteConfig } from "#/config/site.ts";
import { cn } from "#/lib/utils.ts";

function Brand() {
	return (
		<Link to="/" className="font-semibold tracking-tight">
			{siteConfig.name}
		</Link>
	);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
	return (
		<nav className="flex flex-col gap-1">
			{mainNav.map(({ to, label, icon: Icon, exact }) => (
				<Link
					key={to}
					to={to}
					activeOptions={{ exact }}
					onClick={onNavigate}
					className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
					activeProps={{
						className:
							"bg-sidebar-accent font-medium text-sidebar-accent-foreground",
					}}
				>
					<Icon className="size-4 shrink-0" />
					{label}
				</Link>
			))}
		</nav>
	);
}

/** Sidebar layout on desktop, top bar + drawer on mobile. */
export function AppShell({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex min-h-screen flex-col md:flex-row">
			{/* Desktop sidebar */}
			<aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
				<div className="px-5 py-5">
					<Brand />
				</div>
				<div className="flex-1 px-3 py-2">
					<NavLinks />
				</div>
				<div className="px-3 py-4">
					<ThemeToggle />
				</div>
			</aside>

			{/* Mobile top bar */}
			<header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur md:hidden">
				<Brand />
				<Button
					variant="outline"
					size="icon"
					aria-label="Open menu"
					onClick={() => setOpen(true)}
				>
					<Menu />
				</Button>
			</header>

			{/* Mobile drawer */}
			<div
				className={cn(
					"fixed inset-0 z-50 md:hidden",
					open ? "pointer-events-auto" : "pointer-events-none",
				)}
				aria-hidden={!open}
			>
				<button
					type="button"
					aria-label="Close menu"
					tabIndex={open ? 0 : -1}
					className={cn(
						"absolute inset-0 bg-foreground/40 transition-opacity duration-300",
						open ? "opacity-100" : "opacity-0",
					)}
					onClick={() => setOpen(false)}
				/>
				<div
					className={cn(
						"absolute top-0 left-0 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-300 ease-out",
						open ? "translate-x-0" : "-translate-x-full",
					)}
				>
					<div className="flex items-center justify-between px-5 py-5">
						<Brand />
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Close menu"
							onClick={() => setOpen(false)}
						>
							<X />
						</Button>
					</div>
					<div className="flex-1 px-3">
						<NavLinks onNavigate={() => setOpen(false)} />
					</div>
					<div className="px-3 py-4">
						<ThemeToggle />
					</div>
				</div>
			</div>

			<main className="min-w-0 flex-1">{children}</main>
		</div>
	);
}

/** Standard header at the top of each route. */
export function PageHeader({
	title,
	description,
	children,
}: {
	title: ReactNode;
	description?: ReactNode;
	/** Right-aligned actions. */
	children?: ReactNode;
}) {
	return (
		<div className="border-b px-4 py-5 md:px-8 md:py-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
				<div className="min-w-0 space-y-1.5">
					<h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
						{title}
					</h1>
					{description ? (
						<p className="max-w-prose text-sm text-muted-foreground">
							{description}
						</p>
					) : null}
				</div>
				{children ? (
					<div className="flex flex-wrap items-center gap-2">{children}</div>
				) : null}
			</div>
		</div>
	);
}

/** Standard padded content area below a PageHeader. */
export function PageBody({
	className,
	children,
}: {
	className?: string;
	children?: ReactNode;
}) {
	return <div className={cn("px-4 py-6 md:px-8", className)}>{children}</div>;
}
