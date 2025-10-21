import { Outlet } from 'react-router'
import Navbar from "./components/Navbar.tsx"

import './App.css'

function LandingPage() {

  return (
    <>
      <div className="p-[1.5rem] flex flex-col gap-[3rem] items-center bg-[#ebffff] bg-gradient-to-b from-[#ebffff] via-[#57b6c7] to-[#53d6ed]">
        <Navbar />

        <div className="hero text-5xl font-bold">
          <p>Building the future of tech,</p>
          <p> one snapshot at a time</p>
        </div>

        <Outlet />
      </div>
    </>
  )
      
}

export default LandingPage
