import React from 'react';
import { notFound } from 'next/navigation';
import { BlogDetailsClient } from './_components/BlogDetailsClient ';

export default function Page({ params }: { params: { id: string } }) {
  if (!params.id) {
    notFound(); // Handle missing ID
  }

  return (
    <div>
      <BlogDetailsClient id={params.id} />
    </div>
  );
}