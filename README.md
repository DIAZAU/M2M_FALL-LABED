M2M_FALL-LABED
==============

# Projet M2M de Master 2 #

## Introduction ##
Dans le cadre de l'UE M2M, nous avons été emmennés à mettre en place une infrastructure de collecte de données depuis des capteurs à l'aide d'une carte de type Intel galileo. Pour cela, le matériel mis à notre disposition est:
* Carte Intel Galileo
* Capteur de gaz
* Carte SD 
* Jumpeurs
Le projet est composé des deux parties:
* **Partie1 ** : dans cette partie toute l'infrastructure tourne dans un seul PC.
* **Partie2 ** : dans celle-ci nous allons déployés toute l'infrastructure dans la carte.

## Partie 1 ##  

Comme indiqué plus haut, dans cette partie toute l'infrastructure tourne dans un seul PC donc il nous faut une sketch arduino pour pouvoir recupérer les données du capteur de gaz. Cette sketch se trouve dans le dossier **partie/sketchArduino**. 

Une fois l'sketch téléversée dans la carte, nous passons à la mise en place des serveurs permettant de recupérer les données. L'infrastructure imaginée est representée ci-dessous:

![alt tag](https://github.com/DevYourWorld/Master2-M2M/blob/master/etc/infrastructure.png?raw=true)



Expliquons brievement le rôle joué par chacune des briques visibles sur ce schéma:

* **openHAB:** c'est à partir de là que nous recupérons les données provenant de la carte Galileo. Pour se faire, nous avons mis en place un item binding serial pour pouvoir recupérer les données. Une fois cela fait, nous allons transmettre les données par des messages MQTT l'aide d'un item binding mqtt et une régle.
Les items et la régle se trouvent dans le répertoire **/partie1/openhab** 
* **Serveur mosquitto:** c'est un serveur standart mqtt permettant à l'entité **openHAB** de publier les données recuperées. 
* **mqtt-panel:** Ici, nous avons modifiés de serveur de mqtt-panel pour que celui enregistre les données dans une base de données mongodb avant d'envoyer ces données au client mqtt-panel en utilisant les sockets comme protocole de communication. Le client mqtt-panel permet de visualiser via une interface web l'état actuel de l'infrastructure (le niveau de gaz). 
* **MongoDB:** Base de donnée enregistrant tous les évènements liés aux capteurs.



## Mise en place ##
### Intel Galileo ###
Avant de commencer, il nous a fallu mettre à jour le firmware de notre Intel Galileo. Pour celà, nous avons suivi les instructions disponibles à l'adresse suivante: http://air.imag.fr/images/2/29/Galileo_GettingStarted.pdf .

Nous avons ensuite formaté une carte miniSD de façon à ce que celle-ci soit bootable.

**Sous Windows :**

	diskpart.exe
	select vol e	//la lettre correspondant à la carte SD
	clean
	create part primary
	active
	format quick label="BOOTME"
	exit

**Sous Linux :**
	TODO


Puis nous avons décompressé l'OS Clanton sur une carte SD, en prévision d'utiliser openHAB sur l'Intel Galileo nous avons utilisé la version "Yocto Project Linux image w/ Clanton-full kernel + general SDKs + Oracle JDK 8 + Tomcat", mais une version moins complète (du moins sans Java), devrai suffire. Clanton est téléchargeable à l'adresse suivante: http://ccc.ntu.edu.tw/index.php/en/news/40 .

L'Intel Galileo bootera automatiquement sur la version de Clanton que vous aurez installé.

Avant de continuer, vous devrez pouvoir vous connecter en SSH à votre Intel Galileo. Pour cela, branchez votre Intel Galileo à votre routeur, ou mettez en palce un serveur DHCP sur votre propre machine et connectez l'Intel Galileo directement à celle-ci. Les manipulations à venir se feront directement sur votre carte Intel Galileo via SSH (ou autre protocol).

Afin de communiquer via mosquitto, nous avons dut compiler une version de ce dernier. Hors mosquitto possède une dépendance à la bibliothèque "c-ares", qui n'est malheureusement pas présente sur l'installation initiale de Clanton. Nous avons donc dut build notre propre version de c-ares sur notre Intel Galileo. Pour cela, nous vous conseillons de suivre les indications du fichier "INSTALL" présent dans [l'archive de c-ares](http://c-ares.haxx.se/download/).

Vous pouvez dèsormais build votre propre version de mosquitto pour l'Intel Galileo! Pour cela, téléchargez la [dernière version de mosquitto](http://mosquitto.org/download/). Vous pouvez ensuite utiliser la commande "make" pour compiler votre version de mosquitto.

La principale difficulté ensuite a résidé dans le fait qu'il nous était impossible d'utiliser un sketch arduino standard en même temps que le Galileo était sous Clanton. Nous avons donc dut nous documenter afin de récupérer les entrées/sorties de l'Intel Galileo sous Clanton et les traiter via un script shell.
Une fois mosquitto installé, vous pouvez utiliser le [script shell](https://github.com/DevYourWorld/Master2-M2M/blob/master/galileo/hacksignal.sh) disponible sur ce même repository. Pour mieux comprendre le fonctionnement de ce script, nous vous invitons à consulter le site [malinov.com](http://www.malinov.com/Home/sergey-s-blog/intelgalileo-programminggpiofromlinux) qui nous a aidé à récupérer les entrées/sorties désirées de l'Intel Galileo.

**ATTENTION:** Pour que celui-ci fonctionne, vous devrez impérativement brancher votre détecteur de fumée sur l'entrée analogique 0 (A0) de votre Intel Galileo. 
Afin de ne pas griller votre carte, nous vous invittons à respecter le schéma suivant:

![alt tag](https://github.com/DevYourWorld/Master2-M2M/blob/master/etc/branchements.png?raw=true)

### Serveur distant ###
Le serveur distant que nous avons utilisé fut une machine utilisant Xubuntu 13.10. La configuration et l'installation expliquée ci-dessous concerneront donc cette version de Xubuntu.

Tout d'abord, certaines briques ne necessitent pas ou très peu de configuration, nous vous proposons de vous les procurer en premier:

	sudo add-apt-repository ppa:mosquitto-dev/mosquitto-ppa
	sudo apt-get update
	sudo apt-get install mosquitto
	sudo apt-get install mongodb-server
