// Test runner for custom hooks

import { runUseNavigationTests } from './useNavigation.test';
import { runUseFormHandlerTests } from './useFormHandler.test';

console.log('Starting hook tests...\n');

// Run useNavigation tests
try {
  runUseNavigationTests();
  console.log('\n✅ useNavigation tests passed!\n');
} catch (error) {
  console.error('❌ useNavigation tests failed:', error);
  process.exit(1);
}

// Run useFormHandler tests
try {
  runUseFormHandlerTests();
  console.log('\n✅ useFormHandler tests passed!\n');
} catch (error) {
  console.error('❌ useFormHandler tests failed:', error);
  process.exit(1);
}

console.log('🎉 All hook tests passed!');