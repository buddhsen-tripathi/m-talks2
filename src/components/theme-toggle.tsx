import { Moon, Sun } from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import { useTheme } from "#/hooks/use-theme.ts";

export function ThemeToggle({ className }: { className?: string }) {
	const { resolvedTheme, toggleTheme } = useTheme();
	const label =
		resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode";

	return (
		<Button
			variant="ghost"
			size="icon-sm"
			onClick={toggleTheme}
			aria-label={label}
			title={label}
			className={className}
		>
			{resolvedTheme === "dark" ? <Sun /> : <Moon />}
		</Button>
	);
}
