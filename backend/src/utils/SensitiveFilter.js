import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SensitiveFilter {
    constructor() {
        this.trie = new Map(); // 使用 Map 提升查找性能
        this.isReady = false;
    }

    // 初始化：读取文件构建 DFA 树
    init() {
        const filePath = path.join(__dirname, '../../data/sensitive_words.txt');
        try {
            // 确保 data 目录下有该 txt 文件，每行一个词
            if (!fs.existsSync(filePath)) {
                console.warn('[Security] Warning: sensitive_words.txt not found.');
                return;
            }
            
            const content = fs.readFileSync(filePath, 'utf-8');
            const words = content.split(/\r?\n/);
            
            words.forEach(word => {
                const w = word.trim();
                if (!w || w.startsWith('#')) return; // 忽略空行和注释
                
                let node = this.trie;
                for (const char of w) {
                    if (!node.has(char)) {
                        node.set(char, new Map());
                    }
                    node = node.get(char);
                }
                node.set('isEnd', true); // 标记词尾
            });
            
            this.isReady = true;
            console.log(`[Security] Sensitive dictionary loaded. Count: ${words.length}`);
        } catch (e) {
            console.error('[Security] Error loading dictionary:', e);
        }
    }

    // 检查文本，返回第一个发现的敏感词，未发现返回 null
    check(text) {
        if (!this.isReady || !text) return null;

        for (let i = 0; i < text.length; i++) {
            let node = this.trie;
            let j = i;
            
            while (j < text.length) {
                const char = text[j];
                if (!node.has(char)) break;
                
                node = node.get(char);
                if (node.get('isEnd')) {
                    return text.substring(i, j + 1); // 命中
                }
                j++;
            }
        }
        return null; // 通过
    }
    
    // 获取词库列表（供前端缓存用）
    getWordList() {
        const filePath = path.join(__dirname, '../../data/sensitive_words.txt');
        if (!fs.existsSync(filePath)) return [];
        return fs.readFileSync(filePath, 'utf-8')
            .split(/\r?\n/)
            .map(w => w.trim())
            .filter(w => w && !w.startsWith('#'));
    }
}

export default new SensitiveFilter();
