import { useState } from 'react'
import Weather from './Component/Weather.jsx';



function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <Weather />
    </>
  )
}

export default App
