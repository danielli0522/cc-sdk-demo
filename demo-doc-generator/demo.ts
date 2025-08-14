#!/usr/bin/env npx tsx

/**
 * Claude Code 文档生成器演示脚本
 * 展示所有功能并生成示例文档
 */

import { MockProjectAnalyzer } from './src/mock-analyzer.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runDemo() {
  console.log('🎯 Claude Code 文档生成器 - 完整演示\n');
  console.log('='.repeat(60));

  try {
    // 创建分析器实例
    console.log('🔧 初始化模拟分析器...');
    const analyzer = new MockProjectAnalyzer({
      analysisDepth: 'deep',
      includeArchitecture: true,
      includeMermaidDiagrams: true,
      maxFileSize: 1024 * 1024,
      excludePatterns: ['node_modules', '.git', 'dist', 'build']
    });

    // 分析当前项目
    const projectPath = path.resolve(__dirname, '..');
    const projectName = 'cc-sdk-demo';

    console.log(`📁 分析项目: ${projectName}`);
    console.log(`📍 项目路径: ${projectPath}\n`);

    // 执行分析
    console.log('⏳ 开始智能分析...');
    const result = await analyzer.analyzeProject(projectName, projectPath);

    // 显示分析摘要
    console.log('\n📊 分析结果摘要:');
    console.log(`   🗂️  总文件数: ${result.projectStructure.totalFiles}`);
    console.log(`   📁 目录数量: ${result.projectStructure.directories}`);
    console.log(`   💻 代码文件: ${result.projectStructure.codeFiles}`);
    console.log(`   🧪 测试文件: ${result.projectStructure.testFiles}`);
    console.log(`   ⚙️  配置文件: ${result.projectStructure.configFiles}`);
    console.log(`   🔧 技术栈: ${result.techStack.join(', ')}`);
    console.log(`   📈 复杂度: ${result.complexity.overall} (整体) / ${result.complexity.technical} (技术)\n`);

    // 创建输出目录
    const outputDir = path.join(__dirname, 'demo-output');
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`📂 输出目录: ${outputDir}\n`);

    // 生成三种类型的文档
    const docTypes = [
      { type: 'technical-overview', name: '技术总览', emoji: '📋' },
      { type: 'complex-flow', name: '复杂流程分析', emoji: '🔄' },
      { type: 'problem-diagnosis', name: '问题诊断方案', emoji: '🔍' }
    ] as const;

    console.log('📝 生成技术文档:');
    
    for (const docType of docTypes) {
      console.log(`   ${docType.emoji} 生成${docType.name}...`);
      
      let content: string;
      switch (docType.type) {
        case 'technical-overview':
          content = analyzer.generateTechnicalOverview(result);
          break;
        case 'complex-flow':
          content = analyzer.generateComplexFlowAnalysis(result);
          break;
        case 'problem-diagnosis':
          content = analyzer.generateProblemDiagnosis(result);
          break;
      }

      const filename = `${result.projectName}-${docType.type.charAt(0).toUpperCase() + docType.type.slice(1).replace('-', '-')}.md`;
      const filepath = path.join(outputDir, filename);
      await fs.writeFile(filepath, content, 'utf-8');
      
      console.log(`      ✅ 已保存: ${filename} (${content.length} 字符)`);
    }

    // 生成项目摘要报告
    console.log('\n📊 生成项目摘要报告...');
    const summaryReport = generateSummaryReport(result);
    const summaryPath = path.join(outputDir, `${projectName}-Summary-Report.md`);
    await fs.writeFile(summaryPath, summaryReport, 'utf-8');
    console.log(`   ✅ 已保存: ${projectName}-Summary-Report.md\n`);

    // 显示建议和问题
    if (result.recommendations.length > 0) {
      console.log('💡 智能建议:');
      result.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
      console.log();
    }

    if (result.potentialIssues.length > 0) {
      console.log('⚠️  发现的潜在问题:');
      result.potentialIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      console.log();
    }

    // 功能特性展示
    console.log('🚀 功能特性展示:');
    console.log('   ✅ 智能项目结构分析');
    console.log('   ✅ 自动技术栈检测');
    console.log('   ✅ 复杂度智能评估');
    console.log('   ✅ 多类型文档生成');
    console.log('   ✅ Mermaid 架构图表');
    console.log('   ✅ 问题诊断与建议');
    console.log('   ✅ HTML 仿真测试支持');
    console.log('   ✅ 模块化独立部署\n');

    console.log('🎉 演示完成！');
    console.log(`📁 查看生成的文档: ${outputDir}`);
    console.log('🌐 打开 html-simulator.html 进行在线测试\n');
    
    console.log('='.repeat(60));
    console.log('💻 使用方法:');
    console.log('   npm run demo     # 运行此演示');
    console.log('   npm test         # 运行完整测试');
    console.log('   npm run test:simple  # 运行简化测试');
    console.log('   npm start        # 启动交互式CLI');
    console.log('   open html-simulator.html  # 浏览器测试');
    
  } catch (error) {
    console.error('❌ 演示失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function generateSummaryReport(result: any): string {
  return `# ${result.projectName} - 项目分析摘要报告

## 🎯 项目概况
- **项目名称**: ${result.projectName}
- **分析时间**: ${new Date().toLocaleString()}
- **分析工具**: Claude Code 文档生成器 (模拟模式)

## 📊 核心指标
| 指标 | 数值 | 评估 |
|------|------|------|
| 总文件数 | ${result.projectStructure.totalFiles} | ${getScaleAssessment(result.projectStructure.totalFiles)} |
| 代码文件 | ${result.projectStructure.codeFiles} | ${getCodeAssessment(result.projectStructure.codeFiles)} |
| 测试覆盖 | ${((result.projectStructure.testFiles / result.projectStructure.codeFiles) * 100).toFixed(1)}% | ${getTestCoverageAssessment(result.projectStructure.testFiles, result.projectStructure.codeFiles)} |
| 整体复杂度 | ${result.complexity.overall} | ${getComplexityAssessment(result.complexity.overall)} |

## 🔧 技术栈
${result.techStack.map((tech: string) => `- ${tech}`).join('\n')}

## 📁 文件分布
${Object.entries(result.projectStructure.filesByExtension)
  .sort(([,a], [,b]) => (b as number) - (a as number))
  .slice(0, 8)
  .map(([ext, count]) => `- **${ext || '无扩展名'}**: ${count} 个文件`)
  .join('\n')}

## 🎯 复杂度分析
- **整体复杂度**: ${result.complexity.overall}
- **业务复杂度**: ${result.complexity.business}  
- **技术复杂度**: ${result.complexity.technical}

## 🔑 关键文件
${result.keyFiles.map((file: string) => `- ${file}`).join('\n')}

## 💡 改进建议 (Top 5)
${result.recommendations.slice(0, 5).map((rec: string, index: number) => `${index + 1}. ${rec}`).join('\n')}

## ⚠️ 需要关注的问题
${result.potentialIssues.length > 0 
  ? result.potentialIssues.map((issue: string, index: number) => `${index + 1}. ${issue}`).join('\n')
  : '✅ 暂无明显问题'
}

## 📈 下一步行动计划

### 立即行动 (本周)
- [ ] ${result.recommendations[0] || '维持当前良好状态'}
- [ ] ${result.recommendations[1] || '定期进行代码回顾'}

### 短期目标 (1个月内)
- [ ] ${result.recommendations[2] || '完善测试覆盖率'}
- [ ] ${result.recommendations[3] || '优化项目结构'}

### 长期规划 (3个月内)  
- [ ] ${result.recommendations[4] || '建立CI/CD流程'}
- [ ] 定期重新评估项目复杂度

---
*本报告由 Claude Code 文档生成器自动生成*  
*建议每月更新一次分析报告*`;
}

// 辅助评估函数
function getScaleAssessment(fileCount: number): string {
  if (fileCount < 50) return '小型项目 📝';
  if (fileCount < 200) return '中型项目 📊';
  return '大型项目 📚';
}

function getCodeAssessment(codeFiles: number): string {
  if (codeFiles < 30) return '简单 🟢';
  if (codeFiles < 100) return '适中 🟡';
  return '复杂 🔴';
}

function getTestCoverageAssessment(testFiles: number, codeFiles: number): string {
  const ratio = testFiles / codeFiles;
  if (ratio >= 0.5) return '优秀 🟢';
  if (ratio >= 0.3) return '良好 🟡';
  if (ratio >= 0.1) return '不足 🟠';
  return '缺失 🔴';
}

function getComplexityAssessment(complexity: string): string {
  switch (complexity) {
    case 'low': return '可控 🟢';
    case 'medium': return '适中 🟡';
    case 'high': return '复杂 🔴';
    default: return '未知 ⚪';
  }
}

// 运行演示
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(error => {
    console.error('❌ 演示执行出错:', error);
    process.exit(1);
  });
}
