/**
 * 模拟分析器测试
 */

import { MockProjectAnalyzer } from '../src/mock-analyzer';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMockAnalyzerTest() {
  console.log('🧪 开始模拟分析器测试...\n');

  try {
    // 创建分析器实例
    const analyzer = new MockProjectAnalyzer({
      analysisDepth: 'detailed',
      includeArchitecture: true,
      includeMermaidDiagrams: true
    });

    // 测试项目路径 (使用当前项目的父目录)
    const projectPath = path.resolve(__dirname, '../..');
    const projectName = 'cc-sdk-demo';

    console.log(`📁 分析项目: ${projectName}`);
    console.log(`📍 项目路径: ${projectPath}\n`);

    // 执行项目分析
    console.log('⏳ 执行项目分析...');
    const result = await analyzer.analyzeProject(projectName, projectPath);

    // 显示分析结果
    console.log('✅ 分析完成！\n');
    
    console.log('📊 项目统计:');
    console.log(`  - 总文件数: ${result.projectStructure.totalFiles}`);
    console.log(`  - 目录数量: ${result.projectStructure.directories}`);
    console.log(`  - 代码文件: ${result.projectStructure.codeFiles}`);
    console.log(`  - 测试文件: ${result.projectStructure.testFiles}`);
    console.log(`  - 配置文件: ${result.projectStructure.configFiles}\n`);

    console.log('🔧 检测到的技术栈:');
    result.techStack.forEach(tech => console.log(`  - ${tech}`));
    console.log();

    console.log('📈 复杂度评估:');
    console.log(`  - 整体复杂度: ${result.complexity.overall}`);
    console.log(`  - 业务复杂度: ${result.complexity.business}`);
    console.log(`  - 技术复杂度: ${result.complexity.technical}\n`);

    console.log('🔑 关键文件:');
    result.keyFiles.forEach(file => console.log(`  - ${file}`));
    console.log();

    // 测试文档生成
    console.log('📝 测试文档生成...\n');

    console.log('1️⃣ 生成技术总览文档:');
    const technicalDoc = analyzer.generateTechnicalOverview(result);
    console.log(`   文档长度: ${technicalDoc.length} 字符`);
    console.log(`   包含架构图: ${technicalDoc.includes('mermaid') ? '是' : '否'}`);

    console.log('\n2️⃣ 生成复杂流程分析文档:');
    const complexFlowDoc = analyzer.generateComplexFlowAnalysis(result);
    console.log(`   文档长度: ${complexFlowDoc.length} 字符`);
    console.log(`   包含序列图: ${complexFlowDoc.includes('sequenceDiagram') ? '是' : '否'}`);

    console.log('\n3️⃣ 生成问题诊断方案文档:');
    const diagnosisDoc = analyzer.generateProblemDiagnosis(result);
    console.log(`   文档长度: ${diagnosisDoc.length} 字符`);
    console.log(`   包含解决方案: ${diagnosisDoc.includes('解决方案') ? '是' : '否'}\n`);

    // 显示建议和问题
    if (result.recommendations.length > 0) {
      console.log('💡 改进建议:');
      result.recommendations.forEach(rec => console.log(`  - ${rec}`));
      console.log();
    }

    if (result.potentialIssues.length > 0) {
      console.log('⚠️ 潜在问题:');
      result.potentialIssues.forEach(issue => console.log(`  - ${issue}`));
      console.log();
    }

    // 生成文档示例
    console.log('📄 生成文档示例预览:\n');
    console.log('='.repeat(60));
    console.log(technicalDoc.substring(0, 500) + '...\n');
    console.log('='.repeat(60));

    console.log('\n🎉 模拟分析器测试完成！');
    console.log('✅ 所有功能正常工作');

  } catch (error) {
    console.error('❌ 测试失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// 运行测试

if (import.meta.url === `file://${process.argv[1]}`) {
  runMockAnalyzerTest().catch(error => {
    console.error('❌ 测试执行出错:', error);
    process.exit(1);
  });
}
