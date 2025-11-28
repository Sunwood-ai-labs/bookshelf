import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Bookshelf } from './components/Bookshelf';
import { AddBookPage } from './components/AddBookPage';
import './App.css';

function App() {
  return (
    <Router basename="/bookshelf">
      <Routes>
        <Route path="/" element={<Bookshelf />} />
        <Route path="/add" element={<AddBookPage />} />
      </Routes>
    </Router>
  );
}

export default App;
