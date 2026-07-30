# GoJS Data Modeler Sample

This project is a sample React JS app using the local GoJS release library to model database tables and relationships.

## Features

- Drag starter entities from a GoJS palette
- Edit table names directly in the diagram
- Edit field names and field types directly in the diagram
- Create and reconnect relationships between entities
- Inspect the selected entity in a side panel
- View the live GoJS model as JSON

## Run locally

```bash
npm install
npm run dev
```

## Environment

Create a `.env` file in the project root with:

```bash
VITE_GOJS_LICENSE_KEY=your_gojs_license_key
```

## Notes

- The GoJS license key is read from `.env` via `VITE_GOJS_LICENSE_KEY`.
- The app imports `release/go-module.js` directly, matching the local GoJS distribution checked into this folder.
- Relevant official local references reviewed for this app were the `entityRelationship.html`, `relationships.html`, `addToPalette.html`, and `dragDropFields.html` samples under `/Users/MacBook/Desktop/goJS/GoJS/samples`.
