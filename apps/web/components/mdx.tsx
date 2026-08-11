import type { MDXComponents } from "mdx/types";

export function getMDXComponents(
  components: MDXComponents = {},
): MDXComponents {
  return {
    // Every document repeats its frontmatter title as a leading `# `, and the
    // page template already renders that title as the page's only h1. Rendering
    // both duplicated the heading and put two h1s on the page. Drop the body
    // copy here; frontmatter `title` stays the single source of truth.
    h1: () => null,
    a: (props) => <a {...props} className="docsInlineLink" />,
    code: (props) => <code {...props} className="docsCode" />,
    pre: (props) => <pre {...props} className="docsPre" />,
    ...components,
  };
}
