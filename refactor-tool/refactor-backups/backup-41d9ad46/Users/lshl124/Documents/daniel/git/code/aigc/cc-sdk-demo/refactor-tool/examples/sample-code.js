
function processData(data) {
    var result = [];
    for (var i = 0; i < data.length; i++) {
        if (data[i].status == 'active') {
            if (data[i].type == 'user') {
                if (data[i].age > 18) {
                    result.push({
                        id: data[i].id,
                        name: data[i].name,
                        email: data[i].email
                    });
                }
            }
        }
    }
    return result;
}
