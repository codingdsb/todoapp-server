const express = require("express");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../constants");
const User = require("../models/User");
const Todo = require("../models/Todo");

const router = express.Router();

router.post("/todo/add", async (req, res) => {
  const token = req.headers["x-access-token"];
  const { text } = req.body;

  if (!token || !text)
    return res.status(400).json({
      error: "Couldn't add that todo",
    });

  try {
    const decodedData = jwt.verify(token, JWT_SECRET);
    const idFromToken = decodedData._id;

    const user = await User.findById(idFromToken);
    if (!user) return res.status(404).json({ error: "User not found" });

    const new_todo = new Todo();
    new_todo.text = text;
    new_todo.user = user;
    new_todo
      .save()
      .then(() => {
        user.todos.push(new_todo);
        user.save();
      })
      .catch((err) => console.log(err));

    return res.status(200).json({
      message: "Successfully added the todo to your list",
      todo: new_todo,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Couldn't add that todo",
    });
  }
});

router.put("/todo/edit", async (req, res) => {
  try {
    const token = req.headers["x-access-token"];
    const { new_text } = req.body;
    const { id } = req.query;

    if (!token || !new_text || !id)
      return res.status(400).json({ error: "Couldn't edit it" });

    const todoToEdit = await Todo.findById(id);
    if (!todoToEdit)
      return res.status(404).json({
        error: "Couldn't find the todo with that id",
      });

    const decodedData = jwt.verify(token, JWT_SECRET);
    if (!decodedData) throw new Error("Could not authenticate you");
    const userTryingToEdit = await User.findById(decodedData._id);
    if (!userTryingToEdit)
      return res.status(404).json({
        error: "No user found",
      });

    const canEdit = userTryingToEdit._id.equals(todoToEdit.user._id);

    if (!canEdit) throw new Error("You cannot edit this todo");

    todoToEdit.text = new_text;
    await todoToEdit.save();

    return res.status(200).json({
      message: "Successfully edited the todo",
      editedTheTodo: todoToEdit,
    });
  } catch (err) {
    return res.status(403).json({
      error: "You aren't authorized to edit this todo",
    });
  }
});

router.delete("/todo/delete", async (req, res) => {
  try {
    const token = req.headers["x-access-token"];
    const { id } = req.query;

    if (!token || !id)
      return res.status(400).json({ error: "Couldn't delete it" });

    const todoToDelete = await Todo.findById(id);
    if (!todoToDelete)
      return res.status(404).json({
        error: "Couldn't find the todo with that id",
      });

    const decodedData = jwt.verify(token, JWT_SECRET);
    if (!decodedData) throw new Error("Could not authenticate you");
    const userTryingToDelete = await User.findById(decodedData._id);
    if (!userTryingToDelete)
      return res.status(404).json({
        error: "No user found",
      });

    const canDelete = userTryingToDelete._id.equals(todoToDelete.user._id);

    if (!canDelete) throw new Error("You cannot delete this todo");

    await todoToDelete.remove();
    // remove the todo from the user's todos array
    userTryingToDelete.todos = userTryingToDelete.todos.filter(
      (todo) => !todo._id.equals(todoToDelete._id)
    );
    await userTryingToDelete.save();

    return res.status(200).json({
      message: "Successfully deleted the todo",
    });
  } catch (err) {
    return res.status(403).json({
      error: "You aren't authorized to delete this todo",
    });
  }
});

module.exports = router;
