import React, { useState } from 'react';

import { NavLink } from 'react-router-dom';

const Nav = () => {
  const [hoveredOrFocusedLink, setHoveredOrFocusedLink] = useState(null); // Track the path of the link that is either hovered or focused

  const getNavLinkClass = ({ isActive }) => isActive ? 'nav-link active' : 'nav-link';

  // Adjust getNavLinkStyle to check if the current link is the one being hovered or focused
  const getNavLinkStyle = (path) => ({ isActive }) => ({
    textDecoration: 'none',
    color: isActive ? 'blue' : hoveredOrFocusedLink === path ? 'green' : 'black',
  });

  // Handle mouse enter and focus events similarly
  const handleMouseEnterOrFocus = (path) => setHoveredOrFocusedLink(path);

  // Handle mouse leave and blur events to remove styles
  const handleMouseLeaveOrBlur = () => setHoveredOrFocusedLink(null);

  return (
    <nav>
    <div className='header'>
       <h3> <b style={{fontSize: '2rem',  paddingRight: '2px'}}>&#127912; </b>  Tactile Graphics Image Editor</h3>
    </div>
      <ul style={{ listStyleType: 'none', padding: 0, width:'150%' }}>
        {['/instructions', '/main'].map((path, index) => {
          // Determine the label dynamically
          const labels = [ "Instructions", "SoniPrompt Editor"];
          return (
            <li key={path} style={{ display: 'inline', marginRight: '10px' }}>
              <NavLink 
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
