import React from 'react'; 

 

function Logo({ size = 40, showText = true }) { 

  return ( 

    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}> 

      <svg width={size} height={size} viewBox='0 0 100 100' fill='none'> 

        <defs> 

          <linearGradient id='grad1' x1='0%' y1='0%' x2='100%' y2='100%'> 

            <stop offset='0%'   stopColor='#7C3AED'/> 

            <stop offset='50%'  stopColor='#2E6DA4'/> 

            <stop offset='100%' stopColor='#10B981'/> 

          </linearGradient> 

        </defs> 

        <path d='M15 85 L85 15 L55 50 L65 80 Z' fill='url(#grad1)' opacity='0.9'/> 

        <path d='M15 85 L55 50 L40 45 Z'        fill='url(#grad1)' opacity='0.6'/> 

        <path d='M55 50 L85 15 L70 60 Z'        fill='url(#grad1)' opacity='0.4'/> 

        <line x1='15' y1='85' x2='55' y2='50' stroke='white' strokeWidth='1.5' opacity='0.6'/> 

        <line x1='55' y1='50' x2='85' y2='15' stroke='white' strokeWidth='1.5' opacity='0.6'/> 

      </svg> 

      {showText && ( 

        <span style={{ 

          fontSize: size * 0.6, fontWeight:'bold', 

          background:'linear-gradient(135deg, #7C3AED, #2E6DA4, #10B981)', 

          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', 

          fontFamily:'sans-serif' 

        }}>Folium</span> 

      )} 

    </div> 

  ); 

} 

export default Logo; 