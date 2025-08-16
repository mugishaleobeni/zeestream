import React from 'react';
import { Helmet } from 'react-helmet-async';

const Policy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Zeestream</title>
        <meta name="description" content="Zeestream Privacy Policy and Terms of Service" />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy & Terms</h1>
          
          <div className="space-y-8">
            {/* Privacy Policy */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Privacy Policy</h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="text-foreground font-medium">Last updated: {new Date().toLocaleDateString()}</p>
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Information We Collect</h3>
                  <p>
                    We collect information you provide directly to us, such as when you create an account, 
                    interact with movies (likes, comments), or contact us for support.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">How We Use Your Information</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>To provide and maintain our streaming service</li>
                    <li>To personalize your movie recommendations</li>
                    <li>To respond to your comments and questions</li>
                    <li>To send you technical notices and support messages</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Data Security</h3>
                  <p>
                    We use Firebase Authentication and Firestore for secure data storage. Your personal 
                    information is encrypted and protected using industry-standard security measures.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Third-Party Services</h3>
                  <p>
                    We use Google Firebase for authentication and data storage, and Google Gemini AI 
                    for our chat assistant. These services have their own privacy policies.
                  </p>
                </div>
              </div>
            </section>

            {/* Terms of Service */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Terms of Service</h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Acceptance of Terms</h3>
                  <p>
                    By accessing and using Zeestream, you accept and agree to be bound by the terms 
                    and provision of this agreement.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Use License</h3>
                  <p>
                    Permission is granted to temporarily stream movies for personal, non-commercial 
                    use only. This is the grant of a license, not a transfer of title.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">User Accounts</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>You are responsible for maintaining the confidentiality of your account</li>
                    <li>You must provide accurate and complete information</li>
                    <li>You are responsible for all activities under your account</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Prohibited Uses</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Commercial redistribution of content</li>
                    <li>Attempting to download content without permission</li>
                    <li>Using automated systems to access the service</li>
                    <li>Posting offensive or inappropriate comments</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Content Disclaimer</h3>
                  <p>
                    The materials on Zeestream are provided on an 'as is' basis. Zeestream makes no 
                    warranties, expressed or implied, and hereby disclaims all warranties including 
                    without limitation, implied warranties of merchantability.
                  </p>
                </div>
              </div>
            </section>

            {/* Cookie Policy */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Cookie Policy</h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">What Are Cookies</h3>
                  <p>
                    Cookies are small text files that are stored on your device when you visit our website. 
                    They help us provide you with a better experience.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">How We Use Cookies</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>To keep you signed in to your account</li>
                    <li>To remember your preferences and settings</li>
                    <li>To analyze how you use our service</li>
                    <li>To provide personalized recommendations</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Managing Cookies</h3>
                  <p>
                    You can control cookies through your browser settings. However, disabling cookies 
                    may affect the functionality of our service.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="bg-card p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-2">Questions?</h2>
              <p className="text-muted-foreground">
                If you have any questions about these policies, please contact us at{' '}
                <a href="mailto:legal@zeestream.com" className="text-primary hover:underline">
                  legal@zeestream.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Policy;