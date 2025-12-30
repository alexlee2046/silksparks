#!/usr/bin/env npx ts-node

/**
 * Shell Feature Detector - 空壳功能检测器
 *
 * 检测以下模式:
 * 1. 空事件处理器 - onClick={() => {}}, onChange={() => {}}
 * 2. TODO/FIXME 注释
 * 3. 占位符链接 - href="#"
 * 4. console.log 调试语句
 * 5. 空函数体
 * 6. 模拟数据和假数据
 * 7. alert() 调用
 * 8. 被注释掉的代码
 * 9. 只有 return null 的组件
 * 10. 未使用的导入
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

interface ShellPattern {
  name: string;
  regex: RegExp;
  severity: "high" | "medium" | "low";
  description: string;
}

interface Finding {
  file: string;
  line: number;
  pattern: string;
  severity: "high" | "medium" | "low";
  content: string;
  description: string;
}

const SHELL_PATTERNS: ShellPattern[] = [
  // 高优先级 - 明显的空壳
  {
    name: "empty-arrow-handler",
    regex: /on\w+\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/g,
    severity: "high",
    description: "空箭头函数事件处理器",
  },
  {
    name: "empty-function-handler",
    regex: /on\w+\s*=\s*\{\s*\(\s*\)\s*=>\s*null\s*\}/g,
    severity: "high",
    description: "返回 null 的事件处理器",
  },
  {
    name: "empty-function-body",
    regex: /function\s+\w+\s*\([^)]*\)\s*\{\s*\}/g,
    severity: "high",
    description: "空函数体",
  },
  {
    name: "alert-call",
    regex: /\balert\s*\([^)]+\)/g,
    severity: "high",
    description: "alert() 调用 - 应替换为正规 UI 反馈",
  },
  {
    name: "placeholder-href",
    regex: /href\s*=\s*["']#["']/g,
    severity: "high",
    description: '占位符链接 href="#"',
  },
  {
    name: "noop-submit",
    regex:
      /onSubmit\s*=\s*\{\s*\([^)]*\)\s*=>\s*\{\s*[^}]*\.preventDefault\(\)[^}]*\}\s*\}/g,
    severity: "high",
    description: "表单提交只调用 preventDefault 没有实际逻辑",
  },

  // 中优先级 - 待处理项
  {
    name: "todo-comment",
    regex: /\/\/\s*TODO[:\s]/gi,
    severity: "medium",
    description: "TODO 注释",
  },
  {
    name: "fixme-comment",
    regex: /\/\/\s*FIXME[:\s]/gi,
    severity: "medium",
    description: "FIXME 注释",
  },
  {
    name: "xxx-comment",
    regex: /\/\/\s*XXX[:\s]/gi,
    severity: "medium",
    description: "XXX 注释",
  },
  {
    name: "hack-comment",
    regex: /\/\/\s*HACK[:\s]/gi,
    severity: "medium",
    description: "HACK 注释",
  },
  {
    name: "mock-data-keyword",
    regex: /\b(mockData|MOCK_|fakeData|dummyData|sampleData)\b/g,
    severity: "medium",
    description: "模拟/假数据变量",
  },
  {
    name: "hardcoded-array",
    regex:
      /\[\s*\{\s*id:\s*['"][^'"]+['"],\s*(?:name|title):\s*['"][^'"]+['"][\s\S]{0,500}?\}\s*,[\s\S]{0,2000}?\]/g,
    severity: "medium",
    description: "硬编码的数据数组 (可能是模拟数据)",
  },
  {
    name: "coming-soon",
    regex:
      /['"]Coming Soon['"]|['"]即将推出['"]|['"]敬请期待['"]|['"]暂不可用['"]|['"]功能开发中['"]|['"]under development['"]|['"]not implemented['"]|['"]功能未实现['"]|['"]待开发['"]|['"]待实现['"]|['"]施工中['"]|['"]建设中['"]|['"]正在开发['"]|['"]开发中['"]|['"]筹备中['"]|['"]开发中['"]|['"]功能正在开发['"]|['"]Feature not available['"]|['"]Not available['"]|['"]TBD['"]|['"]TBA['"]|['"]WIP['"]/gi,
    severity: "medium",
    description: "占位符文字提示",
  },

  // 低优先级 - 可能需要清理
  {
    name: "console-log",
    regex: /console\.(log|debug|info)\s*\([^)]*\)/g,
    severity: "low",
    description: "console.log 调试语句",
  },
  {
    name: "console-error",
    regex: /console\.(warn|error)\s*\([^)]*\)/g,
    severity: "low",
    description: "console.warn/error (可能是临时的)",
  },
  {
    name: "empty-catch",
    regex: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    severity: "medium",
    description: "空 catch 块 - 错误被静默吞掉",
  },
  {
    name: "magic-number",
    regex: /(?:setTimeout|setInterval)\s*\([^,]+,\s*\d{4,}\)/g,
    severity: "low",
    description: "硬编码的超时时间 (可能需要配置化)",
  },
  {
    name: "disabled-button-no-reason",
    regex: /disabled\s*=\s*\{?\s*true\s*\}?/g,
    severity: "low",
    description: "始终禁用的按钮",
  },
  {
    name: "return-null-component",
    regex: /return\s+null\s*;?\s*\}/g,
    severity: "medium",
    description: "组件返回 null (可能是未完成的特性)",
  },
  {
    name: "empty-state-placeholder",
    regex: /useState\s*<[^>]*>\s*\(\s*(?:\[\]|{}|null|undefined|''|"")\s*\)/g,
    severity: "low",
    description: "空初始状态 (检查是否真正使用)",
  },
  {
    name: "unused-parameter",
    regex: /_\w+:\s*\w+/g,
    severity: "low",
    description: "下划线前缀参数 (可能未使用)",
  },
  {
    name: "eslint-disable",
    regex: /\/\/\s*eslint-disable|\/\*\s*eslint-disable/g,
    severity: "low",
    description: "ESLint 禁用 (可能隐藏问题)",
  },
  {
    name: "ts-ignore",
    regex: /@ts-ignore|@ts-nocheck|@ts-expect-error/g,
    severity: "medium",
    description: "TypeScript 忽略 (可能隐藏类型问题)",
  },
  {
    name: "throw-not-implemented",
    regex:
      /throw\s+new\s+Error\s*\(\s*['"](?:Not implemented|TODO|FIXME|未实现|待实现)[^'"]*['"]\s*\)/gi,
    severity: "high",
    description: '抛出"未实现"错误',
  },
];

// 检测更复杂的模式
const COMPLEX_PATTERNS = {
  // 检测空的 useEffect
  emptyUseEffect: {
    name: "empty-useEffect",
    detect: (content: string): string[] => {
      const matches: string[] = [];
      const regex = /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        matches.push(match[0]);
      }
      return matches;
    },
    severity: "high" as const,
    description: "空的 useEffect",
  },

  // 检测只有注释的函数
  commentOnlyFunction: {
    name: "comment-only-function",
    detect: (content: string): string[] => {
      const matches: string[] = [];
      const regex = /function\s+\w+\s*\([^)]*\)\s*\{\s*\/\/[^\n]*\s*\}/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        matches.push(match[0]);
      }
      return matches;
    },
    severity: "high" as const,
    description: "只有注释的函数体",
  },

  // 检测空的回调
  emptyCallback: {
    name: "empty-callback",
    detect: (content: string): string[] => {
      const matches: string[] = [];
      const regex =
        /\.\s*(?:then|catch|finally)\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        matches.push(match[0]);
      }
      return matches;
    },
    severity: "high" as const,
    description: "空的 Promise 回调",
  },

  // 检测硬编码的假数据
  hardcodedFakeData: {
    name: "hardcoded-fake-data",
    detect: (content: string): string[] => {
      const matches: string[] = [];
      // 检测如 "Lorem ipsum", "Test User", "example@email.com" 等
      const fakePatterns = [
        /['"]Lorem ipsum['"]/gi,
        /['"]Test(?:\s+\w+)+['"]/gi,
        /['"]example@(?:email|test|example)\.com['"]/gi,
        /['"]John\s+Doe['"]/gi,
        /['"]Jane\s+Doe['"]/gi,
        /['"]placeholder['"]/gi,
        /['"]Sample\s+\w+['"]/gi,
        /['"]Demo\s+\w+['"]/gi,
        /['"]Fake\s+\w+['"]/gi,
      ];
      for (const pattern of fakePatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          matches.push(match[0]);
        }
      }
      return matches;
    },
    severity: "medium" as const,
    description: "硬编码的测试/假数据",
  },
};

class ShellDetector {
  private findings: Finding[] = [];
  private fileCount = 0;
  private scannedFiles: string[] = [];

  constructor(
    private rootDir: string,
    private excludeDirs: string[] = [
      "node_modules",
      "dist",
      ".git",
      ".next",
      "build",
      "coverage",
      "test-results",
      "playwright-report",
    ],
  ) {}

  async scan(): Promise<void> {
    console.log("🔍 开始扫描空壳代码...\n");
    await this.scanDirectory(this.rootDir);
    console.log(`\n📊 扫描完成: 检查了 ${this.fileCount} 个文件\n`);
  }

  private async scanDirectory(dir: string): Promise<void> {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!this.excludeDirs.includes(entry.name)) {
          await this.scanDirectory(fullPath);
        }
      } else if (entry.isFile() && this.isTargetFile(entry.name)) {
        await this.scanFile(fullPath);
      }
    }
  }

  private isTargetFile(filename: string): boolean {
    const extensions = [".ts", ".tsx", ".js", ".jsx"];
    return extensions.some((ext) => filename.endsWith(ext));
  }

  private async scanFile(filePath: string): Promise<void> {
    this.fileCount++;
    this.scannedFiles.push(filePath);

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const relativePath = path.relative(this.rootDir, filePath);

    // 正则模式检测
    for (const pattern of SHELL_PATTERNS) {
      let match;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);

      while ((match = regex.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || match[0];

        // 跳过测试文件中的某些模式
        if (relativePath.includes("test") || relativePath.includes("spec")) {
          if (
            ["mock-data-keyword", "hardcoded-array", "console-log"].includes(
              pattern.name,
            )
          ) {
            continue;
          }
        }

        // 跳过脚本目录
        if (relativePath.startsWith("scripts/")) {
          if (["console-log", "console-error"].includes(pattern.name)) {
            continue;
          }
        }

        this.findings.push({
          file: relativePath,
          line: lineNumber,
          pattern: pattern.name,
          severity: pattern.severity,
          content: this.truncate(lineContent, 100),
          description: pattern.description,
        });
      }
    }

    // 复杂模式检测
    for (const [key, detector] of Object.entries(COMPLEX_PATTERNS)) {
      const matches = detector.detect(content);
      for (const match of matches) {
        const index = content.indexOf(match);
        const lineNumber = this.getLineNumber(content, index);

        this.findings.push({
          file: relativePath,
          line: lineNumber,
          pattern: detector.name,
          severity: detector.severity,
          content: this.truncate(match, 100),
          description: detector.description,
        });
      }
    }
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split("\n").length;
  }

  private truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen) + "...";
  }

  generateReport(): string {
    // 按严重性和文件分组
    const byFile = new Map<string, Finding[]>();

    for (const finding of this.findings) {
      if (!byFile.has(finding.file)) {
        byFile.set(finding.file, []);
      }
      byFile.get(finding.file)!.push(finding);
    }

    // 统计
    const highCount = this.findings.filter((f) => f.severity === "high").length;
    const mediumCount = this.findings.filter(
      (f) => f.severity === "medium",
    ).length;
    const lowCount = this.findings.filter((f) => f.severity === "low").length;

    let report = `# 🔍 空壳代码检测报告

**生成时间:** ${new Date().toLocaleString("zh-CN")}
**扫描目录:** ${this.rootDir}
**扫描文件数:** ${this.fileCount}
**发现问题数:** ${this.findings.length}

## 📊 问题统计

| 严重性 | 数量 | 比例 |
|--------|------|------|
| 🔴 高 | ${highCount} | ${((highCount / this.findings.length) * 100 || 0).toFixed(1)}% |
| 🟡 中 | ${mediumCount} | ${((mediumCount / this.findings.length) * 100 || 0).toFixed(1)}% |
| 🟢 低 | ${lowCount} | ${((lowCount / this.findings.length) * 100 || 0).toFixed(1)}% |

## 🎯 问题类型分布

`;

    // 按模式类型统计
    const byPattern = new Map<string, number>();
    for (const finding of this.findings) {
      byPattern.set(finding.pattern, (byPattern.get(finding.pattern) || 0) + 1);
    }

    const sortedPatterns = Array.from(byPattern.entries()).sort(
      (a, b) => b[1] - a[1],
    );

    report += "| 模式 | 数量 | 描述 |\n|------|------|------|\n";
    for (const [pattern, count] of sortedPatterns) {
      const desc =
        SHELL_PATTERNS.find((p) => p.name === pattern)?.description ||
        Object.values(COMPLEX_PATTERNS).find((p) => p.name === pattern)
          ?.description ||
        pattern;
      report += `| ${pattern} | ${count} | ${desc} |\n`;
    }

    report += `\n## 📁 按文件分类的详细问题\n\n`;

    // 按问题数量排序文件
    const sortedFiles = Array.from(byFile.entries()).sort((a, b) => {
      // 先按高严重性数量排序
      const aHigh = a[1].filter((f) => f.severity === "high").length;
      const bHigh = b[1].filter((f) => f.severity === "high").length;
      if (aHigh !== bHigh) return bHigh - aHigh;
      return b[1].length - a[1].length;
    });

    for (const [file, findings] of sortedFiles) {
      const highInFile = findings.filter((f) => f.severity === "high").length;
      const mediumInFile = findings.filter(
        (f) => f.severity === "medium",
      ).length;
      const lowInFile = findings.filter((f) => f.severity === "low").length;

      report += `### [${file}](file:///${path.join(this.rootDir, file)})\n\n`;
      report += `**问题数:** ${findings.length} (🔴${highInFile} 🟡${mediumInFile} 🟢${lowInFile})\n\n`;

      // 按严重性排序问题
      const sortedFindings = findings.sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.severity] - order[b.severity] || a.line - b.line;
      });

      report +=
        "| 行号 | 严重性 | 类型 | 内容 |\n|------|--------|------|------|\n";

      for (const finding of sortedFindings) {
        const severity = { high: "🔴", medium: "🟡", low: "🟢" }[
          finding.severity
        ];
        const escapedContent = finding.content
          .replace(/\|/g, "\\|")
          .replace(/\n/g, " ")
          .replace(/`/g, "\\`");
        report += `| [L${finding.line}](file:///${path.join(this.rootDir, file)}#L${finding.line}) | ${severity} | ${finding.pattern} | \`${escapedContent}\` |\n`;
      }

      report += "\n";
    }

    // 高优先级问题汇总
    report += `## 🚨 高优先级问题汇总\n\n`;
    report += `这些问题应该优先处理：\n\n`;

    const highFindings = this.findings.filter((f) => f.severity === "high");
    if (highFindings.length === 0) {
      report += "✅ 没有发现高优先级问题！\n\n";
    } else {
      // 按类型分组
      const highByPattern = new Map<string, Finding[]>();
      for (const finding of highFindings) {
        if (!highByPattern.has(finding.pattern)) {
          highByPattern.set(finding.pattern, []);
        }
        highByPattern.get(finding.pattern)!.push(finding);
      }

      for (const [pattern, findings] of highByPattern) {
        const desc =
          SHELL_PATTERNS.find((p) => p.name === pattern)?.description ||
          Object.values(COMPLEX_PATTERNS).find((p) => p.name === pattern)
            ?.description ||
          pattern;
        report += `### ${pattern} (${findings.length}处)\n\n`;
        report += `**描述:** ${desc}\n\n`;
        report += "| 文件 | 行号 |\n|------|------|\n";
        for (const f of findings.slice(0, 20)) {
          // 只显示前20个
          report += `| [${f.file}](file:///${path.join(this.rootDir, f.file)}#L${f.line}) | L${f.line} |\n`;
        }
        if (findings.length > 20) {
          report += `| ... 还有 ${findings.length - 20} 处 | |\n`;
        }
        report += "\n";
      }
    }

    // 建议操作
    report += `## 💡 建议操作

### 高优先级修复 (🔴)
1. **空事件处理器** - 添加实际逻辑或使用 toast/modal 提示"功能开发中"
2. **alert() 调用** - 替换为正式的 UI 组件 (如 Toast, Dialog)
3. **占位符链接** - 替换为真实路由或移除
4. **空 Promise 回调** - 添加错误处理逻辑

### 中优先级修复 (🟡)
1. **TODO/FIXME** - 逐一审查并创建 issue 跟踪
2. **模拟数据** - 替换为真实 API 调用
3. **TypeScript 忽略** - 修复类型问题

### 低优先级清理 (🟢)
1. **console.log** - 在生产构建中移除或使用日志库
2. **ESLint disable** - 检查是否有更好的解决方案

---

*报告由 shell-detector.ts 自动生成*
`;

    return report;
  }

  getFindings(): Finding[] {
    return this.findings;
  }
}

async function main(): Promise<void> {
  const rootDir = process.argv[2] || process.cwd();

  const detector = new ShellDetector(rootDir);
  await detector.scan();

  const report = detector.generateReport();

  // 保存报告
  const reportPath = path.join(rootDir, "reports", "shell-detection-report.md");

  // 确保目录存在
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, report);
  console.log(`📝 报告已保存至: ${reportPath}`);

  // 输出摘要
  const findings = detector.getFindings();
  const highCount = findings.filter((f) => f.severity === "high").length;

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 扫描结果摘要`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(
    `🔴 高优先级: ${findings.filter((f) => f.severity === "high").length}`,
  );
  console.log(
    `🟡 中优先级: ${findings.filter((f) => f.severity === "medium").length}`,
  );
  console.log(
    `🟢 低优先级: ${findings.filter((f) => f.severity === "low").length}`,
  );
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (highCount > 0) {
    console.log(`\n⚠️  发现 ${highCount} 个高优先级问题需要处理!`);
  }
}

main().catch(console.error);
