import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        debug: true,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        resources: {
            en: {
                translation: {
                    welcome: "Make your partner's wishes come true",
                    get_started: "Get Started",
                    subtitle: "Create, share, and fulfill wishes in a space designed for connection and love.",
                    greeting: "Good Morning,",
                    search_placeholder: "Search your wishes...",
                    cat_all: "All",
                    cat_beauty: "Beauty",
                    cat_fashion: "Fashion",
                    cat_home: "Home",
                    cat_tech: "Tech",
                    cat_books: "Books",
                    // Onboarding
                    onboarding_step1_title: "About You",
                    onboarding_step1_desc: "Let's start with your details.",
                    name_label: "Your Name",
                    name_placeholder: "e.g. Sarah",
                    dob_label: "Date of Birth",
                    onboarding_step2_title: "Important Dates",
                    onboarding_step2_desc: "Anniversaries, birthdays, or special moments.",
                    date_title_placeholder: "Link Title (e.g. Anniversary)",
                    add_date: "Add another date",
                    onboarding_step3_title: "Your Partner",
                    onboarding_step3_desc: "Who are we inviting to join you?",
                    partner_name_label: "Partner's Name",
                    partner_name_placeholder: "e.g. David",
                    message_label: "Personal Message",
                    message_placeholder: "Write something sweet to invite them...",
                    onboarding_step4_title: "Invitation Ready!",
                    onboarding_step4_desc: "Share this link with your partner to connect.",
                    copy_link: "Copy Link",
                    skip_dashboard: "Go to Dashboard",
                    create_invite: "Create Invitation",
                    next: "Next",
                    my_birthday: "My Birthday",
                    auto_birthday_hint: "We automatically added your birthday!",
                    msg_sugg_1: "I can't wait to share my dreams with you!",
                    msg_sugg_2: "Let's build our wishlist together.",
                    msg_sugg_3: "You're the only one I want to share this with.",
                    copied: "Copied!",

                    // Gift Management
                    my_wishlist: "My Wishlist",
                    our_wishlist: "Our Wishlist",
                    add_gift: "Add Gift",
                    paste_link: "Paste a product link...",
                    fetching_data: "Fetching details...",
                    gift_title: "Gift Name",
                    price: "Price",
                    mark_purchased: "Mark as Purchased",
                    purchased: "Purchased",
                    available: "Available",
                    gift_added: "Gift added successfully!",
                    error_scraping: "Couldn't fetch details. Please fill manually.",
                    delete_confirm: "Delete this gift?",

                    // Profile
                    profile_title: "My Profile",
                    full_name: "Full Name",
                    birth_date: "Birth Date",
                    notifications_title: "Notifications",
                    push_notifications: "Push Notifications",
                    push_notifications_desc: "Get notified when partner adds a wish or completes one.",
                    share_title: "Share My Wishes",
                    share_button: "Share My List",
                    share_desc: "Anyone with the link can view your list.",
                    partner_manage: "Partner Connection",
                    connected_with: "Connected with",
                    disconnect: "Disconnect Partner",
                    disconnect_confirm: "Are you sure you want to disconnect? You won't see their wishlist anymore.",
                    invite_partner: "Invite Partner",
                    invite_desc: "Send this link to connect accounts:",
                    create_invite_link: "Create Invite Link",
                    save_changes: "Save Changes",
                    profile_updated: "Profile updated successfully!",
                    language_settings: "Language Settings",
                    select_language: "Select Language",

                    // Partner Dashboard
                    days_left: "Days Left",
                    hours_left: "Hours",
                    event_today: "It's Today! 🎉",
                    no_upcoming_events: "No upcoming events",

                    purchased_msg: "Great choice! We won't tell them. 🤫",
                    welcome_back: "Welcome back,",
                    top5_title: "Top 5 Favorites",
                    top5_desc: "Rank your most wanted gifts",
                    top5_section_title: "Your Top 5",
                    add_from_wishlist: "Add from Wishlist",
                    drag_instruction: "Drag to reorder",

                    most_wanted: "Most Wanted",
                    // Install Prompt
                    install_title: "Install WishU",
                    install_desc_android: "Add to home screen for quick access",
                    install_desc_ios: "Add WishU to your home screen for quick sharing and notifications.",
                    install_ios_instruction: "Tap Share and select 'Add to Home Screen'",
                    install_button: "Install Now",
                    install_android_manual: "Tap the menu icon (⋮) and select 'Add to Home screen'",
                    close: "Close"
                }
            },
            he: {
                translation: {
                    welcome: "הגשימו את המשאלות של בן/בת הזוג שלכם",
                    get_started: "התחילו עכשיו",
                    subtitle: "צרו, שתפו והגשימו משאלות במרחב המעוצב לחיבור ואהבה.",
                    greeting: "בוקר טוב,",
                    search_placeholder: "חפשו משאלות...",
                    cat_all: "הכל",
                    cat_beauty: "טיפוח",
                    cat_fashion: "אופנה",
                    cat_home: "בית",
                    cat_tech: "טכנולוגיה",
                    cat_books: "ספרים",
                    // Onboarding
                    onboarding_step1_title: "קצת עלייך",
                    onboarding_step1_desc: "נתחיל עם הפרטים שלך.",
                    name_label: "השם שלך",
                    name_placeholder: "לדוגמה: שרה",
                    dob_label: "תאריך לידה",
                    onboarding_step2_title: "תאריכים חשובים",
                    onboarding_step2_desc: "ימי נישואין, ימי הולדת או רגעים מיוחדים.",
                    date_title_placeholder: "כותרת (למשל: יום השנה)",
                    add_date: "הוסף תאריך נוסף",
                    onboarding_step3_title: "הפרטנר שלך",
                    onboarding_step3_desc: "את מי נזמין להצטרף?",
                    partner_name_label: "שם הפרטנר",
                    partner_name_placeholder: "לדוגמה: דיוויד",
                    message_label: "הודעה אישית",
                    message_placeholder: "כתבי משהו מתוק להזמנה...",
                    onboarding_step4_title: "ההזמנה מוכנה!",
                    onboarding_step4_desc: "שתפי את הקישור עם הפרטנר כדי להתחבר.",
                    copy_link: "העתק קישור",
                    skip_dashboard: "מעבר ללוח הבקרה",
                    create_invite: "צור הזמנה",
                    next: "הבא",
                    my_birthday: "יום ההולדת שלי",
                    auto_birthday_hint: "הוספנו אוטומטית את יום ההולדת שלך!",
                    msg_sugg_1: "לא יכולה לחכות להגשים חלומות איתך!",
                    msg_sugg_2: "בוא נבנה את רשימת המשאלות שלנו ביחד.",
                    msg_sugg_3: "אתה היחיד שאני רוצה לשתף איתו את זה.",
                    copied: "הועתק!",

                    // Gift Management
                    my_wishlist: "המשאלות שלי",
                    our_wishlist: "המשאלות שלנו",
                    add_gift: "הוסף מתנה",
                    paste_link: "הדבק קישור למוצר...",
                    fetching_data: "מושך פרטים...",
                    gift_title: "שם המתנה",
                    price: "מחיר",
                    mark_purchased: "סמן כנרכש",
                    purchased: "נרכש",
                    available: "זמין",
                    gift_added: "המתנה נוספה בהצלחה!",
                    error_scraping: "לא הצלחנו למשוך פרטים. נא למלא ידנית.",
                    delete_confirm: "למחוק את המתנה?",

                    // Profile
                    profile_title: "הפרופיל שלי",
                    full_name: "שם מלא",
                    birth_date: "תאריך לידה",
                    notifications_title: "התראות",
                    push_notifications: "התראות פוש",
                    push_notifications_desc: "קבל עדכון כשנוספת משאלה או כשמשהו נרכש.",
                    share_title: "שתף את המשאלות",
                    share_button: "שתף את הרשימה שלי",
                    share_desc: "כל מי שיש לו את הקישור יכול לצפות ברשימה.",
                    partner_manage: "חיבור זוגי",
                    connected_with: "מחובר עם",
                    disconnect: "נתק חיבור",
                    disconnect_confirm: "בטוח שברצונך להתנתק? לא תוכל/י לראות יותר את המשאלות שלהם.",
                    invite_partner: "הזמן פרטנר",
                    invite_desc: "שלח/י את הקישור לחיבור החשבונות:",
                    create_invite_link: "צור קישור להזמנה",
                    save_changes: "שמור שינויים",
                    profile_updated: "הפרופיל עודכן בהצלחה!",
                    language_settings: "שפה",
                    select_language: "בחר שפה",

                    // Partner Dashboard
                    days_left: "ימים נותרו",
                    hours_left: "שעות",
                    event_today: "זה קורה היום! 🎉",
                    no_upcoming_events: "אין אירועים קרובים",
                    top5_title: "Top 5 Favorites",
                    top5_desc: "Rank your most wanted gifts",
                    top5_section_title: "Your Top 5",
                    add_from_wishlist: "Add from Wishlist",
                    drag_instruction: "Drag to reorder",
                    most_wanted: "Most Wanted",
                    purchased_msg: "בחירה מעולה! לא נגלה להם. 🤫",
                    welcome_back: "כיף שחזרת,",
                    // Install Prompt
                    install_title: "התקנת WishU",
                    install_desc_android: "הוסיפי למסך הבית לגישה מהירה",
                    install_desc_ios: "הוסיפי את WishU למסך הבית כדי ליהנות משיתוף מהיר והתראות.",
                    install_ios_instruction: "לחצי על שתף ובחרי 'הוספה למסך הבית'",
                    install_button: "התקני עכשיו",
                    install_android_manual: "לחצי על תפריט הדפדפן (⋮) ובחרי 'הוספה למסך הבית'",
                    close: "סגור"
                }
            }
        }
    });

// Handle Direction Change
i18n.on('languageChanged', (lng) => {
    document.documentElement.dir = i18n.dir(lng);
    document.documentElement.lang = lng;
});

export default i18n;
