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

// Create Storage and save the uploaded file as an index in each user folder//
var Storage = multer.diskStorage({
  destination: function(req, file, callback) {
    if (!fs.existsSync(`./views/${sender_psid}`)){
      fs.mkdirSync(`./views/${sender_psid}`);
      }
      callback(null, `./views/${sender_psid}`);
  },
  filename: function(req, file, callback) {
      callback(null, "index.html");
  }
});
var upload = multer({
  storage: Storage
}).array("htmlUploader", 3);

app.post("/api/Upload", function(req, res) {
  upload(req, res, function(err) {
      if (err) {

          return res.end("Something went wrong!");
      }
      return res.end("File uploaded sucessfully! Please close this page and go back to the coversation for your lightning fast link.");
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
app.get("/uploader", function(_req, res) {
  res.render("uploader");
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
        global.sender_psid = webhook_event.sender.id;
        //console.log('Sender PSID: ' + sender_psid);

        // Check if the event is a message or postback and
        // pass the event to the appropriate handler function
        if (webhook_event.message) {
          handleMessage(sender_psid, webhook_event);        
        } else if (webhook_event.postback) {
          handlePostback(sender_psid, webhook_event.postback);
        }});
      // Returns a '200 OK' response to all requests
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Returns a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }});

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
      }}
});


  function handleMessage(sender_psid, webhook_event) {
    let response;
    let received_message = webhook_event.message
    
    // Checks if the message contains text
    if (received_message.text) {    
      // Create the payload for a basic text message, which
      // will be added to the body of our request to the Send API
  var text = received_message.text.trim().toLowerCase();
   if  (text.includes("hi") || text.includes("start over")) {
    response = { 
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"button",
          "text":'Welcome to TLopia (AI Website Coder & Cloud Uploader ChatBot). Please choose how can we assist you today? You may say "Hi" or "Start Over" at any time for main menu.',
          "buttons":[
            {
              "type":"postback",
              "payload":"TRANSLATE",
              "title":"Image to Code"
            },
            {
              "type":"postback",
              "payload":"UPLOAD",
              "title":"Upload a WebSite"
            },
            {
              "type":"postback",
              "payload":"LINK",
              "title":"View My Link"
            }
          ]
        }
      }
    }
  }else if (text.includes("@")){
    // handlePostback(sender_psid, START)
    em_send = text;
    response = { 
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"button",
          "text": `We received: "${text}". Is that correct?`,
          "buttons":[
            {
              "type":"postback",
              "payload": "YES_EMAIL",
              "title":"Yes"
            },
            {
              "type":"postback",
              "payload":"NO",
              "title":"No"
            }
          ]
        }
      }
    }
   }else if  (text.includes("run")) {
    response = {"text": `We are processing your image!`}
  }
   else {
    response = {"text": `Sorry, we cannot recognize "${text}" at this moment.`}
  }}else if (received_message.attachments) {
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
response = { 
  "attachment":{
    "type":"template",
    "payload":{
      "template_type":"button",
      "text":"We received your image! Press run to Build an initial HTML & CSS Code from it.",
      "buttons":[
        {
          "type":"postback",
          "payload":"RUN",
          "title":"Run"
        }
      ]
    }
  }
}

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
      console.log(e);
  } finally {
      //console.log('We do cleanup here');
  }
    if (!fs.existsSync(`./views/${sender_psid}`)){
    fs.mkdirSync(`./views/${sender_psid}`);
    }
fs.writeFile(`./views/${sender_psid}/sample.html`, results.generated_webpage_html, 'utf8', function (err) {
  if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
    }
    console.log("HTML file has been saved."); 
});

fs.writeFile(`./views/${sender_psid}/autocodeai-form.css`, results.generated_webpage_css, 'utf8', function (err) {
    if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
    }
    console.log("CSS file has been saved."); 
});
response = { 
  "attachment":{
    "type":"template",
    "payload":{
      "template_type":"button",
      "text":"Your intial code is ready! This is just an intial code to help. Do you want to see this intial code live, or send it to you?",
      "buttons":[
        {
          "type":"postback",
          "payload":"VIEW",
          "title":"View Intial Code Live"
        },
        {
          "type":"postback",
          "payload":"EMAIL",
          "title":"Send it to me"
        }
      ]
    }
  }
}
callSendAPI(sender_psid, response);
};

  // Handles messaging_postbacks events
  function handlePostback(sender_psid, received_postback) {
    let response;
    
    // Get the payload for the postback
    let payload = received_postback.payload;
    if (payload === 'START') {
      response = { 
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"button",
            "text":"Welcome to TLopia (AI Website Coder & Cloud Uploader ChatBot). Please choose how can we assist you today?",
            "buttons":[
              {
                "type":"postback",
                "payload":"TRANSLATE",
                "title":"Image to Code"
              },
              {
                "type":"postback",
                "payload":"UPLOAD",
                "title":"Upload a WebSite"
              },
              {
                "type":"postback",
                "payload":"LINK",
                "title":"View My Link"
              }
            ]
          }
        }
      }
  }else if (payload === 'TRANSLATE') {
    response = { "text": 'We generate an intial code from wire-frames in images using AI. Please send a wire-frame image to try. (Please send a .jpg or .png image that is less than 4 mb and make the wire-frame as clear as possible.' }
}else if (payload === 'UPLOAD') {
  response = { 
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":'This tools allows you to upload (ONE) HTML & CSS file and access it any where. Say "Start Over" or "Hi" to go back after you upload.',
        "buttons":[
          {
            "type":"web_url",
            "url":`https://tlopia.com/uploader`,
            "title":"Click here to upload"
          }
        ]
      }
    }
  }
}else if (payload === 'EMAIL') {
  response = { "text": 'Please Enter Your Email.' }
}else if (payload === 'RUN') {
  myC(sender_psid);
  response = { "text": 'Please wait while we are building your intial code. This intial HTML & CSS code will make it easier to build your website. If nothing happened within 1 minute, this means the image is not compatible. If so, please send another Wire Frame Image, or say Start Over to go back.' }
}else if (payload === 'VIEW') {
  app.get(`/${sender_psid}/sample.html`, function(_req, res) {
    res.sendFile(path.join(path.resolve(), `./views/${sender_psid}/sample.html`)); 
  });
  response = { 
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":"Please click below to view the code live. After you finish, you can select email to send it to you, or ay Start Over for Main Menu.",
        "buttons":[
          {
            "type":"web_url",
            "url":`https://tlopia.com/${sender_psid}/sample.html`,
            "title":"Click Here to View"
          },
          {
            "type":"postback",
            "payload":"EMAIL",
            "title":"Click Here to Email"
          }
        ]
      }
    }
  }
}else if (payload === 'YES_EMAIL') {
  sendEmail.sendConfirmation(em_send,sender_psid);
  console.log(em_send);
  response = { "text": 'We sent the files to your Email. Please check your email and we are waiting for you to uplaod your website soon! You may say "Hi" or "Start Over" at any time to go back.' }
}else if (payload === 'LINK') {
  app.get(`/${sender_psid}`, function(_req, res) {
    res.sendFile(path.join(path.resolve(), `./views/${sender_psid}/index.html`));
  });
  if (!fs.existsSync(`./views/${sender_psid}`)){
    fs.mkdirSync(`./views/${sender_psid}`);
    fs.writeFile(`./views/${sender_psid}/index.html`,``,function(err) {
      if (err) {
      throw err;
      }
          })}
  response = { 
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"button",
        "text":"Please click below to open your link. This link will point to any HTML file which you will upload using our tool. Just copy the link, share, and enjoy!",
        "buttons":[
          {
            "type":"web_url",
            "url":`https://tlopia.com/${sender_psid}`,
            "title":"Your Link is Here"
          }
        ]
      }
    }
  }
}else{
    response = { "text": 'Something went Wrong!! Say Start Over for Main Menu.' }
}
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
