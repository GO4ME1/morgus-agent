// Privacy Policy Page for Morgus
import { Link } from 'react-router-dom';
import './Legal.css';

export function Privacy() {
  return (
    <div className="legal-container">
      <div className="legal-card">
        <Link to="/" className="legal-back">← Back to Morgus</Link>
        
        <div className="legal-header">
          <div className="legal-logo">
            <span className="logo-icon">🐷</span>
            <span className="logo-text">Morgus</span>
          </div>
          <h1>Privacy Policy</h1>
          <p className="legal-updated">Last updated: December 20, 2025</p>
        </div>

        <div className="legal-content">
          <section>
            <h2>1. Introduction</h2>
            <p>
              At Morgus, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
              disclose, and safeguard your information when you use our AI assistant service.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Information You Provide</h3>
            <ul>
              <li><strong>Account Information:</strong> Email address, display name, and password when you create an account</li>
              <li><strong>Conversation Data:</strong> Messages, prompts, and content you share with Morgus</li>
              <li><strong>Uploaded Files:</strong> Documents, images, and other files you upload for processing</li>
              <li><strong>Payment Information:</strong> Billing details for paid subscriptions (processed by our payment provider)</li>
            </ul>

            <h3>2.2 Information Collected Automatically</h3>
            <ul>
              <li><strong>Usage Data:</strong> Features used, session duration, and interaction patterns</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
              <li><strong>Log Data:</strong> IP address, access times, and referring URLs</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul>
              <li>Provide, maintain, and improve the Service</li>
              <li>Process your requests and deliver AI-generated responses</li>
              <li>Personalize your experience</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send important notices and updates</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="highlight-section">
            <h2>4. Training Data & The "Don't Train on Me" Option</h2>
            <p>
              <strong>🐍 Your Choice Matters:</strong> By default, your conversations may be used to improve 
              Morgus's capabilities for all users. However, you have full control over this.
            </p>
            
            <h3>4.1 Default Behavior (Training Enabled)</h3>
            <p>When training is enabled, we may use your conversations to:</p>
            <ul>
              <li>Improve AI response quality and accuracy</li>
              <li>Develop new features and capabilities</li>
              <li>Train and fine-tune our models</li>
            </ul>

            <h3>4.2 "Don't Train on Me" Mode</h3>
            <p>When you enable the "Don't Train on Me" toggle:</p>
            <ul>
              <li>Your conversations will NOT be used for model training</li>
              <li>Your data will only be used to provide the Service</li>
              <li>Conversations may still be temporarily stored for service delivery</li>
            </ul>

            <h3>4.3 What We NEVER Use for Training</h3>
            <p>Regardless of your settings, we NEVER store or use:</p>
            <ul>
              <li>Passwords or authentication credentials</li>
              <li>Credit card numbers or payment details</li>
              <li>Social Security numbers or government IDs</li>
              <li>Health information (PHI/HIPAA data)</li>
              <li>Content explicitly marked as confidential</li>
            </ul>
          </section>

          <section>
            <h2>5. Data Sharing and Disclosure</h2>
            <p>We may share your information with:</p>
            
            <h3>5.1 Service Providers</h3>
            <p>
              Third-party vendors who assist in operating our Service, including cloud hosting providers, 
              payment processors, and analytics services.
            </p>

            <h3>5.2 AI Model Providers</h3>
            <p>
              We use third-party AI models (such as OpenAI, Google, and Anthropic) to process your requests. 
              These providers have their own privacy policies and data handling practices.
            </p>

            <h3>5.3 Legal Requirements</h3>
            <p>
              We may disclose information if required by law, court order, or government request, or to 
              protect our rights, property, or safety.
            </p>

            <h3>5.4 Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, or sale of assets, your information may be transferred 
              as part of that transaction.
            </p>
          </section>

          <section>
            <h2>6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your information, including:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and audits</li>
              <li>Access controls and authentication requirements</li>
              <li>Employee training on data protection</li>
            </ul>
            <p>
              However, no method of transmission over the Internet is 100% secure. We cannot guarantee 
              absolute security of your data.
            </p>
          </section>

          <section>
            <h2>7. Data Retention</h2>
            <p>We retain your information for as long as:</p>
            <ul>
              <li>Your account is active</li>
              <li>Needed to provide you with the Service</li>
              <li>Required by law or for legitimate business purposes</li>
            </ul>
            <p>
              You can request deletion of your account and associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2>8. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
              <li><strong>Opt-out:</strong> Opt out of training data usage via the "Don't Train on Me" toggle</li>
            </ul>
          </section>

          <section>
            <h2>9. Children's Privacy</h2>
            <p>
              The Service is not intended for children under 13 years of age. We do not knowingly collect 
              personal information from children under 13. If you believe we have collected such information, 
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2>10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place for such transfers in compliance with 
              applicable data protection laws.
            </p>
          </section>

          <section>
            <h2>11. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to maintain your session, remember your preferences, 
              and analyze usage patterns. You can control cookie settings through your browser.
            </p>
          </section>

          <section>
            <h2>12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes 
              via email or through the Service. Your continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2>13. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <p className="contact-info">
              <strong>Email:</strong> privacy@morgus.ai<br />
              <strong>Website:</strong> https://morgus.ai
            </p>
          </section>

          <section>
            <h2>14. California Privacy Rights (CCPA)</h2>
            <p>
              California residents have additional rights under the California Consumer Privacy Act (CCPA), 
              including the right to know what personal information is collected and the right to opt out 
              of the sale of personal information. We do not sell your personal information.
            </p>
          </section>

          <section>
            <h2>15. European Privacy Rights (GDPR)</h2>
            <p>
              If you are in the European Economic Area (EEA), you have rights under the General Data 
              Protection Regulation (GDPR), including the right to lodge a complaint with a supervisory authority.
            </p>
          </section>
        </div>

        <div className="legal-footer">
          <Link to="/terms">Terms of Service</Link>
          <span>•</span>
          <Link to="/">Return to Morgus</Link>
        </div>
      </div>
    </div>
  );
}
