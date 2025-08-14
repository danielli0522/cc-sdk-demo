// 现代 TypeScript 代码示例，用于测试特定重构类型

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  role: 'admin' | 'user' | 'guest';
  active: boolean;
  membershipLevel?: 'basic' | 'premium';
}

interface Order {
  id: string;
  userId: string;
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const users: User[] = [];
let currentUser: User | null = null;

// 这个函数可以进一步优化性能
export function findUsersByRole(role: string): User[] {
  const result: User[] = [];
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) { // 意外的嵌套循环
      if (users[i].role === role && users[i].active) {
        result.push(users[i]);
        break;
      }
    }
  }
  return result;
}

// 可以提取重复逻辑的函数
export function calculateOrderTotal(order: Order): number {
  let total = 0;
  for (const item of order.items) {
    total += item.price * item.quantity;
  }
  // 重复计算税费的逻辑
  const tax = total * 0.1;
  const shipping = total > 100 ? 0 : 10;
  return total + tax + shipping;
}

export function calculateCartTotal(items: OrderItem[]): number {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  // 相同的税费计算逻辑
  const tax = total * 0.1;
  const shipping = total > 100 ? 0 : 10;
  return total + tax + shipping;
}

// 变量命名可以改善的函数
export function processData(d: any[]): any[] {
  const r: any[] = [];
  for (const x of d) {
    if (x.s === 'active') {
      const tmp = {
        i: x.id,
        n: x.name,
        v: x.value
      };
      r.push(tmp);
    }
  }
  return r;
}

// 可以简化的复杂条件
export function getDiscountRate(user: User, order: Order): number {
  if (user.active === true) {
    if (user.membershipLevel === 'premium') {
      if (order.total >= 500) {
        return 0.2;
      } else if (order.total >= 200) {
        return 0.15;
      } else {
        return 0.1;
      }
    } else {
      if (order.total >= 300) {
        return 0.1;
      } else if (order.total >= 100) {
        return 0.05;
      } else {
        return 0;
      }
    }
  } else {
    return 0;
  }
}

// 可以现代化的语法
export function transformUsers(users: User[]): any[] {
  var result = [];
  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    var transformed = {
      fullName: user.name,
      contactEmail: user.email,
      userRole: user.role,
      isActive: user.active
    };
    result.push(transformed);
  }
  return result;
}

