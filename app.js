// --- CONFIGURATION: INTEGRATED SYSTEM ID ---
const DISCORD_CLIENT_ID = '1497380577320374272'; 
const REDIRECT_URI = window.location.origin + '/';

// 1. Grab UI elements from the HTML DOM
const turtleForm = document.getElementById('turtle-form');
const loginOverlay = document.getElementById('login-overlay');
const discordLoginBtn = document.getElementById('discord-login-btn');
const userAvatarContainer = document.getElementById('user-avatar-container');
const logoutNavItem = document.getElementById('logout-nav-item');
const turtleTextarea = document.getElementById('turtle-textarea');
const charCounter = document.getElementById('char-counter');
const timelineFeed = document.getElementById('timeline-feed');

// 2. Global Runtime Application State
let communityPosts = [];
let currentUser = null; 

// 3. Application Lifecycle Management Entry Point
document.addEventListener('DOMContentLoaded', () => {
    checkDiscordCallback();
    loadPostsFromStorage();
});

// 4. Discord OAuth2 Flow Initiator Button Listener
discordLoginBtn.addEventListener('click', () => {
    const authUrl = `https://discord.com{DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify`;
    window.location.href = authUrl;
});

// 5. Logout Session Link Action Handler
logoutNavItem.addEventListener('click', (event) => {
    event.preventDefault();
    handleUserLogout();
});

// 6. Parse Return URL Hashes for Access Tokens
function checkDiscordCallback() {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragment.get('access_token');

    if (accessToken) {
        window.history.replaceState({}, document.title, window.location.pathname);
        fetchDiscordUserProfile(accessToken);
    } else {
        const cachedUser = localStorage.getItem('turtle_user');
        if (cachedUser) {
            currentUser = JSON.parse(cachedUser);
            updateUIForLoggedInUser();
        }
    }
}

// 7. Fetch Protected Profile Specs directly from Discord APIs
async function fetchDiscordUserProfile(token) {
    try {
        const response = await fetch('https://discord.com', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Authentication handshake failure');
        
        const data = await response.json();
        
        currentUser = {
            username: data.global_name || data.username,
            handle: `@${data.username}`,
            avatarUrl: data.avatar 
                ? `https://discordapp.com{data.id}/${data.avatar}.png`
                : `https://discordapp.com{data.discriminator % 5}.png`
        };

        localStorage.setItem('turtle_user', JSON.stringify(currentUser));
        updateUIForLoggedInUser();
    } catch (error) {
        console.error('Error fetching Discord user data profile:', error);
        alert('Authentication failed. Please verify configurations.');
    }
}

// 8. Adjust Layout Interfaces According to Login States
function updateUIForLoggedInUser() {
    if (!currentUser) return;

    loginOverlay.classList.add('hidden');
    turtleForm.classList.remove('hidden');
    logoutNavItem.classList.remove('hidden');

    userAvatarContainer.innerHTML = `<img src="${currentUser.avatarUrl}" class="user-real-avatar" alt="Avatar">`;
}

// 9. Terminate Session State and Clear Security Tokens
function handleUserLogout() {
    localStorage.removeItem('turtle_user');
    currentUser = null;

    loginOverlay.classList.remove('hidden');
    turtleForm.classList.add('hidden');
    logoutNavItem.classList.add('hidden');

    userAvatarContainer.innerHTML = `<div class="user-avatar-placeholder"></div>`;
}

// 10. Character Counter Component Logic
turtleTextarea.addEventListener('input', () => {
    const maxLength = 280;
    const currentLength = turtleTextarea.value.length;
    const remaining = maxLength - currentLength;
    charCounter.textContent = `${remaining} characters remaining`;
});

// 11. Create and Save a Live Interactive Post Card Entry
turtleForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!currentUser) return;

    const postContent = turtleTextarea.value.trim();
    if (!postContent) return;

    const postObject = {
        id: Date.now().toString(),
        author: currentUser.username,
        handle: currentUser.handle,
        avatarUrl: currentUser.avatarUrl,
        timestamp: "Just now",
        content: postContent
    };

    communityPosts.unshift(postObject);
    savePostsToStorage();
    renderSinglePost(postObject, true);

    turtleForm.reset();
    charCounter.textContent = '280 characters remaining';
});

// 12. DOM Core Rendering Pipeline Engine
function renderSinglePost(post, insertAtTop = false) {
    const postCard = document.createElement('article');
    postCard.classList.add('post-card');

    const avatarImgTag = post.avatarUrl 
        ? `<img src="${post.avatarUrl}" class="user-real-avatar" alt="User Image">`
        : `<div class="user-avatar-placeholder"></div>`;

    postCard.innerHTML = `
        <div class="avatar-column">
            ${avatarImgTag}
        </div>
        <div class="form-column">
            <div class="post-meta">
                <span class="post-author">${escapeHTML(post.author)}</span>
                <span class="post-handle">${escapeHTML(post.handle)}</span>
                <span class="post-time">• ${escapeHTML(post.timestamp)}</span>
            </div>
            <div class="post-content">${escapeHTML(post.content)}</div>
        </div>
    `;

    if (insertAtTop) {
        timelineFeed.insertBefore(postCard, timelineFeed.firstChild);
    } else {
        timelineFeed.appendChild(postCard);
    }
}

// 13. LocalStorage Handlers
function savePostsToStorage() {
    localStorage.setItem('turtle_posts', JSON.stringify(communityPosts));
}

function loadPostsFromStorage() {
    const storedData = localStorage.getItem('turtle_posts');
    timelineFeed.innerHTML = '';

    if (storedData) {
        communityPosts = JSON.parse(storedData);
        communityPosts.forEach(post => renderSinglePost(post, false));
    } else {
        const welcomePost = {
            id: 'welcome',
            author: 'Orange Foundation',
            handle: '@orange_fdn',
            timestamp: 'System Initialized',
            content: 'Login with your Discord profile securely to start contributing posts onto our open timeline feed grid setup layout! 🐢🔥'
        };
        communityPosts.push(welcomePost);
        renderSinglePost(welcomePost);
    }
}

// 14. Security Escape Handler
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}
