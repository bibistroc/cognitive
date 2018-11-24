// Allow angular using electron module (native node modules)
const fs = require('fs');
const main_file = './main.js';

fs.readFile(main_file, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace("require('electron-reload')(__dirname);", '');
  result = result.replace("// mainWindow.setMenu(null);", "mainWindow.setMenu(null);");

  fs.writeFile(main_file, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});