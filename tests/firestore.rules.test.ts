/**
 * Firestore Security Rules Tests
 * 
 * These tests validate the security rules defined in firestore.rules
 * Run with: npm run test:rules (requires Firebase emulator)
 */

import { 
  assertFails, 
  assertSucceeds, 
  initializeTestEnvironment,
  RulesTestEnvironment 
} from '@firebase/rules-unit-testing';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const STUDENT_UID = 'student123';
const ADMIN_UID = 'admin456';
const OTHER_USER_UID = 'other789';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'test-project',
    firestore: {
      rules: require('fs').readFileSync('firestore.rules', 'utf8'),
      host: 'localhost',
      port: 8080
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('User Profile Security Rules', () => {
  test('User can read their own profile', async () => {
    const db = testEnv.authenticatedContext(STUDENT_UID).firestore();
    const userRef = doc(db, 'users', STUDENT_UID);
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users', STUDENT_UID), {
        uid: STUDENT_UID,
        email: 'student@test.com',
        displayName: 'Test Student',
        role: 'STUDENT'
      });
    });
    
    await assertSucceeds(getDoc(userRef));
  });

  test('User cannot read another user profile', async () => {
    const db = testEnv.authenticatedContext(STUDENT_UID).firestore();
    const otherUserRef = doc(db, 'users', OTHER_USER_UID);
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users', OTHER_USER_UID), {
        uid: OTHER_USER_UID,
        email: 'other@test.com',
        displayName: 'Other User',
        role: 'STUDENT'
      });
    });
    
    await assertFails(getDoc(otherUserRef));
  });

  test('User can create their own profile', async () => {
    const db = testEnv.authenticatedContext(STUDENT_UID).firestore();
    const userRef = doc(db, 'users', STUDENT_UID);
    
    await assertSucceeds(setDoc(userRef, {
      uid: STUDENT_UID,
      email: 'student@test.com',
      displayName: 'Test Student',
      role: 'STUDENT'
    }));
  });

  test('User cannot create profile for another user', async () => {
    const db = testEnv.authenticatedContext(STUDENT_UID).firestore();
    const otherUserRef = doc(db, 'users', OTHER_USER_UID);
    
    await assertFails(setDoc(otherUserRef, {
      uid: OTHER_USER_UID,
      email: 'other@test.com',
      displayName: 'Other User',
      role: 'STUDENT'
    }));
  });

  test('Admin can update any user profile', async () => {
    const db = testEnv.authenticatedContext(ADMIN_UID).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users', STUDENT_UID), {
        uid: STUDENT_UID,
        email: 'student@test.com',
        displayName: 'Test Student',
        role: 'STUDENT'
      });
      await setDoc(doc(context.firestore(), 'roles_admin', ADMIN_UID), {
        uid: ADMIN_UID
      });
    });
    
    const userRef = doc(db, 'users', STUDENT_UID);
    await assertSucceeds(updateDoc(userRef, { displayName: 'Updated Name' }));
  });
});

describe('Suggestion Security Rules', () => {
  test('Anyone can read suggestions', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'suggestions', 'suggestion1'), {
        suggestionId: 'suggestion1',
        title: 'Test Suggestion',
        body: 'Test body',
        authorUid: STUDENT_UID,
        category: 'OTHER',
        status: 'SUBMITTED',
        upvotesCount: 0,
        submissionTimestamp: new Date()
      });
    });
    
    const suggestionRef = doc(db, 'suggestions', 'suggestion1');
    await assertSucceeds(getDoc(suggestionRef));
  });

  test('User can create suggestion with their own UID', async () => {
    const db = testEnv.authenticatedContext(STUDENT_UID).firestore();
    const suggestionRef = doc(db, 'suggestions', 'suggestion1');
    
    await assertSucceeds(setDoc(suggestionRef, {
      suggestionId: 'suggestion1',
      title: 'Test Suggestion',
      body: 'Test body',
      authorUid: STUDENT_UID,
      category: 'OTHER',
      status: 'SUBMITTED',
      upvotesCount: 0,
      submissionTimestamp: serverTimestamp()
    }));
  });

  test('User cannot create suggestion with another user UID', async () => {
    const db = testEnv.authenticatedContext(STUDENT_UID).firestore();
    const suggestionRef = doc(db, 'suggestions', 'suggestion1');
    
    await assertFails(setDoc(suggestionRef, {
      suggestionId: 'suggestion1',
      title: 'Test Suggestion',
      body: 'Test body',
      authorUid: OTHER_USER_UID,
      category: 'OTHER',
      status: 'SUBMITTED',
      upvotesCount: 0,
      submissionTimestamp: serverTimestamp()
    }));
  });

  test('Author can update their own suggestion', async () => {
    const db = testEnv.authenticatedContext(STUDENT_UID).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'suggestions', 'suggestion1'), {
        suggestionId: 'suggestion1',
        title: 'Test Suggestion',
        body: 'Test body',
        authorUid: STUDENT_UID,
        category: 'OTHER',
        status: 'SUBMITTED',
        upvotesCount: 0,
        submissionTimestamp: new Date()
      });
    });
    
    const suggestionRef = doc(db, 'suggestions', 'suggestion1');
    await assertSucceeds(updateDoc(suggestionRef, { title: 'Updated Title' }));
  });

  test('Non-author cannot update suggestion', async () => {
    const db = testEnv.authenticatedContext(OTHER_USER_UID).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'suggestions', 'suggestion1'), {
        suggestionId: 'suggestion1',
        title: 'Test Suggestion',
        body: 'Test body',
        authorUid: STUDENT_UID,
        category: 'OTHER',
        status: 'SUBMITTED',
        upvotesCount: 0,
        submissionTimestamp: new Date()
      });
    });
    
    const suggestionRef = doc(db, 'suggestions', 'suggestion1');
    await assertFails(updateDoc(suggestionRef, { title: 'Updated Title' }));
  });

  test('Admin can update any suggestion', async () => {
    const db = testEnv.authenticatedContext(ADMIN_UID).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'suggestions', 'suggestion1'), {
        suggestionId: 'suggestion1',
        title: 'Test Suggestion',
        body: 'Test body',
        authorUid: STUDENT_UID,
        category: 'OTHER',
        status: 'SUBMITTED',
        upvotesCount: 0,
        submissionTimestamp: new Date()
      });
      await setDoc(doc(context.firestore(), 'roles_admin', ADMIN_UID), {
        uid: ADMIN_UID
      });
    });
    
    const suggestionRef = doc(db, 'suggestions', 'suggestion1');
    await assertSucceeds(updateDoc(suggestionRef, { status: 'UNDER_REVIEW' }));
  });

  test('Author can delete their own suggestion', async () => {
    const db = testEnv.authenticatedContext(STUDENT_UID).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'suggestions', 'suggestion1'), {
        suggestionId: 'suggestion1',
        title: 'Test Suggestion',
        body: 'Test body',
        authorUid: STUDENT_UID,
        category: 'OTHER',
        status: 'SUBMITTED',
        upvotesCount: 0,
        submissionTimestamp: new Date()
      });
    });
    
    const suggestionRef = doc(db, 'suggestions', 'suggestion1');
    await assertSucceeds(deleteDoc(suggestionRef));
  });
});

describe('Vote Security Rules', () => {
  test('Authenticated user can read votes', async () => {
    const db = testEnv.authenticatedContext(STUDENT_UID).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'votes', `${STUDENT_UID}_suggestion1`), {
        voteId: `${STUDENT_UID}_suggestion1`,
        suggestionId: 'suggestion1',
        voterUid: STUDENT_UID,
        timestamp: new Date()
      });
    });
    
    const voteRef = doc(db, 'votes', `${STUDENT_UID}_suggestion1`);
    await assertSucceeds(getDoc(voteRef));
  });

  test('Unauthenticated user cannot read votes', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'votes', `${STUDENT_UID}_suggestion1`), {
        voteId: `${STUDENT_UID}_suggestion1`,
        suggestionId: 'suggestion1',
        voterUid: STUDENT_UID,
        timestamp: new Date()
      });
    });
    
    const voteRef = doc(db, 'votes', `${STUDENT_UID}_suggestion1`);
    await assertFails(getDoc(voteRef));
  });

  test('User can create vote with correct composite key', async () => {
    const db = testEnv.authenticatedContext(STUDENT_UID).firestore();
    const voteId = `${STUDENT_UID}_suggestion1`;
    const voteRef = doc(db, 'votes', voteId);
    
    await assertSucceeds(setDoc(voteRef, {
      voteId: voteId,
      suggestionId: 'suggestion1',
      voterUid: STUDENT_UID,
      timestamp: serverTimestamp()
    }));
  });

  test('User cannot create vote with incorrect composite key', async () => {
    const db = testEnv.authenticatedContext(STUDENT_UID).firestore();
    const voteRef = doc(db, 'votes', 'invalid_key');
    
    await assertFails(setDoc(voteRef, {
      voteId: 'invalid_key',
      suggestionId: 'suggestion1',
      voterUid: STUDENT_UID,
      timestamp: serverTimestamp()
    }));
  });

  test('User cannot create vote for another user', async () => {
    const db = testEnv.authenticatedContext(STUDENT_UID).firestore();
    const voteId = `${OTHER_USER_UID}_suggestion1`;
    const voteRef = doc(db, 'votes', voteId);
    
    await assertFails(setDoc(voteRef, {
      voteId: voteId,
      suggestionId: 'suggestion1',
      voterUid: OTHER_USER_UID,
      timestamp: serverTimestamp()
    }));
  });

  test('User can delete their own vote', async () => {
    const db = testEnv.authenticatedContext(STUDENT_UID).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'votes', `${STUDENT_UID}_suggestion1`), {
        voteId: `${STUDENT_UID}_suggestion1`,
        suggestionId: 'suggestion1',
        voterUid: STUDENT_UID,
        timestamp: new Date()
      });
    });
    
    const voteRef = doc(db, 'votes', `${STUDENT_UID}_suggestion1`);
    await assertSucceeds(deleteDoc(voteRef));
  });

  test('User cannot delete another user vote', async () => {
    const db = testEnv.authenticatedContext(OTHER_USER_UID).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'votes', `${STUDENT_UID}_suggestion1`), {
        voteId: `${STUDENT_UID}_suggestion1`,
        suggestionId: 'suggestion1',
        voterUid: STUDENT_UID,
        timestamp: new Date()
      });
    });
    
    const voteRef = doc(db, 'votes', `${STUDENT_UID}_suggestion1`);
    await assertFails(deleteDoc(voteRef));
  });
});

describe('Comment Security Rules', () => {
  test('Anyone can read comments', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'suggestions/suggestion1/comments', 'comment1'), {
        commentId: 'comment1',
        suggestionId: 'suggestion1',
        authorUid: STUDENT_UID,
        authorDisplayName: 'Test Student',
        text: 'Test comment',
        createdAt: new Date()
      });
    });
    
    const commentRef = doc(db, 'suggestions/suggestion1/comments', 'comment1');
    await assertSucceeds(getDoc(commentRef));
  });

  test('User can create comment with their own UID', async () => {
    const db = testEnv.authenticatedContext(STUDENT_UID).firestore();
    const commentRef = doc(db, 'suggestions/suggestion1/comments', 'comment1');
    
    await assertSucceeds(setDoc(commentRef, {
      commentId: 'comment1',
      suggestionId: 'suggestion1',
      authorUid: STUDENT_UID,
      authorDisplayName: 'Test Student',
      text: 'Test comment',
      createdAt: serverTimestamp()
    }));
  });

  test('User cannot create comment with another user UID', async () => {
    const db = testEnv.authenticatedContext(STUDENT_UID).firestore();
    const commentRef = doc(db, 'suggestions/suggestion1/comments', 'comment1');
    
    await assertFails(setDoc(commentRef, {
      commentId: 'comment1',
      suggestionId: 'suggestion1',
      authorUid: OTHER_USER_UID,
      authorDisplayName: 'Other User',
      text: 'Test comment',
      createdAt: serverTimestamp()
    }));
  });

  test('Author can delete their own comment', async () => {
    const db = testEnv.authenticatedContext(STUDENT_UID).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'suggestions/suggestion1/comments', 'comment1'), {
        commentId: 'comment1',
        suggestionId: 'suggestion1',
        authorUid: STUDENT_UID,
        authorDisplayName: 'Test Student',
        text: 'Test comment',
        createdAt: new Date()
      });
    });
    
    const commentRef = doc(db, 'suggestions/suggestion1/comments', 'comment1');
    await assertSucceeds(deleteDoc(commentRef));
  });

  test('Non-author cannot delete comment', async () => {
    const db = testEnv.authenticatedContext(OTHER_USER_UID).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'suggestions/suggestion1/comments', 'comment1'), {
        commentId: 'comment1',
        suggestionId: 'suggestion1',
        authorUid: STUDENT_UID,
        authorDisplayName: 'Test Student',
        text: 'Test comment',
        createdAt: new Date()
      });
    });
    
    const commentRef = doc(db, 'suggestions/suggestion1/comments', 'comment1');
    await assertFails(deleteDoc(commentRef));
  });

  test('Admin can delete any comment', async () => {
    const db = testEnv.authenticatedContext(ADMIN_UID).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'suggestions/suggestion1/comments', 'comment1'), {
        commentId: 'comment1',
        suggestionId: 'suggestion1',
        authorUid: STUDENT_UID,
        authorDisplayName: 'Test Student',
        text: 'Test comment',
        createdAt: new Date()
      });
      await setDoc(doc(context.firestore(), 'roles_admin', ADMIN_UID), {
        uid: ADMIN_UID
      });
    });
    
    const commentRef = doc(db, 'suggestions/suggestion1/comments', 'comment1');
    await assertSucceeds(deleteDoc(commentRef));
  });
});

describe('Admin Roles Security Rules', () => {
  test('Anyone can read admin roles', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'roles_admin', ADMIN_UID), {
        uid: ADMIN_UID
      });
    });
    
    const roleRef = doc(db, 'roles_admin', ADMIN_UID);
    await assertSucceeds(getDoc(roleRef));
  });

  test('No one can write to admin roles', async () => {
    const db = testEnv.authenticatedContext(ADMIN_UID).firestore();
    const roleRef = doc(db, 'roles_admin', ADMIN_UID);
    
    await assertFails(setDoc(roleRef, { uid: ADMIN_UID }));
  });
});
