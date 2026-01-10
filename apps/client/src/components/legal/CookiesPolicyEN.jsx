import React from 'react';
import { Link } from 'react-router-dom';

export function CookiesPolicyEN() {
    return (
        <div className="prose prose-invert prose-neutral max-w-none space-y-8">
            <p className="text-neutral-400 text-lg">
                Last updated: January 2026
            </p>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">What are cookies?</h2>
                <p className="text-neutral-300 leading-relaxed">
                    Cookies are small text files that are stored on your device when you visit a website.
                    They allow us to remember your preferences and improve your browsing experience.
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">Cookies we use</h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-neutral-700">
                                <th className="py-3 px-4 text-neutral-300 font-medium">Cookie</th>
                                <th className="py-3 px-4 text-neutral-300 font-medium">Type</th>
                                <th className="py-3 px-4 text-neutral-300 font-medium">Duration</th>
                                <th className="py-3 px-4 text-neutral-300 font-medium">Purpose</th>
                            </tr>
                        </thead>
                        <tbody className="text-neutral-400">
                            <tr className="border-b border-neutral-800">
                                <td className="py-3 px-4">cookie_consent</td>
                                <td className="py-3 px-4">Necessary</td>
                                <td className="py-3 px-4">1 year</td>
                                <td className="py-3 px-4">Remember your cookie preference</td>
                            </tr>
                            <tr className="border-b border-neutral-800">
                                <td className="py-3 px-4">Firebase Auth</td>
                                <td className="py-3 px-4">Necessary</td>
                                <td className="py-3 px-4">Session</td>
                                <td className="py-3 px-4">Maintain your game session</td>
                            </tr>
                            <tr className="border-b border-neutral-800">
                                <td className="py-3 px-4">_ga, _gid, SL_*</td>
                                <td className="py-3 px-4">Analytics</td>
                                <td className="py-3 px-4">2 years</td>
                                <td className="py-3 px-4">Google Analytics, Smartlook - Usage statistics</td>
                            </tr>
                            <tr className="border-b border-neutral-800">
                                <td className="py-3 px-4">_gcl_au</td>
                                <td className="py-3 px-4">Advertising</td>
                                <td className="py-3 px-4">3 months</td>
                                <td className="py-3 px-4">Google AdSense - Advertising</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">Types of cookies</h2>

                <div className="space-y-4">
                    <div className="bg-neutral-900 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-white mb-2">🔒 Necessary Cookies</h3>
                        <p className="text-neutral-400 text-sm">
                            Essential for game operation. They do not require consent
                            and cannot be disabled.
                        </p>
                    </div>

                    <div className="bg-neutral-900 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-white mb-2">📊 Analytics Cookies</h3>
                        <p className="text-neutral-400 text-sm">
                            Help us understand how you use the game to improve it.
                            You can reject them without affecting functionality.
                        </p>
                    </div>

                    <div className="bg-neutral-900 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-white mb-2">📢 Advertising Cookies</h3>
                        <p className="text-neutral-400 text-sm">
                            Allow showing relevant ads. If you reject them, you will still see
                            ads but they will be less personalized.
                        </p>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">Manage your preferences</h2>
                <p className="text-neutral-300 leading-relaxed">
                    You can change your cookie preferences at any time. To do so:
                </p>
                <ul className="text-neutral-300 space-y-2 list-disc list-inside">
                    <li>Clear your browser cookies and revisit the page.</li>
                    <li>Configure your browser to reject third-party cookies.</li>
                </ul>
                <p className="text-neutral-300 leading-relaxed mt-4">
                    You can also manage your Google personalized ad preference at: {' '}
                    <a
                        href="https://adssettings.google.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:text-orange-300 underline"
                    >
                        Google Ad Settings
                    </a>
                </p>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-serif text-orange-400">More information</h2>
                <p className="text-neutral-300 leading-relaxed">
                    For more information on how we handle your data, see our {' '}
                    <Link to="/en/privacy" className="text-orange-400 hover:text-orange-300 underline">
                        Privacy Policy
                    </Link>.
                </p>
                <p className="text-neutral-300 leading-relaxed">
                    If you have questions, contact us at: {' '}
                    <a href="mailto:elimpostorjuego@gmail.com" className="text-orange-400 hover:text-orange-300 underline">
                        elimpostorjuego@gmail.com
                    </a>
                </p>
            </section>
        </div>
    );
}
