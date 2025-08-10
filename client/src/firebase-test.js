// Test Firebase initialization
import { auth, provider } from './lib/firebase';

console.log('🔍 Testing Firebase initialization...');
console.log('Auth object:', auth);
console.log('Provider object:', provider);
console.log('Auth config:', auth.config);
console.log('Current user:', auth.currentUser);

// Test if Firebase is working
try {
  console.log('✅ Firebase modules loaded successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}
