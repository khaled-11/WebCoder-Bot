const fs = require("fs");
const request = require('request');
var https = require('https');
const path = require('path');
const multer = require('multer');
const sendEmail = require("./mailer");
const wireCode = require("./wireCode");
const express = require('express');
const bodyParser = require('body-parser');
const app = express().use(bodyParser.json());



// Starage Create
var Storage = multer.diskStorage({
  destination: function(req, file, callback) {
      callback(null, "./Images");
  },
  filename: function(req, file, callback) {
      callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  }
});

var upload = multer({

  storage: Storage

}).array("imgUploader", 3); //Field name and max count




app.post("/api/Upload", function(req, res) {

  upload(req, res, function(err) {

      if (err) {

          return res.end("Something went wrong!");

      }

      return res.end("File uploaded sucessfully!.");

  });

});



//sendConfirmation.sendConfirmation("khaled.abouseada@icloud.com");

// Serving the static files from "public" in Express.
app.use(express.static(path.join(path.resolve(), "public")));
// Set template engine in Express.
app.set("view engine", "ejs");
// Respond with index file when a GET request is made to the homepage.
app.get("/", function(_req, res) {
  res.render("index");
});

// Webhook Endpoint For Facebook Messenger.
app.post('/webhook', (req, res) => {  
    let body = req.body;
  
    // Checks this is an event from a page subscription
    if (body.object === 'page') {
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
  
        // Gets the body of the webhook event
        let webhook_event = entry.messaging[0];
       // console.log(webhook_event);
      
        // Get the sender PSID
        let sender_psid = webhook_event.sender.id;
        //console.log('Sender PSID: ' + sender_psid);
    
        // Check if the event is a message or postback and
        // pass the event to the appropriate handler function
        if (webhook_event.message) {
          handleMessage(sender_psid, webhook_event);        
        } else if (webhook_event.postback) {
          handlePostback(sender_psid, webhook_event.postback);
        } 
      });
      // Returns a '200 OK' response to all requests
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Returns a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }
  
  });

  // Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "adsfhg"
      
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
      
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
    
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
  });


  function handleMessage(sender_psid, webhook_event) {
    let response;
    let received_message = webhook_event.message
    
    // Checks if the message contains text
    if (received_message.text) {    
      // Create the payload for a basic text message, which
      // will be added to the body of our request to the Send API
  var text = received_message.text.trim().toLowerCase();
   if  (text.includes("hi")) {
    response = {"text": `Hi there, please send me a website wireframe image to start.`}
  }
  else if  (text.includes("run")) {
    myC(sender_psid);
    response = {"text": `We are processing your image!`}
  }
   else {
    response = {"text": `Sorry, we cannot recognize "${text}" at this moment.`}
  }
  
  
  }else if (received_message.attachments) {
    att = webhook_event.message.attachments[0].payload.url;
    if (!fs.existsSync(`./wireFrames/${sender_psid}`)){
      fs.mkdirSync(`./wireFrames/${sender_psid}`);
      }
  filePath = `wireFrames/${sender_psid}/sample.jpg`;
file = fs.createWriteStream(filePath);
var request = https.get(att, async function(response) {
    response.pipe(file);
    file.on('close', function (err) {
      if (err) {
      console.log(err);
    }
    })
});
    response = {"text": `We received the file. Send "run" to start processing`}
    } 
    // Send the response message
    callSendAPI(sender_psid, response);
  }


async function myC(sender_psid) {
    let response;
    var data = fs.readFileSync(`./wireFrames/${sender_psid}/sample.jpg`);
    try {
      results = await wireCode(data);
  } catch (e) {
      //results = "Error";
  } finally {
      //console.log('We do cleanup here');
  }
    if (!fs.existsSync(`./views/${sender_psid}`)){
    fs.mkdirSync(`./views/${sender_psid}`);
    }
fs.writeFile(`./views/${sender_psid}/index.ejs`, results.generated_webpage_html, 'utf8', function (err) {
  if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
    }
    console.log("HTML file has been saved."); 
});
app.get(`/${sender_psid}`, function(_req, res) {
  res.render(`./${sender_psid}/index`);
});
fs.writeFile(`./views/${sender_psid}/autocodeai-form.css`, results.generated_webpage_css, 'utf8', function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
    }
    console.log("CSS file has been saved."); 
});
};

  // Handles messaging_postbacks events
  function handlePostback(sender_psid, received_postback) {
    let response;
    
    // Get the payload for the postback
    let payload = received_postback.payload;
  

    response = { "text": 'We sent something. Please check your email.' }
  
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
  }
  
  
  // Sends response messages via the Send API
  function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
      "recipient": {
        "id": sender_psid
      },
      "message": response
    }
    // Send the HTTP request to the Messenger Platform
    request({
      "uri": "https://graph.facebook.com/v6.0/me/messages",
      "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
      "method": "POST",
      "json": request_body
    }, (err, res, body) => {
      if (!err) {
        console.log('message sent!')
      } else {
        console.error("Unable to send message:" + err);
      }
    }); 
  }

app.listen(process.env.PORT || 3370, function(a) { console.log('webhook is listening')});
