Bonjour,

Ceci est une adaptation du code Grayada/index.js (https://gist.github.com/Grayda/b2ba0aa9e70fada5018e)
et de la librairie ninja-allone (https://github.com/Grayda/ninja-allone)

L'objectif est de pouvoir piloter les periphériques  infra rouge  par l'intermédiaire du boitier ORBIVO par S.A.R.A.H.

j'ai donc modifier le code pour y inclure un serveur HTTP qui répond aux ordres de la forme :

 http://127.0.0.1:8081/{id orvibo}/{command}/{perif}/{blaster name}

 avec :
  - id orvibo : toujours a zero si vous avez qu'un Orbivo (pas testé avec plusieurs car je n'en ai qu'un)
  
  - command :
  	* learn : pour apprendre un code infrarouge
  	* blast : pour emettre un code infrarouge
  	* wakeup : pour reveiller l'orbivo car il s'endort rapidement

  - perif : le nom du périphérique

  - blaster name : la fonction du code infrarouge


EXEMPLES :

 pour enregister un code 

 1) lancer le serveur :
 	node.exe" server.js

 2) Appeler l'URL pour apprendre un code

  http://127.0.0.1:8081/0/learn/tv/on

  l'OBVIBO se met a clignoter en rouge
  Appuyer sur le bouton on de votre TV
   
  Le code est enregistré.

  3) Allumer votre TV par une requete HTTP: 

	http://127.0.0.1:8081/0/blast/tv/on  



