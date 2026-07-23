# Sewer-Inspector-Steve

A Minecraft-themed sewer inspection and project management app, built as a playful front end for tracking infrastructure inspection work.

Live app: https://replit.com/@robertdickinson/Sewer-Inspector-Steve

## What's inside

The app pairs a Minecraft-inspired UI with project management features for tracking sewer inspection work. It's a full-stack TypeScript application with separate client, server, and shared folders, so frontend and backend share the same types and schemas.

## Why this exists

Sewer inspection tools tend to look like conventional enterprise dashboards. This project explores a more playful, game-inspired interface for the same kind of work, treating inspection tasks and project tracking like a Minecraft-style build rather than a plain spreadsheet.

## Tech stack

TypeScript makes up about 95% of the codebase, with CSS handling the rest. The frontend is built with Vite and styled with Tailwind CSS (tailwind.config.ts, postcss.config.js). Drizzle (drizzle.config.ts) handles the database/schema layer. The project was scaffolded and developed on Replit.

## Repository layout

The client folder holds the frontend application. The server folder holds backend routes and app logic. The shared folder holds types and schemas used by both client and server. The script folder holds supporting scripts.

## Getting started

git clone https://github.com/dickinsonre/Sewer-Inspector-Steve.git
cd Sewer-Inspector-Steve
npm install
npm run dev

Check package.json and replit.md for any environment variables or database configuration the app expects.

## Author

Robert Dickinson has spent over 50 years working in stormwater and wastewater modeling. This project is part of a broader set of tools exploring sewer and stormwater infrastructure applications.
