import React from 'react';
import BackButton from "@/components/ui/back-button";

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-mint-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <BackButton />
          </div>
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-hero font-bold text-mint-900 mb-6">Terms of Service</h1>
            <div className="w-24 h-1 bg-mint-400 mx-auto rounded-full"></div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-body text-mint-700 mb-8">
                These Terms of Service govern your use of the website located at https://csogo.org/ and any related services provided by CSOgo.
              </p>

              <p className="text-body text-mint-700 mb-8">
                By accessing https://csogo.org/, you agree to abide by these Terms of Service and to comply with all applicable laws and regulations. If you do not agree with these Terms of Service, you are prohibited from using or accessing this website or using any other services provided by CSOgo.
              </p>

              <p className="text-body text-mint-700 mb-8">
                We, CSOgo, reserve the right to review and amend any of these Terms of Service at our sole discretion. Upon doing so, we will update this page. Any changes to these Terms of Service will take effect immediately from the date of publication.
              </p>

              <p className="text-body text-mint-700 mb-8">
                <strong>These Terms of Service were last updated on 28 October 2025.</strong>
              </p>

              <section className="space-y-6">
                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">Limitations of use</h2>
                  <p className="text-body text-mint-700 mb-4">
                    By using this website, you warrant on behalf of yourself, your users, and other parties you represent that you will not:
                  </p>
                  <ul className="list-disc ml-6 space-y-2 text-body text-mint-700 mb-4">
                    <li>modify, copy, prepare derivative works of, decompile, or reverse engineer any materials and software contained on this website;</li>
                    <li>remove any copyright or other proprietary notations from any materials and software on this website;</li>
                    <li>transfer the materials to another person or "mirror" the materials on any other server;</li>
                    <li>knowingly or negligently use this website or any of its associated services in a way that abuses or disrupts our networks or any other service CSOgo provides;</li>
                    <li>use this website or its associated services to transmit or publish any harassing, indecent, obscene, fraudulent, or unlawful material;</li>
                    <li>use this website or its associated services in violation of any applicable laws or regulations;</li>
                    <li>use this website in conjunction with sending unauthorised advertising or spam;</li>
                    <li>harvest, collect, or gather user data without the user's consent; or</li>
                    <li>use this website or its associated services in such a way that may infringe the privacy, intellectual property rights, or other rights of third parties.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">Intellectual property</h2>
                  <p className="text-body text-mint-700 mb-4">
                    The intellectual property in the materials contained in this website are owned by or licensed to CSOgo and are protected by applicable copyright and trademark law. We grant our users permission to download one copy of the materials for personal, non-commercial transitory use.
                  </p>
                  <p className="text-body text-mint-700 mb-4">
                    This constitutes the grant of a licence, not a transfer of title. This licence shall automatically terminate if you violate any of these restrictions or the Terms of Service, and may be terminated by CSOgo at any time.
                  </p>
                </div>

                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">User-generated content</h2>
                  <p className="text-body text-mint-700 mb-4">
                    You retain your intellectual property ownership rights over content you submit to us for publication on our website. We will never claim ownership of your content, but we do require a licence from you in order to use it.
                  </p>
                  <p className="text-body text-mint-700 mb-4">
                    When you use our website or its associated services to post, upload, share, or otherwise transmit content covered by intellectual property rights, you grant to us a non-exclusive, royalty-free, transferable, sub-licensable, worldwide license to use, distribute, modify, run, copy, publicly display, translate, or otherwise create derivative works of your content in a manner that is consistent with your privacy preferences and our Privacy Policy.
                  </p>
                  <p className="text-body text-mint-700 mb-4">
                    The licence you grant us can be terminated at any time by deleting your content or account. However, to the extent that we (or our partners) have used your content in connection with commercial or sponsored content, the licence will continue until the relevant commercial or post has been discontinued by us.
                  </p>
                  <p className="text-body text-mint-700 mb-4">
                    You give us permission to use your username and other identifying information associated with your account in a manner that is consistent with your privacy preferences and our Privacy Policy.
                  </p>
                </div>

                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">Liability</h2>
                  <p className="text-body text-mint-700 mb-4">
                    Our website and the materials on our website are provided on an 'as is' basis. To the extent permitted by law, CSOgo makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property, or other violation of rights.
                  </p>
                  <p className="text-body text-mint-700 mb-4">
                    In no event shall CSOgo or its suppliers be liable for any consequential loss suffered or incurred by you or any third party arising from the use or inability to use this website or the materials on this website, even if CSOgo or an authorised representative has been notified, orally or in writing, of the possibility of such damage.
                  </p>
                  <p className="text-body text-mint-700 mb-4">
                    In the context of this agreement, "consequential loss" includes any consequential loss, indirect loss, real or anticipated loss of profit, loss of benefit, loss of revenue, loss of business, loss of goodwill, loss of opportunity, loss of savings, loss of reputation, loss of use and/or loss or corruption of data, whether under statute, contract, equity, tort (including negligence), indemnity or otherwise.
                  </p>
                  <p className="text-body text-mint-700 mb-4">
                    Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.
                  </p>
                </div>

                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">Accuracy of materials</h2>
                  <p className="text-body text-mint-700 mb-4">
                    The materials appearing on our website are not comprehensive and are for general information purposes only. CSOgo does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on this website, or otherwise relating to such materials or on any resources linked to this website.
                  </p>
                </div>

                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">Links</h2>
                  <p className="text-body text-mint-700 mb-4">
                    CSOgo has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement, approval or control by CSOgo of the site. Use of any such linked site is at your own risk and we strongly advise you make your own investigations with respect to the suitability of those sites.
                  </p>
                </div>

                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">Right to terminate</h2>
                  <p className="text-body text-mint-700 mb-4">
                    We may suspend or terminate your right to use our website and terminate these Terms of Service immediately upon written notice to you for any breach of these Terms of Service.
                  </p>
                </div>

                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">Severance</h2>
                  <p className="text-body text-mint-700 mb-4">
                    Any term of these Terms of Service which is wholly or partially void or unenforceable is severed to the extent that it is void or unenforceable. The validity of the remainder of these Terms of Service is not affected.
                  </p>
                </div>

                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">Governing law</h2>
                  <p className="text-body text-mint-700 mb-4">
                    These Terms of Service are governed by and construed in accordance with the laws of Trinidad and Tobago. You irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 