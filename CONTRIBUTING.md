# Contributing to SuperSuper

This document outlines guidelines for contributing to SuperSuper, with a focus on UI development and testing practices.

## UI Testing Guidelines

When making UI changes, follow these guidelines to ensure quality and prevent regressions:

### Manual Testing Checklist

Before submitting UI changes, perform the following manual tests:

#### 1. Page Load and Transitions
- [ ] Wait on each page for at least 10-15 seconds after initial load
- [ ] Watch for any components that appear/disappear unexpectedly
- [ ] Check for layout shifts or flickering elements
- [ ] Verify all loading states transition smoothly to loaded states
- [ ] Test navigation between all pages to ensure transitions work correctly

#### 2. Scrolling Behavior
- [ ] Scroll to the very bottom of each page
- [ ] Verify all content is visible and not clipped by fixed elements (bottom navigation, floating buttons)
- [ ] Scroll to the very top and verify header content is fully visible
- [ ] Test scroll behavior with varying amounts of content (empty state, few items, many items)
- [ ] Check that fixed elements (navigation bars, floating action buttons) don't obstruct content

#### 3. Content Scaling
- [ ] Test with minimal content (empty states)
- [ ] Test with a moderate amount of content
- [ ] Test with many items (10+ list items, table rows, etc.)
- [ ] Verify the UI handles all content volumes gracefully
- [ ] Check for overflow issues or unexpected wrapping

#### 4. Responsive Design
- [ ] Test on mobile viewport sizes (375px width typical)
- [ ] Test on tablet viewport sizes
- [ ] Test on desktop viewport sizes
- [ ] Verify touch targets are appropriately sized on mobile (minimum 44x44px recommended)

#### 5. Interactive Elements
- [ ] Test all buttons and clickable elements
- [ ] Verify form inputs work correctly (including password visibility toggles)
- [ ] Check that disabled states are properly displayed
- [ ] Test keyboard navigation where applicable

### Common UI Issues to Watch For

1. **Blank sections appearing after page load**: Often caused by conditional rendering or components that show/hide based on state changes
2. **Content clipped by fixed elements**: Ensure proper padding (`pb-20` or more) on scrollable containers to account for fixed bottom navigation
3. **Floating buttons obscuring content**: Add sufficient bottom padding to scrollable lists so content can scroll past floating elements
4. **Form field visibility**: Password fields should include show/hide toggles for user verification

### Testing Different States

Always test your UI changes with:
- Online and offline states
- Various network conditions
- Empty data states
- Error states
- Loading states

### Device Testing

When possible, test on:
- iOS Safari
- Android Chrome
- Desktop browsers (Chrome, Firefox, Safari)

## Code Style

Please refer to the project README and existing code for style guidelines. Key points:
- Use functional React components with hooks
- Use Tailwind CSS for styling
- Follow existing naming conventions
