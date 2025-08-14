
// 需要自定义重构的代码
class UserManager {
    constructor() {
        this.users = [];
    }
    
    addUser(user) {
        this.users.push(user);
    }
    
    removeUser(id) {
        this.users = this.users.filter(u => u.id !== id);
    }
    
    findUser(id) {
        return this.users.find(u => u.id === id);
    }
}
