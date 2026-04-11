"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch by waiting until component is mounted
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Render a placeholder button of the exact same size to avoid layout shift
        return <button className="w-10 h-10 rounded-full bg-zinc-800/20" />;
    }

    const isDark = theme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden ${isDark
                    ? "bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                    : "bg-white border border-gray-200 hover:bg-gray-100 text-black shadow-md"
                }`}
            aria-label="Toggle theme"
        >
            <div className={`absolute transition-all duration-500 ease-in-out ${isDark ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"}`}>
                <Moon className="w-5 h-5 text-gray-200" />
            </div>

            <div className={`absolute transition-all duration-500 ease-in-out ${isDark ? "rotate-90 opacity-0" : "rotate-0 opacity-100"}`}>
                <Sun className="w-5 h-5 text-amber-500" />
            </div>
        </button>
    );
}
