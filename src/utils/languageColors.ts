// Colors from GitHub Linguist for common languages. The REST API doesn't return
// language colors, so public mode falls back to this table.
const LANGUAGE_COLORS: Record<string, string> = {
  Assembly: '#6E4C13',
  Astro: '#ff5a03',
  Batchfile: '#C1F12E',
  C: '#555555',
  'C#': '#178600',
  'C++': '#f34b7d',
  Clojure: '#db5855',
  CoffeeScript: '#244776',
  CSS: '#663399',
  Dart: '#00B4AB',
  Dockerfile: '#384d54',
  Elixir: '#6e4a7e',
  Elm: '#60B5CC',
  Erlang: '#B83998',
  'F#': '#b845fc',
  Fortran: '#4d41b1',
  GDScript: '#355570',
  Go: '#00ADD8',
  Groovy: '#4298b8',
  Haskell: '#5e5086',
  HCL: '#844FBA',
  HTML: '#e34c26',
  Java: '#b07219',
  JavaScript: '#f1e05a',
  'Jupyter Notebook': '#DA5B0B',
  Julia: '#a270ba',
  Kotlin: '#A97BFF',
  Less: '#1d365d',
  Lua: '#000080',
  Makefile: '#427819',
  MATLAB: '#e16737',
  MDX: '#fcb32c',
  Nim: '#ffc200',
  Nix: '#7e7eff',
  'Objective-C': '#438eff',
  OCaml: '#ef7a08',
  Perl: '#0298c3',
  PHP: '#4F5D95',
  PowerShell: '#012456',
  Python: '#3572A5',
  R: '#198CE7',
  Ruby: '#701516',
  Rust: '#dea584',
  Scala: '#c22d40',
  SCSS: '#c6538c',
  Shell: '#89e051',
  Solidity: '#AA6746',
  Svelte: '#ff3e00',
  Swift: '#F05138',
  TeX: '#3D6117',
  TypeScript: '#3178c6',
  Vim: '#199f4b',
  'Vim Script': '#199f4b',
  Vue: '#41b883',
  Zig: '#ec915c',
};

/** Linguist color when known, otherwise a stable color derived from the name. */
export function languageColor(name: string): string {
  const known = LANGUAGE_COLORS[name];
  if (known) return known;
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 55% 55%)`;
}
