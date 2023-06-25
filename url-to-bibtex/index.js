import urlMetadata from 'url-metadata';
import moment from 'moment';
import path from 'path';
import * as fs from "fs";
import refUrls from '../ref_url.json' assert { type: "json" };

const AUTHORS = {
    'developer.mozilla.org': 'Mozilla Developer Network',
    'www.browserstack.com': 'Browser Stack',
    'css-tricks.com': 'CSS Tricks',
    'www.redhat.com': 'Red Hat',
    "opensource.fb.com": "Facebook Open Source",
    "legacy.reactjs.org": "React",
    "react.dev": "React",
    "www.geeksforgeeks.org": "GeeksforGeeks",
    "nextjs.org": "Next.js",
    "mantine.dev": "Mantine",
    "tailwindcss.com": "Tailwind CSS",
    "prettier.io": "Prettier",
    "eslint.org": "ESLint",
}

const getMdnCitation = async (url) => {
    const metadata = await urlMetadata(url);
    const urlObj = new URL(url);
    const authorFromJsonld = metadata.jsonld?.name;
    const author = authorFromJsonld || AUTHORS[urlObj.hostname] || urlObj.hostname;
    const howPublished = `Dostupné z: \\url{${url}}`;
    const yearFromjsonld = metadata.jsonld?.datePublished?.split('-')[0];
    const yearFromOgUpdatedTime = metadata['og:updated_time']?.split('-')[0];
    const year = yearFromjsonld || yearFromOgUpdatedTime || moment().format('YYYY');
    const note = `[cit. ${moment().format('YYYY-MM-DD')}]`;
    let titleFromUrl = url.split('/').slice(-2).join(' ').replace(/_/g, ' ')
    if (author === AUTHORS['developer.mozilla.org']) {
        let slugs = '';
        if (url.includes('/en-US/docs/Web/')) slugs = url.split('/Web/').at(-1);
        else if (url.includes('/en-US/docs/Learn/')) slugs = url.split('/Learn/').at(-1);
        else slugs = url.split('/en-US/docs/').at(-1);
        titleFromUrl = slugs.split('/').join(' ').replace(/_/g, ' ')
    }
    titleFromUrl = titleFromUrl.replace(/#/g, '-');
    titleFromUrl = titleFromUrl.replace(/.html/g, '');
    const websiteTitle = metadata.title || metadata['og:title'] || titleFromUrl;
    titleFromUrl = titleFromUrl.replace(/[-.]/g, '_');
    const title = `${websiteTitle} [online]`;
    // get author shortcut in lowercase
    const citeKeyAuthor = author.split(' ').map(word => word[0]).join('').toLowerCase();
    const citeKeyTitle = titleFromUrl.replace(/\s/g, '_').toLowerCase();
    const citeKey = `${citeKeyAuthor}_${citeKeyTitle}`;

    const bibtex = `@misc{${citeKey},
    author = {${author}},
    title = {${title}},
    howpublished = {${howPublished}},
    year = {${year}},
    note = {${note}},
}`;
    return { bibtex, author, title, citeKey };
}

const citations = await Promise.all(refUrls.map(getMdnCitation));
const tmpBibFile = '../auto.bib';
// write citations to temporary file
await fs.writeFileSync(tmpBibFile, citations.reduce((acc, cit) => {
    acc += `% ${cit.title}\n${cit.bibtex}\n\n`;
    return acc;
}, ''));
