import React from 'react'
import AboutUsPage from './_components/aboutUs'
import { getPublicPageMetadata } from '@/lib/seo'

export const metadata = getPublicPageMetadata('/about-us')

function page() {
  return (
    <div>
      <AboutUsPage/>
    </div>
  )
}

export default page
