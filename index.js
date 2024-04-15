
require('dotenv').config();
const express=require("express");
const axios=require("axios");
const mongoose=require("mongoose");
const app=express();
var refresh;
var stockList;

const update=async()=>{
    let curr=new Date()
    let data=await stocks.find();
    refresh=data[0]["refreshed"]
    stockList=data[0]["stockList"]
    for(let i=0;i<20;i++){
        const response=await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stockList[i].symbol}&apikey=M4OBW5U3DI22DS1C`);
        console.log(`Response for ${stockList[i].name}:`, response.data);
        stockList[i]["price"]=parseFloat(response.data["Global Quote"]["05. price"])
        console.log(`Price for ${stockList[i].name}: ${stockList[i].price}`);
    
    
    
    }
    await stocks.updateMany({},{$set:{"stockList":stockList,"refreshed":new Date()}})
    console.log("Updated")

}

  
  
    

app.use(express.json())

mongoose.connect(`mongodb+srv://prateek88786:${process.env.DB_PASS}@cluster0.dwo5jsc.mongodb.net/stockDB`)
const user=mongoose.model('user',{
    name:String,
    email: String,
    password: String,
    bought: Array,
    balance:Number

})
const stocks=mongoose.model('stocks',{
    stockList:Array,
    refreshed:Date
})
app.get("/",(req,res)=>{
    res.send("App is running. Go to the defined routes for data. The only get route is /api/stocks ")
})
app.get('/api/users',async(req,res)=>{
    const data =await user.find()
    res.json(data)
})
app.post('/api/signup',async(req,res)=>{
    console.log(req.body)
    await user.insertMany(req.body)
    res.send("Success")
})
app.get('/api/user/:email',async(req,res)=>{
    const data=await user.find({"email":req.params.email})
    res.json(data)
})

app.post('/api/buy/:email/:name/:symbol/:quantity/:price',async(req,res)=>{
    var data=await user.find({"email":req.params.email})
    data[0]["bought"].push({
        "name":req.params.name,
        "symbol":req.params.symbol,
        "price":parseFloat(req.params.price),
        "quantity":parseInt(req.params.quantity)
    })
    var amount =parseInt(req.params.quantity)*parseFloat(req.params.price)
    data[0]["balance"]=parseFloat(data[0]["balance"])-amount
    await user.updateOne({"email":req.params.email},{$set:{"bought":data[0]["bought"]}})
    await user.updateOne({"email":req.params.email},{$set:{"balance":data[0]["balance"]}})

    res.send("Success")
})
app.post('/api/sell/:email/:name/:symbol/:quantity/:price/:currentPrice',async(req,res)=>{
    var data=await user.find({"email":req.params.email})
    for(let i=data[0]["bought"].length-1;i>=0;i--){
        if(data[0]["bought"][i]["symbol"]==req.params.symbol && data[0]["bought"][i]["price"]==parseFloat(req.params.price)){
            if(data[0]["bought"][i]["quantity"]-parseInt(req.params.quantity)==0){
                data[0]["bought"].splice(i,1)
            }
            else{
                data[0]["bought"][i]["quantity"]=data[0]["bought"][i]["quantity"]- parseInt(req.params.quantity)
            }
            break
        }
    }

    var amount =parseInt(req.params.quantity)*parseFloat(req.params.currentPrice)
    data[0]["balance"]=parseFloat(data[0]["balance"])+amount
    await user.updateOne({"email":req.params.email},{$set:{"bought":data[0]["bought"]}})
    await user.updateOne({"email":req.params.email},{$set:{"balance":data[0]["balance"]}})

    res.send("Success")
})

app.get('/api/stocks',async(req,res)=>{
    let data=await stocks.find()
    refresh=new Date(data[0]["refreshed"]);
    let curr=new Date();
    let diff=(curr-refresh)/(1000*60*60)
    if(diff>24){
        await update()
        console.log("Update function over")
    }
    data=await stocks.find()
    res.json(data[0]["stockList"])

    
})

app.listen(5000,(req,res)=>{
    console.log("server running at 5000")
})