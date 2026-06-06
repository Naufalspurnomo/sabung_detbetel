import { readFile } from "fs/promises";
import path from "path";

const judgeFiles = [
  "vs-tiering-system.md",
  "feat-hierarchy.md",
  "scaling-rules.md",
  "hax-abilities-guide.md",
  "common-debunked-arguments.md",
  "templates/verdict-output.md"
];

export async function loadJudgeSystemPrompt(): Promise<string> {
  const sections = await Promise.all(
    judgeFiles.map(async (file) => {
      try {
        const content = await readFile(
          path.join(process.cwd(), "knowledge", file),
          "utf8"
        );
        return `# ${file}\n${content}`;
      } catch {
        return "";
      }
    })
  );

  return sections.filter(Boolean).join("\n\n---\n\n");
}
