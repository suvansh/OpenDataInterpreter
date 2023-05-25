import React from 'react';
import Tooltip from './Tooltip';

const ModeButtons = ({ selectedOption, onOptionChange, options, tooltipContent }) => {
  const handleChange = (event) => {
    onOptionChange(event.target.value);
  };

  return (
    <div>
      {options.map((option, index) => {
        const value = typeof option === 'string' ? option : option.value;
        const name = typeof option === 'string' ? option : option.name;
        return (
          <label key={index} className="mode-button text-gray-700 dark:text-gray-200">
            <input
              type="radio"
              name={name}
              value={value}
              checked={selectedOption === value}
              onChange={handleChange}
            />
            {name}
          </label>
        )
      })}
      <Tooltip content={tooltipContent} />
    </div>
  );
};

export default ModeButtons;
