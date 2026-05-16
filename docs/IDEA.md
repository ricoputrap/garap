# Garap

A todo list management app similar to Trello and Google Keep, but with the way simpler functionalities and tailored to solve a specific problem below.

## Problem

I have a lot of things to do in my life. At work, I have to work on my tasks. At home, as a dad, I have to take care of my families. As a human being, I have to manage my plans, targets, etc. As a software engineer, I have to manage my priorities on learning new things or building projects.

Currently, I always do brainstorming in a plain paper. After that, for every category (e.g. Project XYZ), I outline all things I need to do with checkboxes. I tick it every time I complete one of them. I also create 2 more lists: "Today" (list of things I want to do today) and "Week" (list of things I want to do this week). 

I want to digitalize it. Instead of using plain paper, I want to do this in my laptop/PC. I have big monitor at home, it really helpful for me to see all of my lists, similar experience as what I have in a plain paper.

## Expected Behavior

1. List of tasks with checkboxes, grouped in cards. Each card has editable titles.
2. Each task item name is editable.
3. No drag-and-drop functionalities for now for anything.
4. The screen is divided into 2 main section: 70% is board containing cards of task items, 30% is list of today/week tasks
5. Use tab for switching between Today or Week task list on the right panel.
6. We can select any task items to be added to the "Today" or "Week" list.
7. Each task items in "Today" or "Week" list are still grouped based on the actual group/card.
8. We can remove a task item from "Today" or "Week" list.
9. Once a task item in "Today" or "Week" list is completed, it will not be removed, but the actual task item in the card will be automatically updated as "completed" as well.
10. Users can have multiple boards.
11. For now, all data will be stored fully on the client side (browser IndexedDB). No auth. No API call at all. Everything is fully client side.

## Technology Stack Idea

1. React 19 with TypeScript and Vite
2. Routing with TanStack Router
3. Global state management with Zustand ONLY IF necessary.
4. Data storage on browser IndexedDB.
