
var helper = {
    formatDate: function(date) {
        var d = new Date(date);
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    },
    validateInput: function(input) {
        if (input == null || input == undefined) {
            return false;
        }
        return true;
    }
};
