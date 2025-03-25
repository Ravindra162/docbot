import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Register from './pages/Register'
import Login from './pages/Login'
import AuthProvider from './auth/AuthProvider'
const App = () => {
  return (
    <Router>

      <Routes>
        <Route path='/register' element={<Register />} />
        <Route path='/login' element={<Login />} />
        <Route path='/' element={<AuthProvider><Home /></AuthProvider>} />
        <Route path='/chat' element={<AuthProvider><Chat /></AuthProvider>} />

      </Routes>


    </Router>
  )
}

export default App