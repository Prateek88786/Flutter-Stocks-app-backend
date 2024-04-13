const express=require("express");
const axios=require("axios");
const mongoose=require("mongoose");
const app=express();
var refresh;
var stockList;
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
const day = String(today.getDate()).padStart(2, '0');
const dateString = `${year}-${month}-${day}`;
const fetchData=async()=>{
    for(let i=0;i<20;i++){
        const response=await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stocks[i].symbol}&apikey=LGI4GGCHEZBB4AJO`);
        console.log(`Response for ${stocks[i].name}:`, response.data);
        stocks[i]["price"]=response.data["Global Quote"]["05. price"]
        console.log(`Price for ${stocks[i].name}: ${stocks[i].price}`);



    }
    console.log(stocks)
    
}
stockList = [
    {"name": "Apple Inc.", "symbol": "AAPL", "price": 200.23},
  {"name": "Amazon.com Inc.", "symbol": "AMZN", "price": 3400.56},
  {"name": "NVIDIA Corporation", "symbol": "NVDA", "price": 600.89},
  {"name": "Microsoft Corporation", "symbol": "MSFT", "price": 290.76},
  {"name": "Facebook, Inc.", "symbol": "FB", "price": 300.45},
  {"name": "Netflix Inc.", "symbol": "NFLX", "price": 550.67},
  {"name": "PepsiCo, Inc.", "symbol": "PEP", "price": 150.67},
  {"name": "Twitter, Inc.", "symbol": "TWTR", "price": 70.34},
  {"name": "Intel Corporation", "symbol": "INTC", "price": 55.78},
  {"name": "Adobe Inc.", "symbol": "ADBE", "price": 600.45},
  {"name": "Tesla, Inc.", "symbol": "TSLA", "price": 800.12},
  {"name": "Alphabet Inc.", "symbol": "GOOGL", "price": 2700.89},
  {"name": "Visa Inc.", "symbol": "V", "price": 250.67},
  {"name": "Walmart Inc.", "symbol": "WMT", "price": 140.78},
  {"name": "Bank of America Corp", "symbol": "BAC", "price": 40.45},
  {"name": "Salesforce.com Inc", "symbol": "CRM", "price": 220.78},
  {"name": "McDonald's Corp", "symbol": "MCD", "price": 230.56},
  {"name": "Oracle Corporation", "symbol": "ORCL", "price": 80.67},
  {"name": "PayPal Holdings, Inc.", "symbol": "PYPL", "price": 220.34},
  {"name": "Johnson & Johnson", "symbol": "JNJ", "price": 170.45},
];
const test=[{
    "_id": "660fc4e4a48ec432830db0dd",
    "bought": [
    {
    "name": "Apple Inc.",
    "symbol": "AAPL",
    "price": 150.23,
    "quantity": 200
    },
    {
    "name": "Facebook, Inc.",
    "symbol": "FB",
    "price": 300.45,
    "quantity": 300
    }
    ],
    "email": "prateek88786@gmail.com",
    "name": "Prateek Vashishth",
    "password": "newton13"
}]
app.use(express.json())
//fetchData();

mongoose.connect('mongodb+srv://prateek88786:newton13@cluster0.dwo5jsc.mongodb.net/stockDB')
const user=mongoose.model('user',{
    name:String,
    email: String,
    password: String,
    bought: Array,
    balance:Number

})
const stocks=mongoose.model('stocks',{
    stockList:Array,
    refreshed:String
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
    let data=await stocks.find();
    refresh=data[0]["refreshed"]
    stockList=data[0]["stockList"]
    if(refresh!=dateString){
        stockList=data[0]['stockList']
        for(let i=0;i<20;i++){
            const response=await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stockList[i].symbol}&apikey=M4OBW5U3DI22DS1C`);
            console.log(`Response for ${stockList[i].name}:`, response.data);
            stockList[i]["price"]=parseFloat(response.data["Global Quote"]["05. price"])
            console.log(`Price for ${stockList[i].name}: ${stockList[i].price}`);
    
    
    
        }
        await stocks.updateMany({},{$set:{"stockList":stockList,"refreshed":dateString}})
        console.log(stockList)

    }
    else{
        stockList=data[0]["stockList"]
    }
    res.json(stockList)
})

app.listen(5000,(req,res)=>{
    console.log("server running at 5000")
})