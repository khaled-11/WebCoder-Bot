"use strict";
const nodemailer = require('nodemailer');
require('dotenv').config();

function sendConfirmation(recipient_email,sender_psid) {
   const eAddress = "cap.khaled.ledo@gmail.com";
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
       // secureConnection: 'tls',
        port: 587,
       // requiresAuth: true,
        auth: {
          user:"cap.khaled.ledo@gmail.com",
          pass:"dbarmbbpgqawerhy"
        },
    // tls: {
    //     // do not fail on invalid certs
    //     rejectUnauthorized: false,
    // ciphers:'SSLv3'
    //   },
  //  requireTLS : false,
    debug: false,
    logger: true
});

console.log(sender_psid);
    let eConfirm= {
        from: eAddress, 
        to: recipient_email,
        subject: "Your Files are here",
        text: "Good news, your files are here. These files are a good start and may help you build you webpage. Once your page is ready, come back and upload it on the cloud for FREE!!",
        attachments: [
            {
                path: `./views/${sender_psid}/sample.html`,
            },
            {
                path: `./views/${sender_psid}/autocodeai-form.css`,
            }
        ]
 
    }

    transporter.sendMail(eConfirm, function(err){
        if(err){
            console.log(err);
            console.log("Failed to send email.\n");
            return;
        }
        else{
            console.log("Confirmation sent successfully!");
        }
    });
}


module.exports.sendConfirmation = sendConfirmation;
