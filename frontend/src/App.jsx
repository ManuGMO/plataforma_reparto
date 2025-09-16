// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Vendedor from "./pages/vendedor";
import Comprador from "./pages/comprador";
import Repartidor from "./pages/repartidor";

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
        <Route path="/repartidor" element={<Repartidor />} />
      </Routes>
    </Router>
  );
}

export default App;
