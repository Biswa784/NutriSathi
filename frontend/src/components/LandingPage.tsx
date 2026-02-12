import React, { useEffect, useState } from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onNavigateLogin: () => void;
  onNavigateSignup: () => void;
  isAuthenticated: boolean;
  onNavigateDashboard: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  onNavigateLogin, 
  onNavigateSignup, 
  isAuthenticated,
  onNavigateDashboard 
}) => {
  
  // Auto-redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      onNavigateDashboard();
    }
  }, [isAuthenticated, onNavigateDashboard]);

  // Multilanguage: default texts and translation state
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const defaultTexts: Record<string, string> = {
    nav_home: 'Home',
    nav_about: 'About',
    nav_bmi: 'BMI Calc',
    nav_ai: 'AI Planner ✨',
    nav_signin: 'Sign In',
    nav_cta: "Let's Start",
    hero_title_line1: 'Eat Better.',
    hero_title_line2: 'Live Healthier.',
    hero_description: 'Your AI-powered nutrition companion. Get personalized meal plans, track calories, and achieve your health goals with smart recommendations tailored to your body.',
    hero_try_ai: 'Try AI Planner ✨',
    hero_calc_bmi: 'Calculate BMI',
    about_title: 'About NutriSathi',
    about_text: 'Your AI-powered nutrition companion helping you achieve your health goals with personalized meal plans and smart recommendations.',
    bmi_title: 'BMI Calculator',
    bmi_text: 'Calculate your Body Mass Index and get personalized health insights.',
    bmi_get_started: 'Get Started →',
    ai_title: 'AI Meal Planner ✨',
    ai_text: 'Get AI-powered meal recommendations tailored to your dietary preferences and health goals.',
    ai_start: 'Start Planning →',
    footer: '© 2025 NutriSathi. All rights reserved.'
  };

  const [lang, setLang] = useState<string>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});

  // Small built-in fallback translations for Indian languages (used when server-side Google Translate is not configured)
  const fallbackTranslations: Record<string, Record<string, string>> = {
    hi: {
      nav_home: 'होम',
      nav_about: 'के बारे में',
      nav_bmi: 'बीएमआई गणक',
      nav_ai: 'एआई योजनाकार ✨',
      nav_signin: 'साइन इन',
      nav_cta: 'आइए शुरू करें',
      hero_title_line1: 'बेहतर खाएं।',
      hero_title_line2: 'स्वस्थ रहें।',
      hero_description: 'आपका एआई-समर्थित पोषण साथी। व्यक्तिगत भोजन योजनाएँ प्राप्त करें, कैलोरी ट्रैक करें और अपने स्वास्थ्य लक्ष्य हासिल करें।',
      hero_try_ai: 'एआई योजनाकार आज़माएँ ✨',
      hero_calc_bmi: 'बीएमआई गणना',
      about_title: 'न्यूट्रीसाथी के बारे में',
      about_text: 'आपका एआई-समर्थित पोषण साथी जो व्यक्तिगत भोजन योजनाओं और सुझाओं के साथ आपके स्वास्थ्य लक्ष्यों को प्राप्त करने में मदद करता है।',
      bmi_title: 'बीएमआई गणक',
      bmi_text: 'अपना बॉडी मास इंडेक्स (BMI) गणना करें और व्यक्तिगत स्वास्थ्य जानकारी प्राप्त करें।',
      bmi_get_started: 'शुरू करें →',
      ai_title: 'एआई भोजन योजनाकार ✨',
      ai_text: 'अपने आहार वरीयताओं और स्वास्थ्य लक्ष्यों के अनुसार एआई-समर्थित भोजन सुझाव प्राप्त करें।',
      ai_start: 'योजना शुरू करें →',
      footer: '© 2025 NutriSathi. सर्वाधिकार सुरक्षित।'
    },
    bn: {
      nav_home: 'হোম',
      nav_about: 'সম্পর্কে',
      nav_bmi: 'বিএমআই ক্যালকুলেটর',
      nav_ai: 'এআই পরিকল্পক ✨',
      nav_signin: 'সাইন ইন করুন',
      nav_cta: 'আসুন শুরু করি',
      hero_title_line1: 'ভাল খান।',
      hero_title_line2: 'স্বাস্থ্যকর থাকুন।',
      hero_description: 'আপনার এআই-চালিত পুষ্টি সঙ্গী। ব্যক্তিগত খাবার পরিকল্পনা পান, ক্যালোরি ট্র্যাক করুন এবং আপনার স্বাস্থ্য লক্ষ্য অর্জন করুন।',
      hero_try_ai: 'এআই পরিকল্পক চেষ্টা করুন ✨',
      hero_calc_bmi: 'বিএমআই গণনা করুন',
      about_title: 'NutriSathi সম্পর্কে',
      about_text: 'আপনার এআই-চালিত পুষ্টি সঙ্গী যা ব্যক্তিগত খাবার পরিকল্পনা এবং সুপারিশ সহ আপনার স্বাস্থ্য লক্ষ্য অর্জনে সহায়তা করে।',
      bmi_title: 'বিএমআই ক্যালকুলেটর',
      bmi_text: 'আপনার শরীরের ভর সূচক গণনা করুন এবং ব্যক্তিগত স্বাস্থ্য তথ্য পান।',
      bmi_get_started: 'শুরু করুন →',
      ai_title: 'এআই খাবার পরিকল্পক ✨',
      ai_text: 'আপনার খাদ্য পছন্দ এবং স্বাস্থ্য লক্ষ্য অনুযায়ী এআই-চালিত খাবার সুপারিশ পান।',
      ai_start: 'পরিকল্পনা শুরু করুন →',
      footer: '© 2025 NutriSathi. সমস্ত অধিকার সংরক্ষিত।'
    },
    ta: {
      nav_home: 'முகப்பு',
      nav_about: 'பற்றி',
      nav_bmi: 'பிএমআई கணக்கீடு',
      nav_ai: 'AI திட்டமிடுதல் ✨',
      nav_signin: 'உள்நுழைக',
      nav_cta: 'தொடங்குவோம்',
      hero_title_line1: 'நன்றாக சாப்பிடுங்கள்.',
      hero_title_line2: 'ஆரோக்கியமாக வாழுங்கள்.',
      hero_description: 'உங்களின் AI-இயக்கிய ஊட்டச்சத்து நண்பர். ஆளுமையான உணவு திட்டங்கள் பெறுங்கள், கலோரிகளை ட்ராக்க செய்யுங்கள் மற்றும் உங்கள் ஆரோக்கிய இலக்குகளை அடையுங்கள்.',
      hero_try_ai: 'AI திட்டமிடுதல் முயற்சி செய்யுங்கள் ✨',
      hero_calc_bmi: 'பிஎம்ஐ கணக்கீடு',
      about_title: 'NutriSathi பற்றி',
      about_text: 'உங்களின் AI-இயக்கிய ஊட்டச்சத்து நண்பர் ஆளுமையான உணவு திட்டங்கள் மற்றும் பரிந்துரைகளுடன் உங்கள் ஆரோக்கிய இலக்குகளை அடையுங்கள்.',
      bmi_title: 'பிএমআई கணக்கீடு',
      bmi_text: 'உங்கள் உடல் நிறை குறியீட்டைக் கணக்கிட்டு ஆளுமையான ஆரோக்கிய தகவல்களைப் பெறுங்கள்.',
      bmi_get_started: 'தொடங்குக →',
      ai_title: 'AI உணவு திட்டமிடுதல் ✨',
      ai_text: 'உங்கள் உணவு விருப்பங்கள் மற்றும் ஆரோக்கிய இலக்குகளுக்கு ஏற்ப AI-இயக்கிய உணவு பரிந்துரைகளைப் பெறுங்கள்.',
      ai_start: 'திட்டமிடுதல் தொடங்குக →',
      footer: '© 2025 NutriSathi. அனைத்து உரிமைகளும் உரிமைப்பட்டவை।'
    },
    te: {
      nav_home: 'హోమ్',
      nav_about: 'గురించి',
      nav_bmi: 'BMI కాలిక్యులేటర్',
      nav_ai: 'AI ప్లానర్ ✨',
      nav_signin: 'సైన్ ఇన్',
      nav_cta: 'ప్రారంభిద్దాం',
      hero_title_line1: 'బాగా తినండి.',
      hero_title_line2: 'ఆరోగ్యకరంగా జీవించండి.',
      hero_description: 'మీ AI-ఆధారిత పోషణ సహచరుడు. వ్యక్తిగত భోజన ప్రణాళికలను పొందండి, కెలోరీలను ట్రాక్ చేయండి మరియు మీ ఆరోగ్య లక్ష్యాలను సాధించండి.',
      hero_try_ai: 'AI ప్లానర్ ప్రయత్నించండి ✨',
      hero_calc_bmi: 'BMI లెక్కించండి',
      about_title: 'NutriSathi గురించి',
      about_text: 'మీ AI-ఆధారిత పోషణ సహచరుడు వ్యక్తిగత భోజన ప్రణాళికలు మరియు సిఫారసుల ద్వారా మీ ఆరోగ్య లక్ష్యాలను సాధించడానికి సహాయం చేస్తుంది.',
      bmi_title: 'BMI కాలిక్యులేటర్',
      bmi_text: 'మీ శరీర ద్రవ్యరాశి సూచికను లెక్కించండి మరియు వ్యక్తిగత ఆరోగ్య సమాచారం పొందండి.',
      bmi_get_started: 'ప్రారంభించండి →',
      ai_title: 'AI భోజన ప్లానర్ ✨',
      ai_text: 'మీ ఆహార ప్రాధాన్యతలు మరియు ఆరోగ్య లక్ష్యాలకు అనుగుణమైన AI-ఆధారిత భోజన సిఫారసులను పొందండి.',
      ai_start: 'ప్రణాళిక ప్రారంభించండి →',
      footer: '© 2025 NutriSathi. అన్ని హక్కులు సংరక్షించబడ్డాయి।'
    },
    mr: {
      nav_home: 'होम',
      nav_about: 'बद्दल',
      nav_bmi: 'BMI कॅलक्युलेटर',
      nav_ai: 'AI प्लॅनर ✨',
      nav_signin: 'साइन इन करा',
      nav_cta: 'चला सुरू करूया',
      hero_title_line1: 'चांगले खा।',
      hero_title_line2: 'निरोगी राहा।',
      hero_description: 'तुमचा AI-संचालित पोषण सहचरी। व्यक्तिगत भोजन योजना मिळवा, कॅलरी ट्रॅक करा आणि तुमचे आरोग्य लक्ष्य साधा।',
      hero_try_ai: 'AI प्लॅनर वापरून पहा ✨',
      hero_calc_bmi: 'BMI मोजा',
      about_title: 'NutriSathi बद्दल',
      about_text: 'तुमचा AI-संचालित पोषण सहचरी तुमच्या आरोग्य लक्ष्यांना व्यक्तिगत भोजन योजना आणि सुचना द्वारे साध्य करण्यात मदत करतो।',
      bmi_title: 'BMI कॅलक्युलेटर',
      bmi_text: 'तुमचा शरीर वस्तुमान निर्देशांक मोजा आणि व्यक्तिगत आरोग्य माहिती मिळवा।',
      bmi_get_started: 'सुरू करा →',
      ai_title: 'AI भोजन योजनाकार ✨',
      ai_text: 'तुमच्या खाद्य पसंद आणि आरोग्य लक्ष्यांनुसार AI-संचालित भोजन सुचना मिळवा।',
      ai_start: 'योजना सुरू करा →',
      footer: '© 2025 NutriSathi. सर्व अधिकार राखीव।'
    },
    gu: {
      nav_home: 'હોમ',
      nav_about: 'વિશે',
      nav_bmi: 'BMI કેલક્યુલેટર',
      nav_ai: 'AI પ્લાનર ✨',
      nav_signin: 'સાઇન ઇન કરો',
      nav_cta: 'ચાલો શરૂ કરીએ',
      hero_title_line1: 'સારે ખાઓ.',
      hero_title_line2: 'આરોગ્યવંત રહો.',
      hero_description: 'તમારો AI-સંચાલિત પોષણ સાથી. ব્যক્તિગત ભોજન યોજનાઓ મેળવો, કેલોરીઝ ટ્રેક કરો અને તમારા આરોગ્ય લક્ષ્યો અর્જન કરો।',
      hero_try_ai: 'AI પ્લાનર આજમાઓ ✨',
      hero_calc_bmi: 'BMI ગણતરી કરો',
      about_title: 'NutriSathi વિશે',
      about_text: 'તમારો AI-સંચાલિત પોષણ સાથી વ્યક્તિગત ભોજન યોજનાઓ અને સુझાવો સાથે તમારા આરોગ્ય લક્ષ્યો અર્જનમાં મદદ કરે છે.',
      bmi_title: 'BMI કેલક્યુલેટર',
      bmi_text: 'તમારો શરીર માસ ઇન્ડેક્સ ગણો અને ব્યક્તિગત આરોગ્ય માહિતી મેળવો।',
      bmi_get_started: 'શરૂ કરો →',
      ai_title: 'AI ભોજન યોજનાકાર ✨',
      ai_text: 'તમારી ખોરાક પસંદ અને આરોગ્ય લક્ષ્યો અનુસાર AI-સંચાલિત ભોજન સુझાવો મેળવો।',
      ai_start: 'યોજનાનું આયોજન શરૂ કરો →',
      footer: '© 2025 NutriSathi. બધા અધિકારો આરક્ષિત છે।'
    },
    ur: {
      nav_home: 'ہوم',
      nav_about: 'کے بارے میں',
      nav_bmi: 'BMI کیلکولیٹر',
      nav_ai: 'AI منصوبہ ✨',
      nav_signin: 'سائن ان کریں',
      nav_cta: 'آئیے شروع کریں',
      hero_title_line1: 'اچھا کھائیں۔',
      hero_title_line2: 'صحت مند رہیں۔',
      hero_description: 'آپ کا AI سے چلنے والا غذائی ساتھی۔ ذاتی نوعیت کی کھانے کی منصوبہ بندی حاصل کریں، کیلوری کو ٹریک کریں اور اپنے صحت کے مقاصد کو حاصل کریں۔',
      hero_try_ai: 'AI منصوبہ آزمائیں ✨',
      hero_calc_bmi: 'BMI شمار کریں',
      about_title: 'NutriSathi کے بارے میں',
      about_text: 'آپ کا AI سے چلنے والا غذائی ساتھی ذاتی نوعیت کی کھانے کی منصوبہ بندی اور سفارشات سے اپنے صحت کے مقاصد کو حاصل کرنے میں مدد کرتا ہے۔',
      bmi_title: 'BMI کیلکولیٹر',
      bmi_text: 'اپنے جسم کی ماس انڈیکس شمار کریں اور ذاتی صحت کی معلومات حاصل کریں۔',
      bmi_get_started: 'شروع کریں →',
      ai_title: 'AI کھانے کی منصوبہ بندی ✨',
      ai_text: 'اپنی کھانے کی ترجیحات اور صحت کے مقاصد کے مطابق AI سے چلنے والی کھانے کی سفارشات حاصل کریں۔',
      ai_start: 'منصوبہ بندی شروع کریں →',
      footer: '© 2025 NutriSathi. تمام حقوق محفوظ ہیں۔'
    },
    pa: {
      nav_home: 'ਘਰ',
      nav_about: 'ਬਾਰੇ',
      nav_bmi: 'BMI ਕੈਲਕੁਲੇਟਰ',
      nav_ai: 'AI ਪਲੈਨਰ ✨',
      nav_signin: 'ਸਾਈਨ ਇਨ ਕਰੋ',
      nav_cta: 'ਆਓ ਸ਼ੁਰੂ ਕਰਦੇ ਹਾਂ',
      hero_title_line1: 'ਚੰਗਾ ਖਾਓ।',
      hero_title_line2: 'ਸਿਹਤਮੰਦ ਰਹੋ।',
      hero_description: 'ਤੁਹਾਡੇ AI-ਸੰਚਾਲਿਤ ਪੋਸ਼ਣ ਸਾਥੀ। ਨਿੱਜੀ ਭੋਜਨ ਯੋਜਨਾਵਾਂ ਪ੍ਰਾਪਤ ਕਰੋ, ਕੈਲੋਰੀ ਨੂੰ ਟ੍ਰੈਕ ਕਰੋ ਅਤੇ ਆਪਣੇ ਸਿਹਤ ਦੇ ਲਕਸ਼ਾਂ ਨੂੰ ਪ੍ਰਾਪਤ ਕਰੋ।',
      hero_try_ai: 'AI ਪਲੈਨਰ ਆਜ਼ਮਾਓ ✨',
      hero_calc_bmi: 'BMI ਦੀ ਗਣਨਾ ਕਰੋ',
      about_title: 'NutriSathi ਬਾਰੇ',
      about_text: 'ਤੁਹਾਡੇ AI-ਸੰਚਾਲਿਤ ਪੋਸ਼ਣ ਸਾਥੀ ਨਿੱਜੀ ਭੋਜਨ ਯੋਜਨਾਵਾਂ ਅਤੇ ਸਿਫਾਰਸ਼ਾਂ ਨਾਲ ਆਪਣੇ ਸਿਹਤ ਦੇ ਲਕਸ਼ਾਂ ਨੂੰ ਪ੍ਰਾਪਤ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰਦੇ ਹਾਂ।',
      bmi_title: 'BMI ਕੈਲਕੁਲੇਟਰ',
      bmi_text: 'ਆਪਣਾ ਸਰੀਰ ਪੁੰਜ ਸੂਚਕ ਅੰਕ ਦੀ ਗਣਨਾ ਕਰੋ ਅਤੇ ਨਿੱਜੀ ਸਿਹਤ ਦੀ ਜਾਣਕਾਰੀ ਪ੍ਰਾਪਤ ਕਰੋ।',
      bmi_get_started: 'ਸ਼ੁਰੂ ਕਰੋ →',
      ai_title: 'AI ਭੋਜਨ ਯੋਜਨਾਕਾਰ ✨',
      ai_text: 'ਆਪਣੇ ਭੋਜਨ ਦੀ ਤਰਜੀਹ ਅਤੇ ਸਿਹਤ ਦੇ ਲਕਸ਼ਾਂ ਅਨੁਸਾਰ AI-ਸੰਚਾਲਿਤ ਭੋਜਨ ਦੀ ਸਿਫਾਰਸ਼ਾਂ ਪ੍ਰਾਪਤ ਕਰੋ।',
      ai_start: 'ਯੋਜਨਾਬੰਦੀ ਸ਼ੁਰੂ ਕਰੋ →',
      footer: '© 2025 NutriSathi. ਸਾਰੇ ਅਧਿਕਾਰ ਰੱਖਿਆ ਹੋਇਆ ਹੈ।'
    },
    od: {
      nav_home: 'ଘର',
      nav_about: 'ବିଷୟରେ',
      nav_bmi: 'BMI ଗଣନା',
      nav_ai: 'AI ଯୋଜନାକାର ✨',
      nav_signin: 'ସାଇନ ଇନ',
      nav_cta: 'ଚାଲି ଆସ୍',
      hero_title_line1: 'ଭଲ ଖାଆନ୍ତୁ।',
      hero_title_line2: 'ସୁସ୍ଥ ଥାଉନ୍ତୁ।',
      hero_description: 'ଆପଣଙ୍କ AI-ଚାଳିତ ପୁଷ୍ଟି ସଙ୍ଗୀ। ବ୍ୟକ୍ତିଗତ ଖାଦ୍ୟ ଯୋଜନା ପାଆନ୍ତୁ, କ୍ୟାଲୋରି ଟ୍ରାକ କରନ୍ତୁ ଏବଂ ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ଲକ୍ଷ୍ୟ ଅର୍ଜନ କରନ୍ତୁ।',
      hero_try_ai: 'AI ଯୋଜନାକାର ଚେଷ୍ଟା କରନ୍ତୁ ✨',
      hero_calc_bmi: 'BMI ଗଣନା ସୁଦ୍ଷ',
      about_title: 'NutriSathi ବିଷୟରେ',
      about_text: 'ଆପଣଙ୍କ AI-ଚାଳିତ ପୁଷ୍ଟି ସଙ୍ଗୀ ବ୍ୟକ୍ତିଗତ ଖାଦ୍ୟ ଯୋଜନା ଏବଂ ସୁପାରିଶ ସହ ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ଲକ୍ଷ୍ୟ ଅର୍ଜନରେ ସାହାଯ୍ୟ କରେ।',
      bmi_title: 'BMI ଗଣନା',
      bmi_text: 'ଆପଣଙ୍କ ବଡି ମାସ ଇଣ୍ଡେକ୍ସ ଗଣନା କରନ୍ତୁ ଏବଂ ବ୍ୟକ୍ତିଗତ ସ୍ୱାସ୍ଥ୍ୟ ସୂଚନା ପାଆନ୍ତୁ।',
      bmi_get_started: 'ଆରମ୍ଭ କରନ୍ତୁ →',
      ai_title: 'AI ଖାଦ୍ୟ ଯୋଜନାକାର ✨',
      ai_text: 'ଆପଣଙ୍କ ଖାଦ୍ୟ ପସନ୍ଦ ଏବଂ ସ୍ୱାସ୍ଥ୍ୟ ଲକ୍ଷ୍ୟ ଅନୁଯାୟୀ AI-ଚାଳିତ ଖାଦ୍ୟ ସୁପାରିଶ ପାଆନ୍ତୁ।',
      ai_start: 'ଯୋଜନା ଆରମ୍ଭ କରନ୍ତୁ →',
      footer: '© 2025 NutriSathi. ସମସ୍ତ ଅଧିକାର ସଂରକ୍ଷିତ।'
    }
  };

  // Only Indian languages
  const supportedLanguages: { code: string; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'mr', label: 'मराठी' },
    { code: 'gu', label: 'ગુજરાતી' },
    { code: 'ur', label: 'اردو' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ' },
    { code: 'od', label: 'ଓଡ଼ିଆ' }
  ];

  // Helper to get text (translated or default)
  const t = (key: string) => translations[key] || defaultTexts[key] || '';

  // Request translations from backend
  const fetchTranslations = async (target: string) => {
    if (!target || target === 'en') {
      setTranslations({});
      return;
    }

    try {
      const res = await fetch(`${API_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, texts: defaultTexts })
      });
      if (!res.ok) {
        console.warn('Translation request failed', await res.text());
        // fallback to built-in translations if available
        if ((fallbackTranslations as any)[target]) {
          setTranslations((fallbackTranslations as any)[target]);
        }
        return;
      }
      const data = await res.json();
      if (data && data.translations) {
        setTranslations(data.translations);
      }
    } catch (err) {
      console.warn('Translation error', err);
      // fallback to built-in translations if available
      if ((fallbackTranslations as any)[target]) {
        setTranslations((fallbackTranslations as any)[target]);
      }
    }
  };

  useEffect(() => {
    // Fetch translations when language changes (except English)
    fetchTranslations(lang);
  }, [lang]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      {/* Navigation Bar */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <div className="logo-icon">🍃</div>
            <span className="logo-text">NutriSathi</span>
          </div>
          
          <div className="nav-menu">
            <a href="#home" className="nav-link">{t('nav_home')}</a>
            <a href="#about" className="nav-link">{t('nav_about')}</a>
            <a href="#bmi" className="nav-link">{t('nav_bmi')}</a>
            <a href="#ai-planner" className="nav-link">{t('nav_ai')}</a>
          </div>

          <div className="nav-actions">
            <select
              aria-label="Select language"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={{
                marginRight: '8px',
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #ccc',
                backgroundColor: 'white',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '140px'
              }}
            >
              {supportedLanguages.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>

            <button className="nav-signin" onClick={onNavigateLogin}>{t('nav_signin')}</button>
            <button className="nav-cta" onClick={onNavigateSignup}>{t('nav_cta')}</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" style={{position: 'relative', paddingTop: '96px', paddingBottom: '48px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.95)', minHeight: '85vh', display: 'flex', alignItems: 'center'}}>
        {/* Background decorative elements */}
        <div style={{position: 'absolute', top: 0, right: 0, width: '500px', height: '500px', background: 'rgba(253, 224, 71, 0.1)', borderRadius: '9999px', filter: 'blur(80px)', opacity: 0.6, transform: 'translate(50%, -50%)'}}></div>
        
        <div style={{maxWidth: '80rem', margin: '0 auto', paddingLeft: '16px', paddingRight: '16px', position: 'relative', zIndex: 10, width: '100%'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center'}}>
            
            {/* Text (Left side) */}
            <div>
              {/* Brand name and tagline */}
              <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <div style={{width: '32px', height: '32px', background: '#10b981', borderRadius: '0 8px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 15px rgba(16, 185, 129, 0.3)', fontSize: '18px'}}>
                    🍃
                  </div>
                  <span style={{fontFamily: 'Georgia, serif', fontWeight: 'bold', fontSize: '28px', letterSpacing: '-0.5px', color: '#047857'}}>NutriSathi</span>
                </div>
                <div style={{height: '24px', width: '1px', background: '#d1d5db'}}></div>
                <div>
                  <div style={{fontSize: '12px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1.2px'}}>Healthy</div>
                  <div style={{fontSize: '12px', fontWeight: '600', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1.2px'}}>Nutrition</div>
                </div>
              </div>
              
              <div style={{display: 'inline-flex', alignItems: 'center', gap: '8px', paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.1)', color: '#047857', fontWeight: '600', fontSize: '14px', marginBottom: '16px'}}>
                <span style={{width: '8px', height: '8px', borderRadius: '9999px', background: '#10b981', animation: 'pulse 2s infinite'}}></span>
                <span>Welcome to Smart Nutrition</span>
              </div>
              
              <h1 style={{fontSize: '52px', fontWeight: 900, lineHeight: 1.2, color: '#1f2937', marginBottom: '24px'}}>
                Eat Better. <br />
                <span style={{background: 'linear-gradient(to right, #10b981, #047857, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>Live Healthier.</span>
              </h1>
              
              <p style={{fontSize: '18px', color: '#6b7280', maxWidth: '32rem', lineHeight: 1.6, marginBottom: '24px'}}>
                {t('hero_description')}
              </p>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px'}}>
                <button onClick={() => scrollToSection('ai-planner')} style={{background: '#10b981', color: 'white', paddingLeft: '32px', paddingRight: '32px', paddingTop: '16px', paddingBottom: '16px', borderRadius: '9999px', fontWeight: 'bold', boxShadow: '0 25px 30px rgba(16, 185, 129, 0.3)', transition: 'all 0.3s ease', transform: 'translateY(0)', cursor: 'pointer', border: 'none', fontSize: '16px'}} onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
                  {t('hero_try_ai')}
                </button>
                <button onClick={() => scrollToSection('bmi')} style={{background: 'white', color: '#10b981', paddingLeft: '32px', paddingRight: '32px', paddingTop: '16px', paddingBottom: '16px', borderRadius: '9999px', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'all 0.3s ease', transform: 'translateY(0)', cursor: 'pointer', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '16px'}} onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)', e.currentTarget.style.background = '#f0fdf4')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.background = 'white')}>
                  📊 {t('hero_calc_bmi')}
                </button>
              </div>
            </div>

            {/* Image with Nutritional Info Overlays (Right side) */}
            <div style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
              {/* Main Image Container */}
              <div style={{position: 'relative', width: '500px', height: '500px', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.2)'}}>
                <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
                     alt="Healthy Salad Bowl" 
                     style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
                <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.2), transparent)'}}></div>
              </div>
              
              {/* Nutritional Info Overlays */}
              
              {/* Top Left - 270 kal */}
              <div style={{position: 'absolute', top: '25%', left: '-24px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', animation: 'float 5s ease-in-out infinite'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316', fontSize: '18px'}}>🔥</div>
                  <div>
                    <p style={{fontSize: '18px', fontWeight: 900, color: '#111827'}}>270</p>
                    <p style={{fontSize: '12px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px'}}>calories</p>
                  </div>
                </div>
              </div>
              
              {/* Top Center - 300 kalories */}
              <div style={{position: 'absolute', top: '48px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', animation: 'float 6s ease-in-out infinite', textAlign: 'center'}}>
                <p style={{fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px'}}>Perfect</p>
                <p style={{fontSize: '18px', fontWeight: 900, color: '#111827'}}>300</p>
                <p style={{fontSize: '12px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px'}}>calories</p>
              </div>
              
              {/* Top Right - 1200 kalories */}
              <div style={{position: 'absolute', top: '80px', right: '-16px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', animation: 'float 4s ease-in-out infinite'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontSize: '18px'}}>⚡</div>
                  <div>
                    <p style={{fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px'}}>Energy</p>
                    <p style={{fontSize: '18px', fontWeight: 900, color: '#111827'}}>1200</p>
                    <p style={{fontSize: '12px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px'}}>calories</p>
                  </div>
                </div>
              </div>
              
              {/* Middle Right - 170 kalories */}
              <div style={{position: 'absolute', top: '50%', right: '-16px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', animation: 'float 5.5s ease-in-out infinite'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', fontSize: '14px'}}>🥑</div>
                  <div>
                    <p style={{fontSize: '18px', fontWeight: 900, color: '#111827'}}>170</p>
                    <p style={{fontSize: '12px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px'}}>calories</p>
                  </div>
                </div>
              </div>
              
              {/* Bottom Left - 850 kalories */}
              <div style={{position: 'absolute', bottom: '96px', left: '-32px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', animation: 'float 4.5s ease-in-out infinite'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', fontSize: '18px'}}>🍇</div>
                  <div>
                    <p style={{fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px'}}>Fruits</p>
                    <p style={{fontSize: '18px', fontWeight: 900, color: '#111827'}}>850</p>
                    <p style={{fontSize: '12px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px'}}>calories</p>
                  </div>
                </div>
              </div>
              
              {/* Bottom Center - 220 kal */}
              <div style={{position: 'absolute', bottom: '64px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', animation: 'float 6.5s ease-in-out infinite', textAlign: 'center'}}>
                <p style={{fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px'}}>Fresh</p>
                <p style={{fontSize: '18px', fontWeight: 900, color: '#111827'}}>220</p>
                <p style={{fontSize: '12px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px'}}>calories</p>
              </div>
              
              {/* Bottom Right - 220 kal */}
              <div style={{position: 'absolute', bottom: '80px', right: '-8px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', animation: 'float 5s ease-in-out infinite'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(250, 204, 21, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#facc15', fontSize: '18px'}}>🌽</div>
                  <div>
                    <p style={{fontSize: '18px', fontWeight: 900, color: '#111827'}}>220</p>
                    <p style={{fontSize: '12px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px'}}>cal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </section>

      {/* About Section */}
      <section id="about" style={{minHeight: '500px', padding: '80px 24px', background: '#fafafa'}}>
        <div style={{maxWidth: '1200px', margin: '0 auto'}}>
          <h2 style={{fontSize: '36px', fontWeight: '800', marginBottom: '50px', color: '#111827', letterSpacing: '-1px', textAlign: 'center'}}>{t('about_title')}</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center'}}>
            <div>
              <img 
                src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop" 
                alt="Healthy Nutrition" 
                style={{width: '100%', height: '400px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
              />
            </div>
            <div>
              <p style={{color: '#6b7280', fontSize: '16px', lineHeight: '1.8', letterSpacing: '-0.2px', marginBottom: '20px'}}>
                {t('about_text')}
              </p>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px'}}>
                <div style={{padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}>
                  <div style={{fontSize: '28px', fontWeight: '800', color: '#10b981', marginBottom: '8px'}}>100%</div>
                  <div style={{fontSize: '14px', color: '#6b7280'}}>Personalized Plans</div>
                </div>
                <div style={{padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}>
                  <div style={{fontSize: '28px', fontWeight: '800', color: '#10b981', marginBottom: '8px'}}>AI Powered</div>
                  <div style={{fontSize: '14px', color: '#6b7280'}}>Smart Nutrition</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BMI Calculator Section */}
      <section id="bmi" style={{minHeight: '500px', padding: '80px 24px', background: 'white'}}>
        <div style={{maxWidth: '1200px', margin: '0 auto'}}>
          <h2 style={{fontSize: '36px', fontWeight: '800', marginBottom: '50px', color: '#111827', letterSpacing: '-1px', textAlign: 'center'}}>{t('bmi_title')}</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center'}}>
            <div>
              <p style={{color: '#6b7280', fontSize: '16px', lineHeight: '1.8', letterSpacing: '-0.2px', marginBottom: '30px'}}>
                {t('bmi_text')}
              </p>
              <button className="hero-btn-primary" onClick={onNavigateSignup} style={{marginBottom: '30px'}}>{t('bmi_get_started')}</button>
              <div style={{display: 'grid', gap: '15px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <span style={{fontSize: '20px'}}>✓</span>
                  <span style={{color: '#6b7280'}}>Quick and Accurate Calculation</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <span style={{fontSize: '20px'}}>✓</span>
                  <span style={{color: '#6b7280'}}>Health Category Classification</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <span style={{fontSize: '20px'}}>✓</span>
                  <span style={{color: '#6b7280'}}>Personalized Recommendations</span>
                </div>
              </div>
            </div>
            <div>
              <img 
                src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400&h=400&fit=crop" 
                alt="BMI Calculator" 
                style={{width: '100%', height: '400px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI Meal Planner Section */}
      <section id="ai-planner" style={{minHeight: '500px', padding: '80px 24px', background: '#fafafa'}}>
        <div style={{maxWidth: '1200px', margin: '0 auto'}}>
          <h2 style={{fontSize: '36px', fontWeight: '800', marginBottom: '50px', color: '#111827', letterSpacing: '-1px', textAlign: 'center'}}>{t('ai_title')}</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center'}}>
            <div>
              <img 
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop" 
                alt="AI Meal Planner" 
                style={{width: '100%', height: '400px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
              />
            </div>
            <div>
              <p style={{color: '#6b7280', fontSize: '16px', lineHeight: '1.8', letterSpacing: '-0.2px', marginBottom: '30px'}}>
                {t('ai_text')}
              </p>
              <button className="hero-btn-primary" onClick={onNavigateSignup} style={{marginBottom: '30px'}}>{t('ai_start')}</button>
              <div style={{display: 'grid', gap: '15px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <span style={{fontSize: '20px'}}>🤖</span>
                  <span style={{color: '#6b7280'}}>AI-Powered Meal Suggestions</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <span style={{fontSize: '20px'}}>🥗</span>
                  <span style={{color: '#6b7280'}}>Tailored to Your Goals</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <span style={{fontSize: '20px'}}>📊</span>
                  <span style={{color: '#6b7280'}}>Nutritional Balance Tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{background: '#111827', color: 'white', padding: '40px 24px', textAlign: 'center'}}>
        <p style={{margin: 0, fontSize: '14px', letterSpacing: '-0.2px'}}>{t('footer')}</p>
      </footer>
    </div>
  );
};

export default LandingPage;
