#! /bin/bash

#demarrage du serveur mosquitto 
mosquitto -c mosquitto-1.0.2/mosquitto.conf &

#demarrage du serveur mqtt-panel
cd mqtt-panel-master
nodejs serveur.js &
cd ..

#recuperation des données
echo -n "37" > /sys/class/gpio/export
echo -n "out" > /sys/class/gpio/gpio37/direction
echo -n "strong" > /sys/class/gpio/gpio37/drive
echo -n "0" > /sys/class/gpio/gpio37/value

A0=`cat /sys/bus/iio/devices/iio\:device0/in_voltage0_raw`

while true;
do
	
	A0=`cat /sys/bus/iio/devices/iio\:device0/in_voltage0_raw`

	#publication du message
	mosquitto_pub -t messageMQTT -m $A0

	usleep 500000
done 
echo -n "37" > /sys/class/gpio/unexport

