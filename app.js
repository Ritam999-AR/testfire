// Firebase configuration (replace with your own)
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// DOM Elements
const authModal = document.getElementById('auth-modal');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const currentUserEmailSpan = document.getElementById('current-user-email');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResultsDiv = document.getElementById('search-results');
const friendRequestsList = document.getElementById('friend-requests-list');
const friendsList = document.getElementById('friends-list');
const chatTitle = document.getElementById('chat-title');
const messagesDiv = document.getElementById('messages');
const messageTextInput = document.getElementById('message-text');
const sendMessageBtn = document.getElementById('send-message-btn');
const videoCallBtn = document.getElementById('video-call-btn');
const voiceCallBtn = document.getElementById('voice-call-btn');
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const videoCallArea = document.querySelector('.video-call-area');

let currentChatFriend = null;
let localStream;
let peerConnection;

// Firebase Realtime Database Rules (Starter Snippet)
/*
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('friends').child(auth.uid).hasChild($uid))",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "messages": {
      "$convId": {
        ".read": "auth != null && (data.child('participants').hasChild(auth.uid))",
        ".write": "auth != null && data.child('participants').hasChild(auth.uid)"
      }
    },
    "friendRequests": {
      "$receiverUid": {
        ".read": "auth != null && auth.uid === $receiverUid",
        ".write": "auth != null && auth.uid === data.child('senderUid').val()"
      }
    },
    "signaling": {
      "$callId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
*/

// Usage Instructions:
// 1. Enable Email/Password authentication in your Firebase project console.
// 2. Create a Realtime Database in your Firebase project console.
// 3. Replace the `firebaseConfig` object above with your actual Firebase project configuration.
// 4. Open `index.html` in your browser. For testing, open in two separate browser windows or incognito tabs.
// 5. Sign up with two different email addresses, send a friend request, accept it, and then test messaging and calling.

// Authentication
auth.onAuthStateChanged(user => {
    if (user) {
        authModal.style.display = 'none';
        currentUserEmailSpan.textContent = user.email;
        updateUserPresence(user.uid, true);
        loadFriends(user.uid);
        loadFriendRequests(user.uid);
    } else {
        authModal.style.display = 'flex';
        currentUserEmailSpan.textContent = '';
    }
});

signupBtn.addEventListener('click', async () => {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await database.ref('users/' + userCredential.user.uid).set({
            email: email,
            displayName: email.split('@')[0],
            online: true
        });
        alert('Sign up successful!');
    } catch (error) {
        alert(error.message);
    }
});

loginBtn.addEventListener('click', async () => {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
        alert('Login successful!');
    } catch (error) {
        alert(error.message);
    }
});

signOutBtn.addEventListener('click', async () => {
    if (auth.currentUser) {
        await updateUserPresence(auth.currentUser.uid, false);
    }
    await auth.signOut();
    alert('Signed out!');
});

// User Presence
function updateUserPresence(uid, isOnline) {
    database.ref('users/' + uid + '/online').set(isOnline);
}

// Search Users
searchBtn.addEventListener('click', async () => {
    const searchTerm = searchInput.value.toLowerCase();
    searchResultsDiv.innerHTML = '';
    if (!searchTerm) return;

    database.ref('users').orderByChild('email').once('value', snapshot => {
        snapshot.forEach(childSnapshot => {
            const user = childSnapshot.val();
            const uid = childSnapshot.key;
            if (uid !== auth.currentUser.uid && (user.email.toLowerCase().includes(searchTerm) || user.displayName.toLowerCase().includes(searchTerm))) {
                const resultItem = document.createElement('div');
                resultItem.textContent = user.displayName + ' (' + user.email + ')';
                const sendRequestBtn = document.createElement('button');
                sendRequestBtn.textContent = 'Send Friend Request';
                sendRequestBtn.onclick = () => sendFriendRequest(uid);
                resultItem.appendChild(sendRequestBtn);
                searchResultsDiv.appendChild(resultItem);
            }
        });
    });
});

// Friend Requests
async function sendFriendRequest(receiverUid) {
    const senderUid = auth.currentUser.uid;
    const senderEmail = auth.currentUser.email;
    await database.ref('friendRequests/' + receiverUid).push({
        senderUid: senderUid,
        senderEmail: senderEmail,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    alert('Friend request sent!');
}

function loadFriendRequests(uid) {
    friendRequestsList.innerHTML = '';
    database.ref('friendRequests/' + uid).on('child_added', snapshot => {
        const request = snapshot.val();
        const requestId = snapshot.key;
        const requestItem = document.createElement('li');
        requestItem.textContent = request.senderEmail;

        const acceptBtn = document.createElement('button');
        acceptBtn.textContent = 'Accept';
        acceptBtn.onclick = () => acceptFriendRequest(request.senderUid, uid, requestId);
        requestItem.appendChild(acceptBtn);

        const declineBtn = document.createElement('button');
        declineBtn.textContent = 'Decline';
        declineBtn.onclick = () => declineFriendRequest(uid, requestId);
        requestItem.appendChild(declineBtn);

        friendRequestsList.appendChild(requestItem);
    });
}

async function acceptFriendRequest(senderUid, receiverUid, requestId) {
    // Add to sender's friends list
    await database.ref('users/' + senderUid + '/friends/' + receiverUid).set(true);
    // Add to receiver's friends list
    await database.ref('users/' + receiverUid + '/friends/' + senderUid).set(true);
    // Remove request
    await database.ref('friendRequests/' + receiverUid + '/' + requestId).remove();
    alert('Friend request accepted!');
}

async function declineFriendRequest(receiverUid, requestId) {
    await database.ref('friendRequests/' + receiverUid + '/' + requestId).remove();
    alert('Friend request declined.');
}

// Friends List
function loadFriends(uid) {
    friendsList.innerHTML = '';
    database.ref('users/' + uid + '/friends').on('child_added', async snapshot => {
        const friendUid = snapshot.key;
        const friendSnapshot = await database.ref('users/' + friendUid).once('value');
        const friend = friendSnapshot.val();
        if (friend) {
            const friendItem = document.createElement('li');
            friendItem.textContent = friend.displayName + (friend.online ? ' (Online)' : ' (Offline)');
            friendItem.onclick = () => startChat(friendUid, friend.displayName);
            friendsList.appendChild(friendItem);
        }
    });

    // Update friend presence
    database.ref('users/' + uid + '/friends').on('child_changed', async snapshot => {
        const friendUid = snapshot.key;
        const friendSnapshot = await database.ref('users/' + friendUid).once('value');
        const friend = friendSnapshot.val();
        if (friend) {
            // Re-render friends list to update online status
            loadFriends(uid); // Simple re-load for now, can be optimized
        }
    });
}

// Chat
function getConversationId(uid1, uid2) {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

async function startChat(friendUid, friendDisplayName) {
    currentChatFriend = { uid: friendUid, displayName: friendDisplayName };
    chatTitle.textContent = `Chat with ${friendDisplayName}`;
    messagesDiv.innerHTML = '';
    videoCallArea.style.display = 'none'; // Hide video call area when starting chat

    const convId = getConversationId(auth.currentUser.uid, friendUid);
    database.ref('messages/' + convId).on('child_added', snapshot => {
        const message = snapshot.val();
        displayMessage(message);
    });
}

sendMessageBtn.addEventListener('click', async () => {
    if (!currentChatFriend) {
        alert('Please select a friend to chat with.');
        return;
    }
    const messageText = messageTextInput.value;
    if (!messageText) return;

    const convId = getConversationId(auth.currentUser.uid, currentChatFriend.uid);
    await database.ref('messages/' + convId).push({
        senderUid: auth.currentUser.uid,
        text: messageText,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    messageTextInput.value = '';
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to bottom
});

function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    if (message.senderUid === auth.currentUser.uid) {
        messageElement.classList.add('sent');
    }
    messageElement.textContent = message.text;
    messagesDiv.appendChild(messageElement);
}

// WebRTC Calling
// Note: For production, a TURN server may be needed for NAT traversal.
const iceServers = {
    'iceServers': [
        { 'urls': 'stun:stun.l.google.com:19302' },
    ]
};

videoCallBtn.addEventListener('click', () => startCall(true)); // Video call
voiceCallBtn.addEventListener('click', () => startCall(false)); // Voice call

async function startCall(isVideoCall) {
    if (!currentChatFriend) {
        alert('Please select a friend to call.');
        return;
    }

    videoCallArea.style.display = 'flex'; // Show video call area

    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: isVideoCall,
            audio: true
        });
        localVideo.srcObject = localStream;

        peerConnection = new RTCPeerConnection(iceServers);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.ontrack = (event) => {
            remoteVideo.srcObject = event.streams[0];
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                database.ref('signaling/' + getConversationId(auth.currentUser.uid, currentChatFriend.uid)).push({
                    'candidate': event.candidate.toJSON()
                });
            }
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        database.ref('signaling/' + getConversationId(auth.currentUser.uid, currentChatFriend.uid)).push({
            'offer': peerConnection.localDescription.toJSON()
        });

    } catch (error) {
        console.error('Error starting call:', error);
        alert('Error starting call: ' + error.message + '. Make sure camera/microphone permissions are granted.');
    }
}

// Listen for signaling messages
database.ref('signaling/' + getConversationId(auth.currentUser.uid, currentChatFriend.uid)).on('child_added', async snapshot => {
    const data = snapshot.val();

    if (data.offer) {
        if (!peerConnection) {
            // If we receive an offer and don't have a peer connection, create one
            await startCall(data.offer.type === 'video'); // Re-use startCall to set up local stream and peer connection
        }
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        database.ref('signaling/' + getConversationId(auth.currentUser.uid, currentChatFriend.uid)).push({
            'answer': peerConnection.localDescription.toJSON()
        });
    } else if (data.answer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    } else if (data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
});

// Blocking (Placeholder - requires more robust implementation)
// This is a simplified example. A full blocking feature would involve:
// - Storing blocked users in the database for each user.
// - Filtering messages/calls based on blocked status.
// - UI to block/unblock users.

// Example of how you might check if a user is blocked (conceptual)
/*
async function isUserBlocked(currentUserUid, targetUserUid) {
    const snapshot = await database.ref('users/' + currentUserUid + '/blockedUsers/' + targetUserUid).once('value');
    return snapshot.exists();
}
*/

// Initial setup for auth modal
authModal.style.display = 'flex';

