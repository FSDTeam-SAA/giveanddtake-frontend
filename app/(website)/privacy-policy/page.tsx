import PageHeaders from "@/components/shared/PageHeaders";
import { Suspense } from "react";

const page = () => {
  return (
    <div className="w-full px-4 py-8 md:px-6 md:py-12 lg:py-16">
      <div className="container space-y-8">
         <Suspense fallback={null}>
          <PageHeaders title="Privacy Policy" />
        </Suspense>
        {/* <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Privacy Policy
        </h1> */}

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <h2 className="text-2xl font-bold">Overview</h2>
          <p>
            We understand that your privacy is important to you and that you
            care about how your personal data is used and shared online.
          </p>
          <p>
            Elevator Video Pitch Ltd. is registered with the UK Information
            Commissioners Office (ICO) – Reference Number ZB932999.
          </p>
          <p>
            We understand that your privacy is important to you and that you
            care about how your personal data is used and shared online. We
            respect and value the privacy of everyone who visits this website
            www.evpitch.com ("our site") and will only collect and use personal
            data in ways that are described in this Policy, and in a manner that
            is consistent with our obligations and your rights under the General
            Data Protection Regulations 2018 (GDPR) and Data Protection Act 2018
            and other global data privacy regulations.
          </p>
          <p>
            Please read this Privacy Policy carefully and ensure that you
            understand it. Your acceptance of our Privacy Policy is deemed to
            occur upon your first use of our site. If you do not accept and
            agree with this Privacy Policy, you must stop using our site
            immediately.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Definitions and Interpretation</h2>
          <p className="text-gray-700 dark:text-gray-300">
            In this Policy, the following terms shall have the following
            meanings:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
            <li>
              <strong>"Cookie"</strong> means a small text file placed on your
              computer or device through your Internet Browser when you visit
              certain parts of our site and/or when you use certain features of
              our site.
            </li>
            <li>
              <strong>"Cookie Law"</strong> means the relevant parts of the
              Privacy and Electronic Communications Regulations (PECR) 2003.
            </li>
            <li>
              <strong>"Personal data"</strong> means any data that relates to an
              identifiable person who can be directly or indirectly identified
              from that data. In this case, it means personal data that you give
              to us via our site. This definition shall, where applicable,
              incorporate the definitions provided in the Data Protection Act
              2018 or the EU General Data Protection Regulation 2018 ("GDPR").
            </li>
            <li>
              <strong>"We/Us/Our"</strong> means Elevator Video Pitch Ltd., a
              company registered in England at Companies House, registration
              number 15978879.
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Policy Scope</h2>
          <p className="text-gray-700 dark:text-gray-300">
            This Privacy Policy applies only to your use of our site. Our site
            may contain links to other third-party websites e.g., other job
            listing sites. Please note that we have no control over how your
            data is collected, stored, or used by other websites and we advise
            you to check the privacy policies of any such websites before
            providing any data to them.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Your Rights</h2>
          <p className="text-gray-700 dark:text-gray-300">
            As a data subject, you have the following rights under the GDPR,
            which this Policy and our use of personal data have been designed to
            protect:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
            <li>
              The right to be informed about our collection and use of personal
              data.
            </li>
            <li>The right of access to the personal data we hold about you.</li>
            <li>
              The right to rectification of any personal data we hold about you
              that is inaccurate or incomplete.
            </li>
            <li>
              The right to be forgotten – i.e., the right to ask us to delete
              any personal data we hold about you (we only hold your personal
              data for as long as you give us your consent to do so).
            </li>
            <li>
              The right to restrict (i.e. prevent) the processing of your
              personal data.
            </li>
            <li>
              The right to data portability (obtaining a copy of your personal
              data to re-use with another service or organisation).
            </li>
            <li>
              The right to object to us using your personal data for specific
              purposes.
            </li>
            <li>
              Rights with respect to automated decision making and profiling.
            </li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300">
            If you have any cause for complaint about our use of your personal
            data, please contact us using the details provided in section 14 and
            we will do our best to solve the problem for you. If we are unable
            to help, you also have the right to lodge a complaint with the UK's
            information privacy supervisory authority, the Information
            Commissioner's Office.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            For further information about your rights, please contact the
            Information Commissioner's Office at www.ico.com or your local
            Citizens Advice Bureau.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Your Data We Collect</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Depending upon your use of our services once you have signed up as a
            member, we may collect some of the following personal (and
            non-personal) data:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
            <li>Name</li>
            <li>Telephone number</li>
            <li>Country, region and area code</li>
            <li>Job title</li>
            <li>Professional experience</li>
            <li>Education</li>
            <li>
              Contact information such as email addresses and telephone numbers
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">How We Use Your Data</h2>
          <p className="text-gray-700 dark:text-gray-300">
            All personal data is processed and stored securely, for no longer
            than is necessary considering the reason(s) for which it was first
            collected. We will comply with our obligations and always safeguard
            your rights under the UK Data Protection Act 2018 and the EU GDPR
            2018.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Our use of your personal data will always have a lawful basis,
            because it is necessary for our performance of a contract with you,
            because you have consented to our use of your personal data (e.g.,
            by signing up to use our website). Specifically, we may use your
            data for the following purposes:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
            <li>
              Supplying our services to you (please note that we require your
              personal data for you to join as a candidate or recruiter).
            </li>
            <li>Replying to emails received from you.</li>
            <li>
              Third parties (such as recruiters and companies) whose content
              appears on our site may use third party cookies. Please note that
              we do not control the activities of such third parties, nor the
              data they collect and use and advise you to check the privacy
              policies of any such third parties.
            </li>
            <li>
              You have the right to withdraw your consent to us using your
              personal data provided to us on our site at any time, and to
              request that we delete it.
            </li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300">
            We do not keep your personal data for any longer than is necessary
            considering the reason(s) for which it was first collected. Data
            will therefore be deleted on the following basis:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
            <li>
              If you would like your personal data and profile to be deleted,
              you could delete your account, and final deletion would take place
              automatically after 30 days. Please note that 'deactivation' would
              not result in a final deletion of your account.
            </li>
            <li>
              You could also send an email to info@elevatorvideopitch.com or via
              our contact form to request the deletion of your data. Once a
              request to delete your data has been received, Elevator Video
              Pitch recordings and resumes deletion would be completed within 30
              days, and if this cannot be done, we will request an extension to
              do so within the GDPR mandated time limits.
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">
            How and Where We Store Your Data
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            We only keep your personal data for as long as you provide us with
            consent to retain this.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Your data will only be stored within the European Economic Area
            including the UK or ("the EEA") (The EEA consists of all EU member
            states, plus Norway, Iceland, and Liechtenstein). None of your data
            will be stored outside of the European Economic Area ("the EEA").
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            You are deemed to accept and agree to the above by using our site
            and submitting information to us.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Data security is very important to us, and we have taken suitable
            measures to safeguard and secure data collected through our site,
            including to only ask for the minimal data required for us to
            provide you with our services.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Security</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We have security safeguards in place to protect the personal
            information that we hold on your behalf and recognise the importance
            of maintaining the security of your personal information. Elevator
            Video Pitch will always use our best efforts to keep your personal
            information safe. Elevator Video Pitch is not responsible for any
            breach of security by any third parties.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Sharing of Your Data</h2>
          <p className="text-gray-700 dark:text-gray-300">
            In certain circumstances, we may be legally required to share
            certain data held by us, which may include your personal data, for
            example, where we are involved in legal proceedings, where we are
            complying with legal obligations, a court order, or a governmental
            authority.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            We will not sell your data to a third-party.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Accessing Your Data</h2>
          <p className="text-gray-700 dark:text-gray-300">
            You have the right to ask for a copy of any of your personal data
            held by us (where such data is held). Under the GDPR and UK DPA, no
            fee is payable, and we will provide all information in response to
            your request free of charge. Please contact us for more details at
            info@elevatorvidepitch.com or using the contact form on our website.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Use of Cookies</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We use cookies on this site. By using our site, you may receive
            cookies on your computer or device. Cookies are used on our site to
            track browsing history.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            You can choose to enable or disable cookies in your internet
            browser. Most internet browsers also enable you to choose whether
            you wish to disable all cookies or only third-party cookies. By
            default, most internet browsers accept cookies, but this can be
            changed. For further details, please consult the help menu in your
            internet browser or the documentation that came with your device.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            You can choose to delete cookies on your computer or device at any
            time to enhance your privacy and security; however, you may lose any
            information that enables you to access third party websites more
            quickly and efficiently including, but not limited to, logging in
            and personalisation settings.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            It is recommended that you keep your internet browser and operating
            system up-to-date and that you consult the help and guidance
            provided by the developer of your internet browser and manufacturer
            of your computer or device if you are unsure about adjusting your
            privacy settings.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Contacting Us</h2>
          <p className="text-gray-700 dark:text-gray-300">
            If you have any questions about our site or this Privacy Policy,
            please contact us by email at info@elevatorvideopitch.com or through
            our contact form. Please ensure that your query is clear,
            particularly if it is a request for information about the data we
            hold about you.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Changes to Our Privacy Policy</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We may change this Privacy Policy from time to time (for example, if
            the law changes). Any changes will be immediately posted on our
            site, and you will be deemed to have accepted the terms of the
            Privacy Policy on your first use of our site following the
            alterations. We recommend that you check this page regularly to keep
            up to date.
          </p>
        </div>
      </div>
    </div>
  );
};

export default page;
