// 测试用的示例代码 - 包含需要重构的代码问题
var data = [
  { name: 'Alice', age: 25, active: true },
  { name: 'Bob', age: 30, active: false },
  { name: 'Charlie', age: 35, active: true }
];

function processUsers() {
  var result = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i].active == true) {
      if (data[i].age > 20) {
        var user = {
          name: data[i].name,
          age: data[i].age,
          status: 'processed'
        };
        result.push(user);
      }
    }
  }
  return result;
}

// 重复的代码块
function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  return total;
}

function calculateSum(numbers) {
  var sum = 0;
  for (var i = 0; i < numbers.length; i++) {
    sum = sum + numbers[i];
  }
  return sum;
}

module.exports = { processUsers, calculateTotal, calculateSum };

