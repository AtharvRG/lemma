import { LinterIssue, Language } from '@/types';
import type Parser from 'web-tree-sitter';

type LintRule = {
  language: Language;
  query: string;
  issue: Omit<LinterIssue, 'message'> & { message: (capture: string) => string };
};

// Define a few simple rules for demonstration
const rules: LintRule[] = [
  {
    language: 'javascript',
    query: `(call_expression function: (identifier) @eval-func (#eq? @eval-func "eval"))`,
    issue: {
      type: 'Security',
      message: () => "`eval()` can be dangerous and should be avoided.",
    },
  },
  {
    language: 'javascript',
    query: `(variable_declarator (identifier) @var-decl "var")`,
    issue: {
      type: 'Style',
      message: (capture) => `Prefer 'const' or 'let' over 'var' for declaration '${capture}'.`,
    },
  },
  {
    language: 'python',
    query: `(call function: (identifier) @assert-func (#eq? @assert-func "assert"))`,
    issue: {
      type: 'Perf',
      message: () => "`assert` statements are removed in production builds; use exceptions for checks.",
    },
  },
];

export function runLinter(
  ast: Parser.SyntaxNode,
  languageParser: Parser.Language,
  lang: Language
): LinterIssue[] {
  const issues: LinterIssue[] = [];
  const relevantRules = rules.filter(r => r.language === lang);

  for (const rule of relevantRules) {
    try {
      const query = languageParser.query(rule.query);
      const matches = query.matches(ast);
      for (const match of matches) {
        for (const capture of match.captures) {
          issues.push({
            type: rule.issue.type,
            message: rule.issue.message(capture.node.text),
            // We can add line/column info here later
          });
        }
      }
    } catch (e) {
      console.error(`Error executing linter query for ${lang}:`, e);
    }
  }

  return issues;
}