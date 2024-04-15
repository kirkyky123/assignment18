const express = require("express");
const app = express();
const Joi = require("joi");
const multer = require("multer");
const fs = require('fs');

app.use(express.static("public"));
app.use(express.json());

const cors = require("cors");
app.use(cors());

const craftData = fs.readFileSync("crafts.json", "utf8");
const crafts = JSON.parse(craftData);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/images/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/api/crafts", (req, res) => {
  res.send(crafts);
});

app.get("/api/crafts/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const craft = crafts.find((c) => c._id === id);

  if (!craft){
    return res.status(404).send("The craft with the given id was not found");
  }

  res.send(craft);
});

app.post("/api/crafts", upload.single("img"), (req, res) => {
  const result = validateCraft(req.body);

  if (result.error) {
    res.status(400).send(result.error.details[0].message);
    return;
  }

  const craft = {
    _id: crafts.length + 1,
    name: req.body.name,
    description: req.body.description,
    supplies: req.body.supplies.split(","),
  };

  if (req.file) {
    craft.image = req.file.filename;
  }

  crafts.push(craft);
  res.send(crafts);
  fs.writeFileSync("crafts.json", JSON.stringify(crafts, null, 2));
});

app.put("/api/crafts/:id", upload.single("img"), (req, res)=>{
  const craft = crafts.find((c)=>c._id === parseInt(req.params.id));

  if(!craft) res.status(400).send("Craft with given id was not found");

  const result = validateCraft(req.body);

  if(result.error){
    res.status(400).send(result.error.details[0].message);
    return;
  }

  craft.name = req.body.name;
  if(req.file) {
    craft.image = req.file.filename;
  }
  craft.description - req.body.description;
  craft.supplies = req.body.supplies.split(",");

  res.send(craft);
  fs.writeFileSync("crafts.json", JSON.stringify(crafts, null, 2));
});

app.delete("/api/crafts/:id", (req, res)=>{
  const id = parseInt(req.params.id);

  const craft = crafts.find((c)=>c._id === id);

  if(!craft){
    res.status(404).send("The craft with the given id was not found");
    return;
  }

  const index = crafts.indexOf(craft);
  crafts.splice(index,1);
  fs.writeFileSync("crafts.json", JSON.stringify(crafts, null, 2));
});

const validateCraft = (craft) => {
  const schema = Joi.object({
    _id: Joi.allow(""),
    supplies: Joi.allow(""),
    name: Joi.string().min(3).required(),
    description: Joi.string().min(3).required(),
  });

  return schema.validate(craft);
};

app.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});