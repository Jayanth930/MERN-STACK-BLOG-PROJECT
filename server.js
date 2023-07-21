const express = require('express')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const User = require('./Schemas/User')
const Post = require('./Schemas/Post')
const bodyParser = require('body-parser')
const app = express()
const multer = require('multer')
const upload = multer({dest : './uploads' })
const fs = require('fs')
require('dotenv').config()
const port = process.env.PORT || 3006
const uri = process.env.DATABASE_LINK
const secret = process.env.PRIVATE_SECRET_KEY

app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true, // Allow credentials
  }));


app.use(express.json())
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended : false}))
app.use( '/uploads', express.static(__dirname + '/uploads'))
app.get('/',(req,res)=>{
    res.send('Hello')
})

app.post('/register', async (req,res)=>{
    const {username , password} = req.body
    let hashedpassword
    try {
        try {
             hashedpassword = await bcrypt.hash(password , 10) 
        } catch (e) {
            console.error('Error in generating password : ' , e.message)
            return res.status(500).send('Unable to generate hashedPassword')
        }
        const user = await  User.create({
            username , password : hashedpassword
        })
        res.send('successfully registered')
    } catch (e) {
        console.error(e.message)
    }
})

app.post('/login', async (req,res)=>{
    const user = await User.findOne({ username : req.body.name})
    if (user === null ) return res.json({ message : 'Pls Register'}) 
    const isSame =  await bcrypt.compare(req.body.password , user.password)
    if (isSame){
         try {
             const token =  jwt.sign({name : user.username , id : user._id },secret)
             res.cookie('accessToken', token).json({
                message : 'Logged Successfully' ,
                name : user.username , 
                id : user._id
             }) 
             // Redirect Him to Another Page
         } catch (e) {
            console.error(`Error in generating token ${e.message}`)
         }
    }else{
        res.send('Incorrect Password')
    }
})

app.get('/logout',(req,res)=>{
    res.clearCookie('accessToken').send('Successfully Loggedout')
})
app.get('/profile',async (req,res)=>{
     try {
       const userInfo = jwt.verify(req.cookies.accessToken , secret)
       res.json(userInfo)
     } catch (e) {
        console.error(`Error in checking Login ${e.message}`)
     }
})
// Creating new Post
app.post('/post', upload.single('files') , async (req,res)=>{
    const imagefileinfo = req.file
    const newpath = `uploads/${imagefileinfo.originalname}`
    fs.renameSync(imagefileinfo.path , newpath)
    try {
        await Post.create({
            title : req.body.title ,
            subtitle : req.body.subtitle ,
            content : req.body.content ,
            author : req.body.author ,
            imagepath : newpath
        })
    } catch (e) {
        console.error(`Error in uploading post to db ${e.message}`)
    }
    res.send('Successfully uploaded')
})

app.get('/post', async (req,res)=>{
    try {
        const posts = await Post.find({}).populate('author',['username']).sort({createdAt : -1})
        res.status(200).json(posts)
    } catch (e) {
        console.error(`Error in getting posts from db ${e.message}`)
    }
})

app.get('/post/:id',async (req,res)=>{
    const {id} = req.params
    try{
      const post = await Post.findById(id).populate('author',['_id', 'username'])
      res.json(post)
    }catch(e){
      console.error(`Error in fetching post from db [route:post/:id] ${e.message}`)
    }
})

app.put('/post/:id', upload.single('files') , async (req,res)=>{
    const {id} = req.params
    console.log(req.file , req.files , req.body)
    res.json(req.file , req.files , req.body)
})

mongoose.connect(uri).then(()=> {
    console.log('Connected to db')
    app.listen(port,()=>{
        console.log(`Server started on port ${port}`)
    })
}).catch((e)=>console.log(e.message))

