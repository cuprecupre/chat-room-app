import React from 'react';
import { Link } from 'react-router-dom';

export function PrivacyPolicyEN() {
    return (
        <div className="prose prose-invert prose-neutral max-w-none space-y-8">
            <p className="text-neutral-400 text-lg">
                Last updated: January 2026
            </p>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">1. Data Controller</h2>
                <p className="text-neutral-300 leading-relaxed">
                    The data controller responsible for the data collected on this website is:
                </p>
                <ul className="text-neutral-300 space-y-2 list-disc list-inside">
                    <li><strong>Name:</strong> Leandro Vegas</li>
                    <li><strong>Website:</strong> impostor.me</li>
                    <li><strong>Contact Email:</strong> elimpostorjuego@gmail.com</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">2. Data We Collect</h2>
                <p className="text-neutral-300 leading-relaxed">
                    We collect the following types of data:
                </p>
                <ul className="text-neutral-300 space-y-2 list-disc list-inside">
                    <li><strong>Account Data:</strong> Username, email (if you log in with Google), or chosen name (if playing as a guest).</li>
                    <li><strong>Usage Data:</strong> Information about how you interact with the game (matches played, in-game actions).</li>
                    <li><strong>Technical Data:</strong> IP address, browser type, device, and operating system.</li>
                    <li><strong>Cookies:</strong> We use first-party and third-party cookies. See our <Link to="/en/cookies" className="text-orange-400 hover:text-orange-300 underline">Cookie Policy</Link> for more information.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">3. Purpose of Processing</h2>
                <p className="text-neutral-300 leading-relaxed">
                    We use your data to:
                </p>
                <ul className="text-neutral-300 space-y-2 list-disc list-inside">
                    <li>Allow you to play and keep your session active.</li>
                    <li>Improve the game experience and fix bugs.</li>
                    <li>Analyze website usage through analytics tools.</li>
                    <li>Show personalized advertising (with your consent).</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">4. Legal Basis</h2>
                <p className="text-neutral-300 leading-relaxed">
                    The processing of your data is based on:
                </p>
                <ul className="text-neutral-300 space-y-2 list-disc list-inside">
                    <li><strong>Service Execution:</strong> To allow you to play, we need to process certain data.</li>
                    <li><strong>Consent:</strong> For analytics and advertising cookies, we request your prior consent.</li>
                    <li><strong>Legitimate Interest:</strong> To improve our service and ensure security.</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">5. Third Parties and Transfers</h2>
                <p className="text-neutral-300 leading-relaxed">
                    We use third-party services that may process your data:
                </p>
                <ul className="text-neutral-300 space-y-2 list-disc list-inside">
                    <li><strong>Google Firebase:</strong> For authentication and database (United States).</li>
                    <li><strong>Google Analytics:</strong> For web analytics (United States).</li>
                    <li><strong>Google AdSense:</strong> To display advertising (United States).</li>
                </ul>
                <p className="text-neutral-300 leading-relaxed">
                    These providers comply with the necessary guarantees for international data transfers according to GDPR.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">6. Data Retention</h2>
                <p className="text-neutral-300 leading-relaxed">
                    We retain your data while your account is active or as necessary to provide the service.
                    Match data is automatically deleted after completion.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">7. Your Rights</h2>
                <p className="text-neutral-300 leading-relaxed">
                    You have the right to:
                </p>
                <ul className="text-neutral-300 space-y-2 list-disc list-inside">
                    <li><strong>Access:</strong> Request information about the data we hold about you.</li>
                    <li><strong>Rectification:</strong> Correct inaccurate data.</li>
                    <li><strong>Deletion:</strong> Request the deletion of your data.</li>
                    <li><strong>Objection:</strong> Object to the processing of your data.</li>
                    <li><strong>Portability:</strong> Receive your data in a structured format.</li>
                    <li><strong>Withdraw Consent:</strong> You can withdraw your consent at any time.</li>
                </ul>
                <p className="text-neutral-300 leading-relaxed">
                    To exercise these rights, contact us at: <a href="mailto:elimpostorjuego@gmail.com" className="text-orange-400 hover:text-orange-300 underline">elimpostorjuego@gmail.com</a>
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">8. Changes to This Policy</h2>
                <p className="text-neutral-300 leading-relaxed">
                    We may update this policy occasionally. We will notify you of significant changes
                    via a notice on the website.
                </p>
            </section>
        </div>
    );
}
