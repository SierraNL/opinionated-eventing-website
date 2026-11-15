const fs = require('node:fs');
const path = require('node:path');

const SECTIONS = [
  {
    title: 'For AI agents',
    ids: ['ai/agent-guide', 'ai/api-cheat-sheet', 'ai/packages', 'ai/recipes', 'ai/migration-mapping', 'ai/templates'],
  },
  {
    title: 'Guides',
    ids: [
      'getting-started',
      'commands-vs-events',
      'outbox-pattern',
      'sagas-orchestration',
      'sagas-choreography',
      'ddd-aggregates',
      'local-development',
      'observability',
      'idempotency',
    ],
  },
];

const SUMMARY =
  'OpinionatedEventing is an opinionated event-driven messaging library for .NET (outbox-first, ' +
  'commands vs events, sagas, DDD aggregates; Azure Service Bus and RabbitMQ transports). ' +
  'There is no direct-to-broker publish API: IPublisher always writes to the transactional outbox.';

function parse(raw, id) {
  let body = raw;
  const meta = {};
  const m = /^---\n([\s\S]*?)\n---\n/.exec(raw);
  if (m) {
    body = raw.slice(m[0].length);
    for (const line of m[1].split('\n')) {
      const kv = /^(\w+):\s*(.*)$/.exec(line);
      if (kv) meta[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '');
    }
  }
  const h1 = /^#\s+(.+)$/m.exec(body);
  return {
    id,
    title: meta.title ?? h1?.[1] ?? id,
    description: meta.description ?? '',
    body: body.trim() + '\n',
  };
}

/** Rewrites relative links to .md files and pathname:// links into absolute URLs. */
function absolutize(body, id, site) {
  const dir = path.posix.dirname(id);
  return body
    .replace(/\]\(pathname:\/\/(\/[^)]*)\)/g, (_m, p) => `](${site}${p})`)
    .replace(/\]\((?!https?:|#|\/)([^)]+?)\.md(#[^)]*)?\)/g, (_m, p, hash = '') => {
      const target = path.posix.normalize(path.posix.join(dir, p));
      return `](${site}/docs/${target}.md${hash})`;
    });
}

module.exports = function llmsTxtPlugin(context) {
  const site = context.siteConfig.url.replace(/\/$/, '');
  return {
    name: 'llms-txt',
    async postBuild({outDir}) {
      const docsDir = path.join(context.siteDir, 'docs');
      const ordered = SECTIONS.flatMap((s) => s.ids);
      const docs = new Map();
      for (const id of ordered) {
        const file = path.join(docsDir, `${id}.md`);
        if (!fs.existsSync(file)) throw new Error(`llms-txt: missing doc ${id}`);
        docs.set(id, parse(fs.readFileSync(file, 'utf8'), id));
      }

      // Raw Markdown next to every docs page: /docs/<id>.md
      for (const doc of docs.values()) {
        const target = path.join(outDir, 'docs', `${doc.id}.md`);
        fs.mkdirSync(path.dirname(target), {recursive: true});
        fs.writeFileSync(target, `# ${doc.title}\n\n` + stripH1(absolutize(doc.body, doc.id, site)));
      }

      let index = `# OpinionatedEventing\n\n> ${SUMMARY}\n\n`;
      index += `Full documentation in one file: ${site}/llms-full.txt\n\n`;
      for (const section of SECTIONS) {
        index += `## ${section.title}\n\n`;
        for (const id of section.ids) {
          const d = docs.get(id);
          index += `- [${d.title}](${site}/docs/${id}.md)${d.description ? `: ${d.description}` : ''}\n`;
        }
        index += '\n';
      }
      index += `## Optional\n\n- [Source code](https://github.com/SierraNL/OpinionatedEventing)\n- [NuGet packages](https://www.nuget.org/packages?q=OpinionatedEventing)\n`;
      fs.writeFileSync(path.join(outDir, 'llms.txt'), index);

      let full = `# OpinionatedEventing\n\n> ${SUMMARY}\n\n`;
      for (const id of ordered) {
        const d = docs.get(id);
        full += `---\n\nSource: ${site}/docs/${id}\n\n# ${d.title}\n\n${stripH1(absolutize(d.body, id, site))}\n`;
      }
      fs.writeFileSync(path.join(outDir, 'llms-full.txt'), full);
    },
  };
};

function stripH1(body) {
  return body.replace(/^#\s+.+\n+/, '');
}
