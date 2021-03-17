const dayjs = require('dayjs')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI, {
  useNewURLParser: true, 
  useUnifiedTopology: true
});

if(!mongoose.connection.readyState){
  console.log("database error")
}

app.use(bodyParser.urlencoded({ extended: "true" }));
app.use(bodyParser.json());


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

const userExerciseSchema = new mongoose.Schema({
  username: {type: String,
    required: true,
    index: {
      unique: true
    }},
    count: {type: Number},
    log: [
      {
        description: {type: String},
        duration: {type: String},
        date: {type: String}

      }
    ]
    
})

let UserExercise = mongoose.model("userExercise", userExerciseSchema); 

app.post("/api/exercise/new-user", (req,res)=>{

  const myUsername = req.body.username;

  if(myUsername){
    const myUser = new UserExercise({
    username: myUsername,
    count: 0
  });

  myUser.save((err,data)=>{
    if(err){

      return res.json({
        error: "Usename in use, please use a different username"
      })
    }  

    return res.json({
      username: data.username,
      _id: data._id
    })
  })

  } else {
    return res.json({
        error: "Please enter username"
      })
  }

  
})

app.get("/api/exercise/users", (req,res)=>{

  UserExercise.find((err,users)=>{

    if(err){
      res.json({
        "error": err
        })
    }

    var myUserList = {};

    var userObject = users.map(user =>{
      return {
        "username": user.username,
      "_id": user._id
      }
      
    })

    return res.json(userObject)

  })
  
})

app.post("/api/exercise/add", (req,res)=>{
    var myUserId = req.body.userId;
    var myDescription = req.body.description;
    var myDuration = req.body.duration;
    var myDate = req.body.date;

    var year, month, date;
    var dateString;
    


    if(myDate == ""){
      myDate = new Date()
      year = myDate.getFullYear();
      month = myDate.getMonth() + 1;
      date = myDate.getDate();

  //    dateString = year + "-" + ('0' + month).slice(-2) + "-" + ('0' + date).slice(-2);

      dateString = dayjs(myDate).format('YYYY-MM-DD');


    } else{
      var testDate = new Date(myDate)

      if(isNaN(testDate)){
       
     return res.json({
         error:"Invalid Date"
      })


    } else if(!isNaN(testDate)){
      // myDate = new Date(parseInt(myDate))
      year = testDate.getFullYear();
      month = testDate.getMonth() + 1;
      date = testDate.getDate();

     // dateString = year + "-" + ('0' + month).slice(-2) + "-" + ('0' + date).slice(-2);

      dateString = dayjs(testDate).format('YYYY-MM-DD')
    }

    } 

    if(myUserId == ""){
     return res.json({
         error: "Please enter userId"
        })
    }
    if(myDescription == ""){
      return res.json({
         error: "Please enter description"
      })
    }

    if(myDuration == "" || isNaN(parseInt(myDuration))){
     return res.json({
        error: "Invalid duration"
      })
    } else{
      myDuration = parseInt(myDuration)
    }

    UserExercise.findById(myUserId,(err,data)=>{
      if(err){
        return res.json({
          error: "User not found"
        })
      }

      if(data){
        data.count = data.count + 1;
        let exercise = {
          description: myDescription,
          duration: myDuration,
          date: dateString
        }
        data.log.push(exercise)

        data.save((err,data)=>{
          
          if(err){
            return res.json({
              error: err
          })
          }

          return res.json({
            username: data.username,
            _id: data._id,
            description: myDescription,
            duration: myDuration,
            date: new Date(dateString).toDateString()
          }) 

      
  })
      }


    })

})

app.get("/api/exercise/log",(req,res)=>{


var myUserID = req.query.userId;
var myFrom = req.query.from;
var myTo = req.query.to;
var myLimit = req.query.limit;

console.log(myUserID, myFrom, myTo, myLimit)

var testFromDate = new Date(myFrom);
var testToDate = new Date(myTo);

var dateFromString,dateToString;
var yearFrom,monthFrom,dateFrom,yearTo,monthTo,dateTo;

var count;

var myLimitOption;
var fromExists = false;
var toExists = false;

if(myUserID){

  if(myFrom != undefined || myTo != undefined){
    
    if(!isNaN(testFromDate)){

      fromExists = true;

      dateFromString = dayjs(testFromDate).format('YYYY-MM-DD')

    }
    
    if (!isNaN(testToDate)){
     toExists = true;

      dateToString = dayjs(testToDate).format('YYYY-MM-DD')
    }

  }

  if(myLimit != undefined){
    if(isNaN(parseInt(myLimit))){
     myLimitOption = null
    } else{
      myLimitOption = parseInt(myLimit)
    }
  }

    UserExercise.findById(myUserID, (err,data)=>{

    if(err){
      res.json({
        "error": err
        })
    }

    
    if(data){
      

      var myArray = data.log

      
/*
       if(myFrom == "undefined"){

         if(myArray.length > 0){

      dateFromString = new Date(data.log[0]["date"])
      dateFromString = dayjs(dateFromString).format('YYYY-MM-DD')
    }

       } 
       
       if(myTo == "undefined"){
    dateToString = new Date()
      dateToString = dayjs(dateToString).format('YYYY-MM-DD')

      
       } 

      
         if(dateToString == undefined){

      dateToString = new Date()
      dateToString = dayjs(dateToString).format('YYYY-MM-DD')

         }

    if(dateFromString == undefined){
                 if(myArray.length > 0){

      dateFromString = new Date(data.log[0]["date"])
      dateFromString = dayjs(dateFromString).format('YYYY-MM-DD')
    }
    }  */

      if(!myLimitOption){
        myLimitOption = myArray.length
      }

    myArray = myArray.filter(item => {
      if(toExists){
       return (new Date(item["date"]) <= new Date(dateToString))
      } else {
        return true
      }

    })
    .filter(item => {
      if(fromExists){
        return (new Date(item["date"]) >= new Date(dateFromString))
      } else {
        return true
      }
     
    }
    )
    
    .slice(0, myLimitOption)    

    myArray = myArray.map((item)=>{
      return {
        description: item.description,
        duration: Number(item.duration),
        date: new Date(item.date).toString().substring(0, 15)
      }
    })

    if(toExists && fromExists){

      console.log({
      _id: mongoose.Types.ObjectId(data._id),
      username: data.username,
      from: new Date(dateFromString).toString().substring(0, 15),
      to: new Date(dateToString).toString().substring(0, 15),
      count: myArray.length,
      log: myArray
      })

      return res.json({
      _id: mongoose.Types.ObjectId(data._id),
      username: data.username,
      from: new Date(dateFromString).toString().substring(0, 15),
      to: new Date(dateToString).toString().substring(0, 15),
      count: myArray.length,
      log: myArray
      }) 

    } else if(toExists && !fromExists){
      console.log({
      _id: mongoose.Types.ObjectId(data._id),
      username: data.username,
      to: new Date(dateToString).toString().substring(0, 15),
      count: myArray.length,
      log: myArray
      })

      return res.json({
      _id: mongoose.Types.ObjectId(data._id),
      username: data.username,
      to: new Date(dateToString).toString().substring(0, 15),
      count: myArray.length,
      log: myArray
      }) 
    } else if(fromExists && !toExists){
      console.log({
      _id: mongoose.Types.ObjectId(data._id),
      username: data.username,
      from: new Date(dateFromString).toString().substring(0, 15),
      count: myArray.length,
      log: myArray
      })

      return res.json({
      _id: mongoose.Types.ObjectId(data._id),
      username: data.username,
      from: new Date(dateFromString).toString().substring(0, 15),
      count: myArray.length,
      log: myArray
      }) 
    } else {
      console.log({
      _id: mongoose.Types.ObjectId(data._id),
      username: data.username,
      count: myArray.length,
      log: myArray
      })

      return res.json({
      _id: mongoose.Types.ObjectId(data._id),
      username: data.username,
      count: myArray.length,
      log: myArray
      }) 
    }

    }
    

  })

} else {
  return res.json({
    error: "Please enter user ID"
  })
}

  


})
