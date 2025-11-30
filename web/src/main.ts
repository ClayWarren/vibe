import './style.css';
import { parse, lowerProgram } from '../../src/index';
import { emitTypeScript } from '../../src/transpilers/typescript';
import { emitRust } from '../../src/transpilers/rust';

const inputEl = document.querySelector<HTMLTextAreaElement>('#input')!;
const outputEl = document.querySelector<HTMLPreElement>('#output')!;
const targetEl = document.querySelector<HTMLSelectElement>('#target')!;
const statusEl = document.querySelector<HTMLDivElement>('#status')!;

const examples: Record<string, string> = {
  'User profile': `define get_user_profile:
    ensure user_id is provided.
    let user = fetch user where id equal_to user_id.
    if user is none: stop with "user not found".
    return user.
end.
`,
  'Agent loop': `every 10 minutes:
    fetch unread messages into messages.
    for each message in messages:
        let summary = summarize message.
        store summary into database.
end.
`,
};

function compile() {
  try {
    const ast = parse(inputEl.value);
    const ir = lowerProgram(ast);
    const target = targetEl.value;
    const code = target === 'rust' ? emitRust(ir) : emitTypeScript(ir);
    outputEl.textContent = code;
    statusEl.textContent = 'Compiled successfully';
    statusEl.className = 'ok';
  } catch (err) {
    outputEl.textContent = '';
    statusEl.textContent = (err as Error).message;
    statusEl.className = 'error';
  }
}

(document.querySelector('#compile') as HTMLButtonElement).addEventListener('click', compile);

document.querySelector('#examples')?.addEventListener('change', (e) => {
  const key = (e.target as HTMLSelectElement).value;
  if (key && examples[key]) {
    inputEl.value = examples[key];
    compile();
  }
});

// seed with default example
inputEl.value = examples['User profile'];
compile();
