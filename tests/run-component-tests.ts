// Test runner for reusable components

import { runPageHeaderTests } from './PageHeader.test';
import { runFormActionsTests } from './FormActions.test';
import { runTableTests } from './Table.test';
import { runListTests } from './List.test';
import { runFlexContainerTests } from './FlexContainer.test';
import { runInputTests } from './Input.test';
import { runIconButtonTests } from './IconButton.test';

console.log('Starting component tests...\n');

// Run PageHeader tests
try {
  runPageHeaderTests();
  console.log('\n✅ PageHeader tests passed!\n');
} catch (error) {
  console.error('❌ PageHeader tests failed:', error);
  process.exit(1);
}

// Run FormActions tests
try {
  runFormActionsTests();
  console.log('\n✅ FormActions tests passed!\n');
} catch (error) {
  console.error('❌ FormActions tests failed:', error);
  process.exit(1);
}

// Run Table tests
try {
  runTableTests();
  console.log('\n✅ Table tests passed!\n');
} catch (error) {
  console.error('❌ Table tests failed:', error);
  process.exit(1);
}

// Run List tests
try {
  runListTests();
  console.log('\n✅ List tests passed!\n');
} catch (error) {
  console.error('❌ List tests failed:', error);
  process.exit(1);
}

// Run FlexContainer tests
try {
  runFlexContainerTests();
  console.log('\n✅ FlexContainer tests passed!\n');
} catch (error) {
  console.error('❌ FlexContainer tests failed:', error);
  process.exit(1);
}

// Run Input tests
try {
  runInputTests();
  console.log('\n✅ Input tests passed!\n');
} catch (error) {
  console.error('❌ Input tests failed:', error);
  process.exit(1);
}

// Run IconButton tests
try {
  runIconButtonTests();
  console.log('\n✅ IconButton tests passed!\n');
} catch (error) {
  console.error('❌ IconButton tests failed:', error);
  process.exit(1);
}

console.log('🎉 All component tests passed!');