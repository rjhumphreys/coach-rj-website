# Coach RJ website

This is a static HTML and CSS site. There is no framework or content-management system.

## Edit page content

Each page lives in an `index.html` file:

- Home: `index.html`
- About: `about/index.html`
- Services: `services/index.html`
- Contact: `contact/index.html`
- Training questionnaire: `questionnaire/index.html`
- Work: `work/index.html`
- Blog: `blog/index.html`

Most text can be edited directly between the HTML tags. Site-wide styling lives in
`assets/styles.css`.

## Preview and build

```bash
npm run build
npx wrangler dev
```

`npm run build` copies the site into `dist/`, which Wrangler serves and deploys.

## Questionnaire

The questionnaire is displayed on this site and submits responses to the existing
Google Form. If the Google Form is replaced, update the form `action` and the
`entry.*` field names in `questionnaire/index.html`.
