import React from 'react';

interface PageHeadersProps {
  title?: string;
  description?: string;
  subdescription?: string;
}

const PageHeaders = ({ title, description, subdescription }: PageHeadersProps) => {
  return (
    <div className="text-center mb-8 md:mb-12 lg:mb-16">
      <h1 className="text-[#131313] text-2xl md:text-3xl lg:text-5xl font-bold mb-2 md:mb-3 lg:mb-4">
        {title}
      </h1>
      <p className="max-w-[90%] md:max-w-[668px] mx-auto text-sm md:text-base text-[#424242] font-normal">
        {description}
      </p>
      <p className="max-w-[90%] md:max-w-[668px] mx-auto text-sm md:text-base text-[#424242] font-normal mt-2 md:mt-3">
        {subdescription}
      </p>
    </div>
  );
};

export default PageHeaders;