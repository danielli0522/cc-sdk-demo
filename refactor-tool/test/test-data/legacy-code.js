// 这是一个需要重构的遗留代码文件
// 包含各种代码质量问题，用于测试重构功能

var users = [];
var currentUser = null;

function getUserData() {
    var data = [];
    for (var i = 0; i < users.length; i++) {
        var user = users[i];
        if (user.active == true) {
            if (user.age >= 18) {
                if (user.role == 'admin' || user.role == 'user') {
                    var userData = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    };
                    data.push(userData);
                }
            }
        }
    }
    return data;
}

function calculateTotal(items) {
    var total = 0;
    for (var i = 0; i < items.length; i++) {
        total = total + items[i].price;
    }
    return total;
}

function validateEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
        return true;
    } else {
        return false;
    }
}

// 重复的代码块
function processOrderData() {
    var orders = getOrders();
    var processedOrders = [];
    for (var i = 0; i < orders.length; i++) {
        var order = orders[i];
        if (order.status == 'pending') {
            order.processed = true;
            order.processedAt = new Date();
            processedOrders.push(order);
        }
    }
    return processedOrders;
}

function processPaymentData() {
    var payments = getPayments();
    var processedPayments = [];
    for (var i = 0; i < payments.length; i++) {
        var payment = payments[i];
        if (payment.status == 'pending') {
            payment.processed = true;
            payment.processedAt = new Date();
            processedPayments.push(payment);
        }
    }
    return processedPayments;
}

// 未使用的函数
function unusedFunction() {
    console.log('This function is never called');
}

// 注释掉的代码
/*
function oldFunction() {
    // This is old implementation
    return 'old';
}
*/

// 复杂的嵌套条件
function complexConditions(user, order) {
    if (user) {
        if (user.active) {
            if (order) {
                if (order.status == 'confirmed') {
                    if (order.total > 100) {
                        if (user.membershipLevel == 'premium') {
                            return order.total * 0.9;
                        } else {
                            return order.total * 0.95;
                        }
                    } else {
                        return order.total;
                    }
                } else {
                    return 0;
                }
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    } else {
        return 0;
    }
}

// 缺少类型注解的函数
function apiCall(endpoint, data, callback) {
    fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    }).then(function(response) {
        return response.json();
    }).then(function(result) {
        callback(null, result);
    }).catch(function(error) {
        callback(error, null);
    });
}

module.exports = {
    getUserData: getUserData,
    calculateTotal: calculateTotal,
    validateEmail: validateEmail,
    processOrderData: processOrderData,
    processPaymentData: processPaymentData,
    complexConditions: complexConditions,
    apiCall: apiCall
};

