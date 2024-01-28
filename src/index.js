import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {ApolloClient, InMemoryCache, ApolloProvider , HttpLink } from '@apollo/client';
import { Auth0Provider } from "@auth0/auth0-react";
import { gqlUrl } from "./config.js"

const client = new ApolloClient({
  // link: new HttpLink(
  //   {
  //     uri:'http://localhost:3000/api/graphql',
  //     // fetchOptions: {
  //     //   mode: 'no-cors'
  //     // }
  //   }
  // ),
  //本地调试
  // uri:'http://localhost:3002/api/graphql',
  //线上railway.app部署
  uri: gqlUrl ,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  cache: new InMemoryCache(),
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  // <Auth0Provider
  // domain="dev-w209yucv.us.auth0.com"
  // clientId="z2p0Oz5jeNuxtQ8ewTKfSAe17Wt3lZzH"
  // // redirectUri="http://localhost:3003/" 
  // // redirectUri={ window.location.host.includes("vercel") ? "https://app-client-theta.vercel.app/":"http://localhost:3003/"   }
  //   redirectUri={ window.location.host.includes("okaku") ? "https://okakuapp.xyz/":"http://localhost:3003/"   }
  // audience="https://app.okakuapp.xyz/bookmanager"
  // scope='openid profile email'>
    <App client={client} />
///* </Auth0Provider> */}
);
