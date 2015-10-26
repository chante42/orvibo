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

var fs    = require('fs');
var nconf = require('nconf');
var urlencode = require('urlencode');
var path = require("path");
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
c("interface Web : http:127.0.0.1:"+PortHttp, 1);
serverHttp.listen(PortHttp);

//
//   request type : http://127.0.0.1:8080/{id orvibo}/{command}/{perif}/{blaster name}
//
serverHttp.on('request', function(req, res) {
    
    var page = url.parse(req.url).pathname;
    
    console.log(page);
    order = page.toString().split('/');
    c(order,4);

    if (typeof order[2] == 'undefined') {
        errorMessage(res);
        
        return;
    }
      
    command = new Buffer(order[2]).toString('ascii');


    if (command != 'html') {
    
      // verify only 5 subchaine in url
      if ( typeof order[5] != 'undefined') {
        console.log("to many arguments : "+ order[5]);
        errorMessage(res);
        return;
      }

      
      
      if ( typeof order[4] == 'undefined' && command !== "list" && command !== "html" && command !== "listHTML"  && command !== "wakeup" && command!== "help")  {
          errorMessage(res);
          return;
      }    
    } // FIN IF command = html

    Blastername= urlencode.decode(order[4], 'utf8') ;
    Perif = urlencode.decode(order[3], 'utf8');

    console.log("perif="+Perif+" name="+Blastername);
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
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(msg);
      break;

      case 'html':
        c("html:");
        page = page.replace("/0/","/");
        var msg = html(page, res);
        return;
      break;

      case 'listHTML':
        c("listHTML :");
        var msg = listHTML();
        res.writeHead(200, {'Content-Type': 'text/html charset=utf-8'});
        res.end(msg);
      break;

      case 'learn' :
        o.enterLearningMode(index);
        c("learn"+Blastername,4);
        res.writeHead(200, {'Content-Type': 'text/plain'});
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
           buf = fs.readFileSync("README.MD" ,{ encoding: 'utf8' });
           res.end('help : \n'+ buf);
      break;

      case 'reload' :
           nconf.file({ file: 'config.json' });
           res.end('reload');
      break;
      default:
        c("HTTP: error :'"+order[1]+"'",4);

        res.writeHead(405, {'Content-Type': 'text/plain'});
        res.end('unknown function :'+command+"'");
    } // fin SWITCH order[0]

    
});









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
function html(fileName, res) {
  var msg =  "";
  var rootFolder="";
  var defaultFileName = "/html/index.html";
  
  var headers = {};
  var contentTypesByExtension = {
        '.3gp'   : 'video/3gpp'
        , '.a'     : 'application/octet-stream'
        , '.ai'    : 'application/postscript'
        , '.aif'   : 'audio/x-aiff'
        , '.aiff'  : 'audio/x-aiff'
        , '.asc'   : 'application/pgp-signature'
        , '.asf'   : 'video/x-ms-asf'
        , '.asm'   : 'text/x-asm'
        , '.asx'   : 'video/x-ms-asf'
        , '.atom'  : 'application/atom+xml'
        , '.au'    : 'audio/basic'
        , '.avi'   : 'video/x-msvideo'
        , '.bat'   : 'application/x-msdownload'
        , '.bin'   : 'application/octet-stream'
        , '.bmp'   : 'image/bmp'
        , '.bz2'   : 'application/x-bzip2'
        , '.c'     : 'text/x-c'
        , '.cab'   : 'application/vnd.ms-cab-compressed'
        , '.cc'    : 'text/x-c'
        , '.chm'   : 'application/vnd.ms-htmlhelp'
        , '.class'   : 'application/octet-stream'
        , '.com'   : 'application/x-msdownload'
        , '.conf'  : 'text/plain'
        , '.cpp'   : 'text/x-c'
        , '.crt'   : 'application/x-x509-ca-cert'
        , '.css'   : 'text/css'
        , '.csv'   : 'text/csv'
        , '.cxx'   : 'text/x-c'
        , '.deb'   : 'application/x-debian-package'
        , '.der'   : 'application/x-x509-ca-cert'
        , '.diff'  : 'text/x-diff'
        , '.djv'   : 'image/vnd.djvu'
        , '.djvu'  : 'image/vnd.djvu'
        , '.dll'   : 'application/x-msdownload'
        , '.dmg'   : 'application/octet-stream'
        , '.doc'   : 'application/msword'
        , '.dot'   : 'application/msword'
        , '.dtd'   : 'application/xml-dtd'
        , '.dvi'   : 'application/x-dvi'
        , '.ear'   : 'application/java-archive'
        , '.eml'   : 'message/rfc822'
        , '.eps'   : 'application/postscript'
        , '.exe'   : 'application/x-msdownload'
        , '.f'     : 'text/x-fortran'
        , '.f77'   : 'text/x-fortran'
        , '.f90'   : 'text/x-fortran'
        , '.flv'   : 'video/x-flv'
        , '.for'   : 'text/x-fortran'
        , '.gem'   : 'application/octet-stream'
        , '.gemspec' : 'text/x-script.ruby'
        , '.gif'   : 'image/gif'
        , '.gz'    : 'application/x-gzip'
        , '.h'     : 'text/x-c'
        , '.hh'    : 'text/x-c'
        , '.htm'   : 'text/html'
        , '.html'  : 'text/html'
        , '..ico'   : 'image/vnd.microsoft.icon'
        , '.ics'   : 'text/calendar'
        , '.ifb'   : 'text/calendar'
        , '.iso'   : 'application/octet-stream'
        , '.jar'   : 'application/java-archive'
        , '.java'  : 'text/x-java-source'
        , '.jnlp'  : 'application/x-java-jnlp-file'
        , '.jpeg'  : 'image/jpeg'
        , '.jpg'   : 'image/jpeg'
        , '.js'    : 'application/javascript'
        , '.json'  : 'application/json'
        , '.log'   : 'text/plain'
        , '.m3u'   : 'audio/x-mpegurl'
        , '.m4v'   : 'video/mp4'
        , '.man'   : 'text/troff'
        , '.mathml'  : 'application/mathml+xml'
        , '.mbox'  : 'application/mbox'
        , '.mdoc'  : 'text/troff'
        , '.me'    : 'text/troff'
        , '.mid'   : 'audio/midi'
        , '.midi'  : 'audio/midi'
        , '.mime'  : 'message/rfc822'
        , '.mml'   : 'application/mathml+xml'
        , '.mng'   : 'video/x-mng'
        , '.mov'   : 'video/quicktime'
        , '.mp3'   : 'audio/mpeg'
        , '.mp4'   : 'video/mp4'
        , '.mp4v'  : 'video/mp4'
        , '.mpeg'  : 'video/mpeg'
        , '.mpg'   : 'video/mpeg'
        , '.ms'    : 'text/troff'
        , '.msi'   : 'application/x-msdownload'
        , '.odp'   : 'application/vnd.oasis.opendocument.presentation'
        , '.ods'   : 'application/vnd.oasis.opendocument.spreadsheet'
        , '.odt'   : 'application/vnd.oasis.opendocument.text'
        , '.ogg'   : 'application/ogg'
        , '.p'     : 'text/x-pascal'
        , '.pas'   : 'text/x-pascal'
        , '.pbm'   : 'image/x-portable-bitmap'
        , '.pdf'   : 'application/pdf'
        , '.pem'   : 'application/x-x509-ca-cert'
        , '.pgm'   : 'image/x-portable-graymap'
        , '.pgp'   : 'application/pgp-encrypted'
        , '.pkg'   : 'application/octet-stream'
        , '.pl'    : 'text/x-script.perl'
        , '.pm'    : 'text/x-script.perl-module'
        , '.png'   : 'image/png'
        , '.pnm'   : 'image/x-portable-anymap'
        , '.ppm'   : 'image/x-portable-pixmap'
        , '.pps'   : 'application/vnd.ms-powerpoint'
        , '.ppt'   : 'application/vnd.ms-powerpoint'
        , '.ps'    : 'application/postscript'
        , '.psd'   : 'image/vnd.adobe.photoshop'
        , '.py'    : 'text/x-script.python'
        , '.qt'    : 'video/quicktime'
        , '.ra'    : 'audio/x-pn-realaudio'
        , '.rake'  : 'text/x-script.ruby'
        , '.ram'   : 'audio/x-pn-realaudio'
        , '.rar'   : 'application/x-rar-compressed'
        , '.rb'    : 'text/x-script.ruby'
        , '.rdf'   : 'application/rdf+xml'
        , '.roff'  : 'text/troff'
        , '.rpm'   : 'application/x-redhat-package-manager'
        , '.rss'   : 'application/rss+xml'
        , '.rtf'   : 'application/rtf'
        , '.ru'    : 'text/x-script.ruby'
        , '.s'     : 'text/x-asm'
        , '.sgm'   : 'text/sgml'
        , '.sgml'  : 'text/sgml'
        , '.sh'    : 'application/x-sh'
        , '.sig'   : 'application/pgp-signature'
        , '.snd'   : 'audio/basic'
        , '.so'    : 'application/octet-stream'
        , '.svg'   : 'image/svg+xml'
        , '.svgz'  : 'image/svg+xml'
        , '.swf'   : 'application/x-shockwave-flash'
        , '.t'     : 'text/troff'
        , '.tar'   : 'application/x-tar'
        , '.tbz'   : 'application/x-bzip-compressed-tar'
        , '.tcl'   : 'application/x-tcl'
        , '.tex'   : 'application/x-tex'
        , '.texi'  : 'application/x-texinfo'
        , '.texinfo' : 'application/x-texinfo'
        , '.text'  : 'text/plain'
        , '.tif'   : 'image/tiff'
        , '.tiff'  : 'image/tiff'
        , '.torrent' : 'application/x-bittorrent'
        , '.tr'    : 'text/troff'
        , '.txt'   : 'text/plain'
        , '.vcf'   : 'text/x-vcard'
        , '.vcs'   : 'text/x-vcalendar'
        , '.vrml'  : 'model/vrml'
        , '.war'   : 'application/java-archive'
        , '.wav'   : 'audio/x-wav'
        , '.wma'   : 'audio/x-ms-wma'
        , '.wmv'   : 'video/x-ms-wmv'
        , '.wmx'   : 'video/x-ms-wmx'
        , '.wrl'   : 'model/vrml'
        , '.wsdl'  : 'application/wsdl+xml'
        , '.xbm'   : 'image/x-xbitmap'
        , '.xhtml'   : 'application/xhtml+xml'
        , '.xls'   : 'application/vnd.ms-excel'
        , '.xml'   : 'application/xml'
        , '.xpm'   : 'image/x-xpixmap'
        , '.xsl'   : 'application/xml'
        , '.xslt'  : 'application/xslt+xml'
        , '.yaml'  : 'text/yaml'
        , '.yml'   : 'text/yaml'
        , '.zip'   : 'application/zip'
  }; 

  console.log("HTML:1:"+fileName);
   // If no file name in Url, use default file name
  fileName = (fileName == "/html/") ? defaultFileName : rootFolder + fileName;
  console.log("HTML:2:"+fileName);

    fs.readFile(__dirname + decodeURIComponent(fileName), 'binary',function(err, content){
        if (content != null && content != '' ){
            
            var contentType = contentTypesByExtension[path.extname(fileName)];
            if (contentType) headers["Content-Type"] = contentType;
            console.log("HTML:3:"+contentType+':path:'+path.extname(fileName));                
            headers["Content-Length"] = content.length;
            res.writeHead(200, headers);
            res.write(content);
        }
        res.end();
    });

}

//
//
//
function listHTML() {
         var msg =  "";
         var msg2 =  "";
         var msgh =  "";
         var msgSpy ="";
        var obj1 = nconf.get();

        msgh = msgh + '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>ORVIBO</title>';
        msgh = msgh + '<link rel="stylesheet" href="/0/html/bootstrap/css/bootstrap.min.css"><link rel="stylesheet" href="/0/html/bootstrap/css/bootstrap-theme.min.css">';
        msgh = msgh +'<script src="/0/html/js/jquery.min.js"></script> ';
        msgh = msgh +'  <script src="/0/html/bootstrap/js/bootstrap.min.js"></script>';
        msgh = msgh +'  <style type="text/css">';
        msgh = msgh +'      /* Custom Styles */';
        msgh = msgh +'      ul.nav-tabs { ';
        msgh = msgh +'          width: 140px;';
        msgh = msgh +'          margin-top: 20px;';
        msgh = msgh +'          border-radius: 4px;';
        msgh = msgh +'          border: 1px solid #ddd;';
        msgh = msgh +'          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.067);';
        msgh = msgh +'      }';
        msgh = msgh +'      ul.nav-tabs li {';
        msgh = msgh +'          margin: 0; ';
        msgh = msgh +'          border-top: 1px solid #ddd;';
        msgh = msgh +'      }';
        msgh = msgh +'      ul.nav-tabs li:first-child {';
        msgh = msgh +'          border-top: none;';
        msgh = msgh +'      }';
        msgh = msgh +'      ul.nav-tabs li a {';
        msgh = msgh +'          margin: 0;';
        msgh = msgh +'          padding: 8px 16px;';
        msgh = msgh +'          border-radius: 0;';
        msgh = msgh +'      }';
        msgh = msgh +'      ul.nav-tabs li.active a, ul.nav-tabs li.active a:hover {';
        msgh = msgh +'          color: #fff;';
        msgh = msgh +'          background: #0088cc;';
        msgh = msgh +'          border: 1px solid #0088cc;';
        msgh = msgh +'      }';
        msgh = msgh +'      ul.nav-tabs li:first-child a {';
        msgh = msgh +'          border-radius: 4px 4px 0 0;';
        msgh = msgh +'      }';
        msgh = msgh +'      ul.nav-tabs li:last-child a {';
        msgh = msgh +'          border-radius: 0 0 4px 4px;';
        msgh = msgh +'      }';
        msgh = msgh +'      ul.nav-tabs.affix {';
        msgh = msgh +'          top: 30px; /* Set the top position of pinned element */';
        msgh = msgh +'      }';
        msgh = msgh +'      .jumbotron {';
        msgh = msgh +'          padding-top: 10px;';
        msgh = msgh +'          padding-bottom: 10px;';
        msgh = msgh +'          margin-bottom: 10px;';
        msgh = msgh +'      }';
        msgh = msgh +'  </style>\n';
        msgh = msgh+ '<script type="text/javascript" language="javascript">$(document).ready(function() {\n';
        msgh = msgh +'      $("ul.nav li a[href^=\'#\']").click(function(){\n';
        msgh = msgh +'         $("html, body").stop().animate({\n';
        msgh = msgh +'              scrollTop: $($(this).attr("href")).offset().top\n';
        msgh = msgh +'          }, 400);';
        msgh = msgh +'        });\n';
        
        msg = msg + '  <body data-spy="scroll" data-target="#myScrollspy">';
        msg = msg + '   <div class="container">';
        msg = msg + '    <div class="jumbotron">';
        msg = msg + '        <h1>Orbivo Control</h1>';
        msg = msg + '                <div id="myButtons" class="bs-example">';
        msg = msg + '                  <form action="#" autocomplete="on">';
        msg = msg + '                     <button id="wakeup" type="button" class="btn btn-warning">réveil Orvino</button>';
        msg = msg + '                     <button id="reload" type="button" class="btn btn-warning">reload conf</button>';
        msg = msg + '                 </form>';
        msg = msg + '                </div>';
        msg = msg + ' <div id="result-wakeup"></div>';
        
        msg = msg + '    </div>';
        msg = msg + '    <div class="row">';
        msgSpy = msgSpy + '        <div class="col-xs-3" id="myScrollspy">';
        msgSpy = msgSpy + '            <ul class="nav nav-tabs nav-stacked affix-top" data-spy="affix" data-offset-top="125">';
        msgSpy = msgSpy + '               <li><a href="#">top</a></li>'        
        msgh= msgh + '$("button#wakeup").click(function(event){$("#result-wakeup").load("/0/wakeup/0/0");console.log("wakeup");setTimeout(function(){ $("#result-wakeup").text("");  }, 2000);});\n';     
        msgh= msgh + '$("button#reload").click(function(event){$("#result-wakeup").load("/0/reload/0/0");setTimeout(function(){ $("#result-weakup").text("");  }, 2000);});\n';
        

        msg2 = msg2 + '    <div class="col-xs-9">';
            
        var activeButton =' class="active" ';
        Object.keys(obj1).forEach( function(name1) {
          var obj2 = nconf.get(name1);  
          var encodeName1 =encodeId(name1);
          msg2 = msg2 + '<h2 id="'+encodeName1+'">'+encodeName1+'</h2><div id="result-'+encodeName1+'"></div>';
          msg2 = msg2 + '<p><div id="myButtons" class="bs-example">';
          msgSpy = msgSpy + '                <li ';
          msgSpy = msgSpy + activeButton +'><a href="#result-'+encodeName1+'">'+name1+'</a></li>';            
          activeButton ='';
          Object.keys(obj2).forEach( function(name2) {
            
            var encodeName2 = encodeId(name2);

            msg2 = msg2 + '<button type="button" class="btn btn-primary" id="'+encodeName1+'-'+encodeName2+'">';
            msg2 = msg2 + name2;
            msg2 = msg2 + '</button>'; 

            msgh= msgh + '$("button#'+encodeName1+'-'+encodeName2+'").click(function(event){$("#result-'+encodeName1+'").load("/0/blast/'+urlencode(name1,'utf8')+'/'+urlencode(name2,'utf8')+'");console.log("click: |'+encodeName2+'|");setTimeout(function(){ $("#result-'+encodeName1+'").text("");  }, 2000);});\n';

          });
         msg2 = msg2 + '</div><p><hr>';
        });

        // fini de crer le spy de la droite 
        msgSpy = msgSpy + '            </ul>';
        msgSpy = msgSpy + '        </div>';

        // fini le header
        msgh = msgh +'});</script></head>';
        
        msg2 = msg2 + '</div></div></div>';
        msg2  = msg2 + '</body></html>';
  return (msgh+msg+msgSpy+msg2);
}


//
//
//
function listHTML_ORIGINAL() {
         var msg =  "";
         var msgh =  "";
        var obj1 = nconf.get();

        msgh =msgh+'<html><head><title>Liste des périphériques connus</title><meta charset="UTF-8">';
        msgh = msgh +'<style type="text/css">#telecommande{background:#e6e6e6;margin-left:20}';
        msgh = msgh + ".block {clear:left}"
        msgh = msgh + '.periph{display: inline;clear: left; font-weight: bold; font-size:25px}';
        msgh = msgh + '.res{display: inline;background-color: #00ff00;font-style: oblique;width: 100px;margin-left:10px}';
        msgh = msgh + '.button{height: 15px;float: left; padding:10px; border: 5px solid grey;background-color: lightgrey;}';
        msgh = msgh + '.button:hover, #boutton_free:hover{background: #525252;color:white;}';
        msgh = msgh + '.button.no_hover:hover{background: initial;color:initial;}';
        msgh = msgh + '.button.right{float:right;}';
        msgh = msgh + '</style> ';
        msgh = msgh + '<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>';
        msgh = msgh+ '<script type="text/javascript" language="javascript">$(document).ready(function() {';

        
        msg= msg + '<body><div id="telecommande">';
        msg = msg + '<div class="button" id="wakeup">réveil orvibo</div>';
        msgh= msgh + '$("#wakeup").click(function(event){$("#result-wakeup").load("/0/wakeup/0/0");setTimeout(function(){ $("#result-wakeup").text("");  }, 2000);});\n';
        
        msg = msg + '<div class="button" id="reload">Recharge le fichier de conf</div><div class="res" id="result-wakeup"></div>';
        msgh= msgh + '$("#reload").click(function(event){$("#result-wakeup").load("/0/reload/0/0");setTimeout(function(){ $("#result-weakup").text("");  }, 2000);});\n';
        

        msg = msg +'</div>';
        msg = msg +'<div class="block"><div class="periph"><h2>Liste des périphériques connus</h2></div></div>';

        Object.keys(obj1).forEach( function(name1) {
          var obj2 = nconf.get(name1);  
          var encodeName1 =encodeId(name1);
          msg = msg + '<div class="block"><div class="periph">'+name1+'</div><div class="res" id="result-'+encodeName1+'"></div>';
          msg = msg + '<div id="telecommande">';
                    
          Object.keys(obj2).forEach( function(name2) {
            
            var encodeName2 = encodeId(name2);

            msg = msg + '<div class="button" id="'+encodeName1+'-'+encodeName2+'">';
            msg = msg + name2;
            msg = msg + '</div>'; 

            msgh= msgh + '$("#'+encodeName1+'-'+encodeName2+'").click(function(event){$("#result-'+encodeName1+'").load("/0/blast/'+urlencode(name1,'utf8')+'/'+urlencode(name2,'utf8')+'");setTimeout(function(){ $("#result-'+encodeName1+'").text("");  }, 2000);});\n';

          });
         msg = msg + '</div></div>';
        });


        msgh = msgh +'});</script></head>';
        msg  = msg + '</body></html>';
  return (msgh+msg);
}

//
//  encodeId
//
function encodeId(chaine){
  var res;

  res = chaine;
  res = res.replace("+","plus");
  res = res.replace("*","etoile");
  res = res.replace("/","slash");
  res = res.replace("%","pourcent");
  res = res.replace(" ","_");
  return(res);
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