const express = require("express");
const bodyParser = require("body-parser");
const router = require("./routes/route");
const hbs=require("hbs");
var cors = require('cors')
const app = express();
const PORT = 8000;
const path = require("path");
const http=require("http").createServer(app)
const io=require("socket.io")(http)
const {v4:uuidV4} = require("uuid")
const staticFilePath = path.join(__dirname, "./public");
const templatePath=path.join(__dirname,"./templates/views")
const partialPath=path.join(__dirname,"./templates/partials")

// app.use(express.static(staticFilePath));
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
router.get("/", function (req, res) {
  res.redirect(`/${uuidV4()}`)
  console.log(uuidV4());
});
app.get('/:roomId', function(req, res){
  const roomId=req.params.roomId
    res.render('room',{roomId:roomId})
  console.log("room id",roomId)
})
io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', userId)

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  })
})
http.listen(PORT, function (err) {
  if (err) throw err;
  console.log(`listening on port ${PORT}`);
});
