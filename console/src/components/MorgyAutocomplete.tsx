import React, { useState, useEffect, useRef } from 'react';
import './MorgyAutocomplete.css';

interface Morgy {
  id: string;
  name: string;
  fullName: string;
  handle: string;
  image: string;
  color: string;
}

const MORGYS: Morgy[] = [
  {
    id: 'bill',
    name: 'Bill',
    fullName: 'Bill the Marketing Hog',
    handle: '@billthemarketinghog',
    image: '/morgys/bill.png',
    color: '#00ffff'
  },
  {
    id: 'sally',
    name: 'Sally',
    fullName: 'Sally the Promo Pig',
    handle: '@sallythepromo',
    image: '/morgys/sally.png',
    color: '#ff00ff'
  },
  {
    id: 'professor',
    name: 'Prof. Hogsworth',
    fullName: 'Prof. Hogsworth the Research Expert',
    handle: '@profhogsworth',
    image: '/morgys/professor.png',
    color: '#ff6600'
  }
];

interface MorgyAutocompleteProps {
  inputValue: string;
  onSelect: (handle: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
}

export const MorgyAutocomplete: React.FC<MorgyAutocompleteProps> = ({
  inputValue,
  onSelect,
  inputRef,
  isVisible,
  onVisibilityChange
}) => {
  const [filteredMorgys, setFilteredMorgys] = useState<Morgy[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if we should show autocomplete
    const atIndex = inputValue.lastIndexOf('@');
    
    if (atIndex === -1) {
      onVisibilityChange(false);
      return;
    }

    // Get the text after the @
    const searchText = inputValue.slice(atIndex + 1).toLowerCase();
    
    // Check if there's a space after the @ (means mention is complete)
    if (searchText.includes(' ')) {
      onVisibilityChange(false);
      return;
    }

    // Filter morgys based on search text
    const matches = MORGYS.filter(morgy => 
      morgy.name.toLowerCase().startsWith(searchText) ||
      morgy.handle.toLowerCase().includes(searchText) ||
      morgy.fullName.toLowerCase().includes(searchText)
    );

    if (matches.length > 0) {
      setFilteredMorgys(matches);
      setSelectedIndex(0);
      onVisibilityChange(true);

      // Calculate position based on input element
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setPosition({
          top: rect.top - (matches.length * 60) - 10,
          left: rect.left
        });
      }
    } else {
      onVisibilityChange(false);
    }
  }, [inputValue, inputRef, onVisibilityChange]);

  const handleSelect = (morgy: Morgy) => {
    // Replace the @search with the full handle
    const atIndex = inputValue.lastIndexOf('@');
    const newValue = inputValue.slice(0, atIndex) + morgy.handle + ' ';
    onSelect(newValue);
    onVisibilityChange(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredMorgys.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredMorgys.length - 1
          );
          break;
        case 'Enter':
        case 'Tab':
          if (filteredMorgys.length > 0) {
            e.preventDefault();
            handleSelect(filteredMorgys[selectedIndex]);
          }
          break;
        case 'Escape':
          onVisibilityChange(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, filteredMorgys, selectedIndex, onVisibilityChange, handleSelect]);

  if (!isVisible || filteredMorgys.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="morgy-autocomplete"
      style={{
        position: 'fixed',
        bottom: '80px',
        left: position.left,
        zIndex: 1000
      }}
    >
      <div className="autocomplete-header">
        <span className="autocomplete-icon">🐷</span>
        <span>Mention a Morgy</span>
      </div>
      {filteredMorgys.map((morgy, index) => (
        <div
          key={morgy.id}
          className={`autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => handleSelect(morgy)}
          onMouseEnter={() => setSelectedIndex(index)}
          style={{ borderLeftColor: morgy.color }}
        >
          <img src={morgy.image} alt={morgy.name} className="autocomplete-avatar" />
          <div className="autocomplete-info">
            <span className="autocomplete-name">{morgy.fullName}</span>
            <span className="autocomplete-handle" style={{ color: morgy.color }}>{morgy.handle}</span>
          </div>
        </div>
      ))}
      <div className="autocomplete-hint">
        <span>↑↓ to navigate</span>
        <span>↵ to select</span>
        <span>esc to dismiss</span>
      </div>
    </div>
  );
};

export default MorgyAutocomplete;
