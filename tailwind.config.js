/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Add syntax colors referencing CSS variables
        'syntax-green': 'hsl(var(--syntax-green))',
        'syntax-cyan': 'hsl(var(--syntax-cyan))',
        'syntax-purple': 'hsl(var(--syntax-purple))',
        'syntax-yellow': 'hsl(var(--syntax-yellow))',
        'syntax-orange': 'hsl(var(--syntax-orange))',
        'syntax-pink': 'hsl(var(--primary))', // Assuming pink uses primary
        'syntax-comment': 'hsl(var(--syntax-comment))',
        'syntax-selection': 'hsl(var(--syntax-selection))',
      },
      // Keep the dracula object if it's used elsewhere, otherwise it could be removed.
      // For now, let's assume it might be needed for other purposes.
      dracula: {
        background: "#282A36",
        foreground: "#F8F8F2",
        selection: "#44475A",
        comment: "#6272A4",
        red: "#FF5555",
        orange: "#FFB86C",
        yellow: "#F1FA8C",
        green: "#50FA7B",
        purple: "#BD93F9",
        cyan: "#8BE9FD",
        pink: "#FF79C6",
      }
    },
    borderRadius: {
      lg: "var(--radius)",
      md: "calc(var(--radius) - 2px)",
      sm: "calc(var(--radius) - 4px)",
    },
  },
  plugins: [],
}
