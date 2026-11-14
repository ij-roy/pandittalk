import { LegalPage } from '../../components/LegalPage';

export function ContactUs() {
  return (
    <LegalPage title="Contact Us">
      <p>
        We're here to help. If you have any questions, concerns, or requests
        regarding PanditTalk, our services, your account, payments, or your
        personal data, please reach out to us using the details below.
      </p>

      <h2>Customer Support</h2>
      <ul>
        <li>
          <strong>Email:</strong>{' '}
          <a href="mailto:support@pandittalk.com">support@pandittalk.com</a>
        </li>
        <li>
          <strong>Website:</strong>{' '}
          <a href="https://www.pandittalk.com" target="_blank" rel="noreferrer">
            https://www.pandittalk.com
          </a>
        </li>
      </ul>
      <p>
        For refund-related queries, please include your registered mobile number,
        booking ID, and the date and time of the consultation so we can assist you
        faster.
      </p>

      <h2>Registered Office</h2>
      <p>
        PanditTalk
        <br />
        FLAT NO.-33, GROUND FLOOR SECTOR-16 PKT F-7, ROHINI,
        <br />
        North West Delhi, Delhi, India 110089
      </p>

      <h2>Data Protection & Grievances</h2>
      <p>
        In accordance with the Digital Personal Data Protection Act, 2023, you may
        contact our Grievance Officer for any concerns relating to the processing
        of your personal data:
      </p>
      <ul>
        <li>
          <strong>Name:</strong> VEDANT AGARWAL
        </li>
        <li>
          <strong>Designation:</strong> Grievance Officer
        </li>
        <li>
          <strong>Email:</strong>{' '}
          <a href="mailto:grievance@pandittalk.com">grievance@pandittalk.com</a>
        </li>
        <li>
          <strong>Phone:</strong> +91 8076702201
        </li>
        <li>
          <strong>Postal Address:</strong> A-1603, HERITAGE ONE, ULLHAWAS SECTOR
          62, GURGAON, HARYANA, GURGAON HR 122001, INDIA
        </li>
      </ul>

      <h2>Account Deletion</h2>
      <p>
        You may permanently delete your account at any time from within the app
        (Profile → Settings → Delete Account). If you are unable to access your
        account, email us at{' '}
        <a href="mailto:support@pandittalk.com">support@pandittalk.com</a> to
        request deletion.
      </p>
    </LegalPage>
  );
}
