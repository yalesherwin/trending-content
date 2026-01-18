/**
 * 内容生成脚本 - 通过Claude API生成热门内容
 * 文件位置: scripts/generate-content.js
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic();

// 获取当前时间信息
function getTimeInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  
  return {
    date: `${year}-${month}-${day}`,
    hour,
    year,
    month,
    day,
    isoString: now.toISOString()
  };
}

// 确保目录存在
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 生成内容的提示词
function buildPrompt(timeInfo) {
  return `你是一个专业的中文社交媒体内容创作者。现在是 ${timeInfo.date} ${timeInfo.hour}:00。

请搜索当前最新的热点话题，然后生成3篇内容：

## 任务要求

### 1. 经济热点文章（傅鹏风格）
- 风格：口语化、轻松幽默，用大白话解释复杂经济概念
- 常用口头禅："你看啊"、"说白了"、"本质上"
- 善用生活化比喻
- 观点犀利但理性

### 2. 励志故事（外贸叙事风格）
- 以第一人称讲述
- 开头设置悬念或冲突
- 包含具体细节（金额、时间、对话）
- 结尾升华为人生道理

### 3. 爆款文案
- 标题吸引眼球
- 开头3秒抓住注意力
- 情绪共鸣强，有金句

## 输出要求

每篇文章包含：
- 标题：吸引人，15字以内
- 摘要：50字以内
- 正文：900字以内
- 标签：3-5个相关标签

请严格按照以下JSON格式输出：

\`\`\`json
{
  "meta": {
    "date": "${timeInfo.date}",
    "hour": "${timeInfo.hour}",
    "generated_at": "${timeInfo.isoString}"
  },
  "contents": [
    {
      "id": "economy_${timeInfo.date.replace(/-/g, '')}_${timeInfo.hour}",
      "type": "economy",
      "type_cn": "经济热点",
      "icon": "💰",
      "title": "标题",
      "summary": "摘要",
      "content": "正文",
      "word_count": 字数,
      "tags": ["标签1", "标签2", "标签3"],
      "source_topic": "基于的热点"
    },
    {
      "id": "inspiration_${timeInfo.date.replace(/-/g, '')}_${timeInfo.hour}",
      "type": "inspiration",
      "type_cn": "励志故事",
      "icon": "💪",
      "title": "标题",
      "summary": "摘要",
      "content": "正文",
      "word_count": 字数,
      "tags": ["标签1", "标签2"],
      "source_topic": "基于的热点"
    },
    {
      "id": "viral_${timeInfo.date.replace(/-/g, '')}_${timeInfo.hour}",
      "type": "viral",
      "type_cn": "爆款文案",
      "icon": "🔥",
      "title": "标题",
      "summary": "摘要",
      "content": "正文",
      "word_count": 字数,
      "tags": ["标签1", "标签2"],
      "source_topic": "基于的热点"
    }
  ]
}
\`\`\`

请先搜索今日热点，然后生成内容。`;
}

// 将JSON转换为Markdown
function jsonToMarkdown(data) {
  const { meta, contents } = data;
  
  let md = `---
date: ${meta.date}
hour: ${meta.hour}
generated_at: ${meta.generated_at}
---

# 📰 每小时热门内容 | ${meta.date} ${meta.hour}:00

`;

  for (const item of contents) {
    md += `---

## ${item.icon} ${item.type_cn}

### ${item.title}

> **摘要：** ${item.summary}

**标签：** ${item.tags.map(t => `\`${t}\``).join(' ')}

${item.content}

`;
  }

  md += `---

*本内容由AI自动生成，基于当前热点话题*
*生成时间: ${meta.generated_at}*
`;

  return md;
}

// 主函数
async function main() {
  const timeInfo = getTimeInfo();
  
  console.log(`🚀 开始生成内容: ${timeInfo.date} ${timeInfo.hour}:00`);
  
  // 构建提示词
  const prompt = buildPrompt(timeInfo);
  
  try {
    // 调用Claude API
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    
    // 提取JSON内容
    const text = response.content[0].text;
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    
    if (!jsonMatch) {
      throw new Error('无法解析JSON输出');
    }
    
    const contentData = JSON.parse(jsonMatch[1]);
    
    // 创建目录
    const contentDir = path.join('content', timeInfo.year, timeInfo.month, timeInfo.day);
    ensureDir(contentDir);
    
    // 保存JSON文件
    const jsonFileName = `content_${timeInfo.date}_${timeInfo.hour}.json`;
    const jsonFilePath = path.join(contentDir, jsonFileName);
    fs.writeFileSync(jsonFilePath, JSON.stringify(contentData, null, 2), 'utf-8');
    console.log(`✅ JSON已保存: ${jsonFilePath}`);
    
    // 保存Markdown文件
    const mdFileName = `content_${timeInfo.date}_${timeInfo.hour}.md`;
    const mdFilePath = path.join(contentDir, mdFileName);
    const markdown = jsonToMarkdown(contentData);
    fs.writeFileSync(mdFilePath, markdown, 'utf-8');
    console.log(`✅ Markdown已保存: ${mdFilePath}`);
    
    console.log('🎉 内容生成完成！');
    
  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    process.exit(1);
  }
}

main();
