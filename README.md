Autheurs : Birahima FALL & Sami LABED
==============

# Projet M2M de Master 2 #

## Introduction ##
Dans le cadre de la deuxiéme partie de l'UE M2M, nous avons été emmennés à mettre en place une infrastructure basée sur l'internet des choses consistant à collecte de données depuis des capteurs à l'aide d'une carte de type Intel galileo. Pour cela, le matériel mis à notre disposition est:
* Carte Intel Galileo
* Capteur de gaz
* Carte SD 
* Jumpeurs

Le projet est composé des deux parties :
* Partie1 : dans cette partie toute l'infrastructure tourne dans un seul PC.
* Partie2 : dans celle-ci nous allons déployés toute l'infrastructure dans la carte.

Avant de commencer, il nous a fallu mettre à jour le firmware de notre Intel Galileo. Pour celà, nous avons suivi les instructions disponibles à l'adresse suivante: http://air.imag.fr/images/2/29/Galileo_GettingStarted.pdf .

## Partie 1 

Comme indiqué plus haut, dans cette partie toute l'infrastructure tourne dans un seul PC donc il nous faut une sketch arduino pour pouvoir recupérer les données du capteur de gaz. Cet sketch se trouve dans le dossier **partie1/sketchArduino** .
Une fois l'sketch téléversée dans la carte, nous passons à la mise en place des serveurs permettant de recupérer les données. Pour cela, nous avons mis en place l'architecture présentée comme suit : 

![alt tag](https://github.com/DIAZAU/M2M_FALL-LABED/blob/master/Partie1.jpg?raw=true)


Dans ce schema, nous pouvons remarqués entre autre : 
* **openHab:** c'est à partir de là que nous recupérons les données provenant de la carte Galileo. Pour se faire, nous avons mis en place un [item binding serial](https://github.com/DIAZAU/M2M_FALL-LABED/blob/master/partie1/openhab/m2m.items) pour pouvoir recupérer les données provenant de la carte. Une fois cela fait, nous allons transmettre les données par des messages MQTT l'aide d'un item binding mqtt et une [régle](https://github.com/DIAZAU/M2M_FALL-LABED/blob/master/partie1/openhab/m2m.rules).
Les items et la régle se trouvent dans le répertoire **/partie1/openhab** .
* **Serveur MQTT:** c'est un serveur standart mqtt permettant à l'entité **openHAB** de publier les données recuperées. 
* **Serveur MQTT-panel:** Ici, nous avons modifiés de serveur de mqtt-panel pour que celui enregistre les données dans une base de données mongodb avant d'envoyer ces données au client mqtt-panel en utilisant les sockets comme protocole de communication. La modification apportée au serveur mqtt-panel est présentée comme suit : 	
	**Serveur mqtt-panel :**
	
		mqttclient.on('message', function(topic, payload) {
		    io.sockets.emit('mqtt',
			{'topic'  : topic,
			 'payload' : payload
			}
		    );
		    //insertion du niveau de gaz dans une collection à une date donnée.
		    date = new Date();
		    MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
		    	if(err) throw err;
			var collection = db.collection('m2m');
			collection.insert({mesure_gaz:gaz, date:date.toGMTString() })
		    });
		});

Le client mqtt-panel permet de visualiser via une interface web l'état actuel de l'infrastructure (le niveau de gaz). 
* **MongoDB:** Base de donnée enregistrant tous les évènements liés aux capteurs.

Pour faire fonctionner notre infrastructure, il faut obligatoirement démarrer tous les serveurs décrits plus haut et serveiller à ce que le port USB au niveau de l'item binding serial de openHab soit bien celui present dans **/dev/ttyAMC[0..9]**. 

###Difficultés
Comme nous n'avons jamais utilisés MQTT, nous avions au debut des problémes de pouvoir envoyer et de recevoir des données par des messages MQTT. Mais aprés quelques recherches sur les forums et notamment dans site de [mosquitto](http://mosquitto.org/), nous avons compris le fonctionnement du protocole et enfin envoyer et recevoir des messages MQTT. 


##Partie 2

Dans cette partie, toute l'infrastructure est deplacée dans la carte donc nous devons installer une distribution Linux supportant les serveurs mosquitto, mongodb,  mqtt-panel et aussi nodejs. Pour ce faire nous avons tout d'abord formaté la carte miniSD de façon à ce que celle-ci soit bootable comme suit :

**Sous Windows :**

	diskpart.exe
	select vol e	//la lettre correspondant à la carte SD
	clean
	create part primary
	active
	format quick label="BOOTME"
	exit

Puis nous avons décompressé l'OS Clanton sur une carte SD, en prévision d'utiliser MQTT sur l'Intel Galileo nous avons utilisé la version "Yocto Project Linux image w/ Clanton-full kernel + general SDKs + Oracle JDK 8 + Tomcat", mais une version moins complète (du moins sans Java), devrai suffire. Clanton est téléchargeable à l'adresse suivante: http://ccc.ntu.edu.tw/index.php/en/news/40 .

L'Intel Galileo bootera automatiquement sur la version de Clanton que vous aurez installé et puis nous recupérons l'adresse ip de la carte en utilisant wireshark puisque nous ne pouvons plus accéder à la carte avec le port usb host. 
L'infrastructure imaginée est representée ci-dessous:
![alt tag](https://github.com/DIAZAU/M2M_FALL-LABED/blob/master/Partie2.jpg?raw=true)

Ici nous n'avons pas jugés necessaire d'utiliser openHab. En effet pour recuperer les données, nous avons utilisés un script shell (gpio) et puis publier les données par des messages mqtt. Nous reviendrons sur cet script plus loin.

Les manipulations à venir se feront directement sur notre carte Intel Galileo via SSH (ou autre protocol).

Afin de communiquer via mosquitto, nous avons dut téléchargez la [dernière version de mosquitto](http://mosquitto.org/download/) et puis compiler cette derniére avec les commandes make et make install. 


La principale difficulté ensuite a résidé dans le fait qu'il nous était impossible d'utiliser un sketch arduino standard en même temps que le Galileo était sous Clanton. Nous avons donc dut nous documenter afin de récupérer les entrées/sorties de l'Intel Galileo sous Clanton et les traiter via un script shell. 
Cet [script shell](https://github.com/DIAZAU/M2M_FALL-LABED/tree/master/partie2/m2m.sh) se trouve dans le repertoire **partie2/**.

**ATTENTION:** Pour que celui-ci fonctionne, nous devons impérativement brancher notre capteur de gaz sur l'entrée analogique 0 (A0) de la carte intel Galileo présenter comme suit:

![alt tag](https://github.com/DIAZAU/M2M_FALL-LABED/blob/master/CroquisSketchArduino.jpg?raw=true)

##Conclusion
Dans ce projet, nous avons pu mettre en place deux infrastructures permettant de collecter des données issues d'un capteur de gaz. Par soucis de temps, nous avons juste affichés les données dans une page web mais nous pourrions par exemple envoyés des commandes vers openHab permettant d'ouvrir  toutes les fénétres dés que le niveau de gaz atteint un seuil bien défini.
Par ailleurs, ce projet nous a permis de découvrir des technologies de pointes permettant de mettre en places des infrastructures basées sur l'internet des choses.

