import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Article } from './pages/Article';
import { Admin } from './pages/Admin';
import { Mission } from './pages/Mission';
import { useStore } from './store/useStore';

const App: React.FC = () => {
  const { fetchPosts } = useStore();

  useEffect(() => {
    // Initial content index fetch
    fetchPosts();
  }, [fetchPosts]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/article/:category/:slug" element={<Article />} />
          <Route path="/mission" element={<Mission />} />
          <Route path="/_ai" element={<Admin />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;