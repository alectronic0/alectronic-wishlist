// Cookie Consent and Google Analytics setup
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'functionality_storage': 'denied',
    'personalization_storage': 'denied',
    'security_storage': 'granted'
});

gtag('js', new Date());
gtag('config', 'G-N4Q5KJSLNK', {
    'url_passthrough': true,
    'ads_data_redaction': true
});

// Load GTAG
const gtagScript = document.createElement('script');
gtagScript.async = true;
gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=G-N4Q5KJSLNK";
document.head.appendChild(gtagScript);

// Load Vanilla CookieConsent CSS
const ccCss = document.createElement('link');
ccCss.rel = "stylesheet";
ccCss.href = "https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.0.1/dist/cookieconsent.css";
document.head.appendChild(ccCss);

// Load Vanilla CookieConsent JS and initialize
const ccJs = document.createElement('script');
ccJs.src = "https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.0.1/dist/cookieconsent.umd.js";
ccJs.onload = function() {
    CookieConsent.run({
        categories: {
            necessary: { enabled: true, readOnly: true },
            analytics: {}
        },
        language: {
            default: "en",
            translations: {
                en: {
                    consentModal: {
                        title: "We use cookies",
                        description: "This website uses essential cookies to ensure its proper operation and tracking cookies to understand how you interact with it.",
                        acceptAllBtn: "Accept all",
                        acceptNecessaryBtn: "Reject all",
                        showPreferencesBtn: "Manage preferences"
                    },
                    preferencesModal: {
                        title: "Cookie Preferences",
                        acceptAllBtn: "Accept all",
                        acceptNecessaryBtn: "Reject all",
                        savePreferencesBtn: "Save preferences",
                        closeIconLabel: "Close",
                        sections: [
                            {
                                title: "Strictly Necessary Cookies",
                                description: "These cookies are essential for the proper functioning of the website.",
                                linkedCategory: "necessary"
                            },
                            {
                                title: "Analytics Cookies",
                                description: "These cookies collect information about how you use the website.",
                                linkedCategory: "analytics"
                            }
                        ]
                    }
                }
            }
        },
        onConsent: function() {
            if (CookieConsent.acceptedCategory('analytics')) {
                gtag('consent', 'update', { 'analytics_storage': 'granted' });
            }
        },
        onChange: function({changedCategories}) {
            if (changedCategories.includes('analytics')) {
                if (CookieConsent.acceptedCategory('analytics')) {
                    gtag('consent', 'update', { 'analytics_storage': 'granted' });
                } else {
                    gtag('consent', 'update', { 'analytics_storage': 'denied' });
                }
            }
        }
    });
};
document.head.appendChild(ccJs);
