export const setupSidebarScroll = (sidebarRef, contentRef) => {
    const addEventListeners = () => {
      if (sidebarRef.current && contentRef.current) {
        sidebarRef.current.addEventListener('mouseenter', handleMouseEnter);
        sidebarRef.current.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('wheel', handleWheel, { passive: false });
      }
    };
  
    const removeEventListeners = () => {
      if (sidebarRef.current && contentRef.current) {
        sidebarRef.current.removeEventListener('mouseenter', handleMouseEnter);
        sidebarRef.current.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('wheel', handleWheel);
      }
    };
  
    const handleMouseEnter = () => {
      if (contentRef.current) {
        contentRef.current.classList.add('show-scrollbar');
      }
    };
  
    const handleMouseLeave = () => {
      if (contentRef.current) {
        contentRef.current.classList.remove('show-scrollbar');
      }
    };
  
    const handleWheel = (event) => {
      if (sidebarRef.current && contentRef.current && sidebarRef.current.contains(event.target)) {
        event.preventDefault();
        contentRef.current.scrollTop += event.deltaY;
      }
    };
  
    return { addEventListeners, removeEventListeners };
  };