/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cafe: {
          bg: '#FAF8F5',
          surface: '#FFFFFF',
          card: '#F6F2EB',
          border: '#E8E1D5',
          text: '#231C18',
          muted: '#7A6F68',
          espresso: '#1A120F',
          darkBg: '#141211',
          darkSurface: '#1D1917',
          darkCard: '#24201D',
          darkBorder: '#332C28',
          copper: {
            DEFAULT: '#C87A3E',
            hover: '#B56A30',
            light: '#F4EAE2',
            dark: '#E08C4E'
          },
          brass: {
            DEFAULT: '#D4A373',
            hover: '#C29160',
            light: '#FAF0E6'
          },
          cream: '#F7F3ED',
          sand: '#ECE5DB'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        'cafe-subtle': '0 1px 3px 0 rgba(35, 28, 24, 0.04), 0 1px 2px 0 rgba(35, 28, 24, 0.02)',
        'cafe-card': '0 4px 12px -2px rgba(35, 28, 24, 0.06), 0 2px 6px -1px rgba(35, 28, 24, 0.03)',
        'cafe-hover': '0 10px 25px -5px rgba(35, 28, 24, 0.08), 0 8px 10px -6px rgba(35, 28, 24, 0.04)',
      }
    },
  },
  plugins: [],
};
