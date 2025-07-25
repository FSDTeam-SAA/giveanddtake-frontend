import React from 'react'
interface PageHeadersProps {
  title?: string;    
  description?: string;
  subdiscription?: string;
}

const PageHeaders = ({title, description,subdiscription}: PageHeadersProps) => {
  return (
   <div className="text-center mb-16">
          <h1 className="text-[#131313] texxt-[30px] md:text-[48px] font-bold  mb-4">{title}</h1>
           <p className='w-[668px] text-center mx-auto text-base text-[#424242] font-normal'>{description}</p>
           <p className='w-[668px] text-center mx-auto text-base text-[#424242] font-normal'>{subdiscription}</p>
        </div>
  )
}

export default PageHeaders