int sensorValue;
void setup()
{
  Serial.begin(9600);   
}
void loop()
{
  analogReadResolution(10);
  sensorValue = analogRead(A0);   
  Serial.println(sensorValue);  
  delay(5000);                        
}
