const auth0Domain = 'pusher-chatkit-demo.auth0.com'
const auth0ClientID = 'VF0kHM9szMj0aQGEfqafrdAKVwRb2a3Q'
const auth0RedirectUri = 'https://chatkit-sample.netlify.com/'
//const auth0Domain = 'apimyapp.auth0.com'
//const auth0ClientID = 'wB83IRkSIW0QEHSZsqcSpDiAdmjkQyLj'
//const auth0RedirectUri = 'https://obrolan.netlify.com/'

// const auth0RedirectUri = 'http://localhost:3000' /* Testing locally */

const chatkitTokenProviderEndpoint = '.netlify/functions/token'

const chatkitInstanceLocator = 'v1:us1:7954c374-f491-4c08-b71e-5abfc0a3dc89'
//const chatkitInstanceLocator = 'v1:us1:b80cabb2-ec4b-4c6e-8676-667607b40360'

export { auth0Domain, auth0ClientID, auth0RedirectUri, chatkitTokenProviderEndpoint, chatkitInstanceLocator }
