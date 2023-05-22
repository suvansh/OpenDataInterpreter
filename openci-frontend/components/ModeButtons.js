import React from 'react';
import Tooltip from './Tooltip';

const ModeButtons = ({mode, onModeChange}) => {
  const handleChange = (event) => {
    onModeChange(event.target.value);
  };

  return (
    <div>
      <label className="mode-button text-gray-700 dark:text-gray-200">
        <input
          type="radio"
          name="GPT-3.5"
          value="GPT-3.5"
          checked={mode === 'GPT-3.5'}
          onChange={handleChange}
        />
        GPT-3.5
      </label>
      <label className="mode-button text-gray-700 dark:text-gray-200">
        <input
          type="radio"
          name="GPT-4"
          value="GPT-4"
          checked={mode === 'GPT-4'}
          onChange={handleChange}
        />
        GPT-4
      </label>
      <Tooltip content={ <>GPT-3.5 is ~5x faster than GPT-4, but less reliable.</> } />
    </div>
  );
};

export default ModeButtons;