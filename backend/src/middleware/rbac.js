// 基于角色的访问控制中间件

// 定义角色权限映射
const rolePermissions = {
  superadmin: {
    cards: ['read', 'write', 'delete', 'export', 'import'],
    config: ['read', 'write'],
    stats: ['read'],
    system: ['reset']
  },
  admin: {
    cards: ['read', 'write', 'delete', 'export'],
    config: ['read', 'write'],
    stats: ['read']
  },
  viewer: {
    cards: ['read', 'export'],
    stats: ['read']
  }
}

// 检查用户是否有权限执行特定操作
export function checkPermission(resource, action) {
  return async (ctx, next) => {
    const user = ctx.state.user
    if (!user) {
      ctx.status = 401
      ctx.body = { code: 401, message: 'Unauthorized: No user found' }
      return
    }

    const permissions = rolePermissions[user.role] || rolePermissions.viewer
    const resourcePermissions = permissions[resource] || []

    if (!resourcePermissions.includes(action)) {
      ctx.status = 403
      ctx.body = { code: 403, message: 'Forbidden: Insufficient permissions' }
      return
    }

    await next()
  }
}