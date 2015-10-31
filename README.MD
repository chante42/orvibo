Bonjour,

PRES-REQUIS :
-------------
Installer l'application d'ORVIBO sur votre téléphone.
 - WiWo (https://play.google.com/store/apps/details?id=com.orvibo.irhost&hl=fr)  
 - Paramètrer le wifi de votre périphérique. (cf doc constructeur)

INSTALLATION : 
--------------
Dans le repertoire ou vous avez cloner le repository github :
Installer les dépendance javascript :
  > npm install charset nconf undescore underscore.string urlencode path

INTRODUCTION : 
--------------
Ceci est une adaptation du code Grayada/index.js (https://gist.github.com/Grayda/b2ba0aa9e70fada5018e)
et de la librairie ninja-allone (https://github.com/Grayda/ninja-allone)

L'objectif est de pouvoir piloter les periphériques  infra rouge  par l'intermédiaire du boitier ORBIVO par S.A.R.A.H.

j'ai donc modifié le code pour y inclure un serveur HTTP qui répond aux ordres de la forme :

 http://127.0.0.1:8081/{id orvibo}/{command}/{perif}/{blaster name}

 avec :
  - id orvibo : toujours a zero si vous avez qu'un Orbivo (pas testé avec plusieurs car je n'en ai qu'un)
  
  - command :
  	* learn     : pour apprendre un code infrarouge
  	* blast     : pour emettre un code infrarouge
  	* wakeup    : pour reveiller l'orbivo car il s'endort rapidement
    * list      : affiche la liste des periferiques
    * listHtml  : Mini interface HTML pour excecuter les actions.
    * help      : affiche l'aide

  - perif : le nom du périphérique

  - blaster name : la fonction du code infrarouge


PRINCIPE :
----------
  - Le boitier ORVIBO est très primitif (d'ou sont prix ~40€ )
  - Il a donc aucune mémoire pour les codes infraRouge.
  - Il est pilotable en UDP sur le port 5000, et suite a l'apprentissage d'une code renvois ce dernier sous forme hexa.
  - Il suffit donc de l'enregister dans un fichier de config (config.json)
  - et de renvoyer exactement ce même code pour qu'il soit réémis.


EXEMPLES :
----------
 0) configurez la partie réseau de  votre ORVIBO par l'intermédiare de l'application officiel

 0 Bis) Installer les modues : nconf, underscore, underscore.string
    >npd.exe nconf

 1) lancer le serveur :
 	node.exe" server.js

 2) Appeler l'URL pour apprendre un code

  http://127.0.0.1:8081/0/learn/tv/on

  l'OBVIBO se met a clignoter en rouge
  Appuyer sur le bouton on de  la télécommande de votre TV
   
  Le code est enregistré.

  3) Allumer votre TV par une requete HTTP: 

	http://127.0.0.1:8081/0/blast/tv/on  



