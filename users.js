const express =require('express');
const mongoose=require('mongoose');
const app=express();
const bcrypt =require('bcryptjs')
const {body,validationResult}=require('express-validator');
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

//model
const User=mongoose.model('User',userSchema);


app.use(express.json());

//for validation
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
app.post('/user/register',ValidationOfSchema
  , async(req,res)=>{
  
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
   //check password
   if(password!==confirmPassword)
   {
    res.status(400).json({error: 'Password not matched'});
    }

  
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
app.listen(5000)
console.log('server is running port no. 5000');

