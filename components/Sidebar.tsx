
import React from 'react';
import { Feature, FeatureKey } from '../types';

interface IconProps {
  type: Feature['icon'];
  className?: string;
}

const Icon: React.FC<IconProps> = ({ type, className = 'w-6 h-6' }) => {
  // Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  const icons: Record<Feature['icon'], React.ReactElement> = {
    'text-image': <path strokeLinecap="round" strokeLinejoin="round" d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 9l-5 5-5-5M12 14.2V3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    'combine': <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    'style': <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.477 2.387a6 6 0 00.517 3.86l.158.318a6 6 0 00.517 3.86l2.387.477a2 2 0 001.806-.547a2 2 0 00.547-1.806l-.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 00-.517-3.86l-2.387-.477zM11.428 5.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L.05 5.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.477 2.387a6 6 0 00.517 3.86l.158.318a6 6 0 00.517 3.86l2.387.477a2 2 0 001.806-.547a2 2 0 00.547-1.806l-.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 00-.517-3.86l-2.387-.477z" />,
    'script': <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    'hashtag': <path strokeLinecap="round" strokeLinejoin="round"d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />,
    'voice': <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />,
    'image-prompt': <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    'image-image': <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />,
    'storyboard': <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    'background': <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M4 15v5h5M15 4v5h5M15 15v5h5" />,
    'video-prompt': <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />,
    'video': <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {icons[type]}
    </svg>
  );
};

interface SidebarProps {
  features: Feature[];
  activeFeature: FeatureKey;
  setActiveFeature: (feature: FeatureKey) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ features, activeFeature, setActiveFeature, isOpen, setIsOpen }) => {
  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      ></div>

      <aside className={`
        w-64 bg-soft-blue-900 text-soft-blue-50 flex-shrink-0 p-4 font-sans flex flex-col
        fixed md:static top-0 left-0 h-full z-30
        transition-transform transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="flex justify-between items-center mb-8">
          <div className="text-2xl font-bold font-poppins text-center flex-grow">Cavero</div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-soft-blue-200 hover:text-white" aria-label="Close menu">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
          </button>
        </div>
        <nav className="flex-grow">
          <ul>
            {features.map((feature) => (
              <li key={feature.key} className="mb-2">
                <button
                  onClick={() => feature.implemented && setActiveFeature(feature.key)}
                  disabled={!feature.implemented}
                  className={`w-full flex items-center py-2.5 px-4 rounded-lg text-left transition-colors duration-200 ${
                    activeFeature === feature.key
                      ? 'bg-soft-blue-700 text-white'
                      : 'text-soft-blue-200 hover:bg-soft-blue-800 hover:text-white'
                  } ${!feature.implemented ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Icon type={feature.icon} className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">{feature.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="text-xs text-soft-blue-400 text-center mt-4">
          © 2024 Cavero Smart Content
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
