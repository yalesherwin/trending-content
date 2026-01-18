/**
 * 索引更新脚本 - 更新内容索引文件
 * 文件位置: scripts/update-index.js
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = 'content';
const INDEX_FILE = path.join(CONTENT_DIR, 'index.json');

// 递归获取所有JSON文件
function getAllJsonFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      getAllJsonFiles(fullPath, files);
    } else if (item.startsWith('content_') && item.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// 从文件路径提取日期和小时
function extractDateInfo(filePath) {
  // content/2025/01/18/content_2025-01-18_14.json
  const fileName = path.basename(filePath, '.json');
  const match = fileName.match(/content_(\d{4}-\d{2}-\d{2})_(\d{2})/);
  
  if (match) {
    return {
      date: match[1],
      hour: match[2]
    };
  }
  return null;
}

// 主函数
function main() {
  console.log('📑 更新内容索引...');
  
  // 确保content目录存在
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }
  
  // 获取所有JSON文件
  const jsonFiles = getAllJsonFiles(CONTENT_DIR);
  
  // 构建索引
  const entries = [];
  
  for (const filePath of jsonFiles) {
    const dateInfo = extractDateInfo(filePath);
    if (!dateInfo) continue;
    
    // 转换为相对路径
    const relativePath = path.relative(CONTENT_DIR, filePath);
    const mdPath = relativePath.replace('.json', '.md');
    
    entries.push({
      date: dateInfo.date,
      hour: dateInfo.hour,
      file_json: relativePath,
      file_md: mdPath
    });
  }
  
  // 按日期和小时排序（最新在前）
  entries.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.hour.localeCompare(a.hour);
  });
  
  // 创建索引对象
  const index = {
    last_updated: new Date().toISOString(),
    total_count: entries.length,
    entries
  };
  
  // 保存索引文件
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
  
  console.log(`✅ 索引已更新: ${INDEX_FILE}`);
  console.log(`   共 ${entries.length} 条内容`);
}

main();
