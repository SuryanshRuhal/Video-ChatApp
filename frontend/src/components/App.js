import React from "react";
import { Route, Routes } from "react-router-dom";
import Lobby from "./lobby";
import Room from "./roompage";
import './styles.css';
function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Lobby/>}/>
        <Route path="/room/:room" element={<Room/>}/>
      </Routes>
    </div>
  );
}

export default App;
