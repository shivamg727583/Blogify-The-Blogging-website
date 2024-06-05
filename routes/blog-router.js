const { Router } = require("express");
const router = Router();
const blogModel = require("../models/blog");
const userModel = require("../models/users")
const multer  = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const commentModel = require("../models/comment");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.resolve(`./public/image/upload/`))
    },
    filename: function (req, file, cb) {
      const fn = `${Date.now()}-${file.originalname}`
      cb(null, fn)
    }
  })
  
  const upload = multer({ storage: storage })

router.get("/addBlog", (req, res) => {
    return res.render("addBlog",{
        user:req.user
    });
});

router.get("/blog/:id",async (req,res)=>{
const id = req.params.id;

  try {
    // Fetch the blog by its ID
    const blog = await blogModel.findById(id);
    if (!blog) {
      return res.status(404).send("Blog not found");
    }

    // Fetch the comments associated with the blog
    const comments = await commentModel.find({ blogId: id });

    // Extract unique user IDs from comments
    const commentUserIds = [...new Set(comments.map(item => item.createdBy))];

    // Fetch user details for these IDs
    const commentUsers = await userModel.find({ _id: { $in: commentUserIds } });

    // Create a mapping of user ID to user details
    const userMap = {};
    commentUsers.forEach(user => {
      userMap[user._id] = user;
    });

    // Attach user details to each comment
    const commentsWithUserDetails = comments.map(comment => {
      return {
        ...comment.toObject(),
        user: userMap[comment.createdBy] // Add user details to each comment
      };
    });
    // console.log(commentsWithUserDetails)
    return res.render("blog",{
      blog,
      user:req.user,
       comments: commentsWithUserDetails
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      return res.status(500).send("Internal Server Error");
    }
  });


router.post("/comment/:blogId",async (req,res)=>{

const comment = await commentModel.create({
  content:req.body.content,
  blogId:req.params.blogId,
  createdBy : req.user._id,
});

return res.redirect(`/blog/${req.params.blogId}`);

})



router.post("/blogging", upload.single("coverImage"), async (req, res) => {
  try {
    const { title, body } = req.body;
    const coverImage = req.file.filename;
    
    // Ensure req.user._id is converted to ObjectId
    const newBlog = await blogModel.create({
      title,
      body,
      coverImage: `/upload/${coverImage}`,
      createdBy: new ObjectId(req.user._id)  // Convert to ObjectId
    });

    return res.redirect(`/blog/${newBlog._id}`);
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
});


module.exports = router;
