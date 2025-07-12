const AutomatedPost = require("../models/AutomatedPost");

const createAutomatedPost = async (req, res) => {
  const userId = req.userId;
  try {
    const newPost = await AutomatedPost.create({
        userId,
        ...req.body,
    });
    console.log('newPost: ', newPost);
    res.status(201).json(newPost);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getAllAutomatedPosts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }

    const posts = await AutomatedPost.find(filter);
    console.log('posts: ', posts);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch automated posts." });
  }
};

const getAutomatedPostById = async (req, res) => {
  try {
    const post = await AutomatedPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found." });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch post." });
  }
};

const updateAutomatedPost = async (req, res) => {
  try {
    const updated = await AutomatedPost.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (!updated) return res.status(404).json({ error: "Post not found." });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteAutomatedPost = async (req, res) => {
  try {
    const deleted = await AutomatedPost.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Post not found." });
    res.json({ message: "Post deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post." });
  }
};

const togglePostStatus = async (req, res) => {
  try {
    const post = await AutomatedPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found." });

    post.isEnabled = !post.isEnabled;
    await post.save();

    res.json({ id: post._id, isEnabled: post.isEnabled });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle status." });
  }
};

module.exports = {
  createAutomatedPost,
  getAllAutomatedPosts,
  getAutomatedPostById,
  updateAutomatedPost,
  deleteAutomatedPost,
  togglePostStatus,
};
