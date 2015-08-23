var OrviboAllOne = require("./allone.js"); // Tell node.js we need to use this file. Store the file in the variable OrviboAllOne
var o = new OrviboAllOne(); // Now we make a new copy of that file and store it in the variable called "o"
var etat = 0;
var myMessage="";

// This code is only executed when allone.js reports that it's ready. Think of this slab of code as an event
o.on("ready", function() {
	console.log("OCH --->reçue ready");
	o.discover(); // When we're ready, tell our OrviboAllOne file to start looking or any AllOnes that it can find
});

// Our OrviboAllOne file has found a new AllOne. We need to subscribe to it so we can control it
o.on('allonefound', function() { 
	console.log("OCH --->reçue alloneFound");
	o.subscribe(); 
});

// There is a button on top of the AllOne. It's the "reset" button, but a short press can be picked up by our code.
// In this example, pressing the button puts the AllOne into learning mode.
// When this code is executed, the OrviboAllOne file reports back and says WHICH AllOne has had the button pressed
// So you can have as many AllOnes as you like, and control them individually
o.on('buttonpressDown', function(index) {
	console.log("OCH --->reçu buttonPressDown");
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
  console.log("OCH --->reçu buttonPressUp ^^^^^^^^^^^^^^");
 }); 

//
o.on('buttonpress', function(index) {
  console.log("OCH --->reçu buttonPress    -------------");
  
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
});

//
o.on("messagereceived", function(message, remoteAddr) {

});
// This line prepares our OrviboAllOne file for network activity (binding ports etc.)
o.prepare(); 
