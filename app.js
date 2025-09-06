/*
 * WhatsApp Clone - Complete JavaScript Application
 * 
 * SETUP INSTRUCTIONS:
 * 1. Enable Email/Password authentication in Firebase Console
 * 2. Enable Realtime Database in test mode or add the provided security rules
 * 3. Replace firebaseConfig with your actual Firebase configuration
 * 4. Test with two browser windows using different accounts
 * 
 * FEATURES:
 * - User authentication (signup/login)
 * - Real-time messaging
 * - Friend management (add, block, unblock)
 * - Friend requests system
 * - Audio/Video calling with WebRTC
 * - Online presence tracking
 * - Message status (sent, delivered, read)
 * - Typing indicators
 * - Emoji picker
 * - Responsive design
 * 
 * LIMITATIONS:
 * - WebRTC requires TURN server for production use
 * - Database rules need to be hardened for production security
 * - File sharing not implemented (can be added)
 * - Push notifications not implemented
 */

// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
    apiKey: "AIzaSyCPg4Yqiw9YBLkG03nyNtW873CaU3SxHhc",
    authDomain: "self-2ff34.firebaseapp.com",
    databaseURL: "https://self-2ff34-default-rtdb.firebaseio.com",
    projectId: "self-2ff34",
    storageBucket: "self-2ff34.firebasestorage.app",
    messagingSenderId: "419819673860",
    appId: "1:419819673860:web:7b3d080e9a3f24131cd851",
    measurementId: "G-CQDZLDZRWT"
};

// ===== GLOBAL VARIABLES =====
let app, auth, database;
let currentUser = null;
let currentChatUser = null;
let currentCall = null;
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let typingTimeout = null;
let onlineUsersRef = null;
let messagesRef = null;
let friendRequestsRef = null;

// WebRTC Configuration
const rtcConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// ===== EMOJI DATA =====
const emojiData = {
    recent: ['😀', '😂', '❤️', '👍', '😊', '🔥', '💯', '😍'],
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
    people: ['👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👩', '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🙇', '🤦', '🤷', '👮', '🕵️', '💂', '👷', '🤴', '👸', '👳', '👲'],
    nature: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇'],
    food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🍞'],
    activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️'],
    travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞'],
    objects: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️'],
    symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐'],
    flags: ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇫', '🇦🇽', '🇦🇱', '🇩🇿', '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶', '🇦🇬', '🇦🇷', '🇦🇲', '🇦🇼', '🇦🇺', '🇦🇹', '🇦🇿', '🇧🇸', '🇧🇭', '🇧🇩', '🇧🇧', '🇧🇾']
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize Firebase
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.getAuth(app);
        database = firebase.getDatabase(app);
        
        // Initialize app
        await initializeApp();
        
        console.log('WhatsApp Clone initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('Error initializing app', 'error');
    }
});

// ===== APP INITIALIZATION =====
async function initializeApp() {
    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 1500);
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup emoji picker
    setupEmojiPicker();
    
    // Check authentication state
    firebase.onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            showMainApp();
            setupUserPresence();
            loadUserData();
            loadFriends();
            loadFriendRequests();
            loadChats();
        } else {
            currentUser = null;
            showAuthPage();
        }
    });
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Authentication forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    
    // Form switching
    document.querySelectorAll('.switch-form').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetForm = e.target.dataset.target;
            switchAuthForm(targetForm);
        });
    });
    
    // Password toggles
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = e.target.closest('.input-wrapper').querySelector('input');
            const icon = e.target.querySelector('i') || e.target;
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
    
    // Username availability check
    const usernameInput = document.getElementById('signup-username');
    if (usernameInput) {
        usernameInput.addEventListener('input', debounce(checkUsernameAvailability, 500));
    }
    
    // Password strength check
    const passwordInput = document.getElementById('signup-password');
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
    
    // Password match check
    const confirmPasswordInput = document.getElementById('confirm-password');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
    
    // Sidebar actions
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('settings-btn').addEventListener('click', () => showModal('settings-modal'));
    document.getElementById('new-chat-btn').addEventListener('click', () => showModal('add-friend-modal'));
    
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    document.getElementById('search-clear').addEventListener('click', clearSearch);
    
    // Chat interface
    document.getElementById('back-to-sidebar').addEventListener('click', closeChatInterface);
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', handleMessageKeypress);
    document.getElementById('message-input').addEventListener('input', handleTyping);
    
    // Call buttons
    document.getElementById('audio-call-btn').addEventListener('click', () => initiateCall('audio'));
    document.getElementById('video-call-btn').addEventListener('click', () => initiateCall('video'));
    document.getElementById('end-call-btn').addEventListener('click', endCall);
    document.getElementById('accept-call-btn').addEventListener('click', acceptCall);
    document.getElementById('decline-call-btn').addEventListener('click', declineCall);
    
    // Call controls
    document.getElementById('mute-btn').addEventListener('click', toggleMute);
    document.getElementById('camera-btn').addEventListener('click', toggleCamera);
    document.getElementById('speaker-btn').addEventListener('click', toggleSpeaker);
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    
    // Chat menu
    document.getElementById('chat-menu-btn').addEventListener('click', toggleChatMenu);
    document.getElementById('block-user-btn').addEventListener('click', blockUser);
    document.getElementById('clear-chat-btn').addEventListener('click', clearChat);
    
    // Modals
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.dataset.modal;
            hideModal(modalId);
        });
    });
    
    // Modal overlays
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.add('hidden');
            }
        });
    });
    
    // Friend search
    document.getElementById('search-friend-btn').addEventListener('click', searchFriends);
    document.getElementById('friend-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchFriends();
        }
    });
    
    // Emoji picker
    document.getElementById('emoji-btn').addEventListener('click', toggleEmojiPicker);
    
    // Settings
    document.getElementById('dark-mode').addEventListener('change', toggleDarkMode);
    
    // Context menu
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', hideContextMenu);
    
    // Window events
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
}

// ===== AUTHENTICATION =====
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        showButtonLoading(submitBtn, true);
        
        const userCredential = await firebase.signInWithEmailAndPassword(auth, email, password);
        
        showToast('Login successful!', 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        showToast(getErrorMessage(error.code), 'error');
    } finally {
        showButtonLoading(submitBtn, false);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validation
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        showButtonLoading(submitBtn, true);
        
        // Check username availability
        const usernameExists = await checkUsernameExists(username);
        if (usernameExists) {
            showToast('Username already taken', 'error');
            return;
        }
        
        // Create user account
        const userCredential = await firebase.createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save user data to database
        await firebase.set(firebase.ref(database, `users/${user.uid}`), {
            uid: user.uid,
            username: username,
            email: email,
            createdAt: firebase.serverTimestamp(),
            online: true,
            lastSeen: firebase.serverTimestamp(),
            status: 'Hey there! I am using WhatsApp Clone',
            avatar: generateAvatarUrl(username),
            friends: {},
            blocked: {},
            settings: {
                notifications: true,
                readReceipts: true,
                lastSeen: 'everyone',
                profilePhoto: 'everyone'
            }
        });
        
        showToast('Account created successfully!', 'success');
        
    } catch (error) {
        console.error('Signup error:', error);
        showToast(getErrorMessage(error.code), 'error');
    } finally {
        showButtonLoading(submitBtn, false);
    }
}

async function handleLogout() {
    try {
        if (currentUser) {
            // Update user status to offline
            await firebase.set(firebase.ref(database, `users/${currentUser.uid}/online`), false);
            await firebase.set(firebase.ref(database, `users/${currentUser.uid}/lastSeen`), firebase.serverTimestamp());
        }
        
        await firebase.signOut(auth);
        showToast('Logged out successfully', 'success');
        
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out', 'error');
    }
}

// ===== USER INTERFACE =====
function showAuthPage() {
    document.getElementById('auth-page').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('auth-page').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
}

function switchAuthForm(targetForm) {
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    document.getElementById(targetForm).classList.add('active');
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function showButtonLoading(button, loading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    
    if (loading) {
        button.disabled = true;
        btnText.style.opacity = '0';
        btnLoader.classList.remove('hidden');
    } else {
        button.disabled = false;
        btnText.style.opacity = '1';
        btnLoader.classList.add('hidden');
    }
}

// ===== USER PRESENCE =====
function setupUserPresence() {
    if (!currentUser) return;
    
    const userRef = firebase.ref(database, `users/${currentUser.uid}`);
    const onlineRef = firebase.ref(database, `users/${currentUser.uid}/online`);
    const lastSeenRef = firebase.ref(database, `users/${currentUser.uid}/lastSeen`);
    
    // Set user online
    firebase.set(onlineRef, true);
    firebase.set(lastSeenRef, firebase.serverTimestamp());
    
    // Set user offline when disconnected
    firebase.onDisconnect(onlineRef).set(false);
    firebase.onDisconnect(lastSeenRef).set(firebase.serverTimestamp());
    
    // Update last seen periodically
    setInterval(() => {
        if (currentUser) {
            firebase.set(lastSeenRef, firebase.serverTimestamp());
        }
    }, 30000); // Every 30 seconds
}

// ===== USER DATA =====
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        const userRef = firebase.ref(database, `users/${currentUser.uid}`);
        const snapshot = await firebase.get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            
            // Update UI with user data
            document.getElementById('user-display-name').textContent = userData.username || 'User';
            document.getElementById('user-avatar-img').src = userData.avatar || generateAvatarUrl(userData.username);
            
            // Update profile modal
            document.getElementById('profile-username').value = userData.username || '';
            document.getElementById('profile-email').value = userData.email || '';
            document.getElementById('profile-status').value = userData.status || '';
            document.getElementById('profile-avatar').src = userData.avatar || generateAvatarUrl(userData.username);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// ===== USERNAME VALIDATION =====
async function checkUsernameAvailability() {
    const username = document.getElementById('signup-username').value;
    const availableIcon = document.querySelector('.username-available');
    const takenIcon = document.querySelector('.username-taken');
    
    if (username.length < 3) {
        availableIcon.classList.add('hidden');
        takenIcon.classList.add('hidden');
        return;
    }
    
    try {
        const exists = await checkUsernameExists(username);
        
        if (exists) {
            availableIcon.classList.add('hidden');
            takenIcon.classList.remove('hidden');
        } else {
            takenIcon.classList.add('hidden');
            availableIcon.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error checking username:', error);
    }
}

async function checkUsernameExists(username) {
    const usersRef = firebase.ref(database, 'users');
    const snapshot = await firebase.get(firebase.query(usersRef, firebase.orderByChild('username'), firebase.equalTo(username)));
    return snapshot.exists();
}

// ===== PASSWORD VALIDATION =====
function checkPasswordStrength() {
    const password = document.getElementById('signup-password').value;
    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    let strength = 0;
    let strengthLabel = 'Weak';
    
    if (password.length >= 6) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    
    strengthFill.className = 'strength-fill';
    
    switch (strength) {
        case 0:
        case 1:
            strengthFill.classList.add('weak');
            strengthLabel = 'Weak';
            break;
        case 2:
            strengthFill.classList.add('fair');
            strengthLabel = 'Fair';
            break;
        case 3:
            strengthFill.classList.add('good');
            strengthLabel = 'Good';
            break;
        case 4:
        case 5:
            strengthFill.classList.add('strong');
            strengthLabel = 'Strong';
            break;
    }
    
    strengthText.textContent = `Password strength: ${strengthLabel}`;
}

function checkPasswordMatch() {
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const successIcon = document.querySelector('.match-success');
    const errorIcon = document.querySelector('.match-error');
    
    if (confirmPassword.length === 0) {
        successIcon.classList.add('hidden');
        errorIcon.classList.add('hidden');
        return;
    }
    
    if (password === confirmPassword) {
        errorIcon.classList.add('hidden');
        successIcon.classList.remove('hidden');
    } else {
        successIcon.classList.add('hidden');
        errorIcon.classList.remove('hidden');
    }
}

// ===== FRIENDS MANAGEMENT =====
async function loadFriends() {
    if (!currentUser) return;
    
    try {
        const friendsRef = firebase.ref(database, `users/${currentUser.uid}/friends`);
        
        firebase.on(friendsRef, 'value', async (snapshot) => {
            const friendsList = document.getElementById('friends-list');
            friendsList.innerHTML = '';
            
            if (snapshot.exists()) {
                const friends = snapshot.val();
                const friendIds = Object.keys(friends);
                
                for (const friendId of friendIds) {
                    const friendData = await getUserData(friendId);
                    if (friendData) {
                        const friendElement = createFriendElement(friendData);
                        friendsList.appendChild(friendElement);
                    }
                }
                
                // Update friends badge
                updateTabBadge('friends', friendIds.length);
            } else {
                friendsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No Friends Yet</h3>
                        <p>Add friends to start chatting</p>
                        <button class="btn btn-primary" onclick="showModal('add-friend-modal')">Add Friends</button>
                    </div>
                `;
            }
        });
    } catch (error) {
        console.error('Error loading friends:', error);
    }
}

async function loadFriendRequests() {
    if (!currentUser) return;
    
    try {
        const requestsRef = firebase.ref(database, `friendRequests/${currentUser.uid}`);
        
        firebase.on(requestsRef, 'value', async (snapshot) => {
            const requestsList = document.getElementById('requests-list');
            requestsList.innerHTML = '';
            
            if (snapshot.exists()) {
                const requests = snapshot.val();
                const requestIds = Object.keys(requests);
                
                for (const requestId of requestIds) {
                    const request = requests[requestId];
                    if (request.status === 'pending') {
                        const senderData = await getUserData(request.from);
                        if (senderData) {
                            const requestElement = createFriendRequestElement(senderData, request);
                            requestsList.appendChild(requestElement);
                        }
                    }
                }
                
                // Update requests badge
                const pendingCount = requestIds.filter(id => requests[id].status === 'pending').length;
                updateTabBadge('requests', pendingCount);
            } else {
                requestsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-user-plus"></i>
                        <h3>No Friend Requests</h3>
                        <p>Friend requests will appear here</p>
                    </div>
                `;
                updateTabBadge('requests', 0);
            }
        });
    } catch (error) {
        console.error('Error loading friend requests:', error);
    }
}

async function searchFriends() {
    const searchTerm = document.getElementById('friend-search').value.trim();
    const resultsContainer = document.getElementById('search-results');
    
    if (!searchTerm) {
        resultsContainer.innerHTML = '';
        return;
    }
    
    try {
        resultsContainer.innerHTML = '<div class="text-center">Searching...</div>';
        
        // Search by email
        const emailResults = await searchUsersByEmail(searchTerm);
        
        // Search by username
        const usernameResults = await searchUsersByUsername(searchTerm);
        
        // Combine and deduplicate results
        const allResults = [...emailResults, ...usernameResults];
        const uniqueResults = allResults.filter((user, index, self) => 
            index === self.findIndex(u => u.uid === user.uid)
        );
        
        // Filter out current user and existing friends
        const filteredResults = uniqueResults.filter(user => 
            user.uid !== currentUser.uid && !await isFriend(user.uid)
        );
        
        resultsContainer.innerHTML = '';
        
        if (filteredResults.length > 0) {
            filteredResults.forEach(user => {
                const resultElement = createSearchResultElement(user);
                resultsContainer.appendChild(resultElement);
            });
        } else {
            resultsContainer.innerHTML = '<div class="text-center text-gray-500">No users found</div>';
        }
        
    } catch (error) {
        console.error('Error searching friends:', error);
        resultsContainer.innerHTML = '<div class="text-center text-red-500">Error searching users</div>';
    }
}

async function sendFriendRequest(userId) {
    if (!currentUser) return;
    
    try {
        const requestId = generateId();
        const requestData = {
            id: requestId,
            from: currentUser.uid,
            to: userId,
            status: 'pending',
            timestamp: firebase.serverTimestamp()
        };
        
        // Add to recipient's friend requests
        await firebase.set(firebase.ref(database, `friendRequests/${userId}/${requestId}`), requestData);
        
        // Add to sender's sent requests
        await firebase.set(firebase.ref(database, `sentRequests/${currentUser.uid}/${requestId}`), requestData);
        
        showToast('Friend request sent!', 'success');
        
        // Update UI
        const sendBtn = document.querySelector(`[data-user-id="${userId}"] .btn-primary`);
        if (sendBtn) {
            sendBtn.textContent = 'Request Sent';
            sendBtn.disabled = true;
            sendBtn.classList.remove('btn-primary');
            sendBtn.classList.add('btn-secondary');
        }
        
    } catch (error) {
        console.error('Error sending friend request:', error);
        showToast('Error sending friend request', 'error');
    }
}

async function acceptFriendRequest(requestId, fromUserId) {
    if (!currentUser) return;
    
    try {
        // Add to both users' friends lists
        await firebase.set(firebase.ref(database, `users/${currentUser.uid}/friends/${fromUserId}`), {
            addedAt: firebase.serverTimestamp()
        });
        
        await firebase.set(firebase.ref(database, `users/${fromUserId}/friends/${currentUser.uid`), {
            addedAt: firebase.serverTimestamp()
        });
        
        // Update request status
        await firebase.set(firebase.ref(database, `friendRequests/${currentUser.uid}/${requestId}/status`), 'accepted');
        await firebase.set(firebase.ref(database, `sentRequests/${fromUserId}/${requestId}/status`), 'accepted');
        
        showToast('Friend request accepted!', 'success');
        
    } catch (error) {
        console.error('Error accepting friend request:', error);
        showToast('Error accepting friend request', 'error');
    }
}

async function declineFriendRequest(requestId, fromUserId) {
    if (!currentUser) return;
    
    try {
        // Update request status
        await firebase.set(firebase.ref(database, `friendRequests/${currentUser.uid}/${requestId}/status`), 'declined');
        await firebase.set(firebase.ref(database, `sentRequests/${fromUserId}/${requestId}/status`), 'declined');
        
        showToast('Friend request declined', 'info');
        
    } catch (error) {
        console.error('Error declining friend request:', error);
        showToast('Error declining friend request', 'error');
    }
}

// ===== CHAT FUNCTIONALITY =====
async function loadChats() {
    if (!currentUser) return;
    
    try {
        const chatsRef = firebase.ref(database, `userChats/${currentUser.uid}`);
        
        firebase.on(chatsRef, 'value', async (snapshot) => {
            const chatsList = document.getElementById('chat-list');
            chatsList.innerHTML = '';
            
            if (snapshot.exists()) {
                const chats = snapshot.val();
                const chatIds = Object.keys(chats).sort((a, b) => 
                    (chats[b].lastMessageTime || 0) - (chats[a].lastMessageTime || 0)
                );
                
                for (const chatId of chatIds) {
                    const chat = chats[chatId];
                    const otherUserId = chat.participants.find(id => id !== currentUser.uid);
                    const otherUserData = await getUserData(otherUserId);
                    
                    if (otherUserData) {
                        const chatElement = createChatElement(chatId, otherUserData, chat);
                        chatsList.appendChild(chatElement);
                    }
                }
                
                // Update chats badge
                const unreadCount = Object.values(chats).reduce((count, chat) => 
                    count + (chat.unreadCount || 0), 0
                );
                updateTabBadge('chats', unreadCount);
            } else {
                chatsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-comments"></i>
                        <h3>No Chats Yet</h3>
                        <p>Start a conversation with your friends</p>
                        <button class="btn btn-primary" onclick="showModal('add-friend-modal')">Start New Chat</button>
                    </div>
                `;
            }
        });
    } catch (error) {
        console.error('Error loading chats:', error);
    }
}

async function openChat(userId) {
    if (!currentUser) return;
    
    try {
        currentChatUser = await getUserData(userId);
        if (!currentChatUser) return;
        
        // Update UI
        document.getElementById('chat-user-name').textContent = currentChatUser.username;
        document.getElementById('chat-user-avatar').src = currentChatUser.avatar || generateAvatarUrl(currentChatUser.username);
        document.getElementById('chat-user-online').style.display = currentChatUser.online ? 'block' : 'none';
        
        // Update status
        updateChatUserStatus();
        
        // Show chat interface
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('chat-interface').classList.remove('hidden');
        
        // Load messages
        loadMessages(userId);
        
        // Mark messages as read
        markMessagesAsRead(userId);
        
        // Setup typing listener
        setupTypingListener(userId);
        
        // Mobile: hide sidebar
        if (window.innerWidth <= 768) {
            document.querySelector('.sidebar').classList.remove('active');
        }
        
    } catch (error) {
        console.error('Error opening chat:', error);
    }
}

function closeChatInterface() {
    document.getElementById('chat-interface').classList.add('hidden');
    document.getElementById('welcome-screen').classList.remove('hidden');
    
    currentChatUser = null;
    
    // Clear message listeners
    if (messagesRef) {
        firebase.off(messagesRef);
        messagesRef = null;
    }
    
    // Mobile: show sidebar
    if (window.innerWidth <= 768) {
        document.querySelector('.sidebar').classList.add('active');
    }
}

async function loadMessages(userId) {
    if (!currentUser || !userId) return;
    
    try {
        const conversationId = generateConversationId(currentUser.uid, userId);
        messagesRef = firebase.ref(database, `messages/${conversationId}`);
        
        firebase.on(messagesRef, 'value', (snapshot) => {
            const messagesContainer = document.getElementById('messages-container');
            messagesContainer.innerHTML = '';
            
            if (snapshot.exists()) {
                const messages = snapshot.val();
                const messageIds = Object.keys(messages).sort((a, b) => 
                    messages[a].timestamp - messages[b].timestamp
                );
                
                messageIds.forEach(messageId => {
                    const message = messages[messageId];
                    const messageElement = createMessageElement(message);
                    messagesContainer.appendChild(messageElement);
                });
                
                // Scroll to bottom
                scrollToBottom();
            }
        });
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();
    
    if (!messageText || !currentChatUser || !currentUser) return;
    
    try {
        const messageId = generateId();
        const conversationId = generateConversationId(currentUser.uid, currentChatUser.uid);
        const timestamp = Date.now();
        
        const messageData = {
            id: messageId,
            senderId: currentUser.uid,
            receiverId: currentChatUser.uid,
            text: messageText,
            timestamp: timestamp,
            status: 'sent',
            type: 'text'
        };
        
        // Add message to database
        await firebase.set(firebase.ref(database, `messages/${conversationId}/${messageId}`), messageData);
        
        // Update chat metadata
        await updateChatMetadata(conversationId, messageData);
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // Stop typing indicator
        stopTyping();
        
        // Play sound
        playNotificationSound();
        
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Error sending message', 'error');
    }
}

function handleMessageKeypress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function handleTyping() {
    if (!currentChatUser || !currentUser) return;
    
    // Clear existing timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }
    
    // Set typing indicator
    setTypingIndicator(true);
    
    // Clear typing after 3 seconds
    typingTimeout = setTimeout(() => {
        setTypingIndicator(false);
    }, 3000);
}

function setTypingIndicator(isTyping) {
    if (!currentChatUser || !currentUser) return;
    
    const typingRef = firebase.ref(database, `typing/${currentChatUser.uid}/${currentUser.uid}`);
    
    if (isTyping) {
        firebase.set(typingRef, {
            username: currentUser.displayName || 'User',
            timestamp: firebase.serverTimestamp()
        });
    } else {
        firebase.remove(typingRef);
    }
}

function stopTyping() {
    if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
    }
    setTypingIndicator(false);
}

function setupTypingListener(userId) {
    if (!currentUser) return;
    
    const typingRef = firebase.ref(database, `typing/${currentUser.uid}/${userId}`);
    
    firebase.on(typingRef, 'value', (snapshot) => {
        const typingIndicator = document.getElementById('typing-indicator');
        
        if (snapshot.exists()) {
            const typingData = snapshot.val();
            typingIndicator.querySelector('.avatar-img').src = currentChatUser.avatar || generateAvatarUrl(currentChatUser.username);
            typingIndicator.classList.remove('hidden');
        } else {
            typingIndicator.classList.add('hidden');
        }
    });
}

// ===== WEBRTC CALLING =====
async function initiateCall(type) {
    if (!currentChatUser || !currentUser) return;
    
    try {
        currentCall = {
            id: generateId(),
            type: type,
            caller: currentUser.uid,
            callee: currentChatUser.uid,
            status: 'calling',
            timestamp: Date.now()
        };
        
        // Get user media
        const constraints = {
            audio: true,
            video: type === 'video'
        };
        
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Setup peer connection
        setupPeerConnection();
        
        // Add local stream to peer connection
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        // Display local video
        if (type === 'video') {
            document.getElementById('local-video').srcObject = localStream;
        }
        
        // Create offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        // Save call to database
        await firebase.set(firebase.ref(database, `calls/${currentCall.id}`), {
            ...currentCall,
            offer: offer
        });
        
        // Show call interface
        showCallInterface();
        
        // Listen for answer
        listenForCallAnswer();
        
    } catch (error) {
        console.error('Error initiating call:', error);
        showToast('Error starting call', 'error');
        endCall();
    }
}

async function acceptCall() {
    if (!currentCall) return;
    
    try {
        // Get user media
        const constraints = {
            audio: true,
            video: currentCall.type === 'video'
        };
        
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Setup peer connection
        setupPeerConnection();
        
        // Add local stream
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        // Display local video
        if (currentCall.type === 'video') {
            document.getElementById('local-video').srcObject = localStream;
        }
        
        // Set remote description
        await peerConnection.setRemoteDescription(currentCall.offer);
        
        // Create answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        // Update call in database
        await firebase.update(firebase.ref(database, `calls/${currentCall.id}`), {
            status: 'connected',
            answer: answer
        });
        
        // Hide incoming call overlay
        document.getElementById('incoming-call-overlay').classList.add('hidden');
        
        // Show call interface
        showCallInterface();
        
    } catch (error) {
        console.error('Error accepting call:', error);
        showToast('Error accepting call', 'error');
        endCall();
    }
}

function declineCall() {
    if (!currentCall) return;
    
    // Update call status
    firebase.update(firebase.ref(database, `calls/${currentCall.id}`), {
        status: 'declined'
    });
    
    // Hide incoming call overlay
    document.getElementById('incoming-call-overlay').classList.add('hidden');
    
    currentCall = null;
}

function endCall() {
    // Update call status
    if (currentCall) {
        firebase.update(firebase.ref(database, `calls/${currentCall.id}`), {
            status: 'ended',
            endTime: Date.now()
        });
    }
    
    // Close peer connection
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    // Stop local stream
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    // Hide call interface
    document.getElementById('call-interface').classList.add('hidden');
    
    currentCall = null;
}

function setupPeerConnection() {
    peerConnection = new RTCPeerConnection(rtcConfiguration);
    
    // Handle remote stream
    peerConnection.ontrack = (event) => {
        remoteStream = event.streams[0];
        document.getElementById('remote-video').srcObject = remoteStream;
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate && currentCall) {
            // Send ICE candidate to remote peer
            firebase.push(firebase.ref(database, `calls/${currentCall.id}/iceCandidates`), {
                candidate: event.candidate,
                from: currentUser.uid
            });
        }
    };
    
    // Listen for ICE candidates
    firebase.on(firebase.ref(database, `calls/${currentCall.id}/iceCandidates`), 'child_added', (snapshot) => {
        const data = snapshot.val();
        if (data.from !== currentUser.uid) {
            peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    });
}

function showCallInterface() {
    document.getElementById('call-interface').classList.remove('hidden');
    
    // Update call UI
    document.getElementById('call-user-name').textContent = currentChatUser.username;
    document.getElementById('call-status-text').textContent = currentCall.status === 'calling' ? 'Calling...' : 'Connected';
    
    // Show/hide video elements
    if (currentCall.type === 'video') {
        document.getElementById('remote-video').style.display = 'block';
        document.getElementById('local-video').style.display = 'block';
        document.getElementById('call-avatar').style.display = 'none';
    } else {
        document.getElementById('remote-video').style.display = 'none';
        document.getElementById('local-video').style.display = 'none';
        document.getElementById('call-avatar').style.display = 'block';
        document.querySelector('#call-avatar .avatar-img').src = currentChatUser.avatar || generateAvatarUrl(currentChatUser.username);
    }
    
    // Start call timer
    startCallTimer();
}

function startCallTimer() {
    const startTime = Date.now();
    const timerElement = document.getElementById('call-duration');
    
    const updateTimer = () => {
        if (!currentCall) return;
        
        const elapsed = Date.now() - startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timerElement.classList.remove('hidden');
        
        setTimeout(updateTimer, 1000);
    };
    
    updateTimer();
}

function toggleMute() {
    if (!localStream) return;
    
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        
        const muteBtn = document.getElementById('mute-btn');
        if (audioTrack.enabled) {
            muteBtn.classList.remove('muted');
            muteBtn.querySelector('i').className = 'fas fa-microphone';
        } else {
            muteBtn.classList.add('muted');
            muteBtn.querySelector('i').className = 'fas fa-microphone-slash';
        }
    }
}

function toggleCamera() {
    if (!localStream) return;
    
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        
        const cameraBtn = document.getElementById('camera-btn');
        if (videoTrack.enabled) {
            cameraBtn.classList.remove('disabled');
            cameraBtn.querySelector('i').className = 'fas fa-video';
        } else {
            cameraBtn.classList.add('disabled');
            cameraBtn.querySelector('i').className = 'fas fa-video-slash';
        }
    }
}

function toggleSpeaker() {
    // This would typically control audio output routing
    // Implementation depends on browser support
    const speakerBtn = document.getElementById('speaker-btn');
    speakerBtn.classList.toggle('active');
}

function toggleFullscreen() {
    const callInterface = document.getElementById('call-interface');
    
    if (!document.fullscreenElement) {
        callInterface.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// ===== EMOJI PICKER =====
function setupEmojiPicker() {
    const emojiGrid = document.getElementById('emoji-grid');
    
    // Load recent emojis by default
    loadEmojiCategory('recent');
    
    // Setup category buttons
    document.querySelectorAll('.emoji-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            loadEmojiCategory(category);
            
            // Update active category
            document.querySelectorAll('.emoji-category').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
}

function loadEmojiCategory(category) {
    const emojiGrid = document.getElementById('emoji-grid');
    emojiGrid.innerHTML = '';
    
    const emojis = emojiData[category] || [];
    
    emojis.forEach(emoji => {
        const emojiBtn = document.createElement('button');
        emojiBtn.className = 'emoji-item';
        emojiBtn.textContent = emoji;
        emojiBtn.addEventListener('click', () => insertEmoji(emoji));
        emojiGrid.appendChild(emojiBtn);
    });
}

function insertEmoji(emoji) {
    const messageInput = document.getElementById('message-input');
    const cursorPos = messageInput.selectionStart;
    const textBefore = messageInput.value.substring(0, cursorPos);
    const textAfter = messageInput.value.substring(messageInput.selectionEnd);
    
    messageInput.value = textBefore + emoji + textAfter;
    messageInput.focus();
    messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
    
    // Hide emoji picker
    document.getElementById('emoji-picker').classList.add('hidden');
}

function toggleEmojiPicker() {
    const emojiPicker = document.getElementById('emoji-picker');
    emojiPicker.classList.toggle('hidden');
}

// ===== UTILITY FUNCTIONS =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateConversationId(uid1, uid2) {
    return [uid1, uid2].sort().join('_');
}

function generateAvatarUrl(username) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=25D366&color=fff&size=128`;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
        return date.toLocaleDateString([], { weekday: 'short' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function playNotificationSound() {
    const audio = document.getElementById('message-sound');
    if (audio) {
        audio.play().catch(e => console.log('Could not play notification sound'));
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="toast-icon ${iconMap[type]}"></i>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add close functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'Email is already registered',
        'auth/weak-password': 'Password is too weak',
        'auth/invalid-email': 'Invalid email address',
        'auth/too-many-requests': 'Too many failed attempts. Try again later',
        'auth/network-request-failed': 'Network error. Check your connection'
    };
    
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
}

// ===== ELEMENT CREATORS =====
function createChatElement(chatId, userData, chatData) {
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item';
    chatItem.onclick = () => openChat(userData.uid);
    
    chatItem.innerHTML = `
        <div class="chat-avatar">
            <img src="${userData.avatar || generateAvatarUrl(userData.username)}" alt="${userData.username}" class="avatar-img">
            ${userData.online ? '<div class="online-indicator"></div>' : ''}
        </div>
        <div class="chat-info">
            <div class="chat-name">${userData.username}</div>
            <div class="chat-message">${chatData.lastMessage || 'No messages yet'}</div>
        </div>
        <div class="chat-meta">
            <div class="chat-time">${formatTimestamp(chatData.lastMessageTime || Date.now())}</div>
            ${chatData.unreadCount ? `<div class="message-count">${chatData.unreadCount}</div>` : ''}
        </div>
    `;
    
    return chatItem;
}

function createFriendElement(userData) {
    const friendItem = document.createElement('div');
    friendItem.className = 'friend-item';
    friendItem.onclick = () => openChat(userData.uid);
    
    friendItem.innerHTML = `
        <div class="friend-avatar">
            <img src="${userData.avatar || generateAvatarUrl(userData.username)}" alt="${userData.username}" class="avatar-img">
            ${userData.online ? '<div class="online-indicator"></div>' : ''}
        </div>
        <div class="friend-info">
            <div class="friend-name">${userData.username}</div>
            <div class="friend-status">${userData.status || 'Hey there! I am using WhatsApp Clone'}</div>
        </div>
        <div class="friend-meta">
            <div class="friend-time">${userData.online ? 'Online' : formatTimestamp(userData.lastSeen)}</div>
        </div>
    `;
    
    return friendItem;
}

function createFriendRequestElement(userData, requestData) {
    const requestItem = document.createElement('div');
    requestItem.className = 'request-item';
    
    requestItem.innerHTML = `
        <div class="request-avatar">
            <img src="${userData.avatar || generateAvatarUrl(userData.username)}" alt="${userData.username}" class="avatar-img">
        </div>
        <div class="request-info">
            <div class="request-name">${userData.username}</div>
            <div class="request-message">Wants to be your friend</div>
        </div>
        <div class="request-meta">
            <button class="btn btn-primary btn-sm" onclick="acceptFriendRequest('${requestData.id}', '${userData.uid}')">Accept</button>
            <button class="btn btn-secondary btn-sm" onclick="declineFriendRequest('${requestData.id}', '${userData.uid}')">Decline</button>
        </div>
    `;
    
    return requestItem;
}

function createSearchResultElement(userData) {
    const resultItem = document.createElement('div');
    resultItem.className = 'search-result-item';
    resultItem.dataset.userId = userData.uid;
    
    resultItem.innerHTML = `
        <div class="search-result-avatar">
            <img src="${userData.avatar || generateAvatarUrl(userData.username)}" alt="${userData.username}" class="avatar-img">
        </div>
        <div class="search-result-info">
            <div class="search-result-name">${userData.username}</div>
            <div class="search-result-email">${userData.email}</div>
        </div>
        <div class="search-result-actions">
            <button class="btn btn-primary" onclick="sendFriendRequest('${userData.uid}')">Add Friend</button>
        </div>
    `;
    
    return resultItem;
}

function createMessageElement(messageData) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${messageData.senderId === currentUser.uid ? 'sent' : 'received'}`;
    
    messageDiv.innerHTML = `
        <div class="message-bubble">
            <div class="message-content">${messageData.text}</div>
            <div class="message-meta">
                <span class="message-time">${formatTimestamp(messageData.timestamp)}</span>
                ${messageData.senderId === currentUser.uid ? `<span class="message-status ${messageData.status}">${getStatusIcon(messageData.status)}</span>` : ''}
            </div>
        </div>
    `;
    
    return messageDiv;
}

function getStatusIcon(status) {
    const icons = {
        sent: '✓',
        delivered: '✓✓',
        read: '✓✓'
    };
    return icons[status] || '';
}

// ===== ADDITIONAL HELPER FUNCTIONS =====
async function getUserData(userId) {
    try {
        const userRef = firebase.ref(database, `users/${userId}`);
        const snapshot = await firebase.get(userRef);
        return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

async function searchUsersByEmail(email) {
    try {
        const usersRef = firebase.ref(database, 'users');
        const snapshot = await firebase.get(firebase.query(usersRef, firebase.orderByChild('email'), firebase.equalTo(email)));
        
        if (snapshot.exists()) {
            return Object.values(snapshot.val());
        }
        return [];
    } catch (error) {
        console.error('Error searching users by email:', error);
        return [];
    }
}

async function searchUsersByUsername(username) {
    try {
        const usersRef = firebase.ref(database, 'users');
        const snapshot = await firebase.get(firebase.query(usersRef, firebase.orderByChild('username'), firebase.startAt(username), firebase.endAt(username + '\uf8ff')));
        
        if (snapshot.exists()) {
            return Object.values(snapshot.val());
        }
        return [];
    } catch (error) {
        console.error('Error searching users by username:', error);
        return [];
    }
}

async function isFriend(userId) {
    try {
        const friendRef = firebase.ref(database, `users/${currentUser.uid}/friends/${userId}`);
        const snapshot = await firebase.get(friendRef);
        return snapshot.exists();
    } catch (error) {
        console.error('Error checking friend status:', error);
        return false;
    }
}

async function updateChatMetadata(conversationId, messageData) {
    try {
        const chatData = {
            participants: [messageData.senderId, messageData.receiverId],
            lastMessage: messageData.text,
            lastMessageTime: messageData.timestamp,
            lastMessageSender: messageData.senderId
        };
        
        // Update for sender
        await firebase.set(firebase.ref(database, `userChats/${messageData.senderId}/${conversationId}`), {
            ...chatData,
            unreadCount: 0
        });
        
        // Update for receiver
        const receiverChatRef = firebase.ref(database, `userChats/${messageData.receiverId}/${conversationId}`);
        const receiverSnapshot = await firebase.get(receiverChatRef);
        const currentUnread = receiverSnapshot.exists() ? (receiverSnapshot.val().unreadCount || 0) : 0;
        
        await firebase.set(receiverChatRef, {
            ...chatData,
            unreadCount: currentUnread + 1
        });
        
    } catch (error) {
        console.error('Error updating chat metadata:', error);
    }
}

async function markMessagesAsRead(userId) {
    try {
        const conversationId = generateConversationId(currentUser.uid, userId);
        
        // Reset unread count
        await firebase.set(firebase.ref(database, `userChats/${currentUser.uid}/${conversationId}/unreadCount`), 0);
        
        // Mark messages as read
        const messagesRef = firebase.ref(database, `messages/${conversationId}`);
        const snapshot = await firebase.get(messagesRef);
        
        if (snapshot.exists()) {
            const messages = snapshot.val();
            const updates = {};
            
            Object.keys(messages).forEach(messageId => {
                const message = messages[messageId];
                if (message.receiverId === currentUser.uid && message.status !== 'read') {
                    updates[`${messageId}/status`] = 'read';
                }
            });
            
            if (Object.keys(updates).length > 0) {
                await firebase.update(messagesRef, updates);
            }
        }
        
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

function updateChatUserStatus() {
    if (!currentChatUser) return;
    
    const statusElement = document.getElementById('chat-user-status');
    const onlineIndicator = document.getElementById('chat-user-online');
    
    if (currentChatUser.online) {
        statusElement.textContent = 'Online';
        onlineIndicator.style.display = 'block';
    } else {
        statusElement.textContent = `Last seen ${formatTimestamp(currentChatUser.lastSeen)}`;
        onlineIndicator.style.display = 'none';
    }
}

function updateTabBadge(tabName, count) {
    const badge = document.getElementById(`${tabName}-badge`);
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function handleSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const clearBtn = document.getElementById('search-clear');
    
    if (searchTerm) {
        clearBtn.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
    }
    
    // Filter visible items based on search term
    const activeTab = document.querySelector('.tab-content.active');
    const items = activeTab.querySelectorAll('.chat-item, .friend-item, .request-item');
    
    items.forEach(item => {
        const name = item.querySelector('.chat-name, .friend-name, .request-name').textContent.toLowerCase();
        if (name.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('search-clear').classList.add('hidden');
    
    // Show all items
    const activeTab = document.querySelector('.tab-content.active');
    const items = activeTab.querySelectorAll('.chat-item, .friend-item, .request-item');
    
    items.forEach(item => {
        item.style.display = 'flex';
    });
}

function toggleChatMenu() {
    const chatMenu = document.getElementById('chat-menu');
    chatMenu.classList.toggle('hidden');
}

async function blockUser() {
    if (!currentChatUser || !currentUser) return;
    
    try {
        // Add to blocked list
        await firebase.set(firebase.ref(database, `users/${currentUser.uid}/blocked/${currentChatUser.uid}`), {
            blockedAt: firebase.serverTimestamp()
        });
        
        // Remove from friends
        await firebase.remove(firebase.ref(database, `users/${currentUser.uid}/friends/${currentChatUser.uid}`));
        await firebase.remove(firebase.ref(database, `users/${currentChatUser.uid}/friends/${currentUser.uid}`));
        
        showToast('User blocked successfully', 'success');
        closeChatInterface();
        
    } catch (error) {
        console.error('Error blocking user:', error);
        showToast('Error blocking user', 'error');
    }
}

async function clearChat() {
    if (!currentChatUser || !currentUser) return;
    
    try {
        const conversationId = generateConversationId(currentUser.uid, currentChatUser.uid);
        await firebase.remove(firebase.ref(database, `messages/${conversationId}`));
        
        showToast('Chat cleared successfully', 'success');
        
    } catch (error) {
        console.error('Error clearing chat:', error);
        showToast('Error clearing chat', 'error');
    }
}

function toggleDarkMode() {
    const isDark = document.getElementById('dark-mode').checked;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('darkMode', isDark);
}

function handleContextMenu(e) {
    // Implementation for context menu on messages
    if (e.target.closest('.message')) {
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY);
    }
}

function showContextMenu(x, y) {
    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.classList.remove('hidden');
}

function hideContextMenu() {
    document.getElementById('context-menu').classList.add('hidden');
}

function handleBeforeUnload() {
    if (currentUser) {
        // Update user status to offline
        firebase.set(firebase.ref(database, `users/${currentUser.uid}/online`), false);
        firebase.set(firebase.ref(database, `users/${currentUser.uid}/lastSeen`), firebase.serverTimestamp());
    }
}

function handleOnline() {
    if (currentUser) {
        firebase.set(firebase.ref(database, `users/${currentUser.uid}/online`), true);
    }
    showToast('Connection restored', 'success');
}

function handleOffline() {
    showToast('Connection lost', 'warning');
}

// ===== FIREBASE DATABASE RULES (for reference) =====
/*
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid"
      }
    },
    "messages": {
      "$conversationId": {
        ".read": "auth != null && (root.child('users').child(auth.uid).child('friends').hasChild($conversationId.split('_')[0]) || root.child('users').child(auth.uid).child('friends').hasChild($conversationId.split('_')[1]))",
        ".write": "auth != null && (root.child('users').child(auth.uid).child('friends').hasChild($conversationId.split('_')[0]) || root.child('users').child(auth.uid).child('friends').hasChild($conversationId.split('_')[1]))"
      }
    },
    "userChats": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "friendRequests": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "auth != null"
      }
    },
    "calls": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "typing": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "auth != null"
      }
    }
  }
}
*/
