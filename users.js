const express =require('express');
const mongoose=require('mongoose');
const app=express();
const bcrypt =require('bcryptjs')
const {body,validationResult}=require('express-validator');


//connection with database

mongoose.connect('mongodb://127.0.0.1:27017/mydb2',{
    useNewUrlParser: true,
    useUnifiedTopology: true,
 
});
console.log('database connected');

// user schema
const userSchema=new mongoose.Schema({
    username:{type: String,unique:true},
    password:String,
    email:{type: String,unique:true},
    firstname: String,
    lastname: String,
});


//user model

const User=mongoose.model('User',userSchema);


app.use(express.json());

//for express validator for validation.

 var ValidationOfSchema=[
  body('username').notEmpty().withMessage('Username is required'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be6 chars long'),

  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords not match');
      }
      return true;
    }),

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Email invalid'),

  body('firstname').notEmpty().withMessage('First name is required'),
  body('lastname').notEmpty().withMessage('Last name is required'),
];

//registration route
app.post('/user/register',ValidationOfSchema, async(req,res)=>{
  
   try{

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
    username,
    password,
    confirmPassword,
    email,
    firstname,
    lastname,
   }=req.body;

   //already exist or not checking
   const userExist=await User.findOne({username});

   if(userExist)
   {
    res.status(409).json({error: 'username already exist.'});
   }
   const emailExist=await User.findOne({email});
   if(emailExist)
   {
    res.status(409).json({error:"email already exist."});
   }

   //check password is matched with confirm password
  
   if(password!==confirmPassword)
   {
    res.status(400).json({error: 'Password not matched'});
    }

    
    // generating hashed password using bcrypt.

    const hashPass=await bcrypt.hash(password,10);

     const newUser= new User({
        username: username,
        password:hashPass,
        email:email,
        firstname:firstname,
        lastname:lastname,
     });
     //save new user
     await newUser.save();
     res.status(201).json({message: 'user registered successfully'});
   }
   catch(error){
    res.status(500).json({error: 'user not resgistered'});
  }
});


//Created login route Method get

app.post('/user/login', async(req,res)=>{
 try{
    const {username,password}=req.body;

    const user=await User.findOne({username});

    if(!user)
    {
      return res.status(400).json({message: "Invalid username"})
    }
    const passCorrect=await bcrypt.compare(password, user.password);
    if(!passCorrect)
    {
      return res.status(400).json({message:"Password is not correct"})
    }
     const access_token = user._id;
     res.status(200).json({access_token});
  }
  catch(error){
    console.log("error:", error);
    res.status(500).json({message:'Please fix error'})
  }
});



 //middleware to validte access token
  const validationToken=async(req,res,next)=>{
    const access_token=req.headers.authorization;
   try{
    const user=await User.findById(access_token);
    if(!user)
    {
      return res.status(400).json({message:"invalid access token"})
    }
    req.user=user;
    next();
  }
  catch(error)
  {
    console.error("error:", error);
    return res.status(500).json({message:"error occured"});
  }
  };

  //created route for getting user with access token
app.get('/user/get', validationToken,async (req, res) => {
 
  const user=req.user;
  return res.status(200).json({ user });

});

//Created route for deleting user from database Method put
app.put('/user/delete',validationToken,async(req,res)=>{
  
  const user = req.user;

  try
   {
    await User.findByIdAndDelete(user._id);
    return res.status(200).json({ message: 'User deleted' });
   } 
  catch (error) 
  {
    console.error(error);
    return res.status(500).json({ message: 'An error occurred during user deletion.' });
  }
})

//Created route for get all the user from database 

app.get('/user/get', async (req, res) => {
  try {
  
    const access_token = req.headers.authorization; 
    // console.log(access_token)
    if (!access_token) {
      return res.status(400).json({ message: 'Access token is missing' });
    }

    const user = await User.findById(access_token);

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);

  } catch (error) {
    console.error('Error: ', error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

app.put('/user/delete',async(req,res)=>{
  try{
    const access_token=req.headers.authorization;
    if(!access_token)
    {
      return res.status(400).json({message:"access token is missing"});
    }
    const user=await User.findByIdAndDelete(access_token);
    if(!user)
    {
      return res.status(400).json({message:"user not found.."});
    }
    res.status(200).json({ message: 'user successfully deleted' });
  }
  catch(error)
  {
    console.error("error:",error);
    return res.status(500).json({message:"error occured"});
  }
})

app.get('/user/list/:page',async(req,res)=>{
  try{
    //get page no.
    const page=parseInt(req.params.page);

    //user per page limitg
    const limit =10;
    const skip=(page-1)*limit;

    const users=await User.find()
    .skip(skip)
    .limit(limit);
    res.status(200).json(users);
  }
  catch(error){
    console.error("error:",error);
    res.status(500).json({message:"error giving"});
  }
})


app.listen(5000)
console.log('server is running port no. 5000');

