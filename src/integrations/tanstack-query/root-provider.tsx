import { QueryClient } from "@tanstack/react-query";

/**
 * One QueryClient per router instance. getRouter() runs once per request on
 * the server and once in the browser, so server caches never leak between users.
 */
export function getContext() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				refetchOnWindowFocus: false,
			},
		},
	});

	return { queryClient };
}
