/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--color-background)",
                foreground: "var(--color-text-primary)",
                card: {
                    DEFAULT: "var(--color-surface)",
                    foreground: "var(--color-text-primary)",
                },
                popover: {
                    DEFAULT: "var(--color-surface)",
                    foreground: "var(--color-text-primary)",
                },
                primary: {
                    DEFAULT: "var(--color-primary)",
                    foreground: "#ffffff",
                },
                secondary: {
                    DEFAULT: "var(--color-surface)",
                    foreground: "var(--color-text-primary)",
                },
                muted: {
                    DEFAULT: "var(--color-border-subtle)",
                    foreground: "var(--color-text-muted)",
                },
                accent: {
                    DEFAULT: "var(--color-surface)",
                    foreground: "var(--color-text-primary)",
                },
                destructive: {
                    DEFAULT: "var(--color-error)",
                    foreground: "#ffffff",
                },
                border: "var(--color-border)",
                input: "var(--color-border)",
                ring: "var(--color-primary)",
                success: "var(--color-success)",
                warning: "var(--color-warning)",
                info: "var(--color-info)",
                error: "var(--color-error)",
                "error-bg": "var(--color-error-bg)",
            },
            borderRadius: {
                lg: "var(--radius-lg)",
                md: "var(--radius-md)",
                sm: "var(--radius-sm)",
            },
            spacing: {
                xs: 'var(--spacing-xs)',
                sm: 'var(--spacing-sm)',
                md: 'var(--spacing-md)',
                lg: 'var(--spacing-lg)',
                xl: 'var(--spacing-xl)',
                '2xl': 'var(--spacing-2xl)',
            },
            textColor: {
                'text-primary': 'var(--color-text-primary)',
                'text-secondary': 'var(--color-text-secondary)',
                'text-muted': 'var(--color-text-muted)',
            }
        },
    },
    plugins: [],
}
