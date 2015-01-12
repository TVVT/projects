define(['zepto', 'fastclick'], function($, fc ) {
    fc.attach(document.body);

    var exports = {};

    exports.init = function(config){
        this.config = this.config || config;
    }

    return exports;
});