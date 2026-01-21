FROM node:20-alpine

# 创建非root用户
RUN addgroup -g 1001 -S nodejs \
    && adduser -S appuser -u 1001

WORKDIR /app

# 复制并安装依赖
COPY package.json ./
RUN npm install --omit=dev

# 复制应用代码
COPY src ./src
COPY data ./data

# 设置数据目录权限（如果需要写入）
RUN chown -R appuser:nodejs /app/data

# 切换到非root用户
USER appuser

EXPOSE 3000
CMD ["node", "src/app.js"]

