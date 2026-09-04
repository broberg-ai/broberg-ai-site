// Bun importerer .md som tekst (`with { type: "text" }`); tsc skal kende formen.
declare module "*.md" {
  const tekst: string;
  export default tekst;
}
