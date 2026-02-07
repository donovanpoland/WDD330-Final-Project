# Resume Workshop

Resume Workshop is a web application that helps job seekers browse listings, save opportunities, and tailor a resume to each role. The goal is to reduce the "one-size-fits-all" resume problem and make applications more targeted.

## Features

- Browse job listings from external APIs
- Save jobs for later comparison
- Track application and interview progress
- Build and tailor a resume per job and export it
- Filter job listings and saved jobs

## Tech Stack

- Vanilla JavaScript
- Vite
- HTML/CSS

## Project Structure

- `src/index.html`: main entry
- `src/jobs/`: job listing page(s)
- `src/canvas/`: resume workshop/builder page(s)
- `src/scripts/`: JS modules and page entry files
- `src/styles/`: CSS
- `src/public/`: static assets (images, data, partials)

## Getting Started

```bash
npm install
```

## Scripts

- `npm run start`: start the Vite dev server
- `npm run build`: build for production into `dist/`
- `npm run preview`: preview the production build
- `npm run lint`: run ESLint on JS files
- `npm run format`: format HTML/JSON/JS/CSS with Prettier

## External APIs (Planned)

- JSearch API (primary)
- Logo.dev (company logos)
- QRCode Monkey (QR codes for profiles)

## Data Storage

- Local storage for saved jobs, user data, and per-job resumes
- Possible future: Supabase or IndexedDB for larger datasets

## Design Direction

- Typography: Poppins (headings), Inter (body)
- Colors: dark background, dark blue cards, off-white resume area, white text
- Iconography: file icon with connected nodes

## Credits

Created for WDD 330.

## Planning

- Trello board: https://trello.com/b/6gs9UTA4/resume-workshop

## Live Demo

- Render: https://wdd330-final-project-9372.onrender.com

## License

MIT.
