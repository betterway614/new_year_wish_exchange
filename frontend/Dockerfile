# 第一阶段：构建前端应用
FROM node:20-alpine as build

# 创建非root用户
RUN addgroup -g 1001 -S nodejs \
    && adduser -S appuser -u 1001

WORKDIR /app

# 复制并安装依赖
COPY package.json package-lock.json ./
RUN npm install

# 复制应用代码
COPY . .

# 设置工作目录权限
RUN chown -R appuser:nodejs /app

# 使用非root用户构建
USER appuser
RUN npm run build

# 第二阶段：使用 Nginx 部署
FROM nginx:stable-alpine

# 创建非root用户
RUN addgroup -g 1001 -S nginxgroup \
    && adduser -S nginxuser -u 1001 -G nginxgroup

# 修改Nginx配置文件权限
RUN chown -R nginxuser:nginxgroup /etc/nginx/conf.d \
    && chown -R nginxuser:nginxgroup /usr/share/nginx/html \
    && chown -R nginxuser:nginxgroup /var/cache/nginx \
    && chown -R nginxuser:nginxgroup /var/log/nginx

# 修改Nginx监听端口为8080（非特权端口）
RUN sed -i 's/listen       80;/listen       8080;/g' /etc/nginx/conf.d/default.conf \
    && sed -i 's/listen  [::]:80;/listen  [::]:8080;/g' /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 切换到非root用户
USER nginxuser

# 暴露非特权端口
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]