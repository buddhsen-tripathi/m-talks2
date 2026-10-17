import { createFileRoute } from "@tanstack/react-router";
import { PageBody, PageHeader } from "#/components/app-shell.tsx";
import { siteConfig } from "#/config/site.ts";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<>
			<PageHeader title={siteConfig.name} />
			<PageBody />
		</>
	);
}
