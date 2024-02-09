import { Link } from 'react-router-dom'
import React from 'react'

export const ErrorPage = () => {
  return (
    <div>
        <h1 style={{textAlign: "center", height: "100vh"}}>
          Page does not exist!
          <button style={{color: "#fff"}}><Link to="/" style={{color: "#fff"}}>Back to Home</Link></button>
        </h1>
    </div>
  )
}
