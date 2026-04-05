import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import Landing from './pages/Landing'
import Tool from './pages/Tool'

function App() {
  return (
    <BrowserRouter basename="/">
      <NavBar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/tool" element={<Tool />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
