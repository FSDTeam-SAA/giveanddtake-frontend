import React from 'react';
import { notFound } from 'next/navigation';
import { BlogDetailsClient } from './_components/BlogDetailsClient ';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    notFound(); // Handle missing ID
  }

  return (
    <div>
      <BlogDetailsClient slugOrId={id} />
    </div>
  );
}
