import { useState } from 'react'
import Weather from './Component/Weather.jsx';
import './App.css'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <Weather />
    </>
  )
}

export default App
