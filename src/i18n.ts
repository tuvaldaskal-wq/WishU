import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        debug: false,
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
                    upcoming_event: "Upcoming Event",
                    check_wishlist: "Check out the wishlist below to find the perfect gift! 🎁",
                    // Install Prompt
                    install_title: "Install WishU",
                    install_desc_android: "Add to home screen for quick access",
                    install_desc_ios: "Add WishU to your home screen for quick sharing and notifications.",
                    install_ios_instruction: "Tap Share and select 'Add to Home Screen'",
                    install_button: "Install Now",
                    install_android_manual: "Tap the menu icon (⋮) and select 'Add to Home screen'",
                    close: "Close",

                    // Profile page
                    log_out: "Log Out",
                    error_updating_profile: "Error updating profile",
                    error_select_image: "Please select an image file",
                    error_image_too_large: "Image too large. Max 5MB allowed.",
                    success_photo_updated: "Profile photo updated!",
                    error_upload_photo: "Failed to upload photo. Please try again.",
                    section_other_dates: "Other Important Dates",
                    date_type_birthday: "Birthday",
                    date_type_anniversary: "Anniversary",
                    date_type_other: "Other",
                    success_date_added: "Date added! It will appear on your calendar.",
                    section_notification_prefs: "Notification Preferences",
                    first_reminder: "First Reminder",
                    followup_reminder: "Follow-up Reminder",

                    // Gifts
                    edit_gift: "Edit Gift",
                    upload_image: "Upload image",
                    who_can_see: "Who can see this?",
                    visibility_only_me: "Only Me",
                    visibility_friends: "Friends",
                    visibility_everyone: "Everyone",
                    price_required: "Price is required",
                    error_adding_gift: "Error adding gift",
                    error_updating_gift: "Error updating gift",
                    searching_price: "🔍 Searching for price...",
                    still_searching: "⏳ Still searching... You can update details manually below.",
                    price_found: "✅ Price found",
                    error_gift_not_found: "Gift Not Found",
                    view_in_store: "View in Store",
                    go_back: "Go Back",
                    priceless: "Priceless",
                    close_wish: "Close Wish",
                    mark_as_bought: "Mark as Bought",
                    bought_by_someone: "Bought by someone",
                    marked_as_bought: "Marked as Bought",

                    // Friends
                    friend_requests: "Friend Requests",
                    find_new_friends: "Find New Friends",
                    wants_to_connect: "Wants to connect",
                    connect: "Connect",
                    request_sent: "Request Sent",
                    invite: "Invite",
                    invite_friends: "Invite Friends",
                    no_friends_yet: "No friends yet",
                    hint_add_friends: "Search for people above or invite them to join WishU!",
                    tap_to_see_wishlist: "Tap to see wishlist",
                    searching: "Searching...",
                    group_label: "Group",

                    // Notifications
                    notifications: "Notifications",
                    no_notifications: "No notifications yet",

                    // Calendar
                    no_upcoming_events_hint: "Add friends or ask them to set their birthday!",
                    find_friends: "Find Friends",

                    // Top 5
                    top5_page_subtitle: "Rank your most wanted gifts for your partner to see.",
                    top5_drag_hint: "Drag or add gifts here",
                    placeholder_search_gifts: "Search gifts...",
                    no_gifts_found: "No gifts found.",
                    max_top5_reached: "You can only have 5 top wishes! Remove one first.",

                    // Greeting
                    send_greeting: "Send Greeting",
                    write_wish_placeholder: "Write your personal wish...",
                    ai_magic: "AI Magic",
                    uploading: "Uploading...",
                    greeting_not_found: "Greeting not found or has been deleted.",
                    message_from: "Message From",

                    // Extra gift keys
                    error_gift_purchased_by_other: "This gift was marked as purchased by someone else.",
                    error_deleting_gift: "Error deleting gift",
                    unknown_gift: "Unknown Gift",
                    paste_link_above: "Paste a link above",
                    link: "Link",

                    // Calendar
                    days: "Days",
                    no_events_found: "No upcoming events found.",

                    // Friends
                    your_friends_count: "Your Friends ({{count}})",
                    no_users_found: "No users found matching \"{{query}}\"",
                    try_different_search: "Try a different name or email",

                    // Groups (display labels — values stay in English for Firestore)
                    group_friends: "Friends",
                    group_family: "Family",
                    group_partner: "Partner",
                    group_work: "Work",
                    group_other: "Other",

                    // Profile
                    add_date_reminder: "Don't forget to click 'Save Changes' to save your dates!",

                    // Reminder timing options
                    reminder_1month: "1 month before",
                    reminder_2weeks: "2 weeks before",
                    reminder_1week: "1 week before",
                    reminder_3days: "3 days before",
                    reminder_1day: "1 day before",
                    reminder_on_day: "On the day of",
                    reminder_none: "None"
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
                    top5_title: "5 המועדפים",
                    top5_desc: "דרגי את המתנות הכי רצויות",
                    top5_section_title: "ה-5 המובילים שלך",
                    add_from_wishlist: "הוסיפי מהרשימה",
                    drag_instruction: "גררי לסידור מחדש",
                    most_wanted: "הכי רצוי",
                    upcoming_event: "אירוע קרוב",
                    check_wishlist: "בדקי את רשימת המשאלות למטה למציאת המתנה המושלמת! 🎁",
                    purchased_msg: "בחירה מעולה! לא נגלה להם. 🤫",
                    welcome_back: "כיף שחזרת,",
                    // Install Prompt
                    install_title: "התקנת WishU",
                    install_desc_android: "הוסיפי למסך הבית לגישה מהירה",
                    install_desc_ios: "הוסיפי את WishU למסך הבית כדי ליהנות משיתוף מהיר והתראות.",
                    install_ios_instruction: "לחצי על שתף ובחרי 'הוספה למסך הבית'",
                    install_button: "התקני עכשיו",
                    install_android_manual: "לחצי על תפריט הדפדפן (⋮) ובחרי 'הוספה למסך הבית'",
                    close: "סגור",

                    // Profile page
                    log_out: "התנתקות",
                    error_updating_profile: "שגיאה בעדכון הפרופיל",
                    error_select_image: "נא לבחור קובץ תמונה",
                    error_image_too_large: "התמונה גדולה מדי. מקסימום 5MB.",
                    success_photo_updated: "תמונת הפרופיל עודכנה!",
                    error_upload_photo: "העלאת התמונה נכשלה. נסי שוב.",
                    section_other_dates: "תאריכים חשובים נוספים",
                    date_type_birthday: "יום הולדת",
                    date_type_anniversary: "יום נישואין",
                    date_type_other: "אחר",
                    success_date_added: "התאריך נוסף! הוא יופיע ביומן שלך.",
                    section_notification_prefs: "העדפות התראות",
                    first_reminder: "תזכורת ראשונה",
                    followup_reminder: "תזכורת מעקב",

                    // Gifts
                    edit_gift: "עריכת מתנה",
                    upload_image: "העלאת תמונה",
                    who_can_see: "מי יכול לראות את זה?",
                    visibility_only_me: "רק אני",
                    visibility_friends: "חברים",
                    visibility_everyone: "כולם",
                    price_required: "מחיר הוא שדה חובה",
                    error_adding_gift: "שגיאה בהוספת המתנה",
                    error_updating_gift: "שגיאה בעדכון המתנה",
                    searching_price: "🔍 מחפש מחיר...",
                    still_searching: "⏳ עדיין מחפש... ניתן להוסיף פרטים ידנית בינתיים.",
                    price_found: "✅ מחיר נמצא",
                    error_gift_not_found: "המתנה לא נמצאה",
                    view_in_store: "צפייה בחנות",
                    go_back: "חזרה",
                    priceless: "אין מחיר",
                    close_wish: "סגירת משאלה",
                    mark_as_bought: "סמן כנרכש",
                    bought_by_someone: "נרכש על ידי מישהו",
                    marked_as_bought: "סומן כנרכש",

                    // Friends
                    friend_requests: "בקשות חברות",
                    find_new_friends: "מצא חברים חדשים",
                    wants_to_connect: "רוצה להתחבר",
                    connect: "התחבר",
                    request_sent: "בקשה נשלחה",
                    invite: "הזמן",
                    invite_friends: "הזמן חברים",
                    no_friends_yet: "אין חברים עדיין",
                    hint_add_friends: "חפשי אנשים למעלה או הזמיני אותם להצטרף ל-WishU!",
                    tap_to_see_wishlist: "לחץ לצפייה ברשימה",
                    searching: "מחפש...",
                    group_label: "קבוצה",

                    // Notifications
                    notifications: "התראות",
                    no_notifications: "אין התראות עדיין",

                    // Calendar
                    no_upcoming_events_hint: "הוסיפי חברים או בקשי מהם להגדיר את יום ההולדת שלהם!",
                    find_friends: "מצא חברים",

                    // Top 5
                    top5_page_subtitle: "דרגי את המתנות הכי רצויות כדי שהפרטנר שלך יראה.",
                    top5_drag_hint: "גרור או הוסף מתנות כאן",
                    placeholder_search_gifts: "חיפוש מתנות...",
                    no_gifts_found: "לא נמצאו מתנות.",
                    max_top5_reached: "אפשר להוסיף רק 5 משאלות! הסירי אחת קודם.",

                    // Greeting
                    send_greeting: "שלח ברכה",
                    write_wish_placeholder: "כתבי את ברכתך האישית...",
                    ai_magic: "קסם AI",
                    uploading: "מעלה...",
                    greeting_not_found: "הברכה לא נמצאה או שנמחקה.",
                    message_from: "הודעה מאת",

                    // Extra gift keys
                    error_gift_purchased_by_other: "מתנה זו סומנה כנרכשת על ידי מישהו אחר.",
                    error_deleting_gift: "שגיאה במחיקת המתנה",
                    unknown_gift: "מתנה לא ידועה",
                    paste_link_above: "הדבק קישור למעלה",
                    link: "קישור",

                    // Calendar
                    days: "ימים",
                    no_events_found: "לא נמצאו אירועים קרובים.",

                    // Friends
                    your_friends_count: "החברים שלך ({{count}})",
                    no_users_found: "לא נמצאו משתמשים בשם \"{{query}}\"",
                    try_different_search: "נסה שם או אימייל אחר",

                    // Groups (display labels)
                    group_friends: "חברים",
                    group_family: "משפחה",
                    group_partner: "פרטנר",
                    group_work: "עבודה",
                    group_other: "אחר",

                    // Profile
                    add_date_reminder: "אל תשכחי ללחוץ על 'שמור שינויים' כדי לשמור את התאריכים!",

                    // Reminder timing options
                    reminder_1month: "חודש לפני",
                    reminder_2weeks: "שבועיים לפני",
                    reminder_1week: "שבוע לפני",
                    reminder_3days: "3 ימים לפני",
                    reminder_1day: "יום לפני",
                    reminder_on_day: "ביום עצמו",
                    reminder_none: "ללא"
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
