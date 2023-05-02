# BullhornGoogleScript
Access Bullhorn inside of Google Scripts

Please familiarize yourself with the bullhorn documentation
https://bullhorn.github.io/Getting-Started-with-REST/
https://bullhorn.github.io/rest-api-docs/index.html


You will need the following credentials to access Bullhorn from Google Script
* a REST API clientID
* a REST API secret
* a REST API username
* a REST API password

The Client ID, Secret and username must be created by Bullhorn support - pls contact them to obtain the credentials. Once the credentials are created, you can set the password in the Users entity inside of Bullhorn.

FIRST TIME USING CREDENTIALS!!! YOU MUST ACCEPT THE TERMS OF SERVICE. To do this, copy this URL to a webbrowser and complete the login using the Username and password associated with the REST API credentials (NOT your regular bullhorn credentials)
ttps://auth.bullhornstaffing.com/oauth/authorize?client_id={client_id}&response_type=code&action=Login

to use the script

* go to script.google.com
* create a new Project
* copy the script to your new project
* complete the following script properties
-- AUTH_TOKEN_URL
-- AUTH_URL
-- user
-- secret 
-- REST_API
-- clientID
-- password

To add script properties to a google script, go to the gear icon on the left hand side, search for "Script Properties" and click "Add Script Property"

OR

programmatically by running the following command inside the Script Project
PropertiesService.getScriptProperties().setProperties(PROPERTIES)
where PROPERTIES is an object of key value pairs such as

{
AUTH_TOKEN_URL : 'https://auth-west.bullhornstaffing.com/oauth/token', //https://bullhorn.github.io/Data-Center-URLs/
AUTH_URL : 'https://auth-west.bullhornstaffing.com/oauth/authorize',  //https://bullhorn.github.io/Data-Center-URLs/
user : 'usernameGivenByBullhorn',
secret : 'secretGivenByBullhornSupport',
REST_API: 'https://rest-west.bullhornstaffing.com/rest-services/login', //https://bullhorn.github.io/Data-Center-URLs/
clientID : ,
password :'
}
