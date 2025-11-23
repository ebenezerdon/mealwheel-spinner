# MealWheel Spinner

Decide what to eat without the argument. **MealWheel** is a fast, responsive web application built by [Teda.dev](https://teda.dev) to help you randomize your meal choices with customizable weights and categories.

## Features

- **Weighted Probabilities**: Give your favorite meals a higher chance of winning.
- **Physics-based Animation**: Smooth easing for a realistic spin feel.
- **Categories**: Create separate lists for "Dinner", "Takeout", "Breakfast", etc.
- **History**: Keep track of what the wheel selected previously.
- **Persistent Data**: Everything is saved to your browser's LocalStorage.

## How to Run

Since this is a buildless application using ESM and CDN imports:

1. Open `index.html` in any modern web browser.
2. That's it! No `npm install` or build step required.

## File Structure

- `index.html`: Marketing landing page.
- `app.html`: The main spinner application.
- `styles/main.css`: Custom styling and animations.
- `scripts/`: Modular JavaScript files (data, ui, helpers, main).

Built with HTML5 Canvas, Tailwind CSS, and jQuery.