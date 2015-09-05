// -*- coding: utf8 -*-
//
//

var PortHttp = 8081;


var OrviboAllOne = require("./allone.js"); // Tell node.js we need to use this file. Store the file in the variable OrviboAllOne
var o = new OrviboAllOne(); // Now we make a new copy of that file and store it in the variable called "o"
var etat = 0;
var myMessage="";

var DEBUG_LEVEL = 1; // Level of verbosity we want. 9 = none, 1 = some, 2 = more, 3 = all
var DEBUG_TO_FILE = false;

var Blastername;
var Perif;

var fs    = require('fs'),
nconf = require('nconf');

  //
  // Setup nconf to use (in-order):
  //   3. A file located at 'path/to/config.json'
  //
nconf.file({ file: 'config.json' });

var http = require("http");
var url = require('url');
var querystring = require('querystring');

var http = require('http');


var serverHttp = http.createServer();

//
//   request type : http://127.0.0.1:8080/{id orvibo}/{command}/{perif}/{blaster name}
//
serverHttp.on('request', function(req, res) {
    
    var page = url.parse(req.url).pathname;
    
    console.log(page);
    order = page.toString().split('/');
    c(order,4);


    // verify only 5 subchaine in url
    if ( typeof order[5] != 'undefined') {
      res.writeHead(403, {'Content-Type': 'text/plain'});
      res.end('too parameters');
      return;
    }

    command = new Buffer(order[2]).toString('ascii');
    console.log("'"+command+"'");

    if ( typeof order[4] == 'undefined' && command !== "list"  && command !== "wakeup" && command!== "help")  {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end(' it lacks a parameter : name of blaster code <br><br> http://127.0.0.1:8080/{id orvibo}/{command}/{perif}/{blaster name}');
      return;
    }    

    Blastername= order[4];
    Perif = order[3];
    var index =  parseInt(order[1]);

    switch (command) {
      case 'list':
        c("list");
        res.end("liste des codes....")
      break;
      case 'learn' :
        o.enterLearningMode(index);
        c("learn"+Blastername,4);
         res.end('learn');
      break;
      case 'blast' :
      c("HTTP: blast ",4);
        var myMessage=nconf.get(Perif+':'+Blastername);

        if ('undefined' == typeof myMessage) {
          console.log('unknown : '+page);
          res.end('unknown : '+page);
        }
        else {
          o.emitIR(index, myMessage);
          res.end('send');
        }
      break;
      case 'wakeup' :
        o.discover(index);
        res.end('wakeup');
      break;
      default:
        c("HTTP: error :'"+order[1]+"'",4);

        res.writeHead(405, {'Content-Type': 'text/plain'});
        res.end('unknown function :'+command+"'");
    } // fin SWITCH order[0]

    
});

serverHttp.listen(PortHttp);







// This code is only executed when allone.js reports that it's ready. Think of this slab of code as an event
o.on("ready", function() {
		o.discover(); // When we're ready, tell our OrviboAllOne file to start looking or any AllOnes that it can find
});

// Our OrviboAllOne file has found a new AllOne. We need to subscribe to it so we can control it
o.on('allonefound', function() { 
	  o.subscribe(); 
});

// There is a button on top of the AllOne. It's the "reset" button, but a short press can be picked up by our code.
// In this example, pressing the button puts the AllOne into learning mode.
// When this code is executed, the OrviboAllOne file reports back and says WHICH AllOne has had the button pressed
// So you can have as many AllOnes as you like, and control them individually
o.on('buttonpressDown', function(index) {
		if ( etat == 0) {
     	o.enterLearningMode(index);
    }
    else {
    	console.log("Message a envoyer :|"+myMessage+"|");
    	o.emitIR(index, myMessage);
    }
    etat = etat+1;
});

//
o.on('buttonpressUp', function(index) {
  
 }); 

//
o.on('buttonpress', function(index) {
    
});

// This code is run when we've asked our code to subscribe to an AllOne so we can control it, and 
// the AllOne has responded to confirm we're subscribed. After you get to this step, you can start controlling!
o.on('subscribed', function(index) { 
	console.log("OCH --->reçue susbscried");
    console.dir(o.hosts); // This line simply writes to the console, all of the AllOnes that have been found so far
    o.query();  // This line queries the AllOne for it's name. We don't need to do this step, but it's nice to have.
    console.log("->>>>>>>>INDEX :"+index);
    o.emitIR(index, "ABCDEF123456"); // Once we've subscribed, this line sends out IR to the AllOne we just subscribed to.
}); 

// This code is called whenever we are sending IR out from the AllOne
o.on('emitting', function(index, ir) {

   console.log("Emitting: " + ir.toString()); // Show what we're sending out
});

// This code is run whenever we're in Learning Mode, and the AllOne has received some IR from the TV remote
o.on("ircode", function(index, message) {
   console.log("IR code received: (index:" + index+")="+message); // Show us what we've received
   myMessage=message;

  nconf.set(Perif+':'+Blastername, message);
  //
  // Save the configuration object to disk
  //
  nconf.save(function (err) {
    fs.readFile('config.json', function (err, data) {
      console.dir(JSON.parse(data))
    });
  });

});

//
o.on("messagereceived", function(message, remoteAddr) {

});
// This line prepares our OrviboAllOne file for network activity (binding ports etc.)
o.prepare(); 








//
//        c
//      Fonction de loggues
//
function c(msg, level) { // Shortcut for "console.log". Saves typing when debugging.

    if(level >= DEBUG_LEVEL) {
        var date = new Date();
        var current_hour = date.getHours();
        message = "==> OCH  (" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds() + ": " + msg;
        if(DEBUG_TO_FILE == false) {
            console.log(message);
        } else {
            fs.appendFile("./allone-log.txt", message + "\n", function(err) { });
        }
    }
}