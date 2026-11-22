// Usage: node scripts/metrics.js   (writes docs/reports/metrics.md)
const fs = require('fs');
const path = require('path');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === 'coverage') continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|jsx)$/.test(name)) out.push(p);
  }
  return out;
}
const lines = (f) => fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim()).length;
const sum = (files) => files.reduce((s, f) => s + lines(f), 0);
const isTest = (f) => /\.test\.jsx?$/.test(f);

const fn = walk('functions/src').concat(walk('functions/test'), ['functions/index.js']);
const web = walk('web/src');
const fnSrc = fn.filter((f) => !isTest(f) && !f.includes(`${path.sep}test${path.sep}`));
const fnTest = fn.filter((f) => isTest(f) || f.includes(`${path.sep}test${path.sep}`));
const tests = fnTest.reduce((s, f) => s + (fs.readFileSync(f, 'utf8').match(/^\s*test(\.each)?\(/gm) || []).length, 0);

const out = `# Software metrics
Generated ${new Date().toISOString().slice(0, 10)}

| Metric | Value |
|---|---|
| Backend source files / lines | ${fnSrc.length} / ${sum(fnSrc)} |
| Backend test files / lines | ${fnTest.length} / ${sum(fnTest)} |
| Test declarations (backend) | ${tests} |
| Web source files / lines | ${web.length} / ${sum(web)} |
| Test-to-code ratio (backend) | ${(sum(fnTest) / Math.max(1, sum(fnSrc))).toFixed(2)} |

Add by hand: velocity per week, planned versus actual story points, defects by severity (defect-log.md), requirement changes (CR-01, descoped offline scanning), coverage from \`npm --prefix functions test -- --coverage\`.
`;
fs.writeFileSync('docs/reports/metrics.md', out);
console.log(out);
