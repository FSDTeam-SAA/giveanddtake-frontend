import PageHeaders from '@/components/shared/PageHeaders'
import React from 'react'

const page = () => {
  return (
    <div className="w-full px-4 py-8 md:px-6 md:py-12 lg:py-16">
      <div className="container  space-y-8">
        <PageHeaders title="Privacy Policy" description='Lorem ipsum is a dummy or placeholder text commonly used in graphic design, publishing, and web development.'/>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Privacy Policy</h1>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <p>
            We value and respect your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
            your personal information when you visit our website [yourwebsite.com] or make a purchase from us.
          </p>
          <p>
            By using our website, you agree to the practices described in this Privacy Policy. Please read it carefully
            to understand our views and practices regarding your personal data.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Information We Collect</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We collect various types of information to provide and improve our auction services, including:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
            <li>
              <strong>Personal Information:</strong> When you register for an account, place a bid, or use certain
              features on our Site, we may collect your name, email address, phone number, billing address, shipping
              address, and payment details.
            </li>
            <li>
              <strong>Transaction Information:</strong> We collect details of your bidding activity, including bids
              placed, items purchased, and payment history.
            </li>
            <li>
              <strong>Usage Data:</strong> We collect information about your interactions with the Site, including IP
              address, browser type, device type, pages visited, and time spent on the Site. This helps us improve your
              user experience and optimize our services.
            </li>
            <li>
              <strong>Cookies and Tracking Technologies:</strong> We use cookies, web beacons, and other tracking
              technologies to enhance your experience and collect information about how you use our Site.
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">How We Use Your Information</h2>
          <p className="text-gray-700 dark:text-gray-300">We use the information we collect to:</p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
            <li>
              Provide and manage the auction services, including processing bids, managing payments, and shipping
              orders.
            </li>
            <li>Communicate with you about your account, bids, and purchases.</li>
            <li>Respond to customer service inquiries and resolve any issues.</li>
            <li>Personalize your experience on our Site and recommend relevant products or auctions.</li>
            <li>Analyze and improve the performance and functionality of the Site.</li>
            <li>Ensure compliance with our terms of service, legal obligations, and prevent fraud.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">How We Share Your Information</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We may share your personal information in the following situations:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
            <li>
              <strong>Service Providers:</strong> We may share your data with trusted third-party service providers who
              assist us in operating the Site, processing payments, and fulfilling orders. These providers are required
              to use your data solely for the purpose of providing services to us.
            </li>
            <li>
              <strong>Legal Requirements:</strong> We may disclose your personal information if required to do so by law
              or in response to valid requests by public authorities (e.g., a court or government agency).
            </li>
            <li>
              <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your
              personal information may be transferred as part of the transaction.
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Data Security</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We take the security of your personal information seriously and use industry-standard security measures to
            protect it. However, no data transmission over the internet is completely secure, and we cannot guarantee
            the absolute security of your information.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Your Data Rights</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Depending on your location, you may have certain rights regarding your personal data, including:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
            <li>The right to access the personal information we hold about you.</li>
            <li>The right to correct any inaccuracies in your personal information.</li>
            <li>The right to delete your personal information, subject to legal and contractual obligations.</li>
            <li>The right to withdraw consent where we process data based on consent.</li>
            <li>The right to opt-out of marketing communications.</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300">
            If you wish to exercise any of these rights, please contact us at [contact@yourwebsite.com].
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Data Retention</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We retain your personal information for as long as necessary to provide services, comply with legal
            obligations, and resolve disputes. Once your data is no longer needed, we will securely delete or anonymize
            it.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Cookies</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We use cookies to enhance your browsing experience. A cookie is a small file stored on your device that
            helps us remember your preferences, analyze Site usage, and improve functionality. You can control cookies
            through your browser settings, but disabling cookies may affect your ability to use certain features of the
            Site.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Children&apos;s Privacy</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Our Site is not intended for children under the age of 13, and we do not knowingly collect personal
            information from children. If we become aware that we have inadvertently collected personal information from
            a child under 13, we will take steps to delete that information.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Changes to This Privacy Policy</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We may update this Privacy Policy from time to time. Any changes will be posted on this page, and the
            &quot;Effective Date&quot; at the top will be updated. We encourage you to review this policy periodically
            to stay informed about how we protect your information.
          </p>
        </div>
      </div>
    </div>
  )
}

export default page