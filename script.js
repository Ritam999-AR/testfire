// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, doc, setDoc, getDoc, getDocs, 
  query, where, onSnapshot, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { 
  getStorage, ref, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-storage.js";

// Firebase Config (yours)
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM Elements
const authContainer = document.getElementById("auth-container");
const appContainer = document.getElementById("app-container");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const googleBtn = document.getElementById("google-btn");
const logoutBtn = document.getElementById("logout-btn");
const emailInput = document.getElementById("email");
const passInput = document.getElementById("password");
const userList = document.getElementById("user-list");
const userNameEl = document.getElementById("user-name");
const userPhotoEl = document.getElementById("user-photo");
const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const imageBtn = document.getElementById("image-btn");
const imageInput = document.getElementById("image-input");
const chatNameEl = document.getElementById("chat-name");
const chatStatusEl = document.getElementById("chat-status");
const typingIndicator = document.getElementById("typing-indicator");
const typingUser = document.getElementById("typing-user");

let currentUser = null;
let currentChatUser = null;

// ========== AUTH FUNCTIONS ==========
loginBtn.onclick = async () => {
  const email = emailInput.value;
  const pass = passInput.value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    alert(err.message);
  }
};

signupBtn.onclick = async () => {
  const email = emailInput.value;
  const pass = passInput.value;
  try {
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, "users", userCred.user.uid), {
      uid: userCred.user.uid,
      email: email,
      name: email.split("@")[0],
      photoURL: "https://via.placeholder.com/150",
      online: true,
      lastSeen: serverTimestamp()
    });
  } catch (err) {
    alert(err.message);
  }
};

googleBtn.onclick = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const userCred = await signInWithPopup(auth, provider);
    await setDoc(doc(db, "users", userCred.user.uid), {
      uid: userCred.user.uid,
      email: userCred.user.email,
      name: userCred.user.displayName,
      photoURL: userCred.user.photoURL,
      online: true,
      lastSeen: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    alert(err.message);
  }
};

logoutBtn.onclick = () => signOut(auth);

// Listen for auth state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    authContainer.classList.add("hidden");
    appContainer.classList.remove("hidden");
    userNameEl.textContent = user.displayName || user.email;
    userPhotoEl.src = user.photoURL || "https://via.placeholder.com/150";
    loadUsers();
  } else {
    currentUser = null;
    authContainer.classList.remove("hidden");
    appContainer.classList.add("hidden");
  }
});

// ========== USERS ==========
async function loadUsers() {
  const q = query(collection(db, "users"));
  const snap = await getDocs(q);
  userList.innerHTML = "";
  snap.forEach(docSnap => {
    const user = docSnap.data();
    if (user.uid !== currentUser.uid) {
      const div = document.createElement("div");
      div.classList.add("user-item");
      div.innerHTML = `
        <img src="${user.photoURL}" alt="${user.name}"/>
        <div>
          <span>${user.name}</span>
          <small>${user.online ? "Online" : "Offline"}</small>
        </div>`;
      div.onclick = () => openChat(user);
      userList.appendChild(div);
    }
  });
}

// ========== CHAT ==========
function openChat(user) {
  currentChatUser = user;
  chatNameEl.textContent = user.name;
  chatStatusEl.textContent = user.online ? "Online" : "last seen recently";
  loadMessages();
}

// ========== MESSAGES ==========
function loadMessages() {
  const chatId = getChatId(currentUser.uid, currentChatUser.uid);
  const msgsRef = collection(db, "chats", chatId, "messages");
  const q = query(msgsRef, orderBy("timestamp"));
  onSnapshot(q, (snap) => {
    chatMessages.innerHTML = "";
    snap.forEach(docSnap => {
      const msg = docSnap.data();
      renderMessage(msg);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

function renderMessage(msg) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.classList.add(msg.sender === currentUser.uid ? "sent" : "received");
  
  if (msg.text) {
    const span = document.createElement("span");
    span.textContent = msg.text;
    div.appendChild(span);
  }
  if (msg.imageUrl) {
    const img = document.createElement("img");
    img.src = msg.imageUrl;
    div.appendChild(img);
  }
  chatMessages.appendChild(div);
}

sendBtn.onclick = async () => {
  if (!messageInput.value && !imageInput.files[0]) return;
  const chatId = getChatId(currentUser.uid, currentChatUser.uid);
  const msg = {
    sender: currentUser.uid,
    text: messageInput.value || null,
    timestamp: serverTimestamp()
  };
  if (imageInput.files[0]) {
    const fileRef = ref(storage, `chats/${chatId}/${Date.now()}`);
    await uploadBytes(fileRef, imageInput.files[0]);
    msg.imageUrl = await getDownloadURL(fileRef);
  }
  await addDoc(collection(db, "chats", chatId, "messages"), msg);
  messageInput.value = "";
  imageInput.value = "";
};

imageBtn.onclick = () => imageInput.click();

// Chat ID helper
function getChatId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}
