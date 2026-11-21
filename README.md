# Spendvizo

Spendvizo is a responsive, no-login personal expense tracker built with plain HTML, CSS, and JavaScript.

## Run locally
1. Extract the ZIP file.
2. Open `index.html` in a modern browser.
3. Add income, expenses, and a monthly budget.

No build step, framework, database, or API key is required.

## Features
- Add, edit, and delete income and expense transactions
- Monthly income, expenses, net balance, and budget remaining
- Category spending donut chart and six-month cash-flow chart
- Search, type filter, and month filter
- Monthly budget progress and warning
- CSV export and JSON backup/restore
- Dark/light theme and responsive mobile layout
- Local browser storage; no account or server required

## Important privacy and storage note
Transactions are stored in the browser's `localStorage` on the device where they are entered. The website owner does not receive this data. Data does not automatically sync between browsers or devices. Clearing site data/browser storage can erase it. Use **Backup data** regularly and keep the downloaded JSON file safe.

## Publish free with Netlify
1. Visit https://app.netlify.com/drop
2. Sign in or create a free Netlify account.
3. Drag the extracted `spendvizo` folder onto the deploy area.
4. Netlify will publish it and provide a public `*.netlify.app` URL.
5. You can change the site name in Netlify's site settings if the chosen subdomain is available.

Alternative: create a GitHub repository, upload these files, then enable GitHub Pages from repository Settings → Pages.

## Project structure
- `index.html` — page structure
- `style.css` — responsive styling and themes
- `app.js` — application logic, charts, and local storage

## Before launch
- Test add/edit/delete, filters, export, and backup/restore.
- Use a private/incognito window to confirm the app starts empty.
- Choose an available public site name and check trademark/domain conflicts before branding commercially.
