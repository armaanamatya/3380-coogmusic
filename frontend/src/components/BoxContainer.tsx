import React, { type ReactNode } from 'react';

interface BoxContainerProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const BoxContainer: React.FC<BoxContainerProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-bold text-red-700 mb-4">{title}</h3>
      <div className="overflow-x-hidden px-2">
        <div className="flex flex-row gap-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BoxContainer;