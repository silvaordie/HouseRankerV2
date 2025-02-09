import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';

export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithAuthProvider(provider);
}

export async function signInWithFacebook() {
    const provider = new FacebookAuthProvider();
    return signInWithAuthProvider(provider);
}

async function signInWithAuthProvider(provider) {
    try {
        const auth = getAuth();
        const result = await signInWithPopup(auth, provider);
        return { success: true, user: result.user };
    } catch (error) {
        console.error('Auth error:', error);
        return { success: false, error: error.message };
    }
}

export async function signOut() {
    try {
        const auth = getAuth();
        await auth.signOut();
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
    }
}

export function getCurrentUser() {
    const auth = getAuth();
    return auth.currentUser;
}
