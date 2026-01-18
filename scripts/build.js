/**
 * 构建脚本 - 复制文件到dist目录供GitHub Pages部署
 * 文件位置: scripts/build.js
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = 'dist';
const CONTENT_DIR = 'content';

// 递归复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  
  fs.mkdirSync(dest, { recursive: true });
  
  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  console.log('🔨 开始构建...');
  
  // 清理dist目录
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  fs.mkdirSync(DIST_DIR);
  
  // 复制index.html
  if (fs.existsSync('index.html')) {
    fs.copyFileSync('index.html', path.join(DIST_DIR, 'index.html'));
    console.log('✅ 复制 index.html');
  }
  
  // 复制content目录
  if (fs.existsSync(CONTENT_DIR)) {
    copyDir(CONTENT_DIR, path.join(DIST_DIR, 'content'));
    console.log('✅ 复制 content/');
  }
  
  console.log('🎉 构建完成！输出目录: dist/');
}

main();
