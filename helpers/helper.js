var Handlebars = require('handlebars');

Handlebars.registerHelper('list', function(dbArray, options){
    options.fn(dbArray);
});
