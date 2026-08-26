// firestore.rules.test.js
import { describe, it, beforeAll, beforeEach, afterAll } from 'vitest';
import { 
  initializeTestEnvironment, 
  assertFails, 
  assertSucceeds 
} from '@firebase/rules-unit-testing';

// 1. WE INLINE THE RULES SO IT IS IMPOSSIBLE TO READ THE WRONG FILE
const FIRESTORE_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }

    function isAdmin() {
      return isSignedIn() && (
        exists(/databases/$(database)/documents/admins/$(request.auth.uid)) ||
        ('role' in request.auth.token && (request.auth.token.role == 'admin' || request.auth.token.role == 'superadmin'))
      );
    }

    function isSuperAdmin() {
      return isSignedIn() && (
        (
          exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
          get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'superadmin'
        ) || 
        ('role' in request.auth.token && request.auth.token.role == 'superadmin')
      );
    }

    match /admins/{uid} {
      allow read: if isSignedIn();
      allow create, delete: if isSuperAdmin();
      allow update: if isSuperAdmin() || (isSignedIn() && request.auth.uid == uid);
    }

    match /opportunities/{id} { allow read: if true; allow create, update, delete: if isAdmin(); }
    match /events/{id} { allow read: if true; allow create, delete: if isAdmin(); allow update: if isAdmin(); }
    match /site_settings/{id} { allow read: if true; allow create, update, delete: if isAdmin(); }
  }
}
`;

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    // 2. DYNAMIC PROJECT ID TO BYPASS EMULATOR CACHE
    projectId: `demo-cif-test-${Date.now()}`,
    firestore: {
      rules: FIRESTORE_RULES, // 3. USE INLINE RULES INSTEAD OF FS
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Admin Panel Strict Access Control Rules', () => {

  describe('Admin-Managed Content Collections', () => {
    it('should deny unauthenticated users from writing to admin content', async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthDb.collection('opportunities').doc('opp1').set({ title: 'Hacked' }));
      await assertFails(unauthDb.collection('site_settings').doc('config').set({ maintenance: false }));
    });

    it('should deny regular signed-in users from modifying admin content', async () => {
      const regularUserDb = testEnv.authenticatedContext('regular-user-999', {}).firestore();
      await assertFails(regularUserDb.collection('opportunities').doc('opp1').set({ title: 'Unauthorized' }));
      await assertFails(regularUserDb.collection('events').doc('event1').set({ title: 'Fake Event' }));
    });

    it('should allow verified admin users to create and update admin content', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('admins').doc('admin-user-1').set({ role: 'admin' });
      });

      const adminDb = testEnv.authenticatedContext('admin-user-1', { role: 'admin' }).firestore();

      await assertSucceeds(adminDb.collection('opportunities').doc('opp1').set({ title: 'Official Festival Opportunity' }));
      await assertSucceeds(adminDb.collection('site_settings').doc('config').set({ maintenance: false }));
    });
  });

  describe('Superadmin & Admin Roster Controls', () => {
    it('should block regular admins from creating other admin accounts', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('admins').doc('regular-admin-uid').set({ role: 'admin' });
      });

      const regularAdminDb = testEnv.authenticatedContext('regular-admin-uid', { role: 'admin' }).firestore();
      
      await assertFails(regularAdminDb.collection('admins').doc('brand-new-admin').set({ role: 'admin' }));
    });

    it('should allow superadmins to create and delete admin accounts', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('admins').doc('superadmin-uid').set({ role: 'superadmin' });
      });

      const superAdminDb = testEnv.authenticatedContext('superadmin-uid', { role: 'superadmin' }).firestore();
      
      await assertSucceeds(superAdminDb.collection('admins').doc('new-admin-uid').set({ role: 'admin' }));
      await assertSucceeds(superAdminDb.collection('admins').doc('new-admin-uid').delete());
    });
  });

});