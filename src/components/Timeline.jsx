import React, { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';

const Timeline = ({ currentDay, totalDays, onDayChange }) => {
  const timelineRef = useRef(null);
  const progressRef = useRef(null);
  const markersRef = useRef([]);
  const tooltipRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startDay, setStartDay] = useState(0);
  const [hoverDay, setHoverDay] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  // Update progress bar when currentDay changes
  useEffect(() => {
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        width: `${(currentDay / (totalDays - 1)) * 100}%`,
        duration: 0.5,
        ease: "power2.out"
      });
      
      // Highlight current month marker
      const currentMonth = Math.floor(currentDay / 30);
      markersRef.current.forEach((marker, index) => {
        if (index === currentMonth) {
          gsap.to(marker, { scale: 1.2, opacity: 1, duration: 0.3 });
        } else {
          gsap.to(marker, { scale: 1, opacity: 0.7, duration: 0.3 });
        }
      });
    }
  }, [currentDay, totalDays]);

  // Handle mouse/touch down on timeline
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX || (e.touches && e.touches[0].clientX) || 0);
    setStartDay(currentDay);
    
    // Add event listeners for drag
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
    
    // Visual feedback for drag start
    if (timelineRef.current) {
      gsap.to(timelineRef.current, {
        scale: 1.02,
        duration: 0.2,
        ease: "power1.out"
      });
    }
  };

  // Handle mouse/touch move (dragging)
  const handleMouseMove = (e) => {
    if (!isDragging || !timelineRef.current) return;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const deltaX = clientX - startX;
    const timelineWidth = timelineRef.current.offsetWidth;
    const dayDelta = Math.round((deltaX / timelineWidth) * totalDays);
    let newDay = Math.max(0, Math.min(totalDays - 1, startDay + dayDelta));
    
    onDayChange(newDay);
    
    // Update hover tooltip during drag
    updateTooltip(clientX, newDay);
  };

  // Handle mouse/touch up (end dragging)
  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('touchmove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchend', handleMouseUp);
    
    // Visual feedback for drag end
    if (timelineRef.current) {
      gsap.to(timelineRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "elastic.out(1, 0.5)"
      });
    }
  };

  // Handle click on timeline (direct jump)
  const handleClick = (e) => {
    if (!timelineRef.current || isDragging) return;
    
    // Only handle as click if it wasn't a drag
    if (Math.abs(e.clientX - startX) < 5) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const newDay = Math.floor(clickPosition * totalDays);
      onDayChange(Math.max(0, Math.min(totalDays - 1, newDay)));
      
      // Add click animation
      const clickX = e.clientX - rect.left;
      addClickRipple(clickX);
    }
  };
  
  // Handle mouse hover on timeline
  const handleMouseOver = (e) => {
    if (isDragging || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const hoverPosition = (e.clientX - rect.left) / rect.width;
    const day = Math.floor(hoverPosition * totalDays);
    
    updateTooltip(e.clientX, day);
  };
  
  // Handle mouse leave
  const handleMouseLeave = () => {
    if (!isDragging) {
      setHoverDay(null);
      
      if (tooltipRef.current) {
        gsap.to(tooltipRef.current, {
          opacity: 0,
          duration: 0.2
        });
      }
    }
  };
  
  // Update tooltip position and content
  const updateTooltip = (clientX, day) => {
    setHoverDay(day);
    setHoverPosition({ x: clientX, y: 0 });
    
    if (tooltipRef.current) {
      const tooltipWidth = tooltipRef.current.offsetWidth;
      const xPos = clientX - tooltipWidth / 2;
      
      gsap.to(tooltipRef.current, {
        opacity: 1,
        x: xPos,
        duration: 0.2
      });
    }
  };
  
  // Add ripple effect on click
  const addClickRipple = (x) => {
    // Create ripple element
    const ripple = document.createElement('div');
    ripple.className = 'timeline-ripple';
    ripple.style.left = `${x}px`;
    timelineRef.current.appendChild(ripple);
    
    // Animate and remove
    gsap.to(ripple, {
      scale: 1,
      opacity: 0,
      duration: 0.6,
      onComplete: () => {
        if (timelineRef.current && timelineRef.current.contains(ripple)) {
          timelineRef.current.removeChild(ripple);
        }
      }
    });
  };
  
  // Format date from day number
  const formatDate = (day) => {
    // Simulate a year starting from January 1
    const date = new Date(2023, 0, day + 1);
    return date.toLocaleDateString('cs-CZ', { 
      day: 'numeric', 
      month: 'short'
    });
  };
  
  // Get season based on day
  const getSeason = (day) => {
    const dayFactor = day / totalDays;
    
    if (dayFactor < 0.25) return "jaro";
    if (dayFactor < 0.5) return "léto";
    if (dayFactor < 0.75) return "podzim";
    return "zima";
  };

  return (
    <div className="timeline-container">
      <div 
        className="timeline" 
        ref={timelineRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onClick={handleClick}
        onMouseMove={handleMouseOver}
        onMouseLeave={handleMouseLeave}
      >
        <div className="timeline-progress" ref={progressRef}></div>
        
        {/* Add month markers */}
        {[0, 30, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334].map((day, index) => (
          <div 
            key={index}
            className="timeline-marker"
            ref={el => markersRef.current[index] = el}
            style={{ left: `${(day / (totalDays - 1)) * 100}%` }}
          >
            <span className="timeline-marker-label">
              {['LED', 'ÚNO', 'BŘE', 'DUB', 'KVĚ', 'ČER', 'ČVC', 'SRP', 'ZÁŘ', 'ŘÍJ', 'LIS', 'PRO'][index]}
            </span>
          </div>
        ))}
        
        {/* Season indicators */}
        <div className="timeline-seasons">
          <div className="season spring" style={{ width: '25%', left: '0%' }}>
            <span>Jaro</span>
          </div>
          <div className="season summer" style={{ width: '25%', left: '25%' }}>
            <span>Léto</span>
          </div>
          <div className="season fall" style={{ width: '25%', left: '50%' }}>
            <span>Podzim</span>
          </div>
          <div className="season winter" style={{ width: '25%', left: '75%' }}>
            <span>Zima</span>
          </div>
        </div>
      </div>
      
      {/* Tooltip */}
      {hoverDay !== null && (
        <div 
          className="timeline-tooltip" 
          ref={tooltipRef}
          style={{ left: hoverPosition.x }}
        >
          <div className="tooltip-date">{formatDate(hoverDay)}</div>
          <div className="tooltip-info">Den {hoverDay + 1} / {totalDays}</div>
          <div className="tooltip-season">{getSeason(hoverDay)}</div>
        </div>
      )}
    </div>
  );
};

export default Timeline; 