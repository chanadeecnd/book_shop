require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MemoryStore = require('memorystore')(session)
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const morgan = require('morgan')
const { url } = require('inspector');
const key = 'fso324ds@fdsf!fczvzsa';
let genKey = '';
let imgArr = [];
const client_id = process.env.CLIENT_ID
const client_secret = process.env.CLIENT_SECRET
const mysecrets = process.env.SECRET
let chkPortConnect
const storage = multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null,'./public/uploads');
    },
    filename:(req,file,cb)=>{
        generateKey(6);
        let name = `${genKey}${Date.now()}.jpg`;
        cb(null,name);
    }
})

const upload = multer({storage:storage})
const app = express();
const port = process.env.PORT || 3000;
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(morgan('combined'))
app.use(session({
    store:new MemoryStore({
        checkPeriod:86400000
    }),
    secret:mysecrets,
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize())
app.use(passport.session())

// mongoose.connect('mongodb://127.0.0.1:27017/read_di?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.0.1',{
//     useNewUrlParser:true,
//     useUnifiedTopology:true
// });
mongoose.connect('mongodb+srv://admin:admin1234@cluster0.yxbcpek.mongodb.net/read_di?retryWrites=true&w=majority',{
    useNewUrlParser:true,
    useUnifiedTopology:true
});

const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    date:String,
    UserId:Number,
    googleId:String
});

const productSchema = new mongoose.Schema({
    name:String,
    price:Number,
    category:String,
    image:String,
    date:String,
    ProductId:Number
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)

const User = mongoose.model('users',userSchema)
const Product = mongoose.model('products',productSchema)

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function (id, done) {
    User.findById(id)
        .then(user => {
            done(null, user)
        })
        .catch(err => {
            done(err, null)
        })
});

passport.use(new GoogleStrategy({
    clientID:client_id,
    clientSecret:client_secret,
    callbackURL: (port == 3000) ? "http://localhost:3000/auth/google/home" : "https://nodejs-readdi.onrender.com/auth/google/home",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function (accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    let newUserId
    User.findOne({},{},{sort:{UserId:-1}})
        .then(user=>{
            console.log(user)
            if(user == null){
                newUserId = 1
            }else{newUserId = genID(user.UserId)}
            }).then(()=>{
            User.findOne({ googleId: profile.id })
            .then(user=>{  
                console.log(`NewId : ${newUserId}`)
                if (!user) {
                    user = new User({
                    username: profile.emails[0].value,
                    googleId: profile.id,
                    UserId: newUserId,
                    date: getDate(),
                    });
                    user.save().then(user=>{
                        return cb(null,user)
                    }).catch(err=>cb(err))
                } else {
                return cb(null, user);
                }
            })
        })
  }
));

function getDate() {
    const d = new Date();
    const months = [
        "",
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];
    const format = `${d.getDate()} ${months[d.getMonth() + 1]} ${d.getFullYear()}`;
    return format;
}

function generateKey() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';

    for (let i = 0; i < 15; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        key += characters.charAt(randomIndex);
    }
    genKey = key;
}

function genID(id){
    if(id === undefined || id === null){
        id = 0;
    }
    const newId = id + 1;
    return newId;
}

function timeExpire(minutes){
    return minutes*60000
}

function formatNumber(number){
    return number.toLocaleString('en-US')
}

function notUser(input){
    if(input){
        return `/`
    }else{
        return `/login`
    }

}

//default user login
app.get('/',(req,res)=>{
    console.log(`use url : ${chkPortConnect}`)
    let user
    if(req.isAuthenticated()){
        user = req.user || req.profile
        //  res.redirect('/home');
    }else{
        user = 'NotLogin'
    }
    console.log(user)
    Product.find()
        .then(data=>{
            // console.log(data)
            let doc = []
            data.forEach(d=>{
                const newDoc = {
                    name:d.name,
                    price:formatNumber(+d.price),
                    category:d.category,
                    image:d.image
                }
                doc.push(newDoc)
            })
            // console.log(doc)
            res.render('home',{doc:doc,user:user})
        })
});

//homepage
app.get('/home',(req,res)=>{
    Product.find()
        .then(data=>{
            // console.log(data)
            let doc = []
            data.forEach(d=>{
                const newDoc = {
                    name:d.name,
                    price:formatNumber(+d.price),
                    category:d.category,
                    image:d.image
                }
                doc.push(newDoc)
            })
            // console.log(doc)
            res.render('home',{doc:doc})
        })
    
})

//ui login user
app.get('/login',(req,res)=>{
    res.render('login')
})

//ui register user
app.get('/register',(req,res)=>{
    res.render('register')
})

//user logout
app.get('/logout',(req,res)=>{
    req.logOut((err)=>{
        if(err){
            console.log(err)
            return;
        }
        res.redirect('/')
    })
})

//admin ui product
app.get('/admin',async(req,res)=>{ 
    const checkAdmin = await req.session.login
    if (checkAdmin) {
        await Product.find()
            .then(data=>{
                res.render('manager',{doc:data});
            })
        }else{
            res.render('adminLogin')
        }
     
})

//admin ui customer
app.get('/customer',(req,res)=>{
    const checkAdmin = req.session.login
    if(checkAdmin){
        User.find()
            .then(data=>{
                // console.log(data)
                res.render('adminCustomer',{doc:data})
            })
        
    }else{res.render('adminLogin')}
})

//delete User
app.get('/delete/user/:id',(req,res)=>{
    const delId = req.params.id
    User.findByIdAndDelete(delId)
        .then(data=>{
            console.log(`Delete : ${data}`)
            res.redirect('/customer')
        })
        .catch(err=>console.log(err))
       
})

//delete Product
app.get('/delete/product/:id',(req,res)=>{
    const delId = req.params.id
    Product.findByIdAndDelete(delId)
        .then(data=>{
            res.redirect('/admin')
        })
        .catch(err=>console.log(err))
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile',"email"] }));

app.get('/auth/google/home', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });


app.post('/update/product',upload.single('newImage'),(req,res)=>{
    const {name, price, category, image, ProductId, id} = req.body
    let img
    if(req.file){
        img = req.file.filename
    }else{img = image}
    Product.findByIdAndUpdate(id,{
        name:name,
        price:price,
        image:img,
        ProductId:ProductId,
        category:category
    }).then(data=>{
        console.log(`Updated product : ${data}`)
        res.redirect('/admin')
    }).catch(err=>console.log(err))
});

//update product
app.post('/update',(req,res)=>{
    const findId = req.body.id
    Product.findById(findId)
        .then(data=>{
            // console.log(data)
            imgArr.push(data.image)
            console.log(`Old image : ${imgArr}`)
            res.render('update',{doc:data})
        })
        .catch(err=>console.log(err))
})

//admin login
app.post('/admin',(req,res)=>{
    const {username, password} = req.body
    if(username === 'admin' && password === '0000'){
        req.session.login = true
        req.session.cookie.maxAge = timeExpire(60*24)
        Product.find()
            .then(data=>{
                res.render('manager',{doc:data})
            })
        
    }else{res.render('adminLogin')}
    
})

//user login
app.post('/login',(req,res)=>{
    const user = new User({
        username:req.body.username,
        password:req.body.password
    })
    req.logIn(user,(err)=>{
        if(err){
            console.log(err)
            req.flash('error', 'Invalid username or password');
            return res.render('login')
        }
        console.log(user)
        passport.authenticate('local',{
            successRedirect:"/",
            failureRedirect:'/login',
            failureFlash:true
    })(req,res,()=>{
        let url = notUser(false)
        return res.redirect(url)
        })
    })
})

//user register
app.post('/register',(req,res)=>{
    User.findOne({}, {}, { sort: { UserId: -1 } })
        .then(data=>{
            console.log(data)
            User.register({username:req.body.username,date:getDate(),UserId:genID(data.UserId)},req.body.password,(err,user)=>{
                if(err){
                    console.log(err)
                    return res.redirect('/register')
                }
                passport.authenticate('local')(req,res,()=>{
                    res.redirect('/')
                })
            })
        })
    
})

//insert product
app.post('/insert',upload.single('image'),(req,res)=>{
    let {name,price,category} = req.body;
    if(category === 'notSelect'){
        category = 'Book'
    }
    const img = req.file.filename;
    Product.findOne({},{},{sort:{ProductId:-1}})
        .then(data=>{
            const newId = genID(data.ProductId)
            let newProduct = new Product({
            ProductId:newId,
            name:name,
            price:price,
            category:category,
            image:img
            })
            newProduct.save()
            console.log('Insert data successfully!')
            return res.redirect('/admin')
        })
        .catch(err=>console.log(err))
    
})

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});
