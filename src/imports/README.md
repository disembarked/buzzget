# Buzzget 🐝

A Georgia Tech–themed budget tracker for Dining Dollars. Sting less, save more—track your Dining Dollars and see how much you can spend per meal.

## Features

- **GT Academic Calendar** — Choose your semester (Spring/Fall 2025–2027) to auto-fill end date and breaks from registrar.gatech.edu
- **Set your budget** — Enter total dining dollars
- **Meal frequency** — Choose how often you eat on campus (5–21 meals/week)
- **Academic breaks** — Auto-populated from GT calendar, or add custom breaks manually
- **Budget per meal** — Calculates remaining ÷ (eating days × meals/week)
- **Log spending** — Track purchases with optional notes
- **Persistent storage** — Data saved in your browser (localStorage)

## How to Use

1. Open `index.html` in your browser (double-click or drag into Chrome/Edge/Firefox)
2. Enter your total Dining Dollars
3. Select your expiration date (defaults to semester end)
4. Choose how many meals per week you eat on campus
5. Add academic breaks (Thanksgiving, Spring Break, etc.)
6. Click **Save Budget**
7. Log spending as you use your Dining Dollars
8. Check **Per Meal** to see your recommended limit per meal

## Running Locally

```bash
# Option 1: Open directly
start index.html   # Windows
open index.html    # Mac

# Option 2: Use a simple server (recommended)
npx serve .
# Then open http://localhost:3000
```

## Tech Stack

- Plain HTML, CSS, JavaScript
- No dependencies
- localStorage for persistence

Go Jackets! 🐝
