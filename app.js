//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-camille:test123@cluster0-q5sx4.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemsSchema ={
  name: String
};

const Item = mongoose.model("Item", itemsSchema); //create an Item model with Item as singular collection name for itemSchema

const item1 = new Item ({
  name: "Welcome to your todolist."
}); //create new item document

const item2 = new Item ({
  name: "Hit the + button at add a new item."
}); //create new item document

const item3 = new Item ({
  name: "<-- Hit this to delete an item."
}); //create new item document

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {


  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB");
        }
      }); //insert many items in item collection at once
      res.redirect("/");
    } else {
    res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    });
  });

  app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
      if(!err){
        if(!foundList){
          const list = new List ({
            name: customListName,
            items: defaultItems
          });

          list.save();
          res.redirect("/" + customListName);
          //create a new list
        } else {
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
          //show an existing list console.log("Exist");
        }
      }
    }); //check if a list name entered by user exists already


  });

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });
  console.log(listName);

  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }


  // const item = req.body.newItem;
  //
  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});



app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    })
  }
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}


app.listen(port, function() {
  console.log("Server has started successfully");
});
