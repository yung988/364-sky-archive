import React, { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';

const Timeline = ({ currentDay, totalDays, onDayChange }) => {
  const timelineRef = useRef(null);
  const progressRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startDay, setStartDay] = useState(0);

  // Update progress bar when currentDay changes
  useEffect(() => {
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        width: `${(currentDay / (totalDays - 1)) * 100}%`,
        duration: 0.5,
        ease: "power2.out"
      });
    }
  }, [currentDay, totalDays]);

  // Handle mouse/touch down on timeline
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX || (e.touches && e.touches[0].clientX) || 0);
    setStartDay(currentDay);
    
    // Add event listeners for drag
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);
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
  };

  // Handle mouse/touch up (end dragging)
  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('touchmove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchend', handleMouseUp);
  };

  // Handle click on timeline (direct jump)
  const handleClick = (e) => {
    if (!timelineRef.current) return;
    
    // Only handle as click if it wasn't a drag
    if (Math.abs(e.clientX - startX) < 5) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const newDay = Math.floor(clickPosition * totalDays);
      onDayChange(Math.max(0, Math.min(totalDays - 1, newDay)));
    }
  };

  return (
    <div 
      className="timeline" 
      ref={timelineRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onClick={handleClick}
    >
      <div className="timeline-progress" ref={progressRef}></div>
      
      {/* Add month markers */}
      {[0, 30, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334].map((day, index) => (
        <div 
          key={index}
          className="timeline-marker"
          style={{ left: `${(day / (totalDays - 1)) * 100}%` }}
        >
          <span className="timeline-marker-label">
            {['LED', 'ÚNO', 'BŘE', 'DUB', 'KVĚ', 'ČER', 'ČVC', 'SRP', 'ZÁŘ', 'ŘÍJ', 'LIS', 'PRO'][index]}
          </span>
        </div>
      ))}
    </div>
  );
};

export default Timeline; 