
/****
 * basic bh call - should have dobhGetRaw flow thu here
 * @param {string} query - the url to call
 * @param {string} method - GET, POST, PUT
 * @param {string} opt - options
 * @param {boolean} encode - options
 * @return {UrlFetchApp.HTTPResponse} UrlFetchApp.fetch
 */
function doBHcall_(query, method ='GET', opt ={'muteHttpExceptions': true}, encode = true, step = 0){
  const bhVars = authorizeAccess();
  const options = {...opt, method : method, headers:{bhresttoken: bhVars.BhRestToken}};
  const url = encode ? encodeURI(`${bhVars.BhRestUrl}${query}`) : `${bhVars.BhRestUrl}${query}` 

  const response = UrlFetchApp.fetch(url, options);
  
  if (response.getResponseCode() == 429 || response.getResponseCode() == 504){
    console.warn(response.getResponseCode() + ' error encountered - query reran')
    Utilities.sleep(1000);
    return doBHcall(query, method, opt, encode)
  }

  if (response.getResponseCode() == 401){
    console.log(response.getResponseCode() + 'in doBHCall calling refersh')
    doBullhornAuthTokenRefresh_()
    return doBHcall(query, method, opt, encode)
  }
  
  if (response.getResponseCode() == 400 && step < 3 && isDataSyncError_(response)){
    console.warn(response.getResponseCode() + ' error encountered - query reran')
    issueLogger('bhErrors', [new Date() , response.getResponseCode(),response.getContentText(), query])
    Utilities.sleep(1000);
    return doBHcall(query, method, opt, encode, step++)
  }

  //if (response.getResponseCode() > 399)
    //logError_(response, query)
  
  return response;
}

/** Simple search to test the Oauth is working */
const simpleTestSearch = () => console.log(JSON.parse(doBHcall_( "search/Candidate?fields=id,firstName,customDate3&query=isDeleted:false")))

