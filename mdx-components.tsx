import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  wrapper: ({ children }) => (
    <article className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      {children}
    </article>
  ),
  h1: ({ children }) => (
    <h1 className="mb-4 text-3xl font-semibold tracking-tight text-foreground">
      {children}
    </h1>
  ),

  h2: ({ children }) => (
    <h2 className="mt-12 mb-3 text-xl font-semibold text-foreground border-b border-border pb-2">
      {children}
    </h2>
  ),

  h3: ({ children }) => (
    <h3 className="mt-6 mb-2 text-base font-semibold text-foreground">
      {children}
    </h3>
  ),

  p: ({ children }) => (
    <p className="mb-4 text-sm leading-7 text-muted-foreground">{children}</p>
  ),

  ul: ({ children }) => (
    <ul className="mb-4 ml-4 space-y-1 list-disc marker:text-muted-foreground">
      {children}
    </ul>
  ),

  ol: ({ children }) => (
    <ol className="mb-4 ml-4 space-y-1 list-decimal marker:text-muted-foreground">
      {children}
    </ol>
  ),

  li: ({ children }) => (
    <li className="text-sm leading-7 text-muted-foreground">{children}</li>
  ),

  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),

  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),

  thead: ({ children }) => (
    <thead className="bg-muted text-muted-foreground">{children}</thead>
  ),

  tbody: ({ children }) => (
    <tbody className="divide-y divide-border">{children}</tbody>
  ),

  tr: ({ children }) => <tr className="divide-x divide-border">{children}</tr>,

  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td className="px-4 py-3 text-muted-foreground">{children}</td>
  ),

  hr: () => <hr className="my-10 border-border" />,

  code: ({ children }) => (
    <code className="rounded px-1.5 py-0.5 text-xs font-mono bg-muted text-foreground">
      {children}
    </code>
  ),

  a: ({ children, href }) => (
    <a
      href={href}
      className="text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
    >
      {children}
    </a>
  ),
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
