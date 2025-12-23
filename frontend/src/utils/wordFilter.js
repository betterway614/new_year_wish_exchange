import request from './request'

class FrontendFilter {
    constructor() {
        this.trie = new Map();
        this.isReady = false;
    }

    // 从后端拉取并构建
    async init() {
        if (this.isReady) return;
        try {
            // 尝试从 localStorage 读取缓存 (简单优化，可选)
            const cached = localStorage.getItem('sensitive_dict');
            const cachedTime = localStorage.getItem('sensitive_dict_time');
            const now = Date.now();

            // 如果有缓存且在24小时内
            if (cached && cachedTime && (now - cachedTime < 86400000)) {
                try {
                    const words = JSON.parse(cached);
                    this.buildTrie(words);
                    this.isReady = true;
                    // 后台静默更新
                    this.fetchAndCache();
                    return;
                } catch (e) {
                    console.warn('Invalid cache');
                }
            }

            await this.fetchAndCache();
        } catch (e) {
            console.warn('词库加载失败，仅依赖后端校验', e);
        }
    }

    async fetchAndCache() {
        const res = await request.get('/common/dict');
        if (res.code === 0 && Array.isArray(res.data)) {
            this.buildTrie(res.data);
            this.isReady = true;
            localStorage.setItem('sensitive_dict', JSON.stringify(res.data));
            localStorage.setItem('sensitive_dict_time', Date.now());
        }
    }

    buildTrie(words) {
        this.trie = new Map(); // Reset
        for (const word of words) {
            if (!word) continue;
            let node = this.trie;
            for (const char of word) {
                if (!node.has(char)) node.set(char, new Map());
                node = node.get(char);
            }
            node.set('isEnd', true);
        }
    }

    validate(text) {
        if (!this.isReady || !text) return { valid: true };
        
        for (let i = 0; i < text.length; i++) {
            let node = this.trie;
            let j = i;
            while (j < text.length) {
                const char = text[j];
                if (!node.has(char)) break;
                node = node.get(char);
                if (node.get('isEnd')) {
                    return { valid: false, word: text.substring(i, j + 1) };
                }
                j++;
            }
        }
        return { valid: true };
    }
}

export default new FrontendFilter();
