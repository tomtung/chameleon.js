# Build

When `*.ts` files are modified, they need to be recompiled to JavaScript. Make sure you have [TypeScript](http://www.typescriptlang.org/) installed, and run:

	tsc --target ES5 --out js/app.js ts/app.ts

# Run

You need to set up an HTTP server to run the application locally. In UNIX systems with Python installed, the simplest way is just

	python -m SimpleHTTPServer

Then the application should be available at `http://localhost:8000/`.
