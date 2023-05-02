/**
 * For Bullorn oauth documentation see
 * https://bullhorn.github.io/Data-Center-URLs/
 * https://bullhorn.github.io/Getting-Started-with-REST/
 */


/**
 * @typedef bhToken
 * @type {Object}
 * @property {string} access_token
 * @property {string} BhRestToken
 * @property {string} BhRestUrl
 * @property {string} refresh_token
 * @property {string} token_type
 * @property {number} expirationTime
 */

/*** @return {string} authorization URL like https://auth-west.bullhornstaffing.com/oauth/authorize */
const getAuthURL_ = () =>  PropertiesService.getScriptProperties().getProperty('AUTH_URL')

/*** @return {string} auth token url like https://auth-west.bullhornstaffing.com/oauth/token  */
const getAuthTokenURL_ = () => PropertiesService.getScriptProperties().getProperty('AUTH_TOKEN_URL')

/*** @return {string} user property */
const getRestAPI_ = () => PropertiesService.getScriptProperties().getProperty('REST_API')

/*** @return {string} user property */
const getUser_ = () => PropertiesService.getScriptProperties().getProperty('user')
/*** @return {string} password property */
const getPassword_ = () => PropertiesService.getScriptProperties().getProperty('password')
/*** @return {string} secret propert */
const getSecret_ = () => PropertiesService.getScriptProperties().getProperty('secret')
/*** @return {string} clientID proper */
const getClientID_ = () => PropertiesService.getScriptProperties().getProperty('clientID')



/**
 * @param {string} token (strinified) 
 * @return {bhToken}
*/
const parseToken_ = (token) => JSON.parse(token)

/**@param {bhToken} */
const storeToken_ = (token) => PropertiesService.getScriptProperties().setProperty('bhToken', JSON.stringify(token))

/** @return {bhToken} */ 
const retrieveToken_ = () => parseToken_(PropertiesService.getScriptProperties().getProperty('bhToken'))

/** 
 * @param {Date} date
 * @return {number}
 */
const getTimeInSeconds_ = (date) => Math.floor(date.getTime() / 1000)

/** @return {number} */
const expiresAt_ = (expiresIn) => new Date().getTime() + (Number(expiresIn) * 1000)

/**
 * function to get Oauth Access
 * @param {string} msg - for debugging message if needed
 * @param {string} user - user
 * @param {string} pass - password
 */
function basicAccess_(msg = null, user = getUser_(), pass = getPassword_()){
  if (msg)
    console.log(msg)

  try{
    const authCode = getAuthCode_(user,pass); //first get the authcdoe
    doBullhornAuthToken_(authCode.code); //then get bearerToken
    return getBhRestToken_(); // get the Bullhorn rest token
  }
  catch(e){
    console.error('error in basic access', e, msg);
  }
}
/**
 * private function to check if any of the properties are null
 * @param {bhToken} token
 */
const checkToken_ = (token) => (token?.BhRestToken === undefined || token?.BhRestUrl  === null || token?.access_token === null || token?.expirationTime === null) ? 
    basicAccess_('bhOnlyRestToken is null or bhRestURL is null' + token?.toString()) : token;

/**
 * Checks the refresh token in case the current token as expired
 * @return {bhToken}
 */
const checkRefresh_ = () =>  {
  try{
    const lock = LockService.getScriptLock();
    let releaseLock = false;
    if (!lock.hasLock()) {
      lock.waitLock(30000);
      releaseLock = true;
    }
    doBullhornAuthTokenRefresh_();
    if (releaseLock) {
      lock.releaseLock();
    }
  }catch(e){
    console.error('Failure refreshing Token', e);
  }
  return retrieveToken_();
} 

/**
 * Authorize access to Oauth
 * @param {user} username
 * @param {password} password
 * @return {bhToken} the auth object
 */
function authorizeAccess (){
  const token = retrieveToken_()
  const now = new Date().getTime();
  
  if (now < token?.expirationTime){//we have time so we should test that we have a rest token and URL
    return checkToken_(token)
  }
  else if (now >= token?.expirationTime){ //time has expired then get use the refresh token{
    return checkRefresh_();
  }
  return basicAccess_('end of authorize access');
} 

/**
 * function to get auth code
 * @param {string} user
 * @param {string} pass
 * @return {Array<string>}
 */
function getAuthCode_(user, pass){//getAuthCode
      
  const data =  {
    username: user,
    password: pass,
    client_id: getClientID_(),
    response_type: "code",
    action: "Login"
  };
      
  const options = {
    method: 'POST',
    followRedirects : false,
    contentType: 'application/x-www-form-urlencoded',
    payload: data, 
    'muteHttpExceptions':true
  };

  try{
    const res = UrlFetchApp.fetch(getAuthURL_(), options);
    return parseQuery_(res.getHeaders()['Location'])
  }catch(e){
    console.error('issue getting Auth code', e);
  }
}

/**
 * Split a URL query string into an array
 * @param {string} URL
 * @return {Array<string>}
 */
const parseQuery_ = (url) => (query = url.split("?")[1]) ? query.split("&")
    .reduce((o, e)  => {
      const temp = e.split("=");
      const key = temp[0].trim();
      let value = temp[1].trim();
      value = isNaN(value) ? value : Number(value);
      o[key] = value;
      return o;
    }, {}) : null

/***
 * get the auth token using the auth code
 * @param {string} authocCode
 */
function doBullhornAuthToken_(authCode) {

  const options = {method : 'POST'}; //post method to get BhRestCode , 'muteHttpExceptions':true
  const url = `${getAuthTokenURL_()}?grant_type=authorization_code&code=${authCode}&client_id=${getClientID_()}&client_secret=${getSecret_()}`;
  const firstResponse = UrlFetchApp.fetch(url, options);
  const response = JSON.parse(firstResponse);
  storeToken_({expirationTime: expiresAt_(response.expires_in) , ...response})
  //console.log('new token requested', 'new experieation time', expiresAt_(response.expires_in))
}

/**
 * Get the rest Token which opens BH
 * @return {bhToken}
 */
function getBhRestToken_(){
  const token = retrieveToken_();

  const res = UrlFetchApp.fetch(`${getRestAPI_()}?version=%2A&access_token=${token.access_token}`, {method: "GET" });
  const response = JSON.parse(res);

  //MailApp.sendEmail('jkeenan@cpi-search.com', 'New token requested', 'NOTE THIS ' + response.BhRestToken);
  storeToken_({...token, BhRestToken : response.BhRestToken, BhRestUrl : response.restUrl})
  return retrieveToken_();
}

/**
 * refresh the token and replace the properties
 */
function doBullhornAuthTokenRefresh_() {
  const token = retrieveToken_()
  const url = `${getAuthTokenURL_()}?grant_type=refresh_token&refresh_token=${token.refresh_token}&client_id=${getClientID_()}&client_secret=${getSecret_()}`;

  try{
    const response = UrlFetchApp.fetch(url, {method : 'POST', muteHttpExceptions:true});
    const rc = response.getResponseCode();
    if (rc != 200)
      return basicAccess_('refresh access rc was ' + rc + ' so redoing access');

    const parsedResponse = JSON.parse(response);
    storeToken_({...token, expirationTime: expiresAt_(parsedResponse.expires_in), access_token: parsedResponse.access_token, refresh_token : parsedResponse.refresh_token })
    getBhRestToken_()
  
  }catch(e){
    basicAccess_('refresh failed calling basic access' + e);    
  }
  //console.log.log("REFRESH SUCCEEDED - expires in now " + new Date(retrieveToken_().expirationTime),'original token', token, 'new token', retrieveToken_());
}
