// src/App.js
import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import MyConsumption from "./pages/MyConsumption";
import DetailsPage from "./pages/DetailsPage";
import ConsumptionReport from "./pages/ConsumptionReport";
import MyPage from "./pages/MyPage";

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);

  const basename =
    process.env.NODE_ENV === "production"
      ? "/db2025_502/db2025_502_team1"
      : "/";

  const handleLogout = () => {
    setLoggedInUser(null);
  };

  return (
    <BrowserRouter basename={basename}>
      <Navbar 
        loggedInUser={loggedInUser} 
        setLoggedInUser={setLoggedInUser}   
        onLogout={handleLogout}
      />

      <main className="container">
        <Routes>
          <Route
            path="/"
            element={<MyConsumption loggedInUser={loggedInUser} />}
          />

          <Route
            path="/my-consumption"
            element={<MyConsumption loggedInUser={loggedInUser} />}
          />

          <Route
            path="/details"
            element={<DetailsPage loggedInUser={loggedInUser} />}
          />

          <Route
            path="/report"
            element={<ConsumptionReport loggedInUser={loggedInUser} />}
          />

          <Route
            path="/mypage"
            element={<MyPage loggedInUser={loggedInUser} />}
          />

          <Route
            path="/login"
            element={<Login setLoggedInUser={setLoggedInUser} />}
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
