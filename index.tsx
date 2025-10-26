

import React, { useState, useEffect, useMemo, createContext, useContext, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';

// --- TYPE DEFINITIONS (from Prisma Schema) ---

interface UserProfile {
    id: string;
    name: string;
    email: string;
    photoUrl: string;
    headline: string;
    city: string;
    timezone: string;
    websiteUrl: string;
    socials: { [key: string]: string };
    bio: string;
    verifiedBool: boolean;
    accountType: 'regular' | 'bni';
    onboardingCompleted: boolean;
    // BNI Fields
    chapterId?: string;
    regionId?: string;
    bniRole?: 'president' | 'vp' | 'member';
    tenureMonths?: number;
    gainsGoals?: string[];
    gainsAccomplishments?: string[];
    industryCategory?: string;
}

interface Offer {
    id: string;
    userId: string;
    title: string;
    tags: string[];
    priority: number;
    expiresOn?: Date;
    archived: boolean;
}

interface Need {
    id: string;
    userId: string;
    title: string;
    tags: string[];
    priority: number;
    expiresOn?: Date;
    archived: boolean;
}

interface Contact {
    id: string;
    ownerUserId: string;
    name: string;
    role: string;
    org: string;
    email: string;
    phone: string;
    city: string;
    websiteUrl: string;
    socials: { [key: string]: string };
    tags: string[];
    notes: string;
    lastTouchAt?: Date;
    nextActionAt?: Date;
}

interface Intro {
    id: string;
    aUserId: string;
    bUserId: string;
    bUserName: string;
    bUserHeadline: string;
    bUserPhotoUrl: string;
    reason: string;
    status: 'pending' | 'accepted' | 'scheduled' | 'done' | 'skipped';
    proposedTimes: { start: string, end: string }[];
    meetingTime?: Date;
    notes?: string;
    outcome?: 'lead' | 'hire' | 'partner' | 'other';
    token: string;
    prepBrief: string;
}

interface Match {
    id: string;
    otherUserId: string;
    name: string;
    headline: string;
    photoUrl: string;
    fitScore: number;
    reason: string;
    tags: string[];
    matchType: 'regular' | 'bni-chapter' | 'bni-region';
}

interface BusinessCard {
    id: string;
    ownerUserId: string;
    templateKey: 'A' | 'B' | 'C';
    theme: { color: string };
    fields: { [key: string]: string };
    qrUrl: string;
    shareSlug: string;
    views: number;
}

interface CardScan {
    id: string;
    ownerUserId: string;
    imageUrl: string;
    parsed: Partial<Contact>;
    confidence: number;
    status: 'new' | 'review' | 'saved' | 'error';
}

interface ChatMessage {
    id: string;
    threadId: string;
    fromUserId: string;
    body: string;
    sentAt: Date;
}

interface ChatThread {
    id: string;
    introId: string;
    memberIds: string[];
    messages: ChatMessage[];
    lastMessagePreview: string;
}

interface CreditWallet {
    userId: string;
    balance: number;
    monthlyGrant: number;
    lastGrantAt: Date;
}

interface CreditLog {
    id: string;
    userId: string;
    action: string;
    delta: number;
    balanceAfter: number;
    meta?: { [key: string]: any };
    at: Date;
}


// --- MOCK DATA ---
const MOCK_USER_ID = 'user-123';

const MOCK_INITIAL_USER_PROFILE: UserProfile = {
    id: MOCK_USER_ID,
    name: 'Demo User',
    email: 'demo@introspark.com',
    photoUrl: `https://i.pravatar.cc/150?u=${MOCK_USER_ID}`,
    headline: 'AI Product Manager | Building the future of networking',
    city: 'San Francisco, CA',
    timezone: 'America/Los_Angeles',
    websiteUrl: 'https://introspark.ai',
    socials: { linkedin: 'https://linkedin.com/in/demouser', twitter: 'https://twitter.com/demouser' },
    bio: 'Experienced product leader passionate about leveraging AI to create meaningful professional connections. Previously at Google and various startups.',
    verifiedBool: true,
    accountType: 'regular',
    onboardingCompleted: false,
    // BNI Fields
    chapterId: 'golden-gate-innovators',
    regionId: 'sf-bay-area',
    bniRole: 'president',
    tenureMonths: 24,
    gainsGoals: ['Expand consulting practice into enterprise SaaS', 'Find a technical co-founder for a new venture'],
    gainsAccomplishments: ['Landed 3 Fortune 500 clients in the last quarter', 'Successfully exited previous startup'],
    industryCategory: 'Software Development',
};

const MOCK_BNI_CHAPTER_MEMBERS: UserProfile[] = [
    { ...MOCK_INITIAL_USER_PROFILE, id: 'bni-1', name: 'Alice Johnson', bniRole: 'president', industryCategory: 'Marketing Agency' },
    { ...MOCK_INITIAL_USER_PROFILE, id: 'bni-2', name: 'Bob Williams', bniRole: 'vp', industryCategory: 'Financial Services' },
    { ...MOCK_INITIAL_USER_PROFILE, id: 'bni-3', name: 'Charlie Brown', bniRole: 'member', industryCategory: 'Real Estate' },
    { ...MOCK_INITIAL_USER_PROFILE, id: 'bni-4', name: 'Diana Miller', bniRole: 'member', industryCategory: 'IT Consulting' },
    { ...MOCK_INITIAL_USER_PROFILE, id: 'bni-5', name: 'Ethan Davis', bniRole: 'member', industryCategory: 'Legal Services' },
];

const MOCK_MATCHES: Match[] = [
    { id: 'match-1', otherUserId: 'user-456', name: 'Sophia Chen', headline: 'Head of Design @ EnterpriseCorp', photoUrl: 'https://i.pravatar.cc/150?u=user-456', fitScore: 92, reason: "Based on your interest in 'Connections to enterprise design leaders'...", tags: ['Design', 'SaaS'], matchType: 'regular' },
    { id: 'match-2', otherUserId: 'user-789', name: 'David Lee', headline: 'Angel Investor - AI & FinTech', photoUrl: 'https://i.pravatar.cc/150?u=user-789', fitScore: 88, reason: "Matches your goal to find a technical co-founder for a new venture.", tags: ['Investing', 'AI'], matchType: 'regular' },
];

const MOCK_CONTACTS: Contact[] = [
    { id: 'contact-1', ownerUserId: MOCK_USER_ID, name: 'Jane Doe', role: 'CEO', org: 'Innovate Inc.', email: 'jane@innovate.co', phone: '555-1234', city: 'New York, NY', websiteUrl: 'https://innovate.co', socials: {}, tags: ['Lead', 'Q4-Target'], notes: 'Met at SaaS conference. Follow up re: collaboration.', lastTouchAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), nextActionAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
    { id: 'contact-2', ownerUserId: MOCK_USER_ID, name: 'John Smith', role: 'CTO', org: 'Tech Solutions', email: 'john@techsol.com', phone: '555-5678', city: 'Austin, TX', websiteUrl: 'https://techsol.com', socials: {}, tags: ['Partnership'], notes: 'Considering them for a new project.', lastTouchAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
];

const MOCK_THREADS: ChatThread[] = [
    { id: 'thread-1', introId: 'intro-1', memberIds: [MOCK_USER_ID, 'user-456'], lastMessagePreview: 'Sounds great, looking forward to it!', messages: [{ id: 'msg-1', threadId: 'thread-1', fromUserId: MOCK_USER_ID, body: 'Hey Sophia, great to be connected!', sentAt: new Date() }, { id: 'msg-2', threadId: 'thread-1', fromUserId: 'user-456', body: 'You too! Let me know what time works best.', sentAt: new Date() }] },
];

const MOCK_CARDS: BusinessCard[] = [
    { id: 'card-1', ownerUserId: MOCK_USER_ID, templateKey: 'A', theme: { color: '#22C55E' }, fields: { name: 'Demo User', headline: 'AI Product Manager', email: 'demo@introspark.com' }, qrUrl: '', shareSlug: 'demo-user-card', views: 127 }
];

const MOCK_SCANS: CardScan[] = [
    { id: 'scan-1', ownerUserId: MOCK_USER_ID, imageUrl: 'https://i.imgur.com/gIXd9A1.png', parsed: { name: 'John Appleseed', email: 'john@apple.com', phone: '800-555-4242' }, confidence: 0.95, status: 'review' }
];

// --- MOCK API/AI FUNCTIONS ---
const mockGenerateBio = (urls: string[]) => new Promise<string>(resolve => setTimeout(() => resolve(`Based on your online presence, you're a results-driven product leader with a knack for scaling AI-powered products. You have a strong background in both startup and enterprise environments, with a focus on creating meaningful user experiences. Key skills appear to include product strategy, machine learning applications, and cross-functional team leadership.`), 1000));
// FIX: Changed function signature to accept `needs` and updated its usage to fix a type error. `needs` is not a property of `UserProfile`.
const mockGenerateMatches = (userProfile: UserProfile, needs: Need[], isBni: boolean = false) => new Promise<Match[]>(resolve => setTimeout(() => {
    const newMatches: Match[] = Array.from({ length: 5 }, (_, i) => ({
        id: `new-match-${Date.now()}-${i}`,
        otherUserId: `user-rand-${i}`,
        name: ['Liam', 'Olivia', 'Noah', 'Emma', 'Oliver'][i],
        headline: ['Founder @ AI Startup', 'Growth Marketer', 'UX Designer', 'Venture Capitalist', 'Software Engineer'][i],
        photoUrl: `https://i.pravatar.cc/150?u=user-rand-${i}`,
        fitScore: 80 + Math.floor(Math.random() * 15),
        reason: `Based on your interest in "${needs?.[0]?.title || 'new ventures'}"...`,
        tags: [['AI', 'SaaS'], ['Marketing', 'B2B'], ['UX', 'Mobile'], ['Finance', 'Investing'], ['DevTools', 'Open Source']][i],
        matchType: isBni ? 'bni-chapter' : 'regular'
    }));
    resolve(newMatches);
}, 1500));
const mockGeneratePrepBrief = () => new Promise<string>(resolve => setTimeout(() => resolve("Here's a quick brief to prepare you. Both of you share a passion for AI's role in creative industries. Key talking points could include: the future of generative models, strategies for user adoption of new AI tools, and potential collaboration opportunities in the B2B SaaS space."), 500));
const mockGenerateTimeSlots = () => new Promise<{ start: string, end: string }[]>(resolve => setTimeout(() => resolve([
    { start: 'Tomorrow, 10:00 AM', end: '10:30 AM' },
    { start: 'Tomorrow, 2:30 PM', end: '3:00 PM' },
    { start: 'Day after, 11:00 AM', end: '11:30 AM' },
]), 300));

// --- ICONS ---
const Icon = ({ name, className = "w-6 h-6" }: { name: string, className?: string }) => {
    const icons: { [key: string]: React.ReactElement } = {
        home: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a.75.75 0 011.06 0l8.955 8.955M3 10.5v.75a3 3 0 003 3h1.5a3 3 0 003-3v-.75m-15 4.5v-1.996a1.5 1.5 0 011.5-1.5h15a1.5 1.5 0 011.5 1.5v1.996a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75z" />,
        matches: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
        inbox: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />,
        contacts: <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.228a4.5 4.5 0 00-1.897 1.13l-2.28 2.087a8.957 8.957 0 00-2.18-1.5c.362-2.28.016-4.243-.658-5.986a11.134 11.134 0 00-1.897-1.13C2.43 5.42 5.61 3 9 3s6.57 2.42 7.5 5.42c.509.96.657 2.016.362 2.28l-2.28-2.087a4.5 4.5 0 00-1.897-1.13m-7.5 2.228l-2.28 2.087m13.352-2.087l2.28 2.087" />,
        profile: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
        arrowLeft: <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />,
        plus: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />,
        x: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
        send: <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />,
        sparkles: <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 15.75l-.259 1.035a3.375 3.375 0 00-2.456 2.456L14.25 21l1.035.259a3.375 3.375 0 002.456 2.456L18 24.75l.259-1.035a3.375 3.375 0 002.456-2.456L21.75 21l-1.035-.259a3.375 3.375 0 00-2.456-2.456z" />,
        archive: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4" />,
        unarchive: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.75h3v-3h-3v3z" />,
        copy: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5 .124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V9.375a2.25 2.25 0 00-2.25-2.25H9.375" />,
        check: <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />,
        chevronDown: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />,
        edit: <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />,
        calendar: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18" />,
        leaderboard: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />,
        camera: <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316zM12 15a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />,
        upload: <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />,
        idCard: <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />,
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            {icons[name] || <path />}
        </svg>
    );
};


// --- STATE MANAGEMENT (Zustand-like custom hook) ---
type State = {
    userProfile: UserProfile;
    offers: Offer[];
    needs: Need[];
    matches: Match[];
    contacts: Contact[];
    intros: Intro[];
    threads: ChatThread[];
    businessCards: BusinessCard[];
    cardScans: CardScan[];
    creditWallet: CreditWallet;
    creditLog: CreditLog[];
};

type Actions = {
    completeOnboarding: (profileData: Partial<UserProfile>, offers: Offer[], needs: Need[]) => void;
    updateProfile: (data: Partial<UserProfile>) => void;
    addOffer: (offer: Omit<Offer, 'id'|'userId'|'archived'>) => void;
    archiveOffer: (id: string) => void;
    unarchiveOffer: (id: string) => void;
    addNeed: (need: Omit<Need, 'id'|'userId'|'archived'>) => void;
    archiveNeed: (id: string) => void;
    unarchiveNeed: (id: string) => void;
    generateNewMatches: () => Promise<void>;
    generateBniMatchday: () => Promise<void>;
    requestIntro: (match: Match, time: {start: string, end: string}, prepBrief: string) => void;
    acceptIntro: (token: string, meetingTime: string) => void;
    addContact: (contact: Omit<Contact, 'id'|'ownerUserId'>) => void;
    updateContact: (contact: Contact) => void;
    setNudge: (contactId: string) => void;
    sendMessage: (threadId: string, body: string) => void;
    addBusinessCard: (card: Omit<BusinessCard, 'id' | 'ownerUserId' | 'shareSlug' | 'views'>) => void;
    saveScanAsContact: (scan: CardScan) => void;
    debitCredits: (action: string, amount: number) => boolean;
};

type Store = State & { actions: Actions };

const AppContext = createContext<Store | null>(null);

const useIntroSparkStore = (): Store => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useIntroSparkStore must be used within an AppProvider');
    }
    return context;
};

const AppProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<State>({
        userProfile: MOCK_INITIAL_USER_PROFILE,
        offers: [],
        needs: [],
        matches: MOCK_MATCHES,
        contacts: MOCK_CONTACTS,
        intros: [],
        threads: MOCK_THREADS,
        businessCards: MOCK_CARDS,
        cardScans: MOCK_SCANS,
        creditWallet: { userId: MOCK_USER_ID, balance: 250, monthlyGrant: 250, lastGrantAt: new Date() },
        creditLog: [],
    });

    const actions: Actions = useMemo(() => ({
        completeOnboarding: (profileData, offers, needs) => setState(s => ({
            ...s,
            userProfile: { ...s.userProfile, ...profileData, onboardingCompleted: true },
            offers: offers,
            needs: needs,
        })),
        updateProfile: (data) => setState(s => ({ ...s, userProfile: { ...s.userProfile, ...data } })),
        addOffer: (offer) => setState(s => ({...s, offers: [...s.offers, { ...offer, id: `offer-${Date.now()}`, userId: s.userProfile.id, archived: false }]})),
        archiveOffer: (id) => setState(s => ({...s, offers: s.offers.map(o => o.id === id ? {...o, archived: true} : o)})),
        unarchiveOffer: (id) => setState(s => ({...s, offers: s.offers.map(o => o.id === id ? {...o, archived: false} : o)})),
        addNeed: (need) => setState(s => ({...s, needs: [...s.needs, { ...need, id: `need-${Date.now()}`, userId: s.userProfile.id, archived: false }]})),
        archiveNeed: (id) => setState(s => ({...s, needs: s.needs.map(n => n.id === id ? {...n, archived: true} : n)})),
        unarchiveNeed: (id) => setState(s => ({...s, needs: s.needs.map(n => n.id === id ? {...n, archived: false} : n)})),
        generateNewMatches: async () => {
             if (!actions.debitCredits('Generate Matches', 10)) return;
            const newMatches = await mockGenerateMatches(state.userProfile, state.needs);
            setState(s => ({...s, matches: newMatches}));
        },
        generateBniMatchday: async () => {
            if (!actions.debitCredits('Generate BNI Matchday', 20)) return;
            const newMatches = await mockGenerateMatches(state.userProfile, state.needs, true);
            setState(s => ({...s, matches: newMatches}));
        },
        requestIntro: (match, time, prepBrief) => setState(s => {
            const newIntro: Intro = {
                id: `intro-${Date.now()}`,
                aUserId: s.userProfile.id,
                bUserId: match.otherUserId,
                bUserName: match.name,
                bUserHeadline: match.headline,
                bUserPhotoUrl: match.photoUrl,
                reason: match.reason,
                status: 'pending',
                proposedTimes: [],
                token: `token-${Date.now()}`,
                prepBrief,
            };
            return {
                ...s,
                matches: s.matches.filter(m => m.id !== match.id),
                intros: [newIntro, ...s.intros],
            }
        }),
        acceptIntro: (token, meetingTime) => {
            setState(s => ({
                ...s,
                intros: s.intros.map(i => i.token === token ? { ...i, status: 'scheduled', meetingTime: new Date() } : i),
            }));
        },
        addContact: (contact) => setState(s => ({...s, contacts: [{...contact, id: `contact-${Date.now()}`, ownerUserId: s.userProfile.id }, ...s.contacts]})),
        updateContact: (updatedContact) => setState(s => ({...s, contacts: s.contacts.map(c => c.id === updatedContact.id ? updatedContact : c)})),
        setNudge: (contactId) => setState(s => {
            const nextActionAt = new Date();
            nextActionAt.setDate(nextActionAt.getDate() + 7);
            return {...s, contacts: s.contacts.map(c => c.id === contactId ? {...c, nextActionAt} : c)}
        }),
        sendMessage: (threadId, body) => {
            const newMessage: ChatMessage = { id: `msg-${Date.now()}`, threadId, fromUserId: state.userProfile.id, body, sentAt: new Date() };
            setState(s => ({
                ...s,
                threads: s.threads.map(t => t.id === threadId ? { ...t, messages: [...t.messages, newMessage], lastMessagePreview: body } : t)
            }));
            
            // Simulate reply
            setTimeout(() => {
                const replyMessage: ChatMessage = { id: `msg-${Date.now()+1}`, threadId, fromUserId: state.threads.find(t=>t.id === threadId)?.memberIds.find(id => id !== state.userProfile.id) || 'other-user', body: "Sounds good, thanks for the update!", sentAt: new Date() };
                setState(s => ({
                    ...s,
                    threads: s.threads.map(t => t.id === threadId ? { ...t, messages: [...t.messages, replyMessage], lastMessagePreview: replyMessage.body } : t)
                }));
            }, 1500);
        },
        addBusinessCard: (card) => setState(s => ({...s, businessCards: [...s.businessCards, { ...card, id: `bcard-${Date.now()}`, ownerUserId: s.userProfile.id, shareSlug: `card-slug-${Date.now()}`, views: 0 }]})),
        saveScanAsContact: (scan) => {
            const newContact: Omit<Contact, 'id'|'ownerUserId'> = {
                name: scan.parsed.name || '',
                role: scan.parsed.role || '',
                org: scan.parsed.org || '',
                email: scan.parsed.email || '',
                phone: scan.parsed.phone || '',
                city: scan.parsed.city || '',
                websiteUrl: scan.parsed.websiteUrl || '',
                socials: scan.parsed.socials || {},
                tags: ['scanned-card'],
                notes: `Scanned from business card on ${new Date().toLocaleDateString()}`,
            };
            actions.addContact(newContact);
            setState(s => ({...s, cardScans: s.cardScans.map(sc => sc.id === scan.id ? {...sc, status: 'saved'} : sc)}));
        },
        debitCredits: (action, amount) => {
            let success = false;
            setState(s => {
                if (s.creditWallet.balance >= amount) {
                    const newBalance = s.creditWallet.balance - amount;
                    const newLog: CreditLog = {
                        id: `log-${Date.now()}`,
                        userId: s.userProfile.id,
                        action,
                        delta: -amount,
                        balanceAfter: newBalance,
                        at: new Date(),
                    };
                    success = true;
                    return {
                        ...s,
                        creditWallet: { ...s.creditWallet, balance: newBalance },
                        creditLog: [newLog, ...s.creditLog.slice(0, 49)],
                    }
                }
                return s; // Not enough credits, return original state
            });
            return success;
        },
    }), [state]);

    const store = useMemo(() => ({ ...state, actions }), [state, actions]);

    return <AppContext.Provider value={store}>{children}</AppContext.Provider>;
};


// --- UI COMPONENTS ---

const Card: React.FC<{ children: ReactNode, className?: string, onClick?: () => void }> = ({ children, className = '', onClick }) => {
    return <div onClick={onClick} className={`bg-gray-800 border border-gray-700 rounded-2xl shadow p-4 sm:p-5 ${onClick ? 'cursor-pointer hover:bg-gray-700 transition-colors' : ''} ${className}`}>{children}</div>;
};

const Button: React.FC<{ children: ReactNode, onClick: () => void, variant?: 'primary' | 'quiet' | 'link' | 'danger', className?: string, disabled?: boolean }> = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
    const baseClasses = "h-11 px-5 rounded-lg font-semibold text-base transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";
    const variantClasses = {
        primary: 'bg-primary hover:bg-primary-hover text-white shadow',
        quiet: 'bg-gray-700 hover:bg-gray-600 text-white',
        link: 'bg-transparent text-primary hover:text-primary-hover px-2',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
    };
    return <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{children}</button>;
};

const BottomNav: React.FC<{ activeTab: string, onTabChange: (tab: string) => void }> = ({ activeTab, onTabChange }) => {
    const { userProfile } = useIntroSparkStore();
    const isBniLeader = userProfile.accountType === 'bni' && (userProfile.bniRole === 'president' || userProfile.bniRole === 'vp');
    
    let tabs = [
        { name: 'home', label: 'Home', icon: 'home' },
        { name: 'matches', label: 'Matches', icon: 'matches' },
        { name: 'inbox', label: 'Inbox', icon: 'inbox' },
        { name: 'contacts', label: 'Contacts', icon: 'contacts' },
        { name: 'profile', label: 'Profile', icon: 'profile' },
    ];

    const navClass = "fixed bottom-0 inset-x-0 h-16 bg-gray-800 border-t border-gray-700 flex justify-around items-center lg:hidden z-50";

    return (
        <nav className={navClass} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {tabs.map(tab => (
                <button key={tab.name} onClick={() => onTabChange(tab.name)} className={`flex flex-col items-center justify-center text-xs transition-colors h-full w-full ${activeTab === tab.name ? 'text-primary' : 'text-gray-400 hover:text-white'}`}>
                    <Icon name={tab.icon} className="w-6 h-6 mb-1" />
                    <span>{tab.label}</span>
                </button>
            ))}
        </nav>
    );
};

const Sheet: React.FC<{ isOpen: boolean, onClose: () => void, children: ReactNode, title?: string }> = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
            <div className="bg-gray-800 w-full rounded-t-2xl p-4 shadow-lg animate-slide-up-fade" onClick={e => e.stopPropagation()} style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
                <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-4"></div>
                {title && <h2 className="text-xl font-bold text-center mb-4">{title}</h2>}
                {children}
            </div>
        </div>
    );
};

const Toast: React.FC<{ message: string, isVisible: boolean }> = ({ message, isVisible }) => {
    if (!isVisible) return null;
    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-lg shadow-md z-50 animate-slide-up-fade">
            {message}
        </div>
    );
};

const StatTile: React.FC<{ icon: string, label: string, value: string, cta?: { label: string, onClick: () => void } }> = ({ icon, label, value, cta }) => {
    return (
        <Card>
            <div className="flex items-center text-gray-400">
                <Icon name={icon} className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">{label}</span>
            </div>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {cta && <button onClick={cta.onClick} className="text-sm font-semibold text-primary mt-3">{cta.label}</button>}
        </Card>
    );
};

const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4' }) => {
    return <div className={`bg-gray-700 rounded animate-pulse ${className}`}></div>
};

const Header: React.FC<{ title: string, onBack?: () => void }> = ({ title, onBack }) => {
    return (
        <header className="sticky top-0 bg-gray-900/80 backdrop-blur-sm z-40 p-4 flex items-center">
            {onBack && (
                <button onClick={onBack} className="mr-4 p-2 -ml-2 text-gray-400 hover:text-white">
                    <Icon name="arrowLeft" className="w-6 h-6" />
                </button>
            )}
            <h1 className="text-xl font-bold">{title}</h1>
        </header>
    )
};

const PageContainer: React.FC<{ children: ReactNode }> = ({ children }) => {
    return <div className="p-4 pb-24 lg:pb-4">{children}</div>
}

// --- ONBOARDING FLOW ---

// FIX: Added `onComplete` to props destructuring to resolve reference error.
const OnboardingFlow: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const { actions } = useIntroSparkStore();
    const [step, setStep] = useState(1);
    const [profileData, setProfileData] = useState<Partial<UserProfile>>({ name: MOCK_INITIAL_USER_PROFILE.name, headline: MOCK_INITIAL_USER_PROFILE.headline, bio: '', websiteUrl: '', socials: {} });
    const [offers, setOffers] = useState<Offer[]>([]);
    const [needs, setNeeds] = useState<Need[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateBio = async () => {
        setIsLoading(true);
        const bio = await mockGenerateBio([profileData.websiteUrl || '', profileData.socials?.linkedin || '']);
        setProfileData(prev => ({ ...prev, bio }));
        setIsLoading(false);
    };

    const handleFinish = () => {
        actions.completeOnboarding(profileData, offers, needs);
        onComplete();
    };
    
    const isBni = MOCK_INITIAL_USER_PROFILE.accountType === 'bni';

    const renderStep = () => {
        switch(step) {
            case 1: return (
                <div>
                    <h2 className="text-2xl font-bold mb-2">Welcome to IntroSpark!</h2>
                    <p className="text-gray-400 mb-6">Let's set up your profile.</p>
                    <div className="space-y-4">
                        <input type="text" placeholder="Your Name" value={profileData.name} onChange={e => setProfileData(p => ({...p, name: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg" />
                        <input type="text" placeholder="Your Headline" value={profileData.headline} onChange={e => setProfileData(p => ({...p, headline: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg" />
                        <input type="text" placeholder="Website URL" value={profileData.websiteUrl} onChange={e => setProfileData(p => ({...p, websiteUrl: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg" />
                        <textarea placeholder="Your Bio" value={profileData.bio} onChange={e => setProfileData(p => ({...p, bio: e.target.value}))} rows={4} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg"></textarea>
                        <Button onClick={handleGenerateBio} disabled={isLoading} variant="quiet" className="w-full">
                            {isLoading ? <div className="loader" /> : <><Icon name="sparkles" className="w-5 h-5 mr-2" /><span>Generate Bio with AI</span></>}
                        </Button>
                    </div>
                    <Button onClick={() => setStep(2)} className="w-full mt-6">Next</Button>
                </div>
            );
             case 2:
                if (isBni) return (
                     <div>
                        <h2 className="text-2xl font-bold mb-2">BNI Information</h2>
                        <p className="text-gray-400 mb-6">Let's add your BNI chapter details.</p>
                         <div className="space-y-4">
                            <input type="text" placeholder="Chapter Name" defaultValue={profileData.chapterId || 'Golden Gate Innovators'} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg" />
                            <input type="text" placeholder="Industry Category" defaultValue={profileData.industryCategory || 'Software Development'} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg" />
                             <textarea placeholder="Your GAINS Goals (one per line)" rows={3} className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg" defaultValue={(profileData.gainsGoals || []).join('\n')}></textarea>
                         </div>
                        <Button onClick={() => setStep(3)} className="w-full mt-6">Next</Button>
                    </div>
                );
                // Fallthrough for non-bni
            case 3: 
                 const currentStep = isBni ? 3 : 2;
                 return <OffersAndNeedsEditor offers={offers} setOffers={setOffers} needs={needs} setNeeds={setNeeds} onNext={handleFinish} nextText="Finish Setup" />;
        }
    }

    return <div className="max-w-md mx-auto p-4 pt-16">{renderStep()}</div>;
};


// --- FEATURE PAGES ---

const DashboardPage: React.FC<{ onNavigate: (page: string, params?: any) => void }> = ({ onNavigate }) => {
    const { userProfile, intros, creditWallet } = useIntroSparkStore();
    const [isLoading, setIsLoading] = useState(false);
    const { actions } = useIntroSparkStore();

    const handleGenerate = async () => {
        setIsLoading(true);
        await actions.generateNewMatches();
        setIsLoading(false);
        onNavigate('matches');
    };

    const pendingIntros = intros.filter(i => i.status === 'pending');

    return (
        <PageContainer>
            <div className="grid grid-cols-1 gap-4">
                <Card className="bg-gradient-to-br from-primary to-green-600 text-white">
                    <h2 className="text-2xl font-bold">Find your next big connection</h2>
                    <p className="opacity-80 mt-1 mb-4">Let our AI find 5 relevant matches for you.</p>
                    <Button onClick={handleGenerate} disabled={isLoading} variant="quiet" className="bg-white/20 hover:bg-white/30 w-full sm:w-auto">
                        {isLoading ? <div className="loader" /> : "Find 5 Matches Now (-10 credits)"}
                    </Button>
                </Card>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <StatTile icon="matches" label="Pending Intros" value={pendingIntros.length.toString()} cta={{ label: "View Intros", onClick: () => onNavigate('intros') }} />
                    <StatTile icon="inbox" label="Unread Messages" value="3" cta={{ label: "Open Inbox", onClick: () => onNavigate('inbox') }} />
                     <StatTile icon="idCard" label="AI Credits" value={creditWallet.balance.toString()} cta={{ label: "Manage Credits", onClick: () => onNavigate('billing') }} />
                     <StatTile icon="profile" label="Profile Views" value="87" cta={{ label: "Complete Profile", onClick: () => onNavigate('profile') }} />
                </div>

                 <div>
                    <h3 className="text-lg font-bold mb-2 mt-4">Quick Actions</h3>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card onClick={() => onNavigate('profileSetup')} className="text-center">
                             <Icon name="edit" className="w-8 h-8 mx-auto text-primary" />
                             <p className="mt-2 font-semibold">Edit Profile</p>
                        </Card>
                         <Card onClick={() => onNavigate('offersAndNeeds')} className="text-center">
                             <Icon name="sparkles" className="w-8 h-8 mx-auto text-primary" />
                             <p className="mt-2 font-semibold">Offers & Needs</p>
                        </Card>
                         <Card onClick={() => onNavigate('contacts', { isAdding: true })} className="text-center">
                             <Icon name="plus" className="w-8 h-8 mx-auto text-primary" />
                             <p className="mt-2 font-semibold">Add Contact</p>
                        </Card>
                         <Card onClick={() => onNavigate('billing')} className="text-center">
                             <Icon name="idCard" className="w-8 h-8 mx-auto text-primary" />
                             <p className="mt-2 font-semibold">Get Credits</p>
                        </Card>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
};

const MatchesPage: React.FC<{ onNavigate: (page: string, params?: any) => void }> = ({ onNavigate }) => {
    const { matches } = useIntroSparkStore();
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

    return (
        <div>
            <Header title="Your Daily Matches" />
            <PageContainer>
                {matches.length === 0 && (
                    <Card className="text-center">
                        <p className="text-lg font-semibold">No matches yet!</p>
                        <p className="text-gray-400 mt-2">Click "Find Matches" on your dashboard to get started.</p>
                    </Card>
                )}
                <div className="grid grid-cols-1 gap-4">
                    {matches.map(match => (
                        <Card key={match.id}>
                            <div className="flex items-start">
                                <img src={match.photoUrl} alt={match.name} className="w-16 h-16 rounded-full mr-4" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">{match.name}</h3>
                                    <p className="text-gray-400">{match.headline}</p>
                                    <p className="text-sm mt-2 p-2 bg-gray-700/50 rounded-md">{match.reason}</p>
                                    {match.matchType.startsWith('bni') && <div className="mt-2 inline-block bg-red-500/20 text-red-300 text-xs font-bold px-2 py-1 rounded">Chapter Match</div>}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button onClick={() => alert('Skipped')} variant="quiet">Skip</Button>
                                <Button onClick={() => setSelectedMatch(match)}>Accept</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </PageContainer>
            <AcceptIntroSheet match={selectedMatch} onClose={() => setSelectedMatch(null)} onIntroRequested={() => { setSelectedMatch(null); onNavigate('intros'); }} />
        </div>
    );
};

const AcceptIntroSheet: React.FC<{ match: Match | null, onClose: () => void, onIntroRequested: () => void }> = ({ match, onClose, onIntroRequested }) => {
    const { actions } = useIntroSparkStore();
    const [prepBrief, setPrepBrief] = useState('');
    const [timeSlots, setTimeSlots] = useState<{ start: string, end: string }[]>([]);
    const [selectedTime, setSelectedTime] = useState<{ start: string, end: string } | null>(null);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (match) {
            mockGeneratePrepBrief().then(setPrepBrief);
            mockGenerateTimeSlots().then(setTimeSlots);
        } else {
            setPrepBrief('');
            setTimeSlots([]);
            setSelectedTime(null);
        }
    }, [match]);

    const handleRequestIntro = () => {
        if (match && selectedTime) {
            actions.requestIntro(match, selectedTime, prepBrief);
            onIntroRequested();
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    return (
        <>
        <Sheet isOpen={!!match} onClose={onClose} title="Accept Introduction">
            {prepBrief ? (
                <div>
                    <h3 className="font-bold mb-2">Preparation Brief</h3>
                    <p className="text-gray-400 bg-gray-700/50 p-3 rounded-lg mb-4">{prepBrief}</p>
                    <h3 className="font-bold mb-2">Suggest a time</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {timeSlots.map(slot => (
                            <button key={slot.start} onClick={() => setSelectedTime(slot)} className={`p-3 rounded-lg text-left transition-colors ${selectedTime?.start === slot.start ? 'bg-primary text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                {slot.start}
                            </button>
                        ))}
                    </div>
                    <Button onClick={handleRequestIntro} disabled={!selectedTime} className="w-full mt-4">Request Intro</Button>
                </div>
            ) : <Skeleton className="h-48" />}
        </Sheet>
        <Toast isVisible={showToast} message="Intro requested! Check 'My Intros' for status."/>
        </>
    );
};

const IntrosPage: React.FC<{ onNavigate: (page: string, params?: any) => void }> = ({ onNavigate }) => {
    const { intros } = useIntroSparkStore();
    const [showToast, setShowToast] = useState(false);

    const copyLink = (token: string) => {
        const url = `${window.location.origin}/accept/${token}`;
        navigator.clipboard.writeText(url);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    }

    return (
        <div>
            <Header title="My Intros" />
            <PageContainer>
                 {intros.length === 0 && <Card className="text-center p-8"><p>You haven't requested any intros yet.</p></Card>}
                <div className="space-y-4">
                {intros.map(intro => (
                    <Card key={intro.id}>
                        <div className="flex items-center">
                            <img src={intro.bUserPhotoUrl} alt={intro.bUserName} className="w-12 h-12 rounded-full mr-4" />
                            <div>
                                <h3 className="font-bold">{intro.bUserName}</h3>
                                <p className="text-sm text-gray-400">{intro.bUserHeadline}</p>
                            </div>
                        </div>
                        <div className="mt-3 flex justify-between items-center">
                             <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                 intro.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                                 intro.status === 'scheduled' ? 'bg-green-500/20 text-green-300' :
                                 'bg-gray-500/20 text-gray-300'
                             }`}>{intro.status.charAt(0).toUpperCase() + intro.status.slice(1)}</span>
                             {intro.status === 'pending' && <Button onClick={() => copyLink(intro.token)} variant="quiet" className="h-8 px-3 text-sm"><Icon name="copy" className="w-4 h-4 mr-2"/>Copy Link</Button>}
                             {intro.status === 'scheduled' && <Button onClick={() => onNavigate('inbox', { threadId: `thread-for-${intro.id}`})} variant="quiet" className="h-8 px-3 text-sm">Open Chat</Button>}
                        </div>
                    </Card>
                ))}
                </div>
            </PageContainer>
            <Toast isVisible={showToast} message="Magic link copied to clipboard!" />
        </div>
    );
};


const InboxPage: React.FC<{ onNavigate: (page: string, params?: any) => void }> = ({ onNavigate }) => {
    const { threads } = useIntroSparkStore();
    return (
        <div>
            <Header title="Inbox" />
            <PageContainer>
                <div className="space-y-2">
                    {threads.map(thread => (
                        <Card key={thread.id} onClick={() => onNavigate('thread', { threadId: thread.id })}>
                            <div className="flex items-center">
                                <img src={`https://i.pravatar.cc/150?u=${thread.memberIds.find(id => id !== MOCK_USER_ID)}`} className="w-12 h-12 rounded-full mr-4" />
                                <div>
                                    <h3 className="font-bold">Chat with {thread.memberIds.find(id => id !== MOCK_USER_ID)}</h3>
                                    <p className="text-sm text-gray-400 truncate">{thread.lastMessagePreview}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </PageContainer>
        </div>
    );
};

const ThreadView: React.FC<{ threadId: string, onBack: () => void }> = ({ threadId, onBack }) => {
    const { threads, userProfile, actions } = useIntroSparkStore();
    const [input, setInput] = useState('');
    const thread = threads.find(t => t.id === threadId);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [thread?.messages]);

    if (!thread) return <div><Header title="Chat" onBack={onBack} /><PageContainer><p>Thread not found.</p></PageContainer></div>;
    
    const handleSend = () => {
        if (input.trim()) {
            actions.sendMessage(threadId, input.trim());
            setInput('');
        }
    };
    
    return (
        <div className="h-full flex flex-col">
            <Header title={`Chat with ${thread.memberIds.find(id => id !== userProfile.id)}`} onBack={onBack} />
            <div className="flex-1 overflow-y-auto p-4 pb-4">
                {thread.messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 mb-4 ${msg.fromUserId === userProfile.id ? 'justify-end' : 'justify-start'}`}>
                        {msg.fromUserId !== userProfile.id && <img src={`https://i.pravatar.cc/150?u=${msg.fromUserId}`} className="w-8 h-8 rounded-full" />}
                        <div className={`max-w-[75%] p-3 rounded-2xl ${msg.fromUserId === userProfile.id ? 'bg-primary text-white rounded-br-lg' : 'bg-gray-700 text-white rounded-bl-lg'}`}>
                            {msg.body}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-gray-900 border-t border-gray-700" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
                <div className="flex items-center bg-gray-800 rounded-full p-1">
                    <input 
                        type="text" 
                        value={input} 
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..." 
                        className="flex-1 bg-transparent px-4 py-2 text-white placeholder-gray-500 focus:outline-none" 
                    />
                    <Button onClick={handleSend} className="w-10 h-10 p-0 rounded-full"><Icon name="send" className="w-5 h-5" /></Button>
                </div>
            </div>
        </div>
    );
};

const ContactForm: React.FC<{ initialData?: Contact, onSave: (contact: any) => void, onCancel: () => void }> = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState(initialData || {});
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };
    
    return (
        <div className="space-y-4">
            <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Name" className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg" />
            <input name="role" value={formData.role || ''} onChange={handleChange} placeholder="Role" className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg" />
            <input name="org" value={formData.org || ''} onChange={handleChange} placeholder="Organization" className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg" />
            <input name="email" value={formData.email || ''} onChange={handleChange} placeholder="Email" className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg" />
            <input name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="Phone" className="w-full bg-gray-800 border border-gray-700 p-3 rounded-lg" />
            <div className="flex gap-2 pt-4">
                <Button onClick={onCancel} variant="quiet" className="flex-1">Cancel</Button>
                <Button onClick={() => onSave(formData)} className="flex-1">Save Contact</Button>
            </div>
        </div>
    );
};

const ContactDetailPage: React.FC<{ contactId: string, onBack: () => void, onEdit: () => void }> = ({ contactId, onBack, onEdit }) => {
    const { contacts, actions } = useIntroSparkStore();
    const contact = contacts.find(c => c.id === contactId);

    if (!contact) return <div><Header title="Contact" onBack={onBack}/><PageContainer><p>Contact not found.</p></PageContainer></div>;

    return (
        <div>
            <Header title={contact.name} onBack={onBack} />
            <PageContainer>
                <Card>
                    <h2 className="text-2xl font-bold">{contact.name}</h2>
                    <p className="text-lg text-gray-400">{contact.role} at {contact.org}</p>
                    <div className="mt-4 space-y-2">
                        <p><span className="font-semibold">Email:</span> {contact.email}</p>
                        <p><span className="font-semibold">Phone:</span> {contact.phone}</p>
                        <p><span className="font-semibold">Last Touch:</span> {contact.lastTouchAt ? contact.lastTouchAt.toLocaleDateString() : 'N/A'}</p>
                        <p><span className="font-semibold">Next Action:</span> {contact.nextActionAt ? contact.nextActionAt.toLocaleDateString() : 'N/A'}</p>
                    </div>
                </Card>
                <div className="mt-4 flex gap-2">
                    <Button onClick={() => actions.setNudge(contact.id)} variant="quiet" className="flex-1">Nudge in 7 days</Button>
                    <Button onClick={onEdit} className="flex-1">Edit Contact</Button>
                </div>
            </PageContainer>
        </div>
    );
};

const ContactsPage: React.FC<{ onNavigate: (page: string, params?: any) => void, initialParams: any }> = ({ onNavigate, initialParams }) => {
    const { contacts, actions } = useIntroSparkStore();
    const [editingContact, setEditingContact] = useState<Contact | null>(initialParams?.isAdding ? {} as Contact : null);

    const handleSave = (contactData: Contact) => {
        if (contactData.id) {
            actions.updateContact(contactData);
        } else {
            actions.addContact(contactData);
        }
        setEditingContact(null);
    };

    if (editingContact) {
        return (
            <div>
                <Header title={editingContact.id ? 'Edit Contact' : 'Add Contact'} onBack={() => setEditingContact(null)} />
                <PageContainer>
                    <ContactForm initialData={editingContact} onSave={handleSave} onCancel={() => setEditingContact(null)} />
                </PageContainer>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen">
            <Header title="Contacts" />
            <PageContainer>
                <div className="space-y-2">
                    {contacts.map(contact => (
                        <Card key={contact.id} onClick={() => onNavigate('contactDetail', { contactId: contact.id })}>
                            <h3 className="font-bold">{contact.name}</h3>
                            <p className="text-sm text-gray-400">{contact.org}</p>
                        </Card>
                    ))}
                </div>
            </PageContainer>
            <div className="fixed bottom-20 right-4 z-40">
                <Button onClick={() => setEditingContact({} as Contact)} className="w-14 h-14 p-0 rounded-full shadow-lg"><Icon name="plus" className="w-8 h-8" /></Button>
            </div>
        </div>
    );
};

const ProfilePage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const { userProfile, actions } = useIntroSparkStore();

    const handleAccountTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        actions.updateProfile({ accountType: e.target.value as 'regular' | 'bni' });
    };

    return (
        <div>
            <Header title="Profile" />
            <PageContainer>
                <div className="text-center">
                    <img src={userProfile.photoUrl} alt={userProfile.name} className="w-24 h-24 rounded-full mx-auto" />
                    <h2 className="text-2xl font-bold mt-4">{userProfile.name}</h2>
                    <p className="text-gray-400">{userProfile.headline}</p>
                </div>

                <Card className="mt-6">
                    <h3 className="font-bold mb-4">Account Type</h3>
                    <div className="flex gap-4">
                        <label className="flex-1 flex items-center gap-2 bg-gray-700 p-3 rounded-lg">
                            <input type="radio" name="accountType" value="regular" checked={userProfile.accountType === 'regular'} onChange={handleAccountTypeChange} className="form-radio bg-gray-800 border-gray-600 text-primary focus:ring-primary" />
                            <span>Regular User</span>
                        </label>
                        <label className="flex-1 flex items-center gap-2 bg-gray-700 p-3 rounded-lg">
                            <input type="radio" name="accountType" value="bni" checked={userProfile.accountType === 'bni'} onChange={handleAccountTypeChange} className="form-radio bg-gray-800 border-gray-600 text-primary focus:ring-primary" />
                            <span>BNI Member</span>
                        </label>
                    </div>
                </Card>

                <div className="mt-4 space-y-2">
                    {userProfile.accountType === 'bni' && (userProfile.bniRole === 'president' || userProfile.bniRole === 'vp') && (
                         <Card onClick={() => onNavigate('bniLeaderboard')} className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Icon name="leaderboard" className="w-6 h-6 mr-3 text-primary" />
                                <span className="font-semibold">Chapter Leaderboard</span>
                            </div>
                            <Icon name="chevronDown" className="w-5 h-5 -rotate-90 text-gray-500" />
                        </Card>
                    )}
                    <Card onClick={() => onNavigate('offersAndNeeds')} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Icon name="sparkles" className="w-6 h-6 mr-3 text-primary" />
                            <span className="font-semibold">My Offers & Needs</span>
                        </div>
                        <Icon name="chevronDown" className="w-5 h-5 -rotate-90 text-gray-500" />
                    </Card>
                    <Card onClick={() => onNavigate('cards')} className="flex items-center justify-between">
                         <div className="flex items-center">
                            <Icon name="idCard" className="w-6 h-6 mr-3 text-primary" />
                            <span className="font-semibold">My Business Cards</span>
                        </div>
                        <Icon name="chevronDown" className="w-5 h-5 -rotate-90 text-gray-500" />
                    </Card>
                     <Card onClick={() => onNavigate('scan')} className="flex items-center justify-between">
                         <div className="flex items-center">
                            <Icon name="camera" className="w-6 h-6 mr-3 text-primary" />
                            <span className="font-semibold">Scan a Card</span>
                        </div>
                        <Icon name="chevronDown" className="w-5 h-5 -rotate-90 text-gray-500" />
                    </Card>
                     <Card onClick={() => onNavigate('billing')} className="flex items-center justify-between">
                         <div className="flex items-center">
                            <Icon name="idCard" className="w-6 h-6 mr-3 text-primary" />
                            <span className="font-semibold">Billing & Credits</span>
                        </div>
                        <Icon name="chevronDown" className="w-5 h-5 -rotate-90 text-gray-500" />
                    </Card>
                </div>
                 <div className="mt-6 text-center">
                    <Button onClick={() => alert('Signing out...')} variant="quiet">Sign Out</Button>
                </div>
            </PageContainer>
        </div>
    );
};

const OffersAndNeedsEditor: React.FC<{ offers: Offer[], setOffers: (offers: Offer[]) => void, needs: Need[], setNeeds: (needs: Need[]) => void, onNext: () => void, nextText: string }> = ({ offers, setOffers, needs, setNeeds, onNext, nextText }) => {
    const [newOffer, setNewOffer] = useState('');
    const [newNeed, setNewNeed] = useState('');

    const handleAddOffer = () => {
        if (newOffer.trim()) {
            setOffers([...offers, { id: ``, userId: ``, title: newOffer, tags: [], priority: 1, archived: false }]);
            setNewOffer('');
        }
    };
    const handleAddNeed = () => {
        if (newNeed.trim()) {
            setNeeds([...needs, { id: ``, userId: ``, title: newNeed, tags: [], priority: 1, archived: false }]);
            setNewNeed('');
        }
    };
    
    return (
        <div>
            <h2 className="text-2xl font-bold mb-2">Offers & Needs</h2>
            <p className="text-gray-400 mb-6">What can you offer? What do you need? Be specific.</p>

            <div className="space-y-6">
                <div>
                    <h3 className="font-bold text-lg mb-2">My Offers (what I can provide)</h3>
                    <div className="space-y-2">
                        {offers.map((o, i) => <Card key={i}><p>{o.title}</p></Card>)}
                        <div className="flex gap-2">
                             <input type="text" value={newOffer} onChange={e => setNewOffer(e.target.value)} placeholder="e.g., Mentorship for startup founders" className="flex-1 w-full bg-gray-800 border border-gray-700 p-3 rounded-lg" />
                             <Button onClick={handleAddOffer} className="w-12 h-12 p-0"><Icon name="plus" /></Button>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-2">My Needs (what I'm looking for)</h3>
                     <div className="space-y-2">
                        {needs.map((n, i) => <Card key={i}><p>{n.title}</p></Card>)}
                         <div className="flex gap-2">
                             <input type="text" value={newNeed} onChange={e => setNewNeed(e.target.value)} placeholder="e.g., Connections to enterprise design leaders" className="flex-1 w-full bg-gray-800 border border-gray-700 p-3 rounded-lg" />
                             <Button onClick={handleAddNeed} className="w-12 h-12 p-0"><Icon name="plus" /></Button>
                        </div>
                    </div>
                </div>
            </div>
            <Button onClick={onNext} className="w-full mt-8">{nextText}</Button>
        </div>
    );
};


const OffersAndNeedsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { offers, needs, actions } = useIntroSparkStore();

    const activeOffers = offers.filter(o => !o.archived);
    const archivedOffers = offers.filter(o => o.archived);
    const activeNeeds = needs.filter(n => !n.archived);
    const archivedNeeds = needs.filter(n => n.archived);
    
    const [newOfferTitle, setNewOfferTitle] = useState('');
    const [newNeedTitle, setNewNeedTitle] = useState('');
    
    const handleAddOffer = () => {
        if(newOfferTitle.trim()) {
            actions.addOffer({ title: newOfferTitle, tags:[], priority: 1 });
            setNewOfferTitle('');
        }
    };
     const handleAddNeed = () => {
        if(newNeedTitle.trim()) {
            actions.addNeed({ title: newNeedTitle, tags:[], priority: 1 });
            setNewNeedTitle('');
        }
    };

    return (
        <div>
            <Header title="My Offers & Needs" onBack={onBack} />
            <PageContainer>
                <div className="space-y-8">
                    <div>
                        <h3 className="font-bold text-lg mb-3">Active Offers</h3>
                        {activeOffers.map(o => (
                            <Card key={o.id} className="flex justify-between items-center mb-2">
                                <span>{o.title}</span>
                                <Button onClick={() => actions.archiveOffer(o.id)} variant="quiet" className="h-8 w-8 p-0"><Icon name="archive" className="w-5 h-5"/></Button>
                            </Card>
                        ))}
                         <div className="flex gap-2 mt-2">
                           <input value={newOfferTitle} onChange={(e) => setNewOfferTitle(e.target.value)} placeholder="Add a new offer..." className="flex-1 w-full bg-gray-800 border border-gray-700 p-3 rounded-lg"/>
                           <Button onClick={handleAddOffer} className="w-12 h-12 p-0"><Icon name="plus"/></Button>
                         </div>
                    </div>
                     <div>
                        <h3 className="font-bold text-lg mb-3">Active Needs</h3>
                        {activeNeeds.map(n => (
                            <Card key={n.id} className="flex justify-between items-center mb-2">
                                <span>{n.title}</span>
                                <Button onClick={() => actions.archiveNeed(n.id)} variant="quiet" className="h-8 w-8 p-0"><Icon name="archive" className="w-5 h-5"/></Button>
                            </Card>
                        ))}
                         <div className="flex gap-2 mt-2">
                           <input value={newNeedTitle} onChange={(e) => setNewNeedTitle(e.target.value)} placeholder="Add a new need..." className="flex-1 w-full bg-gray-800 border border-gray-700 p-3 rounded-lg"/>
                           <Button onClick={handleAddNeed} className="w-12 h-12 p-0"><Icon name="plus"/></Button>
                         </div>
                    </div>

                    {archivedOffers.length > 0 && <div>
                        <h3 className="font-bold text-lg mb-3 text-gray-400">Archived Offers</h3>
                        {archivedOffers.map(o => (
                            <Card key={o.id} className="flex justify-between items-center mb-2 opacity-60">
                                <span>{o.title}</span>
                                <Button onClick={() => actions.unarchiveOffer(o.id)} variant="quiet" className="h-8 w-8 p-0"><Icon name="unarchive" className="w-5 h-5"/></Button>
                            </Card>
                        ))}
                    </div>}
                    
                     {archivedNeeds.length > 0 && <div>
                        <h3 className="font-bold text-lg mb-3 text-gray-400">Archived Needs</h3>
                        {archivedNeeds.map(n => (
                            <Card key={n.id} className="flex justify-between items-center mb-2 opacity-60">
                                <span>{n.title}</span>
                                <Button onClick={() => actions.unarchiveNeed(n.id)} variant="quiet" className="h-8 w-8 p-0"><Icon name="unarchive" className="w-5 h-5"/></Button>
                            </Card>
                        ))}
                    </div>}
                </div>
            </PageContainer>
        </div>
    );
};

// --- BNI FEATURES ---

// FIX: Added `onBack` to props destructuring to resolve reference error.
const BniLeaderDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { actions } = useIntroSparkStore();
    const [isLoading, setIsLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const handleRunMatchday = async () => {
        setIsLoading(true);
        await actions.generateBniMatchday();
        setIsLoading(false);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    }

    return (
        <div>
            <Header title="Chapter Leaderboard" onBack={onBack} />
            <PageContainer>
                 <div className="grid grid-cols-1 gap-4">
                     <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">At a Glance</h2>
                         <Button onClick={handleRunMatchday} disabled={isLoading} className="h-10 text-sm">
                             {isLoading ? <div className="loader"/> : "Run Matchday Now"}
                         </Button>
                     </div>
                    <div className="grid grid-cols-2 gap-4">
                        <StatTile icon="profile" label="Active Members" value={`${MOCK_BNI_CHAPTER_MEMBERS.length}`} />
                        <StatTile icon="matches" label="Accept Rate" value="78%" />
                        <StatTile icon="calendar" label="1:1s Scheduled" value="32" />
                        <StatTile icon="sparkles" label="Referrals Started" value="15" />
                    </div>
                    <Card>
                        <h3 className="font-bold mb-4">Member Activity</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="p-2">Name</th>
                                        <th className="p-2">Accepts</th>
                                        <th className="p-2">1:1s</th>
                                        <th className="p-2">Last Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {MOCK_BNI_CHAPTER_MEMBERS.map(member => (
                                        <tr key={member.id} className="border-b border-gray-700/50">
                                            <td className="p-2">{member.name}</td>
                                            <td className="p-2">{Math.floor(Math.random() * 10)}</td>
                                            <td className="p-2">{Math.floor(Math.random() * 5)}</td>
                                            <td className="p-2 text-sm text-gray-400">{`${Math.floor(Math.random() * 7) + 1}d ago`}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </PageContainer>
            <Toast isVisible={showToast} message="Matchday complete! Members have new matches." />
        </div>
    );
};

// --- CARD & SCANNER FEATURES ---
const CardPreview: React.FC<{ card: BusinessCard, isBni: boolean, bniProfile?: Partial<UserProfile> }> = ({ card, isBni, bniProfile }) => {
    const cardBniProfile = isBni ? (bniProfile || MOCK_INITIAL_USER_PROFILE) : undefined;
    
    return (
        <Card className={`aspect-[1.75] w-full max-w-md mx-auto flex flex-col justify-between p-6`} style={{ backgroundColor: card.theme.color }}>
             <div className="text-white">
                <h2 className="text-2xl font-bold">{card.fields.name}</h2>
                <p className="opacity-90">{card.fields.headline}</p>
                 {isBni && cardBniProfile && (
                     <div className="mt-2 text-xs opacity-80">
                         <p>{cardBniProfile.industryCategory}</p>
                         <p>BNI {cardBniProfile.chapterId}</p>
                     </div>
                 )}
            </div>
             <div className="text-right text-white text-sm">
                <p>{card.fields.email}</p>
                <p>{card.fields.phone}</p>
            </div>
        </Card>
    );
};

const CardsListPage: React.FC<{ onBack: () => void, onNavigate: (page: string, params?: any) => void }> = ({ onBack, onNavigate }) => {
    const { businessCards } = useIntroSparkStore();
    return (
        <div className="relative min-h-screen">
            <Header title="My Business Cards" onBack={onBack} />
            <PageContainer>
                 {businessCards.length === 0 && <Card className="text-center p-8"><p>You haven't created any cards yet.</p></Card>}
                <div className="space-y-4">
                {businessCards.map(card => (
                    <Card key={card.id} onClick={() => onNavigate('cardDetail', { cardId: card.id })}>
                        <h3 className="font-bold">Card: {card.fields.name}</h3>
                        <p className="text-sm text-gray-400">Views: {card.views}</p>
                    </Card>
                ))}
                </div>
            </PageContainer>
             <div className="fixed bottom-20 right-4 z-40">
                <Button onClick={() => onNavigate('cardNew')} className="w-14 h-14 p-0 rounded-full shadow-lg"><Icon name="plus" className="w-8 h-8" /></Button>
            </div>
        </div>
    );
};

const CardDetailPage: React.FC<{ cardId: string, onBack: () => void }> = ({ cardId, onBack }) => {
    const { businessCards, userProfile } = useIntroSparkStore();
    const card = businessCards.find(c => c.id === cardId);

    if (!card) return <div><Header title="Card" onBack={onBack}/><PageContainer><p>Card not found.</p></PageContainer></div>;
    
    const publicUrl = `${window.location.origin}/c/${card.shareSlug}`;

    return (
        <div>
            <Header title="Card Details" onBack={onBack} />
            <PageContainer>
                <CardPreview card={card} isBni={userProfile.accountType === 'bni'} />
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button onClick={() => navigator.clipboard.writeText(publicUrl)} variant="quiet">Copy Share Link</Button>
                    <Button onClick={() => alert('Downloading PNG...')}>Download PNG</Button>
                </div>
            </PageContainer>
        </div>
    );
};

const CardNewPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { actions, userProfile } = useIntroSparkStore();
    const isBni = userProfile.accountType === 'bni';
    
    const defaultCard: Omit<BusinessCard, 'id' | 'ownerUserId' | 'shareSlug' | 'views'> = {
        templateKey: 'A',
        theme: { color: isBni ? '#A62124' : '#22C55E' },
        fields: {
            name: userProfile.name,
            headline: userProfile.headline,
            email: userProfile.email,
            phone: '123-456-7890',
            ...(isBni && {
                chapter: userProfile.chapterId || '',
                industry: userProfile.industryCategory || '',
            })
        },
        qrUrl: ''
    };
    
    const handleSave = () => {
        actions.addBusinessCard(defaultCard);
        onBack();
    }
    
    return (
        <div>
            <Header title="Create New Card" onBack={onBack} />
            <PageContainer>
                <CardPreview card={{...defaultCard, id: 'preview', ownerUserId:'', shareSlug:'', views:0}} isBni={isBni} />
                <p className="text-center text-gray-400 mt-4">Live preview. Customization options coming soon.</p>
                <Button onClick={handleSave} className="w-full mt-4">Save Business Card</Button>
            </PageContainer>
        </div>
    );
};

const ScanPage: React.FC<{ onBack: () => void, onNavigate: (page: string, params?: any) => void }> = ({ onBack, onNavigate }) => {
    return (
        <div>
            <Header title="Scan a Card" onBack={onBack} />
            <PageContainer>
                <Card className="text-center p-8 space-y-4">
                    <Button onClick={() => onNavigate('scanReview', { scanId: 'scan-1' })} className="w-full">
                        <Icon name="camera" className="w-6 h-6 mr-2" /> Take Photo
                    </Button>
                    <Button onClick={() => onNavigate('scanReview', { scanId: 'scan-1' })} variant="quiet" className="w-full">
                         <Icon name="upload" className="w-6 h-6 mr-2" /> Upload Image
                    </Button>
                </Card>
            </PageContainer>
        </div>
    );
};

const ScanReviewPage: React.FC<{ scanId: string, onBack: () => void, onSave: () => void }> = ({ scanId, onBack, onSave }) => {
    const { cardScans, actions } = useIntroSparkStore();
    const scan = cardScans.find(s => s.id === scanId);

    if (!scan) return <div><Header title="Review Scan" onBack={onBack}/><PageContainer><p>Scan not found.</p></PageContainer></div>;
    
    return (
        <div>
            <Header title="Review Scan" onBack={onBack} />
            <PageContainer>
                <img src={scan.imageUrl} alt="Scanned card" className="rounded-lg mb-4" />
                <div className="space-y-3">
                    {Object.entries(scan.parsed).map(([key, value]) => (
                        <div key={key}>
                            <label className="text-sm text-gray-400 capitalize">{key}</label>
                            <input type="text" defaultValue={value as string} className="w-full bg-gray-800 border border-gray-700 p-2 rounded-lg mt-1" />
                        </div>
                    ))}
                </div>
                 <Button onClick={() => { actions.saveScanAsContact(scan); onSave(); }} className="w-full mt-6">Save to Contacts</Button>
            </PageContainer>
        </div>
    );
};

// --- BILLING PAGE ---
const BillingPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { creditWallet, creditLog } = useIntroSparkStore();
    const [showToast, setShowToast] = useState(false);
    
    const handleTopUp = () => {
        // In a real app, this would trigger a payment flow.
        // For now, we just show a confirmation.
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    }

    return (
        <div>
            <Header title="Billing & Credits" onBack={onBack} />
            <PageContainer>
                <Card className="text-center">
                    <p className="text-gray-400">Current Balance</p>
                    <p className="text-5xl font-bold my-2">{creditWallet.balance}</p>
                    <p className="text-sm text-gray-500">Next refill on {creditWallet.lastGrantAt ? new Date(creditWallet.lastGrantAt.setDate(creditWallet.lastGrantAt.getDate() + 30)).toLocaleDateString() : 'N/A'}</p>
                </Card>
                
                <Card className="mt-4">
                     <h3 className="text-lg font-bold mb-4">Purchase Credits</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <Card onClick={handleTopUp} className="text-center bg-gray-700/50">
                             <p className="text-2xl font-bold">100</p>
                             <p className="text-gray-400">Credits</p>
                             <p className="mt-2 font-semibold text-primary">$10.00</p>
                         </Card>
                         <Card onClick={handleTopUp} className="text-center bg-primary/20 border-primary">
                             <p className="text-2xl font-bold">550</p>
                             <p className="text-gray-400">Credits</p>
                             <p className="mt-2 font-semibold text-primary">$50.00</p>
                         </Card>
                         <Card onClick={handleTopUp} className="text-center bg-gray-700/50">
                             <p className="text-2xl font-bold">1200</p>
                             <p className="text-gray-400">Credits</p>
                             <p className="mt-2 font-semibold text-primary">$100.00</p>
                         </Card>
                     </div>
                </Card>

                <Card className="mt-4">
                    <h3 className="text-lg font-bold mb-4">Transaction History</h3>
                    <div className="space-y-3">
                        {creditLog.length === 0 && <p className="text-gray-500">No recent transactions.</p>}
                        {creditLog.map(log => (
                            <div key={log.id} className="flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-semibold">{log.action}</p>
                                    <p className="text-gray-400 text-xs">{new Date(log.at).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${log.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>{log.delta > 0 ? '+' : ''}{log.delta}</p>
                                    <p className="text-gray-500 text-xs">Bal: {log.balanceAfter}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </PageContainer>
            <Toast isVisible={showToast} message="Payment flow not implemented in demo." />
        </div>
    );
};


// --- PUBLIC PAGES ---

const PublicAcceptIntroPage: React.FC<{ token: string }> = ({ token }) => {
    const { intros, actions } = useIntroSparkStore();
    const intro = intros.find(i => i.token === token);
    const [selectedTime, setSelectedTime] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(false);
    // FIX: Added state to hold async time slots and useEffect to fetch them.
    const [timeSlots, setTimeSlots] = useState<{ start: string, end: string }[]>([]);

    useEffect(() => {
        mockGenerateTimeSlots().then(setTimeSlots);
    }, []);
    
    const handleConfirm = () => {
        actions.acceptIntro(token, selectedTime);
        setIsConfirmed(true);
    };

    if (isConfirmed) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 text-white">
                <Card className="max-w-md w-full text-center">
                    <Icon name="check" className="w-16 h-16 mx-auto bg-green-500/20 text-green-300 p-3 rounded-full" />
                    <h2 className="text-2xl font-bold mt-4">Introduction Confirmed!</h2>
                    <p className="text-gray-400 mt-2">A calendar invite has been sent to both parties. Thank you for using IntroSpark.</p>
                </Card>
            </div>
        )
    }

    if (!intro) return <div className="text-center p-8">Invalid or expired link.</div>;
    
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 text-white">
            <Card className="max-w-md w-full">
                <h2 className="text-2xl font-bold text-center">You're invited!</h2>
                <p className="text-center text-gray-400 mb-6">An introduction has been requested.</p>

                <div className="text-center mb-6">
                     <img src={intro.bUserPhotoUrl} className="w-20 h-20 rounded-full inline-block" />
                     <h3 className="font-bold text-lg mt-2">{intro.bUserName}</h3>
                     <p className="text-gray-400 text-sm">{intro.bUserHeadline}</p>
                </div>

                <h3 className="font-bold mb-2">Preparation Brief</h3>
                <p className="text-gray-400 bg-gray-700/50 p-3 rounded-lg mb-4">{intro.prepBrief}</p>
                
                <h3 className="font-bold mb-2">Select a time to meet</h3>
                <div className="grid grid-cols-1 gap-2">
                    {/* FIX: Mapped over `timeSlots` state instead of attempting to render a Promise. */}
                    {timeSlots.map(slot => (
                        <button key={slot.start} onClick={() => setSelectedTime(slot.start)} className={`p-3 rounded-lg text-left transition-colors ${selectedTime === slot.start ? 'bg-primary text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                            {slot.start}
                        </button>
                    ))}
                </div>

                <Button onClick={handleConfirm} disabled={!selectedTime} className="w-full mt-6">Confirm Meeting</Button>
            </Card>
        </div>
    );
};

const PublicCardPage: React.FC<{ slug: string }> = ({ slug }) => {
    const { businessCards, userProfile } = useIntroSparkStore();
    const card = businessCards.find(c => c.shareSlug === slug);
    if (!card) return <div className="text-center p-8">Card not found.</div>;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
             <div className="w-full max-w-md">
                 <CardPreview card={card} isBni={userProfile.accountType === 'bni'} />
                 <div className="mt-4 grid grid-cols-2 gap-2">
                     <Button onClick={() => alert('Saving contact...')} variant="quiet">Save Contact</Button>
                     <Button onClick={() => window.location.href = `mailto:${card.fields.email}`}>Email</Button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP ---
const App: React.FC = () => {
    const { userProfile } = useIntroSparkStore();
    const [page, setPage] = useState('home');
    const [params, setParams] = useState<any>({});
    const [publicRoute, setPublicRoute] = useState<{ page: string; params: any } | null>(null);

    useEffect(() => {
        const path = window.location.pathname;
        if (path.startsWith('/c/')) {
            setPublicRoute({ page: 'publicCard', params: { slug: path.split('/')[2] } });
        } else if (path.startsWith('/accept/')) {
            setPublicRoute({ page: 'publicAcceptIntro', params: { token: path.split('/')[2] } });
        }
    }, []);

    const handleNavigate = (newPage: string, newParams: any = {}) => {
        setPage(newPage);
        setParams(newParams);
        window.scrollTo(0, 0);
    };

    const renderPage = () => {
        if (publicRoute) {
            switch (publicRoute.page) {
                case 'publicCard': return <PublicCardPage slug={publicRoute.params.slug} />;
                case 'publicAcceptIntro': return <PublicAcceptIntroPage token={publicRoute.params.token} />;
                default: return <div>404 Not Found</div>;
            }
        }
        
        if (!userProfile.onboardingCompleted) {
            return <OnboardingFlow onComplete={() => handleNavigate('home')} />;
        }

        switch (page) {
            case 'home': return <DashboardPage onNavigate={handleNavigate} />;
            case 'matches': return <MatchesPage onNavigate={handleNavigate} />;
            case 'inbox': return <InboxPage onNavigate={handleNavigate} />;
            case 'thread': return <ThreadView threadId={params.threadId} onBack={() => handleNavigate('inbox')} />;
            case 'contacts': return <ContactsPage onNavigate={handleNavigate} initialParams={params} />;
            case 'contactDetail': return <ContactDetailPage contactId={params.contactId} onBack={() => handleNavigate('contacts')} onEdit={() => alert('Edit form here')} />;
            case 'profile': return <ProfilePage onNavigate={handleNavigate} />;
            case 'offersAndNeeds': return <OffersAndNeedsPage onBack={() => handleNavigate('profile')} />;
            case 'profileSetup': return <OnboardingFlow onComplete={() => handleNavigate('profile')} />;
            case 'intros': return <IntrosPage onNavigate={handleNavigate} />;
            case 'bniLeaderboard': return <BniLeaderDashboard onBack={() => handleNavigate('profile')} />;
            case 'cards': return <CardsListPage onBack={() => handleNavigate('profile')} onNavigate={handleNavigate} />;
            case 'cardDetail': return <CardDetailPage cardId={params.cardId} onBack={() => handleNavigate('cards')} />;
            case 'cardNew': return <CardNewPage onBack={() => handleNavigate('cards')} />;
            case 'scan': return <ScanPage onBack={() => handleNavigate('profile')} onNavigate={handleNavigate} />;
            case 'scanReview': return <ScanReviewPage scanId={params.scanId} onBack={() => handleNavigate('scan')} onSave={() => handleNavigate('contacts')} />;
            case 'billing': return <BillingPage onBack={() => handleNavigate('profile')} />;
            default: return <div>Page not found</div>;
        }
    };
    
    const isPublicPage = !!publicRoute;
    const isFullScreenPage = ['thread', 'contactDetail'].includes(page) && !isPublicPage;
    
    const appClassName = userProfile.accountType === 'bni' ? 'bni-theme' : '';

    return (
        <div className={appClassName}>
             <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-[280px_1fr]">
                {/* Desktop Sidebar (placeholder) */}
                <aside className="hidden lg:block border-r border-gray-700"></aside>
                
                <main className="relative">
                    {renderPage()}
                </main>
            </div>
            
            {!isFullScreenPage && !isPublicPage && userProfile.onboardingCompleted && (
                 <BottomNav activeTab={page} onTabChange={handleNavigate} />
            )}
        </div>
    );
};


const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <AppProvider>
                <App />
            </AppProvider>
        </React.StrictMode>
    );
}
