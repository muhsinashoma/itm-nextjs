
// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",

    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],

    theme: {
        extend: {

            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                muted: "var(--muted)",
                border: "var(--border)",
                "muted-foreground": "var(--muted-foreground)",
                primary: "var(--primary)",
                "primary-foreground": "var(--primary-foreground)",
                secondary: "var(--secondary)",
                "secondary-foreground": "var(--secondary-foreground)",
                accent: "var(--accent)",
                "accent-foreground": "var(--accent-foreground)",
            },

            /* ✅ DASHBOARD TYPOGRAPHY SCALE (SMALL + CLEAN) */
            fontSize: {
                "dashboard": ["0.75rem", { lineHeight: "1.1rem" }],

                "dashboard-label": ["0.65rem", { lineHeight: "0.9rem" }],
                "dashboard-title": ["0.8rem", { lineHeight: "1.1rem" }],

                "dashboard-kpi": ["0.85rem", { lineHeight: "1.2rem" }],
                "dashboard-value": ["0.72rem", { lineHeight: "1rem" }],
                "dashboard-status": ["0.65rem", { lineHeight: "0.85rem" }],
            },

            borderRadius: {
                xl: "0.875rem",
            },

            boxShadow: {
                card: "0 1px 3px rgba(0,0,0,0.08)",
            },
        },
    },

    safelist: [
        { pattern: /^theme-/ },
        "dark",
        "light",
    ],

    plugins: [],
};





// tailwind.config.js

// /** @type {import('tailwindcss').Config} */
// module.exports = {
//     darkMode: "class",

//     content: [
//         "./app/**/*.{js,ts,jsx,tsx}",
//         "./components/**/*.{js,ts,jsx,tsx}",
//     ],

//     theme: {
//         extend: {

//             colors: {
//                 background: "var(--background)",
//                 foreground: "var(--foreground)",
//                 muted: "var(--muted)",
//                 border: "var(--border)",
//                 "muted-foreground": "var(--muted-foreground)",
//                 primary: "var(--primary)",
//                 "primary-foreground": "var(--primary-foreground)",
//                 secondary: "var(--secondary)",
//                 "secondary-foreground": "var(--secondary-foreground)",
//                 accent: "var(--accent)",
//                 "accent-foreground": "var(--accent-foreground)",
//             },

//             /* ✅ PROFESSIONAL COMPACT DASHBOARD TYPOGRAPHY */
//             fontSize: {
//                 // Card Titles
//                 "dashboard-title": ["0.75rem", { lineHeight: "1rem" }], // 12px

//                 // Labels / small text
//                 "dashboard-label": ["0.6875rem", { lineHeight: "0.95rem" }], // 11px

//                 // Normal values
//                 "dashboard-value": ["0.8125rem", { lineHeight: "1.1rem" }], // 13px

//                 // KPI numbers
//                 "dashboard-kpi": ["1rem", { lineHeight: "1.4rem" }], // 16px

//                 // Badge / status
//                 "dashboard-badge": ["0.625rem", { lineHeight: "0.875rem" }], // 10px
//             },

//             borderRadius: {
//                 xl: "0.875rem",
//             },

//             boxShadow: {
//                 card: "0 1px 3px rgba(0,0,0,0.08)",
//             },
//         },
//     },

//     safelist: [
//         {
//             pattern: /^theme-/,
//         },
//         "dark",
//         "light",
//     ],

//     plugins: [],
// };





//tailwind.config.js

// /** @type {import('tailwindcss').Config} */
// module.exports = {
//     darkMode: "class",

//     content: [
//         "./app/**/*.{js,ts,jsx,tsx}",
//         "./components/**/*.{js,ts,jsx,tsx}",
//     ],

//     theme: {
//         extend: {

//             colors: {
//                 background: "var(--background)",
//                 foreground: "var(--foreground)",
//                 muted: "var(--muted)",
//                 border: "var(--border)",
//                 "muted-foreground": "var(--muted-foreground)",
//                 primary: "var(--primary)",
//                 "primary-foreground": "var(--primary-foreground)",
//                 secondary: "var(--secondary)",
//                 "secondary-foreground": "var(--secondary-foreground)",
//                 accent: "var(--accent)",
//                 "accent-foreground": "var(--accent-foreground)",
//             },

//             /* ✅ GLOBAL DASHBOARD TYPOGRAPHY */
//             // tailwind.config.js

//             fontSize: {
//                 "dashboard-title": ["0.875rem", { lineHeight: "1.25rem" }], // 14px
//                 "dashboard-label": ["0.75rem", { lineHeight: "1rem" }],     // 12px
//                 "dashboard-value": ["0.875rem", { lineHeight: "1.25rem" }], // 14px
//                 "dashboard-kpi": ["1.125rem", { lineHeight: "1.75rem" }],   // 18px
//                 "dashboard-badge": ["0.75rem", { lineHeight: "1rem" }],     // 12px
//             },

//         },
//     },

//     safelist: [
//         {
//             pattern: /^theme-/,
//         },
//         "dark",
//         "light",
//     ],

//     plugins: [],
// };





// //tailwind.config.js

// /** @type {import('tailwindcss').Config} */
// module.exports = {
//     darkMode: "class",

//     content: [
//         "./app/**/*.{js,ts,jsx,tsx}",
//         "./components/**/*.{js,ts,jsx,tsx}",
//     ],

//     theme: {
//         extend: {
//             colors: {
//                 background: "var(--background)",
//                 foreground: "var(--foreground)",
//                 muted: "var(--muted)",
//                 border: "var(--border)",
//                 "muted-foreground": "var(--muted-foreground)",
//                 primary: "var(--primary)",
//                 "primary-foreground": "var(--primary-foreground)",
//                 secondary: "var(--secondary)",
//                 "secondary-foreground": "var(--secondary-foreground)",
//                 accent: "var(--accent)",
//                 "accent-foreground": "var(--accent-foreground)",
//             },
//         },
//     },

//     // ✅ Preserve all theme classes dynamically added
//     safelist: [
//         {
//             pattern: /^theme-/,
//         },
//         "dark",
//         "light",
//     ],

//     plugins: [],
// };




