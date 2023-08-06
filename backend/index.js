const express = require("express");
const bodyParser = require("body-parser");
const router = require("./routes/route");
const hbs=require("hbs");
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

app.use(cors())
app.set("view engine", "hbs");
app.set('views',templatePath)
hbs.registerPartials(partialPath)
hbs.registerHelper('jsonToString', jsonToString);
app.use(router);
function jsonToString(obj) {
  return JSON.stringify(obj);
}
app.get('/:room' , (req,res)=>{
  res.render('index' , {RoomId:req.params.room});
});

app.listen(PORT, function (err) {
  if (err) throw err;
  console.log(`listening on port ${PORT}`);
});
