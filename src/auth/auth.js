import auth0 from "auth0-js"
import jwtdecode from "jwt-decode"
import { auth0Domain, auth0ClientID, auth0RedirectUri } from "../config"

export default class Auth {

  auth0 = new auth0.WebAuth({
    domain: auth0Domain,
    clientID: auth0ClientID,
    redirectUri: auth0RedirectUri,

    responseType: "token id_token",
    scope: "openid email profile"
  });

  constructor() {
    this.login = this.login.bind(this)
    this.logout = this.logout.bind(this)
    this.handleAuthentication = this.handleAuthentication.bind(this)
    this.isAuthenticated = this.isAuthenticated.bind(this)
    this.getAuthToken = this.getAuthToken.bind(this)
    this.getUserId = this.getUserId.bind(this)
  }

  isAuthenticated() {
    // Check whether the current time is past the 
    // Access Token's expiry time
    let expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }

  login() {
    this.auth0.authorize();    
  }

  getAuthToken() {
    return localStorage.getItem('access_token')
  }

  getUserId() { //Unsafe, not verified
    const idToken = localStorage.getItem('id_token')
    return jwtdecode(idToken).email
  }

  handleAuthentication(callback) {
    this.auth0.parseHash((err, authResult) => {
        if (authResult && authResult.accessToken && authResult.idToken) {
            this.setSession(authResult);
            const email = this.getUserId(authResult.idToken)
            callback(authResult, email)
        } else if (err) {
          console.log(err);
          alert(`Error: ${err.error}. Check the console for further details.`);
        }
      });  
    }

  setSession(authResult) {
    // Set the time that the access token will expire at
    let expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime())
    localStorage.setItem('access_token', authResult.accessToken)
    localStorage.setItem('id_token', authResult.idToken)
    localStorage.setItem('expires_at', expiresAt)
  }

  logout() {
    // Clear Access Token and ID Token from local storage
    localStorage.removeItem('access_token')
    localStorage.removeItem('id_token')
    localStorage.removeItem('expires_at')
    localStorage.removeItem('chatkit_user')
    //TODO: callback to reset the app state.
    history.push('/')
  }
}
