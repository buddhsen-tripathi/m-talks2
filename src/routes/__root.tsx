import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type * as React from "react";
import { AppShell } from "#/components/app-shell.tsx";
import { Toaster } from "#/components/ui/sonner.tsx";
import { siteConfig } from "#/config/site.ts";
import TanStackQueryDevtools from "#/integrations/tanstack-query/devtools.tsx";
import { themeBootstrapScript } from "#/lib/theme.ts";
import appCss from "#/styles.css?url";

interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: siteConfig.name },
			...(siteConfig.description
				? [{ name: "description", content: siteConfig.description }]
				: []),
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
		],
	}),
	notFoundComponent: NotFound,
	shellComponent: RootDocument,
});

function NotFound() {
	return (
		<div className="px-4 py-16 text-center">
			<h1 className="text-lg font-semibold">Page not found</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				This URL does not match any route.
			</p>
			<Link
				to="/"
				className="mt-4 inline-block text-sm text-primary underline underline-offset-4"
			>
				Go home
			</Link>
		</div>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
				{/* Apply the saved theme before paint to avoid a flash. */}
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: static theme bootstrap, no user input
					dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
				/>
			</head>
			<body>
				<AppShell>{children}</AppShell>
				<Toaster position="top-right" />
				{import.meta.env.DEV ? (
					<TanStackDevtools
						config={{ position: "bottom-right" }}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
				) : null}
				<Scripts />
			</body>
		</html>
	);
}
