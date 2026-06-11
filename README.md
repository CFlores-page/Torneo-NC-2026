Netcenter Americas FIFA Cup 2026

A live tournament dashboard for an office sales competition, built with HTML, CSS, JavaScript, and Google Sheets.

This project turns a sales-floor tournament into something that feels less like a spreadsheet and more like a sports broadcast.

Instead of simply showing who has sold the most, the page presents the competition as a FIFA-style cup: national teams, live matchups, standings, rosters, player cards, head-to-head counters, and a Match Center designed to make every sale feel like a point on the scoreboard.

The Idea

The Netcenter Americas FIFA Cup 2026 is an internal sales tournament inspired by the structure and visual language of international football.

Each office team is represented by a country. Players are assigned to national squads, matches are played head-to-head, and every confirmed sale contributes to the score.

The goal of this dashboard is not just to track data.

The goal is to make the office feel like it is watching a tournament unfold.

A sale becomes a goal.
A closer becomes a player.
A team becomes a country.
A leaderboard becomes a championship table.

What the Page Does

The dashboard is divided into several tournament views:

Dashboard

The main dashboard gives a quick overview of the tournament:

Current phase
Active teams
Registered sales
Current leader
Quick standings
Live matches
Upcoming matches
Teams by unit

This is the “main broadcast screen” of the tournament.

Teams

The Teams view shows each country as an expandable accordion.

Each team includes:

Country flag
Unit
Status
Current points
Sales count
Full roster
Player cards

The player cards are styled like sports profile cards, using a stadium background, country colors, player photos, stats, and tournament performance indicators.

Match Center

The Match Center is the live head-to-head view.

It shows:

Active matches in a horizontal carousel
Current score
Team flags
Match phase
Match end date
Team rosters
Top contributors
Match information
Recent activity
A stadium-style live match background

The Match Center is meant to feel like the center screen of a sports broadcast. It gives each live matchup a dedicated space instead of treating it like just another row in a table.

Data Source

The page is powered by a Google Sheets workbook.

The frontend reads public sheet data through the Google Visualization API and renders the tournament state dynamically.

Main sheets include:

DASHBOARD
EQUIPOS
JUGADORES
PARTIDOS
VENTAS

The sheet handles the raw tournament logic, while the page handles presentation, interaction, and visual storytelling.

Core Data Flow

The structure is intentionally simple:

Google Sheets
     ↓
Google Visualization API
     ↓
JavaScript parsers
     ↓
Dashboard / Teams / Match Center UI

There is no backend server.

This makes the project easy to host on GitHub Pages while still allowing the tournament data to update from Google Sheets.

Why This Exists

The original problem was simple:

Sales contests are usually tracked in spreadsheets.

Spreadsheets are useful, but they do not create momentum.

This project tries to solve that by turning a normal office competition into an experience people can follow, talk about, and feel part of.

It gives the tournament a public-facing identity.

It gives each team a place.

It gives each player a card.

It gives every match a scoreboard.

And most importantly, it makes the data feel alive.

Design Direction

The visual style is inspired by:

Football broadcast graphics
FIFA-style tournament presentation
Dark sports dashboards
Stadium lighting
Country color palettes
Player cards
Matchday graphics

The interface uses a dark background, bold sports typography, bright accent colors, flags, cards, and live-match layouts to create a more energetic tournament atmosphere.

Features
Static frontend hosted on GitHub Pages
Google Sheets as live data source
Dashboard overview
Live match cards
Team accordions
Player cards
Stadium-style Match Center
Country flags
Team color themes
Player photos and headshots
Clickable quick standings
Clickable live matches
Match-specific counters
Responsive layout foundation
Current Status

The project is actively being built and refined.

Working areas include:

Dashboard layout
Teams view
Player card design
Match Center
Live match carousel
Google Sheets integration
Dynamic team/player rendering

Future improvements may include:

Full bracket view
MVP rankings
Match history
Player profile popups
Better activity logs
Automated image handling
More advanced tournament analytics
Tech Stack
HTML
CSS
JavaScript
Google Sheets
Google Visualization API
GitHub Pages

The project intentionally avoids unnecessary backend complexity.

The logic lives in the spreadsheet.
The experience lives on the page.

Project Philosophy

This dashboard is not just a report.

It is a tournament layer over real sales data.

The page is built around one idea:

If people can see themselves in the competition, they are more likely to feel part of it.

That means presentation matters.

The flags matter.
The cards matter.
The matchups matter.
The scoreboards matter.
The little details make the tournament feel real.

Author

Built by Cristian Flores as part of an internal automation and reporting workflow for the Netcenter Americas sales floor.

This project combines reporting, frontend design, Google Sheets logic, and a little bit of office-world football madness.

Repository Purpose

This repository contains the frontend files for the tournament page:

index.html
styles.css
script.js

It is designed to be lightweight, readable, and easy to update as the tournament evolves.

The final goal is a page that can live on a big screen, a desktop browser, or a shared office link and instantly communicate:

Who is playing.
Who is winning.
Who is carrying.
And who is still alive in the cup.