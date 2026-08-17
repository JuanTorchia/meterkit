import { canonicalJson } from "./model.mjs";

export function compareMaintainedTemplate(example, template, dependencyNames) {
  const select = (manifest) =>
    Object.fromEntries(
      dependencyNames.map((name) => [
        name,
        manifest.dependencies?.[name] ?? null,
      ]),
    );
  const expected = select(example);
  const actual = select(template);
  return {
    passed: canonicalJson(expected) === canonicalJson(actual),
    expected,
    actual,
    errors:
      canonicalJson(expected) === canonicalJson(actual)
        ? []
        : [{ code: "TEMPLATE_DEPENDENCY_DRIFT" }],
  };
}
