# Docker 部署说明

## 项目结构
```
new_year_wish_exchange/
├── backend/          # 后端服务
│   ├── Dockerfile    # 后端 Docker 配置
│   └── ...           # 后端代码
├── frontend/         # 前端服务
│   ├── Dockerfile    # 前端 Docker 配置
│   ├── nginx.conf    # Nginx 配置
│   └── ...           # 前端代码
├── data/             # 数据目录
└── docker-compose.yml # Docker Compose 配置
```

## 部署步骤

### 1. 安装 Docker 和 Docker Compose
确保你的系统已经安装了 Docker 和 Docker Compose。如果没有安装，可以参考官方文档：
- [Docker 安装文档](https://docs.docker.com/get-docker/)
- [Docker Compose 安装文档](https://docs.docker.com/compose/install/)

### 2. 克隆项目
```bash
git clone https://github.com/your-repo/new_year_wish_exchange.git
cd new_year_wish_exchange
```

### 3. 构建和启动服务

#### 方式一：使用 Docker Compose（推荐）
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f
```

#### 方式二：手动构建和运行

**后端服务：**
```bash
cd backend
docker build -t new-year-exchange-backend .
docker run -d --name new-year-exchange-backend -p 3000:3000 -v $(pwd)/../data:/app/data new-year-exchange-backend
```

**前端服务：**
```bash
cd frontend
docker build -t new-year-exchange-frontend .
docker run -d --name new-year-exchange-frontend -p 80:80 --link new-year-exchange-backend:backend new-year-exchange-frontend
```

### 4. 访问应用
服务启动后，可以通过以下地址访问：
- 前端应用：http://localhost
- 后端 API：http://localhost:3000

## 服务说明

### 后端服务
- **镜像名：** `new-year-exchange-backend`
- **容器名：** `new-year-exchange-backend`
- **端口映射：** `3000:3000`
- **数据卷：** `./data:/app/data` - 用于持久化数据
- **环境变量：**
  - `PORT`: 服务端口，默认 3000
  - `TZ`: 时区，默认 Asia/Shanghai

### 前端服务
- **镜像名：** `new-year-exchange-frontend`
- **容器名：** `new-year-exchange-frontend`
- **端口映射：** `80:80`
- **依赖：** 依赖于后端服务
- **环境变量：**
  - `TZ`: 时区，默认 Asia/Shanghai

## 配置说明

### Nginx 配置
前端服务使用 Nginx 作为 Web 服务器，主要配置包括：
- 前端路由处理：所有非静态文件请求都返回 index.html
- API 反向代理：将 /api 路径的请求代理到后端服务
- 静态文件缓存：设置静态资源的缓存策略

### 前端请求配置
前端使用 Axios 发送请求，配置了：
- 基础 URL：`/api/v1`
- 请求超时：10 秒
- 请求/响应拦截器：处理 Token 和错误信息

## 管理命令

### 启动/停止服务
```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看指定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 进入容器
```bash
# 进入后端容器
docker exec -it new-year-exchange-backend sh

# 进入前端容器
docker exec -it new-year-exchange-frontend sh
```

### 更新服务
```bash
# 拉取最新代码
git pull

# 重新构建并启动服务
docker-compose up -d --build
```

## 常见问题

### 1. 前端无法访问后端 API
- 检查后端服务是否正常运行：`docker-compose logs backend`
- 检查 Nginx 配置是否正确：`docker exec -it new-year-exchange-frontend cat /etc/nginx/conf.d/default.conf`
- 检查前端请求配置：确认 baseURL 为 `/api/v1`

### 2. 服务启动失败
- 查看服务日志：`docker-compose logs -f`
- 检查端口是否被占用：`netstat -tlnp | grep 3000` 或 `netstat -tlnp | grep 80`
- 检查数据卷权限：确保 data 目录有正确的读写权限

### 3. 数据持久化问题
- 确保 data 目录存在且有正确的权限：`mkdir -p data && chmod 755 data`
- 检查数据卷映射是否正确：`docker inspect new-year-exchange-backend | grep Mounts`

## 开发建议

### 1. 本地开发
- 后端：使用 `npm run dev` 启动开发服务器
- 前端：使用 `npm run dev` 启动开发服务器，并配置代理到后端服务

### 2. 环境变量
根据不同环境，可以创建不同的 `.env` 文件，例如：
- `.env.development`：开发环境配置
- `.env.production`：生产环境配置

### 3. CI/CD
可以集成 CI/CD 工具，例如 GitHub Actions，实现自动构建和部署。

## 注意事项

1. 确保 Docker 和 Docker Compose 版本符合要求
2. 生产环境建议使用 HTTPS
3. 定期备份数据目录
4. 根据实际情况调整 Nginx 配置和缓存策略
5. 监控服务运行状态，及时处理异常

## 版本说明

- **v1.0.0**：初始版本，支持基本的祝福墙功能
- **v1.1.0**：添加了管理员功能
- **v1.2.0**：优化了 UI 设计，添加了动画效果

---

希望这个文档能帮助你顺利部署和管理项目！如果有任何问题，欢迎提交 Issue 或 Pull Request。