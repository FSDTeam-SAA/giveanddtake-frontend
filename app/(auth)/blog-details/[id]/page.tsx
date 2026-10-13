import { BlogDetailsClient } from "@/app/(website)/blogs/[id]/_components/BlogDetailsClient ";
import { getBlogMetadata } from "@/lib/blog-metadata";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getBlogMetadata(id);
}

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BlogDetailsClient slugOrId={id} />;
}
