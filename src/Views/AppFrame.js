import "../App.css"
import { NavLink, Route, Routes, BrowserRouter, Outle, Navigate } from "react-router-dom";

import MainScreen from "./App/Flutter/MainScreen.js"
import ClipScreen from "./App/Flutter/ClipScreen.js";



export default function AppFame(props) {
    return  <div class="container-full mx-auto h-full overflow-y-scroll" >
                <Routes>
                    <Route path ="/clip" element={<MainScreen/>}/>
                    <Route path ="/" element={<ClipScreen/>}/>
                </Routes>
            </div>
}
