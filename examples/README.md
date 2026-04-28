# Examples

Fuzzy Finder browser demo.

## Build First

From the project root:

```bash
deno task build
```

This creates the `dist/` directory with `index.mjs` and `index.cjs`.

## Run Demo

Start an HTTP server in the examples directory:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js
npx http-server -p 8000
```

Then open: http://localhost:8000

## Demo Features

- Real-time fuzzy search
- Match highlighting
- Score display
- Sample file paths
