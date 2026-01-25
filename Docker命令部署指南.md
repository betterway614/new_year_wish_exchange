# Docker 命令部署指南

## 前置准备

1. 确保已安装 Docker
2. 确保已上传项目文件到服务器
3. 确保端口 80 和 3000 未被占用

## 构建镜像

### 1. 构建后端镜像

```bash
cd /path/to/backend
docker build -f Dockerfile.baota -t new-year-exchange-backend:latest .
```

### 2. 构建前端镜像

```bash
cd /path/to/frontend
docker build -f Dockerfile.baota -t new-year-exchange-frontend:latest .
```

## 创建数据卷（可选）

如果需要持久化数据，创建数据卷：

```bash
# 创建数据目录
mkdir -p /www/wwwroot/new_year_exchange/data

# 设置权限
chmod -R 755 /www/wwwroot/new_year_exchange/data
```

## 创建网络（可选）

如果需要容器间通信，创建自定义网络：

```bash
docker network create new-year-network
```

## 运行后端容器

### 基本命令

```bash
docker run -d \
  --name new-year-exchange-backend \
  -p 3000:3000 \
  -v /www/wwwroot/new_year_exchange/data:/app/data \
  -e PORT=3000 \
  -e TZ=Asia/Shanghai \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret-key-change-this-in-production \
  --restart=always \
  new-year-exchange-backend:latest
```

### 参数说明

| 参数 | 说明 |
|------|------|
| `-d` | 后台运行 |
| `--name` | 容器名称 |
| `-p 3000:3000` | 端口映射：宿主机3000 -> 容器3000 |
| `-v` | 数据卷挂载 |
| `-e` | 环境变量 |
| `--restart=always` | 自动重启策略 |

### 使用自定义网络

```bash
docker run -d \
  --name new-year-exchange-backend \
  --network new-year-network \
  -p 3000:3000 \
  -v /www/wwwroot/new_year_exchange/data:/app/data \
  -e PORT=3000 \
  -e TZ=Asia/Shanghai \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret-key-change-this-in-production \
  --restart=always \
  new-year-exchange-backend:latest
```

## 运行前端容器

### 基本命令

```bash
docker run -d \
  --name new-year-exchange-frontend \
  -p 80:80 \
  --link new-year-exchange-backend:backend \
  -e TZ=Asia/Shanghai \
  --restart=always \
  new-year-exchange-frontend:latest
```

### 使用自定义网络

```bash
docker run -d \
  --name new-year-exchange-frontend \
  --network new-year-network \
  -p 80:80 \
  -e TZ=Asia/Shanghai \
  --restart=always \
  new-year-exchange-frontend:latest
```

## 验证部署

### 1. 检查容器状态

```bash
docker ps
```

应该看到两个容器都在运行：
- `new-year-exchange-backend`
- `new-year-exchange-frontend`

### 2. 查看容器日志

```bash
# 查看后端日志
docker logs -f new-year-exchange-backend

# 查看前端日志
docker logs -f new-year-exchange-frontend
```

### 3. 测试服务

```bash
# 测试后端
curl http://localhost:3000/api/v1/health

# 测试前端
curl http://localhost
```

## 容器管理命令

### 启动/停止/重启

```bash
# 启动容器
docker start new-year-exchange-backend
docker start new-year-exchange-frontend

# 停止容器
docker stop new-year-exchange-backend
docker stop new-year-exchange-frontend

# 重启容器
docker restart new-year-exchange-backend
docker restart new-year-exchange-frontend
```

### 删除容器

```bash
# 停止并删除容器
docker stop new-year-exchange-backend
docker rm new-year-exchange-backend

docker stop new-year-exchange-frontend
docker rm new-year-exchange-frontend
```

### 查看容器信息

```bash
# 查看容器详情
docker inspect new-year-exchange-backend

# 查看容器资源使用
docker stats new-year-exchange-backend

# 查看容器进程
docker top new-year-exchange-backend
```

### 进入容器

```bash
# 进入后端容器
docker exec -it new-year-exchange-backend sh

# 进入前端容器
docker exec -it new-year-exchange-frontend sh
```

## 更新部署

### 1. 停止并删除旧容器

```bash
docker stop new-year-exchange-backend new-year-exchange-frontend
docker rm new-year-exchange-backend new-year-exchange-frontend
```

### 2. 重新构建镜像

```bash
cd /path/to/backend
docker build -f Dockerfile.baota -t new-year-exchange-backend:latest .

cd /path/to/frontend
docker build -f Dockerfile.baota -t new-year-exchange-frontend:latest .
```

### 3. 启动新容器

```bash
# 启动后端
docker run -d \
  --name new-year-exchange-backend \
  -p 3000:3000 \
  -v /www/wwwroot/new_year_exchange/data:/app/data \
  -e PORT=3000 \
  -e TZ=Asia/Shanghai \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret-key-change-this-in-production \
  --restart=always \
  new-year-exchange-backend:latest

# 启动前端
docker run -d \
  --name new-year-exchange-frontend \
  -p 80:80 \
  --link new-year-exchange-backend:backend \
  -e TZ=Asia/Shanghai \
  --restart=always \
  new-year-exchange-frontend:latest
```

## 镜像管理

### 查看镜像

```bash
docker images
```

### 删除镜像

```bash
# 删除指定镜像
docker rmi new-year-exchange-backend:latest
docker rmi new-year-exchange-frontend:latest

# 删除所有未使用的镜像
docker image prune -a
```

### 导出/导入镜像

```bash
# 导出镜像
docker save -o backend.tar new-year-exchange-backend:latest
docker save -o frontend.tar new-year-exchange-frontend:latest

# 导入镜像
docker load -i backend.tar
docker load -i frontend.tar
```

## 数据备份

### 备份数据库

```bash
# 复制数据库文件
cp /www/wwwroot/new_year_exchange/data/cards.sqlite /backup/cards.sqlite.$(date +%Y%m%d)

# 或者使用 docker cp
docker cp new-year-exchange-backend:/app/data/cards.sqlite /backup/cards.sqlite.$(date +%Y%m%d)
```

### 恢复数据库

```bash
# 停止容器
docker stop new-year-exchange-backend

# 恢复数据库
cp /backup/cards.sqlite.20250124 /www/wwwroot/new_year_exchange/data/cards.sqlite

# 重启容器
docker start new-year-exchange-backend
```

## 故障排查

### 1. 容器无法启动

```bash
# 查看容器日志
docker logs new-year-exchange-backend

# 查看容器退出状态
docker ps -a
```

### 2. 端口冲突

```bash
# 查看端口占用
netstat -tlnp | grep 80
netstat -tlnp | grep 3000

# 修改端口映射
docker run -d --name new-year-exchange-backend -p 8080:3000 ...
```

### 3. 数据卷权限问题

```bash
# 修改数据目录权限
chmod -R 755 /www/wwwroot/new_year_exchange/data
chown -R 1001:1001 /www/wwwroot/new_year_exchange/data
```

### 4. 网络连接问题

```bash
# 检查容器网络
docker network inspect new-year-network

# 测试容器间连接
docker exec -it new-year-exchange-frontend ping backend
```

## 完整部署脚本

创建一个部署脚本 `deploy.sh`：

```bash
#!/bin/bash

# 设置变量
BACKEND_IMAGE="new-year-exchange-backend:latest"
FRONTEND_IMAGE="new-year-exchange-frontend:latest"
DATA_DIR="/www/wwwroot/new_year_exchange/data"

# 停止旧容器
echo "停止旧容器..."
docker stop new-year-exchange-backend new-year-exchange-frontend 2>/dev/null
docker rm new-year-exchange-backend new-year-exchange-frontend 2>/dev/null

# 创建数据目录
echo "创建数据目录..."
mkdir -p $DATA_DIR
chmod -R 755 $DATA_DIR

# 构建镜像
echo "构建后端镜像..."
cd backend
docker build -f Dockerfile.baota -t $BACKEND_IMAGE .

echo "构建前端镜像..."
cd ../frontend
docker build -f Dockerfile.baota -t $FRONTEND_IMAGE .

# 启动后端容器
echo "启动后端容器..."
docker run -d \
  --name new-year-exchange-backend \
  -p 3000:3000 \
  -v $DATA_DIR:/app/data \
  -e PORT=3000 \
  -e TZ=Asia/Shanghai \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret-key-change-this-in-production \
  --restart=always \
  $BACKEND_IMAGE

# 启动前端容器
echo "启动前端容器..."
docker run -d \
  --name new-year-exchange-frontend \
  -p 80:80 \
  --link new-year-exchange-backend:backend \
  -e TZ=Asia/Shanghai \
  --restart=always \
  $FRONTEND_IMAGE

echo "部署完成！"
echo "前端访问地址: http://$(hostname -I | awk '{print $1}')"
echo "后端访问地址: http://$(hostname -I | awk '{print $1}'):3000"
```

使用脚本：

```bash
chmod +x deploy.sh
./deploy.sh
```

## 安全建议

1. 修改 JWT_SECRET 为强密码
2. 使用防火墙限制访问
3. 定期备份数据
4. 监控容器日志
5. 及时更新镜像

## 访问应用

部署完成后，访问：
- 前端：http://your-server-ip
- 管理员后台：http://your-server-ip/admin
- 后端API：http://your-server-ip:3000/api

默认管理员账号：
- 用户名：admin
- 密码：betterway614
