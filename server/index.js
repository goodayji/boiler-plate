const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const bodyParser = require('body-parser')
const config = require('./config/key')
const mongoose = require('mongoose')
const { User } = require('./models/User')
const { auth } = require('./middleware/auth');

app.listen(port, () => console.log(`Example app listening on port ${port}`))

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

mongoose.connect(config.mongoURI, {
useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(() => console.log('MongoDB connected...'))
.catch(err => console.log(err))

app.get('/', (req, res) => res.send('Hello World'))

app.get('/auth', auth, (req,res) => {
    res.status(200).json({
        _id: req._id,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: require.user.lastname,
        role: req.user.role
    })
})

app.post('/register', (req, res) => {
    // 회원가입 할때 필요한 정보를 client에서 가져오면
    // 그것들을 데이터 베이스에 넣어준다.
    const user = new User(req.body)

    user.save((err, userInfo) => {
        if(err) return res.json({success: false, err})
        return res.status(200).json({
            success: true,
            userData: userInfo
        })
    })
})

app.post('/login', (req, res) => {
    //요청된 이메일을 데이터베이스에서 있는지 찾는다.
    User.findOne({ email: req.body.email }, (err, user) => {
        if(!user) {
            return res.json({
                loginSuccess: false,
                message: "제공된 이메일에 해당하는 유저가 없습니다."
            });
        }

        //요청된 이메일이 데이터베이스에 있다면 비밀번호가 맞는지 확인한다.
        user.comparePassword(req.body.password,(err, isMatch) => {
            if(!isMatch) {
                return res.json({ loginSuccess: false, message: "비밀번호가 틀렸습니다"})
            }
            
        })

        //비밀번호가 맞다면 토큰을 생성하기
        user.generateToken((err, user) => {
            if(err) return res.status(400).send(err);
            res.cookie("x_auth", user.token)
                .status(200)
                .json({
                    loginSuccess: true
                })
        })
    })
})

app.get('/logout', auth, (req,res) => {
    User.findOneAndUpdate({_id: req.user._id}, {token : ""}, (err, user) => {
        if(err) return res.json({success: false, err})
        return res.status(200).send({
            success: true
        })
    })
})
