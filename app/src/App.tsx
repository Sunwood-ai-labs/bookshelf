import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Bookshelf } from './components/Bookshelf';
import { AddBookPage } from './components/AddBookPage';
import './App.css';

import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <ToastProvider>
      <Router basename="/bookshelf">
        <a
          href="https://github.com/Sunwood-ai-labs/bookshelf"
          target="_blank"
          rel="noopener noreferrer"
          className="github-ribbon"
        >
          <img
            decoding="async"
            width="149"
            height="149"
            src="https://github.blog/wp-content/uploads/2008/12/forkme_right_darkblue_121621.png?resize=149%2C149"
            className="attachment-full size-full"
            alt="Fork me on GitHub"
            loading="lazy"
          />
        </a>
        <Routes>
          <Route path="/" element={<Bookshelf />} />
          <Route path="/add" element={<AddBookPage />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
