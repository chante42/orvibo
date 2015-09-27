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
      errorMessage(res);
      return;
    }

    if (typeof order[2] == 'undefined') {
      errorMessage(res);
      
      return;
    }
    else {
      command = new Buffer(order[2]).toString('ascii');
    }
    
    if ( typeof order[4] == 'undefined' && command !== "list" && command !== "listHTML"  && command !== "wakeup" && command!== "help")  {
        errorMessage(res);
        return;
    }    

    Blastername= order[4];
    Perif = order[3];
    var index =  parseInt(order[1]);

    switch (command) {
      case 'list':
        c("list :");
        var msg =  "";
        var obj1 = nconf.get();

        Object.keys(obj1).forEach( function(name1) {
          var obj2 = nconf.get(name1);

          Object.keys(obj2).forEach( function(name2) {
            msg= msg + name1+':'+name2+'\n';
          });
        });
        res.writeHead(405, {'Content-Type': 'text/plain'});
        res.end(msg);
      break;
      case 'listHTML':
        c("listHTML :");
        var msg = listHTML();
        res.writeHead(405, {'Content-Type': 'text/html charset=utf-8'});
        res.end(msg);
      break;
      case 'learn' :
        o.enterLearningMode(index);
        c("learn"+Blastername,4);
        res.writeHead(405, {'Content-Type': 'text/plain'});
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
        o.setState(index, true);
        o.subscribe();
        res.end('wakeup');
      break;

      case 'help' :
           res.end('help');
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
//   errorMessage
//
function errorMessage(res) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end(' it lacks a parameter : name of blaster code <br><br> http://127.0.0.1:'+PortHttp+'/{id orvibo}/{command}/{perif}/{blaster name} \n\n for html interface call http://127.0.0.1:'+PortHttp+'/0/listHTML');
}


//
//
//
function listHTML() {
         var msg =  "";
        var obj1 = nconf.get();

        msg=msg+'<html><head><title>Liste des périphériques connus</title><meta charset="UTF-8">';
        msg = msg +'<style type="text/css">#telecommande{background:#e6e6e6;margin-left:20}';
        msg = msg + '#periph{clear: both;}';
        msg = msg + '.button{height: 15px;float: left; padding:10px; border: 5px solid grey;background-color: lightgrey;}';
        msg = msg + '.button:hover, #boutton_free:hover{background: #525252;color:white;}';
        msg = msg + '.button.no_hover:hover{background: initial;color:initial;}';
        msg = msg + '.button.right{float:right;}';
        msg = msg + '</style> ';

        msg = msg +'</head><body>';
        msg= msg + '<div id="telecommande"><div class="button"><a href="/0/wakeup/0/0">réveil orbivo</a></div>';
        msg = msg +'</div>';
        msg = msg +'<div id="periph"><h1>Liste des périphériques connus</h1></div>';

        Object.keys(obj1).forEach( function(name1) {
          var obj2 = nconf.get(name1);
          msg = msg + '<div id="periph"><h2>'+name1+'<h2></div>';
          msg = msg + '<div id="telecommande">';
                    
          Object.keys(obj2).forEach( function(name2) {
            msg = msg + '<div class="button">';
            msg= msg + '<a href="/0/blast/'+name1+'/'+name2+'">'+ name2+'</a>';
            msg = msg + '</div>'; 
          });
         msg = msg + '</div>';
        });

        
        msg= msg +"</body></html>"
  return (msg);
}
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