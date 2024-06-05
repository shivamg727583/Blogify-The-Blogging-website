const { Router } = require("express");
const router = Router();
const mongoose = require('mongoose');

const userModel = require("../models/users");
const blogModel = require("../models/blog");

const upload = require('../services/multer');
const path = require('path')



router.get("/signin", (req, res) => {
    return res.render("signin");
});

router.get("/signup", (req, res) => {
    return res.render("signup");
});

router.post("/signup", async (req, res) => {
    try {
        const { fullname, email, password, mobile } = req.body;
        const user = await userModel.create({
            fullname,
            email,
            password,
            mobile
        });
        return res.redirect("/signin");
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
    }
});

router.post("/signin", async (req, res) => {
  

    try {
        const { email, password } = req.body;
        const token = await userModel.matchPasswordAndGenerate(email, password);
        res.cookie("token", token, { httpOnly: true, secure: true, maxAge: 3600000 }).redirect('/');
    } catch (error) {
        console.error(error);
        res.status(400).render('signin', { error: "Invalid email or password" });
    }
});

router.get("/logout",(req,res)=>{
    res.clearCookie("token").redirect('/');
})


router.get('/profile',async (req, res) => {
    if (!req.user) {
        return res.status(401).send('Unauthorized');

    }
    const createdBy = req.user._id;
    const blogs = await  blogModel.find({createdBy})
    
    // console.log(blogs)


    res.render('profile',{user:req.user,blogs});
});


router.get("/update-profile",(req,res)=>{
    if (!req.user) {
        return res.status(401).send('Unauthorized');
    }
    
    res.render("updateProfile",{user:req.user})
})


router.post("/update-profile", upload.single("profilepic"), async (req, res) => {
  
    try {
        const userId = req.body._id;
        const { fullname, email, mobile } = req.body;
        console.log('Request Body:', req.body);
        console.log('User ID:', userId);

        const user = await userModel.findById(userId);
        console.log('User:', user);
        if (!user) {
            return res.status(404).send("User not found.");
        }

        user.fullname = fullname;
        user.email = email;
        user.mobile = mobile;

        if (req.file) {
            user.profilepic = req.file.buffer;
        }

        await user.save();
        return res.redirect("/profile");
    } catch (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
    }
});




router.get('/profilepic/:id',async (req,res)=>{
    const id= req.params.id;
    const user = await userModel.findById(id);

    res.render("profilepic",{user})
})


router.post('/profile-pic/:id', upload.single('profilepic'), async (req, res) => {
    try {
      // Retrieve the user from the database based on the ID
      const userId = req.params.id;
      const user = await userModel.findById(userId);
      
      if (!user) {
        return res.status(404).send('User not found');
      }
//   console.log("path : ",req.file.path);
//   console.log("file :" , req.file)
      // Update the user's profile picture if a file is uploaded
      if (req.file) {
        user.profilepic = req.file.filename; // Assuming profilePic is a field in the user schema to store the profile picture path
      }
  
      // Save the updated user
      await user.save();
  
      return res.redirect('/profile');
    } catch (error) {
      console.error('Error updating profile picture:', error);
      return res.status(500).send('Internal Server Error');
    }
  });
  

module.exports = router;