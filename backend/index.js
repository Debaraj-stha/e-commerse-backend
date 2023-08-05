const express = require("express");
const bodyParser = require("body-parser");
const router = require("./routes/route");
const hbs=require("hbs");
const helmet = require('helmet');
var cors = require('cors')
const app = express();
const PORT = 8000;
const path = require("path");
const staticFilePath = path.join(__dirname, "./public");
const templatePath=path.join(__dirname,"./templates/views")
const partialPath=path.join(__dirname,"./templates/partials")
app.use(express.static(staticFilePath));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(helmet.crossOriginOpenerPolicy({ policy: 'same-origin' }));
// app.use((req, res, next) => {
//   res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
//   next();
// });
app.use(cors())
app.set("view engine", "hbs");
app.set('views',templatePath)
hbs.registerPartials(partialPath)
hbs.registerHelper('jsonToString', jsonToString);
app.use(router);
function jsonToString(obj) {
  return JSON.stringify(obj);
}
app.listen(PORT, function (err) {
  if (err) throw err;
  console.log(`listening on port ${PORT}`);
});
