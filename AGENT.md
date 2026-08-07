# Agent Refactoring Documentation

## MVC Architecture
This static site has been refactored to use a lightweight Model-View-Controller (MVC) architecture.
- **Model (`js/content.js`)**: All data, inventory information, metadata, and site configuration are defined as global JSON-like objects (`window.SITE_CONTENT` and `window.INVENTORY_DATA`). 
- **View (`.html` files + `css/style.css`)**: The HTML files contain semantic structures and minimal page-specific layout, using `css/style.css` for consistent styling.
- **Controller (`js/app.js`)**: The application logic parses the Model and dynamically populates the DOM, handles interactivity, and binds event listeners (like modals and nav toggling).

## Unified Layout Injection
To ensure multi-page standardization and adhere to DRY principles, `js/app.js` is responsible for injecting shared layout components.
- On `DOMContentLoaded`, it injects a generic layout header (`<div class="banner">` and `<header class="site-nav">`) and a unified `<footer>` dynamically.
- The `app.js` then continues to parse `window.SITE_CONTENT` to fill the banner with the current date, and populates the `<header>` element with the fold-out site navigation.

## Unified Cookie Consent Strategy
The site utilizes a unified Vanilla CookieConsent configuration, managed entirely within `js/cookie.js`.
- It dynamically loads the Vanilla CookieConsent library (CSS and JS) via CDN.
- Configures Google Analytics (`gtag`) in a default denied state for analytics and advertising storage.
- It intercepts user consent updates via `onConsent` and `onChange` hooks to dynamically push 'granted' or 'denied' signals to Google Analytics based on user choices.
- This file is universally included in the `<head>` of all HTML documents.

## Lighthouse & Accessibility
- A static accessibility sweep found the HTML files effectively make use of semantic elements (`<main>`, `<section>`).
- Buttons properly use `aria-label` and `aria-expanded` attributes for the dynamic nav logic.
- A GitHub Action (`.github/workflows/lighthouse.yml`) paired with `lighthouserc.json` has been introduced to run Lighthouse CI tests against pull requests, automatically collecting and analyzing the static build.

## Site-specific Quirks
- The data is loosely bound to `window` for straightforward global access without requiring a bundler.
- `app.js` handles logic for many different pages conditionally checking for the presence of certain DOM elements (e.g., `if (document.getElementById('hero-title'))`) rather than explicitly matching routes, meaning page IDs must remain unique and specific.
