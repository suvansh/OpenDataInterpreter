import React from 'react';

const Tooltip = ({ content }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleTooltip = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="tooltip" onClick={toggleTooltip}>
      <span className="questionMark">?</span>
      {isOpen && <div className="tooltipText text-left">{content}</div>}
    </div>
  );
};

export default Tooltip;