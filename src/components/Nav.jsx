import React, { useState } from 'react';

import { NavLink } from 'react-router-dom';

const Nav = () => {
  const [hoveredOrFocusedLink, setHoveredOrFocusedLink] = useState(null); // Track the path of the link that is either hovered or focused

  const getNavLinkClass = ({ isActive }) => isActive ? 'nav-link active' : 'nav-link';

  const getNavLinkStyle = (path) => ({ isActive }) => ({
    textDecoration: 'none',
    fontSize: '0.8rem',
    color: isActive ? 'blue' : hoveredOrFocusedLink === path ? 'green' : 'black',
  });

  const handleMouseEnterOrFocus = (path) => setHoveredOrFocusedLink(path);

  const handleMouseLeaveOrBlur = () => setHoveredOrFocusedLink(null);

  return (
    <nav>
    <div className='header'>
       <h3 id="mainHeader" style={{fontSize: '1rem',  margin: '2rem',   marginLeft: '1rem'}}> <b> </b> SONICTILES </h3>
    </div>
      <ul style={{ listStyleType: 'none', padding: 0, width:'150%' }}>
        {[ '/lab','/sonictiles', '/tiles'].map((path, index) => {
          const labels = [ "User Study", "Final Prototype", "Past Prototype"];
          return (
            <li key={path} style={{ display: 'inline', marginRight: '10px' }}>
              <NavLink 
                id="pixelFont"
                to={path}
                className={getNavLinkClass} 
                style={getNavLinkStyle(path)}
                onMouseEnter={() => handleMouseEnterOrFocus(path)}
                onFocus={() => handleMouseEnterOrFocus(path)} // Add focus handler
                onMouseLeave={handleMouseLeaveOrBlur}
                onBlur={handleMouseLeaveOrBlur} // Add blur handler
              >
                {labels[index]}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Nav;
