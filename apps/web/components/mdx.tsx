import type { MDXComponents } from "mdx/types";

export function getMDXComponents(
  components: MDXComponents = {},
): MDXComponents {
  return {
    a: (props) => <a {...props} className="docsInlineLink" />,
    code: (props) => <code {...props} className="docsCode" />,
    pre: (props) => <pre {...props} className="docsPre" />,
    ...components,
  };
}
