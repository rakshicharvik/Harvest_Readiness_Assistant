// app/root.tsx
import {Outlet} from "react-router";

import "./app.css";


export default function App(){
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Agri Harvest Assitant</title>
      </head>
      <body>
        <Outlet/>
      </body> 
    </html>
  );
}


