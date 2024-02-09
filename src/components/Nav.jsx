import { Link } from 'react-router-dom'
import React from 'react'

export const Nav = () => {
  return (
    <nav>
        <ul>
            <li><Link to="/generate-image"><button>Generate Image</button></Link></li>
        </ul>

    </nav>
  )
}
