

//context/ThemeContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";


//export type ThemeType = "light" | "dark" |  "blue" | "amber" | "system";

export type ThemeType =
    | "light"
    | "dark"
    | "soft-dark"
    | "professional-dark"
    | "blue"
    | "amber"
    | "system"
    | "company";

interface ThemeContextType {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setThemeState] = useState<ThemeType>("light");

    const applyTheme = (selected: ThemeType) => {
        const html = document.documentElement;
        html.classList.remove(
            "light",
            "dark",
            "theme-blue",
            "theme-amber",
            "theme-soft-dark",
            "theme-professional-dark",
            "theme-system",     // ✅ ADD
            "theme-company"     // ✅ ADD
        );

        switch (selected) {
            case "dark":
                html.classList.add("dark");
                break;
            case "soft-dark":
                html.classList.add("theme-soft-dark");
                break;
            case "professional-dark":
                html.classList.add("theme-professional-dark");
                break;
            case "blue":
                html.classList.add("theme-blue");
                break;
            case "amber":
                html.classList.add("theme-amber");
                break;
            case "system":
                html.classList.add("theme-system");   // ✅ ADD
                break;
            case "company":
                html.classList.add("theme-company");  // ✅ ADD
                break;
            default:
                html.classList.add("light");
        }
    };

    // const setTheme = (selected: ThemeType) => {
    //     localStorage.setItem("theme", selected);
    //     setThemeState(selected);
    //     applyTheme(selected);
    // };

    const setTheme = (selected: ThemeType) => {
        localStorage.setItem("theme", selected);
        setThemeState(selected);
        applyTheme(selected);
    };

    // useEffect(() => {
    //     const saved = (localStorage.getItem("theme") as ThemeType) || "light";
    //     setThemeState(saved);
    //     applyTheme(saved);
    // }, []);

    useEffect(() => {
        const saved = (localStorage.getItem("theme") as ThemeType) || "light";
        setThemeState(saved);
        applyTheme(saved);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used inside ThemeProvider");
    return context;
};