# 新春悦换 API 接口文档 (V1.2)

## 基础信息
- 基础路径: `/api/v1`
- 返回格式: `application/json`
- 通用字段: `code`(0成功), `message`(错误信息), `data`(业务数据)

## A. 提交祝福卡
- URL: `POST /api/v1/card`
- Payload:
```
{
  "uuid": "550e8400-...",
  "nickname": "张三",
  "content": "新年快乐...",
  "style_id": 1
}
```
- 说明:
- `uuid` 必填，客户端生成并复用
- `nickname` 必填，2-10字；`content` 10-200字；`style_id` ∈ [0,1,2]
- 响应:
```
{ "code": 0, "message": "ok" }
```

## B. 查询我的匹配状态
- URL: `GET /api/v1/card/my?uuid=xxx`
- 响应(匹配成功):
```
{
  "code": 0,
  "data": {
    "status": "MATCHED",
    "self": { "nickname": "...", "content": "...", "style_id": 0 },
    "target": { "nickname": "...", "content": "...", "style_id": 2 }
  }
}
```
- 响应(等待中):
```
{ "code": 0, "data": { "status": "WAITING" } }
```
- 说明:
- 轮询频率建议 2s
- 启用懒匹配：当池非空时自动匹配；“最后一人”兜底匹配系统卡 `system_bot`

## C. 参与人数统计
- URL: `GET /api/v1/stats`
- 响应:
```
{ "code": 0, "data": { "count": 42 } }
```

## 错误码
- `code=1`: 参数错误或非法值
- `404`: 未找到资源

