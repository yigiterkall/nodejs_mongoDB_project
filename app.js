const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv/config');
app.use(express.json());
const {MongoClient} = require('mongodb');
const request = require('request');
const http = require('http');
const delay = require('delay');

var database;
//DB connection with .env, using 3000 as requested
app.listen(3000,()=>{
    MongoClient.connect(process.env.DB_CONNECTION,{useNewUrlParser: true},(error,result)=>{
        if(error) throw error
        database = result.db('assignmentdb')
        console.log('connected');
    })
})

//Routes

app.get('/countries',(req,res)=>{
    database.collection('countries').find({}).toArray((err,result)=>{
        if(err) throw err
        res.json(result);
    })
});

app.get('/countries/:region',(req,res)=>{
    const gatheredRegion = req.params.region;
    database.collection('countries').find({region:gatheredRegion}).toArray((err,result)=>{
        if(err) throw err
        res.json(result)
    })
})

app.get('/salesrep',async(req,res)=>{
    var map_region_totalCountry = new Map(); //holds[region name, total country]
    var map_region_minRep = new Map(); //holds[region name, minimum rep]
    var map_region_maxRep = new Map(); //holds[region name, max rep]
    var resulting_arr=[];//To prepare the response, it will be used only last part of the endpoint.
    //Configuration to use http request.
    const options = {
        url: "http://127.0.0.1:3000/countries",
        method: 'GET'
    }
    //using request to use database only from countries endpoint. 
    request(options,async function(err,res,body){
        let result = JSON.parse(body);
        if(result.length > 0 ){
            result.forEach((temp,i)=>{
                if(map_region_totalCountry.get(temp.region.toUpperCase()) > 0){
                    var x = map_region_totalCountry.get(temp.region.toUpperCase()) + 1; //x variable counts the total country of each region 1 by 1.
                    map_region_totalCountry.set(temp.region.toUpperCase(),x);
                }else{
                    map_region_totalCountry.set(temp.region.toUpperCase(),1);
                }
            })
            map_region_totalCountry.forEach((value,key)=>{
                var minRep = 0;//will hold minimum rep number
                var maxRep = 0;//will hold maximum rep number
                //corner case if country count less than 3.
                if(value < 3){
                    minRep = 1;
                    maxRep = 1;
                }else{
                    if(value % 7 === 0){
                        minRep = parseInt(value / 7);
                    }else{
                        minRep = parseInt(value / 7) +1;
                    }
                    maxRep = parseInt(value/3);
                }
                map_region_minRep.set(key,minRep);
                map_region_maxRep.set(key,maxRep);
            })
        }else{
            console.log('empty');
        }
        //for responsing JSON
        map_region_minRep.forEach((value,key)=>{
            var obj = {};
            obj.region = key;
            obj.minSalesReq = value;
            obj.maxSalesReq = map_region_maxRep.get(key);
            resulting_arr.push({...obj});
        })
    })
    await delay(500);
    //console.log(resulting_arr);
    res.json(resulting_arr);
});

app.get('/optimal',async(req,res)=>{
    map_region_totalCountry = new Map(); //holds[region name, total country]
    map_region_minRep = new Map(); //holds[region name, minimum rep]
    resulting_arr = new Array(); //to prepare JSON
    //request config
    const options = {
        url: 'http://127.0.0.1:3000/countries',
        method: 'GET',
    }

    request(options, function(err, res, body) {
        let result = JSON.parse(body);
        if(result.length > 0 ){
            result.forEach((temp,i)=>{
                if(map_region_totalCountry.get(temp.region.toUpperCase()) > 0){
                    var x = map_region_totalCountry.get(temp.region.toUpperCase()) + 1;
                    map_region_totalCountry.set(temp.region.toUpperCase(),x);
                }else{
                    map_region_totalCountry.set(temp.region.toUpperCase(),1);
                }
            })
            map_region_totalCountry.forEach((value,key)=>{
                let minRep = 0;
                if(value < 3){
                    minRep = 1;
                }else{
                    if(value % 7 === 0){
                        minRep = parseInt(value / 7);
                    }else{
                        minRep = parseInt(value / 7) +1;
                    }
                }
                map_region_minRep.set(key,minRep);
            });
        }else{
            console.log('empty');
        };
        map_region_minRep.forEach(async(value,key)=>{
            let counter = map_region_totalCountry.get(key)%value; //additional country counts will be added with this var 1 by 1
            var countDeterminer = parseInt(map_region_totalCountry.get(key)/value); //calculates arithmetic result of the contry count
            for(let i = 0; i < value;i++){
                if(parseInt(map_region_totalCountry.get(key)%value) === 0){
                    var obj = {};
                    obj.region = key;
                    obj.countryCount = countDeterminer;
                    resulting_arr.push({...obj});
                }
                else{
                    if(counter !== 0){
                        var obj = {};
                        obj.region = key;
                        obj.countryCount = countDeterminer+1;
                        counter--;
                        resulting_arr.push({...obj});
                    }else{
                        var obj = {};
                        obj.region = key;
                        obj.countryCount = countDeterminer;
                        resulting_arr.push({...obj});
                    }
                }
            }
        });
    });
    await delay(300);
    //console.log(...map_region_totalCountry.entries());
    //console.log(...map_region_minRep.entries());
    //console.log(resulting_arr);
    res.json(resulting_arr);
});


  





