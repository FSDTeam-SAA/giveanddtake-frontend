import { BlogDetailsClient } from "@/components/BlogDetailsClient "

 


export default async function BlogDetailsPage({ params }: { params: { id: string } }) {


  return (
   
    <BlogDetailsClient id={params.id} />
  )
}
