// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Vendedor from "./pages/vendedor";
import Comprador from "./pages/comprador";

function Home() {
  return <h1 className="text-3xl font-bold">Inicio</h1>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vendedor" element={<Vendedor />} />
        <Route path="/comprador" element={<Comprador />} />
      </Routes>
    </Router>
  );
}

export default App;
