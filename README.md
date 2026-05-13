# opinionated-eventing-website

Source for [opinionated-eventing.com](https://opinionated-eventing.com) — the documentation and project website for [OpinionatedEventing](https://github.com/SierraNL/OpinionatedEventing), an opinionated event-driven messaging library for .NET.

Built with [Docusaurus](https://docusaurus.io/). Deployed to GitHub Pages on every push to `main`.

## Local development

```bash
npm install
npm start
```

Opens a live-reloading dev server at `http://localhost:3000`.

## Build

```bash
npm run build
```

Generates static output into `build/`. Serve it locally with `npm run serve`.

## Deployment

Pushing to `main` triggers the [GitHub Actions workflow](.github/workflows/deploy.yml) which builds and deploys to GitHub Pages automatically.

## Updating the docs

The docs in [`docs/`](docs/) mirror the content from the [main repo's `/docs` folder](https://github.com/SierraNL/OpinionatedEventing/tree/main/docs). To update a doc, edit the corresponding file here and open a PR.
